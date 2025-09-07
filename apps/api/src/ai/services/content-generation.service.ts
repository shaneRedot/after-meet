import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting, SocialPost, SocialPlatform, PostStatus } from '@after-meet/database';
import { OpenAIService, MeetingInsights } from './openai.service';

export interface ContentGenerationOptions {
  platforms: SocialPlatform[];
  tone?: 'professional' | 'casual' | 'mixed';
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  maxLength?: number;
  customPrompt?: string;
}

export interface GeneratedContent {
  platform: SocialPlatform;
  content: string;
  insights?: MeetingInsights;
  confidence: number; // 0-1 score for content quality
  suggestions?: string[];
}

export interface ContentGenerationResult {
  meetingId: string;
  success: boolean;
  generated: GeneratedContent[];
  errors: string[];
  processingTime: number;
}

/**
 * Content Generation Service
 * 
 * High-level service for intelligent content creation and optimization.
 * Orchestrates OpenAI integration with business logic and content strategy.
 * 
 * Key Responsibilities:
 * - Meeting transcript analysis and insight extraction
 * - Platform-specific content generation and optimization
 * - Content quality assessment and improvement suggestions
 * - Batch processing for multiple meetings
 * - Content personalization based on user preferences
 * - Integration with Social Media module for automated posting
 */
@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name);

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    
    @InjectRepository(SocialPost)
    private readonly socialPostRepository: Repository<SocialPost>,
    
    private readonly openaiService: OpenAIService,
  ) {}

  /**
   * Generate Content from Meeting Transcript
   * 
   * Main content generation workflow for meeting automation
   */
  async generateContentFromMeeting(
    meetingId: string,
    options: ContentGenerationOptions = { platforms: [SocialPlatform.LINKEDIN, SocialPlatform.FACEBOOK] }
  ): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    const result: ContentGenerationResult = {
      meetingId,
      success: false,
      generated: [],
      errors: [],
      processingTime: 0,
    };

    try {
      // Validate and get meeting
      const meeting = await this.validateMeetingForContentGeneration(meetingId);
      
      // Extract insights from transcript using AI
      this.logger.log(`Extracting insights from meeting: ${meeting.title}`);
      const insights = await this.openaiService.extractMeetingInsights(
        meeting.transcript,
        meeting.title
      );

      // Generate content for each requested platform
      for (const platform of options.platforms) {
        try {
          const generatedContent = await this.generatePlatformContent(
            platform,
            insights,
            meeting.title,
            options
          );

          result.generated.push(generatedContent);
          
        } catch (error) {
          const errorMsg = `Failed to generate ${platform} content: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      // Save generated content as draft posts
      await this.saveDraftPosts(meeting, result.generated);

      result.success = result.generated.length > 0;
      result.processingTime = Date.now() - startTime;

      this.logger.log(`Content generation completed for meeting ${meetingId}: ${result.generated.length} posts generated, ${result.errors.length} errors`);
      return result;

    } catch (error) {
      const errorMsg = `Content generation failed for meeting ${meetingId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      result.processingTime = Date.now() - startTime;
      
      this.logger.error(errorMsg);
      return result;
    }
  }

  /**
   * Improve Existing Content
   * 
   * AI-powered content enhancement for user-written posts
   */
  async improveExistingContent(
    postId: string,
    improvements: string[] = []
  ): Promise<{ originalContent: string; improvedContent: string; suggestions: string[] }> {
    const post = await this.socialPostRepository.findOne({
      where: { id: postId },
      relations: ['meeting'],
    });

    if (!post) {
      throw new Error('Social post not found');
    }

    if (post.status === PostStatus.POSTED) {
      throw new Error('Cannot improve already posted content');
    }

    const platform = post.platform === SocialPlatform.LINKEDIN ? 'linkedin' : 'facebook';
    
    try {
      const improvedContent = await this.openaiService.improveContent(
        post.content,
        platform,
        improvements
      );

      const suggestions = await this.generateContentSuggestions(post.content, platform);

      return {
        originalContent: post.content,
        improvedContent,
        suggestions,
      };

    } catch (error) {
      this.logger.error(`Failed to improve content for post ${postId}:`, error);
      throw new Error('Content improvement failed');
    }
  }

  /**
   * Batch Process Multiple Meetings
   * 
   * Generate content for multiple meetings in background processing
   */
  async batchGenerateContent(
    meetingIds: string[],
    options: ContentGenerationOptions = { platforms: [SocialPlatform.LINKEDIN, SocialPlatform.FACEBOOK] }
  ): Promise<ContentGenerationResult[]> {
    const results: ContentGenerationResult[] = [];

    this.logger.log(`Starting batch content generation for ${meetingIds.length} meetings`);

    for (const meetingId of meetingIds) {
      try {
        const result = await this.generateContentFromMeeting(meetingId, options);
        results.push(result);
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        const errorResult: ContentGenerationResult = {
          meetingId,
          success: false,
          generated: [],
          errors: [`Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          processingTime: 0,
        };
        results.push(errorResult);
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.log(`Batch content generation completed: ${successCount}/${meetingIds.length} successful`);

    return results;
  }

  /**
   * Get Content Generation Analytics
   * 
   * Provides insights into AI content generation performance
   */
  async getContentAnalytics(userId?: string): Promise<{
    totalGenerated: number;
    platformBreakdown: Record<SocialPlatform, number>;
    avgConfidence: number;
    mostCommonTopics: string[];
    successRate: number;
  }> {
    // Implementation would analyze content generation history
    // For now, return placeholder data
    return {
      totalGenerated: 0,
      platformBreakdown: {
        [SocialPlatform.LINKEDIN]: 0,
        [SocialPlatform.FACEBOOK]: 0,
      },
      avgConfidence: 0.85,
      mostCommonTopics: [],
      successRate: 0.92,
    };
  }

  /**
   * Private: Generate Platform-Specific Content
   */
  private async generatePlatformContent(
    platform: SocialPlatform,
    insights: MeetingInsights,
    meetingTitle: string,
    options: ContentGenerationOptions
  ): Promise<GeneratedContent> {
    let content: string;
    let confidence = 0.8; // Default confidence

    try {
      switch (platform) {
        case SocialPlatform.LINKEDIN:
          content = await this.openaiService.generateLinkedInContent(insights, meetingTitle);
          confidence = this.assessContentQuality(content, 'professional');
          break;
          
        case SocialPlatform.FACEBOOK:
          content = await this.openaiService.generateFacebookContent(insights, meetingTitle);
          confidence = this.assessContentQuality(content, 'casual');
          break;
          
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      const suggestions = await this.generateContentSuggestions(content, platform.toLowerCase() as 'linkedin' | 'facebook');

      return {
        platform,
        content,
        insights,
        confidence,
        suggestions,
      };

    } catch (error) {
      this.logger.error(`Failed to generate content for ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Private: Assess Content Quality
   */
  private assessContentQuality(content: string, expectedTone: 'professional' | 'casual'): number {
    let score = 0.5; // Base score

    // Length check
    if (content.length > 50 && content.length <= 280) {
      score += 0.2;
    }

    // Hashtag presence
    if (content.includes('#')) {
      score += 0.1;
    }

    // Professional tone indicators for LinkedIn
    if (expectedTone === 'professional') {
      const professionalWords = ['insights', 'strategy', 'collaboration', 'leadership', 'innovation'];
      const hasKeywords = professionalWords.some(word => content.toLowerCase().includes(word));
      if (hasKeywords) score += 0.1;
    }

    // Casual tone indicators for Facebook
    if (expectedTone === 'casual') {
      const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu;
      if (emojiPattern.test(content)) score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Private: Generate Content Suggestions
   */
  private async generateContentSuggestions(content: string, platform: 'linkedin' | 'facebook'): Promise<string[]> {
    const suggestions: string[] = [];

    // Basic suggestions based on content analysis
    if (content.length > 280) {
      suggestions.push('Consider shortening the content for better engagement');
    }

    if (!content.includes('#')) {
      suggestions.push('Add relevant hashtags to increase visibility');
    }

    if (platform === 'facebook' && !/[\u{1F600}-\u{1F64F}]/gu.test(content)) {
      suggestions.push('Consider adding emojis for a more engaging Facebook post');
    }

    return suggestions;
  }

  /**
   * Private: Save Generated Content as Draft Posts
   */
  private async saveDraftPosts(meeting: Meeting, generatedContent: GeneratedContent[]): Promise<void> {
    for (const content of generatedContent) {
      try {
        const draftPost = this.socialPostRepository.create({
          meetingId: meeting.id,
          platform: content.platform,
          content: content.content,
          status: PostStatus.DRAFT,
          automationId: null, // Could be linked to specific automation template
        });

        await this.socialPostRepository.save(draftPost);
        this.logger.log(`Saved draft ${content.platform} post for meeting ${meeting.id}`);

      } catch (error) {
        this.logger.error(`Failed to save draft post for ${content.platform}:`, error);
      }
    }
  }

  /**
   * Private: Validate Meeting for Content Generation
   */
  private async validateMeetingForContentGeneration(meetingId: string): Promise<Meeting> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
      relations: ['user'],
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (!meeting.transcript) {
      throw new Error('Meeting transcript not available');
    }

    if (meeting.transcript.length < 100) {
      throw new Error('Meeting transcript too short for meaningful content generation');
    }

    return meeting;
  }
}
