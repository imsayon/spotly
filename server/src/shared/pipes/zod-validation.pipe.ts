import { PipeTransform, ArgumentMetadata, BadRequestException, Injectable } from "@nestjs/common"
import { ZodSchema } from "zod"

@Injectable()
export class ZodValidationPipe implements PipeTransform {
	constructor(private readonly schema?: ZodSchema) {}

	transform(value: unknown, metadata: ArgumentMetadata) {
		if (!this.schema || metadata.type !== "body") {
			return value
		}

		const result = this.schema.safeParse(value)
		if (!result.success) {
			throw new BadRequestException({
				message: "Validation failed",
				details: result.error.errors.map((e) => ({
					field: e.path.join("."),
					message: e.message,
				})),
			})
		}
		return result.data
	}
}
