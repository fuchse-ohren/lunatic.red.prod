// =============================================
// KeybordStudio V1 - Keycap render-side helpers
// modules/keycap/keycap-render.js
// =============================================
// Phase 13-C: index.html から「state-pure / data-pure な計算ヘルパー」を
// 段階的に切り出すための置き場。THREE.js への参照は引数で受け取る形にし、
// このファイル自体は import 不要にする (keycap-helpers と同じ方針)。
//
// ここに置くべきもの:
//   - state からキーキャップ寸法 (baseW, baseD, h) を計算する関数
//   - プロファイル別の高さテーブルを引いて row 高さを返す関数
//   - 三角形数や体積の概算
//
// ここに置かないもの:
//   - DOM / state グローバル / IDB / Three.js シーン構築 (それらは index.html 側)
//   - makeTextGeo (Font / SVG / CSG 連携が密結合のため Phase 14+)

import { PROFILE_INFO, ROW_INFO, MATERIAL_PRESETS } from './keycap-presets.js';

/**
 * uSize と pitch から keycap の base 寸法 (mm) を返す。
 * @param {number} uSize 1u 単位 (1.0 = 1U)
 * @param {number} unitSize ピッチ (通常 19.05mm)
 * @param {object} dimsOpt { gap, padding } 等。省略時はデフォルト
 */
export function computeKeycapBaseDim(uSize, unitSize, dimsOpt = {}) {
    const gap = dimsOpt.gap != null ? dimsOpt.gap : 1.0;
    const baseW = uSize * unitSize - gap;
    const baseD = unitSize - gap;
    return { baseW, baseD };
}

/**
 * プロファイル + row から keycap の高さ (mm) を返す。
 * 不明な profile/row はデフォルト値 (Cherry R3) を返す。
 */
export function computeKeycapHeight(profile, row) {
    const p = PROFILE_INFO[profile] || PROFILE_INFO.cherry;
    const rowMod = ROW_INFO[row] || ROW_INFO.R3;
    return p.approxHeight + rowMod.tilt * 0.1; // tilt は角度なので 1° ≈ 0.1mm の補正に簡略化
}

/**
 * keycap の概算体積 (cm³)。
 * 簡易: baseW * baseD * height * fillFactor / 1000
 * fillFactor は中空・stem・rib 等を考慮した係数 (0.20 - 0.35)。
 */
export function computeKeycapVolume(state) {
    const { baseW, baseD } = computeKeycapBaseDim(state.uSize || 1.0, state.unitSize || 19.05);
    const h = computeKeycapHeight(state.profile, state.row);
    const fillFactor = 0.22 + ((state.wallThickness || 1.5) - 1.5) * 0.1 + (state.boxStem ? 0.05 : 0);
    return (baseW * baseD * h * Math.max(0.1, Math.min(0.6, fillFactor))) / 1000;
}

/**
 * 重量推定 (g) — 体積 × 密度 (state.materialPreset または引数 material)。
 */
export function computeKeycapWeight(state, material) {
    const m = MATERIAL_PRESETS[material || state.materialPreset || 'pla'] || MATERIAL_PRESETS.pla;
    return computeKeycapVolume(state) * m.density;
}

/**
 * 印刷コスト概算 (USD) — 重量 × 単価。
 */
export function computeKeycapCost(state, material) {
    const m = MATERIAL_PRESETS[material || state.materialPreset || 'pla'] || MATERIAL_PRESETS.pla;
    return (computeKeycapWeight(state, material) / 1000) * m.pricePerKg;
}

/**
 * トップ面の安全領域 (文字や SVG を配置しても歪まない範囲)。
 * topScale が小さい (台形が狭い) ほど安全領域も狭くなる。
 * 戻り値: { width, depth } in mm (中心からの ±半幅)
 */
export function computeSafeArea(state) {
    const { baseW, baseD } = computeKeycapBaseDim(state.uSize || 1.0, state.unitSize || 19.05);
    const topScale = state.topScale != null ? state.topScale : 1.0;
    // ベゼル (trim) を 1.5mm 取る
    const trim = 1.5;
    return {
        width:  Math.max(0, (baseW * topScale - trim * 2) / 2),
        depth:  Math.max(0, (baseD * topScale - trim * 2) / 2)
    };
}

/**
 * 印刷時間概算 (秒)。FDM (PLA) の典型的なフロー (~10 cm³/分) で割る。
 * 詳細は機種・速度により大きく異なるが、UI で「だいたい何分」感を出すには十分。
 */
export function estimatePrintTimeSec(state) {
    const volCm3 = computeKeycapVolume(state);
    const flowCm3PerMin = 10;
    return Math.round((volCm3 / flowCm3PerMin) * 60);
}

/**
 * keycap がペアレント面 (top / front / back / left / right) に対して持つ
 * 利用可能寸法 (mm)。ストラップ穴の最大径などのバリデーションに使う。
 */
export function computeFaceDimensions(state) {
    const { baseW, baseD } = computeKeycapBaseDim(state.uSize || 1.0, state.unitSize || 19.05);
    const h = computeKeycapHeight(state.profile, state.row);
    return {
        top:    { w: baseW * (state.topScale || 1.0), h: baseD * (state.topScale || 1.0) },
        front:  { w: baseW, h: h },
        back:   { w: baseW, h: h },
        left:   { w: baseD, h: h },
        right:  { w: baseD, h: h }
    };
}

/**
 * 複数 keycap の合計重量・コストを集計。
 * @param {Array<object>} states keycap state の配列
 * @param {string} material 'pla' / 'abs' / ...
 */
export function aggregateBatchEstimate(states, material) {
    let totalWeight = 0;
    let totalVolume = 0;
    for (const s of states) {
        totalVolume += computeKeycapVolume(s);
        totalWeight += computeKeycapWeight(s, material);
    }
    const m = MATERIAL_PRESETS[material || 'pla'] || MATERIAL_PRESETS.pla;
    return {
        count: states.length,
        totalVolumeCm3: +totalVolume.toFixed(2),
        totalWeightG:   +totalWeight.toFixed(1),
        totalCostUSD:   +((totalWeight / 1000) * m.pricePerKg).toFixed(2)
    };
}
