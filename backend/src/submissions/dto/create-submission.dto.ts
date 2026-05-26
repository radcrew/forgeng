import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSubmissionDto {
  @IsInt()
  @Min(1)
  taskId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  content?: string;

  @IsOptional()
  @IsUrl()
  repoUrl?: string;
}
