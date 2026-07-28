import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

const BCRYPT_ROUNDS = 10;

/** Deliberately minimal — see docs/11-security.md: no refresh tokens, no OAuth, no email
 * verification. Auth exists here only so notifications have someone to belong to; it is not
 * the point of this project. */
@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) {}

  async signup(dto: SignupDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create(dto.email, passwordHash, dto.name);
    return this.issueToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');

    return this.issueToken(user.id, user.email, user.role);
  }

  private issueToken(userId: string, email: string, role: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email, role });
    return { accessToken };
  }
}
