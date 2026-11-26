#!/bin/sh
# When BACKEND_URL is set (e.g. http://athletiqa-api on Azure Container Apps), nginx reverse-proxies
# /api and /hubs to the backend so the SPA and API share one origin (no CORS / cross-site cookies).
# When it is unset (local docker-compose, k8s with Traefik), nothing is proxied.
set -e
mkdir -p /tmp/nginx-proxy
rm -f /tmp/nginx-proxy/*.conf

if [ -n "$BACKEND_URL" ]; then
  cat > /tmp/nginx-proxy/backend.conf <<EOF
location ~ ^/(api|hubs)/ {
    proxy_pass ${BACKEND_URL};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
    proxy_buffering off;
}
EOF
  echo "nginx: proxying /api and /hubs to ${BACKEND_URL}"
fi

exec nginx -g 'daemon off;'
