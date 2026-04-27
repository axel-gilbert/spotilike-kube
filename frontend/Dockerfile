FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

COPY --from=build --chown=appuser:appgroup /app/build ./build
COPY --from=build --chown=appuser:appgroup /app/package.json ./
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules

USER appuser

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "build/index.js"]
