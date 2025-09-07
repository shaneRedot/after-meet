import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { QueueStatusDto, CreateJobDto, BulkJobDto } from './dto/queue-status.dto';
import { 
  MeetingBotJobData, 
  ContentGenerationJobData, 
  SocialPostingJobData, 
  CleanupJobData 
} from './dto/job-data.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Queue Status Endpoints
  @Get('queues')
  async getAllQueueStatuses(): Promise<QueueStatusDto[]> {
    return this.jobsService.getAllQueueStatuses();
  }

  @Get('queues/:queueName')
  async getQueueStatus(@Param('queueName') queueName: string): Promise<QueueStatusDto> {
    return this.jobsService.getQueueStatus(queueName);
  }

  @Get('queues/:queueName/jobs')
  async getQueueJobs(
    @Param('queueName') queueName: string,
    @Query('types') types?: string,
  ) {
    const jobTypes = types ? types.split(',') : undefined;
    return this.jobsService.getJobs(queueName, jobTypes);
  }

  // Queue Management
  @Put('queues/:queueName/pause')
  async pauseQueue(@Param('queueName') queueName: string): Promise<{ message: string }> {
    await this.jobsService.pauseQueue(queueName);
    return { message: `Queue ${queueName} paused successfully` };
  }

  @Put('queues/:queueName/resume')
  async resumeQueue(@Param('queueName') queueName: string): Promise<{ message: string }> {
    await this.jobsService.resumeQueue(queueName);
    return { message: `Queue ${queueName} resumed successfully` };
  }

  @Delete('queues/:queueName/clean')
  async cleanQueue(
    @Param('queueName') queueName: string,
    @Query('grace') grace?: string,
  ): Promise<{ message: string }> {
    const graceMs = grace ? parseInt(grace) : 5000;
    await this.jobsService.cleanQueue(queueName, graceMs);
    return { message: `Queue ${queueName} cleaned successfully` };
  }

  @Post('queues/:queueName/retry-failed')
  async retryFailedJobs(@Param('queueName') queueName: string): Promise<{ retriedCount: number }> {
    const retriedCount = await this.jobsService.retryFailedJobs(queueName);
    return { retriedCount };
  }

  // Job Creation Endpoints
  @Post('meeting-bot')
  async scheduleMeetingBot(@Body() data: MeetingBotJobData): Promise<{ message: string }> {
    await this.jobsService.scheduleMeetingBot(data);
    return { message: 'Meeting bot scheduled successfully' };
  }

  @Delete('meeting-bot/:meetingId')
  async cancelMeetingBot(@Param('meetingId') meetingId: string): Promise<{ cancelled: boolean }> {
    const cancelled = await this.jobsService.cancelMeetingBot(meetingId);
    return { cancelled };
  }

  @Post('content-generation')
  async scheduleContentGeneration(
    @Body() data: ContentGenerationJobData,
    @Query('delay') delay?: string,
  ): Promise<{ message: string }> {
    const delayMs = delay ? parseInt(delay) : 0;
    await this.jobsService.scheduleContentGeneration(data, delayMs);
    return { message: 'Content generation scheduled successfully' };
  }

  @Post('social-posting')
  async scheduleSocialPost(@Body() data: SocialPostingJobData): Promise<{ message: string }> {
    await this.jobsService.scheduleSocialPost(data);
    return { message: 'Social post scheduled successfully' };
  }

  @Delete('social-posting/:socialPostId')
  async cancelSocialPost(@Param('socialPostId') socialPostId: string): Promise<{ cancelled: boolean }> {
    const cancelled = await this.jobsService.cancelSocialPost(socialPostId);
    return { cancelled };
  }

  @Post('cleanup')
  async scheduleCleanup(@Body() data: CleanupJobData): Promise<{ message: string }> {
    await this.jobsService.scheduleCleanup(data);
    return { message: 'Cleanup scheduled successfully' };
  }

  // Generic Job Creation
  @Post(':queueName')
  async createJob(
    @Param('queueName') queueName: string,
    @Body() jobData: CreateJobDto,
  ): Promise<{ message: string }> {
    await this.jobsService.createJob(queueName, jobData);
    return { message: `Job created in queue ${queueName}` };
  }

  @Post('bulk')
  async createBulkJobs(@Body() bulkJobData: BulkJobDto): Promise<{ message: string; count: number }> {
    for (const job of bulkJobData.jobs) {
      await this.jobsService.createJob(bulkJobData.queueName, job);
    }
    return { 
      message: `${bulkJobData.jobs.length} jobs created in queue ${bulkJobData.queueName}`,
      count: bulkJobData.jobs.length,
    };
  }
}
