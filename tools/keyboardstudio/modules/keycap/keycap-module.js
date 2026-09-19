// =============================================
// KeybordStudio V1 - Keycap Studio Module (Skeleton)
// modules/keycap/keycap-module.js
// =============================================
//
// Phase 11 段階的リファクタの「土台」。
//
// 現状 Keycap Studio のロジックは index.html に直接書かれているため、
// このファイルは **薄いラッパー** として動作する:
//   - init()      : index.html で既に初期化済みなので、追加の初期化は行わない
//   - activate()  : currentModule = 'keycap' に対応する表示処理 (index.html の switchModule に委譲)
//   - getState()  : index.html の `state` グローバルを参照 (snapshot を返す)
//   - setState()  : index.html の `state` を更新し、syncUI / requestUpdate を発火
//   - getGroup()  : Three.js の mainGroup を返す (gallery thumbnail 等で使う)
//
// 将来 (Phase 12+) に index.html から状態管理 / Three.js シーン構築 / UI バインドを
// このファイルへ移動するための足場。LayoutModule / BodyModule と同じ
// インターフェースを持つことで、モジュール切替ロジック (switchModule) を統一できる。
//
// **注意**: 現状の本ファイルはまだ「自立したモジュール」ではなく、index.html に
// 依存している。本格的な分離は Phase 12+ で段階的に進める。
// =============================================

// Phase 12-C: 切り出した state / presets / helpers をここから re-export。
// 新規コードは `import { KEYCAP_INITIAL_STATE, ... } from './modules/keycap/keycap-module.js'`
// または個別ファイルを直接 import する。
export { KEYCAP_INITIAL_STATE, createKeycapState } from './keycap-state.js';
export { PROFILE_INFO, ROW_INFO, MATERIAL_PRESETS, ENGRAVE_DEPTH_PRESETS, STEM_TYPES,
         listProfileNames, listRowNames, listMaterialIds } from './keycap-presets.js';
export { lerp, clamp, deg2rad, rad2deg, hexToRgb, rgbToHex, colorDiff,
         pointInRect, pointInCircle, estimateWeightGrams, estimateCostUSD,
         deepClone, shallowDiff } from './keycap-helpers.js';
// Phase 13-C: state-pure な計算ヘルパー
export { computeKeycapBaseDim, computeKeycapHeight, computeKeycapVolume,
         computeKeycapWeight, computeKeycapCost, computeSafeArea,
         estimatePrintTimeSec, computeFaceDimensions, aggregateBatchEstimate
       } from './keycap-render.js';

const MODULE_ID = 'keycap';
const MODULE_NAME = 'Keycap Studio';
const MODULE_PATH = 'modules/keycap/';

export const KeycapModule = {
    id: MODULE_ID,
    name: MODULE_NAME,

    /**
     * 初期化 — index.html 側で既に state / scene / mainGroup 等が初期化されているため、
     * 本モジュールは何もしない (将来的にこの関数で `state` 初期化等を引き受ける)。
     */
    async init(context) {
        // context = { window, document, scene, camera, renderer, currentLang, ... }
        // 現状: 何もしない。Phase 12+ で実装。
        if (typeof console !== 'undefined') {
            console.log('[KeycapModule] skeleton initialised — actual logic still in index.html');
        }
    },

    /**
     * このモジュールを表示する。
     * 現状: index.html の switchModule('keycap') に委譲する。
     */
    activate() {
        if (typeof window !== 'undefined' && typeof window.switchModule === 'function') {
            window.switchModule('keycap');
        }
    },

    /**
     * 非表示にする。switchModule は活性化したモジュール側で行うので、ここは noop。
     */
    deactivate() { /* noop */ },

    /**
     * 現在のキーキャップ state スナップショットを返す。
     */
    getState() {
        if (typeof window !== 'undefined' && window.state) {
            try { return JSON.parse(JSON.stringify(window.state)); } catch (e) { return null; }
        }
        return null;
    },

    /**
     * 渡された state を反映する。
     */
    setState(newState) {
        if (typeof window === 'undefined' || !window.state) return false;
        try {
            Object.assign(window.state, newState);
            if (typeof window.syncUI === 'function') window.syncUI();
            if (typeof window.requestUpdate === 'function') window.requestUpdate();
            if (typeof window.commitHistory === 'function') window.commitHistory();
            return true;
        } catch (e) {
            console.warn('[KeycapModule] setState failed:', e);
            return false;
        }
    },

    /**
     * キーキャップ Three.js シーンの mainGroup を返す。
     * gallery のサムネイル生成等で使う。
     */
    getGroup() {
        return (typeof window !== 'undefined' && window.mainGroup) ? window.mainGroup : null;
    },

    /**
     * Phase 12+ で内部実装に置き換える。
     */
    updateModel() {
        if (typeof window !== 'undefined' && typeof window.updateModel === 'function') {
            window.updateModel();
        }
    }
};
