# Use Node.js 18 Alpine for smaller image
FROM node:18-alpine

# Set working directory
WORKDIR /app/apps/web

# Copy package files
COPY apps/web/package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm install

# Copy web app source
COPY apps/web ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
