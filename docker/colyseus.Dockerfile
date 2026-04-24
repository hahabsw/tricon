FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.json ./
COPY src/server/ ./src/server/
COPY src/game/ ./src/game/

RUN mkdir -p /app/data

EXPOSE 2567

CMD ["npx", "tsx", "src/server/index.ts"]
