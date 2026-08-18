// =============================================
// Filament data aggregator — unified API
// modules/keycap/filament-data/index.js
// =============================================
// 各ベンダーモジュールを集約して、ベンダー → 材料 → メタ + TDS の検索を提供する。
//
// 公開 API:
//   FILAMENT_VENDORS       全ベンダーマップ (vendor key → vendor object)
//   listVendors()          登録済みベンダー key の配列
//   getVendor(key)         ベンダー object 取得
//   listMaterials(vendor)  そのベンダーの全材料 [{id, name, category, ...}]
//   getMaterial(vendor, material)   個別材料データ取得
//   getTDS(vendor, material)        TDS のみ取得 (FEA 用)
//   getCategories()        全カテゴリリスト ('pla', 'petg', ...)
//   findVendorsByCategory(cat)  指定カテゴリを扱うベンダー一覧
//
// すべての lookup は generic フォールバックあり (未登録ベンダーは generic で代替)。

import bambulab  from './bambulab.js';
import polymaker from './polymaker.js';
import esun      from './esun.js';
import elegoo    from './elegoo.js';
import sunlu     from './sunlu.js';
import overture  from './overture.js';
import generic   from './generic.js';

export const FILAMENT_VENDORS = Object.freeze({
    bambulab, polymaker, esun, elegoo, sunlu, overture, generic
});

export function listVendors() {
    return Object.keys(FILAMENT_VENDORS);
}

export function getVendor(vendorKey) {
    if (!vendorKey) return null;
    return FILAMENT_VENDORS[String(vendorKey).toLowerCase()] || null;
}

/**
 * ベンダーの全材料を配列で返す。
 * @returns {Array<{id, name, category, density, price_jp, price_us, tds, _vendor}>}
 */
export function listMaterials(vendorKey) {
    const v = getVendor(vendorKey);
    if (!v) return [];
    return Object.values(v.materials).map(m => Object.assign({}, m, {
        _vendor: v.name, _vendorKey: v.key
    }));
}

/**
 * 個別材料 (vendor + material). 完全マッチ → generic フォールバック。
 */
export function getMaterial(vendorKey, materialKey) {
    const m = String(materialKey || '').toLowerCase();
    const v = getVendor(vendorKey);
    if (v && v.materials && v.materials[m]) {
        return Object.assign({}, v.materials[m], {
            _vendor: v.name, _vendorKey: v.key, _datasheetUrl: v.url, _isGeneric: false
        });
    }
    // Fallback: generic
    const gen = FILAMENT_VENDORS.generic;
    const fall = gen.materials[m] || gen.materials.pla;
    return Object.assign({}, fall, {
        _vendor: v ? v.name : (vendorKey || 'Generic'),
        _vendorKey: v ? v.key : 'generic',
        _datasheetUrl: null,
        _isGeneric: true
    });
}

/**
 * TDS のみ抽出 (FEA エンジン用、後方互換)。
 * 戻り値は { E, yieldMPa, ultimateMPa, compRatio, layerAdhesion, brittleness, density, name, _vendor, _isGeneric }
 */
export function getTDS(vendorKey, materialKey) {
    const m = getMaterial(vendorKey, materialKey);
    if (!m) return null;
    return {
        name: m.name,
        density: m.density,
        E: m.tds?.E ?? 3000,
        yieldMPa: m.tds?.yieldMPa ?? 50,
        ultimateMPa: m.tds?.ultimateMPa ?? 60,
        compRatio: m.tds?.compRatio ?? 1.4,
        layerAdhesion: m.tds?.layerAdhesion ?? 0.7,
        brittleness: m.tds?.brittleness ?? 0.5,
        printTempC: m.tds?.printTempC,
        bedTempC: m.tds?.bedTempC,
        _vendor: m._vendor,
        _vendorKey: m._vendorKey,
        _datasheetUrl: m._datasheetUrl,
        _isGeneric: m._isGeneric
    };
}

/**
 * 全カテゴリ ('pla', 'petg', ...) を一意に。
 */
export function getCategories() {
    const set = new Set();
    for (const v of Object.values(FILAMENT_VENDORS)) {
        for (const mat of Object.values(v.materials)) {
            if (mat.category) set.add(mat.category);
        }
    }
    return [...set];
}

/**
 * 指定カテゴリ (例: 'pla') を扱うベンダーキーの配列。
 */
export function findVendorsByCategory(category) {
    const cat = String(category || '').toLowerCase();
    const out = [];
    for (const [key, v] of Object.entries(FILAMENT_VENDORS)) {
        if (Object.values(v.materials).some(m => m.category === cat)) {
            out.push(key);
        }
    }
    return out;
}

/**
 * 価格データ (cost panel 用): { vendorKey: { name, materials: { id: { name, density, price_jp, price_us } } } }
 * 旧 filamentData (keycap-app.js) と同じ形を提供して、最小変更で差し替え可能。
 */
export function buildPriceTable() {
    const out = {};
    for (const [key, v] of Object.entries(FILAMENT_VENDORS)) {
        out[key] = { name: v.name, materials: {} };
        for (const [mid, mat] of Object.entries(v.materials)) {
            out[key].materials[mid] = {
                name: mat.name,
                d: mat.density,
                price_jp: mat.price_jp,
                price_us: mat.price_us
            };
        }
    }
    return out;
}

export default FILAMENT_VENDORS;
