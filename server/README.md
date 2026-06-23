# Tileboard Reborn Server
Basic web server responsible for serving the configuration for Tileboard Reborn clients and provides some helper endpoints for weather alerts, notifications, and screensaver media.

## Configuration
### Server Configuration
Server configuration is located in the `server.config.yaml` file in the root of the project.
An example server configuration file is located at `server.config.example.yaml`.

| Key | Default | Description |
|-----|---------|-------------|
| `port` | `9090` | Port the server listens on |

### Client/Dashboard Configurations
Multiple unique configurations are supported. Each configuration should be placed in a `config.yaml` file in a **subfolder** of the `configs` directory. Home Assistant YAML extensions are supported (`!include`, `!secret`, `!include_dir_merge_list`, etc).

An example configuration is located in `configs/example`.

## Running the server
Install the package first (use `-e` for an editable/development install):
```
pip install -e .
```

Then run:
```
tileboard-server
```

## Security
This is not intended to be run on a public-facing server, as fetching the configuration file will leak secrets. It is recommended to run this on a local network or behind a reverse proxy with authentication.