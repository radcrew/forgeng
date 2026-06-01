import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import type { AppConfiguration } from '@config';
import { Public } from '@core/auth/public.decorator';
import type { AuthUser } from '@core/auth/auth.types';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { toUserDto, type UserDto } from '@common/mappers';
import { AuthService, type AuthResult } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailQuery } from './dto/verify-email.query';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { OAuthProfileDto } from './strategies/google.strategy';

interface OAuthRequest extends Request {
  user: OAuthProfileDto;
}

interface ClientTokens {
  accessToken: string;
  expiresIn: number;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<{ user: UserDto }> {
    return this.service.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserDto } & ClientTokens> {
    const result = await this.service.login(dto, ctxFromRequest(req));
    return this.respondWithSession(res, result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserDto } & ClientTokens> {
    const token = this.readRefreshCookie(req);
    if (!token) throw new BadRequestException('Missing refresh token.');
    const result = await this.service.refresh(token, ctxFromRequest(req));
    return this.respondWithSession(res, result);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const token = this.readRefreshCookie(req);
    await this.service.logout(token);
    this.clearRefreshCookie(res);
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query() query: VerifyEmailQuery): Promise<{
    user: UserDto;
  }> {
    const user = await this.service.verifyEmail(query.token);
    return { user };
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<void> {
    await this.service.resendVerification(dto.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.service.requestPasswordReset(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.service.resetPassword(dto.token, dto.password);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): UserDto {
    return toUserDto(user);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleStart(): void {
    // GoogleAuthGuard issues the redirect to Google.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: OAuthRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.finishOAuth(req, res);
  }

  @Public()
  @Get('github')
  @UseGuards(GitHubAuthGuard)
  githubStart(): void {
    // GitHubAuthGuard issues the redirect to GitHub.
  }

  @Public()
  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  async githubCallback(
    @Req() req: OAuthRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.finishOAuth(req, res);
  }

  private async finishOAuth(req: OAuthRequest, res: Response): Promise<void> {
    try {
      const result = await this.service.signInWithOAuth(
        req.user,
        ctxFromRequest(req),
      );
      this.setRefreshCookie(
        res,
        result.tokens.refreshToken,
        result.tokens.refreshExpiresAt,
      );
      const target = new URL(
        this.config.getOrThrow('auth.oauthSuccessRedirect', { infer: true }),
      );
      target.searchParams.set('accessToken', result.tokens.accessToken);
      target.searchParams.set(
        'expiresIn',
        String(result.tokens.accessExpiresIn),
      );
      res.redirect(target.toString());
    } catch {
      const failureUrl = this.config.getOrThrow('auth.oauthFailureRedirect', {
        infer: true,
      });
      res.redirect(failureUrl);
    }
  }

  private respondWithSession(
    res: Response,
    result: AuthResult,
  ): { user: UserDto } & ClientTokens {
    this.setRefreshCookie(
      res,
      result.tokens.refreshToken,
      result.tokens.refreshExpiresAt,
    );
    return {
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.accessExpiresIn,
    };
  }

  private setRefreshCookie(
    res: Response,
    token: string,
    expiresAt: Date,
  ): void {
    const cookieName = this.config.getOrThrow('auth.refreshCookieName', {
      infer: true,
    });
    const domain = this.config.get('auth.refreshCookieDomain', { infer: true });
    const isProd =
      this.config.getOrThrow('nodeEnv', { infer: true }) === 'production';
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      domain: domain ?? undefined,
      path: '/api/auth',
      expires: expiresAt,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const cookieName = this.config.getOrThrow('auth.refreshCookieName', {
      infer: true,
    });
    res.clearCookie(cookieName, { path: '/api/auth' });
  }

  private readRefreshCookie(req: Request): string | undefined {
    const cookieName = this.config.getOrThrow('auth.refreshCookieName', {
      infer: true,
    });
    const raw: unknown = (req as Request & { cookies?: unknown }).cookies;
    if (!raw || typeof raw !== 'object') {
      return undefined;
    }
    const value = (raw as Record<string, unknown>)[cookieName];
    return typeof value === 'string' ? value : undefined;
  }
}

function ctxFromRequest(req: Request): { userAgent?: string; ip?: string } {
  const ua = req.headers['user-agent'];
  return {
    userAgent: typeof ua === 'string' ? ua.slice(0, 255) : undefined,
    ip: req.ip,
  };
}
