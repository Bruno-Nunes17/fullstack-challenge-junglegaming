FROM oven/bun:1-alpine

WORKDIR /app

# Copy the whole monorepo structure needed for this service
COPY package.json ./
COPY packages/ ./packages/
COPY services/wallets/package.json ./services/wallets/

# Hack to satisfy bun workspaces during install
RUN mkdir -p frontend && echo '{"name": "frontend"}' > frontend/package.json

RUN bun install

COPY services/wallets/ ./services/wallets/

WORKDIR /app/services/wallets

EXPOSE 4002

CMD ["bun", "run", "src/main.ts"]
