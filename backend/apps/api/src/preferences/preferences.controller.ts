import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthenticatedUser, CurrentUser, JwtAuthGuard } from 'app/common';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { PreferencesService } from './preferences.service';

@ApiTags('preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.preferencesService.getForUser(user.userId);
  }

  @Patch()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePreferencesDto) {
    return this.preferencesService.update(user.userId, dto);
  }
}
