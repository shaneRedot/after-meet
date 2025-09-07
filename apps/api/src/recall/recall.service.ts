import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Meeting, User, MeetingStatus } from '@after-meet/database';

export interface RecallBot {
  id: string;
  meeting_url: string;
  bot_name: string;
  status: 'joining' | 'in_call' | 'call_ended' | 'done' | 'error';
  created_at: string;
  updated_at: string;
}

export interface RecallTranscript {
  id: string;
  bot_id: string;
  status: 'processing' | 'done' | 'error';
  transcript_url?: string;
  transcript_text?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBotDto {
  meeting_url: string;
  bot_name?: string;
  transcription_options?: {
    provider: 'deepgram' | 'assembly_ai' | 'rev';
    language?: string;
  };
  real_time_transcription?: {
    destination_url?: string;
  };
}

export interface BotStatusUpdate {
  bot_id: string;
  status: string;
  meeting_metadata?: any;
  error_message?: string;
}

/**
 * Recall.ai Integration Service
 * 
 * Handles the complete lifecycle of AI bots for meeting recording and transcription.
 * Core implementation for "integrate with Recall.ai to get meeting transcripts" requirement.
 * 
 * Key Responsibilities:
 * - Bot creation and scheduling for enabled meetings
 * - Real-time bot status monitoring and updates
 * - Transcript retrieval and processing
 * - Error handling and retry mechanisms
 * - Integration with Meetings module for status synchronization
 */
@Injectable()
export class RecallService {
  private readonly logger = new Logger(RecallService.name);
  private readonly recallApiUrl = 'https://api.recall.ai/api/v1';
  private readonly recallApiKey: string;

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.recallApiKey = this.configService.get<string>('RECALL_API_KEY');
    
    if (!this.recallApiKey) {
      this.logger.warn('RECALL_API_KEY not configured - Recall.ai integration disabled');
    }
  }

  /**
   * Create Recall.ai Bot for Meeting
   * 
   * Requirement: "integrate with Recall.ai to get meeting transcripts"
   * Creates and schedules a bot to join the specified meeting for recording
   */
  async createBotForMeeting(meetingId: string): Promise<RecallBot> {
    const meeting = await this.validateMeetingForBot(meetingId);
    
    if (!meeting.meetingUrl) {
      throw new BadRequestException('Meeting URL is required for bot creation');
    }

    // Validate meeting URL format
    if (!this.isValidMeetingUrl(meeting.meetingUrl)) {
      throw new BadRequestException('Invalid meeting URL format for bot joining');
    }

    const botData: CreateBotDto = {
      meeting_url: meeting.meetingUrl,
      bot_name: `After-Meet Recorder`, // Professional bot name
      transcription_options: {
        provider: 'deepgram', // High-quality transcription
        language: 'en', // English by default
      },
      real_time_transcription: {
        destination_url: `${this.configService.get('APP_URL')}/api/recall/webhooks/transcript`,
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.recallApiUrl}/bots`, botData, {
          headers: {
            'Authorization': `Token ${this.recallApiKey}`,
            'Content-Type': 'application/json',
          },
        })
      );

      const bot: RecallBot = response.data;
      
      // Update meeting with bot information
      await this.meetingRepository.update(meetingId, {
        recallBotId: bot.id,
        status: MeetingStatus.IN_PROGRESS,
      });

      this.logger.log(`Created bot ${bot.id} for meeting ${meetingId} (${meeting.title})`);
      return bot;
      
    } catch (error) {
      this.logger.error(`Failed to create bot for meeting ${meetingId}:`, error);
      
      // Update meeting with error status
      await this.meetingRepository.update(meetingId, {
        status: MeetingStatus.CANCELLED,
      });
      
      throw new BadRequestException('Failed to create Recall.ai bot for meeting');
    }
  }

  /**
   * Get Bot Status and Information
   * 
   * Monitors bot lifecycle and provides real-time status updates
   */
  async getBotStatus(botId: string): Promise<RecallBot> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.recallApiUrl}/bots/${botId}`, {
          headers: {
            'Authorization': `Token ${this.recallApiKey}`,
          },
        })
      );

      return response.data;
      
    } catch (error) {
      this.logger.error(`Failed to get bot status for ${botId}:`, error);
      throw new NotFoundException('Bot not found or API error');
    }
  }

  /**
   * Get Meeting Transcript
   * 
   * Retrieves processed transcript after meeting completion
   * Requirement: Core functionality for social media content generation
   */
  async getMeetingTranscript(botId: string): Promise<RecallTranscript | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.recallApiUrl}/bots/${botId}/transcript`, {
          headers: {
            'Authorization': `Token ${this.recallApiKey}`,
          },
        })
      );

      return response.data;
      
    } catch (error) {
      if ((error as any).response?.status === 404) {
        this.logger.warn(`Transcript not yet available for bot ${botId}`);
        return null;
      }
      
      this.logger.error(`Failed to get transcript for bot ${botId}:`, error);
      throw new BadRequestException('Failed to retrieve meeting transcript');
    }
  }

  /**
   * Delete/Stop Bot
   * 
   * Removes bot from meeting if user disables mid-meeting
   */
  async deleteBotFromMeeting(botId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.recallApiUrl}/bots/${botId}`, {
          headers: {
            'Authorization': `Token ${this.recallApiKey}`,
          },
        })
      );

      // Update meeting status
      const meeting = await this.meetingRepository.findOne({
        where: { recallBotId: botId }
      });

      if (meeting) {
        await this.meetingRepository.update(meeting.id, {
          recallBotId: null,
          status: MeetingStatus.CANCELLED,
        });
      }

      this.logger.log(`Deleted bot ${botId} and updated meeting status`);
      
    } catch (error) {
      this.logger.error(`Failed to delete bot ${botId}:`, error);
      throw new BadRequestException('Failed to remove bot from meeting');
    }
  }

  /**
   * Process Bot Status Webhook
   * 
   * Handles real-time updates from Recall.ai about bot status changes
   * Called automatically when bot joins, leaves, or encounters errors
   */
  async processBotStatusWebhook(statusUpdate: BotStatusUpdate): Promise<void> {
    const { bot_id, status, meeting_metadata, error_message } = statusUpdate;
    
    this.logger.log(`Bot ${bot_id} status update: ${status}`);

    // Find meeting associated with this bot
    const meeting = await this.meetingRepository.findOne({
      where: { recallBotId: bot_id },
      relations: ['user'],
    });

    if (!meeting) {
      this.logger.warn(`No meeting found for bot ${bot_id}`);
      return;
    }

    // Update meeting status based on bot status
    let meetingStatus = meeting.status;
    
    switch (status) {
      case 'joining':
        meetingStatus = MeetingStatus.IN_PROGRESS;
        this.logger.log(`Bot joining meeting: ${meeting.title}`);
        break;
        
      case 'in_call':
        meetingStatus = MeetingStatus.IN_PROGRESS;
        this.logger.log(`Bot successfully joined meeting: ${meeting.title}`);
        break;
        
      case 'call_ended':
        this.logger.log(`Meeting ended, processing transcript: ${meeting.title}`);
        // Don't change status yet - wait for transcript
        break;
        
      case 'done':
        meetingStatus = MeetingStatus.COMPLETED;
        this.logger.log(`Bot completed for meeting: ${meeting.title}`);
        // Trigger transcript retrieval
        await this.retrieveAndProcessTranscript(bot_id, meeting.id);
        break;
        
      case 'error':
        meetingStatus = MeetingStatus.CANCELLED;
        this.logger.error(`Bot error for meeting ${meeting.title}: ${error_message}`);
        break;
    }

    // Update meeting status
    await this.meetingRepository.update(meeting.id, { status: meetingStatus });
  }

  /**
   * Process Transcript Webhook
   * 
   * Handles completed transcript delivery from Recall.ai
   * Triggers social media content generation workflow
   */
  async processTranscriptWebhook(transcriptData: any): Promise<void> {
    const { bot_id, transcript_text, transcript_url } = transcriptData;
    
    this.logger.log(`Received transcript for bot ${bot_id}`);

    // Find meeting associated with this bot
    const meeting = await this.meetingRepository.findOne({
      where: { recallBotId: bot_id }
    });

    if (!meeting) {
      this.logger.warn(`No meeting found for transcript bot ${bot_id}`);
      return;
    }

    // Update meeting with transcript
    await this.meetingRepository.update(meeting.id, {
      transcript: transcript_text,
      status: MeetingStatus.COMPLETED,
    });

    this.logger.log(`Updated meeting ${meeting.id} with transcript (${transcript_text?.length || 0} chars)`);

    // TODO: Trigger social media content generation
    // await this.socialService.generateContentFromTranscript(meeting.id);
  }

  /**
   * Bulk Create Bots for Scheduled Meetings
   * 
   * Used by background jobs to schedule bots for upcoming meetings
   * Processes all meetings that need bots in the next time window
   */
  async createBotsForScheduledMeetings(timeWindowMinutes = 60): Promise<{ 
    created: number; 
    errors: string[] 
  }> {
    const result = { created: 0, errors: [] };
    
    try {
      // Get meetings needing bots (from Meetings module)
      const meetings = await this.meetingRepository.find({
        where: {
          recallEnabled: true,
          status: MeetingStatus.SCHEDULED,
          recallBotId: null, // No bot created yet
        },
        relations: ['user'],
      });

      // Filter meetings starting within time window
      const now = new Date();
      const windowEnd = new Date(now.getTime() + timeWindowMinutes * 60000);
      
      const upcomingMeetings = meetings.filter(meeting => 
        meeting.startTime >= now && meeting.startTime <= windowEnd
      );

      this.logger.log(`Found ${upcomingMeetings.length} meetings needing bots`);

      // Create bots for each meeting
      for (const meeting of upcomingMeetings) {
        try {
          await this.createBotForMeeting(meeting.id);
          result.created++;
        } catch (error) {
          const errorMsg = `Failed to create bot for meeting ${meeting.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      this.logger.log(`Bot creation summary: ${result.created} created, ${result.errors.length} errors`);
      return result;
      
    } catch (error) {
      this.logger.error('Failed to create bots for scheduled meetings:', error);
      result.errors.push(`Bulk bot creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Private: Retrieve and Process Transcript
   */
  private async retrieveAndProcessTranscript(botId: string, meetingId: string): Promise<void> {
    try {
      // Wait a moment for transcript to be ready
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const transcript = await this.getMeetingTranscript(botId);
      
      if (transcript && transcript.transcript_text) {
        await this.meetingRepository.update(meetingId, {
          transcript: transcript.transcript_text,
        });
        
        this.logger.log(`Retrieved transcript for meeting ${meetingId}`);
        
        // TODO: Trigger social content generation
        // await this.socialService.generateContentFromTranscript(meetingId);
      }
    } catch (error) {
      this.logger.error(`Failed to retrieve transcript for bot ${botId}:`, error);
    }
  }

  /**
   * Private: Validate Meeting for Bot Creation
   */
  private async validateMeetingForBot(meetingId: string): Promise<Meeting> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
      relations: ['user'],
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (!meeting.recallEnabled) {
      throw new BadRequestException('Recall.ai bot is not enabled for this meeting');
    }

    if (meeting.recallBotId) {
      throw new BadRequestException('Bot already exists for this meeting');
    }

    return meeting;
  }

  /**
   * Private: Validate Meeting URL for Bot Joining
   */
  private isValidMeetingUrl(url: string): boolean {
    const validPatterns = [
      /^https:\/\/.*\.zoom\.us\/j\/\d+/i,                    // Zoom
      /^https:\/\/meet\.google\.com\/[a-z-]+$/i,             // Google Meet
      /^https:\/\/teams\.microsoft\.com\/l\/meetup-join\//i, // Microsoft Teams
    ];

    return validPatterns.some(pattern => pattern.test(url));
  }
}
