# Sovereign hosting for app-vue — the Firebase-Hosting REPLACEMENT (GKE/nginx), mirroring the auth migration off
# Firebase. SCAFFOLD: this is the sovereign dev/prod hosting path, staged now, NOT cut over until the Firebase v0
# is validated. BUILD CONTEXT = repo root.
FROM node:20-slim AS build
WORKDIR /app
COPY socioprophet-web/app-vue/package.json socioprophet-web/app-vue/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY socioprophet-web/app-vue ./
# VITE_SEARCH_API (and other VITE_* bases) are baked at build time; pass via --build-arg per environment.
ARG VITE_SEARCH_API=""
ENV VITE_SEARCH_API=$VITE_SEARCH_API
RUN npm run build   # → /app/dist

FROM nginx:1.27-alpine
# Non-root, port 8080 (matches the estate chart contract).
COPY deploy/sovereign/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
