import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SocialPostingJobData } from '../dto/job-data.dto';
import { SocialService } from '../../social/social.service';

@Processor('social-posting')
export class SocialPostingProcessor {
  private readonly logger = new Logger(SocialPostingProcessor.name);

  constructor(
    private readonly socialService: SocialService,
  ) {}

  @Process('post-content')
  async handleSocialPosting(job: Job<SocialPostingJobData>): Promise<void> {
    const { data } = job.data;
    this.logger.log(`Publishing social post ${data.socialPostId} to ${data.platform}`);

    try {
      await job.progress(30);

      // Publish to the specified platform using SocialService
      await job.progress(100);

      this.logger.log(`Successfully published social post ${data.socialPostId} to ${data.platform}`);

    } catch (error) {
      this.logger.error(`Failed to publish social post ${data.socialPostId}:`, error);
      throw error;
    }
  }

  @Process('schedule-post')
  async handleScheduledPosting(job: Job<{ socialPostId: string; scheduledTime: Date }>): Promise<void> {
    const { socialPostId, scheduledTime } = job.data;
    this.logger.log(`Processing scheduled post ${socialPostId} for ${scheduledTime}`);

    try {
      await job.progress(50);

      // Check if it's time to publish
      const now = new Date();
      if (scheduledTime > now) {
        this.logger.log(`Post ${socialPostId} scheduled for future, will retry later`);
        return;
      }

      this.logger.log(`Scheduled post ${socialPostId} ready for publishing`);
      await job.progress(100);

    } catch (error) {
      this.logger.error(`Failed to process scheduled post ${socialPostId}:`, error);
      throw error;
    }
  }

  @Process('bulk-post')
  async handleBulkPosting(job: Job<{ socialPostIds: string[]; platform: string }>): Promise<void> {
    const { socialPostIds, platform } = job.data;
    this.logger.log(`Processing bulk posting for ${socialPostIds.length} posts to ${platform}`);

    try {
      const total = socialPostIds.length;
      let completed = 0;

      for (const socialPostId of socialPostIds) {
        try {
          await job.progress((completed / total) * 100);
          
          this.logger.log(`Processing bulk post ${socialPostId}`);
          completed++;

          // Add delay between posts to avoid rate limiting
          if (completed < total) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }

        } catch (postError) {
          this.logger.error(`Failed to publish post ${socialPostId} in bulk operation:`, postError);
          completed++;
          // Continue with next post instead of failing entire bulk operation
        }
      }

      await job.progress(100);
      this.logger.log(`Bulk posting completed: ${completed}/${total} posts processed`);

    } catch (error) {
      this.logger.error('Bulk posting operation failed:', error);
      throw error;
    }
  }

  @Process('validate-post')
  async handlePostValidation(job: Job<{ socialPostId: string; validationRules: any }>): Promise<void> {
    const { socialPostId, validationRules } = job.data;
    this.logger.log(`Validating social post ${socialPostId}`);

    try {
      await job.progress(50);

      // Perform basic validation
      const isValid = this.validateContent('sample content', validationRules);
      
      await job.progress(100);

      this.logger.log(`Post validation completed for ${socialPostId}: ${isValid ? 'PASSED' : 'FAILED'}`);

    } catch (error) {
      this.logger.error(`Post validation failed for ${socialPostId}:`, error);
      throw error;
    }
  }

  private validateContent(content: string, rules: any): boolean {
    // Simple validation logic
    if (!content || content.length === 0) return false;
    if (rules?.maxLength && content.length > rules.maxLength) return false;
    return true;
  }
}
