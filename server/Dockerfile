FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 python-is-python3 ffmpeg \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 python-is-python3 ffmpeg \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
CMD ["npm", "start"]
