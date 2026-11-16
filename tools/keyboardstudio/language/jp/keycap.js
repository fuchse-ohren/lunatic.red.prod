// KeybordStudio V1 - Keycap Generator Japanese Translations
// language/jp/keycap.js

export const keycapJa = {
    // Navigation
    nav_jump: "--- セクション移動 ---", nav_basic: "基本サイズ", nav_structure: "構造・ボッチ", nav_shape: "形状",
    nav_texture: "画像テクスチャ", nav_utility: "ユーティリティ", nav_import: "外部モデル",
    nav_stem: "ステム", nav_text: "文字・刻印", nav_svg: "SVGアイコン", nav_color: "色設定",
    nav_preset: "プリセット", nav_export: "書き出し",

    // Basic Size
    h_basic: "基本サイズ", lbl_u_size: "キーサイズ", lbl_profile: "プロファイル", lbl_row: "行", lbl_unit_size: "基本ピッチ",

    // Structure
    h_structure: "構造・ボッチ", lbl_wall_thick: "壁の厚み", lbl_rib_shorten: "リブ短縮", lbl_enable_ribs: "補強リブ",
    lbl_homing_bump: "ホームポジション突起", opt_bump_round: "丸型", opt_bump_bar: "長方形",
    lbl_pos_x: "位置 X", lbl_pos_z: "位置 Z", lbl_bump_offset: "高さ微調整",
    lbl_round_corner: "角の丸み", note_round: "※Squircle Mapping（高速・安定）",

    // Shape
    h_shape: "形状", lbl_top_scale: "上面サイズ", lbl_dish_type: "上面形状",
    lbl_key_shape_type: "キー形状タイプ", opt_shape_rect: "四角形", opt_shape_round: "角丸",
    opt_shape_circle: "円形", opt_shape_polygon: "多角形", opt_shape_star: "星形", opt_shape_iso: "ISO Enter（L字形）",
    lbl_polygon_sides: "辺の数", lbl_star_points: "頂点数", lbl_star_inner: "内径比",
    lbl_iso_settings: "ISO/JIS Enter 設定", lbl_iso_top_w: "上部幅", lbl_iso_bottom_w: "下部幅", lbl_iso_total_h: "全体の高さ",
    lbl_stem_x: "ステムX", lbl_stem_z: "ステムZ", lbl_stab_top_z: "上スタビZ", lbl_stab_bottom_z: "下スタビZ",
    opt_dish_cyl: "円筒", opt_dish_sph: "球", opt_dish_flat: "平",

    // Texture
    lbl_texture: "表面テクスチャ", opt_tex_none: "なし", opt_tex_noise: "梨地", opt_tex_grid: "グリップ",
    lbl_tex_scale: "細かさ", lbl_tex_strength: "深さ",
    h_texture_map: "画像テクスチャ", btn_upload_img: "画像読込",

    // Stem
    h_stem: "ステム設定", lbl_stem_type: "軸タイプ: Cherry MX（固定）", lbl_stem_type_select: "軸タイプ (Stem Type)", lbl_clearance: "クリアランス", lbl_stem_diameter: "ステム外径",

    // V67.3 New Labels
    lbl_click_place: "直感操作 (Interactive)", btn_click_place_off: "配置モード: OFF", btn_click_place_on: "配置モード: ON", note_click_place: "※ONにしてモデル上をクリックすると、文字やアイコンがその位置に移動します",
    lbl_mode_target: "対象",
    btn_ams_config: "AMS色設定（スライサー同期用）", btn_ams_import: "JSON読込",
    sprue_desc: "複数のキーキャップをプラモデルのランナーのように連結して出力します。",

    // Text Settings
    h_text: "文字設定", lbl_enable_text: "文字を生成する", pl_text: "例: A\n{\n[", note_multiline: "※改行で2段印字が可能",
    lbl_font: "フォント", note_font_upload: "V68: フォントマネージャーから.ttf/.otf/.woffを直接読み込めます。",
    btn_upload_font: "カスタムフォント", btn_font_manager: "フォントマネージャーを開く", lbl_size: "サイズ", lbl_thickness: "深さ/高さ", lbl_conform: "曲面に合わせる",
    lbl_align_preset: "文字配置", btn_align_center: "中央", btn_align_tl: "左上",
    btn_align_tr: "右上", btn_align_bl: "左下", btn_align_br: "右下",
    lbl_pos_xz_fine: "位置 X / Z（微調整）", lbl_offset_y: "高さ微調整",
    lbl_text_mode: "生成モード", opt_mode_emboss: "浮き出し", opt_mode_engrave: "刻印", opt_mode_doubleshot: "埋め込み", opt_mode_lithophane: "バックライト透過",
    note_engrave: "※Engraveは計算処理に時間がかかります",

    // SVG Settings
    h_svg: "SVGアイコン設定", btn_upload_svg: "SVG読込", btn_svg_manager: "SVGマネージャーを開く", cat_custom: "カスタム", lbl_visible: "表示",

    // (Phase 11 cleanup: workflow_guide / advanced_mode / qa_* keys removed
    //  — UI 要素は 10ff1e2 で削除)

    // 断面ビュー
    h_cross_section: "断面ビュー",
    lbl_enable_cross_section: "断面を表示",
    lbl_cross_section_axis: "軸",
    lbl_cross_section_pos: "位置",
    opt_axis_x: "X 軸 (横)",
    opt_axis_y: "Y 軸 (高さ)",
    opt_axis_z: "Z 軸 (奥行き)",
    cross_section_note: "※ 表示専用機能です。STL/3MF 出力には影響しません。",

    btn_close: "閉じる",

    // ストラップ穴
    h_strap_hole: "ストラップ穴", lbl_enable_strap_hole: "ストラップ穴を開ける",
    lbl_strap_hole_diameter: "穴径", lbl_strap_hole_shape: "形状",
    opt_strap_circle: "円", opt_strap_slot: "長穴",
    lbl_strap_hole_face: "面",
    opt_face_top: "上面", opt_face_front: "前面", opt_face_back: "後面",
    opt_face_left: "左面", opt_face_right: "右面",
    lbl_strap_hole_x: "位置 X", lbl_strap_hole_z: "位置 Z",
    lbl_strap_hole_length: "長穴の長さ", lbl_strap_hole_angle: "回転",

    // Font Manager
    fm_title: "フォントマネージャー", fm_load_font: "フォント読み込み", fm_drop_hint: "クリック / D&amp;D<br><span style='font-size:0.55rem;color:#556;'>.ttf .otf .woff .json（複数選択可）</span>", fm_loaded_fonts: "読み込み済みフォント", fm_search_placeholder: "フォント検索...", fm_empty: "フォントを<br>読み込んでください", fm_clear_all: "保存フォント全削除", fm_lbl_fontname: "フォント名", fm_lbl_format: "形式", fm_lbl_glyphs: "グリフ数", fm_lbl_kerning: "カーニング", fm_lbl_errors: "エラー", fm_close: "閉じる", fm_use_save: "使用 ＆ 保存", fm_font_info: "フォント情報",

    // SVG Manager
    sm_title: "SVG マネージャー", sm_load_svg: "SVG 読み込み", sm_drop_hint: "クリック / D&amp;D<br><span style='font-size:0.55rem;color:#005566;'>.svg（複数選択可）</span>", sm_loaded_svgs: "読み込み済みSVG", sm_search_placeholder: "SVG検索...", sm_empty: "SVGファイルを<br>読み込んでください", sm_clear_all: "保存SVG全削除", sm_select_svg: "SVGを選択してください", sm_svg_info: "SVG 情報", sm_filename: "ファイル名", sm_paths: "パス数", sm_close: "閉じる", sm_apply_save: "適用 ＆ 保存", lbl_rotation: "回転",

    // Colors
    h_colors: "色設定", lbl_col_body: "本体色", lbl_col_text: "文字・SVG色",

    // Preset
    h_preset: "プリセット管理", lbl_env_backup: "環境バックアップ", lbl_env_backup_desc: "全設定・ギャラリー・フォント・SVG・AMS設定を1ファイルに保存", lbl_include_fonts: "フォントデータを含める（ファイルサイズ大）", btn_env_export: "バックアップ書き出し", btn_env_import: "バックアップ読み込み",
    lbl_url_share: "URLで共有", btn_share_url: "URLをコピー", btn_share_x: "𝕏 シェア", btn_import_url: "読み込み", placeholder_url_import: "共有URLを貼り付け...",
    lbl_loaded_presets: "読み込んだプリセット:",
    pv_profile: "プロファイル:", pv_size: "サイズ:", pv_shape: "形状:", pv_text: "文字:", pv_text2: "サブ文字:", pv_side: "サイド:", pv_svg: "SVG:",
    msg_url_copied: "URLをクリップボードにコピーしました！", msg_url_invalid: "無効なURLです", msg_url_loaded: "URLからプリセットを読み込みました", msg_x_shared: "X(Twitter)の投稿画面を開きました",

    // Navigation Buttons
    btn_prev: "◀ 前へ", btn_next: "次へ ▶", btn_clear_all: "全削除",

    // Export
    h_export: "エクスポート", lbl_filename: "ファイル名設定（自動で[文字]が付与されます）", btn_export_single: "エクスポート", btn_export_all: "全体をSTLで保存", btn_export_obj: "全体をOBJで保存",
    btn_export_3mf: "全体を3MFで保存",

    // Batch
    h_batch: "バッチ出力", lbl_batch_list: "文字リスト（カンマ/改行区切り）", pl_batch: "Q,W,E,R,T,Y...",
    lbl_batch_format: "出力形式",
    note_batch: "※現在の設定で連続生成します", btn_batch_run: "一括生成",
    batch_processing: "処理中: ", batch_complete: "完了！",

    // Messages
    msg_import_err: "ファイル読み込みエラー: 正しいJSON形式ではありません。", msg_batch_empty: "文字リストが空です。",
    toast_generating: "メッシュを生成中...", toast_stl_exported: "STLをエクスポートしました！",
    toast_obj_exported: "OBJをエクスポートしました！", toast_3mf_exported: "3MFをエクスポートしました！",
    toast_export_failed: "エクスポート失敗: ", toast_no_body: "エラー: ボディジオメトリが生成されませんでした",

    // Import
    h_import: "外部モデル", btn_load_stl: "STLモデル読込", lbl_weight: "予想重量:", lbl_cost: "予想コスト:",
    lbl_vendor: "ベンダー:", lbl_material: "材料:", btn_details: "▼ 詳細 / 編集",
    lbl_manual_override: "手動設定", lbl_price: "価格", lbl_spool: "リール(g)", lbl_density: "密度",

    // Links
    link_wiki: "Wikiへ移動", link_github: "GitHubへ移動",
    lbl_show_hints: "ヒント表示",

    // Export Popup
    popup_export_confirm: "エクスポート確認",
    popup_cancel: "キャンセル",
    popup_export: "エクスポート",
    popup_est_weight: "予想重量",
    popup_est_cost: "予想コスト",
    popup_body_color: "本体色",
    popup_text_color: "文字色",
    popup_vendor: "ベンダー",
    popup_material: "材料",
    popup_profile: "プロファイル",
    popup_size: "サイズ",
    popup_row: "行",
    popup_text: "文字",
    popup_svg_icon: "SVGアイコン",
    popup_printer: "プリンター",
    popup_build_size: "造形サイズ",
    popup_key_count: "キー数",
    popup_layout: "配置",
    popup_char_list: "文字リスト",
    popup_format: "出力形式",
    popup_file_count: "ファイル数",

    // Sprue Kit
    sprue_printer_model: "プリンター機種",
    sprue_max_keys: "最大配置可能",
    sprue_key_count: "キット内のキー数",
    sprue_repeat_mode: "同じ文字を連続出力",
    sprue_char_list: "文字リスト (カンマ区切り)",
    sprue_single_char: "連続出力する文字",
    sprue_output_format: "出力形式",
    sprue_generate: "スプルーキット生成",
    sprue_custom: "カスタムスプルーキット",
    sprue_generating: "スプルーキット生成中...",
    sprue_unlimited: "制限なし",

    // Tolerance Test
    tolerance_desc: "プリンターの公差をテストするためのステムだけを並べたプレートを生成します。",
    tolerance_output_format: "出力形式",
    tolerance_generate: "テストキット生成",
    tolerance_start: "開始値",
    tolerance_step: "刻み",
    tolerance_generating: "ステムテストキットを生成中...",
    tolerance_complete: "ステムテスト生成完了",
    popup_tol_start: "開始値",
    popup_tol_step: "刻み",
    popup_tol_count: "生成数",
    popup_tol_values: "クリアランス値",

    // Row Descriptions
    row_r4: "R4 (最上段/数字キー)",
    row_r3: "R3 (文字キー/Enter)",
    row_r2: "R2 (ホーム段/ASDF)",
    row_r1: "R1 (最下段/Space)",

    // Additional UI
    lbl_custom_profile: "カスタムプロファイル設定",
    lbl_icon_size: "アイコンサイズ",
    lbl_sub_text: "サブ文字 (Legend 2)",
    lbl_side_print: "サイド印字 (Side Print)",
    preset_arrow: "矢印キー",
    arrow_select_title: "矢印の方向を選択",
    wasd_select_title: "WASDキーを選択",
    arrow_up: "上",
    arrow_down: "下",
    arrow_left: "左",
    arrow_right: "右",

    // More UI
    lbl_global_apply: "全体に適用",
    lbl_click_to_apply: "クリックでSVGとして適用",
    btn_presets: "プリセット",
    btn_clear_stock_icon: "選択解除",
    btn_clear_preset: "プリセット解除",
    msg_preset_cleared: "初期状態に戻しました",
    msg_enter_repeat_char: "連続出力する文字を入力してください",
    msg_enter_one_char: "1つ以上の文字を入力してください",

    // Stabilizer
    lbl_stabilizer: "スタビライザー",
    opt_stab_auto: "自動",
    opt_stab_custom: "手動設定",
    lbl_stab_pitch: "ピッチ（中心オフセット）",
    note_stab_distance: "※中心からステム中心までの距離",

    // Texture Options
    opt_tex_knurling: "ローレット",
    opt_tex_stripes: "ストライプ",
    opt_tex_ripple: "波紋",
    opt_tex_wood: "木目",
    opt_tex_hammered: "打痕",
    opt_tex_hexagon: "ハニカム",
    opt_tex_bricks: "レンガ",

    // Stem Options
    lbl_stem_extension: "長さを拡張",
    lbl_box_stem: "ボックス軸",
    lbl_lego_stud: "天面ポッチ",
    lbl_tilt: "天面角度調整",
    lbl_import_op: "合成モード",
    opt_union: "結合（追加）",
    opt_subtract: "型抜き（彫刻）",
    note_subtract: "※型抜きは処理に時間がかかります",

    // Categories
    cat_all: "すべて",
    msg_loading: "読み込み中...",
    btn_simple_export_stl: "STLで保存",
    btn_simple_export_3mf: "3MFで保存",

    // V66 Simple Mode
    lbl_simple_mode: "簡単モード (Simple)",
    h_simple_mode: "簡単モード",
    lbl_simple_text: "文字入力",
    lbl_text_visible: "文字表示",
    lbl_simple_font: "フォント",
    lbl_simple_icon: "アイコン",
    btn_clear_icon: "アイコン解除",
    lbl_simple_profile: "形状",
    lbl_simple_row: "行",
    lbl_simple_key_size: "キーの幅",
    lbl_simple_body_color: "本体色",
    lbl_simple_text_color: "文字色",
    lbl_simple_text_mode: "生成モード",
    lbl_simple_gen_mode: "生成モード（文字・アイコン）",
    view_front: "前", view_back: "後", view_right: "右", view_left: "左", view_top: "上", view_bottom: "下",
    lbl_simple_taper: "上面サイズ",
    lbl_simple_dish: "上面形状",
    lbl_simple_fillet: "角の丸み",
    lbl_dimension_lines: "寸法線を表示",
    lbl_layer_color: "レイヤーカラー・プレビュー",
    lbl_visual_presets: "ビジュアルプリセット",
    lbl_stock_icons: "アイコンリスト",
    lbl_tolerance_test: "ステムテストキット",
    lbl_sprue_kit: "スプルー・キット生成",

    // AMS Confirm Popup
    ams_confirm_title: "AMS設定",
    ams_confirm_message: "AMSの色が割り当てられていません。<br>設定しますか？",
    ams_confirm_hint: "※後から設定タブの「AMS設定」ボタンでいつでも設定できます",
    ams_confirm_later: "後で設定",
    ams_confirm_now: "今すぐ設定",

    // AMS Settings Popup
    ams_popup_title: "AMS色設定（スライサー同期用）",
    ams_filament_select: "フィラメント選択",
    ams_vendor: "ベンダー",
    ams_material: "材料",
    ams_color_palette: "カラーパレット（ドラッグ）",
    ams_add_custom: "カスタム色を追加",
    ams_capture_btn: "画面から取込",
    ams_slicer_sync: "スライサー同期",
    ams_export_json: "JSON書出し",
    btn_add: "追加",
    btn_apply: "適用",
    wiki_hint: "Wikiで詳しく見る",

    // Batch Color Settings
    batch_color_title: "一括色設定",
    batch_color_click_select: "▼ クリックして選択",
    batch_color_body_filament: "本体フィラメント",
    batch_color_text_filament: "文字フィラメント",
    gallery_batch_color: "色設定",
    gallery_batch_export: "一括出力",

    // Screenshot Color Detection
    screenshot_title: "色を取込",
    screenshot_step1_hint: "スライサーでフィラメント一覧を表示 → 共有画面で「ウィンドウ」からBambu Studio選択",
    screenshot_scale: "拡大:",
    screenshot_capture: "キャプチャ",
    screenshot_step2_hint: "Bambu Studioの番号順にクリック",
    screenshot_click_palette: "1番のパレットをクリック",
    screenshot_picked: "取得:",
    screenshot_retry: "最初から",
    screenshot_add: "追加",
    screenshot_undo: "↩戻す",
    screenshot_done: "完了",
    screenshot_step3_hint: "取得した色を確認（カラーピッカーで修正可能）",
    screenshot_back: "←戻る",
    screenshot_apply: "AMSに適用",

    // Context Menu
    ctx_reset_camera: "カメラをリセット",
    ctx_top_view: "回転をリセット (Top View)",
    ctx_random_color: "ランダムカラー",
    ctx_wireframe: "ワイヤーフレーム切替",
    body_disp_all: "全パーツ",
    body_disp_body: "ボディのみ",
    body_disp_plate: "プレートのみ",
    ctx_save_gallery: "ギャラリーに保存",

    // Batch Export
    batch_export_title: "一括エクスポート確認",
    batch_export_format_select: "出力形式を選択",
    batch_export_start: "エクスポート開始",

    // Gallery Context Menu
    gallery_ctx_load: "読み込む",
    gallery_ctx_export: "エクスポート",
    gallery_ctx_delete: "削除",

    // Slicer Bridge
    slicer_bridge_title: "スライサーで開く",
    slicer_bridge_note: "Keycap Slicer Bridge 経由でモデルをスライサーに直接送信します。",
    slicer_bridge_none: "ブリッジがスライサーを検出できませんでした。",
    slicer_bridge_ok: "{name} にモデルを送信しました",
    slicer_bridge_err: "ブリッジ接続に失敗しました",
    slicer_bridge_sending: "{name} に送信中...",
    slicer_open_label: "{name} で開く",
    slicer_download_desc: "ファイルをダウンロード",
    slicer_connected: "接続済み",

    // CSK (Custom Sprue Kit)
    csk_title: "カスタムスプルーキット",
    csk_gallery: "ギャラリー",
    csk_printer: "機種",
    csk_batch_orient: "一括配置",
    csk_runner_color: "ランナー色:",
    csk_generate: "スプルーキット生成",
    csk_orientation: "配置方向",
    csk_drag_rotate: "ドラッグで回転",
    csk_bottom_down: "下面が下",
    csk_body_color: "本体色",
    csk_text_color: "文字色",
    csk_batch_orient_title: "一括配置方向設定",
    csk_selected_count: "0個選択中",
    csk_select_all: "全選択",
    csk_deselect: "解除",
    csk_batch_hint: "タイルをクリックして選択<br>サイコロを動かすと即時反映",
    csk_done: "終了",

    // Gumball Target
    gumball_main_text: "メイン文字",
    gumball_sub_text: "サブ文字",
    gumball_side_print: "サイド印字",
    gumball_model: "モデル",

    // Preset
    preset_loaded: "読み込み済み",

    // Other UI
    simple_ams_select: "AMSスロットから選択",
    btn_close: "閉じる",

    // Debug Panel
    debug_title: "デバッグ / メンテナンス <span style=\"font-size:0.65rem; color:#888; font-weight:normal;\">(F5)</span>",
    debug_cache_section: "キャッシュ / データクリア",
    debug_clear_all: "全キャッシュクリア（localStorage全削除 + ページリロード）",
    debug_clear_filament: "フィラメント設定クリア（AMS設定を初期化）",
    debug_clear_gallery: "ギャラリー全削除（全キーキャップを削除）",
    debug_clear_csk: "カスタムスプルキット配置をリセット",
    debug_reset_state: "パラメータ初期化（デフォルト値に戻す）",
    debug_reset_fm: "フォントマネージャーをリセット（保存フォント全削除）",
    debug_reset_sm: "SVGマネージャーをリセット（保存SVG全削除）",
    debug_state_section: "現在の状態情報",
    debug_tools_section: "ツール",
    debug_export_state: "現在の全状態をJSONでエクスポート",
    debug_import_state: "JSONから状態をインポート",
    debug_force_rebuild: "3Dモデルを強制再構築",
    debug_log_state: "コンソールに全state出力",

    // Additional Translation Keys
    preset_empty: "保存されたプリセットはありません。右クリックメニューまたはHUDのボタンから保存できます。",
    warning_not_set: "設定されていません",
    warning_body_filament: "本体フィラメント",
    warning_text_filament: "文字フィラメント",
    warning_both_filament: "両方",
    click_to_select: "クリックして選択",
    popup_body_color_set: "本体色設定",
    popup_text_color_set: "文字色設定",
    popup_save_location: "保存先",
    popup_download_folder: "ダウンロードフォルダ",
    unit_items: "件",
    ams_register_hint: "AMSスロットから選択（AMS設定で色を登録）",
    ams_register_colors: "AMS設定で色を登録",
    ams_colors_applied: "色をAMSスロットに適用しました",
    selected_label: "選択中",
    lbl_custom_height: "高さ",
    lbl_custom_angle: "角度",
    size_standard: "通常",
    lbl_text_svg_filament: "文字・SVGフィラメント",
    preset_fn: "Fnキー",
    mobile_settings: "設定",
    mobile_history: "履歴",
    mobile_view: "表示",
    mobile_genmode: "生成モード",
    mobile_genmode_target: "対象",
    mobile_gumball: "ガムボール",
    mobile_export: "出力",

    // ステム強度解析 (構造計算)
    h_stem_fea: "ステム強度解析",
    nav_stem_fea: "ステム強度解析",
    stem_fea_intro: "梁理論ベースの構造解析で引抜き / 押下 / 横荷重 / 装着時膨張 / 層間接着 の応力と安全率を算出します。",
    lbl_stem_fea_material: "素材",
    lbl_stem_fea_load: "荷重プロファイル",
    load_normal: "通常タイピング",
    load_gaming: "ゲーミング (連打)",
    load_extreme: "エクストリーム (落下)",
    btn_stem_fea_run: "⚙ 構造解析を実行",

    // 配列ビュー (キーボード一括生成)
    h_keyset_view: "配列ビュー",
    nav_keyset_view: "配列ビュー",
    lbl_keyset_view: "配列ビューを有効化",
    lbl_keyset_layout: "レイアウト",
    keyset_intro: "キーボード全体を一括生成するモード。基本サイズ・形状・色・テキストモードのスライダーが全キーに同時適用されます。ラベルは配列定義から自動入力。個別の文字編集は「文字配置ダイアログ」で行います。",
    keyset_export_note: "※ エクスポート時は通常のエクスポートボタンから。現在表示している配列がそのまま出力されます。",
    btn_keyset_customize: "✎ 文字配置ダイアログを開く",
    // 文字配置ダイアログ
    keyset_dlg_title: "文字配置 — 配列ビュー",
    keyset_dlg_text_mode: "テキストモード (一括)",
    keyset_dlg_font: "フォント (一括)",
    keyset_dlg_reset: "⟲ ラベル初期化",
    keyset_dlg_edit_label: "このキーの文字",
    keyset_dlg_apply: "適用",
    keyset_dlg_revert: "既定値",
    keyset_dlg_cancel: "✕",
    keyset_dlg_close: "閉じる",
    keyset_dlg_hint: "キーをクリックして文字を編集。設定は即時 3D に反映されます。",
    text_mode_emboss: "浮き出し (Emboss)",
    text_mode_engrave: "掘り込み (Engrave)",
    text_mode_cutout: "切り抜き (Cutout)",
    text_mode_inset: "埋め込み (Inset)",
    text_mode_doubleshot: "ダブルショット"
};
