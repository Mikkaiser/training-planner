FROM node:22-alpine AS base
RUN npm install -g pnpm@10

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN pnpm build

# Applies db/migrations before the new web container starts.
#
# Its own stage because the runtime image is Next's standalone output, which
# deliberately contains neither tsx nor the migration files. Running the real
# runner rather than re-implementing it in shell keeps one source of truth for
# what "applied" means — an earlier hand-rolled version of that logic is
# exactly what misreported a successful migration as a failure.
FROM base AS migrator
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY scripts/migrate.ts ./scripts/
COPY db ./db
CMD ["pnpm", "migrate"]

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
