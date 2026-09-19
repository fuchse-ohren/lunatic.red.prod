// =============================================
// KeybordStudio V1 - Keymap Studio shared constants
// modules/keymap/keymap-constants.js
// =============================================

export const LAYER_COUNT = 4;            // VIA standard
export const MAX_MACROS = 16;
export const MAX_MACRO_LENGTH = 256;     // 1 macro = 256 bytes

// VIA HID protocol command IDs (subset of commonly used ops)
export const VIA_CMD = Object.freeze({
    GET_PROTOCOL_VERSION: 0x01,
    GET_KEYBOARD_VALUE:   0x02,
    SET_KEYBOARD_VALUE:   0x03,
    DYNAMIC_KEYMAP_GET_KEYCODE: 0x04,
    DYNAMIC_KEYMAP_SET_KEYCODE: 0x05,
    DYNAMIC_KEYMAP_RESET: 0x06,
    DYNAMIC_KEYMAP_GET_LAYER_COUNT: 0x11,
    DYNAMIC_KEYMAP_GET_BUFFER:    0x12,
    DYNAMIC_KEYMAP_SET_BUFFER:    0x13,
    DYNAMIC_KEYMAP_MACRO_GET_COUNT:        0x0C,
    DYNAMIC_KEYMAP_MACRO_GET_BUFFER_SIZE:  0x0D,
    DYNAMIC_KEYMAP_MACRO_GET_BUFFER:       0x0E,
    DYNAMIC_KEYMAP_MACRO_SET_BUFFER:       0x0F,
    DYNAMIC_KEYMAP_MACRO_RESET:            0x10,
    LIGHTING_SET_VALUE: 0x07,
    LIGHTING_GET_VALUE: 0x08,
    LIGHTING_SAVE:      0x09
});

// LED animation modes (VIA / QMK names)
export const LED_MODES = Object.freeze([
    { id: 'off',          name: 'Off',           code: 0 },
    { id: 'solid',        name: 'Solid',         code: 1 },
    { id: 'breathing',    name: 'Breathing',     code: 2 },
    { id: 'rainbow',      name: 'Rainbow',       code: 3 },
    { id: 'rainbow_swirl',name: 'Rainbow Swirl', code: 4 },
    { id: 'rainbow_wave', name: 'Rainbow Wave',  code: 5 },
    { id: 'cycle',        name: 'Cycle Hue',     code: 6 },
    { id: 'reactive',     name: 'Reactive',      code: 7 },
    { id: 'ripple',       name: 'Ripple',        code: 8 },
    { id: 'splash',       name: 'Splash',        code: 9 },
    { id: 'static_gradient', name: 'Gradient',   code: 10 },
    { id: 'per_key',      name: 'Per-key Custom',code: 11 }
]);

// Macro action types
export const MACRO_ACTION = Object.freeze({
    TAP:    'tap',
    DOWN:   'down',
    UP:     'up',
    DELAY:  'delay',
    TEXT:   'text'
});

// 標準的な VIA-compatible キーボード VID/PID 一部
// (UI 上の "Connect" ダイアログでフィルタとして使う)
export const KNOWN_VIA_DEVICES = Object.freeze([
    { vendorId: 0xFEED }, // QMK 標準
    { vendorId: 0x4653 }, // FocalKeys / VIA reference
    { vendorId: 0x05AC }, // (Some Apple-claimed boards)
    { vendorId: 0x594D }, // Glorious
    { vendorId: 0x320F }, // Razer-ish (allows generic HID)
    { vendorId: 0x0CF1 }  // Akko / Various
]);

export const VIA_USAGE_PAGE = 0xFF60;
export const VIA_USAGE      = 0x61;

// Default RGB color presets (Razer Synapse-like palette)
export const RGB_PRESETS = Object.freeze([
    { name: 'Red',     hex: '#ff0033' },
    { name: 'Orange',  hex: '#ff7a00' },
    { name: 'Yellow',  hex: '#ffd400' },
    { name: 'Green',   hex: '#00d36a' },
    { name: 'Cyan',    hex: '#00d4d4' },
    { name: 'Blue',    hex: '#0066ff' },
    { name: 'Purple',  hex: '#8a2be2' },
    { name: 'Pink',    hex: '#ff37c7' },
    { name: 'White',   hex: '#ffffff' },
    { name: 'Razer',   hex: '#44d62c' }
]);

export const DEFAULT_LED_BRIGHTNESS = 200;   // 0-255
export const DEFAULT_LED_SPEED = 128;
