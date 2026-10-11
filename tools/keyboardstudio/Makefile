# KeybordStudio — オフラインパッケージ Make ターゲット
# Phase 12-A: ワンコマンドで CDN → ローカル化を完結させる
#
# 使い方:
#   make offline      # vendor 一括 DL + index.html を lib/vendor/ 参照に書換
#   make online       # CDN 版に戻す (バックアップから復元)
#   make zip          # ./KeybordStudio-offline.zip を作成 (配布用)
#   make clean-vendor # lib/vendor/ の DL 済みファイルを削除

.PHONY: offline online offline-full zip clean-vendor pyodide help

help:
	@echo "KeybordStudio Offline Package targets:"
	@echo "  make offline      — download vendor libs + patch index.html (no Pyodide)"
	@echo "  make pyodide      — download + patch Pyodide separately (~30MB)"
	@echo "  make offline-full — make offline + make pyodide (fully offline)"
	@echo "  make online       — restore CDN version of index.html"
	@echo "  make zip          — package the whole repo as KeybordStudio-offline.zip"
	@echo "  make clean-vendor — remove downloaded vendor files"

offline:
	bash lib/vendor/download-vendor.sh
	bash lib/vendor/patch-offline.sh
	@echo ""
	@echo "✅ Offline package ready. Open index.html directly with file://"

pyodide:
	bash lib/vendor/download-pyodide.sh
	bash lib/vendor/patch-pyodide.sh

offline-full: offline pyodide
	@echo ""
	@echo "✅ Fully offline (vendor libs + Pyodide). Use a local server: python3 -m http.server"

online:
	bash lib/vendor/restore-online.sh

zip: offline
	@VERSION=$$(git describe --tags --always 2>/dev/null || echo "dev"); \
	OUT="KeybordStudio-offline-$$VERSION.zip"; \
	echo "Packaging $$OUT ..."; \
	zip -r "$$OUT" . \
	    -x ".git/*" -x "*.online.bak" -x "node_modules/*" -x "*.zip" \
	    -x ".claude/*" -x "Thumbs.db" -x ".DS_Store"; \
	echo "✅ $$OUT created"

clean-vendor:
	rm -f lib/vendor/lz-string.min.js \
	      lib/vendor/FileSaver.min.js \
	      lib/vendor/jszip.min.js \
	      lib/vendor/three.module.js \
	      lib/vendor/three-bvh-csg.js \
	      lib/vendor/three-mesh-bvh.js \
	      lib/vendor/harfbuzzjs.js \
	      lib/vendor/harfbuzzjs.wasm
	rm -rf lib/vendor/pyodide
	@echo "✅ vendor downloads removed"
