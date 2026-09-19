// =============================================
// KeybordStudio V1 - BOM & Pick&Place exporter
// modules/pcb/pcb-bom.js
// =============================================
// BOM (Bill of Materials) と Pick & Place (CPL) ファイルを生成。
// JLCPCB SMT Assembly に直接アップロード可能なフォーマットに合わせる。
//
// JLCPCB BOM 必須カラム:
//   Comment    -- 部品の値や型番 (例: 1uF, 1N4148, ATmega32U4)
//   Designator -- 基板上の参照名 (D1, D2, U1)
//   Footprint  -- フットプリント名
//   LCSC       -- LCSC 部品番号 (例: C7440)。空欄でも可だが推奨。
//
// JLCPCB Pick & Place 必須カラム:
//   Designator
//   Mid X      -- 部品中心 X (mm) — 単位 "0.0000mm" 形式
//   Mid Y      -- 部品中心 Y (mm)
//   Layer      -- "T" (Top) / "B" (Bottom)
//   Rotation   -- 度 (反時計回り)
//
// 参考:
//   - JLCPCB Help Center: SMT Assembly BOM/CPL Format
//   - PCBWay/Elecrow も同様の CSV を受理
//   - LCSC 部品番号データベース (一般的な抵抗/コンデンサ/MCU 推奨値)
//

// ── CSV 安全エスケープ ─────────────────────────
function csvEscape(s) {
    if (s === null || s === undefined) return '';
    const v = String(s);
    if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
}

function csvRow(fields) {
    return fields.map(csvEscape).join(',');
}

// ── 推奨 LCSC 部品番号 (よく使う基本部品) ────────────
// ユーザーが BOM を編集できるよう参考値として埋めておく。
// 空文字列 ''  → ユーザーが手動で埋める。
export const SUGGESTED_LCSC = Object.freeze({
    // ダイオード
    'sod-123':       { lcsc: 'C81598',  comment: '1N4148WS' },
    'sod-323':       { lcsc: 'C2128',   comment: '1N4148W' },
    'tht-1n4148':    { lcsc: 'C14516',  comment: '1N4148' },
    // USB コネクタ
    'usb-c':         { lcsc: 'C165948', comment: 'USB-C 16-pin (TYPE-C-31-M-12)' },
    'usb-mini-b':    { lcsc: 'C46398',  comment: 'USB Mini-B' },
    'jst-ph-2':      { lcsc: 'C144394', comment: 'JST-PH 2-pin' },
    // MCU モジュール (基板で買うのでアセンブリ対象外が普通)
    'promicro':      { lcsc: '',        comment: 'Pro Micro module' },
    'elite-c':       { lcsc: '',        comment: 'Elite-C module' },
    'liatris':       { lcsc: '',        comment: 'Liatris (RP2040)' },
    'helios':        { lcsc: '',        comment: 'Helios (RP2040)' },
    'nice-nano':     { lcsc: '',        comment: 'nice!nano BLE' },
    // LED
    'sk6812mini-e':  { lcsc: 'C2843680', comment: 'SK6812MINI-E' },
    // スイッチ (組み立てしないが BOM には載せる)
    'mx-pcb':        { lcsc: '',        comment: 'Cherry MX (PCB mount)' },
    'mx-hotswap':    { lcsc: 'C2904012', comment: 'Kailh MX hotswap socket' },
    'choc':          { lcsc: '',        comment: 'Kailh Choc V1' },
    'choc-hotswap':  { lcsc: '',        comment: 'Kailh Choc hotswap socket' },
    'alps':          { lcsc: '',        comment: 'Alps SKCM/SKCL' },
    'topre':         { lcsc: '',        comment: 'Topre 30g/45g/55g' },
    // 機械
    'mount-m2':      { lcsc: '',        comment: 'M2 mounting hole' },
    'mount-m3':      { lcsc: '',        comment: 'M3 mounting hole' }
});

// ── 部品分類 (Reference Designator プレフィックス) ──
const REF_PREFIX = {
    switch:    'SW',
    diode:     'D',
    mcu:       'U',
    usb:       'J',
    connector: 'J',
    led:       'LED',
    mech:      'H'      // mounting hole
};

/**
 * Designator を一括生成する。caller が事前に c.ref を付けていればそれを尊重。
 *
 * @param {Array} components  [{type, footprintId, x, y, rotation, ref?}]
 * @returns {Array} 入力に c.ref を付与した新しい配列 (元配列は変更しない)
 */
export function assignDesignators(components) {
    const counters = {};
    return (components || []).map(c => {
        if (c.ref) return { ...c };
        const prefix = REF_PREFIX[c.type] || 'X';
        counters[prefix] = (counters[prefix] || 0) + 1;
        return { ...c, ref: `${prefix}${counters[prefix]}` };
    });
}

// ── BOM CSV 生成 ──────────────────────────────
/**
 * @param {Array} components  [{ref, type, footprintId, value?, lcsc?}]
 * @returns {string} CSV テキスト
 */
export function generateBOM(components) {
    const rows = [];
    rows.push(csvRow(['Comment', 'Designator', 'Footprint', 'LCSC Part #', 'Quantity']));

    // 同じフットプリント+値で集約
    const groups = new Map();
    for (const c of components || []) {
        if (c.type === 'mech') continue;            // 穴は BOM 不要
        const fpId = c.footprintId || c.type;
        const sugg = SUGGESTED_LCSC[fpId] || {};
        const value   = c.value   ?? sugg.comment ?? fpId;
        const lcsc    = c.lcsc    ?? sugg.lcsc    ?? '';
        const key     = `${value}|${fpId}|${lcsc}`;
        if (!groups.has(key)) {
            groups.set(key, { value, footprint: fpId, lcsc, refs: [] });
        }
        groups.get(key).refs.push(c.ref);
    }

    for (const g of groups.values()) {
        rows.push(csvRow([
            g.value,
            g.refs.join(','),
            g.footprint,
            g.lcsc,
            String(g.refs.length)
        ]));
    }

    return rows.join('\r\n') + '\r\n';
}

// ── Pick & Place CSV 生成 ──────────────────────
/**
 * JLCPCB CPL 形式。座標精度は 0.0001mm。
 * @param {Array} components [{ref, x, y, layer?, side?, rotation?, type}]
 *   layer/side: 'top' | 'bottom' / 'T' | 'B'
 *   rotation: 度 (反時計回り)
 * @returns {string} CSV テキスト
 */
export function generatePickAndPlace(components) {
    const rows = [];
    rows.push(csvRow(['Designator', 'Mid X', 'Mid Y', 'Layer', 'Rotation']));

    for (const c of components || []) {
        if (c.type === 'mech') continue;
        // SMD のみが組み立て対象だが、CPL 自体は THT も含めて出すサービスが多い。
        // pad に SMD が一つもない (THT のみ) 部品は除外したい場合 caller 側で
        // フィルタすればよい。
        const layer = (c.side === 'B' || c.side === 'bottom' || c.layer === 'B.Cu') ? 'B' : 'T';
        const rot = ((c.rotation || 0) % 360 + 360) % 360;
        const x = Number(c.x) || 0;
        const y = Number(c.y) || 0;
        rows.push(csvRow([
            c.ref,
            `${x.toFixed(4)}mm`,
            `${y.toFixed(4)}mm`,
            layer,
            `${rot.toFixed(2)}`
        ]));
    }

    return rows.join('\r\n') + '\r\n';
}

// ── 全ファイル生成 ─────────────────────────────
/**
 * BOM と CPL の両方を生成して { fileName: text } で返す。
 *
 * @param {object} pcbData {
 *   meta: { boardName },
 *   components: [...],
 * }
 */
export function generateAllBOM(pcbData) {
    const meta = pcbData.meta || {};
    const baseName = (meta.boardName || 'KeybordStudio_PCB').replace(/[\\/:*?"<>|]/g, '_');
    const components = assignDesignators(pcbData.components || []);
    return {
        [`${baseName}-BOM.csv`]:        generateBOM(components),
        [`${baseName}-PickAndPlace.csv`]: generatePickAndPlace(components),
        // KiCad / EAGLE 互換 (一部サービスで .pos が必要)
        [`${baseName}-top-pos.csv`]:   generatePickAndPlace(components.filter(c =>
            (c.side || c.layer) !== 'B' && (c.side || c.layer) !== 'B.Cu' && c.side !== 'bottom'
        ))
    };
}

/**
 * 統計情報 (BOM 行数 / 部品種類 / SMD 部品数) を返す。
 */
export function bomStats(pcbData) {
    const components = pcbData.components || [];
    const groups = new Map();
    let smd = 0;
    for (const c of components) {
        if (c.type === 'mech') continue;
        const fpId = c.footprintId || c.type;
        groups.set(fpId, (groups.get(fpId) || 0) + 1);
        // pad に drill が 0 のものがあれば SMD と推定
        if (c.footprint && c.footprint.pads) {
            const hasSmd = c.footprint.pads.some(p => !p.drill);
            if (hasSmd) smd++;
        }
    }
    return {
        totalComponents: components.length,
        uniqueParts: groups.size,
        smdCount: smd,
        groups: [...groups.entries()].map(([k, v]) => ({ footprint: k, count: v }))
    };
}

export default generateAllBOM;
