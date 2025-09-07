import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting, User } from '@after-meet/database';
import { RecallController } from './recall.controller';
import { RecallService } from './recall.service';

/**
 * Recall.ai Integration Module
 * 
 * Handles AI bot management for meeting recording and transcription.
 * Core component for the "integrate with Recall.ai to get meeting transcripts" requirement.
 * 
 * Key Features:
 * - Bot lifecycle management (create, monitor, destroy)
 * - Real-time transcript processing via webhooks
 * - Meeting URL validation and bot scheduling
 * - Error handling and retry mechanisms
 * - Integration with Meetings module for status updates
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, User]),
    HttpModule.register({
      timeout: 30000, // 30 second timeout for Recall.ai API calls
      maxRedirects: 3,
    }),
  ],
  controllers: [RecallController],
  providers: [RecallService],
  exports: [RecallService], // Available to Jobs and Social modules
})
export class RecallModule {}
