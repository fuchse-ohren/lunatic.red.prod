// KeybordStudio V1 - Keycap Generator English Translations
// language/en/keycap.js

export const keycapEn = {
    // Navigation
    nav_jump: "--- Jump to Section ---", nav_basic: "Basic Size", nav_structure: "Structure", nav_shape: "Shape",
    nav_texture: "Texture Map", nav_utility: "Utility", nav_import: "Import 3D", nav_stem: "Stem",
    nav_text: "Text / Legend", nav_svg: "SVG Icon", nav_color: "Colors", nav_preset: "Presets", nav_export: "Export",

    // Basic Size
    h_basic: "Basic Size", lbl_u_size: "Key Size (U)", lbl_profile: "Profile", lbl_row: "Row", lbl_unit_size: "Unit Size (Pitch)",

    // Structure
    h_structure: "Structure & Stem", lbl_wall_thick: "Wall Thickness", lbl_rib_shorten: "Rib Shorten (Lift)", lbl_enable_ribs: "Reinforcement Ribs",
    lbl_homing_bump: "Homing Bump", opt_bump_round: "Round", opt_bump_bar: "Bar",
    lbl_pos_x: "Pos X", lbl_pos_z: "Pos Z", lbl_bump_offset: "Bump Offset Y",
    lbl_round_corner: "Round Corner (Fillet)", note_round: "*Squircle Mapping (Fast & Stable)",

    // Shape
    h_shape: "Shape (Taper/Dish)", lbl_top_scale: "Top Scale (Taper)", lbl_dish_type: "Dish Type",
    lbl_key_shape_type: "Key Shape Type", opt_shape_rect: "Rectangle", opt_shape_round: "Rounded",
    opt_shape_circle: "Circle", opt_shape_polygon: "Polygon", opt_shape_star: "Star", opt_shape_iso: "ISO Enter (L-Shape)",
    lbl_polygon_sides: "Sides", lbl_star_points: "Points", lbl_star_inner: "Inner Ratio",
    lbl_iso_settings: "ISO/JIS Enter Settings", lbl_iso_top_w: "Top Width", lbl_iso_bottom_w: "Bottom Width", lbl_iso_total_h: "Total Height",
    lbl_stem_x: "Stem X", lbl_stem_z: "Stem Z", lbl_stab_top_z: "Top Stab Z", lbl_stab_bottom_z: "Bottom Stab Z",
    opt_dish_cyl: "Cylindrical", opt_dish_sph: "Spherical", opt_dish_flat: "Flat",

    // Texture
    lbl_texture: "Surface Procedural", opt_tex_none: "None", opt_tex_noise: "Noise (Sand)", opt_tex_grid: "Grid (Studs)",
    lbl_tex_scale: "Scale", lbl_tex_strength: "Strength",
    h_texture_map: "Image Texture (Image Map)", btn_upload_img: "Load Image (PNG/JPG)",

    // Stem
    h_stem: "Stem Settings", lbl_stem_type: "Stem Type: Cherry MX (Fixed)", lbl_stem_type_select: "Stem Type", lbl_clearance: "Clearance", lbl_stem_diameter: "Stem Diameter",

    // V67.3 New Labels
    lbl_click_place: "Interactive Placement", btn_click_place_off: "Placement Mode: OFF", btn_click_place_on: "Placement Mode: ON", note_click_place: "*Turn ON and click on the model to move text/icons to that position",
    lbl_mode_target: "Target",
    btn_ams_config: "AMS Color Settings (Slicer Sync)", btn_ams_import: "Import JSON",
    sprue_desc: "Connect multiple keycaps like plastic model runners for output.",

    // Text Settings
    h_text: "Legend Settings", lbl_enable_text: "Enable Text", pl_text: "Ex: A\n{\n[", note_multiline: "*Use line breaks for multi-line.",
    lbl_font: "Font", note_font_upload: "V68: Load .ttf/.otf/.woff directly from Font Manager.",
    btn_upload_font: "Custom Font", btn_font_manager: "Open Font Manager", lbl_size: "Size", lbl_thickness: "Thickness", lbl_conform: "Conform to Surface",
    lbl_align_preset: "Alignment Presets", btn_align_center: "Center", btn_align_tl: "Top-Left",
    btn_align_tr: "Top-Right", btn_align_bl: "Bottom-Left", btn_align_br: "Bottom-Right",
    lbl_pos_xz_fine: "Position X / Z (Fine)", lbl_offset_y: "Y Offset (Fine)",
    lbl_text_mode: "Generation Mode", opt_mode_emboss: "Emboss (Raised)", opt_mode_engrave: "Engrave (Inset)", opt_mode_doubleshot: "Double-Shot (Inlay)", opt_mode_lithophane: "Lithophane (Backlit)",
    note_engrave: "*Engrave requires more processing time.",

    // SVG Settings
    h_svg: "SVG Icon Settings", btn_upload_svg: "Load SVG", btn_svg_manager: "Open SVG Manager", cat_custom: "Custom", lbl_visible: "Visible",

    // (Phase 11 cleanup: workflow_guide / advanced_mode / qa_* keys removed
    //  — UI elements were deleted in 10ff1e2)

    // Cross-section view
    h_cross_section: "Cross-Section View",
    lbl_enable_cross_section: "Show cross-section",
    lbl_cross_section_axis: "Axis",
    lbl_cross_section_pos: "Position",
    opt_axis_x: "X axis (horizontal)",
    opt_axis_y: "Y axis (height)",
    opt_axis_z: "Z axis (depth)",
    cross_section_note: "* Display only — does not affect STL/3MF export.",

    btn_close: "Close",

    // Strap Hole
    h_strap_hole: "Strap Hole", lbl_enable_strap_hole: "Cut strap hole",
    lbl_strap_hole_diameter: "Diameter", lbl_strap_hole_shape: "Shape",
    opt_strap_circle: "Circle", opt_strap_slot: "Slot",
    lbl_strap_hole_face: "Face",
    opt_face_top: "Top", opt_face_front: "Front", opt_face_back: "Back",
    opt_face_left: "Left", opt_face_right: "Right",
    lbl_strap_hole_x: "Pos X", lbl_strap_hole_z: "Pos Z",
    lbl_strap_hole_length: "Slot length", lbl_strap_hole_angle: "Rotation",

    // Font Manager
    fm_title: "Font Manager", fm_load_font: "Load Fonts", fm_drop_hint: "Click / D&amp;D<br><span style='font-size:0.55rem;color:#556;'>.ttf .otf .woff .json (multiple OK)</span>", fm_loaded_fonts: "Loaded Fonts", fm_search_placeholder: "Search fonts...", fm_empty: "Load fonts<br>to begin", fm_clear_all: "Delete All Saved", fm_lbl_fontname: "Font Name", fm_lbl_format: "Format", fm_lbl_glyphs: "Glyphs", fm_lbl_kerning: "Kerning", fm_lbl_errors: "Errors", fm_close: "Close", fm_use_save: "Use & Save", fm_font_info: "Font Info",

    // SVG Manager
    sm_title: "SVG Manager", sm_load_svg: "Load SVGs", sm_drop_hint: "Click / D&amp;D<br><span style='font-size:0.55rem;color:#005566;'>.svg (multiple OK)</span>", sm_loaded_svgs: "Loaded SVGs", sm_search_placeholder: "Search SVGs...", sm_empty: "Load SVG files<br>to begin", sm_clear_all: "Delete All Saved", sm_select_svg: "Select an SVG", sm_svg_info: "SVG Info", sm_filename: "Filename", sm_paths: "Paths", sm_close: "Close", sm_apply_save: "Apply & Save", lbl_rotation: "Rotation (XYZ)",

    // Colors
    h_colors: "Color Settings", lbl_col_body: "Body Color", lbl_col_text: "Text/SVG Color",

    // Preset
    h_preset: "Preset Management", lbl_env_backup: "Environment Backup", lbl_env_backup_desc: "Save all settings, gallery, fonts, SVGs, and AMS config to one file", lbl_include_fonts: "Include font data (large file size)", btn_env_export: "Export Backup", btn_env_import: "Import Backup",
    lbl_url_share: "Share via URL", btn_share_url: "Copy URL", btn_share_x: "𝕏 Share", btn_import_url: "Load", placeholder_url_import: "Paste shared URL...",
    lbl_loaded_presets: "Loaded Presets:",
    pv_profile: "Profile:", pv_size: "Size:", pv_shape: "Shape:", pv_text: "Text:", pv_text2: "Sub Text:", pv_side: "Side:", pv_svg: "SVG:",
    msg_url_copied: "URL copied to clipboard!", msg_url_invalid: "Invalid URL", msg_url_loaded: "Preset loaded from URL", msg_x_shared: "Opened X (Twitter) compose window",

    // Navigation Buttons
    btn_prev: "◀ Prev", btn_next: "Next ▶", btn_clear_all: "Clear All",

    // Export
    h_export: "Export (STL/OBJ/3MF)", lbl_filename: "File Name", btn_export_single: "Export", btn_export_all: "Export All (STL)", btn_export_obj: "Export All (OBJ w/ Color)",
    btn_export_3mf: "Export All (3MF w/ Color)",

    // Batch
    h_batch: "Batch Export", lbl_batch_list: "Character List (comma/newline)", pl_batch: "Q,W,E,R,T,Y...",
    lbl_batch_format: "Output Format",
    note_batch: "*Generate using current settings.", btn_batch_run: "Run Batch",
    batch_processing: "Processing: ", batch_complete: "Done!",

    // Messages
    msg_import_err: "Import Error: Invalid JSON format.", msg_batch_empty: "Character list is empty.",
    toast_generating: "Generating mesh...", toast_stl_exported: "STL exported!",
    toast_obj_exported: "OBJ exported!", toast_3mf_exported: "3MF exported!",
    toast_export_failed: "Export failed: ", toast_no_body: "Error: No body geometry generated",

    // Import
    h_import: "Import 3D", btn_load_stl: "Load STL Model", lbl_weight: "Est. Weight:", lbl_cost: "Est. Cost:",
    lbl_vendor: "Vendor:", lbl_material: "Material:", btn_details: "▼ Details / Edit",
    lbl_manual_override: "Manual Override", lbl_price: "Price", lbl_spool: "Spool(g)", lbl_density: "Dens.",

    // Links
    link_wiki: "Go to Wiki", link_github: "Go to GitHub",
    lbl_show_hints: "Show Hints",

    // Export Popup
    popup_export_confirm: "Export Confirmation",
    popup_cancel: "Cancel",
    popup_export: "Export",
    popup_est_weight: "Est. Weight",
    popup_est_cost: "Est. Cost",
    popup_body_color: "Body Color",
    popup_text_color: "Text Color",
    popup_vendor: "Vendor",
    popup_material: "Material",
    popup_profile: "Profile",
    popup_size: "Size",
    popup_row: "Row",
    popup_text: "Text",
    popup_svg_icon: "SVG Icon",
    popup_printer: "Printer",
    popup_build_size: "Build Size",
    popup_key_count: "Key Count",
    popup_layout: "Layout",
    popup_char_list: "Character List",
    popup_format: "Format",
    popup_file_count: "File Count",

    // Sprue Kit
    sprue_printer_model: "Printer Model",
    sprue_max_keys: "Max Keys",
    sprue_key_count: "Keys in Kit",
    sprue_repeat_mode: "Repeat Same Character",
    sprue_char_list: "Character List (comma separated)",
    sprue_single_char: "Character to Repeat",
    sprue_output_format: "Output Format",
    sprue_generate: "Generate Sprue Kit",
    sprue_custom: "Custom Sprue Kit",
    sprue_generating: "Generating Sprue Kit...",
    sprue_unlimited: "Unlimited",

    // Tolerance Test
    tolerance_desc: "Generate a plate with stems only for testing printer tolerance.",
    tolerance_output_format: "Output Format",
    tolerance_generate: "Generate Test Kit",
    tolerance_start: "Start Value",
    tolerance_step: "Step",
    tolerance_generating: "Generating stem test kit...",
    tolerance_complete: "Stem test generated",
    popup_tol_start: "Start Value",
    popup_tol_step: "Step",
    popup_tol_count: "Count",
    popup_tol_values: "Clearance Values",

    // Row Descriptions
    row_r4: "R4 (Top Row/Number)",
    row_r3: "R3 (Letters/Enter)",
    row_r2: "R2 (Home Row/ASDF)",
    row_r1: "R1 (Bottom/Space)",

    // Additional UI
    lbl_custom_profile: "Custom Profile Settings",
    lbl_icon_size: "Icon Size",
    lbl_sub_text: "Sub Text (Legend 2)",
    lbl_side_print: "Side Print",
    preset_arrow: "Arrow Key",
    arrow_select_title: "Select Arrow Direction",
    wasd_select_title: "Select WASD Key",
    arrow_up: "Up",
    arrow_down: "Down",
    arrow_left: "Left",
    arrow_right: "Right",

    // More UI
    lbl_global_apply: "Global Apply",
    lbl_click_to_apply: "Click to apply as SVG",
    btn_presets: "Presets",
    btn_clear_stock_icon: "Clear Selection",
    btn_clear_preset: "Clear Preset",
    msg_preset_cleared: "Reset to default",
    msg_enter_repeat_char: "Please enter character to repeat",
    msg_enter_one_char: "Please enter at least one character",

    // Stabilizer
    lbl_stabilizer: "Stabilizer",
    opt_stab_auto: "Auto",
    opt_stab_custom: "Custom",
    lbl_stab_pitch: "Pitch (Center Offset)",
    note_stab_distance: "*Distance from center to stem center",

    // Texture Options
    opt_tex_knurling: "Knurling",
    opt_tex_stripes: "Stripes",
    opt_tex_ripple: "Ripple",
    opt_tex_wood: "Wood Grain",
    opt_tex_hammered: "Hammered",
    opt_tex_hexagon: "Hexagon",
    opt_tex_bricks: "Bricks",

    // Stem Options
    lbl_stem_extension: "Stem Extension",
    lbl_box_stem: "Box Stem",
    lbl_lego_stud: "Lego Stud",
    lbl_tilt: "Tilt Angle",
    lbl_import_op: "Operation Mode",
    opt_union: "Union (Add)",
    opt_subtract: "Subtract (Carve)",
    note_subtract: "*Subtract takes more processing time",

    // Categories
    cat_all: "All",
    msg_loading: "Loading...",
    btn_simple_export_stl: "Save as STL",
    btn_simple_export_3mf: "Save as 3MF",

    // V66 Simple Mode
    lbl_simple_mode: "Simple Mode",
    h_simple_mode: "Simple Mode",
    lbl_simple_text: "Text",
    lbl_text_visible: "Show Text",
    lbl_simple_font: "Font",
    lbl_simple_icon: "Icon",
    btn_clear_icon: "Clear Icon",
    lbl_simple_profile: "Profile",
    lbl_simple_row: "Row",
    lbl_simple_key_size: "Key Size",
    lbl_simple_body_color: "Body Color",
    lbl_simple_text_color: "Text Color",
    lbl_simple_text_mode: "Text Mode",
    lbl_simple_gen_mode: "Mode (Text & Icon)",
    view_front: "Front", view_back: "Back", view_right: "Right", view_left: "Left", view_top: "Top", view_bottom: "Btm",
    lbl_simple_taper: "Top Size",
    lbl_simple_dish: "Dish Type",
    lbl_simple_fillet: "Corner Radius",
    lbl_dimension_lines: "Show Dimensions",
    lbl_layer_color: "Layer Color Preview",
    lbl_visual_presets: "Visual Presets",
    lbl_stock_icons: "Icon List",
    lbl_tolerance_test: "Stem Test Kit",
    lbl_sprue_kit: "Sprue Kit Generation",

    // AMS Confirm Popup
    ams_confirm_title: "AMS Settings",
    ams_confirm_message: "AMS colors are not configured.<br>Would you like to set them up?",
    ams_confirm_hint: "*You can configure this later from the Settings tab",
    ams_confirm_later: "Later",
    ams_confirm_now: "Set Up Now",

    // AMS Settings Popup
    ams_popup_title: "AMS Color Settings (Slicer Sync)",
    ams_filament_select: "Filament Selection",
    ams_vendor: "Vendor",
    ams_material: "Material",
    ams_color_palette: "Color Palette (Drag)",
    ams_add_custom: "Add Custom Color",
    ams_capture_btn: "Capture from Screen",
    ams_slicer_sync: "Slicer Sync",
    ams_export_json: "Export JSON",
    btn_add: "Add",
    btn_apply: "Apply",
    wiki_hint: "Learn more on Wiki",

    // Batch Color Settings
    batch_color_title: "Batch Color Settings",
    batch_color_click_select: "▼ Click to Select",
    batch_color_body_filament: "Body Filament",
    batch_color_text_filament: "Text Filament",
    gallery_batch_color: "Colors",
    gallery_batch_export: "Export",

    // Screenshot Color Detection
    screenshot_title: "Capture Colors",
    screenshot_step1_hint: "Show filament list in slicer → Share Screen → Select Bambu Studio window",
    screenshot_scale: "Scale:",
    screenshot_capture: "Capture",
    screenshot_step2_hint: "Click in order of Bambu Studio numbers",
    screenshot_click_palette: "Click palette #1",
    screenshot_picked: "Picked:",
    screenshot_retry: "Restart",
    screenshot_add: "Add",
    screenshot_undo: "↩ Undo",
    screenshot_done: "Done",
    screenshot_step3_hint: "Verify captured colors (editable with color picker)",
    screenshot_back: "← Back",
    screenshot_apply: "Apply to AMS",

    // Context Menu
    ctx_reset_camera: "Reset Camera",
    ctx_top_view: "Reset Rotation (Top View)",
    ctx_random_color: "Random Color",
    ctx_wireframe: "Toggle Wireframe",
    body_disp_all: "All Parts",
    body_disp_body: "Body Only",
    body_disp_plate: "Plate Only",
    ctx_save_gallery: "Save to Gallery",

    // Batch Export
    batch_export_title: "Batch Export Confirmation",
    batch_export_format_select: "Select output format",
    batch_export_start: "Start Export",

    // Gallery Context Menu
    gallery_ctx_load: "Load",
    gallery_ctx_export: "Export",
    gallery_ctx_delete: "Delete",

    // Slicer Bridge
    slicer_bridge_title: "Open in Slicer",
    slicer_bridge_note: "Sends the model directly to the slicer via Keycap Slicer Bridge.",
    slicer_bridge_none: "No slicer detected by bridge.",
    slicer_bridge_ok: "Model sent to {name}",
    slicer_bridge_err: "Bridge connection failed",
    slicer_bridge_sending: "Sending to {name}...",
    slicer_open_label: "Open in {name}",
    slicer_download_desc: "Download file",
    slicer_connected: "Connected",

    // CSK (Custom Sprue Kit)
    csk_title: "Custom Sprue Kit",
    csk_gallery: "Gallery",
    csk_printer: "Printer",
    csk_batch_orient: "Batch Orient",
    csk_runner_color: "Runner Color:",
    csk_generate: "Generate Sprue Kit",
    csk_orientation: "Orientation",
    csk_drag_rotate: "Drag to rotate",
    csk_bottom_down: "Bottom facing down",
    csk_body_color: "Body Color",
    csk_text_color: "Text Color",
    csk_batch_orient_title: "Batch Orientation Settings",
    csk_selected_count: "0 selected",
    csk_select_all: "Select All",
    csk_deselect: "Deselect",
    csk_batch_hint: "Click tiles to select<br>Rotating the dice applies immediately",
    csk_done: "Done",

    // Gumball Target
    gumball_main_text: "Main Text",
    gumball_sub_text: "Sub Text",
    gumball_side_print: "Side Print",
    gumball_model: "Model",

    // Preset
    preset_loaded: "Loaded Presets",

    // Other UI
    simple_ams_select: "Select from AMS slots",
    btn_close: "Close",

    // Debug Panel
    debug_title: "Debug / Maintenance <span style=\"font-size:0.65rem; color:#888; font-weight:normal;\">(F5)</span>",
    debug_cache_section: "Cache / Data Clear",
    debug_clear_all: "Clear All Cache (Delete localStorage + Reload)",
    debug_clear_filament: "Clear Filament Settings (Reset AMS)",
    debug_clear_gallery: "Delete All Gallery (Remove all keycaps)",
    debug_clear_csk: "Reset Custom Sprue Kit Layout",
    debug_reset_state: "Reset Parameters (Restore defaults)",
    debug_reset_fm: "Reset Font Manager (Delete all saved fonts)",
    debug_reset_sm: "Reset SVG Manager (Delete all saved SVGs)",
    debug_state_section: "Current State Info",
    debug_tools_section: "Tools",
    debug_export_state: "Export All State as JSON",
    debug_import_state: "Import State from JSON",
    debug_force_rebuild: "Force Rebuild 3D Model",
    debug_log_state: "Log All State to Console",

    // Additional Translation Keys
    preset_empty: "No presets saved. Save from right-click menu or HUD's button.",
    warning_not_set: "Not configured",
    warning_body_filament: "body filament",
    warning_text_filament: "text filament",
    warning_both_filament: "both",
    click_to_select: "Click to select",
    popup_body_color_set: "Body Color Set",
    popup_text_color_set: "Text Color Set",
    popup_save_location: "Save Location",
    popup_download_folder: "Downloads Folder",
    unit_items: "items",
    ams_register_hint: "Select from AMS slots (Register colors in AMS settings)",
    ams_register_colors: "Register colors in AMS settings",
    ams_colors_applied: "colors applied to AMS slots",
    selected_label: "Selected",
    lbl_custom_height: "Height",
    lbl_custom_angle: "Angle",
    size_standard: "Standard",
    lbl_text_svg_filament: "Text/SVG Filament",
    preset_fn: "Fn Key",
    mobile_settings: "Settings",
    mobile_history: "History",
    mobile_view: "View",
    mobile_genmode: "Gen Mode",
    mobile_genmode_target: "Target",
    mobile_gumball: "Gumball",
    mobile_export: "Export",

    // Stem strength FEA
    h_stem_fea: "Stem Strength Analysis",
    nav_stem_fea: "Stem strength",
    stem_fea_intro: "Beam-theory structural analysis: pull-off / press / side-load / insertion hoop / layer adhesion stress + safety factors.",
    lbl_stem_fea_material: "Material",
    lbl_stem_fea_load: "Load profile",
    load_normal: "Normal typing",
    load_gaming: "Gaming (rapid)",
    load_extreme: "Extreme (drop)",
    btn_stem_fea_run: "⚙ Run analysis",

    // Keyset View (bulk keyboard generation)
    h_keyset_view: "Keyset View",
    nav_keyset_view: "Keyset View",
    lbl_keyset_view: "Enable keyset view",
    lbl_keyset_layout: "Layout",
    keyset_intro: "Generate the whole keyboard at once. Sliders for size / shape / color / text mode apply to every keycap simultaneously. Labels are auto-filled from the layout definition. Edit individual labels via the text-placement dialog.",
    keyset_export_note: "* Use the regular Export button. What you see is what gets exported.",
    btn_keyset_customize: "✎ Open text-placement dialog",
    // Text-placement dialog
    keyset_dlg_title: "Text Placement — Keyset View",
    keyset_dlg_text_mode: "Text mode (bulk)",
    keyset_dlg_font: "Font (bulk)",
    keyset_dlg_reset: "⟲ Reset labels",
    keyset_dlg_edit_label: "Text on this key",
    keyset_dlg_apply: "Apply",
    keyset_dlg_revert: "Default",
    keyset_dlg_cancel: "✕",
    keyset_dlg_close: "Close",
    keyset_dlg_hint: "Click a key to edit. Changes apply to the 3D view immediately.",
    text_mode_emboss: "Emboss",
    text_mode_engrave: "Engrave",
    text_mode_cutout: "Cutout",
    text_mode_inset: "Inset",
    text_mode_doubleshot: "Doubleshot"
};
