FROM node:21

# Simplified and guaranteed installation of ffmpeg using apt-get
RUN apt-get update -y && \
    apt-get install -y ffmpeg && \
    apt-get clean
    
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps

# NEW LINE: This fixes the Back4App port error
EXPOSE 8080 

CMD ["npm", "start"]
