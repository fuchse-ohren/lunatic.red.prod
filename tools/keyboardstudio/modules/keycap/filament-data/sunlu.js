// =============================================
// Sunlu filament TDS module
// =============================================
// ソース: https://www.sunlu.com/pages/spec-sheet  + 各製品データシート

export default {
    key: 'sunlu',
    name: 'Sunlu',
    url: 'https://www.sunlu.com/pages/spec-sheet',
    materials: {
        pla: {
            id: 'pla', name: 'Sunlu PLA', category: 'pla',
            density: 1.24, price_jp: 2500, price_us: 19,
            tds: { E: 2900, yieldMPa: 56, ultimateMPa: 60, compRatio: 1.4, layerAdhesion: 0.68, brittleness: 0.80,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_plus: {
            id: 'pla_plus', name: 'Sunlu PLA+', category: 'pla',
            density: 1.24, price_jp: 2800, price_us: 22,
            tds: { E: 3000, yieldMPa: 60, ultimateMPa: 65, compRatio: 1.4, layerAdhesion: 0.72, brittleness: 0.72,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_matte: {
            id: 'pla_matte', name: 'Sunlu PLA Matte', category: 'pla',
            density: 1.22, price_jp: 2500, price_us: 19,
            tds: { E: 2200, yieldMPa: 26, ultimateMPa: 30, compRatio: 1.5, layerAdhesion: 0.72, brittleness: 0.50,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_silk: {
            id: 'pla_silk', name: 'Sunlu PLA Silk', category: 'pla',
            density: 1.27, price_jp: 3000, price_us: 22,
            tds: { E: 2600, yieldMPa: 33, ultimateMPa: 41, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.78,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_marble: {
            id: 'pla_marble', name: 'Sunlu PLA Marble', category: 'pla',
            density: 1.29, price_jp: 3200, price_us: 24,
            tds: { E: 3000, yieldMPa: 30, ultimateMPa: 38, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.85,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_meta: {
            id: 'pla_meta', name: 'Sunlu PLA Meta', category: 'pla',
            density: 1.22, price_jp: 3500, price_us: 26,
            // メタリック系
            tds: { E: 2700, yieldMPa: 35, ultimateMPa: 42, compRatio: 1.4, layerAdhesion: 0.55, brittleness: 0.78,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },

        // ── PETG ───────────────────────────────────
        petg: {
            id: 'petg', name: 'Sunlu PETG', category: 'petg',
            density: 1.27, price_jp: 2500, price_us: 18,
            tds: { E: 1600, yieldMPa: 45, ultimateMPa: 50, compRatio: 1.5, layerAdhesion: 0.80, brittleness: 0.35,
                printTempC: [230, 260], bedTempC: [70, 80] }
        },
        petg_cf: {
            id: 'petg_cf', name: 'Sunlu PETG Carbon Fiber', category: 'petg',
            density: 1.30, price_jp: 4500, price_us: 32,
            tds: { E: 3200, yieldMPa: 48, ultimateMPa: 55, compRatio: 1.3, layerAdhesion: 0.55, brittleness: 0.55,
                printTempC: [240, 260], bedTempC: [70, 80] }
        },

        // ── ABS / ASA ──────────────────────────────
        abs: {
            id: 'abs', name: 'Sunlu ABS', category: 'abs',
            density: 1.04, price_jp: 2800, price_us: 20,
            tds: { E: 2000, yieldMPa: 42, ultimateMPa: 46, compRatio: 1.5, layerAdhesion: 0.62, brittleness: 0.45,
                printTempC: [220, 240], bedTempC: [90, 110] }
        },
        asa: {
            id: 'asa', name: 'Sunlu ASA', category: 'asa',
            density: 1.07, price_jp: 3500, price_us: 25,
            tds: { E: 2000, yieldMPa: 42, ultimateMPa: 46, compRatio: 1.5, layerAdhesion: 0.65, brittleness: 0.50,
                printTempC: [240, 260], bedTempC: [90, 110] }
        },

        // ── TPU ─────────────────────────────────────
        tpu_95a: {
            id: 'tpu_95a', name: 'Sunlu TPU 95A', category: 'tpu',
            density: 1.21, price_jp: 4000, price_us: 28,
            tds: { E: 26, yieldMPa: 8, ultimateMPa: 32, compRatio: 1.0, layerAdhesion: 0.80, brittleness: 0.05,
                printTempC: [220, 240], bedTempC: [25, 60] }
        }
    }
};
