import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Roles } from '@core/auth/roles.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService, type SettingsDto } from './settings.service';

@ApiTags('settings')
@Roles('admin')
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  get(): Promise<SettingsDto> {
    return this.service.get();
  }

  @Patch()
  update(@Body() dto: UpdateSettingsDto): Promise<SettingsDto> {
    return this.service.update(dto);
  }
}
