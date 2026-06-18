import { Module } from '@nestjs/common';

import { AppConfigModule } from '@config';
import { CoreModule } from '@core/core.module';
import { AccountModule } from '@modules/account/account.module';
import { ApplicationsModule } from '@modules/applications/applications.module';
import { AuthModule } from '@modules/auth/auth.module';
import { CohortsModule } from '@modules/cohorts/cohorts.module';
import { DashboardModule } from '@modules/dashboard/dashboard.module';
import { FeedbackModule } from '@modules/feedback/feedback.module';
import { HealthModule } from '@modules/health/health.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { SubmissionsModule } from '@modules/submissions/submissions.module';
import { TasksModule } from '@modules/tasks/tasks.module';
import { UsersModule } from '@modules/users/users.module';
import { SettingsModule } from '@modules/settings/settings.module';

@Module({
  imports: [
    AppConfigModule,
    CoreModule,
    AuthModule,
    HealthModule,
    AccountModule,
    ApplicationsModule,
    CohortsModule,
    TasksModule,
    SubmissionsModule,
    FeedbackModule,
    UsersModule,
    DashboardModule,
    NotificationsModule,
    SettingsModule,
  ],
})
export class AppModule {}
