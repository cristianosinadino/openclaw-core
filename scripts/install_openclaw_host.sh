#!/usr/bin/env bash
set -euo pipefail

echo "[1/3] Checking prerequisites..."
command -v curl >/dev/null 2>&1 || { echo "curl is required"; exit 1; }

echo "[2/3] Reminder: this installs OpenClaw on the HOST, not in Docker."
echo "Official install command: curl -fsSL https://openclaw.ai/install.sh | bash"

echo "[3/3] Running installer..."
curl -fsSL https://openclaw.ai/install.sh | bash
