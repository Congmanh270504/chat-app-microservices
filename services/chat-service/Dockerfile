# syntax=docker/dockerfile:1


FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

WORKDIR /app

FROM base AS builder

# Copy all source code (node_modules is ignored by .dockerignore)
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build common package first
RUN pnpm --filter @chatapp/common build

# Build chat-service
RUN pnpm --filter chat-service build


FROM node:22-alpine AS prodcution

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

# Create non-root user 
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Copy package.json files
COPY packages/common/package.json ./packages/common/
COPY services/chat-service/package.json ./services/chat-service/


# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifcats from builder
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/services/chat-service/dist ./services/chat-service/dist

# Change ownership to non(root)
RUN chown -R nodeuser:nodejs /app

USER nodeuser

ENV NODE_ENV=production
ENV CHAT_SERVICE_PORT=4002

EXPOSE 4002

WORKDIR /app/services/chat-service

CMD [ "node", "dist/index.js" ]