import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Roles } from '../../core/auth/roles.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateSlackInviteDto } from './dto/update-slack-invite.dto';
import {
  SettingsService,
  type SettingsDto,
  type SlackInviteDto,
} from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  get(): Promise<SettingsDto> {
    return this.service.get();
  }

  @Roles('admin')
  @Patch()
  update(@Body() dto: UpdateSettingsDto): Promise<SettingsDto> {
    return this.service.update(dto);
  }

  // Not applicants: only accepted students join the Slack workspace.
  @Roles('student', 'admin')
  @Get('slack-invite')
  getSlackInvite(): Promise<SlackInviteDto> {
    return this.service.getSlackInvite();
  }

  @Roles('admin')
  @Patch('slack-invite')
  updateSlackInvite(
    @Body() dto: UpdateSlackInviteDto,
  ): Promise<SlackInviteDto> {
    return this.service.updateSlackInvite(dto.slackInviteUrl);
  }
}
