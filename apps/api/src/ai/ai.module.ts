import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Meeting, SocialPost, User } from '@after-meet/database';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { OpenAIService } from './services/openai.service';
import { ContentGenerationService } from './services/content-generation.service';
import { SocialModule } from '../social/social.module';

/**
 * AI Automation Module
 * 
 * Handles intelligent content generation and automation workflows.
 * Core component for advanced AI-powered features and content optimization.
 * 
 * Key Features:
 * - OpenAI GPT-4 integration for content generation
 * - Meeting transcript analysis and insight extraction
 * - Platform-specific content optimization
 * - Automated content suggestions and improvements
 * - Background job automation for content processing
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, SocialPost, User]),
    HttpModule.register({
      timeout: 60000, // Long timeout for AI processing
      maxRedirects: 3,
    }),
    ConfigModule,
    SocialModule, // Access to social posting services
  ],
  controllers: [AIController],
  providers: [AIService, OpenAIService, ContentGenerationService],
  exports: [AIService, ContentGenerationService], // Available to Jobs and Social modules
})
export class AIModule {}
