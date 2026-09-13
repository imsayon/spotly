import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentSessionId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().authSessionId as string,
);
