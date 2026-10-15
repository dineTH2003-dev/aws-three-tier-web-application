#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_VERSION="v20.18.0"
STAGE_DIR="/tmp/task-backend-stage"
BUNDLE_OUTPUT="$REPO_ROOT/infrastructure/app-bundle.tar.gz"

echo "=== 1. Building React Frontend ==="
if [ ! -d "$REPO_ROOT/frontend/node_modules" ] || [ ! -f "$REPO_ROOT/frontend/node_modules/.bin/vite" ]; then
  echo "Installing frontend dependencies..."
  npm --prefix "$REPO_ROOT/frontend" ci --no-audit --no-fund
fi
npm --prefix "$REPO_ROOT/frontend" run build

echo "=== 2. Preparing Standalone Node.js Runtime ($NODE_VERSION) ==="
CACHE_DIR="/tmp/node-cache"
mkdir -p "$CACHE_DIR"
NODE_TARBALL="$CACHE_DIR/node-$NODE_VERSION-linux-x64.tar.gz"

if [ ! -f "$NODE_TARBALL" ]; then
  echo "Downloading Node.js standalone Linux x86_64 binary..."
  curl -sSL "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.gz" -o "$NODE_TARBALL"
fi

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR/node-bin"

echo "Extracting Node binary to staging area..."
tar -xzf "$NODE_TARBALL" -C "$STAGE_DIR/node-bin" --strip-components=2 "node-$NODE_VERSION-linux-x64/bin"

echo "=== 3. Packaging Backend Application ==="
cp "$REPO_ROOT/backend/package.json" "$STAGE_DIR/"
if [ -f "$REPO_ROOT/backend/package-lock.json" ]; then
  cp "$REPO_ROOT/backend/package-lock.json" "$STAGE_DIR/"
fi
cp -r "$REPO_ROOT/backend/src" "$STAGE_DIR/src"
cp -r "$REPO_ROOT/backend/migrations" "$STAGE_DIR/migrations"
if [ -d "$REPO_ROOT/backend/certs" ]; then
  cp -r "$REPO_ROOT/backend/certs" "$STAGE_DIR/certs"
fi

echo "Installing production node_modules in staging directory..."
(cd "$STAGE_DIR" && npm install --omit=dev --no-audit --no-fund)

echo "=== 4. Creating Deployment Bundle Archive ==="
mkdir -p "$(dirname "$BUNDLE_OUTPUT")"
tar -czf "$BUNDLE_OUTPUT" -C "$STAGE_DIR" .

echo "Deployment bundle created successfully at: $BUNDLE_OUTPUT"
echo "Bundle size: $(du -h "$BUNDLE_OUTPUT" | cut -f1)"
