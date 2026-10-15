import { IsIn } from 'class-validator';
import { VIDEO_CONTENT_TYPES, type VideoContentType } from '../video.service';

export class CreateVideoUploadDto {
  @IsIn(VIDEO_CONTENT_TYPES)
  contentType!: VideoContentType;
}
