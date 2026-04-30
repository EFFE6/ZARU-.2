FROM docker.io/node:20-alpine AS build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
ENV VITE_API_URL=http://localhost:8081/api
RUN npm run build

FROM docker.io/nginx:1.27-alpine

COPY deploy/container/nginx-frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
