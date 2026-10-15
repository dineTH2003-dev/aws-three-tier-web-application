# ==============================================================================
# Multi-stage Dockerfile for Node.js Backend API
# Node 20 on Debian Bookworm Slim provides full glibc & native addon compatibility (argon2)
# ==============================================================================

# --- Stage 1: Build Dependencies ---
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install build essentials required for native addons (e.g., argon2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev --no-audit --no-fund

# --- Stage 2: Minimal Production Runtime ---
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY certs/ ./certs/

# Run as non-privileged user for container security
USER node

EXPOSE 3000

# Native Node 20 health check (no extra curl/wget binary needed)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
