import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationCategory } from 'app/domain';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

/** The shared payload shape for send / send-bulk / broadcast — see docs/05-api-design.md:
 * they differ only in how the target userIds[] is resolved, never in the payload itself. */
export class DispatchNotificationDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiProperty({ enum: NotificationCategory })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
