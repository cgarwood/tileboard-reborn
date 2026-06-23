# TileBoard Reborn

A modern, configurable dashboard for Home Assistant — designed for wall-mounted tablets and kiosk displays.

## Repository Structure

```
tileboard-reborn/
├── frontend/   # Quasar/Vue 3 web application
├── server/     # Python/aiohttp server + Home Assistant addon
└── docs/       # Documentation (MkDocs)
```

## Quick Start

See the [documentation](https://tileboard-reborn.readthedocs.io) for installation and configuration guides.

### Local Development

**Frontend:**
```bash
cd frontend
yarn install
yarn dev
```

**Server:**
```bash
cd server
pip install -e .
tileboard-server
```

## Home Assistant Addon

Add this repository to your Home Assistant addon store:

```
https://github.com/cgarwood/tileboard-reborn
```

## License

Apache-2.0
