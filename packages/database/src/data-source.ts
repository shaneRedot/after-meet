import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Account } from './entities/account.entity';
import { Meeting } from './entities/meeting.entity';
import { SocialPost } from './entities/social-post.entity';
import { Automation } from './entities/automation.entity';
import { UserSettings } from './entities/user-settings.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  
  // Use DATABASE_URL if available (common in production)
  url: process.env.DATABASE_URL,
  
  // Fallback to individual environment variables
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'aftermeet',
  
  // SSL configuration for production databases
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Development settings
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  
  // Entity registration
  entities: [
    User,
    Account, 
    Meeting,
    SocialPost,
    Automation,
    UserSettings,
  ],
  
  // Migration configuration
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  
  // Subscriber configuration (for entity lifecycle events)
  subscribers: ['src/subscribers/*.ts'],
  
  // Additional options
  extra: {
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
