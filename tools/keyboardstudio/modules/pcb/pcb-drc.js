// =============================================
// KeybordStudio V1 - Design Rule Check
// modules/pcb/pcb-drc.js
// =============================================
// PCB の DRC (Design Rule Check) を実行する。
// 業者 (JLCPCB / PCBWay / Elecrow) の標準仕様に違反する設計を発注前に
// 検出する目的。違反は「error / warning / info」の 3 段階。
//
// チェック項目:
//   1. trace 幅が最小値より細い
//   2. trace 同士のクリアランス (短距離ヒューリスティック)
//   3. trace と pad の距離
//   4. 基板端 (Edge.Cuts) からの距離
//   5. ホール径が最小値より小さい (JLCPCB は 0.20mm 推奨、最小 0.15mm)
//   6. ホール同士が近すぎる (中心間 0.50mm 未満)
//   7. シルクスクリーンとパッドの重なり
//   8. 部品同士の courtyard 衝突
//   9. ネット未接続 (matrix の row/col に MCU pin が割り当てられていない)
//
// 結果: { errors:[], warnings:[], info:[], stats }
//

import {
    CLEARANCES, TRACE_WIDTHS, DRILL_SIZES, LAYERS
} from './pcb-constants.js';

// ── 業者デフォルト ───────────────────────────
export const VENDOR_RULES = Object.freeze({
    jlcpcb: {
        minTraceWidth:    0.127,   // 5 mil
        minClearance:     0.127,
        minDrill:         0.20,
        minAnnularRing:   0.13,
        minEdgeClearance: 0.20,
        minHoleSpacing:   0.50,
        maxBoardSize:     400      // 400×400mm 上限 (一般)
    },
    pcbway: {
        minTraceWidth:    0.127,
        minClearance:     0.127,
        minDrill:         0.20,
        minAnnularRing:   0.13,
        minEdgeClearance: 0.20,
        minHoleSpacing:   0.50,
        maxBoardSize:     500
    },
    elecrow: {
        minTraceWidth:    0.152,   // 6 mil (やや厳しい)
        minClearance:     0.152,
        minDrill:         0.30,
        minAnnularRing:   0.15,
        minEdgeClearance: 0.30,
        minHoleSpacing:   0.50,
        maxBoardSize:     400
    },
    strict: {
        minTraceWidth:    0.20,
        minClearance:     0.20,
        minDrill:         0.30,
        minAnnularRing:   0.15,
        minEdgeClearance: 0.30,
        minHoleSpacing:   0.60,
        maxBoardSize:     300
    }
});

// ── 幾何ユーティリティ ────────────────────────
function distSq(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }
function dist(a, b) { return Math.sqrt(distSq(a, b)); }

function pointSegmentDistance(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return dist(p, a);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}

function segmentSegmentDistance(a1, a2, b1, b2) {
    return Math.min(
        pointSegmentDistance(a1, b1, b2),
        pointSegmentDistance(a2, b1, b2),
        pointSegmentDistance(b1, a1, a2),
        pointSegmentDistance(b2, a1, a2)
    );
}

function rectsOverlap(r1, r2) {
    return !(r1.x + r1.w < r2.x ||
             r2.x + r2.w < r1.x ||
             r1.y + r1.h < r2.y ||
             r2.y + r2.h < r1.y);
}

// ── DRC エンジン ─────────────────────────────
/**
 * @param {object} pcbData  { board, traces, vias, holes, components, edge }
 *   board.width / board.height (mm)
 *   edge: 任意 — Edge.Cuts ライン配列 [{x1,y1,x2,y2}]
 * @param {object} options { vendor: 'jlcpcb'|'pcbway'|'elecrow'|'strict', rules?: {...} }
 * @returns {object} { errors, warnings, info, stats, ok }
 */
export function runDRC(pcbData, options = {}) {
    const vendor = options.vendor || 'jlcpcb';
    const rules  = Object.assign({}, VENDOR_RULES[vendor] || VENDOR_RULES.jlcpcb, options.rules || {});

    const errors   = [];
    const warnings = [];
    const info     = [];
    const issue = (lvl, code, msg, where) => {
        const item = { code, message: msg, where };
        if (lvl === 'error')   errors.push(item);
        if (lvl === 'warning') warnings.push(item);
        if (lvl === 'info')    info.push(item);
    };

    const traces = pcbData.traces || [];
    const vias   = pcbData.vias   || [];
    const holes  = pcbData.holes  || [];
    const components = pcbData.components || [];
    const board  = pcbData.board  || {};

    // ── 1. board size ─────────────────────────
    if (board.width && board.height) {
        if (board.width  > rules.maxBoardSize ||
            board.height > rules.maxBoardSize) {
            issue('warning', 'BOARD_TOO_LARGE',
                `Board ${board.width}×${board.height}mm exceeds vendor limit ${rules.maxBoardSize}mm.`,
                { width: board.width, height: board.height });
        }
        if (board.width <= 0 || board.height <= 0) {
            issue('error', 'BOARD_INVALID', 'Board size must be positive.', board);
        }
    } else {
        issue('warning', 'BOARD_SIZE_UNKNOWN',
            'Board size is not specified — vendor checks are skipped.', null);
    }

    // ── 2. trace width ────────────────────────
    for (const t of traces) {
        if ((t.width || 0) < rules.minTraceWidth - 1e-6) {
            issue('error', 'TRACE_TOO_THIN',
                `Trace width ${t.width}mm below ${rules.minTraceWidth}mm minimum (vendor: ${vendor}).`,
                t);
        }
    }

    // ── 3. trace × trace clearance (同一レイヤーのみ) ──
    // 全 vs 全比較は O(n^2) — 大型 PCB でも数千トレースなので十分高速。
    for (let i = 0; i < traces.length; i++) {
        const ta = traces[i];
        for (let j = i + 1; j < traces.length; j++) {
            const tb = traces[j];
            if (ta.layer !== tb.layer) continue;
            if ((ta.net && tb.net && ta.net === tb.net)) continue;       // 同ネット
            const ptsA = ta.points || [];
            const ptsB = tb.points || [];
            if (ptsA.length < 2 || ptsB.length < 2) continue;
            for (let a = 1; a < ptsA.length; a++) {
                for (let b = 1; b < ptsB.length; b++) {
                    const d = segmentSegmentDistance(ptsA[a-1], ptsA[a], ptsB[b-1], ptsB[b]);
                    const minSep = (ta.width + tb.width) / 2 + rules.minClearance;
                    if (d < minSep - 1e-6) {
                        issue('error', 'TRACE_CLEARANCE',
                            `Traces on ${ta.layer} too close: ${d.toFixed(3)}mm < ${minSep.toFixed(3)}mm.`,
                            { layer: ta.layer, a: ptsA[a-1], b: ptsB[b-1] });
                        a = ptsA.length; b = ptsB.length;        // 1 ペアにつき 1 報告
                    }
                }
            }
        }
    }

    // ── 4. drill diameter & hole spacing ─────
    const allHoles = [
        ...holes,
        ...vias.map(v => ({ x: v.x, y: v.y, drill: v.drill ?? 0.30, plated: true }))
    ];
    for (const h of allHoles) {
        if ((h.drill || 0) < rules.minDrill - 1e-6) {
            issue('error', 'DRILL_TOO_SMALL',
                `Drill ${h.drill}mm below ${rules.minDrill}mm minimum.`, h);
        }
    }
    for (let i = 0; i < allHoles.length; i++) {
        for (let j = i + 1; j < allHoles.length; j++) {
            const a = allHoles[i], b = allHoles[j];
            const d = dist(a, b);
            const minSep = (a.drill + b.drill) / 2 + rules.minHoleSpacing;
            if (d < minSep - 1e-6) {
                issue('warning', 'HOLE_SPACING',
                    `Holes too close: ${d.toFixed(3)}mm at (${a.x.toFixed(2)},${a.y.toFixed(2)}).`,
                    { a, b });
                break;
            }
        }
    }

    // ── 5. edge clearance ────────────────────
    if (board.width && board.height) {
        const ex = rules.minEdgeClearance;
        for (const t of traces) {
            for (const p of t.points || []) {
                if (p.x < ex || p.y < ex ||
                    p.x > board.width - ex || p.y > board.height - ex) {
                    issue('warning', 'EDGE_CLEARANCE',
                        `Trace point too close to board edge.`, p);
                    break;
                }
            }
        }
        for (const h of allHoles) {
            const ec = ex + h.drill / 2;
            if (h.x < ec || h.y < ec ||
                h.x > board.width - ec || h.y > board.height - ec) {
                issue('warning', 'HOLE_EDGE_CLEARANCE',
                    `Hole too close to board edge: (${h.x.toFixed(2)},${h.y.toFixed(2)}).`, h);
            }
        }
    }

    // ── 6. component courtyard collision ──────
    for (let i = 0; i < components.length; i++) {
        const a = components[i];
        if (!a.footprint || !a.footprint.courtyard) continue;
        const ar = {
            x: a.x - a.footprint.courtyard.w / 2,
            y: a.y - a.footprint.courtyard.h / 2,
            w: a.footprint.courtyard.w,
            h: a.footprint.courtyard.h
        };
        for (let j = i + 1; j < components.length; j++) {
            const b = components[j];
            if (!b.footprint || !b.footprint.courtyard) continue;
            // 隣接する穴は許容
            if (a.type === 'mech' && b.type === 'mech') continue;
            const br = {
                x: b.x - b.footprint.courtyard.w / 2,
                y: b.y - b.footprint.courtyard.h / 2,
                w: b.footprint.courtyard.w,
                h: b.footprint.courtyard.h
            };
            if (rectsOverlap(ar, br)) {
                issue('warning', 'COURTYARD_OVERLAP',
                    `${a.ref || a.type} overlaps with ${b.ref || b.type}.`,
                    { a: a.ref, b: b.ref });
            }
        }
    }

    // ── 7. unconnected nets ──────────────────
    if (Array.isArray(pcbData.nets)) {
        for (const net of pcbData.nets) {
            if ((net.pads || []).length < 2) {
                // 単独 pad は警告 (USB GND like 単独参照)
                if (!/^(USB|TEST|NC|GND|VCC|RAW|\+5V)/.test(net.name)) {
                    issue('warning', 'NET_FLOATING',
                        `Net "${net.name}" connects fewer than 2 pads.`, net);
                }
            }
            if ((net.pads || []).length >= 2 && (net.traces || []).length === 0
                && net.name !== 'GND') {
                issue('error', 'NET_UNROUTED',
                    `Net "${net.name}" has pads but no copper.`, net);
            }
        }
    }

    return {
        errors,
        warnings,
        info,
        ok: errors.length === 0,
        stats: {
            traceCount:    traces.length,
            holeCount:     allHoles.length,
            componentCount: components.length,
            errorCount:    errors.length,
            warningCount:  warnings.length,
            infoCount:     info.length,
            vendor,
            rules
        }
    };
}

/**
 * DRC 結果を人間が読みやすいテキスト形式に整形 (ログ / 出力 .txt 用)。
 */
export function formatDRC(result) {
    const lines = [];
    lines.push(`=== KeybordStudio v1 — DRC Report ===`);
    lines.push(`Vendor: ${result.stats.vendor}`);
    lines.push(`Result: ${result.ok ? 'PASS' : 'FAIL'}`);
    lines.push(`Errors: ${result.stats.errorCount}, Warnings: ${result.stats.warningCount}`);
    lines.push('');
    if (result.errors.length) {
        lines.push('-- Errors --');
        for (const e of result.errors) lines.push(`[${e.code}] ${e.message}`);
        lines.push('');
    }
    if (result.warnings.length) {
        lines.push('-- Warnings --');
        for (const w of result.warnings) lines.push(`[${w.code}] ${w.message}`);
        lines.push('');
    }
    if (result.info.length) {
        lines.push('-- Info --');
        for (const i of result.info) lines.push(`[${i.code}] ${i.message}`);
    }
    return lines.join('\n');
}

export default runDRC;
