import { IsInt, Min } from 'class-validator';

export class EnrollDto {
  @IsInt()
  @Min(1)
  userId!: number;
}
