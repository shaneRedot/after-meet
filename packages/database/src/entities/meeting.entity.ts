import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { SocialPost } from './social-post.entity';

export enum MeetingStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export enum MeetingPlatform {
    ZOOM = 'zoom',
    TEAMS = 'teams',
    MEET = 'meet'
}

@Entity('meetings')
export class Meeting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    title: string;

    @Column({ type: 'timestamp' })
    startTime: Date;

    @Column({ type: 'timestamp', nullable: true })
    endTime: Date | null;

    @Column({
        type: 'enum',
        enum: MeetingPlatform,
    })
    platform: MeetingPlatform;

    @Column({ nullable: true })
    meetingUrl: string | null;

    // Store attendee information as JSON
    @Column({ type: 'jsonb', nullable: true })
    attendees: Array<{
        name: string;
        email: string;
        status?: 'accepted' | 'declined' | 'tentative';
    }> | null;

    // Recall.ai bot ID for tracking transcript status
    @Column({ nullable: true })
    recallBotId: string | null;

    // Full meeting transcript from Recall.ai
    @Column({ type: 'text', nullable: true })
    transcript: string | null;

    @Column({
        type: 'enum',
        enum: MeetingStatus,
        default: MeetingStatus.SCHEDULED,
    })
    status: MeetingStatus;

    // User preference: should bot join this meeting?
    @Column({ default: false })
    recallEnabled: boolean;

    // Google Calendar event ID for updates/sync
    @Column({ nullable: true })
    calendarEventId: string | null;

    // Relationships
    @ManyToOne(() => User, user => user.meetings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToMany(() => SocialPost, post => post.meeting, { cascade: true })
    socialPosts: SocialPost[];

    @CreateDateColumn()
    createdAt: Date;
}
