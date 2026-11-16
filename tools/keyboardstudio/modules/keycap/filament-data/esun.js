// =============================================
// eSun filament TDS module
// =============================================
// ソース: https://www.esun3d.com/uploads/  (各製品 TDS PDF)

export default {
    key: 'esun',
    name: 'eSun',
    url: 'https://www.esun3d.com/products/',
    materials: {
        // ── PLA 系 ──────────────────────────────────
        pla: {
            id: 'pla', name: 'ePLA+', category: 'pla',
            density: 1.24, price_jp: 3200, price_us: 23,
            // ePLA+ TDS V4.0: σ_y=63MPa, σ_u=65MPa, E=3.4GPa, Charpy 7.5 kJ/m²
            tds: { E: 3400, yieldMPa: 63, ultimateMPa: 65, compRatio: 1.4, layerAdhesion: 0.72, brittleness: 0.65,
                printTempC: [205, 225], bedTempC: [25, 60] }
        },
        pla_hp: {
            id: 'pla_hp', name: 'eHP-PLA', category: 'pla',
            density: 1.24, price_jp: 3800, price_us: 28,
            // High-performance PLA — 高耐熱グレード
            tds: { E: 3600, yieldMPa: 65, ultimateMPa: 68, compRatio: 1.4, layerAdhesion: 0.70, brittleness: 0.78,
                printTempC: [220, 240], bedTempC: [40, 60] }
        },
        pla_matte: {
            id: 'pla_matte', name: 'ePLA-Matte', category: 'pla',
            density: 1.21, price_jp: 3500, price_us: 25,
            tds: { E: 2000, yieldMPa: 22, ultimateMPa: 28, compRatio: 1.5, layerAdhesion: 0.75, brittleness: 0.40,
                printTempC: [195, 225], bedTempC: [25, 60] }
        },
        pla_silk: {
            id: 'pla_silk', name: 'eSilk-PLA', category: 'pla',
            density: 1.27, price_jp: 3800, price_us: 28,
            tds: { E: 2700, yieldMPa: 36, ultimateMPa: 44, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.75,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_wood: {
            id: 'pla_wood', name: 'ePLA-Wood', category: 'pla',
            density: 1.22, price_jp: 4200, price_us: 30,
            tds: { E: 2400, yieldMPa: 28, ultimateMPa: 35, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.78,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_marble: {
            id: 'pla_marble', name: 'ePLA-Marble', category: 'pla',
            density: 1.30, price_jp: 4200, price_us: 30,
            tds: { E: 2900, yieldMPa: 30, ultimateMPa: 38, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.82,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_glow: {
            id: 'pla_glow', name: 'ePLA-Glow', category: 'pla',
            density: 1.42, price_jp: 4500, price_us: 32,
            tds: { E: 2700, yieldMPa: 30, ultimateMPa: 36, compRatio: 1.4, layerAdhesion: 0.52, brittleness: 0.82,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },

        // ── PETG / TPU ─────────────────────────────
        petg: {
            id: 'petg', name: 'ePETG+', category: 'petg',
            density: 1.27, price_jp: 3200, price_us: 23,
            tds: { E: 1500, yieldMPa: 50, ultimateMPa: 53, compRatio: 1.5, layerAdhesion: 0.80, brittleness: 0.35,
                printTempC: [230, 250], bedTempC: [70, 90] }
        },
        petg_silk: {
            id: 'petg_silk', name: 'eSilk-PETG', category: 'petg',
            density: 1.27, price_jp: 3800, price_us: 28,
            tds: { E: 1500, yieldMPa: 47, ultimateMPa: 50, compRatio: 1.5, layerAdhesion: 0.78, brittleness: 0.38,
                printTempC: [230, 250], bedTempC: [70, 90] }
        },

        // ── ABS / ASA ───────────────────────────────
        abs: {
            id: 'abs', name: 'eABS+', category: 'abs',
            density: 1.04, price_jp: 3200, price_us: 23,
            tds: { E: 2000, yieldMPa: 40, ultimateMPa: 45, compRatio: 1.5, layerAdhesion: 0.60, brittleness: 0.45,
                printTempC: [220, 260], bedTempC: [90, 110] }
        },
        asa: {
            id: 'asa', name: 'eASA', category: 'asa',
            density: 1.07, price_jp: 4000, price_us: 28,
            tds: { E: 2000, yieldMPa: 45, ultimateMPa: 48, compRatio: 1.5, layerAdhesion: 0.66, brittleness: 0.50,
                printTempC: [240, 260], bedTempC: [90, 110] }
        },

        // ── Nylon ───────────────────────────────────
        nylon: {
            id: 'nylon', name: 'eNylon', category: 'nylon',
            density: 1.13, price_jp: 7000, price_us: 50,
            tds: { E: 1700, yieldMPa: 45, ultimateMPa: 70, compRatio: 1.4, layerAdhesion: 0.85, brittleness: 0.20,
                printTempC: [250, 280], bedTempC: [25, 80] }
        },
        nylon_cf: {
            id: 'nylon_cf', name: 'eNylon-CF', category: 'nylon',
            density: 1.18, price_jp: 9500, price_us: 70,
            tds: { E: 5500, yieldMPa: 90, ultimateMPa: 110, compRatio: 1.4, layerAdhesion: 0.55, brittleness: 0.35,
                printTempC: [270, 290], bedTempC: [25, 80] }
        },

        // ── TPU ─────────────────────────────────────
        tpu_95a: {
            id: 'tpu_95a', name: 'eTPU-95A', category: 'tpu',
            density: 1.21, price_jp: 5000, price_us: 35,
            tds: { E: 26, yieldMPa: 8, ultimateMPa: 30, compRatio: 1.0, layerAdhesion: 0.82, brittleness: 0.05,
                printTempC: [220, 235], bedTempC: [25, 60] }
        }
    }
};
