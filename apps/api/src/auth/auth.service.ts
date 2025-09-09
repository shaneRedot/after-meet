import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as CryptoJS from 'crypto-js';
import { User, Account, AccountProvider } from '@after-meet/database';

/**
 * Authentication Service
 * 
 * Core business logic for OAuth authentication and account management.
 * Handles multiple OAuth providers per user as required.
 * 
 */
@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,

        @InjectRepository(Account)
        private accountRepository: Repository<Account>,

        private jwtService: JwtService,
    ) { }

    async handleOAuthCallback(provider: string, oauthUser: any) {
        const { id: providerAccountId, emails, displayName, photos, accessToken, refreshToken } = oauthUser;

        const email = emails?.[0]?.value;
        if (!email) {
            throw new UnauthorizedException('Email not provided by OAuth provider');
        }

        let user = await this.userRepository.findOne({
            where: { email },
            relations: ['accounts']
        });

        if (!user) {
            user = await this.userRepository.save({
                email,
                name: displayName,
                avatar: photos?.[0]?.value,
            });
        }

        const existingAccount = await this.accountRepository.findOne({
            where: {
                provider: provider as AccountProvider,
                providerAccountId: String(providerAccountId)
            }
        });

        if (existingAccount && existingAccount.userId !== user.id) {
            throw new ConflictException('This account is already linked to another user');
        }

        const accountData = {
            userId: user.id,
            provider: provider as AccountProvider,
            providerAccountId: String(providerAccountId),
            accessToken: this.encryptToken(accessToken),
            refreshToken: refreshToken ? this.encryptToken(refreshToken) : null,
            expiresAt: oauthUser.expiresAt ? new Date(oauthUser.expiresAt) : null,
            scope: oauthUser.scope || null,
            metadata: {
                profile: {
                    name: displayName,
                    avatar: photos?.[0]?.value,
                    email,
                }
            }
        };

        if (existingAccount) {
            await this.accountRepository.update(existingAccount.id, accountData);
        } else {
            await this.accountRepository.save(accountData);
        }

        const jwtToken = this.generateJwtToken(user);

        return {
            accessToken: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
            }
        };
    }

    /**
     * Link Social Media Account (LinkedIn/Facebook)
     * 
     * Associates additional OAuth accounts with existing user.
     * Used for social media posting capabilities.
     * 
     * Requirement: "connect my LinkedIn and Facebook accounts via OAuth"
     */
    async linkSocialAccount(provider: string, oauthUser: any) {
        const { id: providerAccountId, accessToken, refreshToken, user: userContext } = oauthUser;

        if (!userContext?.id) {
            throw new UnauthorizedException('User must be logged in to link accounts');
        }

        // Check if account already linked
        const existingAccount = await this.accountRepository.findOne({
            where: {
                provider: provider as AccountProvider,
                providerAccountId: String(providerAccountId)
            }
        });

        if (existingAccount) {
            if (existingAccount.userId !== userContext.id) {
                throw new ConflictException('This account is already linked to another user');
            }

            // Update existing account tokens
            await this.accountRepository.update(existingAccount.id, {
                accessToken: this.encryptToken(accessToken),
                refreshToken: refreshToken ? this.encryptToken(refreshToken) : null,
                expiresAt: oauthUser.expiresAt ? new Date(oauthUser.expiresAt) : null,
            });
        } else {
            // Create new linked account
            await this.accountRepository.save({
                userId: userContext.id,
                provider: provider as AccountProvider,
                providerAccountId: String(providerAccountId),
                accessToken: this.encryptToken(accessToken),
                refreshToken: refreshToken ? this.encryptToken(refreshToken) : null,
                expiresAt: oauthUser.expiresAt ? new Date(oauthUser.expiresAt) : null,
                scope: oauthUser.scope || null,
            });
        }

        return { success: true, provider };
    }

    /**
     * Get Current User with Connected Accounts
     * 
     * Returns user profile with all connected OAuth accounts.
     * Used by frontend to show connection status.
     */
    async getCurrentUser(userId: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['accounts', 'settings']
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            accounts: user.accounts.map(account => ({
                id: account.id,
                provider: account.provider,
                connected: true,
                // Don't send tokens to frontend
            })),
            settings: user.settings,
        };
    }

    /**
     * Unlink OAuth Account
     * 
     * Removes connection to social media account.
     * Cannot unlink primary Google account.
     */
    async unlinkAccount(userId: string, provider: string) {
        if (provider === 'google') {
            throw new ConflictException('Cannot unlink primary Google account');
        }

        const account = await this.accountRepository.findOne({
            where: { userId, provider: provider as AccountProvider }
        });

        if (!account) {
            throw new ConflictException('Account not found or not linked');
        }

        await this.accountRepository.remove(account);
        return { success: true };
    }

    generateJwtToken(user: User): string {
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name
        };
        return this.jwtService.sign(payload, { secret: process.env.JWT_SECRET });
    }

    /**
     * Validate JWT Token
     * 
     * Used by JWT strategy to validate incoming requests
     */
    async validateJwtPayload(payload: any): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: payload.sub }
        });

        if (!user) {
            throw new UnauthorizedException('Invalid token');
        }

        return user;
    }

    /**
     * Get Decrypted Account Tokens
     * 
     * Retrieves and decrypts OAuth tokens for API calls.
     * Used by calendar and social media services.
     */
    async getAccountTokens(userId: string, provider: AccountProvider) {
        const account = await this.accountRepository.findOne({
            where: { userId, provider }
        });

        if (!account) {
            return null;
        }

        return {
            accessToken: account.accessToken ? this.decryptToken(account.accessToken) : null,
            refreshToken: account.refreshToken ? this.decryptToken(account.refreshToken) : null,
            expiresAt: account.expiresAt,
            scope: account.scope,
        };
    }

    /**
     * Update Account Tokens
     * 
     * Updates encrypted tokens after refresh
     */
    async updateAccountTokens(accountId: string, tokens: any) {
        await this.accountRepository.update(accountId, {
            accessToken: this.encryptToken(tokens.accessToken),
            refreshToken: tokens.refreshToken ? this.encryptToken(tokens.refreshToken) : null,
            expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
        });
    }

    /**
     * Get user's linked accounts
     */
    async getUserAccounts(userId: string): Promise<Account[]> {
        return this.accountRepository.find({
            where: { userId },
        });
    }

    /**
     * Encrypt OAuth Tokens
     * 
     * Encrypts tokens before database storage for security
     */
    private encryptToken(token: string): string {
        const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
        return CryptoJS.AES.encrypt(token, encryptionKey).toString();
    }

    /**
     * Decrypt OAuth Tokens
     * 
     * Decrypts tokens for API usage
     */
    private decryptToken(encryptedToken: string): string {
        const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
        const bytes = CryptoJS.AES.decrypt(encryptedToken, encryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
}
