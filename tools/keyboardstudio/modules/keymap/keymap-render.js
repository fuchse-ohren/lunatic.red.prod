// =============================================
// KeybordStudio V1 - Keymap visual renderer
// modules/keymap/keymap-render.js
// =============================================
// キャンバスにキーボードレイアウトを描画。
//   - 各キーキャップ (角丸長方形)
//   - 現在レイヤーで割り当てられたキーラベル
//   - 背景 LED 色 (アニメーション対応)
//   - 選択キーのハイライト
//   - hover インジケータ
//
// クリックで keyIndex を返すコールバックを起動する。
// LED アニメーションのため requestAnimationFrame ループを内蔵。

import { computeAllColors, rgbToCss, notifyKeyPress } from './keymap-led.js';
import { formatKeycode } from './keymap-keycodes.js';

const KEY_PIXELS = 56;             // 1U = 56 px (zoom 1.0)
const KEY_PADDING = 4;
const KEY_RADIUS = 8;

export class KeymapRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} api  { getState(), onKeyClick(keyIndex), onKeyDoubleClick(keyIndex) }
     */
    constructor(canvas, api) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.api = api;
        this.zoom = 1.0;
        this.hoverIndex = -1;
        this.startTime = performance.now();
        this._raf = null;
        this._dpr = window.devicePixelRatio || 1;

        canvas.addEventListener('mousemove', (e) => this._onMove(e));
        canvas.addEventListener('mousedown', (e) => this._onDown(e));
        canvas.addEventListener('dblclick',  (e) => this._onDouble(e));
        canvas.addEventListener('mouseleave', () => { this.hoverIndex = -1; });

        this._loop = this._loop.bind(this);
        this.start();

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement?.getBoundingClientRect() || this.canvas.getBoundingClientRect();
        const w = Math.max(400, Math.floor(rect.width));
        const h = Math.max(260, Math.floor(rect.height));
        this.canvas.width  = w * this._dpr;
        this.canvas.height = h * this._dpr;
        this.canvas.style.width  = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    }

    start() {
        if (!this._raf) this._raf = requestAnimationFrame(this._loop);
    }
    stop() {
        if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    }

    _loop() {
        this._raf = requestAnimationFrame(this._loop);
        this.draw();
    }

    _layout() {
        const state = this.api.getState();
        const keys = state.physicalKeys || [];
        const maxX = Math.max(0, ...keys.map(k => k.x + k.w));
        const maxY = Math.max(0, ...keys.map(k => k.y + k.h));
        const totalW = maxX * KEY_PIXELS * this.zoom;
        const totalH = maxY * KEY_PIXELS * this.zoom;
        const cw = this.canvas.width / this._dpr;
        const ch = this.canvas.height / this._dpr;
        const ox = Math.max(8, (cw - totalW) / 2);
        const oy = Math.max(8, (ch - totalH) / 2);
        return { keys, totalW, totalH, ox, oy, cw, ch };
    }

    _keyRect(k, ox, oy) {
        const z = this.zoom;
        return {
            x: ox + k.x * KEY_PIXELS * z + KEY_PADDING,
            y: oy + k.y * KEY_PIXELS * z + KEY_PADDING,
            w: k.w * KEY_PIXELS * z - KEY_PADDING * 2,
            h: k.h * KEY_PIXELS * z - KEY_PADDING * 2
        };
    }

    draw() {
        const ctx = this.ctx;
        const state = this.api.getState();
        const { keys, ox, oy, cw, ch } = this._layout();
        const tSec = (performance.now() - this.startTime) / 1000;

        // Background
        ctx.fillStyle = '#0d0d10';
        ctx.fillRect(0, 0, cw, ch);

        if (keys.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No layout — load one in Layout Studio first.', cw/2, ch/2);
            return;
        }

        // Key colors via LED engine
        const colors = computeAllColors(state, tSec, { });

        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const r = this._keyRect(k, ox, oy);
            const ledRgb = colors[i] || [0, 0, 0];
            const ledOn = ledRgb[0] + ledRgb[1] + ledRgb[2] > 6;
            // Glow underlayer
            if (ledOn) {
                ctx.save();
                ctx.shadowBlur = 18;
                ctx.shadowColor = rgbToCss(...ledRgb);
                ctx.fillStyle = rgbToCss(...ledRgb);
                ctx.globalAlpha = 0.55;
                roundedRect(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, KEY_RADIUS + 2);
                ctx.fill();
                ctx.restore();
            }

            // Body
            const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
            grad.addColorStop(0, '#2c2c30');
            grad.addColorStop(1, '#1a1a1c');
            ctx.fillStyle = grad;
            roundedRect(ctx, r.x, r.y, r.w, r.h, KEY_RADIUS);
            ctx.fill();

            // Inner top highlight
            if (ledOn) {
                ctx.save();
                ctx.fillStyle = rgbToCss(...ledRgb);
                ctx.globalAlpha = 0.20;
                roundedRect(ctx, r.x + 3, r.y + 3, r.w - 6, r.h - 6, KEY_RADIUS - 2);
                ctx.fill();
                ctx.restore();
            }

            // Outline
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#3a3a3f';
            roundedRect(ctx, r.x, r.y, r.w, r.h, KEY_RADIUS);
            ctx.stroke();

            // Selected / hover
            if (state.selectedKey === i) {
                ctx.lineWidth = 2.2;
                ctx.strokeStyle = '#44d62c';
                roundedRect(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 2, KEY_RADIUS + 1);
                ctx.stroke();
            } else if (this.hoverIndex === i) {
                ctx.lineWidth = 1.8;
                ctx.strokeStyle = '#88e1ff';
                roundedRect(ctx, r.x, r.y, r.w, r.h, KEY_RADIUS);
                ctx.stroke();
            }

            // Label (current layer)
            const code = state.layers?.[state.currentLayer]?.[i] ?? 0;
            const label = formatKeycode(code) || '';
            ctx.fillStyle = ledOn ? '#fff' : '#cccccc';
            ctx.font = `${Math.max(9, Math.min(15, r.w * 0.27))}px ui-monospace, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(_truncate(label, r.w / 7), r.x + r.w/2, r.y + r.h/2);

            // Layer indicator (top-left tiny dot if non-default key on L0)
            if (state.currentLayer > 0 && code !== 0x0001) {
                ctx.fillStyle = '#ffd166';
                ctx.beginPath();
                ctx.arc(r.x + 6, r.y + 6, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Layer indicator (bottom-right)
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Layer ${state.currentLayer}`, cw - 8, ch - 8);

        // Connection indicator (top-right)
        if (state.connected) {
            ctx.fillStyle = '#44d62c';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('● HID Connected', cw - 8, 18);
        }
    }

    _onMove(e) {
        const idx = this._hitTest(e);
        if (idx !== this.hoverIndex) this.hoverIndex = idx;
    }
    _onDown(e) {
        const idx = this._hitTest(e);
        if (idx >= 0) {
            // Briefly mark this key as pressed for reactive LED
            notifyKeyPress(idx);
            this.api.onKeyClick?.(idx, e);
        }
    }
    _onDouble(e) {
        const idx = this._hitTest(e);
        if (idx >= 0) this.api.onKeyDoubleClick?.(idx, e);
    }
    _hitTest(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const { keys, ox, oy } = this._layout();
        for (let i = 0; i < keys.length; i++) {
            const r = this._keyRect(keys[i], ox, oy);
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
        }
        return -1;
    }

    setZoom(z) {
        this.zoom = Math.max(0.4, Math.min(2.5, z));
    }
}

function roundedRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
function _truncate(s, max) {
    if (!s) return '';
    if (s.length <= max) return s;
    return s.slice(0, Math.max(2, max - 1)) + '…';
}

export default KeymapRenderer;
