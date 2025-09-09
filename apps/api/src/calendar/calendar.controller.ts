import { Controller, Get, Param, UseGuards, Request, Query, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarService, CalendarEvent } from './calendar.service';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);
  
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * Get upcoming calendar events
   */
  @Get('events')
  async getEvents(
    @Request() req,
    @Query('maxResults') maxResults?: number
  ): Promise<CalendarEvent[]> {
    this.logger.log(`📅 Calendar events requested by user: ${req.user.userId || req.user.id}`);
    
    try {
      const userId = req.user.userId || req.user.id;
      const result = await this.calendarService.getUpcomingEvents(
        userId, 
        maxResults ? parseInt(String(maxResults)) : 10
      );
      this.logger.log(`✅ Successfully fetched ${result.length} calendar events`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Calendar controller error:`, error);
      throw error;
    }
  }

  /**
   * Get specific calendar event
   */
  @Get('events/:eventId')
  async getEvent(
    @Request() req,
    @Param('eventId') eventId: string
  ): Promise<CalendarEvent> {
    return this.calendarService.getEvent(req.user.userId, eventId);
  }
}
