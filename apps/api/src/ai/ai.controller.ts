import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService, ContentImprovementRequest } from './ai.service';
import { ContentGenerationOptions } from './services/content-generation.service';

/**
 * AI Automation Controller
 * 
 * REST API endpoints for AI-powered content generation and automation features.
 * Handles user requests for intelligent content creation and optimization.
 * 
 * Key Endpoints:
 * - Content generation from meeting transcripts
 * - Content improvement and optimization
 * - AI service health monitoring
 * - User analytics and insights
 * - Batch processing for automation
 */
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  /**
   * Generate Content from Meeting
   * 
   * Frontend: User manually triggers AI content generation for a meeting
   * Used when automatic generation failed or user wants to regenerate content
   * 
   * Example Usage:
   * ```javascript
   * const response = await fetch(`/api/ai/meetings/${meetingId}/generate`, {
   *   method: 'POST',
   *   headers: { Authorization: `Bearer ${jwt}` },
   *   body: JSON.stringify({
   *     platforms: ['linkedin', 'facebook'],
   *     tone: 'professional'
   *   })
   * });
   * ```
   */
  @Post('meetings/:meetingId/generate')
  async generateContentFromMeeting(
    @Param('meetingId') meetingId: string,
    @Request() req,
    @Body() options?: ContentGenerationOptions,
  ) {
    return await this.aiService.processMeetingForContentGeneration(meetingId, options);
  }

  /**
   * Improve Existing Content
   * 
   * Frontend: AI-powered content enhancement for user-written posts
   * Provides suggestions and improved versions of draft content
   * 
   * Example Usage:
   * ```javascript
   * const response = await fetch(`/api/ai/posts/${postId}/improve`, {
   *   method: 'POST',
   *   body: JSON.stringify({
   *     content: "Just had a great meeting!",
   *     platform: "linkedin",
   *     improvements: ["add hashtags", "make more professional"]
   *   })
   * });
   * ```
   */
  @Post('posts/:postId/improve')
  async improveContent(
    @Param('postId') postId: string,
    @Request() req,
    @Body() improvementRequest: ContentImprovementRequest,
  ) {
    return await this.aiService.improveUserContent(postId, improvementRequest);
  }

  /**
   * Get User's AI Analytics
   * 
   * Frontend: Dashboard displaying AI content generation insights
   * Shows statistics about generated content, success rates, and recent activity
   */
  @Get('analytics')
  async getUserAnalytics(@Request() req) {
    const userId = req.user.id;
    return await this.aiService.getUserContentAnalytics(userId);
  }

  /**
   * Batch Process User's Meetings
   * 
   * Frontend: Process multiple meetings for content generation
   * Useful for bulk operations or catching up on missed meetings
   */
  @Post('batch-process')
  async batchProcessMeetings(
    @Body() options: {
      timeRange?: { start: string; end: string };
    },
    @Request() req,
  ) {
    const userId = req.user.id;
    const timeRange = options.timeRange ? {
      start: new Date(options.timeRange.start),
      end: new Date(options.timeRange.end),
    } : undefined;

    return await this.aiService.batchProcessMeetings(userId, timeRange);
  }

  /**
   * AI Service Health Check
   * 
   * Frontend: Monitor AI service availability and performance
   * Admin dashboard and troubleshooting endpoint
   */
  @Get('health')
  async getHealthStatus() {
    return await this.aiService.getHealthStatus();
  }

  /**
   * Internal: Process Meeting (Background Job Endpoint)
   * 
   * Used by background jobs for automated content generation
   * Called when meeting transcripts become available via webhooks
   * 
   * Not exposed to frontend - internal automation only
   */
  @Post('internal/process-meeting/:meetingId')
  @HttpCode(HttpStatus.OK)
  async internalProcessMeeting(
    @Param('meetingId') meetingId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.aiService.processMeetingForContentGeneration(meetingId);
      
      return {
        success: result.success,
        message: `Generated ${result.generated.length} posts with ${result.errors.length} errors`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Internal: Batch Process All Meetings
   * 
   * Background job endpoint for processing all pending meetings
   * Runs on schedule to catch up on any missed automation
   */
  @Post('internal/batch-process-all')
  @HttpCode(HttpStatus.OK)
  async internalBatchProcessAll(): Promise<{
    processed: number;
    successful: number;
    errors: string[];
  }> {
    return await this.aiService.batchProcessMeetings();
  }
}
