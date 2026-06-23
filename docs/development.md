# Development

## Prerequisites

- Node.js 22+ (see `frontend/.nvmrc`)
- Python 3.14+
- Yarn

## Frontend

```bash
cd frontend
yarn install
yarn dev
```

The dev server starts at `http://localhost:9000` with hot-module replacement.

Other useful commands:

```bash
yarn lint         # fix lint issues
yarn lint:check   # lint without fixing
yarn typecheck    # TypeScript type checking
yarn build        # production build → frontend/dist/
```

## Server

```bash
cd server
python -m venv .venv
.venv/Scripts/activate   # Windows
# or
source .venv/bin/activate  # Linux/macOS

pip install -e .
tileboard-server
```

## Building a Release Locally

```bash
# 1. Build frontend
cd frontend && yarn build && cd ..

# 2. Copy dist into server package
cp -r frontend/dist/spa server/tileboardserver/frontend

# 3. Build Python package
cd server && python -m build
```

## Running with Docker

```bash
docker build -f server/Dockerfile -t tileboard-dev .
docker run -p 9090:9090 tileboard-dev
```

The Dockerfile build context must be the **repo root** (not the `server/` directory) since the multi-stage build reads from both `frontend/` and `server/`.
