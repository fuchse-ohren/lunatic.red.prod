// =============================================
// Overture filament TDS module
// =============================================
// ソース: https://overture3d.com/pages/data-sheet  + 製品ページ TDS

export default {
    key: 'overture',
    name: 'Overture',
    url: 'https://overture3d.com/pages/data-sheet',
    materials: {
        pla: {
            id: 'pla', name: 'Overture PLA', category: 'pla',
            density: 1.24, price_jp: 2800, price_us: 19,
            tds: { E: 2800, yieldMPa: 50, ultimateMPa: 56, compRatio: 1.4, layerAdhesion: 0.70, brittleness: 0.78,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_plus: {
            id: 'pla_plus', name: 'Overture PLA+', category: 'pla',
            density: 1.24, price_jp: 3200, price_us: 22,
            tds: { E: 3000, yieldMPa: 58, ultimateMPa: 63, compRatio: 1.4, layerAdhesion: 0.72, brittleness: 0.72,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_matte: {
            id: 'pla_matte', name: 'Overture Matte PLA', category: 'pla',
            density: 1.22, price_jp: 2800, price_us: 19,
            tds: { E: 2300, yieldMPa: 27, ultimateMPa: 32, compRatio: 1.5, layerAdhesion: 0.72, brittleness: 0.50,
                printTempC: [195, 225], bedTempC: [25, 60] }
        },
        pla_silk: {
            id: 'pla_silk', name: 'Overture Silk PLA', category: 'pla',
            density: 1.27, price_jp: 3500, price_us: 25,
            tds: { E: 2600, yieldMPa: 33, ultimateMPa: 41, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.78,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },

        // ── PETG / TPU ─────────────────────────────
        petg: {
            id: 'petg', name: 'Overture PETG', category: 'petg',
            density: 1.27, price_jp: 2800, price_us: 18,
            tds: { E: 1700, yieldMPa: 47, ultimateMPa: 52, compRatio: 1.5, layerAdhesion: 0.78, brittleness: 0.32,
                printTempC: [230, 260], bedTempC: [70, 80] }
        },
        petg_cf: {
            id: 'petg_cf', name: 'Overture PETG Carbon Fiber', category: 'petg',
            density: 1.30, price_jp: 4800, price_us: 35,
            tds: { E: 3300, yieldMPa: 50, ultimateMPa: 55, compRatio: 1.3, layerAdhesion: 0.55, brittleness: 0.55,
                printTempC: [240, 260], bedTempC: [70, 80] }
        },

        // ── ABS / ASA ──────────────────────────────
        abs: {
            id: 'abs', name: 'Overture ABS', category: 'abs',
            density: 1.04, price_jp: 3000, price_us: 21,
            tds: { E: 2100, yieldMPa: 38, ultimateMPa: 42, compRatio: 1.5, layerAdhesion: 0.60, brittleness: 0.45,
                printTempC: [240, 260], bedTempC: [90, 110] }
        },
        asa: {
            id: 'asa', name: 'Overture ASA', category: 'asa',
            density: 1.07, price_jp: 4500, price_us: 31,
            tds: { E: 2000, yieldMPa: 45, ultimateMPa: 48, compRatio: 1.5, layerAdhesion: 0.66, brittleness: 0.48,
                printTempC: [240, 260], bedTempC: [90, 110] }
        },

        tpu_95a: {
            id: 'tpu_95a', name: 'Overture TPU 95A', category: 'tpu',
            density: 1.21, price_jp: 5000, price_us: 32,
            tds: { E: 26, yieldMPa: 8, ultimateMPa: 32, compRatio: 1.0, layerAdhesion: 0.82, brittleness: 0.05,
                printTempC: [220, 240], bedTempC: [25, 60] }
        }
    }
};
