import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthenticatedUser, CurrentUser, JwtAuthGuard } from 'app/common';
import { DeviceTokensQueryService } from 'app/database';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@ApiTags('device-tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('device-tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensQueryService) {}

  @Post()
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeviceTokenDto) {
    return this.deviceTokensService.register(user.userId, dto.fcmToken, dto.platform);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.deviceTokensService.listActiveForUser(user.userId);
  }

  @Delete(':id')
  revoke(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.deviceTokensService.revoke(user.userId, id);
  }
}
