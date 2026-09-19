// =============================================
// KeybordStudio V1 - PCB Studio shared constants
// modules/pcb/pcb-constants.js
// =============================================
// PCB 各モジュール (footprints / router / gerber / drill / bom / 3d) で共有する定数。
// 実機キーボード PCB の業界標準値に揃えてある。

// ── 単位 / 数値精度 ────────────────────────────
export const MM_PER_INCH = 25.4;
export const GERBER_DECIMALS = 6;       // Gerber 数値の小数桁 (4.6 形式)
export const GERBER_INTEGER_DIGITS = 4; // Gerber 数値の整数桁
export const DRILL_DECIMALS = 4;        // Excellon の小数桁

// ── PCB レイヤー ────────────────────────────────
export const LAYERS = Object.freeze({
    EDGE_CUTS: 'Edge.Cuts',
    F_CU:      'F.Cu',
    B_CU:      'B.Cu',
    F_MASK:    'F.Mask',
    B_MASK:    'B.Mask',
    F_SILK:    'F.SilkS',
    B_SILK:    'B.SilkS',
    F_PASTE:   'F.Paste',
    B_PASTE:   'B.Paste',
    F_FAB:     'F.Fab',
    B_FAB:     'B.Fab'
});

// ── 配線幅 / クリアランス (mm) ─────────────────────
export const TRACE_WIDTHS = Object.freeze({
    SIGNAL: 0.25,    // 通常信号 (キーマトリクス、I2C 等)
    POWER:  0.40,    // VCC / GND
    USB:    0.40,    // USB 差動対 (D+/D-)
    LED:    0.30     // LED チェイン (DI/DO)
});
export const CLEARANCES = Object.freeze({
    TRACE_TO_TRACE: 0.20,
    TRACE_TO_PAD:   0.20,
    EDGE:           0.30,    // 基板端から信号配線まで
    COPPER_TO_HOLE: 0.30
});

// ── ホール径 (mm) ──────────────────────────────
export const DRILL_SIZES = Object.freeze({
    M2_CLEARANCE:   2.20,    // M2 ネジ穴 (PTH/NPTH)
    M2_5_CLEARANCE: 2.70,
    M3_CLEARANCE:   3.20,
    SWITCH_PIN:     1.50,    // MX 軸ピン (THT)
    SWITCH_MOUNT:   3.00,    // MX 軸 中央位置決め
    DIODE_LEAD:     0.80,    // ダイオード THT リード
    PIN_HEADER:     1.00,    // ピンヘッダ
    USB_C_PIN:      0.65,    // USB-C コネクタピン
    VIA_DRILL:      0.30,    // ビア
    VIA_PAD:        0.60     // ビアパッド径
});

// ── 配線ネット名 ────────────────────────────────
export const NETS = Object.freeze({
    GND:   'GND',
    VCC:   'VCC',
    USB_DP: 'USB_DP',
    USB_DN: 'USB_DN',
    USB_5V: '+5V',
    RESET: 'RESET',
    RUN:   'RUN'
    // Row/Col は ROW0..N / COL0..M を runtime 生成
});

// ── 標準フットプリントタイプ ─────────────────────
export const SWITCH_TYPES = Object.freeze({
    MX:       'mx',           // Cherry MX 互換 (THT)
    MX_PCB:   'mx-pcb',       // PCB マウント (5pin)
    MX_HOTSWAP: 'mx-hotswap', // Kailh ホットスワップ
    CHOC:     'choc',         // Kailh Choc
    CHOC_HOTSWAP: 'choc-hotswap',
    ALPS:     'alps',
    TOPRE:    'topre'
});
export const DIODE_TYPES = Object.freeze({
    SOD123:   'sod-123',      // SMD (推奨)
    SOD323:   'sod-323',      // SMD (より小さい)
    THT:      'tht-1n4148'    // THT 1N4148
});
export const MCU_TYPES = Object.freeze({
    PROMICRO:   'promicro',     // ATmega32u4
    ELITEC:     'elite-c',      // USB-C 版 Pro Micro 互換
    RP2040_LIATRIS: 'liatris',  // RP2040
    RP2040_HELIOS:  'helios',
    NICENANO:   'nice-nano'     // BLE
});
export const USB_TYPES = Object.freeze({
    USB_C:    'usb-c',
    USB_MINI: 'usb-mini-b',
    USB_MICRO: 'usb-micro-b',
    JST_PH2:  'jst-ph-2'        // バッテリー
});

// ── PCB 板 / ビューワー ────────────────────────
export const PCB_THICKNESS = 1.6;      // 標準 1.6mm
export const PCB_THICKNESS_OPTIONS = [0.6, 0.8, 1.0, 1.2, 1.6, 2.0];
export const PCB_COLORS = Object.freeze({
    GREEN:    { name: 'Green',     hex: '#0a4d2a' },
    RED:      { name: 'Red',       hex: '#7a1a1a' },
    BLUE:     { name: 'Blue',      hex: '#1a3a7a' },
    BLACK:    { name: 'Black',     hex: '#1a1a1a' },
    WHITE:    { name: 'White',     hex: '#e8e8e8' },
    PURPLE:   { name: 'Purple',    hex: '#3a1a5a' },
    YELLOW:   { name: 'Yellow',    hex: '#7a6a1a' },
    MATTE_BLACK: { name: 'Matte Black', hex: '#0d0d0d' }
});

// ── レイアウトプリセット ─────────────────────────
// Layout Studio と同じ命名で 65/TKL/Full は Keycap Studio の KEYSET_LAYOUTS と
// 連携できるように合わせている。
export const PCB_LAYOUT_PRESETS = Object.freeze({
    '60-ansi':   { name: '60% ANSI',   widthU: 15,    heightU: 5 },
    '65-ansi':   { name: '65% ANSI',   widthU: 16,    heightU: 5 },
    'tkl-ansi':  { name: 'TKL ANSI',   widthU: 18.5,  heightU: 6.5 },
    'full-ansi': { name: 'Full ANSI',  widthU: 22.75, heightU: 6.5 },
    '40-ortho':  { name: '40% Ortho',  widthU: 12,    heightU: 4 },
    '60-jis':    { name: '60% JIS',    widthU: 15,    heightU: 5 },
    'macropad-3x3': { name: 'Macropad 3×3', widthU: 3, heightU: 3 }
});

// ── 配線パラメータ (router 用) ─────────────────
export const ROUTER_PARAMS = Object.freeze({
    BEND_RADIUS: 0.5,         // 配線屈曲時の半径 (45° に丸め込む)
    GRID:        0.05,        // ルーティンググリッド (mm)
    LAYER_FRONT: 'F.Cu',
    LAYER_BACK:  'B.Cu',
    VIA_USE_THRESHOLD: 1.0    // この距離を超える迂回はビアを使う
});
