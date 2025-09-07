import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * LinkedIn API Integration Service
 * 
 * Handles posting to LinkedIn using LinkedIn API v2.
 * Supports text posts and media attachments.
 * 
 * Requirement: "automatically post to LinkedIn and Facebook"
 */
@Injectable()
export class LinkedInService {
  private readonly logger = new Logger(LinkedInService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Create LinkedIn Post
   * 
   * Posts content to user's LinkedIn profile using LinkedIn API
   */
  async createPost(
    accessToken: string,
    content: string
  ): Promise<string> {
    try {
      // Get user's LinkedIn profile ID
      const profileResponse = await firstValueFrom(
        this.httpService.get('https://api.linkedin.com/v2/people/~', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })
      );

      const profileId = profileResponse.data.id;

      // Create post payload
      const postData = {
        author: `urn:li:person:${profileId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: 'NONE', // Text-only for now
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      // Post to LinkedIn
      const response = await firstValueFrom(
        this.httpService.post('https://api.linkedin.com/v2/ugcPosts', postData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })
      );

      const postId = response.data.id;
      this.logger.log(`Successfully posted to LinkedIn: ${postId}`);
      
      return postId;

    } catch (error) {
      this.logger.error('Failed to post to LinkedIn:', error);
      throw new Error(`LinkedIn posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get LinkedIn Profile Information
   * 
   * Used for validation and profile display
   */
  async getProfile(accessToken: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get LinkedIn profile:', error);
      throw new Error('Failed to retrieve LinkedIn profile');
    }
  }
}
