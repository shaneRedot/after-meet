import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialPost, Meeting, Account, User } from '@after-meet/database';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { LinkedInService } from './services/linkedin.service';
import { FacebookService } from './services/facebook.service';

/**
 * Social Media Module
 * 
 * Handles automated social media posting to LinkedIn and Facebook.
 * Core component for "automatically post to LinkedIn and Facebook" requirement.
 * 
 * Key Features:
 * - Platform-specific posting (LinkedIn, Facebook)
 * - Content formatting and optimization per platform
 * - Post scheduling and status tracking
 * - Draft management and user approval workflow
 * - Integration with AI content generation
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SocialPost, Meeting, Account, User]),
    HttpModule.register({
      timeout: 15000, // 15 second timeout for social media APIs
      maxRedirects: 3,
    }),
  ],
  controllers: [SocialController],
  providers: [SocialService, LinkedInService, FacebookService],
  exports: [SocialService], // Available to Automation and Jobs modules
})
export class SocialModule {}
