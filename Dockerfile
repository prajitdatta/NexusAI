FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || npm install

# ── Builder ───────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built output and production dependencies only
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Create config directory
RUN mkdir -p /root/.nexusai/logs /root/.nexusai/workspace

EXPOSE 19000 19001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:19001/').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

ENTRYPOINT ["node", "dist/cli/index.js"]
CMD ["gateway"]
