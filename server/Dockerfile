ARG BUILD_FROM

# ── Stage 1: build frontend ────────────────────────────────────────────────
FROM node:22 AS frontend-builder

WORKDIR /frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY frontend/ ./
RUN yarn build

# ── Stage 2: server ────────────────────────────────────────────────────────
FROM $BUILD_FROM

WORKDIR /app

COPY server/ .

# Bundle the compiled frontend into the Python package
COPY --from=frontend-builder /frontend/dist/spa ./tileboardserver/frontend

RUN pip3 install --no-cache-dir .

COPY server/run.sh /run.sh
RUN chmod a+x /run.sh

CMD ["/run.sh"]
