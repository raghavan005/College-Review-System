FROM node:20-alpine

# Build/run backend from repository root for submission convenience.
WORKDIR /app

# Install production dependencies first (better caching).
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source into container.
COPY backend/ ./

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]

