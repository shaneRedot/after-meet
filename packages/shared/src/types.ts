import { z } from 'zod';

/**
 * API Response Types
 * 
 * Standard response format for all API endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination Types
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Calendar Event Types
 * 
 * Represents a Google Calendar event with extracted meeting information
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  attendees?: Array<{
    email: string;
    name?: string;
    status?: 'accepted' | 'declined' | 'tentative';
  }>;
  meetingUrl?: string;
  platform?: 'zoom' | 'teams' | 'meet';
  location?: string;
}

/**
 * Recall.ai Bot Types
 */
export interface RecallBot {
  id: string;
  meeting_url: string;
  bot_name: string;
  status: 'joining_call' | 'in_call' | 'done' | 'call_ended' | 'error';
  recording_status?: 'recording' | 'recording_finished' | 'processing';
  transcript_status?: 'processing' | 'done';
}

export interface RecallTranscript {
  id: string;
  bot_id: string;
  status: 'processing' | 'done';
  transcript_url?: string;
  content?: Array<{
    speaker: string;
    text: string;
    timestamp: number;
  }>;
}

/**
 * Social Media Posting Types
 */
export interface SocialMediaPost {
  platform: 'linkedin' | 'facebook';
  content: string;
  scheduledAt?: Date;
}

export interface LinkedInPostResponse {
  id: string;
  shareUrl: string;
}

export interface FacebookPostResponse {
  id: string;
  post_id: string;
}

/**
 * AI Generation Types
 */
export interface AIGenerationRequest {
  transcript: string;
  platform: 'linkedin' | 'facebook';
  prompt: string;
  maxTokens?: number;
}

export interface AIGenerationResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

/**
 * Validation Schemas using Zod
 */
export const MeetingCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  meetingUrl: z.string().url().optional(),
  platform: z.enum(['zoom', 'teams', 'meet']),
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    status: z.enum(['accepted', 'declined', 'tentative']).optional(),
  })).optional(),
  recallEnabled: z.boolean().default(false),
});

export const AutomationCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  platform: z.enum(['linkedin', 'facebook']),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  isActive: z.boolean().default(true),
  priority: z.number().min(0).default(0),
});

export const UserSettingsUpdateSchema = z.object({
  botJoinMinutesBefore: z.number().min(1).max(15).default(5),
  autoGeneratePosts: z.boolean().default(true),
  timezone: z.string().default('UTC'),
  notifications: z.object({
    email: z.boolean(),
    meetingCompleted: z.boolean(),
    postGenerated: z.boolean(),
    botFailed: z.boolean(),
  }).optional(),
});

/**
 * Type helpers for validation
 */
export type MeetingCreateInput = z.infer<typeof MeetingCreateSchema>;
export type AutomationCreateInput = z.infer<typeof AutomationCreateSchema>;
export type UserSettingsUpdateInput = z.infer<typeof UserSettingsUpdateSchema>;

/**
 * Utility Types
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
