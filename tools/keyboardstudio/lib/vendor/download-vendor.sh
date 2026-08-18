#!/usr/bin/env bash
# KeybordStudio — オフラインパッケージ用 vendor ライブラリ一括ダウンロード
# 使い方: リポジトリルートで `bash lib/vendor/download-vendor.sh`
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Downloading vendor libraries to $SCRIPT_DIR ..."

curl -fsSL "https://unpkg.com/lz-string@1.5.0/libs/lz-string.min.js"                            -o lz-string.min.js
curl -fsSL "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"                -o FileSaver.min.js
curl -fsSL "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"                        -o jszip.min.js
curl -fsSL "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"                   -o three.module.js
# three-bvh-csg / three-mesh-bvh は jsdelivr の +esm 経由でないと正しい ESM が取れないため
# 通常は importmap で CDN を残す方が安全。それでもオフラインにしたい場合は手動で
# bundler (esbuild / rollup) を使って bundle してから配置する。
curl -fsSL "https://cdn.jsdelivr.net/npm/harfbuzzjs@0.5.0/hbjs.js"                               -o harfbuzzjs.js   || echo "harfbuzz js (optional) skipped"
curl -fsSL "https://cdn.jsdelivr.net/npm/harfbuzzjs@0.5.0/hb.wasm"                               -o harfbuzzjs.wasm || echo "harfbuzz wasm (optional) skipped"

echo ""
echo "Done. Now patch index.html — see README.md in this directory."
echo ""
echo "Tip: Pyodide (~6MB) は CDN のままにするか、別途公式リリースを"
echo "      lib/vendor/pyodide/ へ展開してください。"
