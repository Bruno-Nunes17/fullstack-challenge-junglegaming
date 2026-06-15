FROM node:24-alpine AS build

WORKDIR /app
COPY package.json bun.lock ./
COPY frontend/package.json ./frontend/

# Hack to satisfy bun workspaces during install
RUN mkdir -p services/games services/wallets packages/contracts && \
    echo '{"name": "@crash/games"}' > services/games/package.json && \
    echo '{"name": "@crash/wallets"}' > services/wallets/package.json && \
    echo '{"name": "@crash/contracts"}' > packages/contracts/package.json

RUN npm install -g bun
RUN bun install
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN bun run build

FROM nginx:stable-alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
