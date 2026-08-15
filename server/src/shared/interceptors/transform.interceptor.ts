import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from "@nestjs/common"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"
import { RequestWithId } from "../middleware/request-id.middleware"

export interface ResponseEnvelope<T> {
	data: T
	meta: {
		requestId: string
		timestamp: string
	}
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
	T,
	ResponseEnvelope<T>
> {
	intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<ResponseEnvelope<T>> {
		const req = context.switchToHttp().getRequest<RequestWithId>()
		const requestId = req?.id || "unknown"

		return next.handle().pipe(
			map((data) => ({
				data,
				meta: {
					requestId,
					timestamp: new Date().toISOString(),
				},
			})),
		)
	}
}
