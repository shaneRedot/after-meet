import { Controller, Get, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarService, CalendarEvent } from './calendar.service';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * Get upcoming calendar events
   */
  @Get('events')
  async getEvents(
    @Request() req,
    @Query('maxResults') maxResults?: number
  ): Promise<CalendarEvent[]> {
    return this.calendarService.getUpcomingEvents(
      req.user.userId, 
      maxResults ? parseInt(String(maxResults)) : 10
    );
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
