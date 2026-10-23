// =============================================
// KeybordStudio V1 - PCB Studio footprint library
// modules/pcb/pcb-footprints.js
// =============================================
// Footprint geometry for switches, diodes, USB connectors, MCU modules,
// LEDs and mechanical holes. All coordinates in millimeters, top view,
// origin at component center. Pad layer codes match `pcb-constants.js`.
//
// Each footprint has the shape:
//   {
//     id, name, type,
//     pads: [{ name, x, y, drill, padW, padH, layer, shape, plated }],
//     outline:    [{x,y}, ...],            // F.Fab body outline
//     silkscreen: [{ type, ... }],         // F.SilkS markings
//     bbox:       { w, h, depth, color },  // 3D preview marker
//     courtyard:  { w, h }                 // for collision check
//   }
//
// References (no external browsing required):
//   - KiCad keyswitch-kicad-library (Cherry MX, Choc, Kailh hotswap)
//   - Marbastlib MX/Choc footprints (diode pads)
//   - JLCPCB / EasyEDA SMD pad sizing recommendations
//   - Sparkfun Pro Micro / nice!nano pinout tables

import { LAYERS, DRILL_SIZES } from './pcb-constants.js';

// ── Internal helpers ─────────────────────────────
function pad(name, x, y, opts = {}) {
    return {
        name: String(name),
        x, y,
        drill: opts.drill ?? 0,
        padW:  opts.padW  ?? 1.6,
        padH:  opts.padH  ?? 1.6,
        layer: opts.layer ?? (opts.drill ? 'THT' : LAYERS.F_CU),
        shape: opts.shape ?? (opts.drill ? 'circle' : 'rect'),
        plated: opts.plated ?? (opts.drill ? true : true)
    };
}
function npth(name, x, y, drill) {
    return {
        name: String(name), x, y, drill,
        padW: drill, padH: drill, layer: 'NPTH',
        shape: 'circle', plated: false
    };
}
function rectOutline(w, h) {
    const hw = w / 2, hh = h / 2;
    return [
        { x: -hw, y: -hh }, { x:  hw, y: -hh },
        { x:  hw, y:  hh }, { x: -hw, y:  hh },
        { x: -hw, y: -hh }
    ];
}
function silkLine(x1, y1, x2, y2) {
    return { type: 'line', x1, y1, x2, y2, width: 0.12, layer: LAYERS.F_SILK };
}
function silkCircle(cx, cy, r) {
    return { type: 'circle', cx, cy, r, width: 0.12, layer: LAYERS.F_SILK };
}
function silkText(x, y, text, size = 1.0) {
    return { type: 'text', x, y, text, size, layer: LAYERS.F_SILK };
}

// ── Switches ────────────────────────────────────

// Cherry MX 5-pin PCB-mount (THT). Reference: KiCad keyswitch lib.
const MX_PCB = {
    id: 'mx-pcb',
    name: 'Cherry MX (PCB mount, 5-pin)',
    type: 'switch',
    pads: [
        // Switch contacts (THT pins)
        pad('1',  3.81, -2.54, { drill: DRILL_SIZES.SWITCH_PIN, padW: 2.5, padH: 2.5, shape: 'circle' }),
        pad('2', -3.81, -5.08, { drill: DRILL_SIZES.SWITCH_PIN, padW: 2.5, padH: 2.5, shape: 'circle' }),
        // Center post (NPTH 4mm — note: spec says 4mm; allow caller to override)
        npth('CTR', 0, 0, 4.0),
        // Mount posts (NPTH 1.7mm)
        npth('MP1', -5.08, 0, 1.7),
        npth('MP2',  5.08, 0, 1.7)
    ],
    outline: rectOutline(14, 14),
    silkscreen: [
        silkLine(-7, -7,  7, -7), silkLine( 7, -7,  7,  7),
        silkLine( 7,  7, -7,  7), silkLine(-7,  7, -7, -7),
        silkText(0, -8.5, 'SW')
    ],
    bbox: { w: 14, h: 14, depth: 5, color: '#222222' },
    courtyard: { w: 15, h: 15 }
};

// Kailh MX hotswap socket (Marbastlib style).
// SMD pads are off the main body to one side; compensated for top-view mirror.
const MX_HOTSWAP = {
    id: 'mx-hotswap',
    name: 'Kailh MX hotswap socket',
    type: 'switch',
    pads: [
        // SMD socket pads (B.Cu — sockets mount on bottom)
        pad('1',  3.275, -5.05, { padW: 3.0, padH: 3.5, shape: 'oval', layer: LAYERS.B_CU }),
        pad('2', -5.85,  -3.80, { padW: 3.0, padH: 3.5, shape: 'oval', layer: LAYERS.B_CU }),
        // Through holes for switch pins (still needed for pin alignment)
        pad('1H',  3.81, -2.54, { drill: 3.0, padW: 3.0, padH: 3.0, shape: 'circle' }),
        pad('2H', -3.81, -5.08, { drill: 3.0, padW: 3.0, padH: 3.0, shape: 'circle' }),
        // NPTH posts
        npth('CTR', 0, 0, 4.0),
        npth('MP1', -5.08, 0, 1.7),
        npth('MP2',  5.08, 0, 1.7)
    ],
    outline: rectOutline(14, 14),
    silkscreen: [
        silkLine(-7, -7,  7, -7), silkLine(7, -7, 7, 7),
        silkLine( 7,  7, -7,  7), silkLine(-7, 7, -7, -7),
        silkText(0, -8.5, 'HS')
    ],
    bbox: { w: 14, h: 14, depth: 5, color: '#1a1a1a' },
    courtyard: { w: 16, h: 16 }
};

// Kailh Choc V1 (low-profile)
const CHOC = {
    id: 'choc',
    name: 'Kailh Choc V1 (THT)',
    type: 'switch',
    pads: [
        pad('1', -5.0, -3.8, { drill: 1.2, padW: 2.2, padH: 2.2, shape: 'circle' }),
        pad('2',  0.0, -5.9, { drill: 1.2, padW: 2.2, padH: 2.2, shape: 'circle' }),
        npth('CTR', 0, 0, 3.4),
        npth('MP1', -5.5, 0, 1.9),
        npth('MP2',  5.5, 0, 1.9)
    ],
    outline: rectOutline(13.8, 13.8),
    silkscreen: [
        silkLine(-6.9, -6.9,  6.9, -6.9), silkLine(6.9, -6.9, 6.9, 6.9),
        silkLine( 6.9,  6.9, -6.9,  6.9), silkLine(-6.9, 6.9, -6.9, -6.9),
        silkText(0, -8.0, 'CH')
    ],
    bbox: { w: 13.8, h: 13.8, depth: 3.5, color: '#222222' },
    courtyard: { w: 15, h: 15 }
};

// Kailh Choc hotswap socket
const CHOC_HOTSWAP = {
    id: 'choc-hotswap',
    name: 'Kailh Choc hotswap socket',
    type: 'switch',
    pads: [
        pad('1', -3.5, -6.7, { padW: 2.6, padH: 2.6, shape: 'oval', layer: LAYERS.B_CU }),
        pad('2',  2.5, -6.7, { padW: 2.6, padH: 2.6, shape: 'oval', layer: LAYERS.B_CU }),
        pad('1H', -5.0, -3.8, { drill: 2.4, padW: 2.4, padH: 2.4, shape: 'circle' }),
        pad('2H',  0.0, -5.9, { drill: 2.4, padW: 2.4, padH: 2.4, shape: 'circle' }),
        npth('CTR', 0, 0, 3.4),
        npth('MP1', -5.5, 0, 1.9),
        npth('MP2',  5.5, 0, 1.9)
    ],
    outline: rectOutline(14, 14),
    silkscreen: [
        silkLine(-7, -7,  7, -7), silkLine(7, -7, 7, 7),
        silkLine( 7,  7, -7,  7), silkLine(-7, 7, -7, -7),
        silkText(0, -8.5, 'CHS')
    ],
    bbox: { w: 14, h: 14, depth: 3.5, color: '#1a1a1a' },
    courtyard: { w: 16, h: 16 }
};

// ALPS / Matias mount (simplified — 2 contacts + 2 mount posts)
const ALPS = {
    id: 'alps',
    name: 'ALPS / Matias',
    type: 'switch',
    pads: [
        pad('1', -2.5,  4.5, { drill: 1.5, padW: 2.5, padH: 2.5, shape: 'circle' }),
        pad('2',  2.5,  4.5, { drill: 1.5, padW: 2.5, padH: 2.5, shape: 'circle' }),
        npth('MP1', -6.35, 0, 1.7),
        npth('MP2',  6.35, 0, 1.7)
    ],
    outline: rectOutline(14, 14),
    silkscreen: [silkText(0, -8.5, 'ALPS')],
    bbox: { w: 14, h: 14, depth: 5.0, color: '#aaaaaa' },
    courtyard: { w: 15, h: 15 }
};

// Topre (simplified single-pad placeholder)
const TOPRE = {
    id: 'topre',
    name: 'Topre (simplified)',
    type: 'switch',
    pads: [
        pad('1', 0, 0, { padW: 8, padH: 8, shape: 'circle' })
    ],
    outline: rectOutline(15, 15),
    silkscreen: [silkText(0, -8.5, 'TOPRE')],
    bbox: { w: 15, h: 15, depth: 4, color: '#dddddd' },
    courtyard: { w: 16, h: 16 }
};

// ── Diodes ──────────────────────────────────────

const DIODE_SOD123 = {
    id: 'sod-123',
    name: 'Diode SOD-123 (1N4148W)',
    type: 'diode',
    pads: [
        pad('K', -1.65, 0, { padW: 1.2, padH: 1.2, shape: 'rect' }),  // cathode
        pad('A',  1.65, 0, { padW: 1.2, padH: 1.2, shape: 'rect' })   // anode
    ],
    outline: rectOutline(3.4, 1.6),
    silkscreen: [
        silkLine(-0.85, -0.9, -0.85, 0.9),  // cathode bar
        silkText(0, -1.6, 'D', 0.7)
    ],
    bbox: { w: 3.4, h: 1.6, depth: 1.0, color: '#202020' },
    courtyard: { w: 4.0, h: 2.4 }
};

const DIODE_SOD323 = {
    id: 'sod-323',
    name: 'Diode SOD-323',
    type: 'diode',
    pads: [
        pad('K', -1.30, 0, { padW: 1.0, padH: 1.2, shape: 'rect' }),
        pad('A',  1.30, 0, { padW: 1.0, padH: 1.2, shape: 'rect' })
    ],
    outline: rectOutline(2.6, 1.4),
    silkscreen: [
        silkLine(-0.65, -0.7, -0.65, 0.7),
        silkText(0, -1.3, 'D', 0.6)
    ],
    bbox: { w: 2.6, h: 1.4, depth: 1.0, color: '#202020' },
    courtyard: { w: 3.2, h: 2.0 }
};

const DIODE_THT = {
    id: 'tht-1n4148',
    name: 'Diode 1N4148 (THT)',
    type: 'diode',
    pads: [
        pad('K', -3.81, 0, { drill: DRILL_SIZES.DIODE_LEAD, padW: 1.6, padH: 1.6, shape: 'circle' }),
        pad('A',  3.81, 0, { drill: DRILL_SIZES.DIODE_LEAD, padW: 1.6, padH: 1.6, shape: 'circle' })
    ],
    outline: rectOutline(7.0, 2.5),
    silkscreen: [
        silkLine(-1.5, -1.0, -1.5, 1.0),
        silkText(0, -2.0, 'D', 0.7)
    ],
    bbox: { w: 7.0, h: 2.5, depth: 2.0, color: '#202020' },
    courtyard: { w: 8.0, h: 3.0 }
};

// ── USB ──────────────────────────────────────────

// Simplified USB-C 12-pin (TYPE-C-31-M-12 style). Single sided 12 SMD pads at
// 0.5mm pitch + 4 NPTH mount tabs.
function buildUSB_C() {
    const pads = [];
    const labels = ['GND', 'TX1+', 'TX1-', 'VBUS', 'CC1', 'D+', 'D-', 'SBU1', 'VBUS2', 'RX2-', 'RX2+', 'GND2'];
    const pitch = 0.5;
    const padW = 0.30, padH = 1.20;
    const yPad = -2.20;  // signal row near front edge
    for (let i = 0; i < 12; i++) {
        const x = (i - 5.5) * pitch;
        pads.push(pad(labels[i], x, yPad, { padW, padH, shape: 'rect', layer: LAYERS.F_CU }));
    }
    // Mount tabs (NPTH)
    pads.push(npth('MT1', -3.20, -1.50, 0.7));
    pads.push(npth('MT2',  3.20, -1.50, 0.7));
    pads.push(npth('MT3', -3.20,  1.50, 0.7));
    pads.push(npth('MT4',  3.20,  1.50, 0.7));
    // Shield mount pads (large SMD)
    pads.push(pad('SHLD1', -4.32, 0, { padW: 1.2, padH: 1.8, shape: 'rect', layer: LAYERS.F_CU }));
    pads.push(pad('SHLD2',  4.32, 0, { padW: 1.2, padH: 1.8, shape: 'rect', layer: LAYERS.F_CU }));
    return pads;
}
const USB_C = {
    id: 'usb-c',
    name: 'USB-C 16-pin (TYPE-C-31-M-12)',
    type: 'usb',
    pads: buildUSB_C(),
    outline: rectOutline(7.4, 3.4),
    silkscreen: [
        silkLine(-3.7, -1.7,  3.7, -1.7),
        silkLine( 3.7, -1.7,  3.7,  1.7),
        silkLine( 3.7,  1.7, -3.7,  1.7),
        silkLine(-3.7,  1.7, -3.7, -1.7),
        silkText(0, 2.7, 'USB-C', 0.9)
    ],
    bbox: { w: 8.94, h: 7.35, depth: 3.26, color: '#888888' },
    courtyard: { w: 10, h: 9 }
};

// USB Mini-B (THT 5-pin)
const USB_MINI_B = {
    id: 'usb-mini-b',
    name: 'USB Mini-B (5-pin)',
    type: 'usb',
    pads: [
        pad('VBUS', -1.6, -1.0, { drill: DRILL_SIZES.USB_C_PIN, padW: 1.4, padH: 1.4, shape: 'circle' }),
        pad('D-',   -0.8, -1.0, { drill: DRILL_SIZES.USB_C_PIN, padW: 1.4, padH: 1.4, shape: 'circle' }),
        pad('D+',    0.0, -1.0, { drill: DRILL_SIZES.USB_C_PIN, padW: 1.4, padH: 1.4, shape: 'circle' }),
        pad('ID',    0.8, -1.0, { drill: DRILL_SIZES.USB_C_PIN, padW: 1.4, padH: 1.4, shape: 'circle' }),
        pad('GND',   1.6, -1.0, { drill: DRILL_SIZES.USB_C_PIN, padW: 1.4, padH: 1.4, shape: 'circle' }),
        npth('MT1', -3.5, 1.4, 1.0),
        npth('MT2',  3.5, 1.4, 1.0)
    ],
    outline: rectOutline(7.5, 4.0),
    silkscreen: [silkText(0, 3.0, 'USB-MINI', 0.8)],
    bbox: { w: 7.5, h: 9.0, depth: 4.0, color: '#666666' },
    courtyard: { w: 9, h: 11 }
};

// JST-PH 2.0mm pitch 2-pin (battery)
const JST_PH2 = {
    id: 'jst-ph-2',
    name: 'JST-PH 2-pin (battery)',
    type: 'connector',
    pads: [
        pad('1', -1.0, 0, { drill: DRILL_SIZES.PIN_HEADER, padW: 1.6, padH: 1.6, shape: 'circle' }),
        pad('2',  1.0, 0, { drill: DRILL_SIZES.PIN_HEADER, padW: 1.6, padH: 1.6, shape: 'circle' })
    ],
    outline: rectOutline(5.8, 4.5),
    silkscreen: [
        silkText(-1.0, 2.5, '+', 0.7),
        silkText( 1.0, 2.5, '-', 0.7)
    ],
    bbox: { w: 5.8, h: 4.5, depth: 6.0, color: '#ffffff' },
    courtyard: { w: 7, h: 6 }
};

// ── MCU modules ─────────────────────────────────

// Generic 2-row 0.1" header module footprint.
//   columns = total pin count / 2
//   pitch   = 2.54mm
//   row spacing = `rowSpacing` mm
function buildModulePads(labels, pitch = 2.54, rowSpacing = 15.24) {
    const half = labels.length / 2;
    const pads = [];
    // Left column (top half of label list)
    for (let i = 0; i < half; i++) {
        const y = (i - (half - 1) / 2) * pitch;
        pads.push(pad(labels[i], -rowSpacing / 2, y, {
            drill: DRILL_SIZES.PIN_HEADER, padW: 1.7, padH: 1.7, shape: 'circle'
        }));
    }
    // Right column (continues from end backwards, like a chip pinout)
    for (let i = 0; i < half; i++) {
        const y = ((half - 1 - i) - (half - 1) / 2) * pitch;
        pads.push(pad(labels[half + i], rowSpacing / 2, y, {
            drill: DRILL_SIZES.PIN_HEADER, padW: 1.7, padH: 1.7, shape: 'circle'
        }));
    }
    return pads;
}

// Sparkfun Pro Micro pinout (5 + 11 dual row → 24 pins / 12 per side).
// Standard label set (top→bottom on left edge, then top→bottom on right edge).
const PROMICRO_LABELS = [
    // Left column (12 pins, top to bottom)
    'TX0', 'RX1', 'GND', 'GND', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9',
    // Right column (12 pins, bottom to top in physical order)
    'D10', 'D16', 'D14', 'D15', 'D18', 'D19', 'D20', 'D21', 'VCC', 'RST', 'GND', 'RAW'
];
const PROMICRO = {
    id: 'promicro',
    name: 'Pro Micro (ATmega32u4)',
    type: 'mcu',
    pads: buildModulePads(PROMICRO_LABELS, 2.54, 15.24),
    outline: rectOutline(33.0, 17.78),
    silkscreen: [
        silkLine(-16.5, -8.89, 16.5, -8.89),
        silkLine( 16.5, -8.89, 16.5,  8.89),
        silkLine( 16.5,  8.89, -16.5,  8.89),
        silkLine(-16.5,  8.89, -16.5, -8.89),
        silkText(0, 0, 'PRO MICRO', 1.2)
    ],
    bbox: { w: 33.0, h: 17.78, depth: 4.0, color: '#0a4d2a' },
    courtyard: { w: 34, h: 19 }
};

// Elite-C: same 12×2 footprint, but USB-C and 5 extra side pads (B0,B1,B2,B3,D5alt).
// We model as Pro Micro pinout for routing; extra pads are not auto-routed.
const ELITEC_LABELS = [
    'TX0', 'RX1', 'GND', 'GND', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9',
    'D10', 'D16', 'D14', 'D15', 'D18', 'D19', 'D20', 'D21', 'VCC', 'RST', 'GND', 'RAW'
];
const ELITEC = {
    id: 'elite-c',
    name: 'Elite-C (USB-C Pro Micro compatible)',
    type: 'mcu',
    pads: buildModulePads(ELITEC_LABELS, 2.54, 15.24),
    outline: rectOutline(33.0, 18.30),
    silkscreen: [silkText(0, 0, 'ELITE-C', 1.2)],
    bbox: { w: 33.0, h: 18.30, depth: 4.0, color: '#0a4d2a' },
    courtyard: { w: 34, h: 19 }
};

// Liatris (RP2040): same Pro Micro pinout shape with extra rear pads simulated.
// We use the same 12x2 grid for routing, plus inner pads exposed as castellated.
const LIATRIS_LABELS = [
    'GP0', 'GP1', 'GND', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GP6', 'GP7', 'GP8', 'GP9',
    'GP10', 'GP16', 'GP14', 'GP15', 'GP18', 'GP19', 'GP20', 'GP21', 'VCC', 'RUN', 'GND', 'RAW'
];
const LIATRIS = {
    id: 'liatris',
    name: 'Liatris (RP2040)',
    type: 'mcu',
    pads: buildModulePads(LIATRIS_LABELS, 2.54, 15.24),
    outline: rectOutline(33.0, 17.78),
    silkscreen: [silkText(0, 0, 'LIATRIS', 1.0)],
    bbox: { w: 33.0, h: 17.78, depth: 3.5, color: '#1a1a1a' },
    courtyard: { w: 34, h: 19 }
};

// Helios (RP2040, similar but slightly larger)
const HELIOS = {
    id: 'helios',
    name: 'Helios (RP2040)',
    type: 'mcu',
    pads: buildModulePads(LIATRIS_LABELS, 2.54, 15.24),
    outline: rectOutline(33.0, 18.30),
    silkscreen: [silkText(0, 0, 'HELIOS', 1.0)],
    bbox: { w: 33.0, h: 18.30, depth: 3.5, color: '#1a1a1a' },
    courtyard: { w: 34, h: 19 }
};

// nice!nano BLE (Pro Micro footprint)
const NICENANO = {
    id: 'nice-nano',
    name: 'nice!nano (nRF52840 BLE)',
    type: 'mcu',
    pads: buildModulePads(PROMICRO_LABELS, 2.54, 15.24),
    outline: rectOutline(33.0, 18.0),
    silkscreen: [silkText(0, 0, 'NICE!NANO', 1.0)],
    bbox: { w: 33.0, h: 18.0, depth: 3.5, color: '#202020' },
    courtyard: { w: 34, h: 19 }
};

// ── LEDs ─────────────────────────────────────────

// SK6812 MINI-E (reverse mount addressable RGB)
const SK6812MINI_E = {
    id: 'sk6812mini-e',
    name: 'SK6812 MINI-E (reverse mount)',
    type: 'led',
    pads: [
        pad('VDD', -1.65,  0.85, { padW: 1.0, padH: 1.0, shape: 'rect', layer: LAYERS.B_CU }),
        pad('DO',   1.65,  0.85, { padW: 1.0, padH: 1.0, shape: 'rect', layer: LAYERS.B_CU }),
        pad('VSS',  1.65, -0.85, { padW: 1.0, padH: 1.0, shape: 'rect', layer: LAYERS.B_CU }),
        pad('DI',  -1.65, -0.85, { padW: 1.0, padH: 1.0, shape: 'rect', layer: LAYERS.B_CU })
    ],
    outline: rectOutline(3.5, 3.5),
    silkscreen: [
        silkText(-2.2, -1.5, '1', 0.6),
        silkText(0, -2.5, 'LED', 0.6)
    ],
    bbox: { w: 3.5, h: 3.5, depth: 1.6, color: '#fafafa' },
    courtyard: { w: 4.5, h: 4.5 }
};

// ── Mechanical ─────────────────────────────────

const MOUNT_HOLE_M2 = {
    id: 'mount-m2',
    name: 'Mount hole M2 (NPTH 2.2mm)',
    type: 'mech',
    pads: [
        // NPTH with masked annular ring for cosmetic
        {
            name: 'MH', x: 0, y: 0,
            drill: DRILL_SIZES.M2_CLEARANCE,
            padW: 4.0, padH: 4.0, layer: 'NPTH',
            shape: 'circle', plated: false,
            mask: [LAYERS.F_MASK, LAYERS.B_MASK]
        }
    ],
    outline: [],
    silkscreen: [silkCircle(0, 0, 2.2)],
    bbox: { w: 4.0, h: 4.0, depth: 0, color: '#888888' },
    courtyard: { w: 5, h: 5 }
};
const MOUNT_HOLE_M3 = {
    id: 'mount-m3',
    name: 'Mount hole M3 (NPTH 3.2mm)',
    type: 'mech',
    pads: [
        {
            name: 'MH', x: 0, y: 0,
            drill: DRILL_SIZES.M3_CLEARANCE,
            padW: 5.5, padH: 5.5, layer: 'NPTH',
            shape: 'circle', plated: false,
            mask: [LAYERS.F_MASK, LAYERS.B_MASK]
        }
    ],
    outline: [],
    silkscreen: [silkCircle(0, 0, 3.2)],
    bbox: { w: 5.5, h: 5.5, depth: 0, color: '#888888' },
    courtyard: { w: 6.5, h: 6.5 }
};

// ── Registry ────────────────────────────────────
export const FOOTPRINTS = Object.freeze({
    // switches
    'mx-pcb':        MX_PCB,
    'mx-hotswap':    MX_HOTSWAP,
    'choc':          CHOC,
    'choc-hotswap':  CHOC_HOTSWAP,
    'alps':          ALPS,
    'topre':         TOPRE,
    // diodes
    'sod-123':       DIODE_SOD123,
    'sod-323':       DIODE_SOD323,
    'tht-1n4148':    DIODE_THT,
    // usb / connectors
    'usb-c':         USB_C,
    'usb-mini-b':    USB_MINI_B,
    'jst-ph-2':      JST_PH2,
    // mcu
    'promicro':      PROMICRO,
    'elite-c':       ELITEC,
    'liatris':       LIATRIS,
    'helios':        HELIOS,
    'nice-nano':     NICENANO,
    // leds
    'sk6812mini-e':  SK6812MINI_E,
    // mechanical
    'mount-m2':      MOUNT_HOLE_M2,
    'mount-m3':      MOUNT_HOLE_M3
});

// ── Public API helpers ─────────────────────────
export function getFootprint(id) {
    return FOOTPRINTS[id] || null;
}
export function listFootprints() {
    return Object.values(FOOTPRINTS);
}
export function listSwitchFootprints() {
    return listFootprints().filter(f => f.type === 'switch');
}
export function listDiodeFootprints() {
    return listFootprints().filter(f => f.type === 'diode');
}
export function listUSBFootprints() {
    return listFootprints().filter(f => f.type === 'usb');
}
export function listMCUFootprints() {
    return listFootprints().filter(f => f.type === 'mcu');
}
export function listLEDFootprints() {
    return listFootprints().filter(f => f.type === 'led');
}
export function listMechFootprints() {
    return listFootprints().filter(f => f.type === 'mech');
}
export function findPad(footprint, padName) {
    if (!footprint) return null;
    return footprint.pads.find(p => p.name === String(padName)) || null;
}

// Apply rotation+translation to a pad to get its absolute world coordinate.
// rotation is in degrees, top-view counter-clockwise.
export function transformPad(footprint, padName, originX, originY, rotationDeg = 0) {
    const p = findPad(footprint, padName);
    if (!p) return null;
    const rad = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const x = originX + (p.x * cos - p.y * sin);
    const y = originY + (p.x * sin + p.y * cos);
    return { x, y, layer: p.layer, padName: p.name };
}

// Default footprint id by component type (used by the router when only the
// component-class type is known). Caller can override.
export const DEFAULT_FOOTPRINT_FOR_TYPE = Object.freeze({
    switch:    'mx-hotswap',
    diode:     'sod-123',
    usb:       'usb-c',
    mcu:       'promicro',
    led:       'sk6812mini-e',
    connector: 'jst-ph-2',
    mech:      'mount-m2'
});

export default FOOTPRINTS;
