import { ApplicationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListApplicationsQuery {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
