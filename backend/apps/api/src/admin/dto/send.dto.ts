import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { DispatchNotificationDto } from '../../notifications/dto/dispatch-notification.dto';

export class SendDto extends DispatchNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId: string;
}
