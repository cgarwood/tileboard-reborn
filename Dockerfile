# ── Stage 1: build frontend ────────────────────────────────────────────────
FROM node:22 AS frontend-builder

WORKDIR /frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile --ignore-scripts

COPY frontend/ ./
RUN yarn build

# ── Stage 2: server ────────────────────────────────────────────────────────
FROM python:3.14-slim

WORKDIR /app

COPY server/ .

# Copy compiled frontend into the package source before installing so
# setuptools picks it up via the tileboardserver/frontend/** package-data glob.
COPY --from=frontend-builder /frontend/dist/spa ./tileboardserver/frontend

RUN pip install --no-cache-dir .

EXPOSE 9090

# The server reads server.config.yaml and configs/ from the working directory.
WORKDIR /data
CMD ["tileboard-server"]
