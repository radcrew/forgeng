import { IsString, MinLength } from 'class-validator';

import { IsPassword } from '../decorators/is-password.decorator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsPassword()
  password!: string;
}
