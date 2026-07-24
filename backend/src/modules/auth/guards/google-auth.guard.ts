import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard, type IAuthModuleOptions } from '@nestjs/passport';

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

  // Force Google's account chooser on every sign-in. Without this, prompt
  // defaults to none, so a live Google session silently re-authenticates the
  // user instead of letting them pick an account after signing out.
  getAuthenticateOptions(): IAuthModuleOptions {
    return { prompt: 'select_account' };
  }
}
