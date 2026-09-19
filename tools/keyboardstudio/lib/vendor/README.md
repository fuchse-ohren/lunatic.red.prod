# Offline Package — Vendor Libraries

KeybordStudio は通常 CDN (jsdelivr / unpkg) から外部ライブラリを読み込みますが、
オフライン環境で動かしたい場合は、このディレクトリに必要ファイルを配置して、
`index.html` の CDN URL をローカルパスに書き換えてください。

## 必要ファイル一覧

`download-vendor.sh` (Bash) を実行すると、以下を一括ダウンロードします:

| ファイル | URL | 用途 |
|---|---|---|
| `lz-string.min.js` | https://unpkg.com/lz-string@1.5.0/libs/lz-string.min.js | URL 圧縮 |
| `FileSaver.min.js` | https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js | ブラウザでファイル保存 |
| `jszip.min.js` | https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js | 3MF (ZIP) 読み書き |
| `three.module.js` | https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js | 3D エンジン |
| `three-bvh-csg.esm.js` | https://cdn.jsdelivr.net/npm/three-bvh-csg@0.0.16/+esm | CSG 演算 |
| `three-mesh-bvh.esm.js` | https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.7.3/+esm | BVH 加速 |
| `harfbuzzjs.wasm` (任意) | https://cdn.jsdelivr.net/npm/harfbuzzjs@0.5.0/hb.wasm | 複雑文字 shaping |
| `harfbuzzjs.js` (任意) | https://cdn.jsdelivr.net/npm/harfbuzzjs@0.5.0/hbjs.js | HarfBuzz JS ラッパー |

Pyodide (Python ランタイム、~6 MB+) はサイズが大きいため CDN 利用を推奨。
オフラインでも動かすなら https://github.com/pyodide/pyodide/releases から
配布バンドルを取得して `lib/vendor/pyodide/` に展開してください。

## index.html の書き換え

外部 URL をローカル相対パスへ全置換:

```bash
# 例 (CDN → lib/vendor)
sed -i 's|https://unpkg.com/lz-string@1.5.0/libs/lz-string.min.js|lib/vendor/lz-string.min.js|g' index.html
sed -i 's|https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js|lib/vendor/FileSaver.min.js|g' index.html
sed -i 's|https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js|lib/vendor/jszip.min.js|g' index.html
# 他のライブラリも同様に
```

importmap も `index.html` 内に書かれている `<script type="importmap">` ブロックで
URL を変更します。

## 自動化

リポジトリルートで:
```bash
bash lib/vendor/download-vendor.sh
```
