// =============================================
// KeybordStudio V1 - Keycap profile / row presets
// modules/keycap/keycap-presets.js
// =============================================
// Phase 12-C: プロファイル / 行 / 素材 / 彫刻深さの定数テーブル群を集約。
// index.html 内に同等のものが分散していたので、まずここに参照可能な
// 単一のソースを置き、新規コードはこちらを使う。

/** プロファイル別の概算高さ (mm) と傾きラベル */
export const PROFILE_INFO = Object.freeze({
    cherry: { name: 'Cherry',  approxHeight: 9.4, tilt: 'medium',  description: 'Standard sculpted profile' },
    oem:    { name: 'OEM',     approxHeight: 9.4, tilt: 'medium-high', description: 'Slightly taller than Cherry' },
    sa:     { name: 'SA',      approxHeight: 16.5, tilt: 'strong (spherical)', description: 'Tall, dished tops' },
    xda:    { name: 'XDA',     approxHeight: 9.0,  tilt: 'flat',    description: 'Uniform, flat-topped' },
    dsa:    { name: 'DSA',     approxHeight: 7.4,  tilt: 'flat',    description: 'Low-profile uniform spherical' },
    kat:    { name: 'KAT',     approxHeight: 12.0, tilt: 'medium',  description: 'Sculpted, tall-ish' },
    mt3:    { name: 'MT3',     approxHeight: 14.0, tilt: 'strong (sculpted)', description: 'Deep dish, sculpted' },
    cherrylp: { name: 'Cherry LP', approxHeight: 5.0, tilt: 'low',  description: 'Low-profile Cherry' },
    choc:   { name: 'Choc',    approxHeight: 4.5,  tilt: 'low',     description: 'Kailh Choc low-profile' },
});

/** 行 (R1-R4 + F) ラベル */
export const ROW_INFO = Object.freeze({
    R1: { name: 'R1', tilt: 7,  description: 'Number row (front-tilted)' },
    R2: { name: 'R2', tilt: 4,  description: 'QWERTY row' },
    R3: { name: 'R3', tilt: 0,  description: 'Home row (flat)' },
    R4: { name: 'R4', tilt: -4, description: 'ZXCV row (back-tilted)' },
    F:  { name: 'F',  tilt: 8,  description: 'Function row' },
});

/** 素材 (PLA / ABS / PETG / Resin) ごとの推奨パラメータ */
export const MATERIAL_PRESETS = Object.freeze({
    pla:   { stemClearance: 0.30, wallThickness: 1.5, textHeight: 0.5, density: 1.24, pricePerKg: 25 },
    abs:   { stemClearance: 0.25, wallThickness: 1.5, textHeight: 0.5, density: 1.04, pricePerKg: 28 },
    petg:  { stemClearance: 0.35, wallThickness: 1.6, textHeight: 0.6, density: 1.27, pricePerKg: 28 },
    resin: { stemClearance: 0.18, wallThickness: 1.2, textHeight: 0.3, density: 1.10, pricePerKg: 70 },
    nylon: { stemClearance: 0.20, wallThickness: 1.4, textHeight: 0.4, density: 1.13, pricePerKg: 60 },
});

/** 文字彫刻深さ プリセット (mm) */
export const ENGRAVE_DEPTH_PRESETS = Object.freeze({
    fdm:   0.6,
    resin: 0.3,
    laser: 0.1,
    inlay: 1.2
});

/** ステム形式 */
export const STEM_TYPES = Object.freeze({
    mx:    { name: 'Cherry MX',     diameter: 5.50, hole: 'cross 4×1.3' },
    choc:  { name: 'Kailh Choc',    diameter: 3.20, hole: '2 × rectangular pegs' },
    alps:  { name: 'Alps SKCM',     diameter: 4.50, hole: 'rectangular slot' },
    topre: { name: 'Topre',         diameter: 5.20, hole: 'cylindrical' }
});

export function listProfileNames() { return Object.keys(PROFILE_INFO); }
export function listRowNames()     { return Object.keys(ROW_INFO); }
export function listMaterialIds()  { return Object.keys(MATERIAL_PRESETS); }
