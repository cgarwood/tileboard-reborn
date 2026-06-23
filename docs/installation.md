# Installation

## Home Assistant Addon (Recommended)

1. In Home Assistant, go to **Settings → Add-ons → Add-on Store**
2. Click the three-dot menu in the top right and select **Repositories**
3. Add the following repository URL:
   ```
   https://github.com/cgarwood/tileboard-reborn
   ```
4. Find **TileBoard Reborn Server** in the addon list and click **Install**
5. Configure the addon options and start it
6. Open the web UI at `http://<ha-host>:9090`

## Standalone (Docker)

```bash
docker run -d \
  --name tileboard \
  -p 9090:9090 \
  -v /path/to/config:/share/tileboard \
  ghcr.io/cgarwood/tileboard-reborn:latest
```

## Standalone (Python)

Requires Python 3.14+.

```bash
pip install tileboardserver
tileboard-server
```

## Local Development

See [Development](development.md).
