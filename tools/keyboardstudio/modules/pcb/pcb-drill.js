// =============================================
// KeybordStudio V1 - Excellon NC drill exporter
// modules/pcb/pcb-drill.js
// =============================================
// Excellon (.drl / .xln) NC drill format. JLCPCB / PCBWay / Elecrow
// 全社が受理する標準フォーマット。
//
// PTH (Plated Through Hole) と NPTH (Non-Plated) を別ファイルで出力
// (KiCad と同じ慣習)。
//
// 仕様参考:
//   - Excellon Format documentation (Excellon Automation 系)
//   - Ucamco "PCB Manufacturing Format" (Excellon 互換)
//   - JLCPCB Help: "Generate Gerber/Drill" (KiCad / EAGLE)
//
// ヘッダ例:
//   M48                 program start
//   ;FORMAT={2:4/absolute/metric/decimal}
//   FMAT,2              format-2 (現代の Excellon)
//   METRIC,TZ           metric, trailing zeros
//   T1C0.300            tool 1 = 直径 0.30mm
//   T2C1.500
//   %                   header end
//   G90                 absolute mode
//   G05                 drill mode
//   T1                  select tool 1
//   X1234Y5678          drill at (x,y)
//   ...
//   M30                 end of program
//
// 単位: mm (METRIC)、座標精度 4 桁 (例: 1.2345 → 12345)。

import { DRILL_DECIMALS } from './pcb-constants.js';

// ── 数値フォーマッタ ───────────────────────────
function drillCoord(mm) {
    const factor = Math.pow(10, DRILL_DECIMALS);
    const v = Math.round(mm * factor);
    return (v < 0 ? '-' : '') + Math.abs(v).toString();
}

function fmtDiameter(mm) {
    // ツール定義の直径は小数 3 桁で十分 (0.001mm 精度)
    return mm.toFixed(3);
}

// ── ツールテーブル管理 ────────────────────────
class ToolTable {
    constructor() {
        this.tools = new Map(); // diameter(mm) -> tool number (T1, T2, ...)
        this.next = 1;
    }
    register(diameterMm) {
        const key = Number(diameterMm).toFixed(4);
        if (!this.tools.has(key)) {
            this.tools.set(key, this.next++);
        }
        return this.tools.get(key);
    }
    list() {
        // tool 番号順に配列で返す
        return [...this.tools.entries()]
            .map(([d, n]) => ({ tool: n, diameter: parseFloat(d) }))
            .sort((a, b) => a.tool - b.tool);
    }
}

// ── 1 ファイル生成 ─────────────────────────────
/**
 * @param {Array}  holes [{x, y, drill, plated}]   plated=true → PTH, false → NPTH
 * @param {object} meta  { boardName, plated, version }
 * @returns {string} Excellon ファイル内容
 */
export function generateDrill(holes, meta = {}) {
    const plated = meta.plated !== false;
    const filtered = holes.filter(h =>
        Number(h.drill) > 0 && (plated ? h.plated !== false : h.plated === false)
    );

    const tools = new ToolTable();
    for (const h of filtered) tools.register(h.drill);

    const lines = [];
    // Header
    lines.push('M48');
    lines.push('; KeybordStudio v1 — Excellon NC drill');
    lines.push(`; Board: ${meta.boardName || 'KeybordStudio_PCB'}`);
    lines.push(`; Created: ${new Date().toISOString()}`);
    lines.push(`; Type: ${plated ? 'PTH (plated)' : 'NPTH (non-plated)'}`);
    lines.push(';FORMAT={-:-/absolute/metric/decimal}');
    lines.push('FMAT,2');
    lines.push('METRIC,TZ');
    // Tool definitions
    for (const t of tools.list()) {
        lines.push(`T${t.tool}C${fmtDiameter(t.diameter)}`);
    }
    lines.push('%');

    // Body
    lines.push('G90');                        // absolute coords
    lines.push('G05');                        // drill mode
    lines.push('M71');                        // metric units (M71 = mm, M72 = inch)

    // ホールをツール毎にまとめて出力 (連続走行用)
    const byTool = new Map();
    for (const h of filtered) {
        const t = tools.register(h.drill);
        if (!byTool.has(t)) byTool.set(t, []);
        byTool.get(t).push(h);
    }
    const toolNums = [...byTool.keys()].sort((a, b) => a - b);
    for (const tn of toolNums) {
        lines.push(`T${tn}`);
        for (const h of byTool.get(tn)) {
            lines.push(`X${drillCoord(h.x)}Y${drillCoord(h.y)}`);
        }
    }

    lines.push('T0');     // ツール解放
    lines.push('M30');    // program end
    return lines.join('\n') + '\n';
}

/**
 * PTH と NPTH の両方を生成して { fileName: text } を返す。
 * vias は holes 配列に含めて plated=true で渡してよい。
 *
 * @param {object} pcbData {
 *   meta: { boardName },
 *   holes: [ {x, y, drill, plated} ],  // 全ホール
 *   vias?: [ {x, y, drill?} ]          // 任意: ビア別配列
 * }
 */
export function generateAllDrills(pcbData) {
    const out = {};
    const meta = pcbData.meta || {};
    const baseName = (meta.boardName || 'KeybordStudio_PCB').replace(/[\\/:*?"<>|]/g, '_');

    const allHoles = [...(pcbData.holes || [])];
    // ビアを PTH ホールとして合流
    if (pcbData.vias) {
        for (const v of pcbData.vias) {
            allHoles.push({
                x: v.x, y: v.y,
                drill: v.drill ?? 0.30,
                plated: true,
                source: 'via'
            });
        }
    }

    const pth  = generateDrill(allHoles, { ...meta, plated: true });
    const npth = generateDrill(allHoles, { ...meta, plated: false });

    out[`${baseName}-PTH.drl`]  = pth;
    out[`${baseName}-NPTH.drl`] = npth;
    return out;
}

/**
 * pcbData の components 配列 (router/footprints の合成結果) からホールを抽出する
 * ヘルパー。pad の drill > 0 のものだけを取り出して配置済み座標に変換する。
 *
 * @param {Array} components [{x, y, rotation, footprint}]
 * @returns {Array} [{x, y, drill, plated}]
 */
export function extractHolesFromComponents(components) {
    const holes = [];
    for (const c of components || []) {
        const fp = c.footprint;
        if (!fp || !fp.pads) continue;
        const rad = (c.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        for (const p of fp.pads) {
            if (!p.drill || p.drill <= 0) continue;
            const x = c.x + (p.x * cos - p.y * sin);
            const y = c.y + (p.x * sin + p.y * cos);
            holes.push({
                x, y,
                drill: p.drill,
                plated: p.plated !== false && p.layer !== 'NPTH'
            });
        }
    }
    return holes;
}

/**
 * 統計情報 (ホール数 / ツール数) を返す。UI 表示用。
 */
export function drillStats(pcbData) {
    const allHoles = [...(pcbData.holes || [])];
    if (pcbData.vias) {
        for (const v of pcbData.vias) {
            allHoles.push({ ...v, drill: v.drill ?? 0.30, plated: true });
        }
    }
    const pth  = allHoles.filter(h => h.plated !== false);
    const npth = allHoles.filter(h => h.plated === false);
    const tools = new Set(allHoles.map(h => Number(h.drill).toFixed(4)));
    return {
        totalHoles: allHoles.length,
        pth:  pth.length,
        npth: npth.length,
        tools: tools.size,
        viaCount: (pcbData.vias || []).length
    };
}

export default generateAllDrills;
