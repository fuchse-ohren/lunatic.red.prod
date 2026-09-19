// =============================================
// KeybordStudio V1 - PCB Studio module
// modules/pcb/pcb-module.js
// =============================================
// 4 つ目の Studio。レイアウトを 1u グリッドで決めるだけで自動配線・
// 自動配置・自動 Gerber/Drill/BOM/CPL 出力までを行う。
//
// 主要関心:
//   1. UI からレイアウトプリセット (60-ansi 等) を選ばせる
//   2. ユーザーが MCU / USB / 機械穴 / カラー / 厚みを選ぶ
//   3. 配線 / フットプリント配置を 1 ボタンで自動生成
//   4. DRC を走らせて結果を表示
//   5. 3D プレビューを更新
//   6. JLCPCB 互換 ZIP をダウンロード
//
// 依存モジュール:
//   pcb-constants  : 共有定数
//   pcb-footprints : フットプリント DB
//   pcb-router     : 自動配線
//   pcb-gerber     : Gerber 出力
//   pcb-drill      : ドリル出力
//   pcb-bom        : BOM/CPL 出力
//   pcb-drc        : DRC
//   pcb-bundle     : ZIP まとめ
//   pcb-3d         : 3D プレビュー

import {
    LAYERS, PCB_COLORS, PCB_THICKNESS, PCB_THICKNESS_OPTIONS,
    PCB_LAYOUT_PRESETS, DRILL_SIZES, TRACE_WIDTHS, CLEARANCES
} from './pcb-constants.js';
import {
    FOOTPRINTS, getFootprint, listSwitchFootprints, listDiodeFootprints,
    listMCUFootprints, listUSBFootprints, DEFAULT_FOOTPRINT_FOR_TYPE,
    transformPad
} from './pcb-footprints.js';
import { routePCB, autoMcuPinmap, estimateTraceLengths } from './pcb-router.js';
import { generateAllGerbers } from './pcb-gerber.js';
import { generateAllDrills, extractHolesFromComponents, drillStats } from './pcb-drill.js';
import { generateAllBOM, assignDesignators, bomStats } from './pcb-bom.js';
import { runDRC, formatDRC, VENDOR_RULES } from './pcb-drc.js';
import { generateManufacturingBundle, downloadBundle } from './pcb-bundle.js';
import { PCBViewer3D } from './pcb-3d.js';

const MODULE_ID = 'pcb';
const MODULE_NAME = 'PCB Studio';

// ── i18n の最低限ラッパー (本格的な i18n は language/*/pcb.js 経由) ──
const _T = {
    en: {
        'pcb.title':       'PCB Studio',
        'pcb.layout':      'Layout preset',
        'pcb.boardSize':   'Board size',
        'pcb.color':       'Board color',
        'pcb.thickness':   'Thickness',
        'pcb.switch':      'Switch type',
        'pcb.diode':       'Diode',
        'pcb.mcu':         'Microcontroller',
        'pcb.usb':         'USB connector',
        'pcb.mountHoles':  'Mounting holes',
        'pcb.vendor':      'PCB vendor',
        'pcb.rows':        'Rows',
        'pcb.cols':        'Cols',
        'pcb.btn.generate': 'Auto-route PCB',
        'pcb.btn.drc':     'Run DRC',
        'pcb.btn.export':  'Export manufacturing ZIP',
        'pcb.btn.gerber':  'Gerber only',
        'pcb.btn.bom':     'BOM/CPL only',
        'pcb.section.layout': 'Layout',
        'pcb.section.parts':  'Parts',
        'pcb.section.board':  'Board',
        'pcb.section.export': 'Export',
        'pcb.drc.pass':    'DRC passed.',
        'pcb.drc.fail':    'DRC failed.',
        'pcb.zip.ready':   'Manufacturing ZIP ready.',
        'pcb.generated':   'PCB generated.'
    },
    ja: {
        'pcb.title':       'PCB Studio',
        'pcb.layout':      'レイアウト',
        'pcb.boardSize':   '基板サイズ',
        'pcb.color':       '基板色',
        'pcb.thickness':   '基板厚',
        'pcb.switch':      'スイッチ種類',
        'pcb.diode':       'ダイオード',
        'pcb.mcu':         'マイコン',
        'pcb.usb':         'USB コネクタ',
        'pcb.mountHoles':  '取付け穴',
        'pcb.vendor':      'PCB 業者',
        'pcb.rows':        '行 (Rows)',
        'pcb.cols':        '列 (Cols)',
        'pcb.btn.generate': '自動配線実行',
        'pcb.btn.drc':     'DRC 実行',
        'pcb.btn.export':  '発注 ZIP をダウンロード',
        'pcb.btn.gerber':  'Gerber のみ',
        'pcb.btn.bom':     'BOM/CPL のみ',
        'pcb.section.layout': 'レイアウト',
        'pcb.section.parts':  '部品',
        'pcb.section.board':  '基板',
        'pcb.section.export': '出力',
        'pcb.drc.pass':    'DRC 合格',
        'pcb.drc.fail':    'DRC 失格',
        'pcb.zip.ready':   '発注 ZIP を作成しました。',
        'pcb.generated':   'PCB を生成しました。'
    }
};
function t(key) {
    const lang = (currentLang === 'ja') ? 'ja' : 'en';
    return (_T[lang] && _T[lang][key]) || _T.en[key] || key;
}

// ── module-level shared refs ─────────────────
let THREE       = null;
let scene       = null;
let camera      = null;
let controls    = null;
let showToast   = (m) => console.log('[PCB]', m);
let currentLang = 'en';
let viewer3d    = null;
let sceneGroup  = null;

// ── State ──────────────────────────────────
const state = {
    layoutPreset: '60-ansi',
    rows: 5,
    cols: 15,
    boardWidth: 285.75,
    boardHeight: 95.25,
    boardCornerR: 1.5,
    boardThickness: PCB_THICKNESS,
    boardColor: PCB_COLORS.GREEN.hex,
    surfaceFinish: 'HASL (lead-free)',
    boardName: 'KeybordStudio_PCB',

    switchType: 'mx-hotswap',
    diodeType:  'sod-123',
    mcuType:    'promicro',
    usbType:    'usb-c',

    addMountHoles: true,
    mountHoleType: 'mount-m2',
    mountHoleCount: 4,

    vendor: 'jlcpcb',

    // 計算結果 (route 後に埋まる)
    components: [],
    traces: [],
    vias: [],
    nets: [],
    pours: [],
    holes: [],
    pads: [],
    silkscreen: [],

    drcResult: null,
    lastBundle: null
};

// ── Layout helpers ────────────────────────
const KEY_PITCH = 19.05;          // 1u = 19.05mm

/**
 * レイアウトプリセットからスイッチ位置を生成。
 * 簡易: 行/列均等分割 (実際の ANSI/JIS は将来 KEYSET_LAYOUTS を再利用)。
 */
function buildSwitchGrid(rows, cols, originX, originY, fpId) {
    const out = [];
    let id = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            out.push({
                id: `SW${++id}`,
                ref: `SW${id}`,
                x: originX + c * KEY_PITCH + KEY_PITCH / 2,
                y: originY + r * KEY_PITCH + KEY_PITCH / 2,
                rotation: 0,
                row: r,
                col: c,
                type: 'switch',
                footprintId: fpId,
                footprint: getFootprint(fpId),
                side: 'top'
            });
        }
    }
    return out;
}

function buildDiodes(switches, fpId) {
    return switches.map((sw, i) => ({
        id: `D${i + 1}`,
        ref: `D${i + 1}`,
        x: sw.x + 4.5,
        y: sw.y - 4.5,
        rotation: 90,
        type: 'diode',
        switchId: sw.id,
        footprintId: fpId,
        footprint: getFootprint(fpId),
        side: 'bottom'
    }));
}

function buildMCU(boardW, boardH, fpId) {
    const fp = getFootprint(fpId);
    if (!fp) return null;
    return {
        id: 'U1',
        ref: 'U1',
        x: boardW / 2,
        y: boardH - 12,
        rotation: 0,
        type: 'mcu',
        footprintId: fpId,
        footprint: fp,
        side: 'top'
    };
}

function buildUSB(boardW, boardH, fpId) {
    const fp = getFootprint(fpId);
    if (!fp) return null;
    return {
        id: 'J1',
        ref: 'J1',
        x: boardW / 2,
        y: boardH - 4,
        rotation: 180,
        type: 'usb',
        footprintId: fpId,
        footprint: fp,
        side: 'top'
    };
}

function buildMountHoles(boardW, boardH, count, fpId) {
    const fp = getFootprint(fpId);
    if (!fp) return [];
    const margin = 5;
    if (count === 4) {
        return [
            { x: margin,         y: margin,         footprintId: fpId, footprint: fp, type: 'mech', ref: 'H1' },
            { x: boardW-margin,  y: margin,         footprintId: fpId, footprint: fp, type: 'mech', ref: 'H2' },
            { x: margin,         y: boardH-margin,  footprintId: fpId, footprint: fp, type: 'mech', ref: 'H3' },
            { x: boardW-margin,  y: boardH-margin,  footprintId: fpId, footprint: fp, type: 'mech', ref: 'H4' }
        ];
    }
    if (count === 6) {
        return [
            { x: margin,         y: margin,         footprintId: fpId, footprint: fp, type: 'mech', ref: 'H1' },
            { x: boardW/2,       y: margin,         footprintId: fpId, footprint: fp, type: 'mech', ref: 'H2' },
            { x: boardW-margin,  y: margin,         footprintId: fpId, footprint: fp, type: 'mech', ref: 'H3' },
            { x: margin,         y: boardH-margin,  footprintId: fpId, footprint: fp, type: 'mech', ref: 'H4' },
            { x: boardW/2,       y: boardH-margin,  footprintId: fpId, footprint: fp, type: 'mech', ref: 'H5' },
            { x: boardW-margin,  y: boardH-margin,  footprintId: fpId, footprint: fp, type: 'mech', ref: 'H6' }
        ];
    }
    return [];
}

// ── Build pads/silk from components ────────
function expandComponentPads(components) {
    const pads = [];
    const silk = [];
    for (const c of components) {
        const fp = c.footprint;
        if (!fp) continue;
        const rad = (c.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        // pads
        for (const p of fp.pads) {
            if (p.layer === 'NPTH') continue;     // NPTH は drill のみ
            const x = c.x + (p.x * cos - p.y * sin);
            const y = c.y + (p.x * sin + p.y * cos);
            pads.push({
                ref: c.ref,
                padName: p.name,
                x, y,
                w: p.padW,
                h: p.padH,
                shape: p.shape,
                drill: p.drill,
                layer: (c.side === 'bottom' || c.side === 'B') ? LAYERS.B_CU : (p.layer || LAYERS.F_CU),
                rotation: c.rotation || 0,
                plated: p.plated
            });
        }
        // silkscreen lines/circles → world coords
        for (const s of fp.silkscreen || []) {
            const layer = (c.side === 'bottom') ? LAYERS.B_SILK : LAYERS.F_SILK;
            if (s.type === 'line') {
                silk.push({
                    type: 'line', layer,
                    x1: c.x + (s.x1 * cos - s.y1 * sin),
                    y1: c.y + (s.x1 * sin + s.y1 * cos),
                    x2: c.x + (s.x2 * cos - s.y2 * sin),
                    y2: c.y + (s.x2 * sin + s.y2 * cos),
                    width: s.width || 0.12
                });
            } else if (s.type === 'circle') {
                silk.push({
                    type: 'circle', layer,
                    cx: c.x + (s.cx * cos - s.cy * sin),
                    cy: c.y + (s.cx * sin + s.cy * cos),
                    r: s.r,
                    width: s.width || 0.12
                });
            }
        }
    }
    return { pads, silk };
}

// ── Compute board size from grid ──────────
function computeBoardFromGrid(rows, cols) {
    const margin = 5;
    return {
        width:  cols * KEY_PITCH + margin * 2,
        height: rows * KEY_PITCH + margin * 2 + 12     // +12 for MCU/USB row
    };
}

// ── Main "auto-generate" pipeline ──────────
export function autoGeneratePCB() {
    const margin = 5;
    const switches = buildSwitchGrid(state.rows, state.cols, margin, margin, state.switchType);
    const diodes   = buildDiodes(switches, state.diodeType);
    const board    = computeBoardFromGrid(state.rows, state.cols);
    state.boardWidth  = board.width;
    state.boardHeight = board.height;
    const mcu = buildMCU(board.width, board.height, state.mcuType);
    const usb = buildUSB(board.width, board.height, state.usbType);
    const mountHoles = state.addMountHoles
        ? buildMountHoles(board.width, board.height, state.mountHoleCount, state.mountHoleType)
        : [];

    // assign refs/designators
    const allComponents = assignDesignators([
        ...switches, ...diodes,
        ...(mcu ? [mcu] : []),
        ...(usb ? [usb] : []),
        ...mountHoles
    ]);

    // Run router
    const routeResult = routePCB({
        switches: allComponents.filter(c => c.type === 'switch'),
        diodes:   allComponents.filter(c => c.type === 'diode'),
        mcu:      allComponents.find(c => c.type === 'mcu'),
        usb:      allComponents.find(c => c.type === 'usb'),
        mountHoles: allComponents.filter(c => c.type === 'mech'),
        rows: state.rows,
        cols: state.cols,
        options: {
            addGroundPour: true,
            traceWidth: TRACE_WIDTHS.SIGNAL,
            powerWidth: TRACE_WIDTHS.POWER,
            usbWidth:   TRACE_WIDTHS.USB
        }
    });

    // Expand pads/silk from footprints
    const { pads, silk } = expandComponentPads(allComponents);
    const holes = extractHolesFromComponents(allComponents);

    // Update state
    state.components = allComponents;
    state.traces     = routeResult.traces;
    state.vias       = routeResult.vias;
    state.nets       = routeResult.nets;
    state.pours      = routeResult.pours;
    state.pads       = pads;
    state.silkscreen = silk;
    state.holes      = holes;

    showToast(t('pcb.generated'));
    update3D();
    return routeResult;
}

// ── DRC ────────────────────────────────────
export function runDRCOnState() {
    const result = runDRC(buildPcbDataForExport(), { vendor: state.vendor });
    state.drcResult = result;
    showToast(result.ok ? t('pcb.drc.pass') : t('pcb.drc.fail'));
    return result;
}

// ── Export pipeline ────────────────────────
function buildPcbDataForExport() {
    // Layers data for Gerber. Keep separate arrays per layer so Gerber writer
    // sees lines/pads grouped neatly.
    const layers = {};
    const ensure = (name) => {
        if (!layers[name]) layers[name] = { pads: [], traces: [], lines: [], texts: [], polygons: [] };
        return layers[name];
    };

    // Edge.Cuts: rectangle outline approximated as 4 lines (corner radius
    // rendered by gerber.rectOutline at file generation time would be ideal —
    // we generate a simple closed polygon here for now).
    const ec = ensure(LAYERS.EDGE_CUTS);
    const w = state.boardWidth, h = state.boardHeight, r = state.boardCornerR;
    if (r > 0) {
        ec.lines.push({ x1: r,     y1: 0,     x2: w - r, y2: 0,     width: 0.10 });
        ec.lines.push({ x1: w,     y1: r,     x2: w,     y2: h - r, width: 0.10 });
        ec.lines.push({ x1: w - r, y1: h,     x2: r,     y2: h,     width: 0.10 });
        ec.lines.push({ x1: 0,     y1: h - r, x2: 0,     y2: r,     width: 0.10 });
        const segs = 8;
        const corners = [
            { cx: r,     cy: r,     a0: Math.PI,        a1: Math.PI * 1.5 },
            { cx: w - r, cy: r,     a0: Math.PI * 1.5,  a1: Math.PI * 2 },
            { cx: w - r, cy: h - r, a0: 0,              a1: Math.PI * 0.5 },
            { cx: r,     cy: h - r, a0: Math.PI * 0.5,  a1: Math.PI }
        ];
        for (const c of corners) {
            let prev = { x: c.cx + Math.cos(c.a0) * r, y: c.cy + Math.sin(c.a0) * r };
            for (let i = 1; i <= segs; i++) {
                const a = c.a0 + (c.a1 - c.a0) * (i / segs);
                const cur = { x: c.cx + Math.cos(a) * r, y: c.cy + Math.sin(a) * r };
                ec.lines.push({ x1: prev.x, y1: prev.y, x2: cur.x, y2: cur.y, width: 0.10 });
                prev = cur;
            }
        }
    } else {
        ec.lines.push({ x1: 0, y1: 0, x2: w, y2: 0, width: 0.10 });
        ec.lines.push({ x1: w, y1: 0, x2: w, y2: h, width: 0.10 });
        ec.lines.push({ x1: w, y1: h, x2: 0, y2: h, width: 0.10 });
        ec.lines.push({ x1: 0, y1: h, x2: 0, y2: 0, width: 0.10 });
    }

    // Copper traces
    for (const t of state.traces) {
        const layer = ensure(t.layer);
        const pts = t.points || [];
        for (let i = 1; i < pts.length; i++) {
            layer.lines.push({
                x1: pts[i-1].x, y1: pts[i-1].y,
                x2: pts[i].x,   y2: pts[i].y,
                width: t.width
            });
        }
    }

    // Pads
    for (const p of state.pads) {
        const layer = ensure(p.layer);
        layer.pads.push({
            x: p.x, y: p.y, w: p.w, h: p.h,
            shape: p.shape || 'rect',
            rotation: p.rotation || 0
        });
        // also render mask opening
        const maskName = (p.layer === LAYERS.B_CU) ? LAYERS.B_MASK : LAYERS.F_MASK;
        ensure(maskName).pads.push({
            x: p.x, y: p.y,
            w: p.w + 0.1, h: p.h + 0.1,         // 0.05mm margin per side
            shape: p.shape || 'rect',
            rotation: p.rotation || 0
        });
    }

    // Vias as small circles on F.Cu and B.Cu
    for (const v of state.vias) {
        const padW = (v.padDiameter ?? DRILL_SIZES.VIA_PAD);
        ensure(LAYERS.F_CU).pads.push({ x: v.x, y: v.y, w: padW, h: padW, shape: 'circle' });
        ensure(LAYERS.B_CU).pads.push({ x: v.x, y: v.y, w: padW, h: padW, shape: 'circle' });
    }

    // Silkscreen
    for (const s of state.silkscreen) {
        const layer = ensure(s.layer);
        if (s.type === 'line') {
            layer.lines.push({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, width: s.width || 0.12 });
        } else if (s.type === 'circle') {
            // approximate circle as 24-segment poly
            const segs = 24;
            for (let i = 0; i < segs; i++) {
                const a1 = (i / segs) * Math.PI * 2;
                const a2 = ((i + 1) / segs) * Math.PI * 2;
                layer.lines.push({
                    x1: s.cx + Math.cos(a1) * s.r,
                    y1: s.cy + Math.sin(a1) * s.r,
                    x2: s.cx + Math.cos(a2) * s.r,
                    y2: s.cy + Math.sin(a2) * s.r,
                    width: s.width || 0.12
                });
            }
        }
    }

    return {
        meta: {
            boardName: state.boardName,
            thickness: state.boardThickness,
            color:     colorNameFromHex(state.boardColor),
            surfaceFinish: state.surfaceFinish,
            minTrace:  TRACE_WIDTHS.SIGNAL,
            minDrill:  DRILL_SIZES.VIA_DRILL
        },
        layers,
        holes:  state.holes,
        vias:   state.vias,
        components: state.components,
        traces: state.traces,
        pads:   state.pads,
        silkscreen: state.silkscreen,
        nets:   state.nets,
        board:  { width: state.boardWidth, height: state.boardHeight, thickness: state.boardThickness, cornerR: state.boardCornerR }
    };
}

function colorNameFromHex(hex) {
    for (const k of Object.keys(PCB_COLORS)) {
        if (PCB_COLORS[k].hex.toLowerCase() === String(hex).toLowerCase()) return PCB_COLORS[k].name;
    }
    return hex;
}

export async function exportManufacturingZip() {
    if (state.components.length === 0) {
        autoGeneratePCB();
    }
    const pcbData = buildPcbDataForExport();
    const bundle = await generateManufacturingBundle(pcbData, {
        includeBOM: true,
        includeDRC: true,
        drcVendor:  state.vendor,
        includeReadme: true
    });
    state.lastBundle = bundle;
    downloadBundle(bundle);
    showToast(t('pcb.zip.ready'));
    return bundle;
}

export function exportGerberOnly() {
    if (state.components.length === 0) autoGeneratePCB();
    const data = buildPcbDataForExport();
    const files = generateAllGerbers(data);
    return _downloadIndividualZip(files, `${state.boardName}-gerber.zip`);
}

export function exportBOMOnly() {
    if (state.components.length === 0) autoGeneratePCB();
    const data = buildPcbDataForExport();
    const files = generateAllBOM(data);
    return _downloadIndividualZip(files, `${state.boardName}-bom.zip`);
}

async function _downloadIndividualZip(files, name) {
    if (typeof JSZip === 'undefined') throw new Error('JSZip not loaded');
    const zip = new JSZip();
    for (const [fname, text] of Object.entries(files)) {
        zip.file(fname, text);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── 3D update ──────────────────────────────
function update3D() {
    if (!viewer3d) return;
    viewer3d.update({
        board: { width: state.boardWidth, height: state.boardHeight, thickness: state.boardThickness, cornerR: state.boardCornerR },
        traces: state.traces,
        vias: state.vias,
        holes: state.holes,
        pads: state.pads,
        silkscreen: state.silkscreen,
        components: state.components
    }, {
        color: state.boardColor,
        thickness: state.boardThickness,
        originX: state.boardWidth / 2,
        originY: state.boardHeight / 2
    });
    refreshStatsUI();
}

// ── UI binding ─────────────────────────────
let _uiLoaded = false;

async function loadUI(container) {
    if (_uiLoaded) return;
    _uiLoaded = true;
    try {
        const html = await fetch('modules/pcb/pcb-ui.html').then(r => r.text());
        container.innerHTML = html;
    } catch (e) {
        console.error('[PCBModule] UI load failed', e);
    }
    // Ensure stylesheet loaded once
    if (!document.querySelector('link[data-pcb-css]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'modules/pcb/pcb-css.css';
        link.dataset.pcbCss = '1';
        document.head.appendChild(link);
    }
}

function $(id) { return document.getElementById(id); }
function setIfPresent(id, value) {
    const el = $(id);
    if (el) el.value = value;
}

function bindUI() {
    // Layout preset
    const presetSel = $('pcb-layout-preset');
    if (presetSel) {
        presetSel.innerHTML = Object.entries(PCB_LAYOUT_PRESETS)
            .map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');
        presetSel.value = state.layoutPreset;
        presetSel.addEventListener('change', () => {
            state.layoutPreset = presetSel.value;
            const def = PCB_LAYOUT_PRESETS[state.layoutPreset];
            if (def) {
                state.cols = Math.round(def.widthU);
                state.rows = Math.round(def.heightU);
                setIfPresent('pcb-rows', state.rows);
                setIfPresent('pcb-cols', state.cols);
            }
        });
    }

    // Numeric inputs
    const bind = (id, key, parser = parseFloat) => {
        const el = $(id);
        if (!el) return;
        el.value = state[key];
        el.addEventListener('input', () => {
            const v = parser(el.value);
            if (!Number.isNaN(v)) state[key] = v;
        });
    };
    bind('pcb-rows', 'rows', parseInt);
    bind('pcb-cols', 'cols', parseInt);
    bind('pcb-thickness', 'boardThickness');
    bind('pcb-corner', 'boardCornerR');
    bind('pcb-board-name', 'boardName', String);

    // Color swatches
    const swatchHost = $('pcb-color-swatches');
    if (swatchHost) {
        swatchHost.innerHTML = Object.values(PCB_COLORS).map(c =>
            `<button class="pcb-swatch" data-color="${c.hex}" style="background:${c.hex}" title="${c.name}"></button>`
        ).join('');
        swatchHost.querySelectorAll('.pcb-swatch').forEach(btn => {
            btn.addEventListener('click', () => {
                state.boardColor = btn.dataset.color;
                if (viewer3d) viewer3d.setColor(state.boardColor);
                swatchHost.querySelectorAll('.pcb-swatch').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // Thickness select (preset values)
    const thkSel = $('pcb-thickness-select');
    if (thkSel) {
        thkSel.innerHTML = PCB_THICKNESS_OPTIONS
            .map(v => `<option value="${v}">${v} mm</option>`).join('');
        thkSel.value = String(state.boardThickness);
        thkSel.addEventListener('change', () => {
            state.boardThickness = parseFloat(thkSel.value);
            if (viewer3d) {
                viewer3d.setThickness(state.boardThickness);
                update3D();
            }
        });
    }

    // Footprint selectors
    const fillSelect = (id, items, current) => {
        const el = $(id);
        if (!el) return;
        el.innerHTML = items.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
        el.value = current;
    };
    fillSelect('pcb-switch-type', listSwitchFootprints(), state.switchType);
    fillSelect('pcb-diode-type',  listDiodeFootprints(),  state.diodeType);
    fillSelect('pcb-mcu-type',    listMCUFootprints(),    state.mcuType);
    fillSelect('pcb-usb-type',    listUSBFootprints(),    state.usbType);
    $('pcb-switch-type')?.addEventListener('change', e => state.switchType = e.target.value);
    $('pcb-diode-type')?.addEventListener('change',  e => state.diodeType  = e.target.value);
    $('pcb-mcu-type')?.addEventListener('change',    e => state.mcuType    = e.target.value);
    $('pcb-usb-type')?.addEventListener('change',    e => state.usbType    = e.target.value);

    // Mount holes
    const mountChk = $('pcb-mount-enable');
    if (mountChk) {
        mountChk.checked = state.addMountHoles;
        mountChk.addEventListener('change', () => state.addMountHoles = mountChk.checked);
    }
    const mountCnt = $('pcb-mount-count');
    if (mountCnt) {
        mountCnt.value = String(state.mountHoleCount);
        mountCnt.addEventListener('change', () => state.mountHoleCount = parseInt(mountCnt.value));
    }

    // Vendor
    const vendorSel = $('pcb-vendor');
    if (vendorSel) {
        vendorSel.innerHTML = Object.keys(VENDOR_RULES)
            .map(k => `<option value="${k}">${k}</option>`).join('');
        vendorSel.value = state.vendor;
        vendorSel.addEventListener('change', () => state.vendor = vendorSel.value);
    }

    // Buttons
    $('pcb-btn-generate')?.addEventListener('click', () => {
        try { autoGeneratePCB(); } catch (e) { console.error(e); showToast(`Error: ${e.message}`); }
    });
    $('pcb-btn-drc')?.addEventListener('click', () => {
        const r = runDRCOnState();
        renderDRC(r);
    });
    $('pcb-btn-export')?.addEventListener('click', async () => {
        try { await exportManufacturingZip(); }
        catch (e) { console.error(e); showToast(`Error: ${e.message}`); }
    });
    $('pcb-btn-gerber-only')?.addEventListener('click', () => exportGerberOnly());
    $('pcb-btn-bom-only')?.addEventListener('click',    () => exportBOMOnly());

    // Layer toggles
    ['traces', 'pads', 'silk', 'comp', 'holes'].forEach(layer => {
        const chk = $(`pcb-show-${layer}`);
        if (chk) {
            chk.checked = true;
            chk.addEventListener('change', () => viewer3d?.setLayerVisible(layer, chk.checked));
        }
    });
}

// ── Stats / DRC UI ─────────────────────────
function refreshStatsUI() {
    const host = $('pcb-stats');
    if (!host) return;
    const d = drillStats({ holes: state.holes, vias: state.vias });
    const b = bomStats({ components: state.components });
    const lengths = estimateTraceLengths({ traces: state.traces });
    const totalCu = Object.values(lengths).reduce((s, v) => s + v, 0);
    host.innerHTML = `
        <div class="pcb-stat-row"><span>Components</span><b>${state.components.length}</b></div>
        <div class="pcb-stat-row"><span>Traces</span><b>${state.traces.length}</b></div>
        <div class="pcb-stat-row"><span>Vias</span><b>${state.vias.length}</b></div>
        <div class="pcb-stat-row"><span>Holes (PTH/NPTH)</span><b>${d.pth}/${d.npth}</b></div>
        <div class="pcb-stat-row"><span>Unique parts</span><b>${b.uniqueParts}</b></div>
        <div class="pcb-stat-row"><span>Copper length</span><b>${totalCu.toFixed(1)} mm</b></div>
        <div class="pcb-stat-row"><span>Board</span><b>${state.boardWidth.toFixed(1)} × ${state.boardHeight.toFixed(1)} mm</b></div>
    `;
}

function renderDRC(result) {
    const host = $('pcb-drc-result');
    if (!host) return;
    host.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'pcb-drc-head';
    head.innerHTML = `<b>${result.ok ? '✓ PASS' : '✗ FAIL'}</b>
        — ${result.errors.length} errors, ${result.warnings.length} warnings`;
    host.appendChild(head);
    if (result.errors.length) {
        const ul = document.createElement('ul');
        ul.className = 'pcb-drc-list pcb-drc-errors';
        for (const e of result.errors.slice(0, 50)) {
            const li = document.createElement('li');
            li.textContent = `[${e.code}] ${e.message}`;
            ul.appendChild(li);
        }
        host.appendChild(ul);
    }
    if (result.warnings.length) {
        const ul = document.createElement('ul');
        ul.className = 'pcb-drc-list pcb-drc-warnings';
        for (const w of result.warnings.slice(0, 50)) {
            const li = document.createElement('li');
            li.textContent = `[${w.code}] ${w.message}`;
            ul.appendChild(li);
        }
        host.appendChild(ul);
    }
}

// ── Public Module API ──────────────────────
const SECTION_OPTIONS = [
    { value: '',                  label: '--- Jump to Section ---' },
    { value: 'pcb-sec-layout',    label: 'Layout' },
    { value: 'pcb-sec-parts',     label: 'Parts' },
    { value: 'pcb-sec-board',     label: 'Board' },
    { value: 'pcb-sec-export',    label: 'Export' },
    { value: 'pcb-sec-drc',       label: 'DRC' },
    { value: 'pcb-sec-stats',     label: 'Statistics' }
];

export const PCBModule = {
    id: MODULE_ID, name: MODULE_NAME,
    async init(ctx) {
        THREE       = ctx.THREE;
        scene       = ctx.scene;
        camera      = ctx.camera;
        controls    = ctx.controls;
        showToast   = ctx.showToast || showToast;
        currentLang = ctx.currentLang || 'en';

        const c = document.getElementById('module-pcb');
        if (c) await loadUI(c);

        // Build group + viewer
        sceneGroup = new THREE.Group();
        sceneGroup.visible = false;
        sceneGroup.name = 'PCBStudioGroup';
        scene.add(sceneGroup);

        viewer3d = new PCBViewer3D(THREE, sceneGroup, { name: 'pcb-viewer' });
        viewer3d.show();

        bindUI();

        // Generate the default board so the first activate shows something
        try { autoGeneratePCB(); }
        catch (e) { console.error('[PCBModule] auto-generate failed', e); }

        console.log('[PCBModule] Initialised');
    },
    activate() {
        const el = document.getElementById('module-pcb');
        if (el) el.style.display = 'block';
        if (sceneGroup) sceneGroup.visible = true;
        if (camera && controls) {
            camera.position.set(150, 200, 250);
            controls.target.set(0, 0, 0);
            controls.update();
        }
        // Refresh in case board changed while inactive
        update3D();
    },
    deactivate() {
        const el = document.getElementById('module-pcb');
        if (el) el.style.display = 'none';
        if (sceneGroup) sceneGroup.visible = false;
    },
    getSectionOptions() { return SECTION_OPTIONS; },
    getState()  { return JSON.parse(JSON.stringify(state)); },
    setState(s) { Object.assign(state, s || {}); update3D(); },
    // Programmatic API for other modules / tests
    autoGeneratePCB,
    runDRC: runDRCOnState,
    exportManufacturingZip,
    exportGerberOnly,
    exportBOMOnly
};

export default PCBModule;
