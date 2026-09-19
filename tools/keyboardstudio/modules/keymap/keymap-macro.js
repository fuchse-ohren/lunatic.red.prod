// =============================================
// KeybordStudio V1 - Keymap Studio macro engine
// modules/keymap/keymap-macro.js
// =============================================
// マクロのレコード / 再生 / シリアライズ。
// VIA macro buffer フォーマット (QMK macro string):
//   \x01 = MACRO_END (終端)
//   \x01\x02 = TAP key
//   \x01\x03 = DOWN key
//   \x01\x04 = UP key
//   \x01\x05 = DELAY (followed by ascii ms decimal)
//   その他は ASCII テキストとしてタイプ
//
// 内部表現は { type, ... } の配列。serializeViaBuffer で VIA バイト列に変換。

import { MACRO_ACTION, MAX_MACRO_LENGTH } from './keymap-constants.js';
import { getKeycode, getKeycodeById } from './keymap-keycodes.js';

// ── 録画 ───────────────────────────────────
class MacroRecorder {
    constructor() {
        this.recording = false;
        this.actions = [];
        this.startTime = 0;
        this.lastTime  = 0;
        this._handlers = null;
    }
    start() {
        if (this.recording) return;
        this.recording = true;
        this.actions = [];
        this.startTime = performance.now();
        this.lastTime  = this.startTime;

        const onDown = (e) => {
            if (!this.recording) return;
            // 修飾子も独立して記録
            const code = browserEventToKeycode(e);
            if (code === 0) return;
            this._maybePushDelay();
            this.actions.push({ type: MACRO_ACTION.DOWN, code, label: e.key });
            // Escape で停止
            if (e.key === 'Escape') {
                this.stop();
                return;
            }
            e.preventDefault();
        };
        const onUp = (e) => {
            if (!this.recording) return;
            const code = browserEventToKeycode(e);
            if (code === 0) return;
            this._maybePushDelay();
            this.actions.push({ type: MACRO_ACTION.UP, code, label: e.key });
            e.preventDefault();
        };
        this._handlers = { onDown, onUp };
        window.addEventListener('keydown', onDown, true);
        window.addEventListener('keyup',   onUp,   true);
    }
    stop() {
        if (!this.recording) return;
        this.recording = false;
        if (this._handlers) {
            window.removeEventListener('keydown', this._handlers.onDown, true);
            window.removeEventListener('keyup',   this._handlers.onUp,   true);
            this._handlers = null;
        }
        // DOWN/UP のペアを TAP に圧縮 (短時間連続なら)
        this.actions = compactPairs(this.actions);
        return this.actions.slice();
    }
    _maybePushDelay() {
        const now = performance.now();
        const dt = Math.round(now - this.lastTime);
        this.lastTime = now;
        if (dt > 30 && this.actions.length > 0) {
            this.actions.push({ type: MACRO_ACTION.DELAY, ms: dt });
        }
    }
}

let _recorder = null;
export function getRecorder() {
    if (!_recorder) _recorder = new MacroRecorder();
    return _recorder;
}

// ── DOM event → QMK keycode ─────────────────
function browserEventToKeycode(e) {
    // KeyA..KeyZ
    if (e.code && /^Key[A-Z]$/.test(e.code)) {
        return getKeycodeById('KC_' + e.code.slice(3))?.code || 0;
    }
    // Digit0..9 → KC_0..KC_9
    if (/^Digit[0-9]$/.test(e.code)) {
        return getKeycodeById('KC_' + e.code.slice(5))?.code || 0;
    }
    // Numpad0..9 → KC_P0..P9
    if (/^Numpad[0-9]$/.test(e.code)) {
        return getKeycodeById('KC_P' + e.code.slice(6))?.code || 0;
    }
    const map = {
        Space: 'KC_SPC', Enter: 'KC_ENT', Tab: 'KC_TAB',
        Backspace: 'KC_BSPC', Escape: 'KC_ESC', CapsLock: 'KC_CAPS',
        ShiftLeft: 'KC_LSFT', ShiftRight: 'KC_RSFT',
        ControlLeft: 'KC_LCTL', ControlRight: 'KC_RCTL',
        AltLeft: 'KC_LALT', AltRight: 'KC_RALT',
        MetaLeft: 'KC_LGUI', MetaRight: 'KC_RGUI',
        ArrowUp: 'KC_UP', ArrowDown: 'KC_DOWN',
        ArrowLeft: 'KC_LEFT', ArrowRight: 'KC_RGHT',
        Home: 'KC_HOME', End: 'KC_END',
        PageUp: 'KC_PGUP', PageDown: 'KC_PGDN',
        Insert: 'KC_INS', Delete: 'KC_DEL',
        Minus: 'KC_MINS', Equal: 'KC_EQL',
        BracketLeft: 'KC_LBRC', BracketRight: 'KC_RBRC',
        Backslash: 'KC_BSLS', Semicolon: 'KC_SCLN',
        Quote: 'KC_QUOT', Backquote: 'KC_GRV',
        Comma: 'KC_COMM', Period: 'KC_DOT', Slash: 'KC_SLSH',
        F1: 'KC_F1', F2: 'KC_F2', F3: 'KC_F3', F4: 'KC_F4',
        F5: 'KC_F5', F6: 'KC_F6', F7: 'KC_F7', F8: 'KC_F8',
        F9: 'KC_F9', F10: 'KC_F10', F11: 'KC_F11', F12: 'KC_F12'
    };
    if (map[e.code]) return getKeycodeById(map[e.code])?.code || 0;
    return 0;
}

// ── DOWN/UP ペアを TAP に圧縮 ──────────────────
function compactPairs(actions) {
    const out = [];
    for (let i = 0; i < actions.length; i++) {
        const a = actions[i];
        if (a.type === MACRO_ACTION.DOWN) {
            // 直後 (delay 1 つを許容) で同じ code の UP があるか
            let j = i + 1;
            let intervening = 0;
            while (j < actions.length && actions[j].type === MACRO_ACTION.DELAY && actions[j].ms < 80) {
                intervening++;
                j++;
            }
            if (j < actions.length && actions[j].type === MACRO_ACTION.UP && actions[j].code === a.code) {
                out.push({ type: MACRO_ACTION.TAP, code: a.code, label: a.label });
                i = j;             // skip pair
                continue;
            }
        }
        out.push(a);
    }
    return out;
}

// ── 再生 (UI シミュレート) ──────────────────────
/**
 * 与えられた actions 配列を「タイプ」シミュレート: window に keydown/keyup を
 * dispatch する。リアル HID は keymap-hid.js の writeMacro 経由。
 */
export async function playMacroSimulated(actions) {
    for (const a of actions) {
        if (a.type === MACRO_ACTION.DELAY) {
            await new Promise(r => setTimeout(r, a.ms));
        } else if (a.type === MACRO_ACTION.TEXT) {
            for (const ch of (a.text || '')) {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }));
                window.dispatchEvent(new KeyboardEvent('keyup',   { key: ch, bubbles: true }));
                await new Promise(r => setTimeout(r, 5));
            }
        } else if (a.type === MACRO_ACTION.TAP) {
            const k = getKeycode(a.code);
            window.dispatchEvent(new KeyboardEvent('keydown', { key: k?.label || '', bubbles: true }));
            window.dispatchEvent(new KeyboardEvent('keyup',   { key: k?.label || '', bubbles: true }));
        }
    }
}

// ── VIA wire シリアライズ ─────────────────────
/**
 * actions → Uint8Array (VIA macro buffer 1 macro 分)
 * QMK の dynamic_keymap_macro_set_buffer フォーマットに合わせる。
 */
export function serializeViaBuffer(actions) {
    const bytes = [];
    for (const a of actions) {
        if (a.type === MACRO_ACTION.TEXT) {
            for (const ch of a.text || '') {
                const code = ch.charCodeAt(0);
                if (code < 0x80 && code !== 0x01) bytes.push(code);
            }
        } else if (a.type === MACRO_ACTION.TAP) {
            bytes.push(0x01, 0x02, a.code & 0xFF);     // SS_TAP
        } else if (a.type === MACRO_ACTION.DOWN) {
            bytes.push(0x01, 0x03, a.code & 0xFF);     // SS_DOWN
        } else if (a.type === MACRO_ACTION.UP) {
            bytes.push(0x01, 0x04, a.code & 0xFF);     // SS_UP
        } else if (a.type === MACRO_ACTION.DELAY) {
            const s = String(Math.max(0, a.ms|0));
            bytes.push(0x01, 0x05);
            for (const c of s) bytes.push(c.charCodeAt(0));
            bytes.push(0x7C);                          // '|' delay terminator
        }
        if (bytes.length >= MAX_MACRO_LENGTH - 2) break;
    }
    bytes.push(0x00);
    return Uint8Array.from(bytes);
}

/**
 * VIA バイト列 → actions 配列
 */
export function deserializeViaBuffer(bytes) {
    const actions = [];
    let i = 0;
    let textBuf = '';
    const flushText = () => {
        if (textBuf) {
            actions.push({ type: MACRO_ACTION.TEXT, text: textBuf });
            textBuf = '';
        }
    };
    while (i < bytes.length) {
        const b = bytes[i];
        if (b === 0x00) { flushText(); break; }
        if (b === 0x01) {
            flushText();
            const op = bytes[++i];
            if (op === 0x02 || op === 0x03 || op === 0x04) {
                const code = bytes[++i];
                actions.push({
                    type: op === 0x02 ? MACRO_ACTION.TAP
                        : op === 0x03 ? MACRO_ACTION.DOWN : MACRO_ACTION.UP,
                    code
                });
                i++;
            } else if (op === 0x05) {
                let ms = '';
                i++;
                while (i < bytes.length && bytes[i] !== 0x7C) {
                    ms += String.fromCharCode(bytes[i]);
                    i++;
                }
                i++;     // skip '|'
                actions.push({ type: MACRO_ACTION.DELAY, ms: parseInt(ms) || 0 });
            } else {
                i++;
            }
        } else {
            textBuf += String.fromCharCode(b);
            i++;
        }
    }
    flushText();
    return actions;
}

/**
 * actions → 人間可読な文字列 ("Tap A → 50ms → Tap B")
 */
export function actionsToString(actions) {
    if (!actions || actions.length === 0) return '(empty)';
    return actions.map(a => {
        if (a.type === MACRO_ACTION.TAP)   return `Tap ${getKeycode(a.code)?.label || a.label || `0x${a.code?.toString(16)}`}`;
        if (a.type === MACRO_ACTION.DOWN)  return `↓ ${getKeycode(a.code)?.label || a.label || a.code}`;
        if (a.type === MACRO_ACTION.UP)    return `↑ ${getKeycode(a.code)?.label || a.label || a.code}`;
        if (a.type === MACRO_ACTION.DELAY) return `${a.ms}ms`;
        if (a.type === MACRO_ACTION.TEXT)  return `"${a.text}"`;
        return '?';
    }).join(' → ');
}

/**
 * テキストをマクロに変換 ("Hello!" → タイプアクション)。
 */
export function textToMacro(text) {
    return [{ type: MACRO_ACTION.TEXT, text }];
}

export default { getRecorder, playMacroSimulated, serializeViaBuffer, deserializeViaBuffer, actionsToString, textToMacro };
