import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import type { AppConfiguration } from '@config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './services/email.service';
import { GeoService } from './services/geo.service';
import { IpReputationService } from './services/ip-reputation.service';
import { PasswordService } from './services/password.service';
import { RegionRestrictionService } from './services/region-restriction.service';
import { TokenService } from './services/token.service';
import { VerificationService } from './services/verification.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration, true>) => ({
        secret: config.getOrThrow('auth.accessSecret', { infer: true }),
        signOptions: {
          expiresIn: config.getOrThrow('auth.accessTtl', { infer: true }),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    GeoService,
    IpReputationService,
    PasswordService,
    RegionRestrictionService,
    TokenService,
    VerificationService,
    EmailService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
