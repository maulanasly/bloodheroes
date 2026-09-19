# syntax=docker/dockerfile:1
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /srv/web
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/dashboard ./apps/dashboard
RUN npm ci --no-audit --no-fund \
  && npm run build --workspace @bloodheroes/dashboard \
  && npm prune --omit=dev \
  && npm cache clean --force
ENV PORT=3001
EXPOSE 3001
CMD ["npm", "run", "start", "--workspace", "@bloodheroes/dashboard"]
