# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for native modules (including better-sqlite3)
RUN apk add --no-cache python3 make g++ sqlite-dev

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the application for Node.js
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
RUN pnpm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies for SQLite
RUN apk add --no-cache sqlite-libs

WORKDIR /app

# Create data directory for SQLite database
RUN mkdir -p /app/data && chmod 777 /app/data

# Copy built files from builder
COPY --from=builder /app/.output /app/.output

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Give ownership of data directory to nodejs user
RUN chown -R nodejs:nodejs /app/data

USER nodejs

# Expose port
EXPOSE 3000

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV DATA_DIR=/app/data

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", ".output/server/index.mjs"]
