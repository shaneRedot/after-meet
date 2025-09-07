import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

/**
 * Google OAuth Strategy
 * 
 * Handles Google OAuth authentication for calendar access and primary login.
 * 
 * Requirements Fulfilled:
 * - "I can log in with Google and it pulls in my google calendar"
 * - "I can connect multiple google accounts"
 * - "add webshookeng@gmail.com as an oauth test user"
 * 
 * OAuth Scopes:
 * - profile: Basic profile information
 * - email: Email address for user identification
 * - https://www.googleapis.com/auth/calendar.readonly: Calendar access
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: '/api/auth/google/callback',
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar.readonly', // Calendar access
      ],
    });
  }

  /**
   * Validate Google OAuth Response
   * 
   * Called after user authorizes the application.
   * Returns user data that will be passed to AuthService.
   * 
   * @param accessToken - OAuth access token for API calls
   * @param refreshToken - Long-lived token for token refresh
   * @param profile - User profile information from Google
   * @param done - Callback function
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      // Extract user information from Google profile
      const { id, name, emails, photos } = profile;
      
      const user = {
        id,
        displayName: name?.givenName && name?.familyName 
          ? `${name.givenName} ${name.familyName}`
          : profile.displayName,
        emails,
        photos,
        accessToken,
        refreshToken,
        // Calculate token expiry (Google tokens typically expire in 1 hour)
        expiresAt: Date.now() + (3600 * 1000), // 1 hour from now
        scope: 'profile email https://www.googleapis.com/auth/calendar.readonly',
      };

      // Check if this is the test user mentioned in requirements
      const email = emails?.[0]?.value;
      if (email === 'webshookeng@gmail.com') {
        console.log('✅ Test user webshookeng@gmail.com authenticated successfully');
      }

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
