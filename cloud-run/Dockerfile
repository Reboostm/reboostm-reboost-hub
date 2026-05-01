FROM node:22-slim

# Install dependencies for Playwright + Chromium (headless, no audio needed)
RUN apt-get update && apt-get install -y \
  libnss3 libxss1 libxext6 libxrandr2 libxrender1 libxtst6 \
  fonts-liberation libatspi2.0-0 libdbus-1-3 libdrm2 libgbm1 \
  libgcc-s1 libgtk-3-0 libnspr4 libxshmfence1 \
  wget ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install Playwright's Chromium browser binary
RUN npx playwright install chromium

COPY src ./src

# Cloud Run expects PORT env var
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
