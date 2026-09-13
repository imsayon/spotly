import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
} from "@nestjs/common"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { ConfigService } from "@nestjs/config"
import { createHash } from "node:crypto"

function sessionIdFromToken(token: string) {
	try {
		const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { session_id?: unknown }
		if (typeof payload.session_id === "string" && payload.session_id) return payload.session_id
	} catch {
		// A verified Supabase token without a session claim still gets a non-reversible binding.
	}
	return createHash("sha256").update(token).digest("hex")
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
	private supabaseClient: SupabaseClient | null = null

	constructor(private readonly configService: ConfigService) {}

	private getSupabaseClient(): SupabaseClient {
		if (this.supabaseClient) return this.supabaseClient

		const supabaseUrl =
			this.configService.get<string>("SUPABASE_URL") ||
			this.configService.get<string>("NEXT_PUBLIC_SUPABASE_URL")
		const supabaseAnonKey =
			this.configService.get<string>("SUPABASE_ANON_KEY") ||
			this.configService.get<string>("NEXT_PUBLIC_SUPABASE_ANON_KEY")

		if (!supabaseUrl || !supabaseAnonKey) {
			throw new UnauthorizedException("Supabase authentication is not configured")
		}

		this.supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
		return this.supabaseClient
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()
		const authHeader = request.headers.authorization

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			throw new UnauthorizedException(
				"Missing or invalid Authorization header",
			)
		}

		const token = authHeader.split(" ")[1]

		try {
			const supabase = this.getSupabaseClient()
			const {
				data: { user },
				error,
			} = await supabase.auth.getUser(token)

			if (error || !user) {
				throw new UnauthorizedException("Invalid token")
			}

			request.user = user
			request.authSessionId = sessionIdFromToken(token)
			return true
		} catch (err) {
			if (err instanceof UnauthorizedException) throw err
			throw new UnauthorizedException("Authentication failed")
		}
	}
}
