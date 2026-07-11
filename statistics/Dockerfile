# STEP 1: Build Next.js application
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# STEP 2: Production runner stage
FROM node:24-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/yarn.lock ./
# Install production dependencies only
RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 7004

CMD ["yarn", "start", "-p", "7004"]
