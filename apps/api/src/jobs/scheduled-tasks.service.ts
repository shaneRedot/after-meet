import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { MeetingsService } from '../meetings/meetings.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);
  private readonly SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'; // Reserved UUID for system operations

  constructor(
    private readonly jobsService: JobsService,
    private readonly meetingsService: MeetingsService,
    private readonly usersService: UsersService,
  ) {}

  // Run every 5 minutes to check for upcoming meetings that need bots
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduleUpcomingMeetingBots(): Promise<void> {
    this.logger.log('Checking for upcoming meetings that need bots...');
    
    try {
      // Get meetings that need bots scheduled (within next 20 minutes)
      const upcomingMeetings = await this.meetingsService.getMeetingsForBotScheduling(20);
      
      for (const meeting of upcomingMeetings) {
        // Check if bot is enabled (using recallEnabled from Meeting entity)
        if (meeting.recallEnabled) {
          const botScheduleTime = new Date(meeting.startTime.getTime() - 15 * 60 * 1000); // 15 minutes before meeting
          const now = new Date();
          
          if (botScheduleTime > now) {
            await this.jobsService.scheduleMeetingBot({
              id: `bot-${meeting.id}`,
              userId: meeting.userId,
              meetingId: meeting.id,
              type: 'meeting-bot',
              data: {
                meetingId: meeting.id,
                scheduledTime: botScheduleTime,
                botConfig: {
                  recordVideo: true,
                  recordAudio: true,
                  outputTranscription: true,
                },
              },
              createdAt: now,
            });

            // Note: Would need to extend MeetingsService to mark meeting as bot scheduled
            this.logger.log(`Scheduled bot for meeting ${meeting.id} at ${botScheduleTime}`);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error scheduling meeting bots:', error);
    }
  }

  // Run every hour to clean up old completed jobs
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldJobs(): Promise<void> {
    this.logger.log('Cleaning up old completed jobs...');
    
    try {
      const queueNames = ['meeting-bot', 'content-generation', 'social-posting', 'cleanup'];
      
      for (const queueName of queueNames) {
        await this.jobsService.cleanQueue(queueName, 3600000); // Clean jobs older than 1 hour
      }
      
      this.logger.log('Job cleanup completed');
    } catch (error) {
      this.logger.error('Error cleaning up jobs:', error);
    }
  }

  // Run daily at 2 AM to clean up old resources
  @Cron('0 2 * * *')
  async dailyCleanup(): Promise<void> {
    this.logger.log('Running daily cleanup...');
    
    try {
      const olderThan = new Date();
      olderThan.setDate(olderThan.getDate() - 30); // Clean resources older than 30 days
      
      await this.jobsService.scheduleCleanup({
        id: `cleanup-${Date.now()}`,
        userId: this.SYSTEM_USER_ID,
        type: 'cleanup',
        data: {
          olderThan,
          resources: ['bots', 'transcripts', 'social-posts', 'temp-files'],
        },
        createdAt: new Date(),
      });
      
      this.logger.log('Daily cleanup scheduled');
    } catch (error) {
      this.logger.error('Error scheduling daily cleanup:', error);
    }
  }

  // Run every 30 minutes to retry failed jobs
  @Cron('0,30 * * * *')
  async retryFailedJobs(): Promise<void> {
    this.logger.log('Retrying failed jobs...');
    
    try {
      const queueNames = ['meeting-bot', 'content-generation', 'social-posting'];
      
      for (const queueName of queueNames) {
        const retriedCount = await this.jobsService.retryFailedJobs(queueName);
        if (retriedCount > 0) {
          this.logger.log(`Retried ${retriedCount} failed jobs in ${queueName} queue`);
        }
      }
    } catch (error) {
      this.logger.error('Error retrying failed jobs:', error);
    }
  }

  // Run every 15 minutes to check for content generation triggers
  @Cron('*/15 * * * *')
  async checkContentGenerationTriggers(): Promise<void> {
    this.logger.log('Checking for content generation triggers...');
    
    try {
      // Get recently completed meetings with transcripts but no generated content
      // Note: Would need to extend MeetingsService with this specific query method
      // For now, get user meetings as placeholder
      const recentMeetingsResult = await this.meetingsService.getUserMeetings(this.SYSTEM_USER_ID);
      const recentMeetings = recentMeetingsResult.meetings.filter(m => 
        m.transcript && m.status === 'completed'
      );
      
      for (const meeting of recentMeetings) {
        if (meeting.transcript) {
          // Get user preferences
          const user = await this.usersService.findById(meeting.userId);
          
          await this.jobsService.scheduleContentGeneration({
            id: `content-${meeting.id}`,
            userId: meeting.userId,
            meetingId: meeting.id,
            type: 'content-generation',
            data: {
              meetingId: meeting.id,
              transcriptUrl: meeting.transcript, // Using transcript field
              meetingTitle: meeting.title,
              meetingDuration: 0, // Duration not available in current schema
              participants: [], // Participants not available in current schema
              preferences: {
                tone: 'professional',
                platform: ['linkedin'],
                contentType: ['summary', 'insights'],
              },
            },
            createdAt: new Date(),
          });

          this.logger.log(`Scheduled content generation for meeting ${meeting.id}`);
        }
      }
    } catch (error) {
      this.logger.error('Error checking content generation triggers:', error);
    }
  }

  // Run every 10 minutes to process scheduled social posts
  @Cron('*/10 * * * *')
  async processScheduledSocialPosts(): Promise<void> {
    this.logger.log('Processing scheduled social posts...');
    
    try {
      // This would typically check for approved social posts that are ready to be published
      // The actual social posting logic is handled by the social-posting processor
      const now = new Date();
      
      // Get social posts scheduled for publishing in the next 10 minutes
      const scheduledPosts = await this.getScheduledSocialPosts(now);
      
      for (const post of scheduledPosts) {
        if (post.status === 'approved' && post.autoPost) {
          await this.jobsService.scheduleSocialPost({
            id: `social-${post.id}`,
            userId: post.userId,
            type: 'social-posting',
            data: {
              socialPostId: post.id,
              platform: post.platform as 'linkedin' | 'facebook',
              content: post.content,
              scheduledTime: post.scheduledTime,
              autoPost: post.autoPost,
            },
            createdAt: new Date(),
          });

          this.logger.log(`Scheduled social post ${post.id} for ${post.platform}`);
        }
      }
    } catch (error) {
      this.logger.error('Error processing scheduled social posts:', error);
    }
  }

  private async getScheduledSocialPosts(now: Date): Promise<any[]> {
    // This would query the database for social posts scheduled for publishing
    // For now, return empty array as the social service would handle this
    return [];
  }
}
