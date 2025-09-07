import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { 
  MeetingBotJobData, 
  ContentGenerationJobData, 
  SocialPostingJobData, 
  CleanupJobData 
} from './dto/job-data.dto';
import { QueueStatusDto, JobStatusDto, CreateJobDto } from './dto/queue-status.dto';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue('meeting-bot') private meetingBotQueue: Queue,
    @InjectQueue('content-generation') private contentGenerationQueue: Queue,
    @InjectQueue('social-posting') private socialPostingQueue: Queue,
    @InjectQueue('cleanup') private cleanupQueue: Queue,
  ) {}

  // Meeting Bot Jobs
  async scheduleMeetingBot(data: MeetingBotJobData): Promise<void> {
    const delay = data.data.scheduledTime.getTime() - Date.now();
    
    if (delay <= 0) {
      this.logger.warn(`Meeting ${data.data.meetingId} is in the past, scheduling immediately`);
    }

    await this.meetingBotQueue.add(
      'create-bot',
      data,
      {
        delay: Math.max(0, delay),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      }
    );

    this.logger.log(`Scheduled bot creation for meeting ${data.data.meetingId} at ${data.data.scheduledTime}`);
  }

  async cancelMeetingBot(meetingId: string): Promise<boolean> {
    const jobs = await this.meetingBotQueue.getJobs(['waiting', 'delayed']);
    
    for (const job of jobs) {
      if (job.data.data.meetingId === meetingId) {
        await job.remove();
        this.logger.log(`Cancelled bot creation for meeting ${meetingId}`);
        return true;
      }
    }
    
    return false;
  }

  // Content Generation Jobs
  async scheduleContentGeneration(data: ContentGenerationJobData, delay = 0): Promise<void> {
    await this.contentGenerationQueue.add(
      'generate-content',
      data,
      {
        delay,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: 20,
        removeOnFail: 10,
      }
    );

    this.logger.log(`Scheduled content generation for meeting ${data.data.meetingId}`);
  }

  // Social Posting Jobs
  async scheduleSocialPost(data: SocialPostingJobData): Promise<void> {
    const delay = data.data.scheduledTime 
      ? data.data.scheduledTime.getTime() - Date.now()
      : 0;

    await this.socialPostingQueue.add(
      'post-content',
      data,
      {
        delay: Math.max(0, delay),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 20,
      }
    );

    this.logger.log(`Scheduled social post ${data.data.socialPostId} for ${data.data.platform}`);
  }

  async cancelSocialPost(socialPostId: string): Promise<boolean> {
    const jobs = await this.socialPostingQueue.getJobs(['waiting', 'delayed']);
    
    for (const job of jobs) {
      if (job.data.data.socialPostId === socialPostId) {
        await job.remove();
        this.logger.log(`Cancelled social post ${socialPostId}`);
        return true;
      }
    }
    
    return false;
  }

  // Cleanup Jobs
  async scheduleCleanup(data: CleanupJobData): Promise<void> {
    await this.cleanupQueue.add(
      'cleanup-resources',
      data,
      {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 30000,
        },
        removeOnComplete: 5,
        removeOnFail: 5,
      }
    );

    this.logger.log(`Scheduled cleanup for resources: ${data.data.resources.join(', ')}`);
  }

  // Queue Management
  async getQueueStatus(queueName: string): Promise<QueueStatusDto> {
    const queue = this.getQueue(queueName);
    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();
    const delayed = await queue.getDelayed();

    return {
      name: queueName,
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: await queue.isPaused(),
    };
  }

  async getAllQueueStatuses(): Promise<QueueStatusDto[]> {
    const queueNames = ['meeting-bot', 'content-generation', 'social-posting', 'cleanup'];
    return Promise.all(queueNames.map(name => this.getQueueStatus(name)));
  }

  async getJobs(queueName: string, types: any[] = ['waiting', 'active', 'completed', 'failed']): Promise<JobStatusDto[]> {
    const queue = this.getQueue(queueName);
    const jobs = await queue.getJobs(types as any);

    return jobs.map(job => ({
      id: job.id.toString(),
      name: job.name,
      data: job.data,
      progress: job.progress(),
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      delay: job.opts.delay,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
      opts: {
        attempts: job.opts.attempts,
        delay: job.opts.delay,
        repeat: job.opts.repeat,
      },
    }));
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.log(`Paused queue: ${queueName}`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.log(`Resumed queue: ${queueName}`);
  }

  async cleanQueue(queueName: string, grace = 5000): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
    this.logger.log(`Cleaned queue: ${queueName}`);
  }

  async retryFailedJobs(queueName: string): Promise<number> {
    const queue = this.getQueue(queueName);
    const failedJobs = await queue.getFailed();
    
    let retried = 0;
    for (const job of failedJobs) {
      await job.retry();
      retried++;
    }
    
    this.logger.log(`Retried ${retried} failed jobs in queue: ${queueName}`);
    return retried;
  }

  // Generic job creation
  async createJob(queueName: string, jobData: CreateJobDto): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.add(jobData.name, jobData.data, jobData.options as any);
    this.logger.log(`Created job ${jobData.name} in queue ${queueName}`);
  }

  private getQueue(queueName: string): Queue {
    switch (queueName) {
      case 'meeting-bot':
        return this.meetingBotQueue;
      case 'content-generation':
        return this.contentGenerationQueue;
      case 'social-posting':
        return this.socialPostingQueue;
      case 'cleanup':
        return this.cleanupQueue;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
  }
}
