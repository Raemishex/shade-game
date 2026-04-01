# SHADE Game — Multi-stage Docker Build
# Builds Next.js frontend + Express/Socket.io server in one image

FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000 3001

# Start both servers
CMD ["sh", "-c", "node server/index.js & node server.js"]
