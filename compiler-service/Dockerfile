FROM node:18-slim

WORKDIR /app

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5001

CMD ["node", "src/index.js"]
