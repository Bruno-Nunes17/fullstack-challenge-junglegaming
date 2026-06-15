FROM oven/bun:1-alpine

WORKDIR /app

# Copy the whole monorepo structure needed for this service
COPY package.json ./
COPY packages/ ./packages/
COPY services/games/package.json ./services/games/

# Hack to satisfy bun workspaces during install
RUN mkdir -p frontend && echo '{"name": "frontend"}' > frontend/package.json

RUN bun install

COPY services/games/ ./services/games/

WORKDIR /app/services/games

EXPOSE 4001

CMD ["bun", "run", "src/main.ts"]
