# Build stage
FROM node:22 AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Create cache directories and set permissions for non-root user (uid 1000)
# pid file goes to /tmp, logs go to stdout/stderr, so only cache and html need chown
RUN mkdir -p /var/cache/nginx/client_temp \
    && chown -R 1000:1000 /var/cache/nginx \
    && chown -R 1000:1000 /usr/share/nginx/html \
    && chown -R 1000:1000 /etc/nginx

EXPOSE 5173

USER 1000

CMD ["nginx", "-g", "daemon off;"]