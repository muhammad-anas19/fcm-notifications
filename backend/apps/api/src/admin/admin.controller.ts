import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from 'app/common';
import { UserRole } from 'app/domain';
import { DispatchNotificationDto } from '../notifications/dto/dispatch-notification.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { SendBulkDto } from './dto/send-bulk.dto';
import { SendDto } from './dto/send.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/notifications')
export class AdminController {
  constructor(private readonly notificationsService: NotificationsService, private readonly usersService: UsersService) {}

  @Post('send')
  send(@Body() dto: SendDto) {
    const { userId, ...payload } = dto;
    return this.notificationsService.dispatch([userId], payload);
  }

  @Post('send-bulk')
  sendBulk(@Body() dto: SendBulkDto) {
    const { userIds, ...payload } = dto;
    return this.notificationsService.dispatch(userIds, payload);
  }

  @Post('broadcast')
  async broadcast(@Body() dto: DispatchNotificationDto) {
    const users = await this.usersService.findAllIds();
    return this.notificationsService.dispatch(
      users.map((u) => u.id),
      dto,
    );
  }
}
