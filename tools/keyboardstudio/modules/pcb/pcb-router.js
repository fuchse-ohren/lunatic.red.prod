// =============================================
// KeybordStudio V1 - PCB Studio auto-router
// modules/pcb/pcb-router.js
// =============================================
// Simplified but functional auto-router for keyboard PCBs.
//
// Strategy (mirrors `kicad-kbplacer`):
//   1. Switch row pads → next-switch row pad on same row : F.Cu rectilinear
//   2. Switch col pads → diode → next-switch col pad     : B.Cu (via at diode)
//   3. MCU GPIO → row[i] / col[j] (rectilinear), prefer F.Cu for rows / B.Cu for cols
//   4. USB-C D+/D- → MCU USB pads (kept short; via if needed)
//   5. VCC : MCU VCC → switch LEDs (if any) → USB +5V
//   6. GND : ground pour on F.Cu and B.Cu (bbox of switches + padding)
//
// All output mm units, top view, origin at PCB centre. Coords snapped to
// `ROUTER_PARAMS.GRID`.

import {
    LAYERS, NETS, TRACE_WIDTHS, DRILL_SIZES, ROUTER_PARAMS, CLEARANCES
} from './pcb-constants.js';
import {
    getFootprint, transformPad, DEFAULT_FOOTPRINT_FOR_TYPE
} from './pcb-footprints.js';

// ── Geometry helpers ──────────────────────────────
const GRID = ROUTER_PARAMS.GRID || 0.05;

export function snap(v) {
    return Math.round(v / GRID) * GRID;
}
export function snapPoint(p) {
    return { x: snap(p.x), y: snap(p.y) };
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function eq(a, b) { return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6; }

// Compute a rectilinear polyline between two points. Mode:
//   'L'    – single L (horizontal then vertical)
//   'L-V'  – single L (vertical then horizontal)
//   'Z'    – Z-shape (horizontal, vertical, horizontal) at midpoint
// Returns array of {x,y} points, snapped to grid.
export function rectilinearPath(x1, y1, x2, y2, mode = 'L') {
    const a = snapPoint({ x: x1, y: y1 });
    const b = snapPoint({ x: x2, y: y2 });
    if (eq(a, b)) return [a];
    if (mode === 'L-V') {
        return [a, snapPoint({ x: a.x, y: b.y }), b];
    }
    if (mode === 'Z') {
        const midX = snap((a.x + b.x) / 2);
        return [a, snapPoint({ x: midX, y: a.y }), snapPoint({ x: midX, y: b.y }), b];
    }
    // default 'L' (horizontal then vertical)
    return [a, snapPoint({ x: b.x, y: a.y }), b];
}

// Insert 45° chamfered corners at every right-angle turn. The supplied bend
// radius is clamped to half of the shortest adjacent segment.
export function chamferCorners(points, bend = ROUTER_PARAMS.BEND_RADIUS) {
    if (!points || points.length < 3) return points;
    const out = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
        const p0 = points[i - 1], p1 = points[i], p2 = points[i + 1];
        const d1 = dist(p0, p1), d2 = dist(p1, p2);
        const r = Math.min(bend, d1 / 2, d2 / 2);
        if (r < GRID) { out.push(p1); continue; }
        const ux1 = (p0.x - p1.x) / (d1 || 1), uy1 = (p0.y - p1.y) / (d1 || 1);
        const ux2 = (p2.x - p1.x) / (d2 || 1), uy2 = (p2.y - p1.y) / (d2 || 1);
        out.push(snapPoint({ x: p1.x + ux1 * r, y: p1.y + uy1 * r }));
        out.push(snapPoint({ x: p1.x + ux2 * r, y: p1.y + uy2 * r }));
    }
    out.push(points[points.length - 1]);
    return out;
}

// ── Net + trace + via builders ───────────────────
function makeTrace(layer, width, points) {
    return { layer, width, points };
}
function makeVia(x, y) {
    const p = snapPoint({ x, y });
    return {
        x: p.x, y: p.y,
        drill: DRILL_SIZES.VIA_DRILL,
        pad:   DRILL_SIZES.VIA_PAD,
        net:   null
    };
}

// ── Pad lookup helper ────────────────────────────
function padWorld(component) {
    if (!component || !component.type) return null;
    const fpId = component.footprintId || DEFAULT_FOOTPRINT_FOR_TYPE[
        component.type === 'switch' ? 'switch' :
        component.type === 'diode'  ? 'diode'  :
        component.type === 'usb'    ? 'usb'    :
        component.type === 'mcu'    ? 'mcu'    :
        component.type === 'led'    ? 'led'    :
        component.type === 'connector' ? 'connector' :
        component.type === 'mech'   ? 'mech'   : 'switch'
    ];
    return { fp: getFootprint(component.footprintId || fpId), fpId };
}

function getPadXY(component, padName) {
    if (!component) return null;
    const fpRec = padWorld(component);
    const fp = fpRec.fp;
    if (!fp) return null;
    const pos = transformPad(fp, padName, component.x, component.y, component.rotation || 0);
    if (!pos) return null;
    return { x: snap(pos.x), y: snap(pos.y), layer: pos.layer, padName };
}

// Pick the row/col pad name for a given switch footprint.
//   Pin '1' is convention for the column-side pad (goes to diode anode/cathode)
//   Pin '2' is convention for the row-side pad
// Hotswap footprints expose '1' and '2' on B.Cu, so they work the same.
function switchRowPad(sw)  { return getPadXY(sw, '2'); }
function switchColPad(sw)  { return getPadXY(sw, '1'); }
function diodeAnodePad(d)  { return getPadXY(d, 'A') || getPadXY(d, '1'); }
function diodeKathPad(d)   { return getPadXY(d, 'K') || getPadXY(d, '2'); }

// ── Net registry ─────────────────────────────────
class NetRegistry {
    constructor() { this.nets = new Map(); }
    ensure(name) {
        if (!this.nets.has(name)) {
            this.nets.set(name, { name, pads: [], traces: [], vias: [] });
        }
        return this.nets.get(name);
    }
    addPad(name, component, padName) {
        if (!component) return;
        const net = this.ensure(name);
        net.pads.push({ component: component.id, padName });
    }
    addTrace(name, trace) {
        const net = this.ensure(name);
        net.traces.push(trace);
    }
    addVia(name, via) {
        via.net = name;
        const net = this.ensure(name);
        net.vias.push(via);
    }
    list() { return [...this.nets.values()]; }
}

// ── Per-row / per-col grouping ───────────────────
function groupBy(items, keyFn) {
    const m = new Map();
    for (const it of items) {
        const k = keyFn(it);
        if (k === undefined || k === null) continue;
        if (!m.has(k)) m.set(k, []);
        m.get(k).push(it);
    }
    return m;
}

// ── Main router ──────────────────────────────────
/**
 * @param {Object} input
 * @param {Array}  input.switches     [{id,x,y,rotation,type,row,col,footprintId}]
 * @param {Array}  input.diodes       [{id,x,y,rotation,type,switchId,footprintId}]
 * @param {Object} input.mcu          {id,x,y,rotation,type,footprintId,pinmap}
 * @param {Object} input.usb          {id,x,y,rotation,type,footprintId}
 * @param {Array}  input.mountHoles   [{x,y,drill}]
 * @param {number} input.rows
 * @param {number} input.cols
 * @param {Object} input.options
 */
export function routePCB(input) {
    const opts = Object.assign({
        swapDiodeDirection: false,
        useFrontLayer:      true,
        addGroundPour:      true,
        groundPourMargin:   2.0,
        rowLayer:           LAYERS.F_CU,
        colLayer:           LAYERS.B_CU,
        traceWidth:         TRACE_WIDTHS.SIGNAL,
        powerWidth:         TRACE_WIDTHS.POWER,
        usbWidth:           TRACE_WIDTHS.USB
    }, input.options || {});

    const switches  = (input.switches  || []).map(s => ({ ...s, type: 'switch', rotation: s.rotation || 0 }));
    const diodes    = (input.diodes    || []).map(d => ({ ...d, type: 'diode',  rotation: d.rotation || 0 }));
    const mcu       = input.mcu  ? { ...input.mcu, type: 'mcu',  rotation: input.mcu.rotation || 0 } : null;
    const usb       = input.usb  ? { ...input.usb, type: 'usb',  rotation: input.usb.rotation || 0 } : null;
    const mountHoles = input.mountHoles || [];
    const rows = input.rows ?? Math.max(0, ...switches.map(s => (s.row ?? 0))) + 1;
    const cols = input.cols ?? Math.max(0, ...switches.map(s => (s.col ?? 0))) + 1;

    const nets   = new NetRegistry();
    const traces = [];
    const vias   = [];
    const pours  = [];

    // Quick lookup
    const diodeBySwitch = new Map();
    for (const d of diodes) diodeBySwitch.set(d.switchId, d);

    const byRow = groupBy(switches, s => s.row);
    const byCol = groupBy(switches, s => s.col);

    // ── 1. Row traces (F.Cu) ─────────────────────
    for (const [rowIdx, rowSwitches] of byRow) {
        const netName = `ROW${rowIdx}`;
        rowSwitches.sort((a, b) => a.x - b.x);
        for (let i = 0; i < rowSwitches.length; i++) {
            const sw = rowSwitches[i];
            const rp = switchRowPad(sw);
            if (!rp) continue;
            nets.addPad(netName, sw, rp.padName);
            if (i < rowSwitches.length - 1) {
                const nxt = rowSwitches[i + 1];
                const rp2 = switchRowPad(nxt);
                if (!rp2) continue;
                const path = chamferCorners(
                    rectilinearPath(rp.x, rp.y, rp2.x, rp2.y, 'L')
                );
                const trace = makeTrace(opts.rowLayer, opts.traceWidth, path);
                traces.push(trace);
                nets.addTrace(netName, trace);
            }
        }
    }

    // ── 2. Column traces via diodes (B.Cu) ───────
    for (const [colIdx, colSwitches] of byCol) {
        const netName = `COL${colIdx}`;
        colSwitches.sort((a, b) => a.y - b.y);
        for (let i = 0; i < colSwitches.length; i++) {
            const sw = colSwitches[i];
            const cp = switchColPad(sw);
            if (!cp) continue;

            // Connect switch col pad → diode kathode (or anode if swapped)
            const diode = diodeBySwitch.get(sw.id);
            if (diode) {
                const kPad = opts.swapDiodeDirection ? diodeAnodePad(diode) : diodeKathPad(diode);
                const aPad = opts.swapDiodeDirection ? diodeKathPad(diode) : diodeAnodePad(diode);
                if (kPad) {
                    // Switch col pad to diode kathode (short trace, B.Cu)
                    const path = chamferCorners(
                        rectilinearPath(cp.x, cp.y, kPad.x, kPad.y, 'L')
                    );
                    const t = makeTrace(opts.colLayer, opts.traceWidth, path);
                    traces.push(t);
                    nets.addTrace(`SW${sw.id}_K`, t);
                    nets.addPad(`SW${sw.id}_K`, sw, cp.padName);
                    nets.addPad(`SW${sw.id}_K`, diode, kPad.padName);
                }
                // Anode side becomes COL net
                if (aPad) {
                    nets.addPad(netName, diode, aPad.padName);
                    if (i < colSwitches.length - 1) {
                        const nxt = colSwitches[i + 1];
                        const nxtDiode = diodeBySwitch.get(nxt.id);
                        const nxtAPad = nxtDiode
                            ? (opts.swapDiodeDirection ? diodeKathPad(nxtDiode) : diodeAnodePad(nxtDiode))
                            : switchColPad(nxt);
                        if (nxtAPad) {
                            // COL net runs on B.Cu between diode anodes
                            const distance = dist(aPad, nxtAPad);
                            const path = chamferCorners(
                                rectilinearPath(aPad.x, aPad.y, nxtAPad.x, nxtAPad.y,
                                                distance > ROUTER_PARAMS.VIA_USE_THRESHOLD * 8 ? 'Z' : 'L')
                            );
                            const t = makeTrace(opts.colLayer, opts.traceWidth, path);
                            traces.push(t);
                            nets.addTrace(netName, t);
                        }
                    }
                }
            } else {
                // No diode → fall back to a direct B.Cu jump between col pads.
                nets.addPad(netName, sw, cp.padName);
                if (i < colSwitches.length - 1) {
                    const nxt = colSwitches[i + 1];
                    const cp2 = switchColPad(nxt);
                    if (!cp2) continue;
                    const path = chamferCorners(
                        rectilinearPath(cp.x, cp.y, cp2.x, cp2.y, 'L')
                    );
                    const t = makeTrace(opts.colLayer, opts.traceWidth, path);
                    traces.push(t);
                    nets.addTrace(netName, t);
                }
            }
        }
    }

    // ── 3. MCU pin → matrix nets ─────────────────
    if (mcu) {
        const fp = getFootprint(mcu.footprintId || DEFAULT_FOOTPRINT_FOR_TYPE.mcu);
        const pinmap = input.mcu?.pinmap || autoMcuPinmap(fp, rows, cols);

        // Row connections (F.Cu)
        for (let r = 0; r < rows; r++) {
            const padName = pinmap.rows[r];
            if (!padName) continue;
            const mcuPad = getPadXY(mcu, padName);
            if (!mcuPad) continue;
            const netName = `ROW${r}`;
            nets.addPad(netName, mcu, padName);
            // Find anchor pad on this row (leftmost switch row pad)
            const rowSwitches = (byRow.get(r) || []).slice().sort((a, b) => a.x - b.x);
            if (rowSwitches.length === 0) continue;
            const anchor = switchRowPad(rowSwitches[0]);
            if (!anchor) continue;
            const path = chamferCorners(
                rectilinearPath(mcuPad.x, mcuPad.y, anchor.x, anchor.y, 'Z')
            );
            const t = makeTrace(opts.rowLayer, opts.traceWidth, path);
            traces.push(t);
            nets.addTrace(netName, t);
            // Drop a via to switch-row anchor since rows live on F.Cu
            // (no via needed unless mcu pad layer differs — Pro Micro pads are THT)
        }
        // Column connections (B.Cu)
        for (let c = 0; c < cols; c++) {
            const padName = pinmap.cols[c];
            if (!padName) continue;
            const mcuPad = getPadXY(mcu, padName);
            if (!mcuPad) continue;
            const netName = `COL${c}`;
            nets.addPad(netName, mcu, padName);
            const colSwitches = (byCol.get(c) || []).slice().sort((a, b) => a.y - b.y);
            if (colSwitches.length === 0) continue;
            const top = colSwitches[0];
            const topDiode = diodeBySwitch.get(top.id);
            const anchor = topDiode
                ? (opts.swapDiodeDirection ? diodeKathPad(topDiode) : diodeAnodePad(topDiode))
                : switchColPad(top);
            if (!anchor) continue;
            const path = chamferCorners(
                rectilinearPath(mcuPad.x, mcuPad.y, anchor.x, anchor.y, 'Z')
            );
            const t = makeTrace(opts.colLayer, opts.powerWidth * 0.7, path);
            traces.push(t);
            nets.addTrace(netName, t);
            // Drop via at MCU pad to transition to B.Cu
            const v = makeVia(mcuPad.x, mcuPad.y);
            vias.push(v);
            nets.addVia(netName, v);
        }
    }

    // ── 4. USB D+/D- to MCU ──────────────────────
    if (usb && mcu) {
        const mcuFp = getFootprint(mcu.footprintId || DEFAULT_FOOTPRINT_FOR_TYPE.mcu);
        const usbDp = getPadXY(usb, 'D+');
        const usbDn = getPadXY(usb, 'D-');
        const usbVbus = getPadXY(usb, 'VBUS');
        const usbGnd  = getPadXY(usb, 'GND') || getPadXY(usb, 'GND2');

        // Pro Micro/Elite-C/Liatris USB pins (best-effort — module already has
        // onboard USB). For modules that breakout USB (e.g. Liatris D+/D-) we
        // attempt a short link. Pro Micro pinout exposes D+/D- internally only,
        // so this stays as a stub when the named pads are absent.
        const mcuDpPad = getPadXY(mcu, 'D+');
        const mcuDnPad = getPadXY(mcu, 'D-');
        if (usbDp && mcuDpPad) {
            const t = makeTrace(LAYERS.F_CU, opts.usbWidth,
                chamferCorners(rectilinearPath(usbDp.x, usbDp.y, mcuDpPad.x, mcuDpPad.y, 'Z')));
            traces.push(t);
            nets.addTrace(NETS.USB_DP, t);
            nets.addPad(NETS.USB_DP, usb, 'D+');
            nets.addPad(NETS.USB_DP, mcu, 'D+');
        }
        if (usbDn && mcuDnPad) {
            const t = makeTrace(LAYERS.F_CU, opts.usbWidth,
                chamferCorners(rectilinearPath(usbDn.x, usbDn.y, mcuDnPad.x, mcuDnPad.y, 'Z')));
            traces.push(t);
            nets.addTrace(NETS.USB_DN, t);
            nets.addPad(NETS.USB_DN, usb, 'D-');
            nets.addPad(NETS.USB_DN, mcu, 'D-');
        }
        // VBUS → MCU RAW / +5V
        const mcuRaw = getPadXY(mcu, 'RAW') || getPadXY(mcu, '+5V');
        if (usbVbus && mcuRaw) {
            const t = makeTrace(LAYERS.F_CU, opts.powerWidth,
                chamferCorners(rectilinearPath(usbVbus.x, usbVbus.y, mcuRaw.x, mcuRaw.y, 'Z')));
            traces.push(t);
            nets.addTrace(NETS.USB_5V, t);
            nets.addPad(NETS.USB_5V, usb,  'VBUS');
            nets.addPad(NETS.USB_5V, mcu,  mcuRaw.padName);
        }
        // USB shield / GND → MCU GND
        const mcuGnd = getPadXY(mcu, 'GND');
        if (usbGnd && mcuGnd) {
            const t = makeTrace(LAYERS.F_CU, opts.powerWidth,
                chamferCorners(rectilinearPath(usbGnd.x, usbGnd.y, mcuGnd.x, mcuGnd.y, 'Z')));
            traces.push(t);
            nets.addTrace(NETS.GND, t);
            nets.addPad(NETS.GND, usb, usbGnd.padName);
            nets.addPad(NETS.GND, mcu, 'GND');
        }
    }

    // ── 5. VCC chain (MCU VCC → LEDs → USB +5V) ─
    if (mcu) {
        const mcuVcc = getPadXY(mcu, 'VCC');
        if (mcuVcc) {
            nets.addPad(NETS.VCC, mcu, 'VCC');
            // LEDs on switches (if input.leds provided)
            const leds = input.leds || [];
            let prev = mcuVcc;
            for (const led of leds) {
                const ledVdd = getPadXY({ ...led, type: 'led' }, 'VDD');
                if (!ledVdd) continue;
                const t = makeTrace(LAYERS.F_CU, opts.powerWidth,
                    chamferCorners(rectilinearPath(prev.x, prev.y, ledVdd.x, ledVdd.y, 'Z')));
                traces.push(t);
                nets.addTrace(NETS.VCC, t);
                nets.addPad(NETS.VCC, led, 'VDD');
                prev = ledVdd;
            }
        }
    }

    // ── 6. GND ground pour ───────────────────────
    if (opts.addGroundPour && switches.length > 0) {
        const xs = switches.map(s => s.x);
        const ys = switches.map(s => s.y);
        const minX = Math.min(...xs) - 9.525 - opts.groundPourMargin;
        const maxX = Math.max(...xs) + 9.525 + opts.groundPourMargin;
        const minY = Math.min(...ys) - 9.525 - opts.groundPourMargin;
        const maxY = Math.max(...ys) + 9.525 + opts.groundPourMargin;
        const polygon = [
            { x: snap(minX), y: snap(minY) },
            { x: snap(maxX), y: snap(minY) },
            { x: snap(maxX), y: snap(maxY) },
            { x: snap(minX), y: snap(maxY) },
            { x: snap(minX), y: snap(minY) }
        ];
        pours.push({ layer: LAYERS.F_CU, polygon, net: NETS.GND, clearance: CLEARANCES.TRACE_TO_PAD });
        pours.push({ layer: LAYERS.B_CU, polygon, net: NETS.GND, clearance: CLEARANCES.TRACE_TO_PAD });
        nets.ensure(NETS.GND);
    }

    // Mount-hole pads can be added to GND silently (typical convention)
    for (const mh of mountHoles) {
        nets.addPad(NETS.GND, { id: `MH_${mh.x}_${mh.y}` }, 'MH');
    }

    return {
        traces,
        vias,
        nets:  nets.list(),
        pours,
        stats: {
            traceCount: traces.length,
            viaCount:   vias.length,
            netCount:   nets.list().length,
            switchCount: switches.length,
            diodeCount:  diodes.length,
            rows, cols
        }
    };
}

// ── Auto MCU pinmap heuristic ────────────────────
// Very simple deterministic mapping: scan free Pro Micro digital pins, skip
// power/ground/USB pins, assign the first `rows` free names to ROW0..N,
// then the next `cols` to COL0..M. This matches typical QMK/ZMK builds.
export function autoMcuPinmap(fp, rows, cols) {
    if (!fp) return { rows: [], cols: [] };
    const reserved = new Set([
        'VCC', 'GND', 'RAW', '+5V', 'RST', 'RUN', 'D+', 'D-', 'TX0', 'RX1'
    ]);
    const usable = fp.pads
        .filter(p => p.drill)              // THT only — exposed to user
        .filter(p => !reserved.has(p.name))
        .map(p => p.name);
    return {
        rows: usable.slice(0, rows),
        cols: usable.slice(rows, rows + cols)
    };
}

// ── Convenience exports ──────────────────────────
export const ROUTING_DEFAULTS = Object.freeze({
    rowLayer:        LAYERS.F_CU,
    colLayer:        LAYERS.B_CU,
    traceWidth:      TRACE_WIDTHS.SIGNAL,
    powerWidth:      TRACE_WIDTHS.POWER,
    usbWidth:        TRACE_WIDTHS.USB,
    addGroundPour:   true,
    groundPourMargin: 2.0
});

// Add a single via at (x,y) to the result. Exposed for downstream callers.
export function addVia(result, x, y, netName = null) {
    const v = makeVia(x, y);
    if (netName) v.net = netName;
    result.vias.push(v);
    return v;
}

// Estimate total copper length per layer (mm). Useful for cost preview.
export function estimateTraceLengths(result) {
    const totals = {};
    for (const t of result.traces) {
        let sum = 0;
        for (let i = 1; i < t.points.length; i++) {
            sum += dist(t.points[i - 1], t.points[i]);
        }
        totals[t.layer] = (totals[t.layer] || 0) + sum;
    }
    return totals;
}

export default routePCB;
