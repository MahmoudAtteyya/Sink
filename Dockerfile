# Simple Dockerfile without multi-stage build
FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache python3 make g++ sqlite-dev sqlite-libs

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

WORKDIR /app

# Copy files
COPY . .

# Install and build
RUN pnpm install --frozen-lockfile
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
RUN pnpm run build

# Create data directory
RUN mkdir -p /app/data && chmod 777 /app/data

# Expose port
EXPOSE 3000

# Environment
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATA_DIR=/app/data

# Start
CMD ["node", ".output/server/index.mjs"]
