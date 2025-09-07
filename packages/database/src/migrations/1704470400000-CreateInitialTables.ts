import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateInitialTables1704470400000 implements MigrationInterface {
    name = 'CreateInitialTables1704470400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        isUnique: true,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'avatar',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create user_settings table
        await queryRunner.createTable(
            new Table({
                name: 'user_settings',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'userId',
                        type: 'uuid',
                    },
                    {
                        name: 'botJoinMinutesBefore',
                        type: 'int',
                        default: 5,
                    },
                    {
                        name: 'autoGeneratePosts',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'notifications',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'timezone',
                        type: 'varchar',
                        default: "'UTC'",
                    },
                ],
            }),
            true,
        );

        // Create accounts table
        await queryRunner.createTable(
            new Table({
                name: 'accounts',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'userId',
                        type: 'uuid',
                    },
                    {
                        name: 'provider',
                        type: 'enum',
                        enum: ['google', 'linkedin', 'facebook'],
                    },
                    {
                        name: 'providerAccountId',
                        type: 'varchar',
                    },
                    {
                        name: 'accessToken',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'refreshToken',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'expiresAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'scope',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Create meetings table
        await queryRunner.createTable(
            new Table({
                name: 'meetings',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'userId',
                        type: 'uuid',
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                    },
                    {
                        name: 'startTime',
                        type: 'timestamp',
                    },
                    {
                        name: 'endTime',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'platform',
                        type: 'enum',
                        enum: ['zoom', 'teams', 'meet'],
                    },
                    {
                        name: 'meetingUrl',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'attendees',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'recallBotId',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'transcript',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
                        default: "'scheduled'",
                    },
                    {
                        name: 'recallEnabled',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'calendarEventId',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create automations table
        await queryRunner.createTable(
            new Table({
                name: 'automations',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'userId',
                        type: 'uuid',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                    },
                    {
                        name: 'platform',
                        type: 'enum',
                        enum: ['linkedin', 'facebook'],
                    },
                    {
                        name: 'prompt',
                        type: 'text',
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'priority',
                        type: 'int',
                        default: 0,
                    },
                ],
            }),
            true,
        );

        // Create social_posts table
        await queryRunner.createTable(
            new Table({
                name: 'social_posts',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'meetingId',
                        type: 'uuid',
                    },
                    {
                        name: 'platform',
                        type: 'enum',
                        enum: ['linkedin', 'facebook'],
                    },
                    {
                        name: 'content',
                        type: 'text',
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['draft', 'posted', 'failed'],
                        default: "'draft'",
                    },
                    {
                        name: 'postedAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'automationId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'platformPostId',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'errorMessage',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create foreign keys
        await queryRunner.createForeignKey(
            'user_settings',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'accounts',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'meetings',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'automations',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'social_posts',
            new TableForeignKey({
                columnNames: ['meetingId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'meetings',
                onDelete: 'CASCADE',
            }),
        );

        // Create indexes
        await queryRunner.createIndex(
            'accounts',
            new TableIndex({
                name: 'IDX_accounts_provider_account',
                columnNames: ['provider', 'providerAccountId'],
                isUnique: true,
            }),
        );

        await queryRunner.createIndex(
            'meetings',
            new TableIndex({
                name: 'IDX_meetings_user_start_time',
                columnNames: ['userId', 'startTime'],
            }),
        );

        await queryRunner.createIndex(
            'meetings',
            new TableIndex({
                name: 'IDX_meetings_status',
                columnNames: ['status'],
            }),
        );

        await queryRunner.createIndex(
            'social_posts',
            new TableIndex({
                name: 'IDX_social_posts_meeting_platform',
                columnNames: ['meetingId', 'platform'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('social_posts');
        await queryRunner.dropTable('automations');
        await queryRunner.dropTable('meetings');
        await queryRunner.dropTable('accounts');
        await queryRunner.dropTable('user_settings');
        await queryRunner.dropTable('users');
    }
}
