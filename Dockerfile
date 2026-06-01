FROM node:20-alpine AS backend-build

WORKDIR /workspace/backend

# better-sqlite3 needs build tooling on alpine
RUN apk add --no-cache python3 make g++ libc6-compat

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

FROM node:20-alpine AS backend

WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat

COPY --from=backend-build /workspace/backend/package.json /workspace/backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=backend-build /workspace/backend ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

EXPOSE 1337

CMD ["npm", "run", "start"]

FROM node:20-alpine AS frontend-build

WORKDIR /workspace/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

ARG VITE_API_URL=http://localhost:1337
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine AS frontend

COPY --from=frontend-build /workspace/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
