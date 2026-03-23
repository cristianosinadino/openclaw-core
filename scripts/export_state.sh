#!/usr/bin/env bash
set -euo pipefail

STAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_DIR="./exports/$STAMP"
mkdir -p "$EXPORT_DIR"

cp .env "$EXPORT_DIR/.env.backup" 2>/dev/null || true
cp -R ./config "$EXPORT_DIR/config" 2>/dev/null || true
cp -R ./memory "$EXPORT_DIR/memory" 2>/dev/null || true
cp -R ./logs "$EXPORT_DIR/logs" 2>/dev/null || true
cp -R ./data "$EXPORT_DIR/data" 2>/dev/null || true

echo "Export completed at $EXPORT_DIR"
