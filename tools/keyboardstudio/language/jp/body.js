// KeybordStudio V1 - Body Generator Japanese Translations
// language/jp/body.js

export const bodyJa = {
    // Section Headers
    body_h_layout: "レイアウト (Layout)",
    body_h_mount: "マウント方式 (Mount Style)",
    body_h_case: "ケース形状 (Case Design)",
    body_h_ergo: "人間工学 (Ergonomics)",
    body_h_port: "コネクタ (Connectivity)",
    body_h_internal: "内部構造 (Internal)",
    body_h_print: "3Dプリント最適化",
    body_h_addon: "アドオン (Add-ons)",
    body_h_color: "色設定 (Colors)",
    body_h_export: "エクスポート",

    // Layout
    body_lbl_layout_preset: "配列プリセット",
    body_lbl_pcb_import: "PCB / プレート取込 (DXF / SVG)",
    body_btn_pcb_import: "PCB / プレート読込",
    body_lbl_layout_standard: "ISO / ANSI / JIS",
    body_lbl_pitch: "キースイッチピッチ",
    body_lbl_kle_import: "KLE Import",
    body_lbl_kle_placeholder: "KLE Raw Dataをここに貼り付け...",
    body_btn_kle_import: "Import KLE Layout",
    body_lbl_wkl: "WKL (Winkeyless)",
    body_lbl_hhkb: "HHKB Blocker",

    // Mount
    body_lbl_mount_type: "マウントタイプ",
    body_lbl_standoff: "スタンドオフ",
    body_lbl_standoff_h: "高さ",
    body_lbl_standoff_d: "直径",
    body_lbl_standoff_screw: "ネジ穴径",
    body_lbl_gasket_tab: "ガスケットタブ",
    body_lbl_gasket_w: "タブ幅",
    body_lbl_gasket_t: "タブ厚み",
    body_lbl_gasket_spacing: "タブ間隔",

    // Case Design
    body_lbl_bezel_top: "ベゼル幅（上）",
    body_lbl_bezel_bottom: "ベゼル幅（下）",
    body_lbl_bezel_side: "ベゼル幅（左右）",
    body_lbl_corner: "コーナーR（フィレット）",
    body_lbl_wall: "ケース壁厚",
    body_lbl_profile_type: "プロファイル",
    body_opt_high: "High Profile",
    body_opt_low: "Low Profile",
    body_opt_floating: "Floating Key",
    body_lbl_bottom_thick: "底面厚み",

    // Ergonomics
    body_lbl_tilt: "タイピング角度",
    body_lbl_neg_tilt: "逆チルト（ネガティブ）",
    body_lbl_feet: "角度調節足 (Tilt Feet)",
    body_lbl_feet_flat: "格納 (Flat)",
    body_lbl_feet_stage1: "段階1 (+4°)",
    body_lbl_feet_stage2: "段階2 (+8°)",
    body_lbl_rubber_pads: "ゴム足 (Rubber Pads)",
    body_lbl_comfort_edge: "Comfort Edge R",

    // Connectivity
    body_lbl_usb_type: "USBポート形状",
    body_lbl_usb_pos_x: "ポート横位置 (X)",
    body_lbl_usb_pos_y: "ポート高さ (Y)",
    body_lbl_port_margin: "ポート開口マージン",

    // Internal Structure
    body_lbl_pcb_clearance: "PCB下クリアランス",
    body_lbl_ribs: "補強リブ (Ribs)",
    body_lbl_battery: "バッテリースペース (BLE)",
    body_lbl_bat_pos_x: "バッテリー位置 X",
    body_lbl_bat_pos_z: "バッテリー位置 Z",
    body_lbl_internal_volume: "内部容積",

    // 3D Print Optimization
    body_lbl_tolerance: "公差 (Tolerance)",
    body_lbl_insert_nut: "インサートナット穴径",
    body_lbl_split: "分割出力 (Split for small bed)",
    body_lbl_mouse_ear: "マウスイヤー（反り防止）",

    // Add-ons
    body_lbl_encoder: "ロータリーエンコーダー穴",
    body_lbl_oled: "OLEDディスプレイ窓",
    body_lbl_tripod: "三脚穴 (1/4インチ)",

    // Colors
    body_lbl_color_ams_hint: "AMSスロットから選択（AMS設定で色を登録）",
    body_lbl_top_case: "トップケース",
    body_lbl_bottom_case: "ボトムケース",
    body_lbl_plate: "プレート",
    body_lbl_pad: "ゴム足",
    body_lbl_feet_color: "角度調節足",
    body_btn_ams_config: "AMS色設定（スライサー同期用）",

    // Export
    body_btn_export: "エクスポート",

    // Collision Check (Phase 7-2)
    body_btn_collision_check: "干渉チェック実行",

    // Cross-section (Phase 7-3)
    body_h_cross_section: "ケース断面ビュー",
    body_lbl_enable_cross_section: "断面を表示",
    body_lbl_cross_section_axis: "軸",
    body_lbl_cross_section_pos: "位置",
    body_opt_axis_x: "X 軸 (横)",
    body_opt_axis_y: "Y 軸 (高さ)",
    body_opt_axis_z: "Z 軸 (奥行き)",
    body_cross_section_note: "※ 表示専用機能です。STL/3MF 出力には影響しません。",

    // Phase 9: Assist features
    body_h_assist: "アシスト機能 (Phase 9)",
    body_lbl_assist_material: "材料 (Weight & Cost)",
    body_btn_assist_weight: "重量・コスト推定",
    body_btn_assist_screwpost: "ネジ柱推奨位置を表示",
    body_lbl_assist_insert: "インサート (Heat-set)",
    body_btn_assist_insert: "推奨穴寸法を表示",
    body_lbl_assist_gasket: "ガスケット圧縮シミュレーター",
    body_lbl_gasket_thick_mm: "厚み(mm)",
    body_lbl_gasket_hardness: "硬度(ShoreA)",
    body_lbl_gasket_compress: "圧縮率(%)",
    body_btn_assist_gasket: "推奨内部高さを計算",
    body_lbl_assist_acoustic: "音響チューニング プリセット",
    body_opt_acoustic_hollow: "Hollow (中空・響き)",
    body_opt_acoustic_bass: "Bass (低音強調)",
    body_opt_acoustic_firm: "Firm (硬質)",
    body_opt_acoustic_silent: "Silent (静音)",
    body_opt_acoustic_foam: "Foam-Heavy (フォーム充填)",
    body_btn_assist_acoustic: "プリセット適用",
    body_lbl_assist_usb: "USBポートテンプレート",
    body_btn_assist_usb: "選択中ポート寸法を表示",
    body_btn_assist_tilt: "タイピング角度を検証",
    body_lbl_assist_variation: "バリエーション生成",
    body_btn_var_low: "Low",
    body_btn_var_standard: "標準",
    body_btn_var_high: "High",
    body_btn_var_wedge: "Wedge",
    body_btn_var_floating: "Float"
};
