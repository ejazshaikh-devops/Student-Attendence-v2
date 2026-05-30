# ─────────────────────────────────────────────
# Stage 1: BUILD — compile React app
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
# npm install only re-runs if package.json changes
COPY package*.json ./
RUN npm ci --silent

# Copy source and build for production
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: SERVE — Nginx serves the built files
# No Node.js in the final image
# ─────────────────────────────────────────────
FROM nginx:alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build output from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
