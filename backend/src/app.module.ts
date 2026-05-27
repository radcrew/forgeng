import { Module } from '@nestjs/common';

import { AppConfigModule } from './config';
import { CoreModule } from './core/core.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AccountModule } from './modules/account/account.module';
import { CohortsModule } from './modules/cohorts/cohorts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { HealthModule } from './modules/health/health.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    CoreModule,
    HealthModule,
    AccountModule,
    ApplicationsModule,
    CohortsModule,
    TasksModule,
    SubmissionsModule,
    FeedbackModule,
    UsersModule,
    DashboardModule,
  ],
})
export class AppModule {}
