export interface JobData {
  id: string;
  userId: string;
  meetingId?: string;
  type: string;
  data: any;
  createdAt: Date;
}

export interface MeetingBotJobData extends JobData {
  type: 'meeting-bot';
  data: {
    meetingId: string;
    scheduledTime: Date;
    botConfig?: {
      recordVideo: boolean;
      recordAudio: boolean;
      outputTranscription: boolean;
    };
  };
}

export interface ContentGenerationJobData extends JobData {
  type: 'content-generation';
  data: {
    meetingId: string;
    transcriptUrl: string;
    meetingTitle: string;
    meetingDuration: number;
    participants: string[];
    preferences?: {
      tone: string;
      platform: string[];
      contentType: string[];
    };
  };
}

export interface SocialPostingJobData extends JobData {
  type: 'social-posting';
  data: {
    socialPostId: string;
    platform: 'linkedin' | 'facebook';
    content: string;
    scheduledTime?: Date;
    autoPost: boolean;
  };
}

export interface CleanupJobData extends JobData {
  type: 'cleanup';
  data: {
    olderThan: Date;
    resources: ('bots' | 'transcripts' | 'social-posts' | 'temp-files')[];
  };
}
