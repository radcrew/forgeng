import { Injectable, NotFoundException } from '@nestjs/common';
import { toUserDto, type UserDto } from '../../common/mappers';
import { PrismaService } from '../../core/database/prisma.service';
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
}
