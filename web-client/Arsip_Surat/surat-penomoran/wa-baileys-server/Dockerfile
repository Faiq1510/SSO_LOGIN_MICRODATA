FROM node:20-alpine

WORKDIR /app

# Install dependencies needed for native modules / build tools if needed
RUN apk add --no-cache tzdata

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci || npm install --omit=dev

# Copy application source
COPY index.js ./

# Create directory for session credentials
RUN mkdir -p /app/auth_info

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "index.js"]
