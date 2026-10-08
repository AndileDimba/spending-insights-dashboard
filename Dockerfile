# syntax=docker/dockerfile:1

# Base images are pinned by digest so a re-pushed tag cannot change what we
# build on. Dependabot proposes digest updates (#8).

# ---- Build: install exactly what the lockfile specifies, then build --------
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS build
WORKDIR /app

# Copied first so the dependency layer is reused when only source changes.
COPY package.json package-lock.json .npmrc ./
# Install scripts are disabled: nothing in the build needs them, and they are
# the usual route for supply-chain attacks.
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

COPY . .
RUN npm run build

# ---- Runtime: static files served by unprivileged nginx (ADR 0012) --------
FROM nginxinc/nginx-unprivileged:alpine-slim@sha256:1517d8c358e2e093957ebee087afa9eb19a32f5d7ecb711b7429e369cb998224

LABEL org.opencontainers.image.title="spending-insights-dashboard" \
      org.opencontainers.image.description="Customer spending insights dashboard" \
      org.opencontainers.image.source="https://github.com/AndileDimba/spending-insights-dashboard" \
      org.opencontainers.image.licenses="MIT"

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
# Files stay owned by root, so the nginx user can read but never modify them.
COPY --from=build /app/dist /usr/share/nginx/html

# Numeric, so platforms that enforce non-root (e.g. Kubernetes runAsNonRoot)
# can verify it without resolving a user name.
USER 101
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --start-interval=1s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
