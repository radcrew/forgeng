import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

import { IsPassword } from '../decorators/is-password.decorator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsPassword()
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}
