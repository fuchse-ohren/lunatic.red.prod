// =============================================
// Bambu Lab filament TDS module
// =============================================
// ソース: https://bambulab.com/en/filament-guide  + 各製品個別 TDS PDF
// 引張試験は ASTM D638, 印刷方向 XY, 24℃。Z 方向引張は layerAdhesion 比に反映。

export default {
    key: 'bambulab',
    name: 'Bambu Lab',
    url: 'https://bambulab.com/en/filament-guide',
    materials: {
        // ── PLA 系 ───────────────────────────────────
        pla: {
            id: 'pla', name: 'PLA Basic', category: 'pla',
            density: 1.24, price_jp: 2240, price_us: 22,
            tds: { E: 2600, yieldMPa: 35, ultimateMPa: 44, compRatio: 1.4, layerAdhesion: 0.51, brittleness: 0.80,
                printTempC: [190, 230], bedTempC: [35, 45] }
        },
        pla_matte: {
            id: 'pla_matte', name: 'PLA Matte', category: 'pla',
            density: 1.22, price_jp: 2240, price_us: 22,
            tds: { E: 2400, yieldMPa: 30, ultimateMPa: 35, compRatio: 1.4, layerAdhesion: 0.55, brittleness: 0.65,
                printTempC: [195, 230], bedTempC: [35, 45] }
        },
        pla_silk: {
            id: 'pla_silk', name: 'PLA Silk', category: 'pla',
            density: 1.27, price_jp: 3300, price_us: 28,
            tds: { E: 2600, yieldMPa: 33, ultimateMPa: 41, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.78,
                printTempC: [210, 230], bedTempC: [35, 45] }
        },
        pla_marble: {
            id: 'pla_marble', name: 'PLA Marble', category: 'pla',
            density: 1.29, price_jp: 3300, price_us: 28,
            tds: { E: 3000, yieldMPa: 30, ultimateMPa: 38, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.85,
                printTempC: [200, 230], bedTempC: [35, 45] }
        },
        pla_glow: {
            id: 'pla_glow', name: 'PLA Glow', category: 'pla',
            density: 1.42, price_jp: 3800, price_us: 32,
            tds: { E: 2700, yieldMPa: 30, ultimateMPa: 36, compRatio: 1.4, layerAdhesion: 0.52, brittleness: 0.82,
                printTempC: [200, 230], bedTempC: [35, 45] }
        },
        pla_galaxy: {
            id: 'pla_galaxy', name: 'PLA Galaxy', category: 'pla',
            density: 1.34, price_jp: 3800, price_us: 32,
            tds: { E: 2900, yieldMPa: 32, ultimateMPa: 39, compRatio: 1.4, layerAdhesion: 0.50, brittleness: 0.83,
                printTempC: [200, 230], bedTempC: [35, 45] }
        },
        pla_wood: {
            id: 'pla_wood', name: 'PLA Wood', category: 'pla',
            density: 1.18, price_jp: 4000, price_us: 35,
            tds: { E: 2200, yieldMPa: 25, ultimateMPa: 32, compRatio: 1.4, layerAdhesion: 0.48, brittleness: 0.75,
                printTempC: [210, 230], bedTempC: [35, 45] }
        },
        pla_aero: {
            id: 'pla_aero', name: 'PLA Aero', category: 'pla',
            density: 1.06, price_jp: 4500, price_us: 38,
            // 軽量発泡 PLA — 強度は基本 PLA の 60% 程度
            tds: { E: 1500, yieldMPa: 18, ultimateMPa: 22, compRatio: 1.4, layerAdhesion: 0.45, brittleness: 0.70,
                printTempC: [220, 260], bedTempC: [35, 45] }
        },
        pla_tough: {
            id: 'pla_tough', name: 'PLA Tough', category: 'pla',
            density: 1.20, price_jp: 4200, price_us: 36,
            tds: { E: 2200, yieldMPa: 38, ultimateMPa: 50, compRatio: 1.4, layerAdhesion: 0.65, brittleness: 0.30,
                printTempC: [210, 240], bedTempC: [40, 60] }
        },
        pla_cf: {
            id: 'pla_cf', name: 'PLA-CF', category: 'pla',
            density: 1.30, price_jp: 5500, price_us: 45,
            tds: { E: 4500, yieldMPa: 46, ultimateMPa: 50, compRatio: 1.3, layerAdhesion: 0.40, brittleness: 0.90,
                printTempC: [220, 250], bedTempC: [45, 60] }
        },
        pla_sparkle: {
            id: 'pla_sparkle', name: 'PLA Sparkle', category: 'pla',
            density: 1.22, price_jp: 3300, price_us: 28,
            tds: { E: 2600, yieldMPa: 32, ultimateMPa: 39, compRatio: 1.4, layerAdhesion: 0.52, brittleness: 0.80,
                printTempC: [200, 230], bedTempC: [35, 45] }
        },

        // ── PETG 系 ─────────────────────────────────
        petg: {
            id: 'petg', name: 'PETG Basic', category: 'petg',
            density: 1.27, price_jp: 3000, price_us: 20,
            tds: { E: 1700, yieldMPa: 32, ultimateMPa: 46, compRatio: 1.5, layerAdhesion: 0.80, brittleness: 0.30,
                printTempC: [220, 260], bedTempC: [60, 80] }
        },
        petg_hf: {
            id: 'petg_hf', name: 'PETG HF', category: 'petg',
            density: 1.27, price_jp: 3000, price_us: 22,
            tds: { E: 1700, yieldMPa: 30, ultimateMPa: 45, compRatio: 1.5, layerAdhesion: 0.82, brittleness: 0.28,
                printTempC: [230, 270], bedTempC: [60, 80] }
        },
        petg_translucent: {
            id: 'petg_translucent', name: 'PETG Translucent', category: 'petg',
            density: 1.27, price_jp: 3300, price_us: 24,
            tds: { E: 1700, yieldMPa: 31, ultimateMPa: 44, compRatio: 1.5, layerAdhesion: 0.80, brittleness: 0.30,
                printTempC: [230, 260], bedTempC: [60, 80] }
        },
        petg_cf: {
            id: 'petg_cf', name: 'PETG-CF', category: 'petg',
            density: 1.30, price_jp: 5500, price_us: 40,
            tds: { E: 3500, yieldMPa: 50, ultimateMPa: 60, compRatio: 1.3, layerAdhesion: 0.55, brittleness: 0.55,
                printTempC: [250, 280], bedTempC: [70, 80] }
        },

        // ── ABS / ASA 系 ────────────────────────────
        abs: {
            id: 'abs', name: 'Bambu ABS', category: 'abs',
            density: 1.05, price_jp: 3300, price_us: 25,
            tds: { E: 2200, yieldMPa: 40, ultimateMPa: 45, compRatio: 1.5, layerAdhesion: 0.65, brittleness: 0.40,
                printTempC: [240, 270], bedTempC: [90, 100] }
        },
        asa: {
            id: 'asa', name: 'Bambu ASA', category: 'asa',
            density: 1.07, price_jp: 4200, price_us: 30,
            tds: { E: 2000, yieldMPa: 40, ultimateMPa: 44, compRatio: 1.5, layerAdhesion: 0.65, brittleness: 0.45,
                printTempC: [240, 270], bedTempC: [90, 100] }
        },
        asa_aero: {
            id: 'asa_aero', name: 'ASA Aero', category: 'asa',
            density: 0.93, price_jp: 5500, price_us: 42,
            // 軽量発泡 ASA
            tds: { E: 1300, yieldMPa: 22, ultimateMPa: 27, compRatio: 1.5, layerAdhesion: 0.55, brittleness: 0.50,
                printTempC: [250, 270], bedTempC: [90, 100] }
        },

        // ── PA / 高機能エンジニアリング樹脂 ──────────
        pa: {
            id: 'pa', name: 'PA (Nylon)', category: 'nylon',
            density: 1.06, price_jp: 6500, price_us: 50,
            tds: { E: 1800, yieldMPa: 50, ultimateMPa: 75, compRatio: 1.4, layerAdhesion: 0.85, brittleness: 0.20,
                printTempC: [270, 290], bedTempC: [90, 110] }
        },
        pa_cf: {
            id: 'pa_cf', name: 'PA-CF', category: 'nylon',
            density: 1.16, price_jp: 8500, price_us: 70,
            tds: { E: 4000, yieldMPa: 84, ultimateMPa: 95, compRatio: 1.4, layerAdhesion: 0.55, brittleness: 0.30,
                printTempC: [270, 290], bedTempC: [90, 110] }
        },
        pa6_cf: {
            id: 'pa6_cf', name: 'PA6-CF', category: 'nylon',
            density: 1.18, price_jp: 9500, price_us: 80,
            tds: { E: 6500, yieldMPa: 110, ultimateMPa: 130, compRatio: 1.4, layerAdhesion: 0.60, brittleness: 0.35,
                printTempC: [290, 310], bedTempC: [90, 110] }
        },
        pa6_gf: {
            id: 'pa6_gf', name: 'PA6-GF', category: 'nylon',
            density: 1.20, price_jp: 8000, price_us: 65,
            tds: { E: 5500, yieldMPa: 95, ultimateMPa: 115, compRatio: 1.4, layerAdhesion: 0.60, brittleness: 0.30,
                printTempC: [280, 300], bedTempC: [90, 110] }
        },

        // ── TPU / 軟質 ──────────────────────────────
        tpu_95a: {
            id: 'tpu_95a', name: 'TPU 95A', category: 'tpu',
            density: 1.21, price_jp: 5500, price_us: 40,
            // 弾性樹脂 — 弾性率が極端に低い、伸びは大きい
            tds: { E: 26, yieldMPa: 9, ultimateMPa: 35, compRatio: 1.0, layerAdhesion: 0.85, brittleness: 0.05,
                printTempC: [220, 240], bedTempC: [25, 60] }
        },

        // ── PC / PEI ──────────────────────────────
        pc: {
            id: 'pc', name: 'PC (Polycarbonate)', category: 'pc',
            density: 1.20, price_jp: 7500, price_us: 60,
            tds: { E: 2300, yieldMPa: 60, ultimateMPa: 70, compRatio: 1.4, layerAdhesion: 0.80, brittleness: 0.15,
                printTempC: [270, 300], bedTempC: [100, 120] }
        }
    }
};
