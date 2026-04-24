FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Prebuilt artifacts expected in build context:
# - .next/standalone
# - .next/static
# - public (optional)
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

# Ensure the data directory exists when no host volume is mounted.
RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
