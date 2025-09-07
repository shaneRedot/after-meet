import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface OpenAICompletionRequest {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
}

export interface OpenAICompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface MeetingInsights {
    summary: string;
    keyDecisions: string[];
    actionItems: string[];
    participants: string[];
    topics: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    duration: number;
    keyQuotes: string[];
}

/**
 * OpenAI Integration Service
 * 
 * Handles direct communication with OpenAI GPT-4 API for content generation.
 * Provides low-level AI capabilities for transcript analysis and content creation.
 * 
 * Key Responsibilities:
 * - Direct OpenAI API integration
 * - Prompt engineering and optimization
 * - Token management and rate limiting
 * - Error handling and fallback strategies
 * - Meeting transcript analysis and insight extraction
 */
@Injectable()
export class OpenAIService {
    private readonly logger = new Logger(OpenAIService.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.openai.com/v1';

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        this.apiKey = this.configService.get<string>('OPENAI_API_KEY');

        if (!this.apiKey) {
            this.logger.warn('OPENAI_API_KEY not configured - AI features disabled');
        }
    }

    /**
     * Generate Chat Completion
     * 
     * Core OpenAI API integration for text generation
     */
    async createCompletion(request: OpenAICompletionRequest): Promise<string> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const response = await firstValueFrom(
                this.httpService.post<OpenAICompletionResponse>(
                    `${this.baseUrl}/chat/completions`,
                    request,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );

            const content = response.data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No content generated from OpenAI');
            }

            this.logger.log(`Generated content: ${response.data.usage.total_tokens} tokens`);
            return content.trim();

        } catch (error) {
            this.logger.error('OpenAI API call failed:', error);
            throw new Error(`OpenAI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Extract Meeting Insights
     * 
     * Analyzes meeting transcript to extract key information
     */
    async extractMeetingInsights(transcript: string, meetingTitle: string): Promise<MeetingInsights> {
        const prompt = `Analyze this meeting transcript and extract key insights:

Meeting Title: "${meetingTitle}"
Transcript: ${transcript}

Please provide a structured analysis in JSON format with:
- summary: Brief overview (2-3 sentences)
- keyDecisions: Important decisions made (array)
- actionItems: Tasks and next steps (array)
- participants: Key speakers mentioned (array)
- topics: Main discussion topics (array)
- sentiment: Overall meeting tone (positive/neutral/negative)
- keyQuotes: Notable quotes or statements (array, max 3)

Return only valid JSON.`;

        try {
            const response = await this.createCompletion({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert meeting analyst. Extract key insights and return only valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3, // Lower temperature for factual analysis
            });

            return JSON.parse(response) as MeetingInsights;

        } catch (error) {
            this.logger.error('Failed to extract meeting insights:', error);
            // Return fallback insights
            return {
                summary: `Meeting "${meetingTitle}" covered various topics and discussions.`,
                keyDecisions: [],
                actionItems: [],
                participants: [],
                topics: [],
                sentiment: 'neutral',
                duration: 0,
                keyQuotes: [],
            };
        }
    }

    /**
     * Generate LinkedIn Content
     * 
     * Creates professional LinkedIn post from meeting insights
     */
    async generateLinkedInContent(insights: MeetingInsights, meetingTitle: string): Promise<string> {
        const prompt = `Create a professional LinkedIn post based on this meeting:

Meeting: "${meetingTitle}"
Summary: ${insights.summary}
Key Decisions: ${insights.keyDecisions.join(', ')}
Topics: ${insights.topics.join(', ')}
Sentiment: ${insights.sentiment}

Requirements:
- Professional tone suitable for LinkedIn
- 280 characters or less
- Include relevant hashtags
- Highlight key outcomes or insights
- Engaging and shareable content
- No personal information or confidential details

Generate only the post content, no additional formatting.`;

        return await this.createCompletion({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional LinkedIn content creator. Create engaging, professional posts that drive engagement.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 100,
            temperature: 0.7,
        });
    }

    /**
     * Generate Facebook Content
     * 
     * Creates casual Facebook post from meeting insights
     */
    async generateFacebookContent(insights: MeetingInsights, meetingTitle: string): Promise<string> {
        const prompt = `Create a casual Facebook post based on this meeting:

Meeting: "${meetingTitle}"
Summary: ${insights.summary}
Key Points: ${insights.keyDecisions.join(', ')}
Sentiment: ${insights.sentiment}

Requirements:
- Casual, friendly tone suitable for Facebook
- 280 characters or less
- Include relevant emojis
- Engaging and relatable content
- Focus on positive outcomes or learnings
- No confidential business information

Generate only the post content, no additional formatting.`;

        return await this.createCompletion({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a social media content creator. Create engaging, casual posts that connect with audiences.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 100,
            temperature: 0.8, // Higher temperature for creative content
        });
    }

    /**
     * Improve Existing Content
     * 
     * Enhances user-written content for better engagement
     */
    async improveContent(
        content: string,
        platform: 'linkedin' | 'facebook',
        improvements: string[] = []
    ): Promise<string> {
        const platformTone = platform === 'linkedin' ? 'professional' : 'casual and friendly';
        const improvementsList = improvements.length > 0
            ? `Focus on: ${improvements.join(', ')}`
            : 'Focus on engagement, clarity, and platform-appropriate tone';

        const prompt = `Improve this ${platform} post:

Original: "${content}"

Requirements:
- Maintain ${platformTone} tone
- Keep under 280 characters
- ${improvementsList}
- Add relevant hashtags if missing
- Improve readability and engagement
- Keep the core message intact

Return only the improved post content.`;

        return await this.createCompletion({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are a ${platform} content optimization expert. Improve posts while maintaining authenticity.`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 100,
            temperature: 0.6,
        });
    }

    /**
     * Health Check
     * 
     * Validates OpenAI API connectivity and configuration
     */
    async healthCheck(): Promise<{ status: string; model: string; available: boolean }> {
        if (!this.apiKey) {
            return {
                status: 'unavailable',
                model: 'none',
                available: false,
            };
        }

        try {
            const response = await this.createCompletion({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'user', content: 'Say "healthy" if you can respond.' }
                ],
                max_tokens: 10,
                temperature: 0,
            });

            return {
                status: response.includes('healthy') ? 'healthy' : 'partial',
                model: 'gpt-4',
                available: true,
            };

        } catch (error) {
            this.logger.error('OpenAI health check failed:', error);
            return {
                status: 'error',
                model: 'gpt-4',
                available: false,
            };
        }
    }
}
