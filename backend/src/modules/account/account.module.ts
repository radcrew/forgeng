import { Module } from '@nestjs/common';

import { AccountController } from './account.controller';
import { AvatarService } from './avatar.service';

@Module({
  controllers: [AccountController],
  providers: [AvatarService],
})
export class AccountModule {}
