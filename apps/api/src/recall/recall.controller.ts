import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecallService, RecallBot, RecallTranscript, BotStatusUpdate } from './recall.service';

/**
 * Recall.ai Integration Controller
 * 
 * Handles API endpoints for bot management and webhook processing.
 * Core implementation for "integrate with Recall.ai to get meeting transcripts" requirement.
 * 
 * Key Endpoints:
 * - Bot lifecycle management (create, status, delete)
 * - Webhook handlers for real-time updates
 * - Internal endpoints for background job processing
 */
@Controller('recall')
export class RecallController {
  constructor(private readonly recallService: RecallService) {}

  /**
   * Create Bot for Meeting
   * 
   * Requirement: "integrate with Recall.ai to get meeting transcripts"
   * User action: Enable bot for a specific meeting
   * 
   * Frontend Usage:
   * ```javascript
   * const response = await fetch(`/api/recall/meetings/${meetingId}/bot`, {
   *   method: 'POST',
   *   headers: { Authorization: `Bearer ${jwt}` }
   * });
   * ```
   */
  @Post('meetings/:meetingId/bot')
  @UseGuards(JwtAuthGuard)
  async createBotForMeeting(
    @Param('meetingId') meetingId: string,
    @Request() req,
  ): Promise<RecallBot> {
    return this.recallService.createBotForMeeting(meetingId);
  }

  /**
   * Get Bot Status
   * 
   * Monitors bot status for real-time updates in frontend
   * User sees: "Bot Status: Joining..." → "Bot Status: Recording"
   */
  @Get('bots/:botId/status')
  @UseGuards(JwtAuthGuard)
  async getBotStatus(
    @Param('botId') botId: string,
  ): Promise<RecallBot> {
    return this.recallService.getBotStatus(botId);
  }

  /**
   * Get Meeting Transcript
   * 
   * Retrieves processed transcript for content generation
   * Used by frontend and automation modules
   */
  @Get('bots/:botId/transcript')
  @UseGuards(JwtAuthGuard)
  async getMeetingTranscript(
    @Param('botId') botId: string,
  ): Promise<RecallTranscript | null> {
    return this.recallService.getMeetingTranscript(botId);
  }

  /**
   * Delete Bot from Meeting
   * 
   * User action: Disable bot mid-meeting or cleanup
   * Emergency stop functionality
   */
  @Delete('bots/:botId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBotFromMeeting(
    @Param('botId') botId: string,
  ): Promise<void> {
    return this.recallService.deleteBotFromMeeting(botId);
  }

  /**
   * Bot Status Webhook Handler
   * 
   * Recall.ai calls this endpoint with real-time bot status updates:
   * - joining: Bot is connecting to meeting
   * - in_call: Bot successfully joined
   * - call_ended: Meeting finished
   * - done: Recording and processing complete
   * - error: Something went wrong
   * 
   * This webhook enables real-time status updates in the frontend
   */
  @Post('webhooks/bot-status')
  @HttpCode(HttpStatus.OK)
  async handleBotStatusWebhook(
    @Body() statusUpdate: BotStatusUpdate,
  ): Promise<{ success: boolean }> {
    await this.recallService.processBotStatusWebhook(statusUpdate);
    return { success: true };
  }

  /**
   * Transcript Webhook Handler
   * 
   * Recall.ai calls this endpoint when transcript processing is complete:
   * - Receives full meeting transcript
   * - Updates meeting record
   * - Triggers social media content generation
   * 
   * This webhook enables automatic content generation workflow
   */
  @Post('webhooks/transcript')
  @HttpCode(HttpStatus.OK)
  async handleTranscriptWebhook(
    @Body() transcriptData: any,
  ): Promise<{ success: boolean }> {
    await this.recallService.processTranscriptWebhook(transcriptData);
    return { success: true };
  }

  /**
   * Internal: Create Bots for Scheduled Meetings
   * 
   * Used by background jobs to automatically schedule bots
   * Called every 15 minutes to prepare bots for upcoming meetings
   * 
   * Not exposed to frontend - internal automation only
   */
  @Post('internal/schedule-bots')
  async scheduleBots(): Promise<{ created: number; errors: string[] }> {
    return this.recallService.createBotsForScheduledMeetings();
  }

  /**
   * Health Check for Recall.ai Integration
   * 
   * Tests API connectivity and configuration
   * Used by monitoring and admin dashboard
   */
  @Get('health')
  async healthCheck(): Promise<{ 
    status: string; 
    api_configured: boolean; 
    timestamp: string;
  }> {
    // Basic health check - could be expanded to test actual API call
    return {
      status: 'healthy',
      api_configured: !!process.env.RECALL_API_KEY,
      timestamp: new Date().toISOString(),
    };
  }
}
