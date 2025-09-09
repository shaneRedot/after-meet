import { Controller, Get, Post, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

/**
 * - "add webshookeng@gmail.com as an oauth test user" → Handled in Google strategy
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {}



  /**
   * Google OAuth Initiation
   * 
   * Requirement: "I can log in with Google and it pulls in my google calendar"
   * Scopes: profile, email, calendar.readonly
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // This method body never executes - the AuthGuard redirects to Google OAuth first
  }


  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    console.log('🔄 Google OAuth callback route hit');
    const url = this.configService.get('FRONTEND_URL');  
    try {
      const result = await this.authService.handleOAuthCallback('google', req.user);
      // Redirect to frontend auth callback with JWT token
      const frontendUrl = url || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`);
    } catch (error: any) {
      const frontendUrl = url || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * LinkedIn OAuth Initiation
   * 
   * Requirement: "connect my LinkedIn and Facebook accounts via OAuth"
   * Scopes: w_member_social (posting), r_liteprofile (profile info)
   */
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinAuth() {
    // Guard redirects to LinkedIn OAuth
  }

  /**
   * LinkedIn OAuth Callback
   * 
   * Links LinkedIn account to existing user (requires existing session)
   */
  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.authService.linkSocialAccount('linkedin', req.user);
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/settings/accounts?linked=linkedin&success=true`);
    } catch (error: any) {
      res.redirect(`${process.env.FRONTEND_URL}/settings/accounts?error=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Facebook OAuth Initiation
   * 
   * Requirement: "connect my LinkedIn and Facebook accounts via OAuth"
   * Scopes: pages_manage_posts, publish_video
   */
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {
    // Guard redirects to Facebook OAuth
  }

  /**
   * Facebook OAuth Callback
   * 
   * Links Facebook account to existing user
   */
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.authService.linkSocialAccount('facebook', req.user);
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/settings/accounts?linked=facebook&success=true`);
    } catch (error: any) {
      res.redirect(`${process.env.FRONTEND_URL}/settings/accounts?error=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Get Current User Profile
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(@Req() req: any) {
    return this.authService.getCurrentUser(req.user.id);
  }

  /**
   * Debug endpoint - check user accounts and tokens
   */
  @Get('debug')
  @UseGuards(AuthGuard('jwt'))
  async debugUser(@Req() req: any) {
    try {
      const userId = req.user.id;
      const user = await this.authService.getCurrentUser(userId);
      
      // Get all linked accounts (we'll need to add this method)
      const accounts = await this.authService.getUserAccounts(userId);
      
      return {
        userId,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accounts: accounts.map(account => ({
          id: account.id,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          hasAccessToken: !!account.accessToken,
          hasRefreshToken: !!account.refreshToken,
          tokenLength: account.accessToken ? account.accessToken.length : 0,
        })),
        totalAccounts: accounts.length,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id || 'unknown',
      };
    }
  }

  /**
   * Unlink Social Account
   * 
   * Removes connection to LinkedIn or Facebook account
   */
  @Post('unlink/:provider')
  @UseGuards(AuthGuard('jwt'))
  async unlinkAccount(@Req() req: any, @Res() res: Response) {
    const { provider } = req.params;
    
    try {
      await this.authService.unlinkAccount(req.user.id, provider);
      res.status(HttpStatus.OK).json({ success: true, message: `${provider} account unlinked` });
    } catch (error : any) {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  /**
   * Refresh JWT Token
   * 
   * Issues new access token for authenticated user
   */
  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  async refreshToken(@Req() req: any) {
    return this.authService.generateJwtToken(req.user);
  }
}
