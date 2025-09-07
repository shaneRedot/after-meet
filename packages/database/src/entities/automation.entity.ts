import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { SocialPlatform } from './social-post.entity';

/**
 * Automation Entity
 * 
 * Represents user-configured templates for AI content generation.
 * Each automation defines how social media posts should be generated
 * from meeting transcripts for a specific platform.
 * 
 * Example: "Generate LinkedIn post highlighting financial insights
 * with professional tone and include 3 relevant hashtags"
 */
@Entity('automations')
export class Automation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // Human-readable name for the automation
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SocialPlatform,
  })
  platform: SocialPlatform;

  /**
   * AI Generation Prompt
   * 
   * This is the core instruction set for AI content generation.
   * Should include:
   * - Tone and style requirements
   * - Length specifications (120-180 words)
   * - Hashtag instructions
   * - Platform-specific formatting
   * 
   * Example:
   * "Generate a LinkedIn post that summarizes key meeting insights
   * in first person. Use a warm, conversational tone consistent 
   * with an experienced financial advisor. Include 2-3 relevant
   * hashtags. Keep it between 120-180 words."
   */
  @Column({ type: 'text' })
  prompt: string;

  // Enable/disable this automation
  @Column({ default: true })
  isActive: boolean;

  // Priority order when multiple automations exist for same platform
  @Column({ default: 0 })
  priority: number;

  // Relationships
  @ManyToOne(() => User, user => user.automations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
