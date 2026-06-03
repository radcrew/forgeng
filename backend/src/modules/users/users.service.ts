import { Injectable, NotFoundException } from '@nestjs/common';
import {
  toCohortDto,
  toUserDto,
  type ProfileEnrollmentDto,
  type UserDto,
} from '@common/mappers';
import { PrismaService } from '@core/database/prisma.service';
import { ListUsersQuery } from './dto/list-users.query';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQuery): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({
      where: query.role ? { role: query.role } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return users.map(toUserDto);
  }

  async updateRole(id: number, dto: UpdateRoleDto): Promise<UserDto> {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User not found.');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });
    return toUserDto(updated);
  }

  /** A user's enrollment history (cohorts joined), newest first — for the admin profile view. */
  async enrollments(userId: number): Promise<ProfileEnrollmentDto[]> {
    const exists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!exists) throw new NotFoundException('User not found.');

    const items = await this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        cohort: { include: { _count: { select: { enrollments: true } } } },
      },
    });

    return items.map((e) => ({
      id: e.id,
      enrolledAt: e.enrolledAt.toISOString(),
      cohort: toCohortDto(e.cohort, e.cohort._count.enrollments),
    }));
  }
}
