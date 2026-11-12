from pathlib import Path

from aiohttp import web

from .yaml.loader import Secrets, load_yaml

FRONTEND_DIR = Path(__file__).parent / "frontend"


@web.middleware
async def frontend_middleware(request: web.Request, handler) -> web.Response:
    try:
        return await handler(request)
    except web.HTTPNotFound:
        # Intentional 404s from API/media routes propagate as-is.
        if request.path.startswith(("/config/", "/api/", "/media", "/local")):
            raise
        if not FRONTEND_DIR.is_dir():
            raise
        # Real file in the frontend bundle (assets/*, favicon.ico, icons/*, etc.)
        candidate = (FRONTEND_DIR / request.path.lstrip("/")).resolve()
        if candidate.is_file() and candidate.is_relative_to(FRONTEND_DIR.resolve()):
            response = web.FileResponse(candidate)
            if request.path.startswith("/assets/"):
                # Filenames are content-hashed, so a given URL never changes
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            elif candidate.name == "index.html":
                response.headers["Cache-Control"] = "no-cache"
            return response
        # A page from an older build asking for an asset that's gone must get a 404, not
        # index.html (the browser would reject it with a MIME type error).
        if request.path.startswith("/assets/"):
            raise
        # SPA fallback. Always revalidated, so tablets pick up a new build on their next load
        # instead of holding on to an index.html that references assets that no longer exist.
        return web.FileResponse(FRONTEND_DIR / "index.html", headers={"Cache-Control": "no-cache"})


app = web.Application(middlewares=[frontend_middleware])


# ── Config ─────────────────────────────────────────────────────────────────


async def config_handler(request: web.Request) -> web.Response:
    name = request.match_info["name"]
    yaml = load_yaml(f"configs/{name}/config.yaml", Secrets(f"configs/{name}"))
    return web.json_response(yaml, headers={"Access-Control-Allow-Origin": "*"})


app.router.add_get("/config/{name}", config_handler)


# ── Static resources (/local) ───────────────────────────────────────────────


async def local_headers(request: web.Request, response: web.StreamResponse) -> None:
    if not request.path.startswith("/local/"):
        return
    # The dashboard may be served from another origin, and browsers refuse
    # cross-origin @font-face loads without CORS headers.
    response.headers["Access-Control-Allow-Origin"] = "*"
    # Cached, but revalidated (ETag/Last-Modified) so edited files show up on reload
    response.headers["Cache-Control"] = "no-cache"


app.on_response_prepare.append(local_headers)


# ── Startup ─────────────────────────────────────────────────────────────────


def main() -> None:
    server_config = load_yaml("server.config.yaml") or {}
    app["server_config"] = server_config
    port = server_config.get("port", 9090) if isinstance(server_config, dict) else 9090

    media_dir = Path("media")
    media_dir.mkdir(exist_ok=True)
    app.router.add_static("/media", media_dir, follow_symlinks=True)

    www_dir = Path("www")
    www_dir.mkdir(exist_ok=True)
    app.router.add_static("/local", www_dir, follow_symlinks=True)

    web.run_app(app, port=port)


if __name__ == "__main__":
    main()
