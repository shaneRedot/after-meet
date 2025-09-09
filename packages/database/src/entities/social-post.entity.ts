import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Meeting } from './meeting.entity';

export enum PostStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
  FAILED = 'failed'
}

export enum SocialPlatform {
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook'
}

@Entity('social_posts')
export class SocialPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  meetingId: string;

  @Column({
    type: 'enum',
    enum: SocialPlatform,
  })
  platform: SocialPlatform;

  // AI-generated post content (120-180 words as per requirements)
  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  // When the post was successfully published
  @Column({ type: 'timestamp', nullable: true })
  postedAt: Date | null;

  // Reference to the automation that generated this post
  @Column({ type: 'varchar', nullable: true })
  automationId: string | null;

  // Platform-specific post ID (for tracking, analytics)
  @Column({ type: 'varchar', nullable: true })
  platformPostId: string | null;

  // Error message if posting failed
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  // Relationships
  @ManyToOne(() => Meeting, meeting => meeting.socialPosts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: Meeting;

  @CreateDateColumn()
  createdAt: Date;
}
