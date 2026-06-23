#!/usr/bin/with-contenv bashio
# ==============================================================================
# Start the Tileboard Reborn Server
# ==============================================================================
set -e

declare port

port=$(bashio::config 'port')

# Ensure required directories exist under the shared volume
mkdir -p /share/tileboard/configs

# Generate server.config.yaml from addon options at each startup so changes
# made in the HA UI take effect without manually editing files.
{
    echo "port: ${port}"
} > /share/tileboard/server.config.yaml

bashio::log.info "Starting Tileboard Server on port ${port}"
bashio::log.info "Dashboard configs: /share/tileboard/configs/"

cd /share/tileboard
exec tileboard-server
