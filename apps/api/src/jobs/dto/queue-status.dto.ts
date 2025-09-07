export interface QueueStatusDto {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface JobStatusDto {
  id: string;
  name: string;
  data: any;
  progress: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  delay?: number;
  timestamp: number;
  attemptsMade: number;
  opts: {
    attempts: number;
    delay: number;
    repeat?: any;
  };
}

export interface CreateJobDto {
  name: string;
  data: any;
  options?: {
    delay?: number;
    attempts?: number;
    repeat?: {
      cron?: string;
      every?: number;
      limit?: number;
    };
    priority?: number;
  };
}

export interface BulkJobDto {
  jobs: CreateJobDto[];
  queueName: string;
}
