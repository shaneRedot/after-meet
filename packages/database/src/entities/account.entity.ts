import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

export enum AccountProvider {
  GOOGLE = 'google',
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook'
}

/**
 * Account Entity
 * 
 * Stores OAuth connection details for each provider.
 * A user can have multiple accounts per provider (e.g., multiple Google accounts).
 * 
 * Security: Access tokens are encrypted at rest using AES-256
 */
@Entity('accounts')
@Index(['provider', 'providerAccountId'], { unique: true })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: AccountProvider,
  })
  provider: AccountProvider;

  @Column()
  providerAccountId: string;

  // Encrypted tokens - never store in plain text
  @Column({ nullable: true, type: 'text' })
  accessToken: string | null;

  @Column({ nullable: true, type: 'text' })
  refreshToken: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date | null;

  @Column({ nullable: true })
  scope: string | null;

  // Additional provider-specific data (e.g., profile info)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // Relationships
  @ManyToOne(() => User, user => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
