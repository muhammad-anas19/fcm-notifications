import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationPreferenceEntity } from 'app/database';
import { IMPLEMENTED_CHANNELS, NotificationCategory } from 'app/domain';
import { Repository } from 'typeorm';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

const CATEGORIES = Object.values(NotificationCategory);

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(NotificationPreferenceEntity)
    private readonly repo: Repository<NotificationPreferenceEntity>,
  ) {}

  /** Full channel x category matrix, defaulting to enabled=true for any combo without an
   * explicit row — opting out is the exception, not the rule. */
  async getForUser(userId: string) {
    const rows = await this.repo.find({ where: { userId } });
    const overrides = new Map(rows.map((r) => [`${r.channel}:${r.category}`, r.enabled]));

    return IMPLEMENTED_CHANNELS.flatMap((channel) =>
      CATEGORIES.map((category) => ({
        channel,
        category,
        enabled: overrides.get(`${channel}:${category}`) ?? true,
      })),
    );
  }

  async update(userId: string, dto: UpdatePreferencesDto) {
    for (const entry of dto.preferences) {
      const existing = await this.repo.findOne({
        where: { userId, channel: entry.channel, category: entry.category },
      });
      if (existing) {
        existing.enabled = entry.enabled;
        await this.repo.save(existing);
      } else {
        await this.repo.save(
          this.repo.create({ userId, channel: entry.channel, category: entry.category, enabled: entry.enabled }),
        );
      }
    }
    return this.getForUser(userId);
  }
}
