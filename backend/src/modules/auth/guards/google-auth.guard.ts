import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { GoogleStrategy } from '../strategies/google.strategy';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly strategy: GoogleStrategy) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!this.strategy.isEnabled()) {
      throw new BadRequestException(
        'Google OAuth is not configured on this server.',
      );
    }
    return super.canActivate(context);
  }
}
