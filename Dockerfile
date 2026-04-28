FROM node:20-bookworm-slim

WORKDIR /app/server

COPY server/package*.json ./

RUN npm ci --omit=dev

COPY server/ ./

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]