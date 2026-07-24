import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
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
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import type { AppConfiguration } from '@config';
import { AUTH_THROTTLE } from './auth.constants';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<{ user: UserDto }> {
    return this.service.register(dto, ctxFromRequest(req));
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserDto }> {
    const result = await this.service.login(dto, ctxFromRequest(req));
    return this.respondWithSession(res, result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserDto }> {
    const token = this.readRefreshCookie(req);
    if (!token) throw new BadRequestException('Missing refresh token.');
    try {
      const result = await this.service.refresh(token, ctxFromRequest(req));
      return this.respondWithSession(res, result);
    } catch (err) {
      this.clearRefreshCookie(res);
      this.clearAccessCookie(res);
      throw err;
    }
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
    this.clearAccessCookie(res);
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
  @Throttle(AUTH_THROTTLE)
  @Post('resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<void> {
    await this.service.resendVerification(dto.email);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.service.requestPasswordReset(dto.email);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
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
      this.setAccessCookie(
        res,
        result.tokens.accessToken,
        result.tokens.accessExpiresIn,
      );
      const target = this.config.getOrThrow('auth.oauthSuccessRedirect', {
        infer: true,
      });
      res.redirect(this.withExchangeToken(target, result.tokens.accessToken));
    } catch (err) {
      const restrictionReason = this.accessRestrictionReason(err);
      if (restrictionReason) {
        const frontendUrl = this.config.getOrThrow('frontendUrl', {
          infer: true,
        });
        res.redirect(`${frontendUrl}/unavailable?reason=${restrictionReason}`);
        return;
      }
      const failureUrl = this.config.getOrThrow('auth.oauthFailureRedirect', {
        infer: true,
      });
      res.redirect(failureUrl);
    }
  }

  /**
   * The frontend's /api/auth/exchange bridge can't read the httpOnly cookie
   * we just set on this (backend) origin, so when the success redirect
   * points there it needs the access token passed explicitly to mint its
   * own same-site cookie. Every other target already got the cookie above,
   * so leave it untouched (no reason to put a live token in a URL/log).
   */
  private withExchangeToken(target: string, accessToken: string): string {
    const url = new URL(target);
    if (url.pathname.endsWith('/api/auth/exchange')) {
      url.searchParams.set('token', accessToken);
    }
    return url.toString();
  }

  private accessRestrictionReason(err: unknown): 'region' | 'vpn' | null {
    if (!(err instanceof ForbiddenException)) return null;
    const body = err.getResponse();
    const code =
      typeof body === 'object' && body !== null
        ? (body as { code?: string }).code
        : undefined;
    if (code === 'VPN_DETECTED') return 'vpn';
    if (code === 'REGION_BLOCKED') return 'region';
    return null;
  }

  private respondWithSession(
    res: Response,
    result: AuthResult,
  ): { user: UserDto } {
    this.setRefreshCookie(
      res,
      result.tokens.refreshToken,
      result.tokens.refreshExpiresAt,
    );
    this.setAccessCookie(
      res,
      result.tokens.accessToken,
      result.tokens.accessExpiresIn,
    );
    return { user: result.user };
  }

  /**
   * Shared attributes for the auth cookies. Both set and clear must use these
   * exact values or the browser refuses to overwrite/delete the cookie.
   *
   * In prod the frontend (Vercel) and API (Render) are different sites, so the
   * browser only sends these cookies on cross-site XHR when they're
   * SameSite=None. None requires Secure, which holds in prod. Dev is http and
   * same-site (localhost), so it stays Lax. Path "/" (not "/api/auth") lets the
   * frontend's proxy.ts receive the refresh cookie on page navigations.
   */
  private authCookieOptions(): {
    httpOnly: true;
    secure: boolean;
    sameSite: 'none' | 'lax';
    domain: string | undefined;
    path: '/';
  } {
    const domain = this.config.get('auth.refreshCookieDomain', { infer: true });
    const isProd =
      this.config.getOrThrow('nodeEnv', { infer: true }) === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      domain: domain ?? undefined,
      path: '/',
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
    res.cookie(cookieName, token, {
      ...this.authCookieOptions(),
      expires: expiresAt,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const cookieName = this.config.getOrThrow('auth.refreshCookieName', {
      infer: true,
    });
    res.clearCookie(cookieName, this.authCookieOptions());
  }

  private setAccessCookie(
    res: Response,
    token: string,
    expiresInSeconds: number,
  ): void {
    const cookieName = this.config.getOrThrow('auth.accessCookieName', {
      infer: true,
    });
    res.cookie(cookieName, token, {
      ...this.authCookieOptions(),
      expires: new Date(Date.now() + expiresInSeconds * 1000),
    });
  }

  private clearAccessCookie(res: Response): void {
    const cookieName = this.config.getOrThrow('auth.accessCookieName', {
      infer: true,
    });
    res.clearCookie(cookieName, this.authCookieOptions());
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
  // req.ip is set correctly by Express once `trust proxy` is configured in
  // main.ts. Do NOT read X-Forwarded-For manually — clients can inject fake
  // entries into that header when they can reach the server directly.
  return {
    userAgent: typeof ua === 'string' ? ua.slice(0, 255) : undefined,
    ip: req.ip,
  };
}
