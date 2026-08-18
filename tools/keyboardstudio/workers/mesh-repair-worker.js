/**
 * Mesh Repair Web Worker
 * MeshFixLib v3.2.0-wasm をWeb Worker内で実行し、メインスレッドのUI凍結を防止する。
 *
 * WASM版: init()でWASMモジュールをロード（mesh-fix-core.jsを事前にimportScriptsで読み込み済み）
 */
'use strict';

// WASMコアモジュールを先に読み込み → MeshFixCore がグローバルに定義される
// mesh-fix-lib.js の init() が typeof MeshFixCore !== 'undefined' で検出
importScripts('../lib/mesh-fix/mesh-fix-core.js');
importScripts('../lib/mesh-fix-lib.js');

// WASMパス解決: 新init()はwasmDirを受け付けないため、
// factoryにlocateFileを注入してWorker基準のパスを正しく解決する
const _origMeshFixCore = MeshFixCore;
MeshFixCore = (opts = {}) => _origMeshFixCore({
    ...opts,
    locateFile: (path) => '../lib/mesh-fix/' + path
});

let meshFix = null;

self.onmessage = async function(e) {
    const { type, id } = e.data;

    switch (type) {
        case 'init': {
            try {
                meshFix = new MeshFixLib();
                await meshFix.init();
                self.postMessage({ type: 'ready' });
            } catch (err) {
                self.postMessage({ type: 'error', error: 'Init failed: ' + err.message });
            }
            break;
        }

        case 'repair': {
            if (!meshFix) {
                self.postMessage({ type: 'error', id, error: 'Worker not initialized' });
                return;
            }

            try {
                const { vertices, triangles, options } = e.data;

                const progressFn = (status) => {
                    self.postMessage({ type: 'progress', id, status });
                };

                let result;
                if (options && Object.keys(options).length > 0) {
                    // options あり → repairObject() + diagnose() で処理
                    const repaired = await meshFix.repairObject(vertices, triangles, progressFn, options);
                    const diagnosis = meshFix.diagnose(repaired.V, repaired.T);
                    result = {
                        vertices: repaired.V,
                        triangles: repaired.T,
                        report: repaired.report,
                        diagnosis
                    };
                } else {
                    // options なし → repairMesh()（従来互換）
                    result = await meshFix.repairMesh(vertices, triangles, progressFn);
                }

                self.postMessage({
                    type: 'result',
                    id,
                    vertices: result.vertices,
                    triangles: result.triangles,
                    report: result.report,
                    diagnosis: result.diagnosis
                });
            } catch (err) {
                self.postMessage({ type: 'error', id, error: 'Repair failed: ' + err.message });
            }
            break;
        }

        case 'diagnose': {
            if (!meshFix) {
                self.postMessage({ type: 'error', id, error: 'Worker not initialized' });
                return;
            }

            try {
                const { vertices, triangles } = e.data;
                const diagnosis = meshFix.diagnose(vertices, triangles);
                self.postMessage({ type: 'diagnosed', id, diagnosis });
            } catch (err) {
                self.postMessage({ type: 'error', id, error: 'Diagnose failed: ' + err.message });
            }
            break;
        }
    }
};
