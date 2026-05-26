import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApplicationsModule } from './applications/applications.module';
import { AuthFeatureModule } from './auth/auth.module';
import { CohortsModule } from './cohorts/cohorts.module';
import { AuthModule } from './common/auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FeedbackModule } from './feedback/feedback.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    HealthModule,
    AuthFeatureModule,
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
