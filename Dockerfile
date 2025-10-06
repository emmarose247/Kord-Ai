# 1. Use a stable, slimmer Node.js base image (Alpine is smaller and faster)
FROM node:20-alpine

# 2. Install FFMPEG (essential for media/video processing in many bots)
# Alpine uses 'apk' package manager instead of 'apt-get'
RUN apk add --no-cache ffmpeg

# 3. Set the working directory
WORKDIR /app

# 4. Copy and install dependencies efficiently
# Copy only package files first to leverage Docker caching (faster rebuilds)
COPY package.json package-lock.json ./
RUN npm install --omit=dev --legacy-peer-deps

# 5. Copy the rest of the application code
COPY . .

# 6. Define the command to start the bot
CMD ["npm", "start"]
