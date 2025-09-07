// API Configuration and client setup
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ENABLE_REAL_API = process.env.NEXT_PUBLIC_ENABLE_REAL_API === 'true';

// HTTP client with base configuration
const httpClient = {
  get: async (url: string) => {
    const response = await fetch(`${API_BASE_URL}/api${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token when available
        // 'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
  },
  
  post: async (url: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/api${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
  },
  
  put: async (url: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/api${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
  },
};

// Mock API responses for development (replace with real API calls)
export const api = {
  // Auth endpoints
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      if (ENABLE_REAL_API) {
        return httpClient.post('/auth/login', credentials);
      }
      // Mock response - replace with actual API call
      return { token: 'mock-jwt-token', user: { id: '1', email: credentials.email, name: 'John Doe' } };
    },
    
    register: async (data: { name: string; email: string; password: string }) => {
      if (ENABLE_REAL_API) {
        return httpClient.post('/auth/register', data);
      }
      // Mock response
      return { token: 'mock-jwt-token', user: { id: '1', email: data.email, name: data.name } };
    },
  },

  // Meetings endpoints
  meetings: {
    getUpcoming: async () => {
      if (ENABLE_REAL_API) {
        return httpClient.get('/meetings/upcoming');
      }
      // Mock data that matches backend Meeting entity structure
      return {
        meetings: [
          {
            id: '1',
            title: 'Q4 Strategy Planning',
            startTime: new Date('2025-09-07T14:00:00'),
            endTime: new Date('2025-09-07T15:00:00'),
            duration: 60,
            recallEnabled: true,
            status: 'upcoming' as const,
            attendees: ['john@company.com', 'sarah@company.com'],
            googleMeetLink: 'https://meet.google.com/abc-def-ghi',
            botId: undefined,
            userId: '1',
            createdAt: new Date('2025-09-06T10:00:00'),
            updatedAt: new Date('2025-09-06T10:00:00'),
          },
          {
            id: '2',
            title: 'Product Roadmap Review',
            startTime: new Date('2025-09-07T09:00:00'),
            endTime: new Date('2025-09-07T10:30:00'),
            duration: 90,
            recallEnabled: true,
            status: 'completed' as const,
            transcript: 'Meeting transcript available...',
            botId: 'bot_123',
            userId: '1',
            createdAt: new Date('2025-09-06T08:00:00'),
            updatedAt: new Date('2025-09-07T10:30:00'),
          },
        ],
        total: 2,
      };
    },

    getById: async (id: string) => {
      if (ENABLE_REAL_API) {
        return httpClient.get(`/meetings/${id}`);
      }
      // Mock single meeting
      return {
        id,
        title: 'Product Roadmap Review',
        startTime: new Date('2025-09-07T09:00:00'),
        endTime: new Date('2025-09-07T10:30:00'),
        recallEnabled: true,
        transcript: 'Detailed meeting transcript would be here...',
        botId: 'bot_123',
        userId: '1',
      };
    },

    toggleBot: async (id: string, enabled: boolean) => {
      if (ENABLE_REAL_API) {
        return httpClient.put(`/meetings/${id}/bot`, { enabled });
      }
      return { id, recallEnabled: enabled };
    },
  },

  // Social endpoints
  social: {
    getGeneratedContent: async () => {
      if (ENABLE_REAL_API) {
        return httpClient.get('/social/posts');
      }
      return {
        posts: [
          {
            id: '1',
            meetingId: '2',
            platform: 'linkedin' as const,
            content: '🚀 Just wrapped up an incredible product roadmap review! Our team is aligned on the exciting features coming in Q4. The collaboration and innovative ideas shared today will definitely shape our product\'s future. #ProductStrategy #TeamWork #Innovation',
            status: 'scheduled' as const,
            scheduledFor: new Date('2025-09-07T16:00:00'),
            confidence: 0.92,
            automationId: 'auto_123',
            userId: '1',
            createdAt: new Date('2025-09-07T11:00:00'),
          },
          {
            id: '2',
            meetingId: '2',
            platform: 'facebook' as const,
            content: 'Amazing product planning session today! 🎯 Our team\'s creativity and strategic thinking continue to impress me. Can\'t wait to see these ideas come to life! #ProductDevelopment #Teamwork',
            status: 'published' as const,
            publishedAt: new Date('2025-09-07T11:30:00'),
            confidence: 0.88,
            automationId: 'auto_124',
            userId: '1',
            createdAt: new Date('2025-09-07T11:00:00'),
          },
        ],
        total: 2,
      };
    },

    approvePost: async (id: string) => {
      return { id, status: 'approved' };
    },

    schedulePost: async (id: string, scheduledFor: Date) => {
      return { id, status: 'scheduled', scheduledFor };
    },
  },

  // Jobs endpoints
  jobs: {
    getQueueStatus: async () => {
      return {
        queues: [
          {
            name: 'meeting-bot',
            waiting: 1,
            active: 0,
            completed: 5,
            failed: 0,
            delayed: 1,
            paused: false,
          },
          {
            name: 'content-generation',
            waiting: 0,
            active: 1,
            completed: 8,
            failed: 1,
            delayed: 0,
            paused: false,
          },
          {
            name: 'social-posting',
            waiting: 2,
            active: 0,
            completed: 12,
            failed: 0,
            delayed: 2,
            paused: false,
          },
          {
            name: 'cleanup',
            waiting: 0,
            active: 0,
            completed: 20,
            failed: 0,
            delayed: 0,
            paused: false,
          },
        ],
      };
    },

    getJobs: async (queueName: string) => {
      return {
        jobs: [
          {
            id: '1',
            name: 'create-bot',
            progress: 0,
            data: {
              meetingId: '1',
              scheduledTime: new Date('2025-09-07T13:45:00'),
            },
            opts: {
              attempts: 3,
              delay: 900000, // 15 minutes
            },
            timestamp: Date.now(),
            attemptsMade: 0,
          },
          {
            id: '2',
            name: 'generate-content',
            progress: 75,
            data: {
              meetingId: '2',
              transcriptUrl: 'https://recall.ai/transcript/abc123',
            },
            opts: {
              attempts: 2,
            },
            timestamp: Date.now() - 300000, // 5 minutes ago
            attemptsMade: 1,
          },
        ],
      };
    },
  },

  // AI endpoints
  ai: {
    getHealthStatus: async () => {
      return {
        openai: {
          available: true,
          status: 'healthy',
          model: 'gpt-4',
        },
        contentGeneration: {
          enabled: true,
          totalProcessed: 25,
          successRate: 0.96,
        },
      };
    },

    getUserAnalytics: async (userId: string) => {
      return {
        totalGenerated: 25,
        platformBreakdown: {
          linkedin: 15,
          facebook: 10,
        },
        avgConfidence: 0.89,
        recentActivity: [
          {
            meetingId: '2',
            meetingTitle: 'Product Roadmap Review',
            postsGenerated: 2,
            generatedAt: new Date('2025-09-07T11:00:00'),
          },
          {
            meetingId: '3',
            meetingTitle: 'Team Standup',
            postsGenerated: 1,
            generatedAt: new Date('2025-09-06T15:30:00'),
          },
        ],
      };
    },
  },

  // Calendar endpoints
  calendar: {
    getUpcomingMeetings: async () => {
      // This would call Google Calendar API through backend
      return {
        meetings: [
          {
            id: 'gcal_1',
            title: 'Q4 Strategy Planning',
            startTime: new Date('2025-09-07T14:00:00'),
            endTime: new Date('2025-09-07T15:00:00'),
            attendees: ['john@company.com', 'sarah@company.com'],
            meetLink: 'https://meet.google.com/abc-def-ghi',
          },
        ],
      };
    },

    syncCalendar: async () => {
      return { message: 'Calendar sync initiated', jobId: 'sync_123' };
    },
  },
};

// Real API client (commented out for now)
/*
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (data) => apiClient.post('/auth/register', data),
  },
  meetings: {
    getUpcoming: () => apiClient.get('/meetings'),
    getById: (id) => apiClient.get(`/meetings/${id}`),
    toggleBot: (id, enabled) => apiClient.patch(`/meetings/${id}/bot`, { enabled }),
  },
  social: {
    getGeneratedContent: () => apiClient.get('/social/generated-content'),
    approvePost: (id) => apiClient.post(`/social/posts/${id}/approve`),
    schedulePost: (id, scheduledFor) => apiClient.post(`/social/posts/${id}/schedule`, { scheduledFor }),
  },
  jobs: {
    getQueueStatus: () => apiClient.get('/jobs/status'),
    getJobs: (queueName) => apiClient.get(`/jobs/${queueName}/jobs`),
  },
  ai: {
    getHealthStatus: () => apiClient.get('/ai/health'),
    getUserAnalytics: (userId) => apiClient.get(`/ai/analytics/${userId}`),
  },
  calendar: {
    getUpcomingMeetings: () => apiClient.get('/calendar/meetings'),
    syncCalendar: () => apiClient.post('/calendar/sync'),
  },
};
*/
