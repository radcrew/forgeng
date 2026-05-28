import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  // At least one letter and one digit. Tweak as policy evolves.
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain a letter and a digit.',
  })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}
