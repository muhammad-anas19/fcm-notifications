import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

/** Pulls the JWT-derived user off the request — the only source of "who is making this call"
 * a handler should ever trust (docs/11-security.md: never a client-supplied id in the body). */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
