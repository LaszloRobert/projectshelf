wha# Use the official Node.js 22 image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Make port configurable via environment variable
ENV PORT=8080
EXPOSE $PORT

# Create startup script
RUN echo '#!/bin/sh\nnpx prisma migrate deploy\nnpm start' > /start.sh && chmod +x /start.sh

# Start the application
CMD ["/start.sh"]