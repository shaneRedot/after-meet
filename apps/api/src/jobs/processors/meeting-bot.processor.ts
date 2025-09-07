import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MeetingBotJobData } from '../dto/job-data.dto';
import { RecallService } from '../../recall/recall.service';
import { MeetingsService } from '../../meetings/meetings.service';

@Processor('meeting-bot')
export class MeetingBotProcessor {
  private readonly logger = new Logger(MeetingBotProcessor.name);

  constructor(
    private readonly recallService: RecallService,
    private readonly meetingsService: MeetingsService,
  ) {}

  @Process('create-bot')
  async handleBotCreation(job: Job<MeetingBotJobData>): Promise<void> {
    const { data } = job.data;
    this.logger.log(`Creating bot for meeting ${data.meetingId}`);

    try {
      // Update job progress
      await job.progress(10);

      // Get meeting details
      const meeting = await this.meetingsService.getMeetingById(job.data.userId, data.meetingId);
      if (!meeting) {
        throw new Error(`Meeting ${data.meetingId} not found`);
      }

      await job.progress(20);

      // Check if meeting is still valid and hasn't started yet
      const now = new Date();
      if (meeting.startTime <= now) {
        this.logger.warn(`Meeting ${data.meetingId} has already started or passed`);
        return;
      }

      await job.progress(30);

      // Create bot with Recall.ai
      const botResponse = await this.recallService.createBotForMeeting(data.meetingId);

      await job.progress(60);

      // Update meeting with bot ID
      await this.meetingsService.updateMeetingWithBot(data.meetingId, botResponse.id);

      await job.progress(80);

      // Log success
      this.logger.log(`Bot ${botResponse.id} created successfully for meeting ${data.meetingId}`);
      
      await job.progress(100);

    } catch (error) {
      this.logger.error(`Failed to create bot for meeting ${data.meetingId}:`, error);
      
      // Update meeting status to reflect bot creation failure
      try {
        // Note: Would need to extend updateMeetingWithBot or create new method for error handling
        this.logger.error(`Failed to update meeting ${data.meetingId} with bot error`);
      } catch (updateError) {
        this.logger.error('Failed to update meeting with bot error:', updateError);
      }
      
      throw error;
    }
  }

  @Process('stop-bot')
  async handleBotStop(job: Job<{ meetingId: string; botId: string }>): Promise<void> {
    const { meetingId, botId } = job.data;
    this.logger.log(`Stopping bot ${botId} for meeting ${meetingId}`);

    try {
      await job.progress(20);

      // Stop the bot
      await this.recallService.deleteBotFromMeeting(botId);

      await job.progress(60);

      // Update meeting status
      // Note: Would need to extend MeetingsService with updateMeetingStatus method
      this.logger.log(`Bot ${botId} stopped successfully`);

      await job.progress(100);

      this.logger.log(`Bot ${botId} stopped successfully`);

    } catch (error) {
      this.logger.error(`Failed to stop bot ${botId}:`, error);
      throw error;
    }
  }

  @Process('bot-health-check')
  async handleBotHealthCheck(job: Job<{ botId: string; meetingId: string }>): Promise<void> {
    const { botId, meetingId } = job.data;
    this.logger.log(`Health check for bot ${botId}`);

    try {
      await job.progress(30);

      // Get bot status from Recall.ai
      const botStatus = await this.recallService.getBotStatus(botId);

      await job.progress(70);

      // Update meeting with current bot status
      // Note: Would need to extend MeetingsService with bot status update methods
      this.logger.log(`Bot ${botId} health check completed. Status: ${botStatus.status || 'unknown'}`);

    } catch (error) {
      this.logger.error(`Bot health check failed for ${botId}:`, error);
      throw error;
    }
  }
}
