# Stage 1: Build the Vite app using Node Alpine
FROM node:alpine AS builder

WORKDIR /app

# Copy package config and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build Vite frontend project
RUN npm run build

# Stage 2: Serve using Nginx Alpine (ARM64 compatible natively)
FROM nginx:alpine

# Copy built app to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace standard Nginx config with our specific ports
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose both public portal and admin dashboard ports
EXPOSE 80 8080

CMD ["nginx", "-g", "daemon off;"]
