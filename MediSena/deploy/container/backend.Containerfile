FROM docker.io/node:20-bookworm-slim

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./

ENV NODE_ENV=production
ENV PORT=8081
EXPOSE 8081

USER node
CMD ["node", "server.js"]
