export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
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
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Turn Your Meetings Into
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Social Gold</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automatically generate and post engaging social media content from your meeting insights using AI. 
            Connect your calendar, let our AI bot join meetings, and watch as your professional insights become viral content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/dashboard" className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-block">
              View Dashboard Preview
            </a>
            <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors">
              Watch Video
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How After-Meet Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Meeting Detected</h3>
              <p className="text-sm text-gray-600">
                Calendar integration monitors your upcoming meetings and schedules recording bots automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Bot Records</h3>
              <p className="text-sm text-gray-600">
                Recall.ai bot joins your meeting, records audio/video, and generates accurate transcripts.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Content Generated</h3>
              <p className="text-sm text-gray-600">
                GPT-4 AI analyzes meeting insights and creates engaging social media posts for each platform.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Auto-Published</h3>
              <p className="text-sm text-gray-600">
                Posts are automatically published to LinkedIn and Facebook, or scheduled for your review.
              </p>
            </div>
          </div>
        </div>

        {/* Backend Architecture Showcase */}
        <div className="mt-20 bg-white rounded-2xl p-8 border shadow-sm">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Powered by Advanced AI Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-900">NestJS Backend</h3>
                <p className="text-sm text-gray-600 mt-2">8 specialized modules handling authentication, calendar integration, AI processing, and social media automation</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-900">Background Jobs</h3>
                <p className="text-sm text-gray-600 mt-2">Redis-powered job queues with Bull for reliable meeting bot deployment and content generation</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-900">AI Integration</h3>
                <p className="text-sm text-gray-600 mt-2">OpenAI GPT-4, Recall.ai meeting bots, and smart content optimization for maximum engagement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Data Section */}
        <div className="mt-20 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Live Demo: Backend in Action</h2>
            <p className="text-gray-300 text-sm">
              Preview the interface - Full live demo with real data coming soon!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mock Meeting Data */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-green-400">✅ Recent Meeting</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">Title:</span> Product Roadmap Review</p>
                <p><span className="text-gray-400">Duration:</span> 90 minutes</p>
                <p><span className="text-gray-400">Bot Status:</span> ✅ Recording Complete</p>
                <p><span className="text-gray-400">Transcript:</span> ✅ Available</p>
                <p><span className="text-gray-400">AI Analysis:</span> ✅ Complete</p>
              </div>
            </div>

            {/* Generated Content */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-blue-400">🤖 AI Generated Content</h3>
              <div className="bg-gray-700 p-4 rounded text-sm">
                <p className="text-green-300 font-medium">LinkedIn Post:</p>
                <p className="mt-2">&quot;🚀 Just wrapped up an incredible product roadmap review! Our team is aligned on exciting Q4 features. #ProductStrategy #Innovation&quot;</p>
                <p className="mt-2 text-gray-400">Confidence: 92% | Status: Scheduled</p>
              </div>
            </div>
          </div>

          {/* Background Jobs */}
          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-yellow-400">⚡ Background Jobs Queue</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Meeting Bot → Q4 Strategy Planning</span>
                <span className="text-yellow-300">⏳ Scheduled (13:45)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Content Generation → Product Review</span>
                <span className="text-blue-300">🔄 Processing (75%)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Social Posting → LinkedIn</span>
                <span className="text-green-300">✅ Published</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Meetings?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of professionals who are already turning their meeting insights into viral content.
          </p>
          <a href="/dashboard" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-lg text-xl font-semibold hover:shadow-lg transition-all inline-block">
            Try Live Demo
          </a>
        </div>
      </div>
    </div>
  );
}
