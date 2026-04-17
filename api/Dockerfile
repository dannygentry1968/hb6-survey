# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# System deps needed by Prisma engines on alpine
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts

# Copy built artifacts and generated prisma client
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY src/public ./dist/public

# Sync schema on startup (creates tables on first run, no-op after),
# then start the server. `db push` is idempotent and safe to re-run.
CMD sh -c "npx prisma db push --skip-generate && node dist/server.js"

EXPOSE 4000
