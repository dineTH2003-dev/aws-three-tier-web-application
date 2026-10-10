# ==============================================================================
# Multi-stage Dockerfile for React SPA Frontend
# ==============================================================================

# --- Stage 1: Build React Production Bundle ---
FROM node:20-alpine AS builder

WORKDIR /app

# Allow passing API base URL at build time (defaults to /api/v1 for reverse proxy/CloudFront)
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# --- Stage 2: Serve Static Assets with Lightweight Nginx ---
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
