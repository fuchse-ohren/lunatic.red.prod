#!/usr/bin/env bash
# KeybordStudio — index.html を CDN 参照 → ローカル lib/vendor/ 参照に書き換える
# 使い方: リポジトリルートで `bash lib/vendor/patch-offline.sh`
# 元に戻すには `bash lib/vendor/restore-online.sh`
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INDEX="$ROOT_DIR/index.html"

if [ ! -f "$INDEX" ]; then
    echo "Error: $INDEX not found"
    exit 1
fi

# 既にバックアップが無ければ作成
if [ ! -f "$INDEX.online.bak" ]; then
    cp "$INDEX" "$INDEX.online.bak"
    echo "Backup created: $INDEX.online.bak"
fi

# CDN URL → lib/vendor/ パス置換
# - lz-string
sed -i 's|https://unpkg.com/lz-string@1.5.0/libs/lz-string.min.js|lib/vendor/lz-string.min.js|g' "$INDEX"
# - file-saver
sed -i 's|https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js|lib/vendor/FileSaver.min.js|g' "$INDEX"
# - jszip
sed -i 's|https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js|lib/vendor/jszip.min.js|g' "$INDEX"
# - three (importmap)
sed -i 's|https://unpkg.com/three@0.160.0/build/three.module.js|lib/vendor/three.module.js|g' "$INDEX"
sed -i 's|https://unpkg.com/three@0.160.0/examples/jsm/|lib/vendor/three-addons/|g' "$INDEX"
# - three-bvh-csg / three-mesh-bvh は ESM bundle が必要なので、ユーザーが
#   esbuild 等で bundle した版を lib/vendor/ に置く前提で書き換え
sed -i 's|https://unpkg.com/three-bvh-csg@0.0.16/build/index.module.js|lib/vendor/three-bvh-csg.js|g' "$INDEX"
sed -i 's|https://unpkg.com/three-mesh-bvh@0.7.3/build/index.module.js|lib/vendor/three-mesh-bvh.js|g' "$INDEX"

echo ""
echo "✅ Patched $INDEX → CDN URLs replaced with lib/vendor/ paths."
echo ""
echo "Note:"
echo " - Pyodide URL は CDN のまま残してあります (~6MB のため)。完全オフライン化"
echo "   したい場合は別途 lib/vendor/pyodide/ を用意して同様に書き換えてください。"
echo " - three-bvh-csg / three-mesh-bvh は ESM bundle (esbuild 等) が必要です。"
echo " - 元に戻すには: bash lib/vendor/restore-online.sh"
