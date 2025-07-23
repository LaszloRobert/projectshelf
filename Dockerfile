# Use the official Node.js 22 image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Make port configurable via environment variable
ENV PORT=8080
EXPOSE $PORT

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]