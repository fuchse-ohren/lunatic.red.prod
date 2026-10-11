// =============================================
// KeybordStudio V1 - Keymap Studio LED engine
// modules/keymap/keymap-led.js
// =============================================
// 各 LED モードについて、ある時間 t (秒) と key の物理座標 (x,y) と
// 状態 state を受け取って "色 (r,g,b)" を返す関数を提供する。
//
// レンダラ (keymap-render) は毎フレーム computeKeyColor(...) を呼び出して
// キーキャップ背景の蛍光色を更新する。
//
// 実機 (HID) の同期は別途 LIGHTING_SET_VALUE で行う。

// ── HSV → RGB ─────────────────────────────────
export function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360 / 60;
    s = Math.max(0, Math.min(1, s));
    v = Math.max(0, Math.min(1, v));
    const i = Math.floor(h);
    const f = h - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let r, g, b;
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        default: r = v; g = p; b = q;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function rgbToCss(r, g, b) {
    return `rgb(${r|0},${g|0},${b|0})`;
}
export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v|0)).toString(16).padStart(2,'0')).join('');
}
export function hexToRgb(hex) {
    const v = String(hex).replace('#','');
    const n = parseInt(v.length === 3 ? v.split('').map(c => c+c).join('') : v, 16);
    return [(n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
}

// ── キャッシュ用: per_key カラー → rgb ─────────
function applyBrightness(rgb, brightness) {
    const m = brightness / 255;
    return [
        Math.round(rgb[0] * m),
        Math.round(rgb[1] * m),
        Math.round(rgb[2] * m)
    ];
}

// ── reactive 用: 「最近押されたキー」の追跡 ──
const _recentPress = new Map();    // keyIndex → press time (ms)
export function notifyKeyPress(keyIndex) {
    _recentPress.set(keyIndex, performance.now());
}

// ── モード別関数 ─────────────────────────────
const MODES = {
    off: () => [0, 0, 0],

    solid: (t, x, y, s) => {
        const [r, g, b] = hsvToRgb(s.ledHue, s.ledSat, 1);
        return applyBrightness([r, g, b], s.ledBrightness);
    },

    breathing: (t, x, y, s) => {
        const speed = (s.ledSpeed / 255) * 1.5 + 0.2;
        const v = (Math.sin(t * speed * 2 * Math.PI) + 1) / 2;
        const [r, g, b] = hsvToRgb(s.ledHue, s.ledSat, v);
        return applyBrightness([r, g, b], s.ledBrightness);
    },

    rainbow: (t, x, y, s) => {
        const speed = (s.ledSpeed / 255) * 60 + 10;
        const hue = (t * speed) % 360;
        const [r, g, b] = hsvToRgb(hue, s.ledSat, 1);
        return applyBrightness([r, g, b], s.ledBrightness);
    },

    rainbow_swirl: (t, x, y, s, ctx) => {
        const cx = ctx?.cx || 0, cy = ctx?.cy || 0;
        const angle = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
        const speed = (s.ledSpeed / 255) * 90 + 15;
        const hue = (angle + t * speed) % 360;
        const [r, g, b] = hsvToRgb(hue, s.ledSat, 1);
        return applyBrightness([r, g, b], s.ledBrightness);
    },

    rainbow_wave: (t, x, y, s) => {
        const speed = (s.ledSpeed / 255) * 80 + 20;
        const hue = (x * 18 + t * speed) % 360;
        const [r, g, b] = hsvToRgb(hue, s.ledSat, 1);
        return applyBrightness([r, g, b], s.ledBrightness);
    },

    cycle: (t, x, y, s) => {
        const speed = (s.ledSpeed / 255) * 30 + 5;
        const hue = (t * speed) % 360;
        const [r, g, b] = hsvToRgb(hue, s.ledSat, 1);
        return applyBrightness([r, g, b], s.ledBrightness);
    },

    reactive: (t, x, y, s, ctx) => {
        const idx = ctx?.keyIndex;
        const last = idx != null ? _recentPress.get(idx) : null;
        if (!last) return [0, 0, 0];
        const dt = (performance.now() - last) / 1000;
        const fade = Math.max(0, 1 - dt * 1.5);
        if (fade <= 0) { _recentPress.delete(idx); return [0,0,0]; }
        const [r, g, b] = hsvToRgb(s.ledHue, s.ledSat, fade);
        return applyBrightness([r, g, b], s.ledBrightness);
    },

    ripple: (t, x, y, s, ctx) => {
        // 全 recent press からの距離・時間で重ね合わせ
        let R=0, G=0, B=0;
        const now = performance.now();
        for (const [idx, pt] of _recentPress.entries()) {
            const px = ctx?.positions?.[idx]?.x;
            const py = ctx?.positions?.[idx]?.y;
            if (px == null) continue;
            const dt = (now - pt) / 1000;
            if (dt > 1.0) { _recentPress.delete(idx); continue; }
            const dx = x - px, dy = y - py;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const wave = Math.cos((dist - dt * 8) * 1.0);
            const intensity = Math.max(0, wave) * Math.max(0, 1 - dt);
            const hue = ((dist * 30) + s.ledHue) % 360;
            const [r2, g2, b2] = hsvToRgb(hue, s.ledSat, intensity);
            R += r2; G += g2; B += b2;
        }
        return applyBrightness([Math.min(R,255), Math.min(G,255), Math.min(B,255)], s.ledBrightness);
    },

    splash: (t, x, y, s, ctx) => {
        // 単発フラッシュ (reactive と似ているが半径で広がる)
        const idx = ctx?.keyIndex;
        const last = idx != null ? _recentPress.get(idx) : null;
        if (!last) return [0, 0, 0];
        const dt = (performance.now() - last) / 1000;
        const v = Math.max(0, 1 - dt * 2);
        const [r, g, b] = hsvToRgb(s.ledHue, s.ledSat, v);
        return applyBrightness([r, g, b], s.ledBrightness);
    },

    static_gradient: (t, x, y, s, ctx) => {
        const w = ctx?.width || 15;
        const ratio = Math.max(0, Math.min(1, x / w));
        const hue = (s.ledHue + ratio * 180) % 360;
        const [r, g, b] = hsvToRgb(hue, s.ledSat, 1);
        return applyBrightness([r, g, b], s.ledBrightness);
    },

    per_key: (t, x, y, s, ctx) => {
        const idx = ctx?.keyIndex;
        const hex = (idx != null && s.ledPerKey) ? s.ledPerKey[idx] : null;
        if (!hex) return [0, 0, 0];
        return applyBrightness(hexToRgb(hex), s.ledBrightness);
    }
};

/**
 * @param {string} modeId
 * @param {number} t  時刻 (秒、ループ可)
 * @param {number} x  キーの物理 X (U)
 * @param {number} y  キーの物理 Y (U)
 * @param {object} state {ledHue, ledSat, ledBrightness, ledSpeed, ledPerKey}
 * @param {object} ctx { keyIndex, cx, cy, width, height, positions:[{x,y}], ... }
 * @returns {[number,number,number]} 0-255 RGB
 */
export function computeKeyColor(modeId, t, x, y, state, ctx) {
    const fn = MODES[modeId] || MODES.off;
    return fn(t, x, y, state, ctx);
}

/**
 * キーボード全体を一度に計算するヘルパー。
 */
export function computeAllColors(state, t, ctx) {
    const keys = state.physicalKeys || [];
    const out = new Array(keys.length);
    const w = Math.max(...keys.map(k => k.x + k.w));
    const h = Math.max(...keys.map(k => k.y + k.h));
    const positions = keys.map(k => ({ x: k.x + k.w/2, y: k.y + k.h/2 }));
    const baseCtx = {
        cx: w / 2, cy: h / 2, width: w, height: h, positions
    };
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const ctxI = { ...(ctx || {}), ...baseCtx, keyIndex: i };
        out[i] = computeKeyColor(state.ledMode, t, k.x + k.w/2, k.y + k.h/2, state, ctxI);
    }
    return out;
}

export default { computeKeyColor, computeAllColors, notifyKeyPress, hsvToRgb, hexToRgb, rgbToHex, rgbToCss };
