# Use Node.js 18 Alpine for smaller image
FROM node:18-alpine

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app/apps/api

# Copy package files
COPY apps/api/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY apps/api ./

# Expose port
EXPOSE 3001

# Start in development mode (no build required)
CMD ["npm", "run", "start:dev"]
