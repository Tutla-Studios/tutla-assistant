# syntax=docker/dockerfile:1

# ── base: runtime OS deps ─────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS base
# ffmpeg: /player voice transcoding · openssl: Prisma · ca-certificates: outbound HTTPS
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ── deps: install node_modules (cached unless the lockfile changes) ───────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── build: generate Prisma client and build Next ──────────────────────────────
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ── runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Full app dir: the bot needs node_modules (native/external packages), src/bot/assets,
# and the Prisma CLI + migrations for `migrate deploy` on startup.
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
