import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialPost, Meeting, Account, User, SocialPlatform, PostStatus, AccountProvider } from '@after-meet/database';
import { LinkedInService } from './services/linkedin.service';
import { FacebookService } from './services/facebook.service';

export interface CreateSocialPostDto {
  content: string;
  platforms: SocialPlatform[];
  meetingId?: string;
}

export interface UpdateSocialPostDto {
  content?: string;
  status?: PostStatus;
}

export interface SocialPostResult {
  platform: SocialPlatform;
  success: boolean;
  postId?: string;
  error?: string;
}

export interface ContentGenerationResult {
  linkedinPost?: SocialPost;
  facebookPost?: SocialPost;
  errors: string[];
}

/**
 * Social Media Service
 * 
 * Core business logic for social media posting and content management.
 * Handles the "automatically post to LinkedIn and Facebook" requirement.
 * 
 * Key Responsibilities:
 * - Content formatting per platform (LinkedIn professional, Facebook casual)
 * - Platform-specific API integration
 * - Draft creation and approval workflow
 * - Automated content generation from meeting transcripts
 */
@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    @InjectRepository(SocialPost)
    private readonly socialPostRepository: Repository<SocialPost>,
    
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    private readonly linkedinService: LinkedInService,
    private readonly facebookService: FacebookService,
  ) {}

  /**
   * Get Meeting's Social Posts
   * 
   * Frontend dashboard display of social media posts for a specific meeting
   */
  async getMeetingSocialPosts(meetingId: string): Promise<SocialPost[]> {
    return await this.socialPostRepository.find({
      where: { meetingId },
      relations: ['meeting'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get Social Post by ID
   */
  async getSocialPostById(postId: string): Promise<SocialPost> {
    const post = await this.socialPostRepository.findOne({
      where: { id: postId },
      relations: ['meeting'],
    });

    if (!post) {
      throw new NotFoundException('Social post not found');
    }

    return post;
  }

  /**
   * Update Social Post
   * 
   * Edit content or change status
   */
  async updateSocialPost(
    postId: string,
    updateDto: UpdateSocialPostDto
  ): Promise<SocialPost> {
    const post = await this.getSocialPostById(postId);

    // Don't allow editing already posted content
    if (post.status === PostStatus.POSTED) {
      throw new BadRequestException('Cannot edit already posted content');
    }

    // Update allowed fields
    if (updateDto.content !== undefined) {
      post.content = updateDto.content;
    }

    if (updateDto.status !== undefined) {
      post.status = updateDto.status;
    }

    return await this.socialPostRepository.save(post);
  }

  /**
   * Publish Social Post to Platform
   * 
   * Requirement: "automatically post to LinkedIn and Facebook"
   * Handles actual posting to social media platforms
   */
  async publishSocialPost(postId: string): Promise<SocialPostResult> {
    const post = await this.socialPostRepository.findOne({
      where: { id: postId },
      relations: ['meeting', 'meeting.user'],
    });

    if (!post) {
      throw new NotFoundException('Social post not found');
    }

    if (post.status === PostStatus.POSTED) {
      throw new BadRequestException('Post already published');
    }

    const userId = post.meeting.userId;

    try {
      let result: SocialPostResult;

      // Platform-specific posting
      switch (post.platform) {
        case SocialPlatform.LINKEDIN:
          result = await this.publishToLinkedIn(userId, post);
          break;
          
        case SocialPlatform.FACEBOOK:
          result = await this.publishToFacebook(userId, post);
          break;
          
        default:
          throw new BadRequestException(`Unsupported platform: ${post.platform}`);
      }

      // Update post status based on result
      if (result.success) {
        await this.socialPostRepository.update(postId, {
          status: PostStatus.POSTED,
          platformPostId: result.postId,
          postedAt: new Date(),
        });
      } else {
        await this.socialPostRepository.update(postId, {
          status: PostStatus.FAILED,
          errorMessage: result.error,
        });
      }

      this.logger.log(`Published post ${postId} to ${post.platform}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      return result;

    } catch (error) {
      // Update post with error status
      await this.socialPostRepository.update(postId, {
        status: PostStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      this.logger.error(`Failed to publish post ${postId}:`, error);
      throw new BadRequestException('Failed to publish social post');
    }
  }

  /**
   * Delete Social Post
   * 
   * Remove draft or failed posts
   */
  async deleteSocialPost(postId: string): Promise<void> {
    const post = await this.getSocialPostById(postId);

    // Don't allow deleting already posted content
    if (post.status === PostStatus.POSTED) {
      throw new BadRequestException('Cannot delete already posted content');
    }

    await this.socialPostRepository.remove(post);
    this.logger.log(`Deleted social post ${postId}`);
  }

  /**
   * Generate Social Posts from Meeting Transcript
   * 
   * Core automation feature: AI content generation from meeting transcripts
   * Called automatically when meeting transcript becomes available
   */
  async generatePostsFromMeeting(meetingId: string): Promise<ContentGenerationResult> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
      relations: ['user'],
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (!meeting.transcript) {
      throw new BadRequestException('Meeting transcript not available');
    }

    const result: ContentGenerationResult = { errors: [] };

    try {
      // Generate LinkedIn post (professional tone)
      const linkedinContent = await this.generateLinkedInContent(meeting.transcript, meeting.title);
      if (linkedinContent) {
        const linkedinPost = this.socialPostRepository.create({
          meetingId: meeting.id,
          platform: SocialPlatform.LINKEDIN,
          content: linkedinContent,
          status: PostStatus.DRAFT, // Requires user approval
        });

        result.linkedinPost = await this.socialPostRepository.save(linkedinPost);
      }

      // Generate Facebook post (casual tone)
      const facebookContent = await this.generateFacebookContent(meeting.transcript, meeting.title);
      if (facebookContent) {
        const facebookPost = this.socialPostRepository.create({
          meetingId: meeting.id,
          platform: SocialPlatform.FACEBOOK,
          content: facebookContent,
          status: PostStatus.DRAFT, // Requires user approval
        });

        result.facebookPost = await this.socialPostRepository.save(facebookPost);
      }

      this.logger.log(`Generated social content for meeting ${meetingId}: LinkedIn=${!!result.linkedinPost}, Facebook=${!!result.facebookPost}`);

    } catch (error) {
      const errorMsg = `Failed to generate content for meeting ${meetingId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      this.logger.error(errorMsg);
    }

    return result;
  }

  /**
   * Get Posts Needing Publishing (Draft Status)
   * 
   * Used by background jobs to find approved posts ready for publishing
   */
  async getDraftPosts(): Promise<SocialPost[]> {
    return await this.socialPostRepository.find({
      where: {
        status: PostStatus.DRAFT,
      },
      relations: ['meeting', 'meeting.user'],
    });
  }

  /**
   * Private: Publish to LinkedIn
   */
  private async publishToLinkedIn(userId: string, post: SocialPost): Promise<SocialPostResult> {
    try {
      // Get LinkedIn account
      const linkedinAccount = await this.accountRepository.findOne({
        where: { userId, provider: AccountProvider.LINKEDIN }
      });

      if (!linkedinAccount) {
        return {
          platform: SocialPlatform.LINKEDIN,
          success: false,
          error: 'LinkedIn account not connected'
        };
      }

      // Use LinkedIn service to post
      const postId = await this.linkedinService.createPost(
        linkedinAccount.accessToken,
        post.content
      );

      return {
        platform: SocialPlatform.LINKEDIN,
        success: true,
        postId
      };

    } catch (error) {
      return {
        platform: SocialPlatform.LINKEDIN,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Private: Publish to Facebook
   */
  private async publishToFacebook(userId: string, post: SocialPost): Promise<SocialPostResult> {
    try {
      // Get Facebook account
      const facebookAccount = await this.accountRepository.findOne({
        where: { userId, provider: AccountProvider.FACEBOOK }
      });

      if (!facebookAccount) {
        return {
          platform: SocialPlatform.FACEBOOK,
          success: false,
          error: 'Facebook account not connected'
        };
      }

      // Use Facebook service to post
      const postId = await this.facebookService.createPost(
        facebookAccount.accessToken,
        post.content
      );

      return {
        platform: SocialPlatform.FACEBOOK,
        success: true,
        postId
      };

    } catch (error) {
      return {
        platform: SocialPlatform.FACEBOOK,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Private: Generate LinkedIn Content (Professional)
   */
  private async generateLinkedInContent(transcript: string, meetingTitle: string): Promise<string> {
    // TODO: Integrate with OpenAI for content generation
    // For now, return a template
    const preview = transcript.substring(0, 200);
    return `Great insights from today's "${meetingTitle}" meeting! ${preview}... #professional #meetings #insights`;
  }

  /**
   * Private: Generate Facebook Content (Casual)
   */
  private async generateFacebookContent(transcript: string, meetingTitle: string): Promise<string> {
    // TODO: Integrate with OpenAI for content generation
    // For now, return a template
    const preview = transcript.substring(0, 150);
    return `Just wrapped up an amazing "${meetingTitle}" meeting! ${preview}... 🚀 #work #meetings #success`;
  }
}
