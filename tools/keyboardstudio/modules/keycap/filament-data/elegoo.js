// =============================================
// Elegoo filament TDS module
// =============================================
// ソース: https://www.elegoo.com/pages/data-sheet  + 各製品ページ TDS

export default {
    key: 'elegoo',
    name: 'Elegoo',
    url: 'https://www.elegoo.com/collections/filament',
    materials: {
        // ── PLA 系 ──────────────────────────────────
        pla: {
            id: 'pla', name: 'Elegoo PLA', category: 'pla',
            density: 1.24, price_jp: 2200, price_us: 14,
            tds: { E: 3000, yieldMPa: 55, ultimateMPa: 60, compRatio: 1.4, layerAdhesion: 0.70, brittleness: 0.80,
                printTempC: [195, 220], bedTempC: [25, 60] }
        },
        pla_plus: {
            id: 'pla_plus', name: 'Elegoo PLA+', category: 'pla',
            density: 1.24, price_jp: 2800, price_us: 18,
            tds: { E: 3200, yieldMPa: 60, ultimateMPa: 65, compRatio: 1.4, layerAdhesion: 0.72, brittleness: 0.70,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_rapid: {
            id: 'pla_rapid', name: 'Rapid PLA+', category: 'pla',
            density: 1.24, price_jp: 3200, price_us: 21,
            // 高速印刷向けに改質
            tds: { E: 3000, yieldMPa: 58, ultimateMPa: 62, compRatio: 1.4, layerAdhesion: 0.70, brittleness: 0.72,
                printTempC: [200, 240], bedTempC: [25, 60] }
        },
        pla_matte: {
            id: 'pla_matte', name: 'Elegoo PLA Matte', category: 'pla',
            density: 1.22, price_jp: 2800, price_us: 18,
            tds: { E: 2300, yieldMPa: 28, ultimateMPa: 33, compRatio: 1.5, layerAdhesion: 0.75, brittleness: 0.50,
                printTempC: [195, 225], bedTempC: [25, 60] }
        },
        pla_silk: {
            id: 'pla_silk', name: 'Elegoo Silk PLA', category: 'pla',
            density: 1.27, price_jp: 3500, price_us: 22,
            tds: { E: 2600, yieldMPa: 33, ultimateMPa: 41, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.78,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_marble: {
            id: 'pla_marble', name: 'Elegoo Marble PLA', category: 'pla',
            density: 1.29, price_jp: 3500, price_us: 22,
            tds: { E: 3000, yieldMPa: 30, ultimateMPa: 38, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.85,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_glow: {
            id: 'pla_glow', name: 'Elegoo Glow PLA', category: 'pla',
            density: 1.42, price_jp: 3800, price_us: 24,
            tds: { E: 2700, yieldMPa: 30, ultimateMPa: 36, compRatio: 1.4, layerAdhesion: 0.52, brittleness: 0.82,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },

        // ── PETG ────────────────────────────────────
        petg: {
            id: 'petg', name: 'Elegoo PETG', category: 'petg',
            density: 1.27, price_jp: 2400, price_us: 15,
            tds: { E: 1700, yieldMPa: 50, ultimateMPa: 55, compRatio: 1.5, layerAdhesion: 0.78, brittleness: 0.35,
                printTempC: [220, 250], bedTempC: [70, 80] }
        },

        // ── ABS / ASA ───────────────────────────────
        abs: {
            id: 'abs', name: 'Elegoo ABS', category: 'abs',
            density: 1.04, price_jp: 3000, price_us: 19,
            tds: { E: 2100, yieldMPa: 38, ultimateMPa: 42, compRatio: 1.5, layerAdhesion: 0.60, brittleness: 0.45,
                printTempC: [240, 260], bedTempC: [90, 110] }
        },
        asa: {
            id: 'asa', name: 'Elegoo ASA', category: 'asa',
            density: 1.07, price_jp: 3500, price_us: 23,
            tds: { E: 2000, yieldMPa: 42, ultimateMPa: 46, compRatio: 1.5, layerAdhesion: 0.65, brittleness: 0.48,
                printTempC: [240, 260], bedTempC: [90, 110] }
        },

        // ── TPU ─────────────────────────────────────
        tpu_95a: {
            id: 'tpu_95a', name: 'Elegoo TPU 95A', category: 'tpu',
            density: 1.21, price_jp: 4500, price_us: 28,
            tds: { E: 26, yieldMPa: 8, ultimateMPa: 32, compRatio: 1.0, layerAdhesion: 0.82, brittleness: 0.05,
                printTempC: [220, 240], bedTempC: [25, 60] }
        }
    }
};
