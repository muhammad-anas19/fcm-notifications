import { ApiProperty } from '@nestjs/swagger';
import { NotificationCategory, NotificationChannel } from 'app/domain';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, ValidateNested } from 'class-validator';

class PreferenceEntryDto {
  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ enum: NotificationCategory })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}

export class UpdatePreferencesDto {
  @ApiProperty({ type: [PreferenceEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreferenceEntryDto)
  preferences: PreferenceEntryDto[];
}
