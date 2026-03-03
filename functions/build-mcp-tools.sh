#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MCP_SERVER="$PROJECT_ROOT/mcp-server"
DEST="$SCRIPT_DIR/mcp-server-dist"

echo "Building MCP tools for Firebase Functions..."

if [ -f "$MCP_SERVER/package.json" ]; then
  echo "Building MCP server..."
  cd "$MCP_SERVER" && npm run build
else
  echo "ERROR: mcp-server/package.json not found"
  exit 1
fi

rm -rf "$DEST"
mkdir -p "$DEST"

echo "Copying dist files..."
cp -R "$MCP_SERVER/dist/controllers" "$DEST/controllers"
cp -R "$MCP_SERVER/dist/utils" "$DEST/utils"
cp -R "$MCP_SERVER/dist/types" "$DEST/types"
cp -R "$MCP_SERVER/dist/services" "$DEST/services"
cp -R "$MCP_SERVER/dist/prompts" "$DEST/prompts"

# Copy the package.json so Node resolves "type": "module" for ESM imports
cp "$MCP_SERVER/package.json" "$DEST/package.json"

echo "MCP tools copied to functions/mcp-server-dist/"
echo "Files:"
find "$DEST" -name "*.js" | head -20
