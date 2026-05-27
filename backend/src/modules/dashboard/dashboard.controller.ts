import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { Roles } from '@core/auth/roles.decorator';
import type { AuthUser } from '@core/auth/auth.types';
import {
  DashboardService,
  type AdminDashboard,
  type StudentDashboard,
} from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Roles('student')
  @Get('student')
  student(@CurrentUser() user: AuthUser): Promise<StudentDashboard> {
    return this.service.student(user);
  }

  @Roles('admin')
  @Get('admin')
  admin(): Promise<AdminDashboard> {
    return this.service.admin();
  }
}
