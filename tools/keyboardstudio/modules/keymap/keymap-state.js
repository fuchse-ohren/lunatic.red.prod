// =============================================
// KeybordStudio V1 - Keymap Studio state
// modules/keymap/keymap-state.js
// =============================================
// Keymap / LED / Macro 状態を 1 つのオブジェクトで保持し、
// JSON でシリアライズ / 復元できるようにする。VIA 互換 ".vil" /
// VIA Editor 形式 ".layout.json" に近いスキーマ。
//
// state は単一インスタンス (シングルトン)。
// 変更はミューテーション + emit(EVENT) で UI が反応する。
//
// Layer / Macro / LED は配列インデックスで参照する。
//   state.layers[layer][keyIndex] = keycode (0..0xFFFF)
//   state.macros[idx] = [{type:'tap', code:0x04}, {type:'delay', ms:30}, ...]
//   state.ledMode = 'rainbow_wave'
//   state.ledColors[keyIndex] = '#ff0033'

import { LAYER_COUNT, MAX_MACROS, LED_MODES, DEFAULT_LED_BRIGHTNESS, DEFAULT_LED_SPEED } from './keymap-constants.js';
import { getKeycodeById } from './keymap-keycodes.js';

// ── 標準 ANSI 60% layout (key index と物理位置) ──
// 各キーは { x, y, w, h, label, defaultKey } の形。
// x,y,w,h は U 単位 (1u = 19.05mm)。
function buildAnsi60() {
    const r = [];
    let i = 0;
    const push = (x, y, w, label, defaultKey, h = 1) => {
        r.push({ index: i++, x, y, w, h, label, defaultKey });
    };

    // R1
    'KC_GRV|KC_1|KC_2|KC_3|KC_4|KC_5|KC_6|KC_7|KC_8|KC_9|KC_0|KC_MINS|KC_EQL'.split('|').forEach((k, idx) => {
        const labels = ['`','1','2','3','4','5','6','7','8','9','0','-','='];
        push(idx, 0, 1, labels[idx], k);
    });
    push(13, 0, 2, 'BkSp', 'KC_BSPC');

    // R2
    push(0, 1, 1.5, 'Tab', 'KC_TAB');
    'QWERTYUIOP'.split('').forEach((c, idx) => {
        push(1.5 + idx, 1, 1, c, 'KC_' + c);
    });
    push(11.5, 1, 1, '[', 'KC_LBRC');
    push(12.5, 1, 1, ']', 'KC_RBRC');
    push(13.5, 1, 1.5, '\\', 'KC_BSLS');

    // R3
    push(0, 2, 1.75, 'Caps', 'KC_CAPS');
    'ASDFGHJKL'.split('').forEach((c, idx) => {
        push(1.75 + idx, 2, 1, c, 'KC_' + c);
    });
    push(10.75, 2, 1, ';', 'KC_SCLN');
    push(11.75, 2, 1, '\'', 'KC_QUOT');
    push(12.75, 2, 2.25, 'Enter', 'KC_ENT');

    // R4
    push(0, 3, 2.25, 'L Shift', 'KC_LSFT');
    'ZXCVBNM'.split('').forEach((c, idx) => {
        push(2.25 + idx, 3, 1, c, 'KC_' + c);
    });
    push(9.25, 3, 1, ',', 'KC_COMM');
    push(10.25, 3, 1, '.', 'KC_DOT');
    push(11.25, 3, 1, '/', 'KC_SLSH');
    push(12.25, 3, 2.75, 'R Shift', 'KC_RSFT');

    // R5
    push(0,  4, 1.25, 'Ctrl', 'KC_LCTL');
    push(1.25, 4, 1.25, 'Win',  'KC_LGUI');
    push(2.5,  4, 1.25, 'Alt',  'KC_LALT');
    push(3.75, 4, 6.25, 'Space', 'KC_SPC');
    push(10,   4, 1.25, 'Alt',  'KC_RALT');
    push(11.25,4, 1.25, 'Win',  'KC_RGUI');
    push(12.5, 4, 1.25, 'Menu', 'MO(1)');
    push(13.75,4, 1.25, 'Ctrl', 'KC_RCTL');

    return r;
}

const ANSI60 = buildAnsi60();

// ── デフォルト state 工場 ────────────────────
function _buildDefaultLayer(physicalKeys, layerIndex) {
    return physicalKeys.map(k => {
        if (layerIndex === 0) {
            return getKeycodeById(k.defaultKey)?.code || 0;
        }
        // L1+ → 透過
        return 0x0001;       // KC_TRNS
    });
}

function makeDefaultState(physicalKeys = ANSI60) {
    return {
        keyboardName: 'KeybordStudio Default',
        physicalLayout: 'ansi60',
        physicalKeys,                                 // [{index,x,y,w,h,label,defaultKey}]
        currentLayer: 0,
        layers: Array.from({ length: LAYER_COUNT },
            (_, i) => _buildDefaultLayer(physicalKeys, i)),
        // LED state
        ledMode: 'rainbow_wave',
        ledHue: 0,           // 0-359
        ledSat: 1.0,         // 0-1
        ledBrightness: DEFAULT_LED_BRIGHTNESS,
        ledSpeed: DEFAULT_LED_SPEED,
        ledPerKey: {},       // { keyIndex: '#hex', ... }  per_key モードで使用
        ledLayers: [],       // 1 レイヤー = 1 LED scene (将来用)
        // Macros
        macros: Array.from({ length: MAX_MACROS }, () => []),
        macroNames: Array.from({ length: MAX_MACROS }, (_, i) => `Macro ${i}`),
        // HID
        device: null,        // { vendorId, productId, productName }
        connected: false,
        // Realtime preview
        realTimePreview: true,
        // Selection
        selectedKey: null    // index | null
    };
}

// ── State storage ────────────────────────────
let _state = makeDefaultState();

export function getState() { return _state; }
export function setState(s) { _state = Object.assign({}, _state, s); _emit('state', _state); }
export function resetState() {
    _state = makeDefaultState(_state.physicalKeys);
    _emit('reset', _state);
    _emit('state', _state);
}

// ── 物理レイアウトの差し替え (Layout Studio などから流入) ──
export function setPhysicalKeys(keys) {
    _state.physicalKeys = keys;
    _state.layers = Array.from({ length: LAYER_COUNT },
        (_, i) => _buildDefaultLayer(keys, i));
    _state.ledPerKey = {};
    _emit('layout', keys);
}

// ── Layer ops ────────────────────────────────
export function setLayer(idx) {
    _state.currentLayer = Math.max(0, Math.min(LAYER_COUNT - 1, idx));
    _emit('layer', _state.currentLayer);
}
export function setKey(layerIndex, keyIndex, code) {
    if (layerIndex < 0 || layerIndex >= LAYER_COUNT) return;
    if (keyIndex < 0 || keyIndex >= _state.layers[layerIndex].length) return;
    _state.layers[layerIndex][keyIndex] = code;
    _emit('key', { layer: layerIndex, key: keyIndex, code });
}
export function getKey(layerIndex, keyIndex) {
    return _state.layers[layerIndex]?.[keyIndex] ?? 0;
}

// ── LED ops ──────────────────────────────────
export function setLedMode(modeId) {
    if (LED_MODES.find(m => m.id === modeId)) {
        _state.ledMode = modeId;
        _emit('led-mode', modeId);
    }
}
export function setLedHue(deg)  { _state.ledHue = ((deg % 360) + 360) % 360; _emit('led-color', { hue: _state.ledHue }); }
export function setLedSat(s)    { _state.ledSat = Math.max(0, Math.min(1, s)); _emit('led-color', { sat: _state.ledSat }); }
export function setLedBright(v) { _state.ledBrightness = Math.max(0, Math.min(255, v|0)); _emit('led-color', { brightness: _state.ledBrightness }); }
export function setLedSpeed(v)  { _state.ledSpeed = Math.max(0, Math.min(255, v|0)); _emit('led-color', { speed: _state.ledSpeed }); }
export function setLedPerKey(keyIndex, hex) {
    if (hex == null) delete _state.ledPerKey[keyIndex];
    else _state.ledPerKey[keyIndex] = hex;
    _emit('led-key', { keyIndex, hex });
}
export function clearLedPerKey() {
    _state.ledPerKey = {};
    _emit('led-key', null);
}

// ── Macro ops ────────────────────────────────
export function setMacro(idx, actions) {
    if (idx < 0 || idx >= MAX_MACROS) return;
    _state.macros[idx] = (actions || []).slice();
    _emit('macro', { idx, actions: _state.macros[idx] });
}
export function setMacroName(idx, name) {
    if (idx < 0 || idx >= MAX_MACROS) return;
    _state.macroNames[idx] = name || `Macro ${idx}`;
    _emit('macro-name', { idx, name: _state.macroNames[idx] });
}
export function appendMacroAction(idx, action) {
    if (!_state.macros[idx]) _state.macros[idx] = [];
    _state.macros[idx].push(action);
    _emit('macro', { idx, actions: _state.macros[idx] });
}
export function clearMacro(idx) {
    if (idx < 0 || idx >= MAX_MACROS) return;
    _state.macros[idx] = [];
    _emit('macro', { idx, actions: [] });
}

// ── Selection ────────────────────────────────
export function selectKey(idx) {
    _state.selectedKey = idx;
    _emit('select', idx);
}

// ── Event bus (lightweight) ──────────────────
const _listeners = new Map();
function _emit(evt, data) {
    const ls = _listeners.get(evt);
    if (ls) for (const fn of ls) {
        try { fn(data); } catch (e) { console.error(e); }
    }
    const all = _listeners.get('*');
    if (all) for (const fn of all) {
        try { fn(evt, data); } catch (e) { console.error(e); }
    }
}
export function on(evt, fn) {
    if (!_listeners.has(evt)) _listeners.set(evt, new Set());
    _listeners.get(evt).add(fn);
    return () => _listeners.get(evt)?.delete(fn);
}
export function off(evt, fn) { _listeners.get(evt)?.delete(fn); }

// ── (de)serialize ────────────────────────────
export function exportJSON() {
    const s = _state;
    return JSON.stringify({
        version: 1,
        kind: 'keybordstudio.keymap',
        keyboardName: s.keyboardName,
        physicalLayout: s.physicalLayout,
        physicalKeys: s.physicalKeys,
        layers: s.layers,
        ledMode: s.ledMode,
        ledHue: s.ledHue, ledSat: s.ledSat,
        ledBrightness: s.ledBrightness, ledSpeed: s.ledSpeed,
        ledPerKey: s.ledPerKey,
        macros: s.macros,
        macroNames: s.macroNames
    }, null, 2);
}

export function importJSON(text) {
    const obj = (typeof text === 'string') ? JSON.parse(text) : text;
    if (!obj || obj.kind !== 'keybordstudio.keymap') {
        throw new Error('Not a KeybordStudio keymap file.');
    }
    _state = Object.assign(makeDefaultState(obj.physicalKeys || ANSI60), obj);
    // 配列の深いコピー
    _state.layers = (obj.layers || _state.layers).map(l => l.slice());
    _state.macros = (obj.macros || _state.macros).map(m => m.slice());
    _state.ledPerKey = Object.assign({}, obj.ledPerKey || {});
    _emit('state', _state);
    return _state;
}

// ── Public layout factory ─────────────────────
export const PHYSICAL_LAYOUTS = Object.freeze({
    ansi60:   { name: '60% ANSI',     build: buildAnsi60 }
});

export function loadPhysicalLayout(layoutId) {
    const def = PHYSICAL_LAYOUTS[layoutId];
    if (!def) return null;
    const keys = def.build();
    _state.physicalLayout = layoutId;
    setPhysicalKeys(keys);
    return keys;
}

export default getState;
