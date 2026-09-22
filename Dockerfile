# Phase 1: Build Environment
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY calorie-app/package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY calorie-app/ .

# Build for production
RUN npm run build

# Phase 2: Runtime Environment
FROM nginx:alpine

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to nginx document root
COPY --from=builder /app/dist /usr/share/nginx/html

# Inform Google Cloud Run about the port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
