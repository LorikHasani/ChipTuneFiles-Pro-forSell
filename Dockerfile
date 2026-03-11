# Build stage - Client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build stage - Server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy server
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/package.json ./server/
COPY --from=server-build /app/server/prisma ./server/prisma

# Copy client build
COPY --from=client-build /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p ./server/uploads

WORKDIR /app/server

# Run migrations and start
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]

EXPOSE 3000
