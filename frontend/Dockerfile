# BitCurrent Frontend - Docker Image
# Multi-stage build for Next.js application

# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/ .
COPY --from=deps /app/node_modules ./node_modules

# Build arguments for API URL
ARG NEXT_PUBLIC_API_URL=http://aa566433839ec4bfe8113014ed98d8b9-1852355696.eu-west-2.elb.amazonaws.com
ARG NEXT_PUBLIC_WS_URL=ws://aa566433839ec4bfe8113014ed98d8b9-1852355696.eu-west-2.elb.amazonaws.com/ws

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 nodejs && adduser -D -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]

