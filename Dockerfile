# Multi-stage Dockerfile for CSEPL-4 on Railway / Cloud Containers
FROM node:22-alpine AS builder
WORKDIR /app

# Copy root workspace and package manifests
COPY package.json pnpm-workspace.yaml* ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY server/prisma ./server/prisma/

RUN npm install

# Copy source code and build client & server
COPY client ./client
COPY server ./server
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY server/package.json ./server/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist

# Create uploads directory mount target
RUN mkdir -p /app/server/uploads /app/uploads

EXPOSE 3001
CMD ["sh", "-c", "npm run db:push -w server && npm run start"]
