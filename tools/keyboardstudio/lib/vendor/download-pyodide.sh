#!/usr/bin/env bash
# KeybordStudio — Pyodide ローカル化用ダウンロード (~30 MB の圧縮データ + ~6MB が wasm)
# 使い方: bash lib/vendor/download-pyodide.sh
#
# Pyodide は他のライブラリと違って単一 JS ファイルでは動かず、
# pyodide.js + pyodide.asm.wasm + pyodide.asm.js + python_stdlib.zip など
# 複数ファイルから成る。一括 zip を取得して展開するのが現実的。
set -e

VERSION="0.24.1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$SCRIPT_DIR/pyodide"

if [ -d "$DEST" ]; then
    echo "$DEST already exists. Remove it first or skip."
    read -p "Re-download? [y/N] " yn
    [ "$yn" != "y" ] && [ "$yn" != "Y" ] && exit 0
    rm -rf "$DEST"
fi

mkdir -p "$DEST"
cd "$DEST"

# Pyodide 公式リリース zip
URL="https://github.com/pyodide/pyodide/releases/download/${VERSION}/pyodide-${VERSION}.tar.bz2"
echo "Downloading $URL ..."
curl -fsSL -o pyodide.tar.bz2 "$URL"

echo "Extracting ..."
tar -xjf pyodide.tar.bz2 --strip-components=1
rm -f pyodide.tar.bz2

echo ""
echo "✅ Pyodide ${VERSION} extracted to $DEST"
echo ""
echo "Now run: bash lib/vendor/patch-pyodide.sh"
echo "to rewrite index.html's Pyodide CDN URL to the local copy."
