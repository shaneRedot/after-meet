# Use Node.js 18 Alpine for smaller image
FROM node:18-alpine

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy root package.json and workspace configuration
COPY package*.json ./
COPY tsconfig.json ./

# Copy packages (dependencies)
COPY packages/ ./packages/

# Copy API app
COPY apps/api/ ./apps/api/

# Install all workspace dependencies from root
RUN npm install

# Build the database package first
RUN cd packages/database && npm run build

# Build the minimal API
WORKDIR /app/apps/api
RUN npm run build

# Expose port
EXPOSE 3001

# Start the minimal API (bypasses TypeScript errors)
CMD ["npm", "run", "start"]
