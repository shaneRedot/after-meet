import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MeetingsService, CreateMeetingDto, UpdateMeetingDto, MeetingSyncResult } from './meetings.service';
import { Meeting } from '@after-meet/database';

/**
 * Meetings Controller
 * 
 * Handles meeting management and Recall.ai bot integration endpoints.
 */
@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  /**
   * Get User's Meetings with Pagination
   * 
   * Requirement: Display meetings with bot status and social post history
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20)
   * - upcoming: Show upcoming (true) or past (false) meetings (default: true)
   */
  @Get()
  async getMeetings(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('upcoming', new ParseBoolPipe({ optional: true })) upcoming = true,
  ) { 
    return this.meetingsService.getUserMeetings(req.user.userId, page, limit, upcoming);
  }

  /**
   * Get Meeting Details by ID
   * 
   * Requirement: Detailed meeting view with bot status and social posts
   */
  @Get(':id')
  async getMeeting(
    @Request() req,
    @Param('id') meetingId: string,
  ): Promise<Meeting> {
    return this.meetingsService.getMeetingById(req.user.userId, meetingId);
  }

  /**
   * Create New Meeting (Manual)
   * 
   * Requirement: Allow manual meeting creation for testing or non-calendar events
   */
  @Post()
  async createMeeting(
    @Request() req,
    @Body() createMeetingDto: CreateMeetingDto,
  ): Promise<Meeting> {
    return this.meetingsService.createMeeting(req.user.userId, createMeetingDto);
  }

  /**
   * Update Meeting (Toggle Bot, Edit Details)
   * 
   * Requirement: "toggle the bot on/off for individual meetings"
   * This is the core feature for per-meeting bot control
   */
  @Put(':id')
  async updateMeeting(
    @Request() req,
    @Param('id') meetingId: string,
    @Body() updateMeetingDto: UpdateMeetingDto,
  ): Promise<Meeting> {
    return this.meetingsService.updateMeeting(req.user.userId, meetingId, updateMeetingDto);
  }

  /**
   * Delete Meeting
   * 
   * Requirement: Meeting cleanup and management
   */
  @Delete(':id')
  async deleteMeeting(
    @Request() req,
    @Param('id') meetingId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.meetingsService.deleteMeeting(req.user.userId, meetingId);
    return { success: true, message: 'Meeting deleted successfully' };
  }

  /**
   * Sync Calendar to Meetings
   * 
   * Requirement: "automatically detect meetings and post to social media"
   * Converts calendar events to Meeting entities for automation processing
   * 
   * This endpoint enables the automatic meeting detection feature
   */
  @Post('sync')
  async syncCalendar(
    @Request() req,
    @Query('daysAhead', new ParseIntPipe({ optional: true })) daysAhead = 30,
  ): Promise<MeetingSyncResult> {
    return this.meetingsService.syncUserCalendar(req.user.userId, daysAhead);
  }

  /**
   * Get Meetings Needing Bot Scheduling
   * 
   * Used by background jobs to schedule Recall.ai bots
   * Not typically called by frontend
   */
  @Get('internal/bot-scheduling')
  async getMeetingsForBotScheduling(
    @Query('timeWindow', new ParseIntPipe({ optional: true })) timeWindow = 60,
  ): Promise<Meeting[]> {
    return this.meetingsService.getMeetingsForBotScheduling(timeWindow);
  }

  /**
   * Enable Recall.ai Bot for Meeting
   * 
   * Requirement: "toggle the bot on/off for individual meetings"
   * Convenience endpoint for quick bot enabling
   */
  @Post(':id/recall/enable')
  async enableRecallBot(
    @Request() req,
    @Param('id') meetingId: string,
  ): Promise<Meeting> {
    return this.meetingsService.updateMeeting(req.user.userId, meetingId, { 
      recallEnabled: true 
    });
  }

  /**
   * Disable Recall.ai Bot for Meeting
   * 
   * Requirement: "toggle the bot on/off for individual meetings"
   * Convenience endpoint for quick bot disabling
   */
  @Post(':id/recall/disable')
  async disableRecallBot(
    @Request() req,
    @Param('id') meetingId: string,
  ): Promise<Meeting> {
    return this.meetingsService.updateMeeting(req.user.userId, meetingId, { 
      recallEnabled: false 
    });
  }
}
