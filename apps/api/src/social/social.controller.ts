import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SocialService, CreateSocialPostDto, UpdateSocialPostDto } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Social Media Controller
 * 
 * REST API endpoints for social media posting functionality.
 * Handles the frontend requests for social media automation.
 * 
 * Key Endpoints:
 * - GET /social/meetings/:id/posts - View posts for a meeting
 * - POST /social/posts/:id/publish - Publish a draft post
 * - PUT /social/posts/:id - Edit draft content
 * - DELETE /social/posts/:id - Remove draft/failed posts
 */
@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  /**
   * Get Social Posts for Meeting
   * 
   * Frontend: Display all social media posts for a specific meeting
   * Shows LinkedIn and Facebook posts with their status
   */
  @Get('meetings/:meetingId/posts')
  async getMeetingSocialPosts(@Param('meetingId') meetingId: string) {
    return await this.socialService.getMeetingSocialPosts(meetingId);
  }

  /**
   * Get Single Social Post
   * 
   * Frontend: Get details of a specific post for editing/viewing
   */
  @Get('posts/:postId')
  async getSocialPost(@Param('postId') postId: string) {
    return await this.socialService.getSocialPostById(postId);
  }

  /**
   * Update Social Post Content
   * 
   * Frontend: Edit draft post content or change status before publishing
   * User can modify AI-generated content before approval
   */
  @Put('posts/:postId')
  async updateSocialPost(
    @Param('postId') postId: string,
    @Body() updateDto: UpdateSocialPostDto,
  ) {
    return await this.socialService.updateSocialPost(postId, updateDto);
  }

  /**
   * Publish Social Post
   * 
   * Frontend: User approves and publishes a draft post to LinkedIn/Facebook
   * Core requirement: "automatically post to LinkedIn and Facebook"
   */
  @Post('posts/:postId/publish')
  @HttpCode(HttpStatus.OK)
  async publishSocialPost(@Param('postId') postId: string) {
    return await this.socialService.publishSocialPost(postId);
  }

  /**
   * Delete Social Post
   * 
   * Frontend: Remove draft or failed posts from the system
   */
  @Delete('posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSocialPost(@Param('postId') postId: string) {
    await this.socialService.deleteSocialPost(postId);
  }

  /**
   * Generate Posts from Meeting (Manual Trigger)
   * 
   * Frontend: User manually triggers content generation for a meeting
   * Useful if automatic generation failed or user wants to regenerate
   */
  @Post('meetings/:meetingId/generate')
  async generatePostsFromMeeting(@Param('meetingId') meetingId: string) {
    return await this.socialService.generatePostsFromMeeting(meetingId);
  }

  /**
   * Get Draft Posts
   * 
   * Frontend: Dashboard view of all posts awaiting user approval
   * Shows posts that need review before publishing
   */
  @Get('posts/status/draft')
  async getDraftPosts() {
    return await this.socialService.getDraftPosts();
  }
}
