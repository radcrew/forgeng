import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ListTasksQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cohortId?: number;
}
