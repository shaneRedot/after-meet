import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

/**
 * This allows users to customize their experience and bot behavior.
 */
@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: 5 })
  botJoinMinutesBefore: number;

  /**
   * for completed meetings? If false, user must manually trigger.
   */
  @Column({ default: true })
  autoGeneratePosts: boolean;

  /**
   * Email notifications for various events:
   * - meeting_completed: When transcript is ready
   * - post_generated: When AI creates new social media post
   * - bot_failed: When Recall.ai bot fails to join
   */
  @Column({ type: 'jsonb', nullable: true })
  notifications: {
    email: boolean;
    meetingCompleted: boolean;
    postGenerated: boolean;
    botFailed: boolean;
  } | null;

  @Column({ default: 'UTC' })
  timezone: string;

  @OneToOne(() => User, user => user.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
