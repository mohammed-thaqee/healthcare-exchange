# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/       ./src/
COPY scripts/   ./scripts/
COPY contracts/ ./contracts/
COPY hardhat.config.js ./

# Copy pre-compiled ABI (you must run npx hardhat compile before building)
# If artifacts/ exists, copy it; otherwise the blockchain service will error at runtime
COPY artifacts/ ./artifacts/

EXPOSE 3000

CMD ["node", "src/server.js"]