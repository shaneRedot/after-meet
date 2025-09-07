import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting, User, Account } from '@after-meet/database';
import { CalendarModule } from '../calendar/calendar.module';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

/**
 * Meetings Module
 * 
 * Handles meeting management and Recall.ai bot integration.
 * Core functionality for the "Post-meeting social media content generator".
 * 
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, User, Account]),
    CalendarModule, 
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService], // Available to Recall, Social, Jobs modules
})
export class MeetingsModule {}
