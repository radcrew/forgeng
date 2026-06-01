import { IsString, MinLength } from 'class-validator';

export class VerifyEmailQuery {
  @IsString()
  @MinLength(16)
  token!: string;
}
