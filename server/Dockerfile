# STEP 1: Build NestJS application
FROM node:24-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install build dependencies
COPY package.json yarn.lock ./
COPY prisma ./prisma/

RUN yarn install --frozen-lockfile

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code
COPY . .

# Build the project
RUN yarn build

# STEP 2: Production runner stage
FROM node:24-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json yarn.lock ./

# Install only production dependencies for smaller image footprint
RUN yarn install --frozen-lockfile --production

# Copy generated Prisma Client from builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built app and prisma migrations
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 7002

CMD ["node", "dist/main.js"]
