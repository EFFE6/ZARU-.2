# MediSENA Backend API — contexto de build: carpeta backend/
# Ejemplo: docker build -t medisena-be -f Dockerfile .
FROM node:20-bookworm-slim

LABEL org.opencontainers.image.title="MediSENA Backend API"
LABEL org.opencontainers.image.description="API REST MediSENA (SENA)"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

ENV NODE_ENV=production
ENV PORT=8081

RUN chown -R node:node /app
USER node

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 8081) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
