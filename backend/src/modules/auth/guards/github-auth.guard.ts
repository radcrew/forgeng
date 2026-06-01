import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { GitHubStrategy } from '../strategies/github.strategy';

@Injectable()
export class GitHubAuthGuard extends AuthGuard('github') {
  constructor(private readonly strategy: GitHubStrategy) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!this.strategy.isEnabled()) {
      throw new BadRequestException(
        'GitHub OAuth is not configured on this server.',
      );
    }
    return super.canActivate(context);
  }
}
