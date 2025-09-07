import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CleanupJobData } from '../dto/job-data.dto';

@Processor('cleanup')
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  @Process('cleanup-resources')
  async handleResourceCleanup(job: Job<CleanupJobData>): Promise<void> {
    const { data } = job.data;
    this.logger.log(`Starting cleanup for resources: ${data.resources.join(', ')}`);

    try {
      await job.progress(25);

      const results = {
        bots: 0,
        transcripts: 0,
        socialPosts: 0,
        tempFiles: 0,
        errors: [] as string[],
      };

      // Simulate cleanup operations
      if (data.resources.includes('bots')) {
        this.logger.log('Cleaning up old bots...');
        results.bots = 5; // Simulated count
      }

      await job.progress(50);

      if (data.resources.includes('transcripts')) {
        this.logger.log('Cleaning up old transcripts...');
        results.transcripts = 10; // Simulated count
      }

      await job.progress(75);

      if (data.resources.includes('social-posts')) {
        this.logger.log('Cleaning up old social posts...');
        results.socialPosts = 3; // Simulated count
      }

      if (data.resources.includes('temp-files')) {
        this.logger.log('Cleaning up temporary files...');
        results.tempFiles = 20; // Simulated count
      }

      await job.progress(100);

      this.logger.log('Cleanup completed:', results);

    } catch (error) {
      this.logger.error('Cleanup operation failed:', error);
      throw error;
    }
  }

  @Process('cleanup-failed-jobs')
  async handleFailedJobsCleanup(job: Job<{ maxAge: number }>): Promise<void> {
    const { maxAge } = job.data;
    this.logger.log(`Cleaning up failed jobs older than ${maxAge} hours`);

    try {
      await job.progress(50);

      const cutoffTime = new Date(Date.now() - maxAge * 60 * 60 * 1000);
      this.logger.log(`Would clean failed jobs older than ${cutoffTime}`);
      
      await job.progress(100);

      this.logger.log(`Failed jobs cleanup completed`);

    } catch (error) {
      this.logger.error('Failed jobs cleanup failed:', error);
      throw error;
    }
  }

  @Process('cleanup-user-data')
  async handleUserDataCleanup(job: Job<{ userId: string }>): Promise<void> {
    const { userId } = job.data;
    this.logger.log(`Cleaning up data for user ${userId}`);

    try {
      await job.progress(33);
      this.logger.log(`Would clean meetings for user ${userId}`);

      await job.progress(66);
      this.logger.log(`Would clean social posts for user ${userId}`);

      await job.progress(100);
      this.logger.log(`User data cleanup completed for user ${userId}`);

    } catch (error) {
      this.logger.error(`User data cleanup failed for user ${userId}:`, error);
      throw error;
    }
  }
}
