import {
	Injectable,
	Logger,
	UnauthorizedException,
	OnModuleInit,
} from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { PrismaService } from "../../prisma/prisma.service"

export interface DecodedUser {
	uid: string
	email?: string
	name?: string
}

@Injectable()
export class AuthService implements OnModuleInit {
	private supabase!: SupabaseClient
	private readonly logger = new Logger(AuthService.name)
	private readonly userCache = new Map<
		string,
		{ user: DecodedUser; expiresAt: number }
	>()
	private readonly CACHE_TTL_MS = 5 * 60 * 1000

	constructor(private readonly prisma: PrismaService) {}

	onModuleInit() {
		// Initialize Supabase
		const url =
			process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
		const key =
			process.env.SUPABASE_ANON_KEY ||
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

		if (!url || !key) {
			this.logger.error(
				"Supabase config missing. Token verification will fail.",
			)
		} else {
			this.supabase = createClient(url, key)
			this.logger.log("Supabase Auth initialized successfully.")
		}
	}

	async verifyToken(token: string): Promise<DecodedUser> {
		try {
			// ALWAYS verify with Supabase first — never trust unverified JWT claims.
			// Previously, jwt.decode() (no signature check) was used for cache lookup
			// before verification, allowing forged JWTs to bypass auth via cache hits.
			const {
				data: { user },
				error,
			} = await this.supabase.auth.getUser(token)
			if (error || !user) {
				throw new Error(error?.message || "No user found")
			}

			const userId = user.id

			// Check cache AFTER successful verification, keyed on verified user ID
			const cached = this.userCache.get(userId)
			if (cached && cached.expiresAt > Date.now()) return cached.user
			if (cached) this.userCache.delete(userId)

			const userEmail = user.email
			const userPhone = user.phone
			const userName =
				user.user_metadata?.full_name ||
				user.email?.split("@")[0] ||
				user.phone

			// Auto-Sync User to database
			// Use findUnique first, then create only if not exists.
			// This avoids the unique constraint error on `email` when multiple Supabase
			// accounts share the same email or when a stale record exists.
			let dbUser = await this.prisma.user.findUnique({
				where: { id: userId },
			})

			if (!dbUser) {
				// Check if a user with this email already exists (from a different auth provider)
				if (userEmail) {
					dbUser = await this.prisma.user.findUnique({
						where: { email: userEmail },
					})
				}

				if (!dbUser) {
					try {
						// Truly new user — create
						dbUser = await this.prisma.user.create({
							data: {
								id: userId,
								name: userName,
								email: userEmail,
								phone: userPhone,
							},
						})
						this.logger.log(`New user created: ${dbUser.id}`)
					} catch (createErr: any) {
						// If another concurrent request just created the user, we will hit a unique constraint error (P2002)
						if (createErr.code === "P2002") {
							dbUser = await this.prisma.user.findUnique({
								where: { id: userId },
							})
							if (!dbUser && userEmail) {
								dbUser = await this.prisma.user.findUnique({
									where: { email: userEmail },
								})
							}
							if (!dbUser) {
								throw new Error(
									"User creation failed due to unique constraint, but could not retrieve the created user.",
								)
							}
						} else {
							throw createErr
						}
					}
				} else if (dbUser.id !== userId) {
					const legacyUser = dbUser
					const legacyUserId = legacyUser.id
					this.logger.warn(
						`Migrating user ${legacyUserId} to auth provider ID ${userId} for email ${userEmail}.`,
					)
					dbUser = await this.prisma.$transaction(async (tx) => {
						await tx.merchant.updateMany({
							where: { ownerId: legacyUserId },
							data: { ownerId: userId },
						})
						await tx.queueEntry.updateMany({
							where: { userId: legacyUserId },
							data: { userId },
						})
						await tx.review.updateMany({
							where: { userId: legacyUserId },
							data: { userId },
						})
						await tx.favorite.updateMany({
							where: { userId: legacyUserId },
							data: { userId },
						})
						return tx.user.update({
							where: { id: legacyUserId },
							data: {
								id: userId,
								name: userName ?? legacyUser.name,
								email: userEmail ?? legacyUser.email,
								phone: userPhone ?? legacyUser.phone,
							},
						})
					})
				}
			}

			const result = {
				uid: dbUser.id,
				email: dbUser.email || undefined,
				name: dbUser.name || undefined,
			}
			this.userCache.set(userId, {
				user: result,
				expiresAt: Date.now() + this.CACHE_TTL_MS,
			})
			return result
		} catch (err: any) {
			this.logger.error("Token Verification Error:", err?.message || err)
			throw new UnauthorizedException("Invalid or expired token")
		}
	}

	@Cron(CronExpression.EVERY_30_MINUTES)
	private pruneCache(): void {
		const now = Date.now()
		for (const [key, value] of this.userCache.entries()) {
			if (value.expiresAt <= now) this.userCache.delete(key)
		}
	}

	get isFunctional(): boolean {
		return !!this.supabase
	}
}
