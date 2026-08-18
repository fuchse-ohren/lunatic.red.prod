// =============================================
// KeybordStudio V1 — Stem structural analysis
// modules/keycap/stem-fea.js
// =============================================
// 実機キーキャップのステム部の応力解析。スイッチ着脱・押下・横荷重・装着時の
// 押し広げに対する静的応力と安全率 (FoS) を算出する。
//
// 解析対象:
//   1. Pull-off  (引抜き — テンション軸応力)
//   2. Press     (押下底突き — 圧縮応力)
//   3. Side-load (横荷重 — 曲げ応力 σ = M·c/I)
//   4. Insertion (装着時のフープ応力 — 内圧拡張)
//   5. Layer adh (FDM の Z 方向層間接着力 — 層間剥離破断)
//
// 使い方:
//   import { analyzeStem, MATERIALS, LOAD_PROFILES } from './stem-fea.js';
//   const result = analyzeStem({ material:'pla', stemType:'mx', stemDiameter:5.5, ... });
//   result.tests   → 各試験項目の応力 / SF / 状態
//   result.overall → 総合スコア (0-100) / 等級 (A-F) / 改善提案
//
// 単位: 応力 = MPa = N/mm², 力 = N, 長さ = mm

// ── 材料データ (3D 印刷フィラメント / 樹脂の代表値) ───────────
//   E             : ヤング率 (MPa)
//   yieldMPa      : 引張降伏応力 (室温)
//   ultimateMPa   : 引張破断応力
//   compRatio     : 圧縮 / 引張比 (熱可塑性樹脂は圧縮側が強い)
//   layerAdhesion : FDM の Z 方向接着強度比 (1.0 = isotropic)
//   brittleness   : 0=粘り強い, 1=極脆性 (Charpy 衝撃値の逆相関)
// 参考: NatureWorks Ingeo PLA datasheet, BASF Ultrafuse, Anycubic Standard Resin
//
// MATERIALS は「素材タイプ別の代表値」(generic). ベンダー固有の値は
// FILAMENT_DATASHEETS から検索される。
export const MATERIALS = Object.freeze({
    pla:        { name: 'PLA (generic)',     E: 3500, yieldMPa: 50, ultimateMPa: 60, compRatio: 1.4, layerAdhesion: 0.70, brittleness: 0.85, density: 1.24 },
    pla_matte:  { name: 'PLA Matte (generic)', E: 2200, yieldMPa: 28, ultimateMPa: 32, compRatio: 1.4, layerAdhesion: 0.75, brittleness: 0.55, density: 1.22 },
    abs:        { name: 'ABS (generic)',     E: 2000, yieldMPa: 40, ultimateMPa: 45, compRatio: 1.5, layerAdhesion: 0.60, brittleness: 0.45, density: 1.04 },
    petg:       { name: 'PETG (generic)',    E: 2000, yieldMPa: 50, ultimateMPa: 55, compRatio: 1.5, layerAdhesion: 0.80, brittleness: 0.40, density: 1.27 },
    nylon:      { name: 'Nylon PA12 (generic)', E: 1700, yieldMPa: 45, ultimateMPa: 70, compRatio: 1.4, layerAdhesion: 0.85, brittleness: 0.20, density: 1.01 },
    asa:        { name: 'ASA (generic)',     E: 2100, yieldMPa: 42, ultimateMPa: 48, compRatio: 1.5, layerAdhesion: 0.65, brittleness: 0.50, density: 1.07 },
    resin:      { name: 'Standard Resin',    E: 2500, yieldMPa: 45, ultimateMPa: 60, compRatio: 1.3, layerAdhesion: 0.95, brittleness: 0.75, density: 1.18 },
    tough_resin:{ name: 'Tough Resin',       E: 1700, yieldMPa: 35, ultimateMPa: 45, compRatio: 1.4, layerAdhesion: 0.95, brittleness: 0.30, density: 1.10 }
});

// ── ベンダー別データシート ──────────────────────────────
// データは modules/keycap/filament-data/ 配下のベンダー別モジュールに分割管理。
// 全 7 ベンダー × 各全製品 (合計 80+ 種) の TDS が登録されている。
//
// 新規ベンダー / 材料の追加は filament-data/<vendor>.js を新規作成し
// filament-data/index.js の import に追加するだけで全システムに反映。
import {
    FILAMENT_VENDORS as FILAMENT_DATASHEETS_RAW,
    getTDS as _getTDSFromDB,
    listVendors as _listVendorsFromDB
} from './filament-data/index.js';

export const FILAMENT_DATASHEETS = FILAMENT_DATASHEETS_RAW;

/**
 * ベンダー + 材料 → 機械物性を解決。
 * 1. 完全マッチ: FILAMENT_DATASHEETS[vendor].materials[material].tds
 * 2. ベンダー未登録 → generic 系で材料種マッチ
 * 3. 材料も未マッチ → MATERIALS.pla
 *
 * 戻り値は MATERIALS と同じ shape ({ name, E, yieldMPa, ... }) +
 * メタ情報 (_vendor, _vendorKey, _datasheetUrl, _isGeneric)。
 */
export function getFilamentProps(vendor, material) {
    return _getTDSFromDB(vendor, material);
}

/**
 * 登録済みのベンダーキー一覧。
 */
export function listVendors() {
    return _listVendorsFromDB();
}

// ── ステム穴の幾何 (軸間規格) ──────────────────────────
// crossW × crossT の直交十字。Cherry MX = 4.00 × 1.27 mm が公差含み標準。
const STEM_HOLES = Object.freeze({
    mx:    { crossW: 4.00, crossT: 1.27 },
    choc:  { crossW: 3.00, crossT: 1.20 },
    alps:  { crossW: 4.50, crossT: 2.20 },
    topre: { crossW: 4.00, crossT: 1.27 }
});

function holeOf(stemType) {
    return STEM_HOLES[stemType] || STEM_HOLES.mx;
}

// 十字穴の正味断面積 (重なり中心を 1 回引く)
function holeArea(stemType) {
    const h = holeOf(stemType);
    return 2 * (h.crossW * h.crossT) - (h.crossT * h.crossT);
}

// ── ステム壁断面積 — 引張・圧縮の有効断面 ──────────
// 円柱ステム (径 D) − 内部十字穴
export function stemWallArea(stemDiameter, stemType) {
    const r = stemDiameter / 2;
    const Aouter = Math.PI * r * r;
    const Ahole = holeArea(stemType);
    return Math.max(0.5, Aouter - Ahole);   // mm²
}

// ── 二次断面モーメント (曲げ用) ──────────────────────
// 外円 - 内十字 (内十字は十字 2 本の梁を直交合成、中央重複を補正)
export function stemMomentOfInertia(stemDiameter, stemType) {
    const r = stemDiameter / 2;
    const Iouter = Math.PI * Math.pow(r, 4) / 4;
    const h = holeOf(stemType);
    // 横梁: 幅 crossW, 高さ crossT → I = b·h³/12
    const I_strip = h.crossW * Math.pow(h.crossT, 3) / 12;
    // 直交 2 本の合成、中央 crossT × crossT の重複は 1 回減算
    const Iaxis = 2 * I_strip - Math.pow(h.crossT, 4) / 12;
    return Math.max(0.01, Iouter - Iaxis);
}

// ── ローディングプロファイル — 想定 peak 力 (N) ──────
// 通常タイピング: ピーク約 0.8kgf。ゲーミング: 連打で 2-3 倍。エクストリーム
// (落下・誤操作): 設計上の上限想定。
// 参考: Cherry MX HyperGlide 設計仕様, Topre 静電容量 力曲線
export const LOAD_PROFILES = Object.freeze({
    normal:    { pullOffN:  8, pressPeakN:  8, sideN: 1.2, insertionN: 12 },
    gaming:    { pullOffN: 12, pressPeakN: 15, sideN: 2.5, insertionN: 18 },
    extreme:   { pullOffN: 20, pressPeakN: 25, sideN: 4.0, insertionN: 25 }
});

// プロファイル別の代表的な R3 高さ (mm)
const PROFILE_HEIGHT = { cherry: 9.4, oem: 11.9, sa: 16.5, xda: 9.0, dsa: 7.4, custom: 9.5 };

// ── メイン: 構造解析を実行 ────────────────────────
/**
 * @param {object} params
 *   stemDiameter, stemType, stemClearance, wallThickness, stemHeight, capHeight,
 *   profile, material, vendor, enableRibs, boxStem, uSize, loadProfile
 *
 *   material: 素材タイプキー ('pla' | 'pla_matte' | 'abs' | 'petg' | 'asa' | 'nylon' | 'resin' | 'tough_resin' | 'pla_cf' | 'pa_cf' | 'pla_tough')
 *   vendor:   ベンダーキー (省略可、省略時は MATERIALS の generic 値)
 *
 * @returns {object} {material, geometry, loads, tests, overall}
 */
export function analyzeStem(params = {}) {
    // ベンダー指定があれば FILAMENT_DATASHEETS から優先取得。
    // 樹脂 (resin / tough_resin) はベンダー DB 対象外なので MATERIALS から取得。
    const matKey = params.material || 'pla';
    const isResinKey = (matKey === 'resin' || matKey === 'tough_resin');
    let mat;
    if (params.vendor && !isResinKey) {
        mat = getFilamentProps(params.vendor, matKey);
        // generic フォールバックされた場合 (ベンダー未登録) も _isGeneric: true で続行
    } else {
        mat = MATERIALS[matKey];
    }
    if (!mat) mat = MATERIALS.pla;
    const stemType   = params.stemType   || 'mx';
    const stemD      = +params.stemDiameter || 5.5;
    const wall       = +params.wallThickness || 1.5;
    const profile    = params.profile || 'cherry';
    const capH       = +params.capHeight || PROFILE_HEIGHT[profile] || 9.4;
    const stemH      = +params.stemHeight || Math.max(2.5, capH - wall - 0.5);
    const stemClear  = +params.stemClearance || 0.30;
    const enableRibs = !!params.enableRibs;
    const boxStem    = !!params.boxStem;
    const uSize      = +params.uSize || 1.0;
    const loadKey    = params.loadProfile || 'normal';
    const loads      = LOAD_PROFILES[loadKey] || LOAD_PROFILES.normal;

    // ─── Geometry ───────────────────
    const A = stemWallArea(stemD, stemType);          // mm²
    const I = stemMomentOfInertia(stemD, stemType);   // mm⁴
    const r = stemD / 2;
    const A_hole = holeArea(stemType);

    // ─── Reinforcement multipliers ──
    // 補強リブ: 周辺 4 リブで横荷重耐性が上がる (実験的に +25% 程度)
    // BOX ステム: ステム周囲を矩形壁で囲い、垂直方向の捻れ抑制 (+40%)
    const ribFactor = enableRibs ? 1.25 : 1.0;
    const boxFactor = boxStem    ? 1.40 : 1.0;
    const reinforce = ribFactor * boxFactor;
    // 大型 (2u 以上) はキャップ自体のたわみが増し、ピーク応力が増す
    const sizeFactor = uSize >= 2.0 ? (1.0 + 0.08 * (uSize - 1)) : 1.0;

    // ─── Effective material props (FDM derating × reinforce) ──
    const isResin = (params.material === 'resin' || params.material === 'tough_resin');
    const fdmDerate = isResin ? 1.0 : mat.layerAdhesion;
    const yield_eff_T = mat.yieldMPa * fdmDerate * reinforce;
    const yield_eff_C = mat.yieldMPa * mat.compRatio * fdmDerate * reinforce;
    const ult_eff = mat.ultimateMPa * fdmDerate * reinforce;

    // ─── 1. 引抜き (Pull-off) ─────────────
    // F → 軸テンション on stem wall area
    const F_pull = loads.pullOffN * sizeFactor;
    const σ_pull = F_pull / A;                          // MPa
    const SF_pull = yield_eff_T / σ_pull;

    // ─── 2. 押下ピーク (Press / bottom-out) ─────
    const F_press = loads.pressPeakN * sizeFactor;
    const σ_press = F_press / A;                        // 圧縮応力
    const SF_press = yield_eff_C / σ_press;

    // ─── 3. 横荷重曲げ (Side-load bending) ─────
    // F が cap 上面で横方向、レバーアーム = capH + stemH/2
    const arm = capH + stemH * 0.5;                     // mm
    const M = loads.sideN * arm * sizeFactor;           // N·mm
    const σ_bend = (M * r) / I;                         // σ = M·c/I (c = r 外周)
    const SF_bend = yield_eff_T / σ_bend;

    // ─── 4. 装着時 hoop 応力 ──────────────────
    // 公差負方向: stemClearance < 0.05mm の場合、スイッチ post (公称 ~5.50mm
    // 含む) との干渉でステム壁が外側に押し広げられる。
    // 過盈 (interference) δ = max(0, 0.05 - stemClearance) [mm]
    // 薄肉円筒の hoop 応力近似: σ_h = E·δ/r
    const δ = Math.max(0, 0.05 - stemClear);
    const σ_hoop = (mat.E * δ) / r;                     // MPa
    const SF_hoop = (σ_hoop > 1e-3) ? (ult_eff / σ_hoop) : 50;

    // ─── 5. 層間接着 (FDM only) ───────────────
    // FDM 印刷で cap 上面 + ステム接合部は水平層界面 → Z 方向の引張応力で剥離
    let σ_adh = 0, SF_adh = Infinity;
    if (!isResin) {
        const adhStrength = mat.ultimateMPa * mat.layerAdhesion * 0.6;   // 接着面の追加 derating
        σ_adh = F_pull / A;
        SF_adh = adhStrength / σ_adh;
    }

    // ─── 試験結果配列 ─────────────────────────
    const tests = [
        { id: 'pullOff',   jaName: '引抜き荷重',  enName: 'Pull-off',     loadN: F_pull,        stress: σ_pull,  sf: SF_pull,  yield: yield_eff_T, kind: 'tension' },
        { id: 'press',     jaName: '押下底突き',  enName: 'Press peak',   loadN: F_press,       stress: σ_press, sf: SF_press, yield: yield_eff_C, kind: 'compression' },
        { id: 'sideLoad',  jaName: '横荷重曲げ',  enName: 'Side bend',    loadN: loads.sideN,   stress: σ_bend,  sf: SF_bend,  yield: yield_eff_T, kind: 'bending' },
        { id: 'insertion', jaName: '装着時膨張',  enName: 'Insertion',    loadN: 0,             stress: σ_hoop,  sf: SF_hoop,  yield: ult_eff,     kind: 'hoop' },
        { id: 'layerAdh',  jaName: '層間接着',    enName: 'Layer adh.',   loadN: F_pull,        stress: σ_adh,   sf: SF_adh,   yield: mat.ultimateMPa * mat.layerAdhesion * 0.6, kind: 'tension', skip: isResin }
    ];

    // 状態判定: SF >= 3 安全 / 1.5-3 警告 / <1.5 危険
    for (const t of tests) {
        if (t.skip) { t.status = 'na'; continue; }
        if (!isFinite(t.sf)) { t.status = 'na'; continue; }
        if (t.sf >= 3)        t.status = 'pass';
        else if (t.sf >= 1.5) t.status = 'warn';
        else                  t.status = 'fail';
    }

    // ─── 総合スコア ─────────────────────────
    const consideredTests = tests.filter(t => !t.skip && isFinite(t.sf));
    const minSF = consideredTests.length
        ? Math.min(...consideredTests.map(t => t.sf))
        : 0;
    // SF=4 → 100, SF=2 → 50, SF=0 → 0 (linear, clamped)
    const score = Math.max(0, Math.min(100, Math.round(minSF * 25)));
    const grade = score >= 85 ? 'A'
                : score >= 70 ? 'B'
                : score >= 50 ? 'C'
                : score >= 30 ? 'D'
                : 'F';

    // ─── 改善提案 ─────────────────────────
    const recs = [];
    for (const t of tests) {
        if (t.status !== 'fail' && t.status !== 'warn') continue;
        if (t.id === 'pullOff' || t.id === 'press' || t.id === 'layerAdh') {
            recs.push({
                level: t.status === 'fail' ? 'err' : 'warn',
                ja: `${t.jaName}: 安全率 ${t.sf.toFixed(2)} — 壁厚 (現在 ${wall.toFixed(2)}mm) を増やすか、ステム径 (現在 ${stemD.toFixed(2)}mm) を 0.5-1.0mm 大きくしてください。`,
                en: `${t.enName}: SF ${t.sf.toFixed(2)} — increase wall thickness (currently ${wall.toFixed(2)}mm) or stem diameter (${stemD.toFixed(2)}mm).`
            });
        }
        if (t.id === 'sideLoad') {
            recs.push({
                level: t.status === 'fail' ? 'err' : 'warn',
                ja: `${t.jaName}: 安全率 ${t.sf.toFixed(2)} — 補強リブを ON にする、BOX ステムを使う、または stem 径を増やしてください。`,
                en: `${t.enName}: SF ${t.sf.toFixed(2)} — enable reinforcement ribs, use BOX stem, or increase stem diameter.`
            });
        }
        if (t.id === 'insertion') {
            recs.push({
                level: t.status === 'fail' ? 'err' : 'warn',
                ja: `${t.jaName}: ステムクリアランス (現在 ${stemClear.toFixed(2)}mm) を 0.05mm 以上に増やしてください。`,
                en: `${t.enName}: Increase stem clearance (currently ${stemClear.toFixed(2)}mm) to 0.05mm or more.`
            });
        }
    }
    if (mat.brittleness > 0.7 && score < 60) {
        recs.push({
            level: 'warn',
            ja: `素材 ${mat.name} は脆性が高く、落下衝撃・繰り返し荷重で破断しやすい。PETG / Nylon / ABS への変更を検討してください。`,
            en: `${mat.name} is brittle — prone to impact failure. Consider PETG / Nylon / ABS for keycaps.`
        });
    }
    if (recs.length === 0) {
        recs.push({
            level: 'info',
            ja: '構造的に問題なし。標準的な使用条件 (' + loadKey + ') では十分な安全率を確保しています。',
            en: 'Structurally sound. Sufficient safety factor for "' + loadKey + '" usage profile.'
        });
    }

    return {
        material: mat,
        geometry: {
            stemDiameter: stemD, stemHeight: stemH, capHeight: capH,
            wallThickness: wall, stemArea_mm2: A,
            momentOfInertia_mm4: I, holeArea_mm2: A_hole,
            reinforcementFactor: reinforce, sizeFactor
        },
        loadProfile: loadKey,
        loads,
        tests,
        overall: { score, grade, minSF, recommendations: recs }
    };
}

// ── 結果を HTML 文字列に整形 (UI 表示用) ──────────────
export function formatResultHTML(result, lang = 'ja') {
    const isJa = lang === 'ja';
    const t = (j, e) => isJa ? j : e;
    const gradeColor = {
        'A': '#69f0ae', 'B': '#9ccc65', 'C': '#ffd54f', 'D': '#ff9800', 'F': '#ff5252'
    };
    const statusIcon = { pass: '✅', warn: '⚠️', fail: '❌', na: '—' };
    const statusColor = { pass: '#69f0ae', warn: '#ffb74d', fail: '#ff5252', na: '#777' };

    const o = result.overall;
    const g = result.geometry;
    let html = '';

    // Header / score
    html += `<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; padding:10px; background:rgba(255,255,255,0.03); border-radius:6px;">`;
    html += `<div>`;
    html += `<div style="font-size:0.7rem; color:#888;">${t('総合評価', 'Overall')}</div>`;
    html += `<div style="font-size:0.85rem; color:#cfd8dc;">${result.material.name} · ${result.loadProfile}</div>`;
    html += `<div style="font-size:0.7rem; color:#888; margin-top:2px;">${t('最小安全率', 'Min SF')} = ${o.minSF.toFixed(2)}</div>`;
    html += `</div>`;
    html += `<div style="text-align:center;">`;
    html += `<div style="font-size:2.2rem; font-weight:bold; color:${gradeColor[o.grade] || '#888'}; line-height:1;">${o.grade}</div>`;
    html += `<div style="font-size:0.7rem; color:#888;">${o.score} / 100</div>`;
    html += `</div>`;
    html += `</div>`;

    // Tests table
    html += `<table style="width:100%; font-size:0.72rem; border-collapse:collapse;">`;
    html += `<thead><tr style="border-bottom:1px solid #444; color:#80deea;">`;
    html += `<th style="text-align:left; padding:4px;">${t('項目', 'Test')}</th>`;
    html += `<th style="text-align:right; padding:4px;">${t('荷重', 'Load')}</th>`;
    html += `<th style="text-align:right; padding:4px;">${t('応力', 'Stress')}</th>`;
    html += `<th style="text-align:right; padding:4px;">${t('降伏', 'Yield')}</th>`;
    html += `<th style="text-align:right; padding:4px;">SF</th>`;
    html += `<th style="text-align:center; padding:4px;">${t('判定', 'OK?')}</th>`;
    html += `</tr></thead><tbody>`;
    for (const test of result.tests) {
        const name = isJa ? test.jaName : test.enName;
        const sfStr = test.skip ? '—' : (isFinite(test.sf) ? test.sf.toFixed(2) : '—');
        const stressStr = test.skip ? '—' : test.stress.toFixed(2);
        const yieldStr = test.skip ? '—' : test.yield.toFixed(1);
        const loadStr = test.loadN > 0 ? test.loadN.toFixed(1) + 'N' : '—';
        html += `<tr style="border-bottom:1px solid #2a2a2a; color:${statusColor[test.status]};">`;
        html += `<td style="padding:4px 4px;">${name}</td>`;
        html += `<td style="padding:4px; text-align:right; font-family:monospace;">${loadStr}</td>`;
        html += `<td style="padding:4px; text-align:right; font-family:monospace;">${stressStr} MPa</td>`;
        html += `<td style="padding:4px; text-align:right; font-family:monospace;">${yieldStr} MPa</td>`;
        html += `<td style="padding:4px; text-align:right; font-family:monospace;">${sfStr}</td>`;
        html += `<td style="padding:4px; text-align:center;">${statusIcon[test.status] || '—'}</td>`;
        html += `</tr>`;
    }
    html += `</tbody></table>`;

    // Geometry summary
    html += `<details style="margin-top:8px;"><summary style="cursor:pointer; color:#80deea; font-size:0.72rem;">${t('幾何情報 (展開)', 'Geometry (expand)')}</summary>`;
    html += `<ul style="margin:4px 0 0 0; padding-left:16px; font-size:0.7rem; color:#aaa;">`;
    html += `<li>${t('ステム壁断面積', 'Stem wall area')}: ${g.stemArea_mm2.toFixed(2)} mm²</li>`;
    html += `<li>${t('十字穴断面積', 'Cross hole area')}: ${g.holeArea_mm2.toFixed(2)} mm²</li>`;
    html += `<li>${t('二次断面モーメント', 'Moment of inertia')} I: ${g.momentOfInertia_mm4.toFixed(2)} mm⁴</li>`;
    html += `<li>${t('補強係数', 'Reinforcement factor')}: ×${g.reinforcementFactor.toFixed(2)}</li>`;
    if (g.sizeFactor !== 1.0) html += `<li>${t('大型キー荷重補正', 'Large key load factor')}: ×${g.sizeFactor.toFixed(2)}</li>`;
    html += `</ul></details>`;

    // Recommendations
    html += `<div style="margin-top:8px;">`;
    html += `<div style="font-size:0.72rem; color:#80deea; font-weight:bold; margin-bottom:4px;">${t('改善提案', 'Recommendations')}</div>`;
    html += `<ul style="margin:0; padding:0; list-style:none;">`;
    for (const rec of o.recommendations) {
        const color = rec.level === 'err' ? '#ff5252' : rec.level === 'warn' ? '#ffb74d' : '#69f0ae';
        const icon  = rec.level === 'err' ? '❌' : rec.level === 'warn' ? '⚠️' : 'ℹ️';
        html += `<li style="padding:5px 8px; margin-bottom:3px; background:rgba(255,255,255,0.03); border-left:3px solid ${color}; border-radius:2px; font-size:0.72rem; color:#ddd;">`;
        html += `<span style="margin-right:5px;">${icon}</span>${isJa ? rec.ja : rec.en}`;
        html += `</li>`;
    }
    html += `</ul></div>`;

    return html;
}

export default analyzeStem;
