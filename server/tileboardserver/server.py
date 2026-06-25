import json
import os
import time
from pathlib import Path

from aiohttp import ClientSession, web

from .yaml.loader import Secrets, load_yaml

FRONTEND_DIR = Path(__file__).parent / "frontend"


@web.middleware
async def frontend_middleware(request: web.Request, handler) -> web.Response:
    try:
        return await handler(request)
    except web.HTTPNotFound:
        # Intentional 404s from API/media routes propagate as-is.
        if request.path.startswith(("/config/", "/api/", "/media")):
            raise
        # Real file in the frontend bundle (favicon.ico, icons/*, etc.)
        if FRONTEND_DIR.is_dir():
            candidate = (FRONTEND_DIR / request.path.lstrip("/")).resolve()
            if candidate.is_file() and candidate.is_relative_to(FRONTEND_DIR.resolve()):
                return web.FileResponse(candidate)
            return web.FileResponse(FRONTEND_DIR / "index.html")
        raise


app = web.Application(middlewares=[frontend_middleware])


# ── Config ─────────────────────────────────────────────────────────────────


async def config_handler(request: web.Request) -> web.Response:
    name = request.match_info["name"]
    yaml = load_yaml(f"configs/{name}/config.yaml", Secrets(f"configs/{name}"))
    return web.json_response(yaml, headers={"Access-Control-Allow-Origin": "*"})


app.router.add_get("/config/{name}", config_handler)


# ── Weather alerts ──────────────────────────────────────────────────────────


async def weatheralerts_handler(request: web.Request) -> web.Response:
    now = time.time()
    zone = request.match_info["zone"]
    cache_file = f"weatheralerts-{zone}.json"

    if os.path.isfile(cache_file) and now - os.path.getmtime(cache_file) < 120:
        with open(cache_file) as f:
            return web.json_response(json.load(f), headers={"Access-Control-Allow-Origin": "*"})

    async with ClientSession() as client:
        response = await client.get(
            f"https://api.weather.gov/alerts/active/zone/{zone}",
            headers={
                "Accept": "application/json",
                "User-Agent": "tileboard-reborn (https://github.com/cgarwood/tileboard-reborn)",
            },
        )
        data = await response.json()

    with open(cache_file, "w") as f:
        json.dump(data, f)

    return web.json_response(data, headers={"Access-Control-Allow-Origin": "*"})


app.router.add_get("/api/weatheralerts/{zone}", weatheralerts_handler)


# ── Screensaver ─────────────────────────────────────────────────────────────


async def screensaver_handler(request: web.Request) -> web.Response:
    server_config = app["server_config"]
    screensaver = request.match_info["screensaver"]

    if not server_config.get("screensaver"):
        return web.HTTPNotFound(text="No screensavers configured.")

    if not server_config["screensaver"].get(screensaver):
        return web.HTTPNotFound(text=f"No screensaver named {screensaver} configured.")

    files = os.listdir(server_config["screensaver"][screensaver]["path"])
    files = [f for f in files if f.endswith(".jpg") or f.endswith(".png")]
    return web.json_response(files, headers={"Access-Control-Allow-Origin": "*"})


app.router.add_get("/api/screensaver/{screensaver}", screensaver_handler)


# ── Startup ─────────────────────────────────────────────────────────────────


def main() -> None:
    server_config = load_yaml("server.config.yaml") or {}
    app["server_config"] = server_config
    port = server_config.get("port", 9090) if isinstance(server_config, dict) else 9090

    media_dir = Path("media")
    media_dir.mkdir(exist_ok=True)
    app.router.add_static("/media", media_dir, follow_symlinks=True)

    web.run_app(app, port=port)


if __name__ == "__main__":
    main()
