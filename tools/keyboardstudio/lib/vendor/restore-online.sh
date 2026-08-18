#!/usr/bin/env bash
# KeybordStudio — patch-offline.sh で書き換えた index.html を CDN 版に戻す
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INDEX="$ROOT_DIR/index.html"
BACKUP="$INDEX.online.bak"

if [ ! -f "$BACKUP" ]; then
    echo "Error: backup not found at $BACKUP"
    echo "Was patch-offline.sh ever run on this repo?"
    exit 1
fi

cp "$BACKUP" "$INDEX"
echo "✅ Restored $INDEX from $BACKUP"
