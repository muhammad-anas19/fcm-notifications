import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DevicePlatform } from 'app/domain';
import { Repository } from 'typeorm';
import { DeviceTokenEntity } from './entities';

/** Shared by apps/api (register/list/revoke, behind auth) and the push worker (which only
 * needs the active tokens for a user, plus deactivating one FCM reports as invalid — see
 * docs/07-fcm-complete-guide.md). Same reasoning as PreferencesQueryService: one shared home
 * for the query logic instead of duplicating it in two apps. */
@Injectable()
export class DeviceTokensQueryService {
  constructor(@InjectRepository(DeviceTokenEntity) private readonly repo: Repository<DeviceTokenEntity>) {}

  /** Upsert on the token itself: a device reinstalling the app or logging in as a different
   * user gets a new/rotated FCM token, but if the *same* token reappears (re-registration on
   * app open), we just reattach it to whoever is currently authenticated and reactivate it. */
  async register(userId: string, fcmToken: string, platform: DevicePlatform): Promise<DeviceTokenEntity> {
    const existing = await this.repo.findOne({ where: { fcmToken } });
    if (existing) {
      existing.userId = userId;
      existing.platform = platform;
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ userId, fcmToken, platform, isActive: true, lastUsedAt: new Date() }));
  }

  /** Active tokens for a user — what the push worker actually sends to, and what
   * GET /device-tokens returns. */
  listActiveForUser(userId: string): Promise<DeviceTokenEntity[]> {
    return this.repo.find({ where: { userId, isActive: true } });
  }

  async revoke(userId: string, id: string): Promise<void> {
    const token = await this.repo.findOne({ where: { id } });
    if (!token) throw new NotFoundException('Device token not found');
    if (token.userId !== userId) throw new ForbiddenException();
    await this.repo.remove(token);
  }

  /** Called by the push worker when FCM reports a token as unregistered/invalid. Deactivating
   * (not deleting) keeps delivery-log history intact for the token that was actually used. */
  async deactivate(fcmToken: string): Promise<void> {
    await this.repo.update({ fcmToken }, { isActive: false });
  }
}
