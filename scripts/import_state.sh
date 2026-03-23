#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <export_dir>"
  exit 1
fi

SRC="$1"
[ -d "$SRC" ] || { echo "Export directory not found: $SRC"; exit 1; }

cp -R "$SRC/config" ./config 2>/dev/null || true
cp -R "$SRC/memory" ./memory 2>/dev/null || true
cp -R "$SRC/logs" ./logs 2>/dev/null || true
cp -R "$SRC/data" ./data 2>/dev/null || true
cp "$SRC/.env.backup" ./.env 2>/dev/null || true

echo "Import completed from $SRC"
