// =============================================
// Generic filament TDS module
// =============================================
// ベンダー DB に未登録のフィラメントの fallback 用代表値。
// ASTM D638 / ISO 527 の典型的な熱可塑性樹脂の引張試験値を参照。

export default {
    key: 'generic',
    name: 'Generic (Manual)',
    url: null,
    materials: {
        pla: {
            id: 'pla', name: 'Generic PLA', category: 'pla',
            density: 1.24, price_jp: 2500, price_us: 20,
            tds: { E: 3500, yieldMPa: 50, ultimateMPa: 60, compRatio: 1.4, layerAdhesion: 0.70, brittleness: 0.85,
                printTempC: [195, 220], bedTempC: [25, 60] }
        },
        pla_plus: {
            id: 'pla_plus', name: 'Generic PLA+', category: 'pla',
            density: 1.24, price_jp: 3000, price_us: 24,
            tds: { E: 3300, yieldMPa: 55, ultimateMPa: 62, compRatio: 1.4, layerAdhesion: 0.72, brittleness: 0.75,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        pla_matte: {
            id: 'pla_matte', name: 'Generic PLA Matte', category: 'pla',
            density: 1.22, price_jp: 2500, price_us: 20,
            tds: { E: 2200, yieldMPa: 28, ultimateMPa: 32, compRatio: 1.4, layerAdhesion: 0.75, brittleness: 0.55,
                printTempC: [195, 225], bedTempC: [25, 60] }
        },
        pla_silk: {
            id: 'pla_silk', name: 'Generic PLA Silk', category: 'pla',
            density: 1.27, price_jp: 3000, price_us: 24,
            tds: { E: 2600, yieldMPa: 33, ultimateMPa: 40, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.78,
                printTempC: [200, 230], bedTempC: [25, 60] }
        },
        petg: {
            id: 'petg', name: 'Generic PETG', category: 'petg',
            density: 1.27, price_jp: 2500, price_us: 20,
            tds: { E: 2000, yieldMPa: 50, ultimateMPa: 55, compRatio: 1.5, layerAdhesion: 0.80, brittleness: 0.40,
                printTempC: [220, 250], bedTempC: [70, 80] }
        },
        abs: {
            id: 'abs', name: 'Generic ABS', category: 'abs',
            density: 1.04, price_jp: 2500, price_us: 20,
            tds: { E: 2000, yieldMPa: 40, ultimateMPa: 45, compRatio: 1.5, layerAdhesion: 0.60, brittleness: 0.45,
                printTempC: [220, 240], bedTempC: [90, 110] }
        },
        asa: {
            id: 'asa', name: 'Generic ASA', category: 'asa',
            density: 1.07, price_jp: 3000, price_us: 25,
            tds: { E: 2100, yieldMPa: 42, ultimateMPa: 48, compRatio: 1.5, layerAdhesion: 0.65, brittleness: 0.50,
                printTempC: [240, 260], bedTempC: [90, 110] }
        },
        nylon: {
            id: 'nylon', name: 'Generic Nylon', category: 'nylon',
            density: 1.10, price_jp: 6500, price_us: 50,
            tds: { E: 1700, yieldMPa: 45, ultimateMPa: 70, compRatio: 1.4, layerAdhesion: 0.85, brittleness: 0.20,
                printTempC: [250, 280], bedTempC: [25, 80] }
        },
        tpu_95a: {
            id: 'tpu_95a', name: 'Generic TPU 95A', category: 'tpu',
            density: 1.21, price_jp: 4500, price_us: 30,
            tds: { E: 26, yieldMPa: 8, ultimateMPa: 32, compRatio: 1.0, layerAdhesion: 0.82, brittleness: 0.05,
                printTempC: [220, 240], bedTempC: [25, 60] }
        },
        pc: {
            id: 'pc', name: 'Generic PC', category: 'pc',
            density: 1.20, price_jp: 7500, price_us: 60,
            tds: { E: 2300, yieldMPa: 60, ultimateMPa: 70, compRatio: 1.4, layerAdhesion: 0.80, brittleness: 0.15,
                printTempC: [270, 300], bedTempC: [100, 120] }
        }
    }
};
