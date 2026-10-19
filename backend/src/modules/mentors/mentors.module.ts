import { Module } from '@nestjs/common';
import { MentorsController } from './mentors.controller';
import { MentorsService } from './mentors.service';

@Module({
  controllers: [MentorsController],
  providers: [MentorsService],
})
export class MentorsModule {}
