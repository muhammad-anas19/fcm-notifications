import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IMPLEMENTED_CHANNELS, NotificationCategory, NotificationChannel } from 'app/domain';
import { Repository } from 'typeorm';
import { NotificationPreferenceEntity } from './entities';

/**
 * Shared by apps/api (the full read/write preferences surface) and the router worker (which
 * only needs "which channels are enabled for this user+category", see
 * docs/08-notification-flow.md). Kept here rather than duplicated in both apps, since it's the
 * one place the "default to enabled unless explicitly opted out" rule should live.
 */
@Injectable()
export class PreferencesQueryService {
  constructor(
    @InjectRepository(NotificationPreferenceEntity)
    private readonly repo: Repository<NotificationPreferenceEntity>,
  ) {}

  async getEnabledChannels(userId: string, category: NotificationCategory): Promise<NotificationChannel[]> {
    const rows = await this.repo.find({ where: { userId, category } });
    const explicitlyDisabled = new Set(rows.filter((r) => !r.enabled).map((r) => r.channel));
    return IMPLEMENTED_CHANNELS.filter((channel) => !explicitlyDisabled.has(channel));
  }
}
