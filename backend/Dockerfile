# Use node LTS alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./

# Install production dependencies
RUN npm ci

# Copy Prisma schema first and generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start script
CMD ["npm", "start"]
