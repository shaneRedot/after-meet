'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from './api';

// Types matching our backend entities
export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recallEnabled: boolean;
  status: 'upcoming' | 'in-progress' | 'completed';
  transcript?: string;
  botId?: string;
  userId: string;
  attendees?: string[];
  googleMeetLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialPost {
  id: string;
  meetingId: string;
  platform: 'linkedin' | 'facebook';
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: Date;
  publishedAt?: Date;
  confidence: number;
  automationId?: string;
  userId: string;
  createdAt: Date;
}

export interface JobStatus {
  id: string;
  name: string;
  progress: number;
  data: any;
  opts: any;
  timestamp: number;
  attemptsMade: number;
}

export interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface AppState {
  user: {
    id?: string;
    email?: string;
    name?: string;
    isAuthenticated: boolean;
  };
  meetings: {
    upcoming: Meeting[];
    recent: Meeting[];
    loading: boolean;
    error?: string;
  };
  socialPosts: {
    posts: SocialPost[];
    loading: boolean;
    error?: string;
  };
  jobs: {
    queues: QueueStatus[];
    recentJobs: JobStatus[];
    loading: boolean;
    error?: string;
  };
  ai: {
    healthStatus?: any;
    analytics?: any;
    loading: boolean;
    error?: string;
  };
}

type AppAction = 
  | { type: 'SET_USER'; payload: any }
  | { type: 'SET_MEETINGS'; payload: { upcoming: Meeting[]; recent: Meeting[] } }
  | { type: 'SET_SOCIAL_POSTS'; payload: SocialPost[] }
  | { type: 'SET_JOB_STATUS'; payload: QueueStatus[] }
  | { type: 'SET_LOADING'; payload: { section: keyof AppState; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { section: keyof AppState; error: string } }
  | { type: 'TOGGLE_MEETING_BOT'; payload: { meetingId: string; enabled: boolean } };

const initialState: AppState = {
  user: {
    isAuthenticated: false,
  },
  meetings: {
    upcoming: [],
    recent: [],
    loading: false,
  },
  socialPosts: {
    posts: [],
    loading: false,
  },
  jobs: {
    queues: [],
    recentJobs: [],
    loading: false,
  },
  ai: {
    loading: false,
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: { ...action.payload, isAuthenticated: true },
      };
    
    case 'SET_MEETINGS':
      return {
        ...state,
        meetings: {
          ...state.meetings,
          upcoming: action.payload.upcoming,
          recent: action.payload.recent,
          loading: false,
          error: undefined,
        },
      };
    
    case 'SET_SOCIAL_POSTS':
      return {
        ...state,
        socialPosts: {
          ...state.socialPosts,
          posts: action.payload,
          loading: false,
          error: undefined,
        },
      };
    
    case 'SET_JOB_STATUS':
      return {
        ...state,
        jobs: {
          ...state.jobs,
          queues: action.payload,
          loading: false,
          error: undefined,
        },
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        [action.payload.section]: {
          ...state[action.payload.section],
          loading: action.payload.loading,
        },
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        [action.payload.section]: {
          ...state[action.payload.section],
          error: action.payload.error,
          loading: false,
        },
      };
    
    case 'TOGGLE_MEETING_BOT':
      return {
        ...state,
        meetings: {
          ...state.meetings,
          upcoming: state.meetings.upcoming.map(meeting =>
            meeting.id === action.payload.meetingId
              ? { ...meeting, recallEnabled: action.payload.enabled }
              : meeting
          ),
        },
      };
    
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    loadMeetings: () => Promise<void>;
    loadSocialPosts: () => Promise<void>;
    loadJobStatus: () => Promise<void>;
    loadAIStatus: () => Promise<void>;
    toggleMeetingBot: (meetingId: string, enabled: boolean) => Promise<void>;
    syncCalendar: () => Promise<any>;
    refreshData: () => Promise<void>;
    logout: () => void;
  };
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = {
    loadMeetings: async () => {
      try {
        console.log('🔄 Store: Starting to load meetings...');
        dispatch({ type: 'SET_LOADING', payload: { section: 'meetings', loading: true } });
        
        const token = localStorage.getItem('auth_token');
        console.log('🔑 Store: Auth token present:', !!token);
        
        // Get upcoming meetings (startTime >= now)
        const upcomingResponse = await api.meetings.getUpcoming();
        console.log('📊 Store: Upcoming API response:', upcomingResponse);
        
        // Get completed meetings (startTime < now) 
        const recentResponse = await api.meetings.getRecent();
        console.log('📊 Store: Recent API response:', recentResponse);
        
        const upcoming = upcomingResponse.meetings || [];
        const recent = recentResponse.meetings || [];
        
        console.log('📈 Store: Filtered meetings - upcoming:', upcoming.length, 'recent:', recent.length);
        
        dispatch({ type: 'SET_MEETINGS', payload: { upcoming, recent } });
      } catch (error) {
        console.error('❌ Store: Failed to load meetings:', error);
        dispatch({ type: 'SET_ERROR', payload: { section: 'meetings', error: 'Failed to load meetings' } });
      }
    },

    loadSocialPosts: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: { section: 'socialPosts', loading: true } });
        const response = await api.social.getGeneratedContent();
        dispatch({ type: 'SET_SOCIAL_POSTS', payload: response.posts });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: { section: 'socialPosts', error: 'Failed to load social posts' } });
      }
    },

    loadJobStatus: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: { section: 'jobs', loading: true } });
        const response = await api.jobs.getQueueStatus();
        dispatch({ type: 'SET_JOB_STATUS', payload: response.queues });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: { section: 'jobs', error: 'Failed to load job status' } });
      }
    },

    loadAIStatus: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: { section: 'ai', loading: true } });
        const healthResponse = await api.ai.getHealthStatus();
        const analyticsResponse = await api.ai.getUserAnalytics('1'); // Mock user ID
        
        // Update AI state (would need to extend reducer for this)
        dispatch({ type: 'SET_LOADING', payload: { section: 'ai', loading: false } });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: { section: 'ai', error: 'Failed to load AI status' } });
      }
    },

    toggleMeetingBot: async (meetingId: string, enabled: boolean) => {
      try {
        await api.meetings.toggleBot(meetingId, enabled);
        dispatch({ type: 'TOGGLE_MEETING_BOT', payload: { meetingId, enabled } });
      } catch (error) {
        console.error('Failed to toggle meeting bot:', error);
      }
    },

    syncCalendar: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: { section: 'meetings', loading: true } });
        const response = await api.calendar.syncCalendar();
        
        // Reload meetings after sync to show updated data
        await actions.loadMeetings();
        
        return response;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: { section: 'meetings', error: 'Calendar sync failed' } });
        console.error('Calendar sync failed:', error);
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { section: 'meetings', loading: false } });
      }
    },

    logout: () => {
      // Clear authentication data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      // Reset user state to unauthenticated
      dispatch({ 
        type: 'SET_USER', 
        payload: { 
          id: '', 
          email: '', 
          name: '',
          isAuthenticated: false 
        } 
      });
      
      // Redirect to home page
      window.location.href = '/';
    },

    refreshData: async () => {
      await Promise.all([
        actions.loadMeetings(),
        actions.loadSocialPosts(),
        actions.loadJobStatus(),
        actions.loadAIStatus(),
      ]);
    },
  };

  // Load initial data
  useEffect(() => {
      // Check for real authentication first
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token && userData) {
        // User is authenticated
        try {
          const user = JSON.parse(userData);
          dispatch({ type: 'SET_USER', payload: user });
          actions.refreshData();
        } catch (error) {
          console.error('Failed to parse user data:', error);
          // Clear invalid data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      }
      // If no token/userData, user stays unauthenticated
  }, []);

  // Auto-refresh data every 30 seconds (only when authenticated)
  useEffect(() => {
    if (!state.user.isAuthenticated) return;
    
    const interval = setInterval(() => {
      actions.loadJobStatus(); // Only refresh jobs for real-time updates
    }, 30000);

    return () => clearInterval(interval);
  }, [state.user.isAuthenticated]);

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
