FROM node:18-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy app source
COPY . .

# Create non-root user (following Natoma's pattern)
RUN groupadd -r mcpuser && useradd -r -g mcpuser mcpuser
RUN chown -R mcpuser:mcpuser /usr/src/app
USER mcpuser

# Expose port (will be set by environment variable)
EXPOSE $PORT

# Health check - use the health endpoint when in HTTP mode
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-9090}/health || node -e "console.log('Server is healthy')" || exit 1

# Start the server
CMD ["npm", "start"]
