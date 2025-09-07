import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ContentGenerationJobData } from '../dto/job-data.dto';
import { AIService } from '../../ai/ai.service';
import { MeetingsService } from '../../meetings/meetings.service';
import { SocialService } from '../../social/social.service';

@Processor('content-generation')
export class ContentGenerationProcessor {
  private readonly logger = new Logger(ContentGenerationProcessor.name);

  constructor(
    private readonly aiService: AIService,
    private readonly meetingsService: MeetingsService,
    private readonly socialService: SocialService,
  ) {}

  @Process('generate-content')
  async handleContentGeneration(job: Job<ContentGenerationJobData>): Promise<void> {
    const { data } = job.data;
    this.logger.log(`Generating content for meeting ${data.meetingId}`);

    try {
      await job.progress(10);

      // Get meeting details
      const meeting = await this.meetingsService.getMeetingById(job.data.userId, data.meetingId);
      if (!meeting) {
        throw new Error(`Meeting ${data.meetingId} not found`);
      }

      await job.progress(20);

      // Check if transcript is available
      if (!data.transcriptUrl) {
        throw new Error(`No transcript available for meeting ${data.meetingId}`);
      }

      await job.progress(30);

      // Generate content using AI service
      const contentResults = await this.aiService.processMeetingForContentGeneration(data.meetingId);

      await job.progress(70);

      // Log content generation completion (Social post creation would be handled separately)
      this.logger.log(`Content generated for meeting ${data.meetingId}`);

      await job.progress(90);

      // Update meeting with content generation status
      // Note: Would need to extend MeetingsService with content generation status methods
      this.logger.log(`Content generation completed for meeting ${data.meetingId}`);

      await job.progress(100);

    } catch (error) {
      this.logger.error(`Content generation failed for meeting ${data.meetingId}:`, error);
      
      // Update meeting with error status
      try {
        // Note: Would need to extend MeetingsService with error handling methods
        this.logger.error(`Content generation failed for meeting ${data.meetingId}:`, error);
      } catch (updateError) {
        this.logger.error('Failed to update meeting with content generation error:', updateError);
      }
      
      throw error;
    }
  }

  @Process('regenerate-content')
  async handleContentRegeneration(job: Job<ContentGenerationJobData & { previousContentId: string }>): Promise<void> {
    const { data, previousContentId } = job.data;
    this.logger.log(`Regenerating content for meeting ${data.meetingId}`);

    try {
      await job.progress(20);

      // Generate new content with AI service
      const contentResults = await this.aiService.processMeetingForContentGeneration(data.meetingId);

      await job.progress(100);

      this.logger.log(`Content regeneration completed for meeting ${data.meetingId}`);

    } catch (error) {
      this.logger.error(`Content regeneration failed for meeting ${data.meetingId}:`, error);
      throw error;
    }
  }

  @Process('content-optimization')
  async handleContentOptimization(job: Job<{ contentId: string; optimizationType: string; parameters: any }>): Promise<void> {
    const { contentId, optimizationType, parameters } = job.data;
    this.logger.log(`Optimizing content ${contentId} with type ${optimizationType}`);

    try {
      await job.progress(20);

      // Use AI service to improve content
      const result = await this.aiService.improveUserContent(
        'user123', // placeholder userId
        {
          content: 'placeholder content',
          platform: 'linkedin',
          improvements: [optimizationType],
        }
      );

      await job.progress(100);

      this.logger.log(`Content optimization completed for ${contentId}`);

    } catch (error) {
      this.logger.error(`Content optimization failed for ${contentId}:`, error);
      throw error;
    }
  }
}
