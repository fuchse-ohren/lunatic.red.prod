#!/usr/bin/env bash
# KeybordStudio — index.html の Pyodide CDN 参照をローカル lib/vendor/pyodide/ に書換
# 使い方: bash lib/vendor/patch-pyodide.sh
# 元に戻すには (online ターゲットと同等):
#   sed -i 's|lib/vendor/pyodide/|https://cdn.jsdelivr.net/pyodide/v0.24.1/full/|g' index.html
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INDEX="$ROOT_DIR/index.html"

if [ ! -f "$ROOT_DIR/lib/vendor/pyodide/pyodide.js" ]; then
    echo "Error: Pyodide not yet downloaded."
    echo "Run: bash lib/vendor/download-pyodide.sh"
    exit 1
fi

# 既にバックアップが無ければ作成
if [ ! -f "$INDEX.online.bak" ]; then
    cp "$INDEX" "$INDEX.online.bak"
fi

# script src 系
sed -i 's|https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js|lib/vendor/pyodide/pyodide.js|g' "$INDEX"

# loadPyodide indexURL
sed -i 's|https://cdn.jsdelivr.net/pyodide/v0.24.1/full/|lib/vendor/pyodide/|g' "$INDEX"

echo "✅ Patched $INDEX → Pyodide URLs replaced with lib/vendor/pyodide/"
echo "   index.html を file:// で開いた場合、Pyodide が CORS で動作しないことがあります。"
echo "   その場合は簡易ローカルサーバを起動してください: python3 -m http.server"
