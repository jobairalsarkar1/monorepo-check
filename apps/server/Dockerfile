FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src ./src

RUN pnpm install
RUN pnpm build

CMD ["node", "dist/index.js"]
