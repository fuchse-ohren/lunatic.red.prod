// =============================================
// KeybordStudio V1 - Keymap Studio keycode DB
// modules/keymap/keymap-keycodes.js
// =============================================
// QMK 互換キーコードデータベース。VIA / VIAL プロトコルでも同じ整数 ID。
//
// 参考:
//   - QMK keycodes (https://docs.qmk.fm/#/keycodes)
//   - VIA protocol keycode table (https://www.caniusevia.com/)
//
// キーコード = 16bit。下位 8 bit が HID usage、上位 8 bit が modifier mask
// または特殊カテゴリ (LT, MO, TG, MOD-TAP, ...)。
//
// 構造:
//   { code: 0x0004, id: 'KC_A', label: 'A', group: 'alpha', desc: '...' }
//
// UI のキーコードピッカーは group ごとに表示する。

// ── 主要グループ列挙 ─────────────────────────────
export const KEYCODE_GROUPS = Object.freeze([
    'basic', 'mods', 'media', 'fn', 'navigation', 'numpad',
    'layer', 'macro', 'lighting', 'system', 'mouse', 'special'
]);

// ── 基本キーコード (QMK basic, 0x0000-0x00FF) ────
// 以下は QMK の主要部分のみを抜粋。255 の HID usage を全部入れる必要は
// なく、頻出キーを網羅する。
const BASIC = [
    { code: 0x0000, id: 'KC_NO',    label: '',     group: 'basic', desc: 'No-op' },
    { code: 0x0001, id: 'KC_TRNS',  label: '▽',    group: 'layer', desc: 'Transparent (use layer below)' },

    // Letters (0x04..0x1D)
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c, i) => ({
        code: 0x0004 + i, id: 'KC_' + c, label: c, group: 'basic'
    })),
    // Numbers (0x1E..0x27 = 1..9, 0)
    ...'1234567890'.split('').map((c, i) => ({
        code: 0x001E + i, id: 'KC_' + c, label: c, group: 'basic'
    })),
    // Whitespace / control
    { code: 0x0028, id: 'KC_ENT',   label: 'Enter', group: 'basic' },
    { code: 0x0029, id: 'KC_ESC',   label: 'Esc',   group: 'basic' },
    { code: 0x002A, id: 'KC_BSPC',  label: 'BkSp',  group: 'basic' },
    { code: 0x002B, id: 'KC_TAB',   label: 'Tab',   group: 'basic' },
    { code: 0x002C, id: 'KC_SPC',   label: 'Space', group: 'basic' },
    // Symbols
    { code: 0x002D, id: 'KC_MINS',  label: '-',     group: 'basic' },
    { code: 0x002E, id: 'KC_EQL',   label: '=',     group: 'basic' },
    { code: 0x002F, id: 'KC_LBRC',  label: '[',     group: 'basic' },
    { code: 0x0030, id: 'KC_RBRC',  label: ']',     group: 'basic' },
    { code: 0x0031, id: 'KC_BSLS',  label: '\\',    group: 'basic' },
    { code: 0x0033, id: 'KC_SCLN',  label: ';',     group: 'basic' },
    { code: 0x0034, id: 'KC_QUOT',  label: '\'',    group: 'basic' },
    { code: 0x0035, id: 'KC_GRV',   label: '`',     group: 'basic' },
    { code: 0x0036, id: 'KC_COMM',  label: ',',     group: 'basic' },
    { code: 0x0037, id: 'KC_DOT',   label: '.',     group: 'basic' },
    { code: 0x0038, id: 'KC_SLSH',  label: '/',     group: 'basic' },
    // Caps
    { code: 0x0039, id: 'KC_CAPS',  label: 'Caps',  group: 'mods' }
];

// ── F-keys (0x3A..0x45 = F1..F12, 0x68..0x73 = F13..F24) ──
const FN = [
    ...Array.from({ length: 12 }, (_, i) => ({
        code: 0x003A + i, id: 'KC_F' + (i + 1), label: 'F' + (i + 1), group: 'fn'
    })),
    ...Array.from({ length: 12 }, (_, i) => ({
        code: 0x0068 + i, id: 'KC_F' + (i + 13), label: 'F' + (i + 13), group: 'fn'
    }))
];

// ── Navigation (0x46..0x4E) ──────────────────────
const NAV = [
    { code: 0x0046, id: 'KC_PSCR',  label: 'PrtSc', group: 'navigation' },
    { code: 0x0047, id: 'KC_SCRL',  label: 'ScrLk', group: 'navigation' },
    { code: 0x0048, id: 'KC_PAUS',  label: 'Pause', group: 'navigation' },
    { code: 0x0049, id: 'KC_INS',   label: 'Ins',   group: 'navigation' },
    { code: 0x004A, id: 'KC_HOME',  label: 'Home',  group: 'navigation' },
    { code: 0x004B, id: 'KC_PGUP',  label: 'PgUp',  group: 'navigation' },
    { code: 0x004C, id: 'KC_DEL',   label: 'Del',   group: 'navigation' },
    { code: 0x004D, id: 'KC_END',   label: 'End',   group: 'navigation' },
    { code: 0x004E, id: 'KC_PGDN',  label: 'PgDn',  group: 'navigation' },
    { code: 0x004F, id: 'KC_RGHT',  label: '→',     group: 'navigation' },
    { code: 0x0050, id: 'KC_LEFT',  label: '←',     group: 'navigation' },
    { code: 0x0051, id: 'KC_DOWN',  label: '↓',     group: 'navigation' },
    { code: 0x0052, id: 'KC_UP',    label: '↑',     group: 'navigation' }
];

// ── Numpad (0x53..0x63) ──────────────────────────
const NUMPAD = [
    { code: 0x0053, id: 'KC_NUM',   label: 'Num',   group: 'numpad' },
    { code: 0x0054, id: 'KC_PSLS',  label: 'P/',    group: 'numpad' },
    { code: 0x0055, id: 'KC_PAST',  label: 'P*',    group: 'numpad' },
    { code: 0x0056, id: 'KC_PMNS',  label: 'P-',    group: 'numpad' },
    { code: 0x0057, id: 'KC_PPLS',  label: 'P+',    group: 'numpad' },
    { code: 0x0058, id: 'KC_PENT',  label: 'PEnt',  group: 'numpad' },
    { code: 0x0059, id: 'KC_P1',    label: 'P1',    group: 'numpad' },
    { code: 0x005A, id: 'KC_P2',    label: 'P2',    group: 'numpad' },
    { code: 0x005B, id: 'KC_P3',    label: 'P3',    group: 'numpad' },
    { code: 0x005C, id: 'KC_P4',    label: 'P4',    group: 'numpad' },
    { code: 0x005D, id: 'KC_P5',    label: 'P5',    group: 'numpad' },
    { code: 0x005E, id: 'KC_P6',    label: 'P6',    group: 'numpad' },
    { code: 0x005F, id: 'KC_P7',    label: 'P7',    group: 'numpad' },
    { code: 0x0060, id: 'KC_P8',    label: 'P8',    group: 'numpad' },
    { code: 0x0061, id: 'KC_P9',    label: 'P9',    group: 'numpad' },
    { code: 0x0062, id: 'KC_P0',    label: 'P0',    group: 'numpad' },
    { code: 0x0063, id: 'KC_PDOT',  label: 'P.',    group: 'numpad' }
];

// ── Modifiers (0xE0..0xE7) ───────────────────────
const MODS = [
    { code: 0x00E0, id: 'KC_LCTL',  label: 'L Ctrl',  group: 'mods' },
    { code: 0x00E1, id: 'KC_LSFT',  label: 'L Shift', group: 'mods' },
    { code: 0x00E2, id: 'KC_LALT',  label: 'L Alt',   group: 'mods' },
    { code: 0x00E3, id: 'KC_LGUI',  label: 'L Win',   group: 'mods' },
    { code: 0x00E4, id: 'KC_RCTL',  label: 'R Ctrl',  group: 'mods' },
    { code: 0x00E5, id: 'KC_RSFT',  label: 'R Shift', group: 'mods' },
    { code: 0x00E6, id: 'KC_RALT',  label: 'R Alt',   group: 'mods' },
    { code: 0x00E7, id: 'KC_RGUI',  label: 'R Win',   group: 'mods' }
];

// ── Media / consumer (QMK extended 0xA5..0xA9 region) ──
// QMK は consumer page を 0x00A5 から 0x00B9 にマップする
const MEDIA = [
    { code: 0x00A5, id: 'KC_MNXT',  label: '⏭',     group: 'media',  desc: 'Next track' },
    { code: 0x00A6, id: 'KC_MPRV',  label: '⏮',     group: 'media',  desc: 'Prev track' },
    { code: 0x00A7, id: 'KC_MSTP',  label: '⏹',     group: 'media',  desc: 'Stop' },
    { code: 0x00A8, id: 'KC_MPLY',  label: '⏯',     group: 'media',  desc: 'Play/Pause' },
    { code: 0x00A9, id: 'KC_MUTE',  label: '🔇',     group: 'media' },
    { code: 0x00AA, id: 'KC_VOLU',  label: '🔊+',    group: 'media' },
    { code: 0x00AB, id: 'KC_VOLD',  label: '🔊-',    group: 'media' },
    { code: 0x00AC, id: 'KC_BRIU',  label: '☀+',    group: 'media' },
    { code: 0x00AD, id: 'KC_BRID',  label: '☀-',    group: 'media' },
    { code: 0x00AE, id: 'KC_CALC',  label: '🔢',     group: 'media',  desc: 'Calculator' },
    { code: 0x00AF, id: 'KC_MAIL',  label: '📧',     group: 'media' },
    { code: 0x00B0, id: 'KC_WHOM',  label: '🌐',     group: 'media',  desc: 'Browser home' },
    { code: 0x00B1, id: 'KC_WSCH',  label: '🔍',     group: 'media',  desc: 'Browser search' }
];

// ── System (Power, Sleep) ────────────────────────
const SYSTEM = [
    { code: 0x00A1, id: 'KC_PWR',   label: 'Pwr',   group: 'system' },
    { code: 0x00A2, id: 'KC_SLEP',  label: 'Sleep', group: 'system' },
    { code: 0x00A3, id: 'KC_WAKE',  label: 'Wake',  group: 'system' }
];

// ── Mouse keys ───────────────────────────────────
const MOUSE = [
    { code: 0x00CD, id: 'KC_MS_U',  label: 'M↑',    group: 'mouse' },
    { code: 0x00CE, id: 'KC_MS_D',  label: 'M↓',    group: 'mouse' },
    { code: 0x00CF, id: 'KC_MS_L',  label: 'M←',    group: 'mouse' },
    { code: 0x00D0, id: 'KC_MS_R',  label: 'M→',    group: 'mouse' },
    { code: 0x00D1, id: 'KC_BTN1',  label: 'M1',    group: 'mouse' },
    { code: 0x00D2, id: 'KC_BTN2',  label: 'M2',    group: 'mouse' },
    { code: 0x00D3, id: 'KC_BTN3',  label: 'M3',    group: 'mouse' },
    { code: 0x00D4, id: 'KC_BTN4',  label: 'M4',    group: 'mouse' },
    { code: 0x00D5, id: 'KC_BTN5',  label: 'M5',    group: 'mouse' },
    { code: 0x00D6, id: 'KC_WH_U',  label: 'Wh↑',   group: 'mouse' },
    { code: 0x00D7, id: 'KC_WH_D',  label: 'Wh↓',   group: 'mouse' }
];

// ── Layer ops (0x5100..0x52FF VIA range) ─────────
// MO(layer) = momentary, TG(layer) = toggle, TO(layer) = goto, OSL(layer) = one-shot
// VIA は MO=0x5100..0x510F, TG=0x5300..0x530F, TO=0x5200..0x520F
function layerCode(base, layer) { return base + layer; }
const LAYER_OPS = [];
for (let i = 0; i < 4; i++) {
    LAYER_OPS.push({ code: layerCode(0x5100, i), id: `MO(${i})`, label: `MO ${i}`, group: 'layer',
        desc: `Hold for layer ${i}`, isLayerOp: true, layerOp: 'MO', layer: i });
    LAYER_OPS.push({ code: layerCode(0x5200, i), id: `TO(${i})`, label: `TO ${i}`, group: 'layer',
        desc: `Goto layer ${i}`, isLayerOp: true, layerOp: 'TO', layer: i });
    LAYER_OPS.push({ code: layerCode(0x5300, i), id: `TG(${i})`, label: `TG ${i}`, group: 'layer',
        desc: `Toggle layer ${i}`, isLayerOp: true, layerOp: 'TG', layer: i });
    LAYER_OPS.push({ code: layerCode(0x5400, i), id: `OSL(${i})`, label: `OSL ${i}`, group: 'layer',
        desc: `One-shot layer ${i}`, isLayerOp: true, layerOp: 'OSL', layer: i });
}

// ── Macros (0x5F12..0x5F2B = M0..M15) ─────────────
const MACROS = Array.from({ length: 16 }, (_, i) => ({
    code: 0x5F12 + i, id: `MACRO_${i}`, label: `M${i}`, group: 'macro',
    desc: `Macro slot ${i}`, isMacro: true, macroIndex: i
}));

// ── Lighting controls (VIA QK_BACKLIGHT / RGB) ───
const LIGHTING = [
    { code: 0x5C78, id: 'BL_TOGG', label: 'BL🌙',  group: 'lighting', desc: 'Backlight toggle' },
    { code: 0x5C79, id: 'BL_STEP', label: 'BL+',   group: 'lighting', desc: 'Cycle brightness' },
    { code: 0x5C7A, id: 'BL_ON',   label: 'BL ON', group: 'lighting' },
    { code: 0x5C7B, id: 'BL_OFF',  label: 'BL Off',group: 'lighting' },
    { code: 0x5CA8, id: 'RGB_TOG', label: 'RGB',   group: 'lighting', desc: 'RGB toggle' },
    { code: 0x5CA9, id: 'RGB_MOD', label: 'Mode+', group: 'lighting' },
    { code: 0x5CAA, id: 'RGB_HUI', label: 'Hue+',  group: 'lighting' },
    { code: 0x5CAB, id: 'RGB_HUD', label: 'Hue-',  group: 'lighting' },
    { code: 0x5CAC, id: 'RGB_SAI', label: 'Sat+',  group: 'lighting' },
    { code: 0x5CAD, id: 'RGB_SAD', label: 'Sat-',  group: 'lighting' },
    { code: 0x5CAE, id: 'RGB_VAI', label: 'Br+',   group: 'lighting' },
    { code: 0x5CAF, id: 'RGB_VAD', label: 'Br-',   group: 'lighting' },
    { code: 0x5CB0, id: 'RGB_SPI', label: 'Spd+',  group: 'lighting' },
    { code: 0x5CB1, id: 'RGB_SPD', label: 'Spd-',  group: 'lighting' }
];

// ── Special: Reset / Caps Word / etc ─────────────
const SPECIAL = [
    { code: 0x5C00, id: 'QK_BOOT',     label: 'Boot',  group: 'special', desc: 'Bootloader' },
    { code: 0x5C01, id: 'QK_REBOOT',   label: 'Reset', group: 'special' },
    { code: 0x5C02, id: 'QK_DEBUG',    label: 'Dbg',   group: 'special' },
    { code: 0x7C73, id: 'QK_CAPS_WORD',label: 'CW',    group: 'special', desc: 'Caps word' },
    { code: 0x7C74, id: 'QK_LOCK',     label: 'Lock',  group: 'special' }
];

// ── Aggregated DB ───────────────────────────────
export const KEYCODES = Object.freeze([
    ...BASIC, ...FN, ...NAV, ...NUMPAD, ...MODS, ...MEDIA, ...SYSTEM, ...MOUSE,
    ...LAYER_OPS, ...MACROS, ...LIGHTING, ...SPECIAL
]);

const _byCode = new Map(KEYCODES.map(k => [k.code, k]));
const _byId   = new Map(KEYCODES.map(k => [k.id, k]));

export function getKeycode(code) {
    if (typeof code === 'string') return _byId.get(code) || _byCode.get(parseInt(code));
    return _byCode.get(code) || null;
}
export function getKeycodeById(id) {
    return _byId.get(id) || null;
}

/**
 * Group ごとに整理して返す。UI のピッカー用。
 */
export function listByGroup(group) {
    return KEYCODES.filter(k => k.group === group);
}

/**
 * 部分文字列でフィルタ。"alt" → KC_LALT, KC_RALT を返す。
 */
export function searchKeycodes(query) {
    const q = String(query || '').toLowerCase();
    if (!q) return KEYCODES.slice();
    return KEYCODES.filter(k =>
        k.id.toLowerCase().includes(q) ||
        (k.label || '').toLowerCase().includes(q) ||
        (k.desc || '').toLowerCase().includes(q)
    );
}

/**
 * VIA 形式 1 ワード (16 bit) を受け取って人間可読ラベルを返す。
 */
export function formatKeycode(code) {
    const k = _byCode.get(code);
    if (k) return k.label || k.id;
    if (code >= 0x5100 && code <= 0x510F) return `MO ${code & 0xF}`;
    if (code >= 0x5200 && code <= 0x520F) return `TO ${code & 0xF}`;
    if (code >= 0x5300 && code <= 0x530F) return `TG ${code & 0xF}`;
    if (code >= 0x5400 && code <= 0x540F) return `OSL ${code & 0xF}`;
    if (code >= 0x5F12 && code <= 0x5F21) return `M${code - 0x5F12}`;
    return `0x${code.toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * 16-bit VIA wire format → bytes (high, low).
 */
export function keycodeToBytes(code) {
    return [(code >> 8) & 0xFF, code & 0xFF];
}
export function bytesToKeycode(hi, lo) {
    return ((hi & 0xFF) << 8) | (lo & 0xFF);
}

export default KEYCODES;
