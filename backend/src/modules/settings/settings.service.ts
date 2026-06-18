import { Injectable } from '@nestjs/common';
import type { PlatformSetting } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export interface SettingsDto {
  stipendMonth1: string;
  stipendMonth2: string;
  stipendMonth3: string;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<SettingsDto> {
    const row = await this.prisma.platformSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
    return this.serialize(row);
  }

  async update(dto: UpdateSettingsDto): Promise<SettingsDto> {
    const row = await this.prisma.platformSetting.upsert({
      where: { id: 1 },
      update: {
        ...(dto.stipendMonth1 != null && { stipendMonth1: dto.stipendMonth1 }),
        ...(dto.stipendMonth2 != null && { stipendMonth2: dto.stipendMonth2 }),
        ...(dto.stipendMonth3 != null && { stipendMonth3: dto.stipendMonth3 }),
      },
      create: {
        id: 1,
        stipendMonth1: dto.stipendMonth1 ?? 30,
        stipendMonth2: dto.stipendMonth2 ?? 50,
        stipendMonth3: dto.stipendMonth3 ?? 100,
      },
    });
    return this.serialize(row);
  }

  private serialize(row: PlatformSetting): SettingsDto {
    return {
      stipendMonth1: row.stipendMonth1.toString(),
      stipendMonth2: row.stipendMonth2.toString(),
      stipendMonth3: row.stipendMonth3.toString(),
    };
  }
}
