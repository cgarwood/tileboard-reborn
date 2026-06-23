from pathlib import Path

from aiohttp import web, ClientSession
import time
import os
import json
from .yaml.loader import load_yaml, Secrets

app = web.Application()

async def root_handler(request):
    return web.Response(text="Hello, world")

app.add_routes([web.get('/', root_handler)])

async def yaml_handler(request):
    path = f'configs/{request.match_info["name"]}/config.yaml'
    secrets = Secrets(f'configs/{request.match_info["name"]}')
    yaml = load_yaml(path, secrets)
    return web.json_response(yaml, headers={'Access-Control-Allow-Origin': '*'})

app.add_routes([web.get('/config/{name}', yaml_handler)])

async def weatheralerts_handler(request):
    now = time.time()
    zone = request.match_info["zone"]
    cache_file = f'weatheralerts-{zone}.json'

    if os.path.isfile(cache_file):
        if now - os.path.getmtime(cache_file) < 120:
            with open(cache_file, 'r') as f:
                return web.json_response(json.load(f), headers={'Access-Control-Allow-Origin': '*'})

    with open(cache_file, 'w') as f:
        async with ClientSession() as client:
            response = await client.get(f'https://api.weather.gov/alerts/active/zone/{zone}', headers={
                'Accept': 'application/json',
                'User-Agent': 'tileboardserver (https://github.com/cgarwood/tileboard-server)'}
            )
            data = await response.json()
            json.dump(data, f)
            return web.json_response(data, headers={'Access-Control-Allow-Origin': '*'})

app.add_routes([web.get('/weatheralerts/{zone}', weatheralerts_handler)])

async def screensaver_handler(request):
    server_config = app['server_config']
    screensaver = request.match_info["screensaver"]
    if not server_config.get('screensaver'):
        return web.HTTPNotFound(text="No screensavers configured.")

    if not server_config['screensaver'].get(screensaver):
        return web.HTTPNotFound(text=f"No screensaver named {screensaver} configured.")

    files = os.listdir(server_config['screensaver'][screensaver]['path'])
    files = [f for f in files if f.endswith('.jpg') or f.endswith('.png')]

    return web.json_response(files, headers={'Access-Control-Allow-Origin': '*'})

app.add_routes([web.get('/screensaver/{screensaver}', screensaver_handler)])


FRONTEND_DIR = Path(__file__).parent / 'frontend'


def _setup_frontend() -> None:
    """Mount the bundled frontend and add an SPA fallback route.

    The Quasar/Vue build output is expected at tileboardserver/frontend/,
    with the structure produced by `quasar build`:
        frontend/
            index.html
            assets/      (JS, CSS, fonts, images)
            favicon.ico
            ...

    Static files under assets/ are served directly. Any other GET request
    that doesn't match an API route returns index.html so Vue Router can
    handle client-side navigation.
    """
    index_file = FRONTEND_DIR / 'index.html'
    if not index_file.is_file():
        raise FileNotFoundError(
            f"Frontend bundle not found at {FRONTEND_DIR}. "
            "The frontend must be built and bundled before running the server."
        )

    async def spa_fallback(request: web.Request) -> web.Response:
        return web.FileResponse(index_file)

    # Serve static assets. Must be registered before the catch-all.
    app.router.add_static('/assets', FRONTEND_DIR / 'assets', name='frontend_assets')

    # Catch-all: return index.html for every unmatched GET so Vue Router works.
    app.router.add_get('/{path_info:.*}', spa_fallback)


def main() -> None:
    server_config = load_yaml('server.config.yaml') or {}
    app['server_config'] = server_config
    port = server_config.get('port', 9090) if isinstance(server_config, dict) else 9090

    if FRONTEND_DIR.is_dir():
        _setup_frontend()

    web.run_app(app, port=port)


if __name__ == '__main__':
    main()
