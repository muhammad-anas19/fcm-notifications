import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { DispatchNotificationDto } from '../../notifications/dto/dispatch-notification.dto';

export class SendBulkDto extends DispatchNotificationDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  userIds: string[];
}
