import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Meeting, User, Account, AccountProvider, MeetingStatus, MeetingPlatform } from '@after-meet/database';
import { CalendarService, CalendarEvent } from '../calendar/calendar.service';

export interface CreateMeetingDto {
  title: string;
  startTime: Date;
  endTime: Date;
  meetingUrl?: string;
  attendees?: Array<{ name: string; email: string; status?: string }>;
  recallEnabled?: boolean;
  calendarEventId?: string;
  platform?: MeetingPlatform;
}

export interface UpdateMeetingDto {
  title?: string;
  recallEnabled?: boolean;
}

export interface MeetingSyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Meetings Service
 * 
 * Core business logic for meeting management and bot integration.
 * Handles the bridge between calendar events and Recall.ai automation.
 * 
 * Requirement Alignments:
 * - "toggle the bot on/off for individual meetings" → recallEnabled field management
 * - "automatically detect meetings" → calendar sync functionality
 * - "configure settings for when the bot should join" → user preference integration
 * - "integrate with Recall.ai" → meeting preparation for bot scheduling
 */
@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    private readonly calendarService: CalendarService,
  ) {}

  /**
   * Get User's Meetings with Pagination
   * 
   * Requirement: Display meetings with bot status for user management
   */
  async getUserMeetings(
    userId: string, 
    page = 1, 
    limit = 20,
    upcoming = true
  ): Promise<{ meetings: Meeting[]; total: number; hasMore: boolean }> {
    const user = await this.validateUser(userId);
    
    const queryBuilder = this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.socialPosts', 'socialPosts')
      .where('meeting.userId = :userId', { userId })
      .orderBy('meeting.startTime', upcoming ? 'ASC' : 'DESC');

    if (upcoming) {
      queryBuilder.andWhere('meeting.startTime >= :now', { now: new Date() });
    } else {
      queryBuilder.andWhere('meeting.startTime < :now', { now: new Date() });
    }

    const [meetings, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      meetings,
      total,
      hasMore: total > page * limit,
    };
  }

  /**
   * Get Meeting by ID with Full Details
   * 
   * Requirement: Detailed meeting view for bot management
   */
  async getMeetingById(userId: string, meetingId: string): Promise<Meeting> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId, userId },
      relations: ['socialPosts', 'user'],
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  /**
   * Create Meeting (Manual or from Calendar)
   * 
   * Requirement: Allow manual meeting creation and calendar import
   */
  async createMeeting(userId: string, createDto: CreateMeetingDto): Promise<Meeting> {
    await this.validateUser(userId);

    // Validate meeting URL if provided
    if (createDto.meetingUrl && !this.isValidMeetingUrl(createDto.meetingUrl)) {
      throw new BadRequestException('Invalid meeting URL format');
    }

    // Check for duplicate calendar events
    if (createDto.calendarEventId) {
      const existing = await this.meetingRepository.findOne({
        where: { calendarEventId: createDto.calendarEventId, userId }
      });
      
      if (existing) {
        throw new BadRequestException('Meeting already exists for this calendar event');
      }
    }

    // Determine platform from meeting URL
    const platform = this.detectMeetingPlatform(createDto.meetingUrl);

    // Convert attendees to proper format
    const attendees = createDto.attendees?.map(attendee => ({
      name: attendee.name,
      email: attendee.email,
      status: (attendee.status as 'accepted' | 'declined' | 'tentative') || 'accepted'
    })) || null;

    const meeting = this.meetingRepository.create({
      userId,
      title: createDto.title,
      startTime: createDto.startTime,
      endTime: createDto.endTime,
      meetingUrl: createDto.meetingUrl || null,
      attendees,
      recallEnabled: createDto.recallEnabled ?? false,
      status: MeetingStatus.SCHEDULED,
      platform,
      calendarEventId: createDto.calendarEventId || null,
    });

    const savedMeeting = await this.meetingRepository.save(meeting);
    
    this.logger.log(`Created meeting ${savedMeeting.id} for user ${userId}`);
    return savedMeeting;
  }

  /**
   * Update Meeting (Toggle Bot, Edit Details)
   * 
   * Requirement: "toggle the bot on/off for individual meetings"
   */
  async updateMeeting(
    userId: string, 
    meetingId: string, 
    updateDto: UpdateMeetingDto
  ): Promise<Meeting> {
    const meeting = await this.getMeetingById(userId, meetingId);

    // Update allowed fields
    if (updateDto.title !== undefined) {
      meeting.title = updateDto.title;
    }
    
    if (updateDto.recallEnabled !== undefined) {
      meeting.recallEnabled = updateDto.recallEnabled;
      this.logger.log(`Bot ${updateDto.recallEnabled ? 'enabled' : 'disabled'} for meeting ${meetingId}`);
    }

    return await this.meetingRepository.save(meeting);
  }

  /**
   * Delete Meeting
   * 
   * Requirement: Meeting cleanup and management
   */
  async deleteMeeting(userId: string, meetingId: string): Promise<void> {
    const meeting = await this.getMeetingById(userId, meetingId);
    
    await this.meetingRepository.remove(meeting);
    this.logger.log(`Deleted meeting ${meetingId} for user ${userId}`);
  }

  /**
   * Sync User's Calendar to Meetings
   * 
   * Requirement: "automatically detect meetings and post to social media"
   * Converts calendar events to Meeting entities for automation processing
   */
  async syncUserCalendar(userId: string, daysAhead = 30): Promise<MeetingSyncResult> {
    const result: MeetingSyncResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Get calendar events for the next month
      const calendarEvents = await this.calendarService.getUpcomingEvents(userId, 50);
      
      // Filter events within the specified range
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);
      
      const relevantEvents = calendarEvents.filter(event => 
        event.startTime <= endDate && 
        event.meetingUrl // Only events with meeting URLs (video conferences)
      );

      for (const event of relevantEvents) {
        try {
          await this.syncCalendarEvent(userId, event, result);
        } catch (error) {
          result.errors.push(`Failed to sync event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.logger.log(`Calendar sync completed for user ${userId}: ${JSON.stringify(result)}`);
      return result;
      
    } catch (error) {
      this.logger.error(`Calendar sync failed for user ${userId}:`, error);
      result.errors.push(`Calendar sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Get Meetings Needing Recall.ai Bot
   * 
   * Used by Jobs module to schedule bots for upcoming meetings
   */
  async getMeetingsForBotScheduling(timeWindow = 60): Promise<Meeting[]> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + timeWindow * 60000); // timeWindow minutes from now
    const windowEnd = new Date(windowStart.getTime() + 15 * 60000); // 15-minute window

    return await this.meetingRepository.find({
      where: {
        recallEnabled: true,
        status: MeetingStatus.SCHEDULED,
        startTime: Between(windowStart, windowEnd),
        recallBotId: null, // Bot not yet scheduled
      },
      relations: ['user'],
    });
  }

  /**
   * Update Meeting with Recall Bot Information
   * 
   * Called by Recall module when bot is successfully scheduled
   */
  async updateMeetingWithBot(meetingId: string, botId: string): Promise<void> {
    await this.meetingRepository.update(meetingId, {
      recallBotId: botId,
      status: MeetingStatus.IN_PROGRESS,
    });
    
    this.logger.log(`Meeting ${meetingId} updated with bot ${botId}`);
  }

  /**
   * Mark Meeting as Completed with Transcript
   * 
   * Called by Recall module when transcript is available
   */
  async completeMeetingWithTranscript(meetingId: string, transcript: string): Promise<void> {
    await this.meetingRepository.update(meetingId, {
      status: MeetingStatus.COMPLETED,
      transcript,
    });
    
    this.logger.log(`Meeting ${meetingId} completed with transcript`);
  }

  /**
   * Private: Sync Individual Calendar Event
   */
  private async syncCalendarEvent(
    userId: string, 
    event: CalendarEvent, 
    result: MeetingSyncResult
  ): Promise<void> {
    // Check if meeting already exists
    const existingMeeting = await this.meetingRepository.findOne({
      where: { calendarEventId: event.id, userId }
    });

    if (existingMeeting) {
      // Update existing meeting if calendar event changed
      let hasChanges = false;
      
      if (existingMeeting.title !== event.title) {
        existingMeeting.title = event.title;
        hasChanges = true;
      }
      
      if (existingMeeting.startTime.getTime() !== event.startTime.getTime()) {
        existingMeeting.startTime = event.startTime;
        hasChanges = true;
      }
      
      if (existingMeeting.endTime.getTime() !== event.endTime.getTime()) {
        existingMeeting.endTime = event.endTime;
        hasChanges = true;
      }
      
      if (existingMeeting.meetingUrl !== event.meetingUrl) {
        existingMeeting.meetingUrl = event.meetingUrl;
        hasChanges = true;
      }

      if (hasChanges) {
        await this.meetingRepository.save(existingMeeting);
        result.updated++;
      } else {
        result.skipped++;
      }
    } else {
      // Create new meeting
      const attendees = event.attendees.map(email => ({ 
        name: '', 
        email, 
        status: 'accepted' as const 
      }));

      const meeting = this.meetingRepository.create({
        userId,
        calendarEventId: event.id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        meetingUrl: event.meetingUrl,
        attendees,
        recallEnabled: false, // Default to disabled for auto-created meetings
        status: MeetingStatus.SCHEDULED,
        platform: this.detectMeetingPlatform(event.meetingUrl),
      });

      await this.meetingRepository.save(meeting);
      result.created++;
    }
  }

  /**
   * Private: Detect Meeting Platform from URL
   */
  private detectMeetingPlatform(meetingUrl?: string): MeetingPlatform {
    if (!meetingUrl) return MeetingPlatform.ZOOM; // Default

    if (meetingUrl.includes('meet.google.com')) {
      return MeetingPlatform.MEET;
    }
    if (meetingUrl.includes('zoom.us')) {
      return MeetingPlatform.ZOOM;
    }
    if (meetingUrl.includes('teams.microsoft.com')) {
      return MeetingPlatform.TEAMS;
    }

    return MeetingPlatform.ZOOM; // Default fallback
  }

  /**
   * Private: Validate User Exists
   */
  private async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Private: Validate Meeting URL Format
   */
  private isValidMeetingUrl(url: string): boolean {
    const validPatterns = [
      /^https:\/\/meet\.google\.com\/[a-z-]+$/i,
      /^https:\/\/.*\.zoom\.us\/j\/\d+/i,
      /^https:\/\/teams\.microsoft\.com\/l\/meetup-join\//i,
    ];

    return validPatterns.some(pattern => pattern.test(url));
  }
}
