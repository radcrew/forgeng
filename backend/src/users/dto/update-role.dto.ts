import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateRoleDto {
  @IsEnum(Role)
  role!: Role;
}
