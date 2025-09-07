# After Meet - Meeting Intelligence Platform

A comprehensive platform for meeting management, AI-powered content generation, and social media automation.

## 🚀 Quick Start - Local Development (Recommended)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or use Docker for database)

### **CURRENT WORKING SETUP:**

1. **Start Database & Redis (Docker):**
```bash
docker-compose up postgres redis -d
```

2. **Start API Server:**
```bash
cd D:\after-meet\apps\api
node dist/apps/api/src/main.js
```

3. **Start Frontend (New Terminal):**
```bash
cd D:\after-meet\apps\web
npm run dev
```

**Services will be available at:**
- **API**: http://localhost:3001 ✅ 
- **Web App**: http://localhost:3000
- **Database**: PostgreSQL on port 5432
- **Redis**: Port 6379

## 🐳 Docker Deployment (Alternative)

### Prerequisites
- Docker and Docker Compose installed
- Recall.ai API key

### Environment Setup
1. Copy environment files:
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

2. Configure your Recall.ai API key in:
   - `apps/api/.env`: Set `RECALL_API_TOKEN=your_api_key_here`

### Deploy with Docker
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

## 🛠️ Development Setup (Full Local)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis

### Setup
```bash
# Install dependencies
npm install

# Build packages
npm run build

# Start database (Docker)
docker-compose up postgres redis -d

# Start API server
cd apps/api
npm run start:dev

# Start web server (new terminal)
cd apps/web
npm run dev
```

## 📁 Project Structure

```
after-meet/
├── apps/
│   ├── api/              # NestJS Backend API
│   └── web/              # Next.js Frontend
├── packages/
│   ├── database/         # Database entities & migrations
│   └── shared/           # Shared utilities & types
├── scripts/              # Database initialization
└── docker-compose.yml   # Docker services
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get user profile

### Meetings
- `GET /meetings` - List meetings
- `POST /meetings` - Create meeting
- `GET /meetings/:id` - Get meeting details
- `PUT /meetings/:id` - Update meeting
- `DELETE /meetings/:id` - Delete meeting

### AI Content Generation
- `POST /ai/generate-content` - Generate AI content
- `POST /ai/summarize` - Summarize meeting content

### Calendar Integration
- `GET /calendar/events` - Get calendar events
- `POST /calendar/sync` - Sync calendar

### Social Media
- `GET /social/posts` - List social posts
- `POST /social/schedule` - Schedule social post

### Recall.ai Integration
- `POST /recall/create-bot` - Create meeting bot
- `GET /recall/bots` - List active bots
- `DELETE /recall/bots/:id` - Remove bot

## 🗄️ Database

### Run Migrations
```bash
cd packages/database
npm run migration:run
```

### Create Migration
```bash
cd packages/database
npm run migration:generate -- -n MigrationName
```

## 🔍 Troubleshooting

### Docker Issues
1. **Port conflicts**: Ensure ports 3000, 3001, 5432, 6379 are available
2. **Build failures**: Run `docker-compose down -v` and rebuild
3. **Database connection**: Check PostgreSQL container is running

### API Issues
1. **Module not found**: Run `npm run build` in root directory
2. **Database connection**: Verify DATABASE_URL in .env
3. **Recall.ai errors**: Check RECALL_API_TOKEN is valid

### Common Commands
```bash
# Reset Docker environment
docker-compose down -v
docker-compose up --build

# Reset node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install

# Check logs
docker-compose logs api
docker-compose logs web
```

## 🔐 Environment Variables

### API (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/aftermeet
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
RECALL_API_TOKEN=your-recall-api-key
OPENAI_API_KEY=your-openai-key
```

### Web (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📊 Health Checks

### API Health
```bash
curl http://localhost:3001/health
```

### Database Connection
```bash
node test-db-connection.js
```

## 🚀 Production Deployment

1. Set production environment variables
2. Build production images:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

3. Run database migrations:
```bash
docker-compose exec api npm run migration:run
```

## 📝 License

Private project - All rights reserved

## 🤝 Support

For support and questions, contact the development team.
