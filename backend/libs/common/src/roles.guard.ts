import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'app/domain';
import { ROLES_KEY } from './roles.decorator';

/**
 * Enforces @Roles(...) server-side, on the authenticated user attached by JwtAuthGuard —
 * never on anything the client sends. See docs/11-security.md: "logged in" and "authorized
 * for this specific action" are two different checks, and this guard is the second one.
 * Must run after JwtAuthGuard (both guards are applied in that order in each controller).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
