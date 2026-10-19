# Multi-stage image: MCP server + simulator API serving built UI
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY mcp-server/package.json mcp-server/
COPY simulator/package.json simulator/
RUN npm ci
COPY . .
RUN npm run build -w @hearth/shared \
  && npm run build -w mcp-server \
  && npm run build -w simulator

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3100 8787
CMD ["node", "scripts/docker-start.mjs"]
