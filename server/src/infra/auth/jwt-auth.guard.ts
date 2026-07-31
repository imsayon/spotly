import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
} from "@nestjs/common"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { ConfigService } from "@nestjs/config"

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
			return true
		} catch (err) {
			if (err instanceof UnauthorizedException) throw err
			throw new UnauthorizedException("Authentication failed")
		}
	}
}
