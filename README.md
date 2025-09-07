# After Meet - Post-Meeting Social Media Content Generator

A comprehensive platform that automatically generates social media content from meeting transcripts using AI, with seamless calendar integration and multi-platform posting capabilities.

## 🚀 Features

- **Google Calendar Integration**: Automatic meeting detection and bot scheduling
- **AI-Powered Content Generation**: Create engaging social media posts from meeting transcripts
- **Multi-Platform Support**: Post to LinkedIn and Facebook
- **Automated Meeting Bots**: Recall.ai integration for transcript capture
- **Customizable Automations**: Configure post generation templates
- **OAuth Authentication**: Secure login with Google, LinkedIn, and Facebook

## 🏗️ Architecture

```
after-meet/
├── apps/
│   ├── api/          # NestJS Backend API
│   └── web/          # Next.js Frontend
├── packages/
│   ├── database/     # TypeORM entities & migrations
│   ├── shared/       # Shared types & utilities
│   └── ui/           # Shared UI components
└── docker-compose.yml
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript + TypeORM
- **Database**: PostgreSQL
- **Queue**: RabbitMQ
- **Auth**: OAuth 2.0 (Google, LinkedIn, Facebook)
- **AI**: OpenAI GPT-4
- **Meeting Bots**: Recall.ai

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- RabbitMQ (optional for local dev)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run database migrations
npm run migration:run

# Start development servers
npm run dev
```

## 📁 Project Structure

### Apps
- **API** (`apps/api`): NestJS backend with authentication, calendar sync, AI generation
- **Web** (`apps/web`): Next.js frontend with dashboard, meeting management, social posting

### Packages
- **Database** (`packages/database`): TypeORM entities, migrations, and database utilities
- **Shared** (`packages/shared`): Common types, utilities, and business logic
- **UI** (`packages/ui`): Reusable React components and design system

## 🔧 Development Workflow

1. **Database Changes**: Update entities in `packages/database`, generate migrations
2. **API Development**: Add controllers/services in `apps/api`
3. **Frontend Development**: Build components in `apps/web`
4. **Shared Code**: Common utilities in `packages/shared`

## 📝 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aftermeet

# Authentication
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# External APIs
RECALL_API_KEY=your-recall-api-key
OPENAI_API_KEY=your-openai-api-key

# Queue (optional)
RABBITMQ_URL=amqp://localhost:5672
```

## 🚀 Deployment

- **Frontend**: Vercel (recommended) or any static hosting
- **Backend**: Railway, Render, or AWS ECS
- **Database**: Railway PostgreSQL, Supabase, or AWS RDS
- **Queue**: CloudAMQP or self-hosted

## 📄 License

MIT License - see LICENSE file for details
