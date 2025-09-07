import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { User, Account } from '@after-meet/database';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Authentication Module
 * 
 * Handles OAuth authentication for multiple providers:
 * - Google: Primary authentication + calendar access
 * - LinkedIn: Social media posting
 * - Facebook: Social media posting
 * 
 * Key Features:
 * - Multiple OAuth providers per user
 * - JWT token management
 * - Account linking and unlinking
 * - Test user support (webshookeng@gmail.com)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '24h', // Access token expiry
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    LinkedInStrategy,
    FacebookStrategy,
    JwtStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
