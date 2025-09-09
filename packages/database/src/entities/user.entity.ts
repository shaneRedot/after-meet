import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Account } from './account.entity';
import { Meeting } from './meeting.entity';
import { Automation } from './automation.entity';
import { UserSettings } from './user-settings.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  avatar: string;

  // Relationships
  @OneToMany(() => Account, account => account.user, { cascade: true })
  accounts: Account[];

  @OneToMany(() => Meeting, meeting => meeting.user, { cascade: true })
  meetings: Meeting[];

  @OneToMany(() => Automation, automation => automation.user, { cascade: true })
  automations: Automation[];

  @OneToOne(() => UserSettings, settings => settings.user, { cascade: true })
  settings: UserSettings;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
