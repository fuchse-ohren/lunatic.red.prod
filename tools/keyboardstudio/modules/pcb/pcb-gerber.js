// =============================================
// KeybordStudio V1 - PCB Gerber RS-274X exporter
// modules/pcb/pcb-gerber.js
// =============================================
// Gerber RS-274X (Extended Gerber) format implementation.
// 仕様参考: https://en.wikipedia.org/wiki/Gerber_format
//          Ucamco "The Gerber Layer Format Specification"
//
// 1 レイヤー = 1 ファイル。標準的な PCB は最低 6 レイヤーが必要:
//   F.Cu      (top copper)
//   B.Cu      (bottom copper)
//   F.Mask    (top solder mask, 開口部 = 露出)
//   B.Mask    (bottom solder mask)
//   F.SilkS   (top silkscreen, 部品名や境界)
//   B.SilkS   (bottom silkscreen)
//   Edge.Cuts (基板外形、機械加工用)
//
// 任意:
//   F.Paste / B.Paste (ステンシル用、SMD のみ)
//   F.Fab / B.Fab    (組立図、製造業者により無視)
//
// 出力単位: mm (推奨)、座標精度 4.6 (整数 4 桁 + 小数 6 桁)
//
// 主要 G-code:
//   %FSLAX46Y46*%   座標フォーマット指定 (Leading zeros omitted, Absolute, 4.6)
//   %MOMM*%         単位 mm
//   %ADDxxC,d*%     アパーチャ d 番を直径 d の円として定義
//   %ADDxxR,wxh*%   矩形アパーチャ
//   %ADDxxO,wxh*%   オーバル
//   D01            interpolate (draw)
//   D02            move
//   D03            flash (パッド配置)
//   M02*           file end

import { LAYERS, GERBER_INTEGER_DIGITS, GERBER_DECIMALS } from './pcb-constants.js';

// ── 数値フォーマッタ ───────────────────────────
// mm を Gerber の整数 (1 単位 = 1e-6 mm) に変換
function gerberCoord(mm) {
    const factor = Math.pow(10, GERBER_DECIMALS);
    const v = Math.round(mm * factor);
    return (v < 0 ? '-' : '') + Math.abs(v).toString();
}

// ── レイヤーごとのファイル拡張子 (KiCad / EAGLE 互換) ──
// JLCPCB / PCBWay は両方の拡張子を受理する。
const LAYER_EXT = {
    [LAYERS.EDGE_CUTS]: '.gko',     // または -Edge_Cuts.gbr
    [LAYERS.F_CU]:      '.gtl',
    [LAYERS.B_CU]:      '.gbl',
    [LAYERS.F_MASK]:    '.gts',
    [LAYERS.B_MASK]:    '.gbs',
    [LAYERS.F_SILK]:    '.gto',
    [LAYERS.B_SILK]:    '.gbo',
    [LAYERS.F_PASTE]:   '.gtp',
    [LAYERS.B_PASTE]:   '.gbp',
    [LAYERS.F_FAB]:     '-F_Fab.gbr',
    [LAYERS.B_FAB]:     '-B_Fab.gbr'
};

const LAYER_FILE_FUNCTION = {
    [LAYERS.EDGE_CUTS]: 'Profile,NP',
    [LAYERS.F_CU]:      'Copper,L1,Top',
    [LAYERS.B_CU]:      'Copper,L2,Bot',
    [LAYERS.F_MASK]:    'Soldermask,Top',
    [LAYERS.B_MASK]:    'Soldermask,Bot',
    [LAYERS.F_SILK]:    'Legend,Top',
    [LAYERS.B_SILK]:    'Legend,Bot',
    [LAYERS.F_PASTE]:   'Paste,Top',
    [LAYERS.B_PASTE]:   'Paste,Bot',
    [LAYERS.F_FAB]:     'AssemblyDrawing,Top',
    [LAYERS.B_FAB]:     'AssemblyDrawing,Bot'
};

// ── アパーチャマネージャ ─────────────────────────
class ApertureManager {
    constructor() {
        this.apertures = new Map(); // key -> { id, type, params }
        this.nextId = 10;           // D10 から (D01-D09 は予約)
    }
    _key(type, params) { return type + '|' + params.join(','); }

    circle(diameter) {
        const k = this._key('C', [diameter]);
        if (!this.apertures.has(k)) {
            this.apertures.set(k, { id: this.nextId++, type: 'C', params: [diameter] });
        }
        return this.apertures.get(k).id;
    }
    rect(w, h) {
        const k = this._key('R', [w, h]);
        if (!this.apertures.has(k)) {
            this.apertures.set(k, { id: this.nextId++, type: 'R', params: [w, h] });
        }
        return this.apertures.get(k).id;
    }
    oval(w, h) {
        const k = this._key('O', [w, h]);
        if (!this.apertures.has(k)) {
            this.apertures.set(k, { id: this.nextId++, type: 'O', params: [w, h] });
        }
        return this.apertures.get(k).id;
    }

    emitDefinitions() {
        const lines = [];
        // 安定的な並びにするため id でソート
        const list = [...this.apertures.values()].sort((a, b) => a.id - b.id);
        for (const a of list) {
            if (a.type === 'C')      lines.push(`%ADD${a.id}C,${a.params[0]}*%`);
            else if (a.type === 'R') lines.push(`%ADD${a.id}R,${a.params[0]}X${a.params[1]}*%`);
            else if (a.type === 'O') lines.push(`%ADD${a.id}O,${a.params[0]}X${a.params[1]}*%`);
        }
        return lines;
    }
}

// ── レイヤー生成のメインロジック ─────────────────
/**
 * 1 レイヤー分の Gerber テキストを生成する。
 *
 * @param {string} layerName  LAYERS の値 (例: 'F.Cu')
 * @param {object} layerData  { traces, pads, lines, polygons, texts }
 *   - traces:   [{ width, points: [{x,y}, ...] }]
 *   - pads:     [{ x, y, w, h, shape: 'circle'|'rect'|'oval', drill? }]
 *   - lines:    [{ x1, y1, x2, y2, width }]
 *   - polygons: [{ points: [{x,y}, ...], filled }]
 *   - texts:    [{ x, y, text, size, layer }] (silk のみ簡易出力 — line stroke で text を表現)
 * @param {object} meta { boardName, designedBy, createdAt, comment }
 */
export function generateGerber(layerName, layerData, meta = {}) {
    const apertures = new ApertureManager();
    const cmds = [];
    const now = (meta.createdAt || new Date()).toISOString();

    // ── ヘッダ ──
    cmds.push(`G04 KeybordStudio V1 PCB Studio*`);
    cmds.push(`G04 Layer: ${layerName}*`);
    cmds.push(`G04 Generated: ${now}*`);
    if (meta.boardName) cmds.push(`G04 Board: ${meta.boardName}*`);
    cmds.push(`%TF.GenerationSoftware,KeybordStudio,V1*%`);
    cmds.push(`%TF.CreationDate,${now}*%`);
    cmds.push(`%TF.SameCoordinates,Original*%`);
    cmds.push(`%TF.FileFunction,${LAYER_FILE_FUNCTION[layerName] || 'Other'}*%`);
    cmds.push(`%TF.FilePolarity,${layerName.includes('Mask') ? 'Negative' : 'Positive'}*%`);
    cmds.push(`%FSLAX${GERBER_INTEGER_DIGITS}${GERBER_DECIMALS}Y${GERBER_INTEGER_DIGITS}${GERBER_DECIMALS}*%`);
    cmds.push(`%MOMM*%`);
    cmds.push(`%LPD*%`); // dark polarity

    const drawCmds = [];

    // ── トレース (interpolated draw) ──
    for (const trace of (layerData.traces || [])) {
        const apId = apertures.circle(trace.width);
        drawCmds.push(`%LPD*%`);
        drawCmds.push(`G01*`);
        drawCmds.push(`D${apId}*`);
        const pts = trace.points;
        if (pts.length === 0) continue;
        drawCmds.push(`X${gerberCoord(pts[0].x)}Y${gerberCoord(pts[0].y)}D02*`);
        for (let i = 1; i < pts.length; i++) {
            drawCmds.push(`X${gerberCoord(pts[i].x)}Y${gerberCoord(pts[i].y)}D01*`);
        }
    }

    // ── ライン (silkscreen / Edge.Cuts 等の単線) ──
    for (const line of (layerData.lines || [])) {
        const apId = apertures.circle(line.width || 0.15);
        drawCmds.push(`G01*`);
        drawCmds.push(`D${apId}*`);
        drawCmds.push(`X${gerberCoord(line.x1)}Y${gerberCoord(line.y1)}D02*`);
        drawCmds.push(`X${gerberCoord(line.x2)}Y${gerberCoord(line.y2)}D01*`);
    }

    // ── パッド (flash) ──
    for (const pad of (layerData.pads || [])) {
        let apId;
        if (pad.shape === 'circle') {
            apId = apertures.circle(pad.w);
        } else if (pad.shape === 'rect') {
            apId = apertures.rect(pad.w, pad.h);
        } else if (pad.shape === 'oval') {
            apId = apertures.oval(pad.w, pad.h);
        } else {
            continue;
        }
        drawCmds.push(`D${apId}*`);
        drawCmds.push(`X${gerberCoord(pad.x)}Y${gerberCoord(pad.y)}D03*`);
    }

    // ── ポリゴン (region: G36 ... G37) ──
    for (const poly of (layerData.polygons || [])) {
        if (!poly.points || poly.points.length < 3) continue;
        if (poly.filled !== false) drawCmds.push(`G36*`);
        else drawCmds.push(`G01*`);
        const pts = poly.points;
        drawCmds.push(`X${gerberCoord(pts[0].x)}Y${gerberCoord(pts[0].y)}D02*`);
        for (let i = 1; i < pts.length; i++) {
            drawCmds.push(`X${gerberCoord(pts[i].x)}Y${gerberCoord(pts[i].y)}D01*`);
        }
        // close polygon
        drawCmds.push(`X${gerberCoord(pts[0].x)}Y${gerberCoord(pts[0].y)}D01*`);
        if (poly.filled !== false) drawCmds.push(`G37*`);
    }

    // ── 簡易テキスト (silk のみ、stroke font で line 化) ──
    for (const t of (layerData.texts || [])) {
        const strokes = strokeText(t.text || '', t.x || 0, t.y || 0, t.size || 1.0, t.rotation || 0);
        const apId = apertures.circle(t.lineWidth || 0.15);
        drawCmds.push(`D${apId}*`);
        drawCmds.push(`G01*`);
        for (const seg of strokes) {
            drawCmds.push(`X${gerberCoord(seg.x1)}Y${gerberCoord(seg.y1)}D02*`);
            drawCmds.push(`X${gerberCoord(seg.x2)}Y${gerberCoord(seg.y2)}D01*`);
        }
    }

    // ── アパーチャ定義は header に挿入 (ただし draw コマンドの前) ──
    cmds.push(...apertures.emitDefinitions());
    cmds.push(...drawCmds);
    cmds.push(`M02*`);

    return cmds.join('\n') + '\n';
}

/**
 * 全レイヤーを一括生成して { fileName: gerberText } を返す。
 *
 * @param {object} pcbData {
 *   meta: { boardName, version, ... },
 *   layers: { 'F.Cu': layerData, 'B.Cu': layerData, ... }
 * }
 */
export function generateAllGerbers(pcbData) {
    const out = {};
    const meta = pcbData.meta || {};
    const baseName = (meta.boardName || 'KeybordStudio_PCB').replace(/[\\/:*?"<>|]/g, '_');
    for (const [layerName, layerData] of Object.entries(pcbData.layers || {})) {
        const ext = LAYER_EXT[layerName] || `.${layerName.replace(/\./g, '_')}.gbr`;
        const fileName = `${baseName}${ext}`;
        out[fileName] = generateGerber(layerName, layerData, meta);
    }
    return out;
}

/**
 * Edge.Cuts 用の標準的な角丸矩形を生成するヘルパー。
 */
export function rectOutline(x, y, w, h, cornerR = 1.5, lineWidth = 0.1) {
    const lines = [];
    if (cornerR <= 0) {
        lines.push({ x1: x, y1: y, x2: x + w, y2: y, width: lineWidth });
        lines.push({ x1: x + w, y1: y, x2: x + w, y2: y + h, width: lineWidth });
        lines.push({ x1: x + w, y1: y + h, x2: x, y2: y + h, width: lineWidth });
        lines.push({ x1: x, y1: y + h, x2: x, y2: y, width: lineWidth });
        return lines;
    }
    // 角丸: 各辺は cornerR 分だけ短く、4 隅は近似的に短い直線で補間
    const r = Math.min(cornerR, w / 2, h / 2);
    lines.push({ x1: x + r, y1: y, x2: x + w - r, y2: y, width: lineWidth });
    lines.push({ x1: x + w, y1: y + r, x2: x + w, y2: y + h - r, width: lineWidth });
    lines.push({ x1: x + w - r, y1: y + h, x2: x + r, y2: y + h, width: lineWidth });
    lines.push({ x1: x, y1: y + h - r, x2: x, y2: y + r, width: lineWidth });
    // 4 隅の弧 (16 分割)
    const segs = 8;
    const corners = [
        { cx: x + r,     cy: y + r,     a0: Math.PI,        a1: Math.PI * 1.5 },
        { cx: x + w - r, cy: y + r,     a0: Math.PI * 1.5,  a1: Math.PI * 2 },
        { cx: x + w - r, cy: y + h - r, a0: 0,              a1: Math.PI * 0.5 },
        { cx: x + r,     cy: y + h - r, a0: Math.PI * 0.5,  a1: Math.PI }
    ];
    for (const c of corners) {
        let prev = { x: c.cx + Math.cos(c.a0) * r, y: c.cy + Math.sin(c.a0) * r };
        for (let i = 1; i <= segs; i++) {
            const a = c.a0 + (c.a1 - c.a0) * (i / segs);
            const cur = { x: c.cx + Math.cos(a) * r, y: c.cy + Math.sin(a) * r };
            lines.push({ x1: prev.x, y1: prev.y, x2: cur.x, y2: cur.y, width: lineWidth });
            prev = cur;
        }
    }
    return lines;
}

// ── 簡易ストロークフォント (Hershey 風、5×7 セル) ──
// 数字 0-9 と A-Z + 一部記号のみ。silkscreen 用最小実装。
const STROKE_FONT = {
    'A': [[0,0],[2,5],[4,0],null,[1,2],[3,2]],
    'B': [[0,0],[0,5],[3,5],[4,4],[3,3],[0,3],null,[0,3],[3,3],[4,2],[4,1],[3,0],[0,0]],
    'C': [[4,5],[1,5],[0,4],[0,1],[1,0],[4,0]],
    'D': [[0,0],[0,5],[3,5],[4,4],[4,1],[3,0],[0,0]],
    'E': [[4,5],[0,5],[0,0],[4,0],null,[0,3],[3,3]],
    'F': [[4,5],[0,5],[0,0],null,[0,3],[3,3]],
    'G': [[4,5],[1,5],[0,4],[0,1],[1,0],[4,0],[4,2],[2,2]],
    'H': [[0,0],[0,5],null,[4,0],[4,5],null,[0,3],[4,3]],
    'I': [[1,5],[3,5],null,[2,5],[2,0],null,[1,0],[3,0]],
    'J': [[3,5],[3,1],[2,0],[1,1]],
    'K': [[0,0],[0,5],null,[0,2],[4,5],null,[0,2],[4,0]],
    'L': [[0,5],[0,0],[4,0]],
    'M': [[0,0],[0,5],[2,3],[4,5],[4,0]],
    'N': [[0,0],[0,5],[4,0],[4,5]],
    'O': [[1,5],[3,5],[4,4],[4,1],[3,0],[1,0],[0,1],[0,4],[1,5]],
    'P': [[0,0],[0,5],[3,5],[4,4],[4,3],[3,2],[0,2]],
    'Q': [[1,5],[3,5],[4,4],[4,1],[3,0],[1,0],[0,1],[0,4],[1,5],null,[3,1],[5,-1]],
    'R': [[0,0],[0,5],[3,5],[4,4],[4,3],[3,2],[0,2],null,[2,2],[4,0]],
    'S': [[4,5],[1,5],[0,4],[1,3],[3,3],[4,2],[3,0],[0,0]],
    'T': [[0,5],[4,5],null,[2,5],[2,0]],
    'U': [[0,5],[0,1],[1,0],[3,0],[4,1],[4,5]],
    'V': [[0,5],[2,0],[4,5]],
    'W': [[0,5],[1,0],[2,3],[3,0],[4,5]],
    'X': [[0,0],[4,5],null,[0,5],[4,0]],
    'Y': [[0,5],[2,3],[4,5],null,[2,3],[2,0]],
    'Z': [[0,5],[4,5],[0,0],[4,0]],
    '0': [[1,5],[3,5],[4,4],[4,1],[3,0],[1,0],[0,1],[0,4],[1,5],null,[0,0],[4,5]],
    '1': [[1,4],[2,5],[2,0],null,[1,0],[3,0]],
    '2': [[0,4],[1,5],[3,5],[4,4],[4,3],[0,0],[4,0]],
    '3': [[0,5],[4,5],[2,3],[4,3],[4,0],[0,0]],
    '4': [[3,5],[0,2],[4,2],null,[3,5],[3,0]],
    '5': [[4,5],[0,5],[0,3],[3,3],[4,2],[4,1],[3,0],[0,0]],
    '6': [[4,5],[1,5],[0,4],[0,1],[1,0],[3,0],[4,1],[4,2],[3,3],[0,3]],
    '7': [[0,5],[4,5],[1,0]],
    '8': [[1,5],[3,5],[4,4],[3,3],[1,3],[0,2],[0,1],[1,0],[3,0],[4,1],[4,2],[3,3],null,[1,3],[0,4],[1,5]],
    '9': [[4,2],[4,4],[3,5],[1,5],[0,4],[0,3],[1,2],[4,2],null,[4,2],[3,0],[1,0]],
    '-': [[1,2],[3,2]],
    '+': [[2,4],[2,1],null,[1,2],[3,2]],
    '.': [[2,0],[2,1]],
    ',': [[2,0],[1,-1]],
    ' ': []
};
function strokeText(text, x, y, size, rotation) {
    const segs = [];
    const scale = size / 5;
    const cosA = Math.cos((rotation || 0) * Math.PI / 180);
    const sinA = Math.sin((rotation || 0) * Math.PI / 180);
    let cx = x;
    const charW = 5 * scale + 1;
    for (const ch of text.toUpperCase()) {
        const glyph = STROKE_FONT[ch];
        if (!glyph) { cx += charW; continue; }
        let prev = null;
        for (const p of glyph) {
            if (p === null) { prev = null; continue; }
            const sx = cx + p[0] * scale;
            const sy = y  + p[1] * scale;
            const rx = x + (sx - x) * cosA - (sy - y) * sinA;
            const ry = y + (sx - x) * sinA + (sy - y) * cosA;
            if (prev) segs.push({ x1: prev.x, y1: prev.y, x2: rx, y2: ry });
            prev = { x: rx, y: ry };
        }
        cx += charW;
    }
    return segs;
}
