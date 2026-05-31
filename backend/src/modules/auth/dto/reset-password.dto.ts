import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  // At least one letter and one digit. Mirrors RegisterDto.
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain a letter and a digit.',
  })
  password!: string;
}
