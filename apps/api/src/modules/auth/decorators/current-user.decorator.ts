import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DecodedUser } from '../auth.service';

/**
 * Extracts the current authenticated user from the request.
 * Usage: @CurrentUser() user: DecodedUser
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DecodedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
