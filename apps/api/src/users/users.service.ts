import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Account, UserSettings } from '@after-meet/database';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>,
  ) {}

  /**
   * Get user by ID with accounts and settings
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['accounts', 'settings'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['accounts', 'settings'],
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    
    Object.assign(user, updates);
    await this.userRepository.save(user);
    
    return user;
  }

  /**
   * Get user's connected accounts
   */
  async getConnectedAccounts(userId: string): Promise<Account[]> {
    return this.accountRepository.find({
      where: { userId },
      select: ['id', 'provider', 'expiresAt'], // Exclude sensitive tokens
    });
  }

  /**
   * Get or create user settings
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    let settings = await this.userSettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.userSettingsRepository.create({
        userId,
        timezone: 'UTC',
        autoGeneratePosts: true,
        botJoinMinutesBefore: 5,
      });
      await this.userSettingsRepository.save(settings);
    }

    return settings;
  }

  /**
   * Update user settings
   */
  async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const settings = await this.getUserSettings(userId);
    
    Object.assign(settings, updates);
    await this.userSettingsRepository.save(settings);
    
    return settings;
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.findById(userId);
    
    // Set deleted flag instead of hard delete
    user.email = `deleted_${Date.now()}_${user.email}`;
    await this.userRepository.save(user);
    
    // Remove all connected accounts
    await this.accountRepository.delete({ userId });
  }

  /**
   * Get all users (for scheduled tasks)
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['accounts', 'settings'],
    });
  }
}
