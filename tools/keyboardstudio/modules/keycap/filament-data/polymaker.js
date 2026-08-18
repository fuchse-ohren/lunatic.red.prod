// =============================================
// Polymaker filament TDS module
// =============================================
// ソース: https://us.polymaker.com/pages/technical-data-sheets
// PolyLite / PolyMax / PolyTerra / PolyMide / PolyFlex 全シリーズ。

export default {
    key: 'polymaker',
    name: 'Polymaker',
    url: 'https://us.polymaker.com/pages/technical-data-sheets',
    materials: {
        // ── PLA 系 ──────────────────────────────────
        pla: {
            id: 'pla', name: 'PolyLite PLA', category: 'pla',
            density: 1.24, price_jp: 3800, price_us: 25,
            tds: { E: 3600, yieldMPa: 60, ultimateMPa: 65, compRatio: 1.4, layerAdhesion: 0.70, brittleness: 0.85,
                printTempC: [190, 230], bedTempC: [25, 60] }
        },
        pla_pro: {
            id: 'pla_pro', name: 'PolyLite PLA Pro', category: 'pla',
            density: 1.21, price_jp: 4200, price_us: 32,
            tds: { E: 2800, yieldMPa: 50, ultimateMPa: 60, compRatio: 1.4, layerAdhesion: 0.78, brittleness: 0.40,
                printTempC: [200, 240], bedTempC: [25, 60] }
        },
        pla_silk: {
            id: 'pla_silk', name: 'PolyLite Silk PLA', category: 'pla',
            density: 1.25, price_jp: 4200, price_us: 30,
            tds: { E: 2600, yieldMPa: 35, ultimateMPa: 42, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.78,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_max: {
            id: 'pla_max', name: 'PolyMax Tough PLA', category: 'pla',
            density: 1.22, price_jp: 5500, price_us: 36,
            // 強化 PLA — Charpy 9 kJ/m², 通常 PLA の 9 倍
            tds: { E: 2700, yieldMPa: 50, ultimateMPa: 64, compRatio: 1.4, layerAdhesion: 0.78, brittleness: 0.30,
                printTempC: [210, 230], bedTempC: [25, 60] }
        },
        pla_matte: {
            id: 'pla_matte', name: 'PolyTerra PLA', category: 'pla',
            density: 1.17, price_jp: 3800, price_us: 25,
            // 衝撃改質型、yield 低めだが靭性高い
            tds: { E: 1700, yieldMPa: 22, ultimateMPa: 27, compRatio: 1.5, layerAdhesion: 0.75, brittleness: 0.40,
                printTempC: [190, 230], bedTempC: [25, 60] }
        },

        // ── PETG / コポリエステル ─────────────────
        petg: {
            id: 'petg', name: 'PolyLite PETG', category: 'petg',
            density: 1.27, price_jp: 3800, price_us: 25,
            tds: { E: 1500, yieldMPa: 30, ultimateMPa: 35, compRatio: 1.5, layerAdhesion: 0.78, brittleness: 0.30,
                printTempC: [220, 250], bedTempC: [70, 80] }
        },
        petg_max: {
            id: 'petg_max', name: 'PolyMax PETG', category: 'petg',
            density: 1.27, price_jp: 5000, price_us: 35,
            tds: { E: 1800, yieldMPa: 40, ultimateMPa: 45, compRatio: 1.5, layerAdhesion: 0.85, brittleness: 0.20,
                printTempC: [230, 260], bedTempC: [70, 80] }
        },

        // ── ABS / ASA ───────────────────────────────
        abs: {
            id: 'abs', name: 'PolyLite ABS', category: 'abs',
            density: 1.04, price_jp: 4000, price_us: 27,
            tds: { E: 2000, yieldMPa: 33, ultimateMPa: 36, compRatio: 1.5, layerAdhesion: 0.62, brittleness: 0.42,
                printTempC: [240, 270], bedTempC: [90, 110] }
        },
        asa: {
            id: 'asa', name: 'PolyLite ASA', category: 'asa',
            density: 1.07, price_jp: 5500, price_us: 36,
            tds: { E: 2000, yieldMPa: 45, ultimateMPa: 50, compRatio: 1.5, layerAdhesion: 0.65, brittleness: 0.45,
                printTempC: [240, 270], bedTempC: [90, 110] }
        },

        // ── Nylon (PolyMide) ────────────────────────
        pa12: {
            id: 'pa12', name: 'PolyMide PA12', category: 'nylon',
            density: 1.01, price_jp: 8500, price_us: 65,
            tds: { E: 1700, yieldMPa: 45, ultimateMPa: 70, compRatio: 1.4, layerAdhesion: 0.85, brittleness: 0.20,
                printTempC: [260, 280], bedTempC: [25, 50] }
        },
        pa12_cf: {
            id: 'pa12_cf', name: 'PolyMide PA12-CF', category: 'nylon',
            density: 1.10, price_jp: 12000, price_us: 90,
            tds: { E: 5500, yieldMPa: 96, ultimateMPa: 110, compRatio: 1.4, layerAdhesion: 0.55, brittleness: 0.30,
                printTempC: [270, 290], bedTempC: [25, 50] }
        },

        // ── TPU / PC ────────────────────────────────
        tpu_95a: {
            id: 'tpu_95a', name: 'PolyFlex TPU 95A', category: 'tpu',
            density: 1.21, price_jp: 6500, price_us: 45,
            tds: { E: 26, yieldMPa: 9, ultimateMPa: 38, compRatio: 1.0, layerAdhesion: 0.85, brittleness: 0.05,
                printTempC: [220, 240], bedTempC: [25, 60] }
        },
        pc: {
            id: 'pc', name: 'PolyLite PC', category: 'pc',
            density: 1.20, price_jp: 7500, price_us: 55,
            tds: { E: 2300, yieldMPa: 60, ultimateMPa: 70, compRatio: 1.4, layerAdhesion: 0.80, brittleness: 0.15,
                printTempC: [270, 300], bedTempC: [100, 120] }
        }
    }
};
