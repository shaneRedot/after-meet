import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting, SocialPost, User } from '@after-meet/database';
import { OpenAIService } from './services/openai.service';
import { ContentGenerationService, ContentGenerationOptions, ContentGenerationResult } from './services/content-generation.service';

export interface AIHealthStatus {
  openai: {
    available: boolean;
    status: string;
    model: string;
  };
  contentGeneration: {
    enabled: boolean;
    totalProcessed: number;
    successRate: number;
  };
}

export interface ContentImprovementRequest {
  content: string;
  platform: 'linkedin' | 'facebook';
  improvements?: string[];
}

export interface ContentImprovementResult {
  originalContent: string;
  improvedContent: string;
  suggestions: string[];
  improvementScore: number;
}

/**
 * AI Automation Service
 * 
 * High-level orchestration service for AI-powered automation features.
 * Coordinates between OpenAI integration and content generation workflows.
 * 
 * Key Responsibilities:
 * - Meeting transcript processing automation
 * - Content generation workflow orchestration
 * - AI service health monitoring and fallback strategies
 * - User preference integration for personalized content
 * - Analytics and performance tracking for AI features
 * - Background job coordination for batch processing
 */
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    
    @InjectRepository(SocialPost)
    private readonly socialPostRepository: Repository<SocialPost>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    private readonly openaiService: OpenAIService,
    private readonly contentGenerationService: ContentGenerationService,
  ) {}

  /**
   * Process Meeting for Content Generation
   * 
   * Main entry point for automated content generation from meeting transcripts
   * Called by webhooks, background jobs, or manual triggers
   */
  async processMeetingForContentGeneration(
    meetingId: string,
    options?: ContentGenerationOptions
  ): Promise<ContentGenerationResult> {
    this.logger.log(`Processing meeting ${meetingId} for AI content generation`);

    try {
      const result = await this.contentGenerationService.generateContentFromMeeting(
        meetingId,
        options
      );

      // Log analytics for monitoring
      await this.logContentGenerationMetrics(meetingId, result);

      return result;

    } catch (error) {
      this.logger.error(`AI content generation failed for meeting ${meetingId}:`, error);
      throw error;
    }
  }

  /**
   * Improve User Content
   * 
   * AI-powered content enhancement for user-written posts
   * Provides suggestions and improved versions of existing content
   */
  async improveUserContent(
    postId: string,
    improvementRequest: ContentImprovementRequest
  ): Promise<ContentImprovementResult> {
    try {
      const improvement = await this.contentGenerationService.improveExistingContent(
        postId,
        improvementRequest.improvements || []
      );

      // Calculate improvement score based on content analysis
      const improvementScore = this.calculateImprovementScore(
        improvement.originalContent,
        improvement.improvedContent
      );

      return {
        ...improvement,
        improvementScore,
      };

    } catch (error) {
      this.logger.error(`Content improvement failed for post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Batch Process Meetings
   * 
   * Process multiple meetings for content generation in background jobs
   * Used for bulk operations and scheduled processing
   */
  async batchProcessMeetings(
    userId?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{ processed: number; successful: number; errors: string[] }> {
    const result = { processed: 0, successful: 0, errors: [] };

    try {
      // Find meetings that need processing
      const meetingsQuery = this.meetingRepository
        .createQueryBuilder('meeting')
        .where('meeting.transcript IS NOT NULL')
        .andWhere('meeting.transcript != :empty', { empty: '' });

      if (userId) {
        meetingsQuery.andWhere('meeting.userId = :userId', { userId });
      }

      if (timeRange) {
        meetingsQuery.andWhere('meeting.startTime BETWEEN :start AND :end', timeRange);
      }

      // Only process meetings that don't have generated social posts yet
      meetingsQuery.andWhere(`
        NOT EXISTS (
          SELECT 1 FROM social_posts sp 
          WHERE sp.meetingId = meeting.id 
          AND sp.automationId IS NOT NULL
        )
      `);

      const meetings = await meetingsQuery.getMany();
      this.logger.log(`Found ${meetings.length} meetings for batch processing`);

      // Process each meeting
      for (const meeting of meetings) {
        try {
          await this.processMeetingForContentGeneration(meeting.id);
          result.successful++;
        } catch (error) {
          const errorMsg = `Failed to process meeting ${meeting.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
        }
        result.processed++;

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      this.logger.log(`Batch processing completed: ${result.successful}/${result.processed} successful`);
      return result;

    } catch (error) {
      this.logger.error('Batch processing failed:', error);
      result.errors.push(`Batch processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Get AI Service Health Status
   * 
   * Comprehensive health check for all AI services and integrations
   * Used for monitoring and admin dashboards
   */
  async getHealthStatus(): Promise<AIHealthStatus> {
    try {
      // Check OpenAI service health
      const openaiHealth = await this.openaiService.healthCheck();

      // Get content generation statistics
      const contentStats = await this.getContentGenerationStats();

      return {
        openai: openaiHealth,
        contentGeneration: {
          enabled: openaiHealth.available,
          totalProcessed: contentStats.totalProcessed,
          successRate: contentStats.successRate,
        },
      };

    } catch (error) {
      this.logger.error('Health status check failed:', error);
      return {
        openai: {
          available: false,
          status: 'error',
          model: 'unknown',
        },
        contentGeneration: {
          enabled: false,
          totalProcessed: 0,
          successRate: 0,
        },
      };
    }
  }

  /**
   * Get User's AI Content Analytics
   * 
   * Provides insights into AI content generation for specific user
   */
  async getUserContentAnalytics(userId: string): Promise<{
    totalGenerated: number;
    platformBreakdown: Record<string, number>;
    avgConfidence: number;
    recentActivity: Array<{
      meetingId: string;
      meetingTitle: string;
      postsGenerated: number;
      generatedAt: Date;
    }>;
  }> {
    try {
      // Get user's social posts generated by AI
      const aiGeneratedPosts = await this.socialPostRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.meeting', 'meeting')
        .where('meeting.userId = :userId', { userId })
        .andWhere('post.automationId IS NOT NULL')
        .orderBy('post.createdAt', 'DESC')
        .limit(50)
        .getMany();

      // Calculate analytics
      const totalGenerated = aiGeneratedPosts.length;
      const platformBreakdown = aiGeneratedPosts.reduce((acc, post) => {
        acc[post.platform] = (acc[post.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by meeting for recent activity
      const activityMap = new Map();
      aiGeneratedPosts.forEach(post => {
        const key = post.meetingId;
        if (!activityMap.has(key)) {
          activityMap.set(key, {
            meetingId: post.meetingId,
            meetingTitle: post.meeting.title,
            postsGenerated: 0,
            generatedAt: post.createdAt,
          });
        }
        activityMap.get(key).postsGenerated++;
      });

      const recentActivity = Array.from(activityMap.values())
        .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
        .slice(0, 10);

      return {
        totalGenerated,
        platformBreakdown,
        avgConfidence: 0.85, // Placeholder - would calculate from actual confidence scores
        recentActivity,
      };

    } catch (error) {
      this.logger.error(`Failed to get analytics for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Private: Calculate Content Improvement Score
   */
  private calculateImprovementScore(original: string, improved: string): number {
    let score = 0.5; // Base score

    // Length optimization
    if (improved.length > original.length && improved.length <= 280) {
      score += 0.2;
    }

    // Hashtag addition
    const originalHashtags = (original.match(/#\w+/g) || []).length;
    const improvedHashtags = (improved.match(/#\w+/g) || []).length;
    if (improvedHashtags > originalHashtags) {
      score += 0.1;
    }

    // Readability improvements (simple heuristic)
    const originalSentences = original.split(/[.!?]+/).length;
    const improvedSentences = improved.split(/[.!?]+/).length;
    if (improvedSentences >= originalSentences && improved.length > original.length) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Private: Log Content Generation Metrics
   */
  private async logContentGenerationMetrics(
    meetingId: string,
    result: ContentGenerationResult
  ): Promise<void> {
    // Implementation would log to analytics service or database
    // For now, just log to console
    this.logger.log(`Content generation metrics - Meeting: ${meetingId}, Success: ${result.success}, Generated: ${result.generated.length}, Errors: ${result.errors.length}, Processing Time: ${result.processingTime}ms`);
  }

  /**
   * Private: Get Content Generation Statistics
   */
  private async getContentGenerationStats(): Promise<{
    totalProcessed: number;
    successRate: number;
  }> {
    try {
      const totalPosts = await this.socialPostRepository.count({
        where: { automationId: 'not-null' as any }
      });

      const successfulPosts = await this.socialPostRepository.count({
        where: { 
          automationId: 'not-null' as any,
          errorMessage: null as any
        }
      });

      return {
        totalProcessed: totalPosts,
        successRate: totalPosts > 0 ? successfulPosts / totalPosts : 0,
      };

    } catch (error) {
      this.logger.error('Failed to get content generation stats:', error);
      return {
        totalProcessed: 0,
        successRate: 0,
      };
    }
  }
}
