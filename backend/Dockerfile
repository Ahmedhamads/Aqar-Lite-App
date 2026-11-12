
# ==========================================
# Development dependencies
# ==========================================
FROM node:24-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci


# ==========================================
# Build
# ==========================================
FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate needs DATABASE_URL to exist.
# This placeholder is used only during image build.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

RUN npm run build


# ==========================================
# Production dependencies
# ==========================================
FROM node:24-bookworm-slim AS prod-deps

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --omit=dev


# ==========================================
# Production runtime
# ==========================================
FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

USER node

EXPOSE 4000

CMD ["node", "dist/server.js"]
