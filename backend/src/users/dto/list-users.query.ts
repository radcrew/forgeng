import { Role } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListUsersQuery {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
