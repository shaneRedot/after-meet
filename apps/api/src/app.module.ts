import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

// Database entities
// Database entities
import { 
  User, 
  Account, 
  Meeting, 
  SocialPost, 
  Automation, 
  UserSettings 
} from '@after-meet/database';

// Application modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CalendarModule } from './calendar/calendar.module';
import { MeetingsModule } from './meetings/meetings.module';
import { RecallModule } from './recall/recall.module';
import { SocialModule } from './social/social.module';
import { AIModule } from './ai/ai.module';
import { JobsModule } from './jobs/jobs.module';
import { AppController } from './app.controller';
// TODO: Import these modules once implemented
// import { AutomationModule } from './automation/automation.module';

/**
 * Main Application Module
 * 
 * Configures and imports all modules required for the After Meet API:
 * - Database connection with TypeORM
 * - Authentication and OAuth providers
 * - Calendar integration for Google Calendar
 * - Meeting management and Recall.ai integration
 * - Social media posting capabilities
 * - Job queue for background processing
 */
@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database configuration
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'aftermeet',
        entities: [User, Account, Meeting, SocialPost, Automation, UserSettings],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),

    // Job queue for background processing
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Application modules
    AuthModule,        // OAuth authentication (Google, LinkedIn, Facebook)
    UsersModule,       // User management and preferences
    CalendarModule,    // Google Calendar integration
    MeetingsModule,    // Meeting CRUD and bot management
    RecallModule,      // Recall.ai bot integration
    SocialModule,      // Social media posting
    AIModule,          // AI content generation with OpenAI
    JobsModule,        // Background job processing
    // TODO: Add these modules once implemented
    // AutomationModule,  // AI content generation configuration
  ],
  controllers: [AppController],
})
export class AppModule {}
