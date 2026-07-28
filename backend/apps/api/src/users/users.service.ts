import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'app/database';
import { UserRole } from 'app/domain';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(email: string, passwordHash: string, name: string, role: UserRole = UserRole.USER): Promise<UserEntity> {
    return this.repo.save(this.repo.create({ email, passwordHash, name, role }));
  }

  /** Used by the admin broadcast endpoint to resolve "all users" — see docs/05-api-design.md. */
  findAllIds(): Promise<{ id: string }[]> {
    return this.repo.find({ select: { id: true } });
  }
}
