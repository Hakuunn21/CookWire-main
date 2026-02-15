# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for building
COPY package*.json ./
RUN npm install

# Copy source and build frontend
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine

WORKDIR /app

# Install build tools for better-sqlite3 (C++ addon)
RUN apk add --no-cache python3 make g++

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Verify critical dependencies are installed
RUN node -e "require('helmet')"

# Remove build tools to keep image small
RUN apk del python3 make g++

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend source
COPY server ./server

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

# Start the server
CMD ["npm", "run", "server"]
