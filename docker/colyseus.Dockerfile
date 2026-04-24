FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs package.json ./
COPY --chown=nextjs:nodejs tsconfig.json ./
COPY --chown=nextjs:nodejs src/server/ ./src/server/
COPY --chown=nextjs:nodejs src/game/ ./src/game/

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs
EXPOSE 2567

CMD ["npx", "tsx", "src/server/index.ts"]
