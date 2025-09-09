import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { Account, AccountProvider } from '@after-meet/database';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  meetingUrl?: string;
  attendees: string[];
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  /**
   * Get Google Calendar events for a user
   */
  async getUpcomingEvents(userId: string, maxResults = 10): Promise<CalendarEvent[]> {
    this.logger.log(`🔍 Fetching calendar events for user: ${userId}`);
    
    // Mock data for local development (no calendar scope available)
    if (process.env.NODE_ENV === 'local') {
      this.logger.log(`🧪 Using mock calendar data for development`);
      return [
        {
          id: 'mock-event-1',
          title: 'Team Standup',
          startTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
          endTime: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
          meetingUrl: 'https://meet.google.com/abc-def-ghi',
          attendees: ['team@company.com', 'manager@company.com'],
        },
        {
          id: 'mock-event-2',
          title: 'Client Meeting',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
          meetingUrl: 'https://zoom.us/j/123456789',
          attendees: ['client@example.com'],
        },
        {
          id: 'mock-event-3',
          title: 'Project Review',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
          endTime: new Date(Date.now() + 49 * 60 * 60 * 1000),
          attendees: ['reviewer@company.com', 'stakeholder@company.com'],
        },
      ];
    }
    
    try {
      const googleAccount = await this.getGoogleAccount(userId);
      this.logger.log(`✅ Found Google account for user ${userId}`);
      this.logger.log(`🔑 Access token length: ${googleAccount.accessToken?.length || 0}`);
      
      const calendar = this.createCalendarClient(googleAccount.accessToken);
      this.logger.log(`📅 Created calendar client, fetching events...`);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      this.logger.log(`📊 Calendar API response received, items: ${response.data.items?.length || 0}`);

      return (response.data.items || []).map(event => ({
        id: event.id!,
        title: event.summary || 'Untitled Meeting',
        startTime: new Date(event.start?.dateTime || event.start?.date || ''),
        endTime: new Date(event.end?.dateTime || event.end?.date || ''),
        meetingUrl: this.extractMeetingUrl(event.description || ''),
        attendees: (event.attendees || [])
          .map(attendee => attendee.email)
          .filter(Boolean) as string[],
      }));
    } catch (error) {
      this.logger.error(`❌ Failed to fetch calendar events for user ${userId}:`, error);
      
      // More detailed error logging
      if (typeof error === 'object' && error !== null && 'code' in error) {
        if ((error as any).code === 401) {
          this.logger.error(` Authentication Error: The access token is invalid or expired`);
          this.logger.error(` Possible causes: 1) Token expired 2) Calendar API not enabled 3) Missing calendar scope`);
        } else if ((error as any).code === 403) {
          this.logger.error(` Permission Error: Calendar API access denied`);
          this.logger.error(` Possible causes: 1) Calendar API not enabled 2) OAuth consent screen missing calendar scope`);
        }
      }
      
      this.logger.error(`❌ Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        status: (error as any)?.status,
        errors: (error as any)?.errors,
      });
      throw new Error(`Calendar API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get specific calendar event by ID
   */
  async getEvent(userId: string, eventId: string): Promise<CalendarEvent> {
    const googleAccount = await this.getGoogleAccount(userId);
    const calendar = this.createCalendarClient(googleAccount.accessToken);

    try {
      const response = await calendar.events.get({
        calendarId: 'primary',
        eventId,
      });

      const event = response.data;
      return {
        id: event.id!,
        title: event.summary || 'Untitled Meeting',
        startTime: new Date(event.start?.dateTime || event.start?.date || ''),
        endTime: new Date(event.end?.dateTime || event.end?.date || ''),
        meetingUrl: this.extractMeetingUrl(event.description || ''),
        attendees: (event.attendees || [])
          .map(attendee => attendee.email)
          .filter(Boolean) as string[],
      };
    } catch (error) {
      this.logger.error(`Failed to fetch event ${eventId} for user ${userId}:`, error);
      throw new NotFoundException('Calendar event not found');
    }
  }

  /**
   * Watch for calendar changes (webhooks)
   */
  async watchCalendar(userId: string, webhookUrl: string): Promise<string> {
    const googleAccount = await this.getGoogleAccount(userId);
    const calendar = this.createCalendarClient(googleAccount.accessToken);

    try {
      const response = await calendar.events.watch({
        calendarId: 'primary',
        requestBody: {
          id: `calendar-watch-${userId}-${Date.now()}`,
          type: 'web_hook',
          address: webhookUrl,
        },
      });

      return response.data.id!;
    } catch (error) {
      this.logger.error(`Failed to setup calendar watch for user ${userId}:`, error);
      throw new Error('Failed to setup calendar notifications');
    }
  }

  /**
   * Get Google account for calendar access
   */
  private async getGoogleAccount(userId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: {
        userId,
        provider: AccountProvider.GOOGLE,
      },
    });

    if (!account || !account.accessToken) {
      throw new NotFoundException('Google account not connected');
    }

    return account;
  }

  /**
   * Create Google Calendar API client
   */
  private createCalendarClient(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    return google.calendar({ version: 'v3', auth });
  }

  /**
   * Extract meeting URL from event description
   * Supports Google Meet, Zoom, Teams, etc.
   */
  private extractMeetingUrl(description: string): string | undefined {
    const urlPatterns = [
      /https:\/\/meet\.google\.com\/[a-z-]+/i,
      /https:\/\/.*\.zoom\.us\/j\/\d+/i,
      /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\\s]+/i,
    ];

    for (const pattern of urlPatterns) {
      const match = description.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }
}
