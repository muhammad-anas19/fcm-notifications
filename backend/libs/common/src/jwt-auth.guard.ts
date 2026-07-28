import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Thin wrapper so controllers depend on `app/common`, not on passport directly. The actual
 * 'jwt' strategy is registered in apps/api's AuthModule (docs/03: it needs UsersService, which
 * this framework-agnostic-ish lib intentionally doesn't depend on). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
