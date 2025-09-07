import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { MeetingBotProcessor } from './processors/meeting-bot.processor';
import { ContentGenerationProcessor } from './processors/content-generation.processor';
import { SocialPostingProcessor } from './processors/social-posting.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { UsersModule } from '../users/users.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { RecallModule } from '../recall/recall.module';
import { AIModule } from '../ai/ai.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'meeting-bot' },
      { name: 'content-generation' },
      { name: 'social-posting' },
      { name: 'cleanup' }
    ),
    ScheduleModule.forRoot(),
    UsersModule,
    MeetingsModule,
    RecallModule,
    AIModule,
    SocialModule,
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    ScheduledTasksService,
    MeetingBotProcessor,
    ContentGenerationProcessor,
    SocialPostingProcessor,
    CleanupProcessor,
  ],
  exports: [JobsService],
})
export class JobsModule {}
