// =============================================
// KeybordStudio V1 - Keycap small helpers
// modules/keycap/keycap-helpers.js
// =============================================
// Phase 12-C: ジオメトリ・色・補助計算のユーティリティ関数。
// THREE.js に依存しないものに限定 (THREE 依存は keycap-render.js を別途設ける想定)。

/** linear interpolation */
export function lerp(a, b, t) { return a + (b - a) * t; }

/** clamp value to [min, max] */
export function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

/** degree → radian */
export function deg2rad(d) { return d * Math.PI / 180; }

/** radian → degree */
export function rad2deg(r) { return r * 180 / Math.PI; }

/** "#RRGGBB" → [r, g, b] (0-255) */
export function hexToRgb(hex) {
    const s = hex.replace('#', '');
    if (s.length !== 6) return [0, 0, 0];
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

/** [r, g, b] → "#RRGGBB" */
export function rgbToHex(r, g, b) {
    const h = (n) => n.toString(16).padStart(2, '0');
    return '#' + h(Math.round(r)) + h(Math.round(g)) + h(Math.round(b));
}

/** 2 hex colors の lightness 差 (0-255 単純差分の最大値) */
export function colorDiff(hex1, hex2) {
    const a = hexToRgb(hex1);
    const b = hexToRgb(hex2);
    return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

/** 矩形に点が含まれるか */
export function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/** 円に点が含まれるか */
export function pointInCircle(px, py, cx, cy, r) {
    const dx = px - cx, dy = py - cy;
    return dx * dx + dy * dy <= r * r;
}

/** 重量推定 (体積 cm³ × 密度) → グラム */
export function estimateWeightGrams(volumeCm3, density) {
    return volumeCm3 * density;
}

/** 印刷コスト推定 ($) */
export function estimateCostUSD(weightGrams, pricePerKg) {
    return (weightGrams / 1000) * pricePerKg;
}

/**
 * deep clone (JSON ベース、関数や Date は無視される)。
 * keycap state のスナップショット用に使う。
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * 2 つのオブジェクトの diff を計算 (一階層のみ)。
 * 値が異なるキーだけを returned object に含める。
 */
export function shallowDiff(a, b) {
    const out = {};
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    for (const k of keys) {
        if (JSON.stringify(a && a[k]) !== JSON.stringify(b && b[k])) {
            out[k] = b ? b[k] : undefined;
        }
    }
    return out;
}
