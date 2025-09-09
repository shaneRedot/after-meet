'use client';

import { useApp } from '../../lib/store';
import { api } from '../../lib/api';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { state, actions } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { meetings, socialPosts, jobs, user } = state;

  if (!user.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="bg-blue-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6">
              Please sign in with your Google account to access the After-Meet dashboard.
            </p>
            <a 
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/google`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              Sign in with Google
            </a>
            <p className="text-sm text-gray-500 mt-4">
              <a href="/" className="text-blue-600 hover:text-blue-700">← Back to Home</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">After-Meet</h1>
                <p className="text-sm text-gray-500">AI Social Content Generator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {currentTime.toLocaleString()}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <button 
                onClick={actions.refreshData}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Refresh
              </button>
              {user.email !== 'demo@after-meet.com' && (
                <button 
                  onClick={actions.logout}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Demo Notice Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                {user.email === 'demo@after-meet.com' ? (
                  <>
                    <h3 className="text-lg font-semibold">Live Demo Coming Soon!</h3>
                    <p className="text-blue-100">
                      This dashboard preview shows the After-Meet interface. Full demo with live data will be available soon.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">Welcome to After-Meet!</h3>
                    <p className="text-blue-100">
                      Your account is connected. Start by connecting your Google Calendar to enable meeting automation.
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                {user.email === 'demo@after-meet.com' ? 'Preview Mode' : 'Active Account'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{meetings.upcoming.length}</p>
                {meetings.loading && <div className="text-xs text-blue-600">Loading...</div>}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bots Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.queues.find(q => q.name === 'meeting-bot')?.active || 0}
                </p>
                {jobs.loading && <div className="text-xs text-blue-600">Loading...</div>}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Content Generated</p>
                <p className="text-2xl font-bold text-gray-900">{socialPosts.posts.length}</p>
                {socialPosts.loading && <div className="text-xs text-blue-600">Loading...</div>}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Posts Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {socialPosts.posts.filter(p => p.status === 'published').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Meetings */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h2>
              {meetings.loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
            <div className="p-6">
              {meetings.error && (
                <div className="text-red-600 text-sm mb-4">{meetings.error}</div>
              )}
              {meetings.upcoming.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming meetings</p>
              ) : (
                meetings.upcoming.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-4 border rounded-lg mb-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(meeting.startTime).toLocaleString()} • {meeting.duration || 60}min
                      </p>
                      <div className="flex items-center mt-2">
                        <button
                          onClick={() => actions.toggleMeetingBot(meeting.id, !meeting.recallEnabled)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            meeting.recallEnabled 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          } cursor-pointer transition-colors`}
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          {meeting.recallEnabled ? 'Bot Enabled' : 'Bot Disabled'}
                        </button>
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {meetings.recent.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent meetings</p>
              ) : (
                meetings.recent.map((meeting) => (
                  <div key={meeting.id} className="p-4 border rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                      {meeting.transcript ? (
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(meeting.startTime).toLocaleString()}
                    </p>
                    {meeting.transcript && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Content Generated
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Generated Content Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Generated Social Content</h2>
            {socialPosts.loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>
          <div className="p-6">
            {socialPosts.error && (
              <div className="text-red-600 text-sm mb-4">{socialPosts.error}</div>
            )}
            {socialPosts.posts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No generated content yet</p>
            ) : (
              <div className="grid gap-6">
                {socialPosts.posts.map((content) => (
                  <div key={content.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="capitalize font-medium text-gray-900">{content.platform}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          content.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : content.status === 'scheduled'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {content.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Confidence: {Math.round(content.confidence * 100)}%
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{content.content}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {content.status === 'published' 
                          ? `Published ${content.publishedAt ? new Date(content.publishedAt).toLocaleString() : 'recently'}`
                          : content.scheduledFor
                          ? `Scheduled for ${new Date(content.scheduledFor).toLocaleString()}`
                          : 'Draft'
                        }
                      </div>
                      {content.status === 'draft' && (
                        <div className="space-x-2">
                          <button 
                            onClick={() => api.social.approvePost(content.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => api.social.schedulePost(content.id, new Date(Date.now() + 3600000))}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Schedule
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Background Jobs Queue */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Backend Jobs Status</h2>
            {jobs.loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>
          <div className="p-6">
            {jobs.error && (
              <div className="text-red-600 text-sm mb-4">{jobs.error}</div>
            )}
            {jobs.queues.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Loading job status...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {jobs.queues.map((queue) => (
                  <div key={queue.name} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 capitalize mb-2">
                      {queue.name.replace('-', ' ')}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Waiting:</span>
                        <span className="font-medium">{queue.waiting}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active:</span>
                        <span className="font-medium text-blue-600">{queue.active}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium text-green-600">{queue.completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Failed:</span>
                        <span className="font-medium text-red-600">{queue.failed}</span>
                      </div>
                    </div>
                    {queue.paused && (
                      <div className="mt-2 text-xs text-orange-600">Queue Paused</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* API Integration Info */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">🔗 Backend Integration Active</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">✅ API Endpoints Connected</h3>
              <ul className="space-y-1 opacity-90">
                <li>• Meetings API ({meetings.loading ? 'Loading...' : 'Ready'})</li>
                <li>• Social Media API ({socialPosts.loading ? 'Loading...' : 'Ready'})</li>
                <li>• Jobs Queue API ({jobs.loading ? 'Loading...' : 'Ready'})</li>
                <li>• AI Processing API (Ready)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🔄 Real-time Updates</h3>
              <ul className="space-y-1 opacity-90">
                <li>• Job status auto-refresh (30s)</li>
                <li>• Meeting bot toggle</li>
                <li>• Content approval workflow</li>
                <li>• Live data synchronization</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⚡ Background Processing</h3>
              <ul className="space-y-1 opacity-90">
                <li>• Meeting bot deployment</li>
                <li>• AI content generation</li>
                <li>• Social media posting</li>
                <li>• System cleanup tasks</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
