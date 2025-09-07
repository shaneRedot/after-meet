import { 
  Controller, 
  Get, 
  Put, 
  Delete, 
  Body, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { User, Account, UserSettings } from '@after-meet/database';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   */
  @Get('me')
  async getProfile(@Request() req): Promise<User> {
    return this.usersService.findById(req.user.userId);
  }

  /**
   * Update user profile
   */
  @Put('me')
  async updateProfile(
    @Request() req,
    @Body() updates: Partial<User>
  ): Promise<User> {
    // Remove sensitive fields that shouldn't be updated directly
    const { id, email, ...safeUpdates } = updates;
    return this.usersService.updateProfile(req.user.userId, safeUpdates);
  }

  /**
   * Get connected accounts
   */
  @Get('accounts')
  async getAccounts(@Request() req): Promise<Account[]> {
    return this.usersService.getConnectedAccounts(req.user.userId);
  }

  /**
   * Get user settings
   */
  @Get('settings')
  async getSettings(@Request() req): Promise<UserSettings> {
    return this.usersService.getUserSettings(req.user.userId);
  }

  /**
   * Update user settings
   */
  @Put('settings')
  async updateSettings(
    @Request() req,
    @Body() updates: Partial<UserSettings>
  ): Promise<UserSettings> {
    return this.usersService.updateSettings(req.user.userId, updates);
  }

  /**
   * Delete user account
   */
  @Delete('me')
  async deleteAccount(@Request() req): Promise<{ message: string }> {
    await this.usersService.deleteUser(req.user.userId);
    return { message: 'Account deleted successfully' };
  }
}
