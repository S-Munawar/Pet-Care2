# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root workspace files (needed for monorepo context)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy server source code
COPY apps/server ./apps/server

# Build the server (this generates the dist folder)
WORKDIR /app/apps/server
RUN pnpm build

# Stage 2: Run the application
FROM node:20-slim

WORKDIR /app

# Copy only the compiled output from the builder stage
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./

# Install only production dependencies
RUN npm install --omit=dev

EXPOSE 2000

CMD ["node", "dist/server.js"]