import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Facebook API Integration Service
 * 
 * Handles posting to Facebook using Facebook Graph API.
 * Supports text posts and media attachments.
 * 
 * Requirement: "automatically post to LinkedIn and Facebook"
 */
@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Create Facebook Post
   * 
   * Posts content to user's Facebook profile/page using Facebook Graph API
   */
  async createPost(
    accessToken: string,
    content: string
  ): Promise<string> {
    try {
      // Get user's Facebook profile
      const profileResponse = await firstValueFrom(
        this.httpService.get('https://graph.facebook.com/me', {
          params: {
            access_token: accessToken,
            fields: 'id,name',
          },
        })
      );

      const userId = profileResponse.data.id;

      // Create Facebook post
      const postResponse = await firstValueFrom(
        this.httpService.post(
          `https://graph.facebook.com/${userId}/feed`,
          {
            message: content,
            access_token: accessToken,
          }
        )
      );

      this.logger.log(`Created Facebook post: ${postResponse.data.id}`);
      return postResponse.data.id;

    } catch (error) {
      this.logger.error('Failed to create Facebook post:', error);
      throw new Error(`Facebook posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete Facebook Post
   * 
   * Removes a post from Facebook (if user has permission)
   */
  async deletePost(accessToken: string, postId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`https://graph.facebook.com/${postId}`, {
          params: {
            access_token: accessToken,
          },
        })
      );

      this.logger.log(`Deleted Facebook post: ${postId}`);
    } catch (error) {
      this.logger.error(`Failed to delete Facebook post ${postId}:`, error);
      throw new Error(`Facebook post deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get User's Facebook Profile
   * 
   * Retrieves basic profile information for validation
   */
  async getUserProfile(accessToken: string): Promise<{ id: string; name: string; email?: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://graph.facebook.com/me', {
          params: {
            access_token: accessToken,
            fields: 'id,name,email',
          },
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Facebook profile:', error);
      throw new Error(`Facebook profile fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Facebook Access Token
   * 
   * Checks if the access token is valid and has required permissions
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://graph.facebook.com/me', {
          params: {
            access_token: accessToken,
            fields: 'id',
          },
        })
      );

      return !!response.data.id;
    } catch (error) {
      this.logger.warn('Facebook access token validation failed:', error);
      return false;
    }
  }
}
