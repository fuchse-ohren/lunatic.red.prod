// =============================================
// KeybordStudio V1 - Body Generator Module
// modules/body/body-module.js
// =============================================

const MODULE_ID = 'body';
const MODULE_NAME = 'Body Generator';
const MODULE_PATH = 'modules/body/';

// ── State ──────────────────────────────────
const state = {
    layout: '60', layoutStandard: 'ansi', keyPitch: 19.05,
    wkl: false, hhkbBlocker: false,
    mountType: 'tray', standoffH: 5.0, standoffD: 5.5, standoffScrew: 2.5,
    gasketW: 5.0, gasketT: 2.5, gasketSpacing: 30,
    bezelTop: 5.0, bezelBottom: 8.0, bezelSide: 5.0,
    cornerRadius: 3.0, chamfer: 0.0, wallThickness: 3.0,
    profileType: 'high', bottomThickness: 2.5,
    tiltAngle: 0.0, negTilt: false,
    comfortEdge: 2.0,
    feetStage: 0,  // 0=flat, 1=stage1, 2=stage2
    usbType: 'usb-c', usbPosX: 50, usbPosY: 50, portMargin: 0.5,
    pcbClearance: 3.0, ribs: false, batterySpace: false, batteryPosX: 50, batteryPosZ: 50,
    tolerance: 0.15, insertNut: 'm3', splitPrint: false, mouseEar: false,
    encoder: false, oled: false, tripod: false,
    showRubberPads: true,
    rubberPadColor: '#222222', rubberPadExtruder: 1,
    feetColor: '#666666', feetExtruder: 1,
    topCaseColor: '#333333', topCaseExtruder: 1,
    bottomCaseColor: '#333333', bottomCaseExtruder: 1,
    plateColor: '#999999', plateExtruder: 1,
    displayMode: 'standard',  // 'standard' | 'wireframe'
    partFilter: 'all',        // 'all' | 'body' | 'plate'
    // テキスト印字 - トップケース上面
    enableTopText: false,
    topText: 'KeybordStudio',
    topTextFont: 'helvetiker',
    topTextSize: 6.0,
    topTextHeight: 0.5,
    topTextMode: 'emboss',
    topTextX: 0,
    topTextZ: 0,
    // テキスト印字 - トップケース側面
    enableTopSide: false,
    topSideText: 'KeybordStudio',
    topSideFont: 'helvetiker',
    topSideSize: 4.0,
    topSideMode: 'emboss',
    topSideFace: 'front',
    topSideY: 0,
    // テキスト印字 - ボトムケース底面
    enableBottomText: false,
    bottomText: 'KeybordStudio',
    bottomTextFont: 'helvetiker',
    bottomTextSize: 6.0,
    bottomTextHeight: 0.5,
    bottomTextMode: 'emboss',
    bottomTextX: 0,
    bottomTextZ: 0,
    // テキスト印字 - ボトムケース側面
    enableBottomSide: false,
    bottomSideText: 'KeybordStudio',
    bottomSideFont: 'helvetiker',
    bottomSideSize: 4.0,
    bottomSideMode: 'emboss',
    bottomSideFace: 'back',
    bottomSideY: 0,
    // テキスト共通
    textColor: '#ffffff',
    textExtruder: 2,
    // SVGアイコン
    enableSvg: false,
    svgContent: null,
    svgName: null,
    svgScale: 1.0,
    svgThickness: 0.5,
    svgMode: 'emboss',
    svgPosX: 0,
    svgPosZ: 0,
    svgRotZ: 0,
    svgTarget: 'top',  // 'top' | 'bottom'
    // Custom layout from Layout Gallery
    customLayoutData: null,
    customLayoutName: null,
    pcbImportName: null,    // PCB/プレートファイル名 (UI 表示用)
    pcbImportData: null,    // パース済みオブジェクト { outline, switchHoles, screwHoles, source }
    // Phase 7-3: ケース断面ビュー
    crossSectionEnabled: false,
    crossSectionAxis: 'y',
    crossSectionPos: 0,
    // Phase 9: アシスト機能
    // 1. Weight & material estimate
    assistMaterial: 'pla',
    // 3. Insert (heat-set) guide
    assistInsertSize: 'm3',
    // 4. Gasket compression simulator
    assistGasketThickness: 2.5,
    assistGasketHardness: 50,
    assistGasketCompression: 20,
    // 5. Acoustic tuning preset
    assistAcousticPreset: 'firm',
    // 8. Variation generator (last applied — informational)
    assistVariationApplied: null
};

// ── Body History System ───────────────────
const bodyHistory = [JSON.parse(JSON.stringify(state))];
let bodyHistoryIndex = 0;
let _bodyUndoHandler = null;
let _bodyRedoHandler = null;

function bodyCommitHistory() {
    if (bodyHistoryIndex < bodyHistory.length - 1) bodyHistory.splice(bodyHistoryIndex + 1);
    bodyHistory.push(JSON.parse(JSON.stringify(state)));
    bodyHistoryIndex++;
    if (bodyHistory.length > 50) { bodyHistory.shift(); bodyHistoryIndex--; }
    bodyUpdateHistoryBtns();
}
function bodyUndo() {
    if (bodyHistoryIndex > 0) {
        bodyHistoryIndex--;
        Object.assign(state, JSON.parse(JSON.stringify(bodyHistory[bodyHistoryIndex])));
        bodySyncUI();
        updateModel();
        bodyUpdateHistoryBtns();
    }
}
function bodyRedo() {
    if (bodyHistoryIndex < bodyHistory.length - 1) {
        bodyHistoryIndex++;
        Object.assign(state, JSON.parse(JSON.stringify(bodyHistory[bodyHistoryIndex])));
        bodySyncUI();
        updateModel();
        bodyUpdateHistoryBtns();
    }
}
function bodyUpdateHistoryBtns() {
    const uBtn = document.getElementById('btn-undo');
    const rBtn = document.getElementById('btn-redo');
    if (uBtn) uBtn.disabled = bodyHistoryIndex === 0;
    if (rBtn) rBtn.disabled = bodyHistoryIndex === bodyHistory.length - 1;
}
function bodySyncUI() {
    // Sync select/input elements to current state after undo/redo
    const idMap = {
        'body-layout-standard': 'layoutStandard',
        'body-mount-type': 'mountType', 'body-profile-type': 'profileType',
        'body-usb-type': 'usbType', 'body-standoff-h': 'standoffH',
        'body-standoff-d': 'standoffD', 'body-standoff-screw': 'standoffScrew',
        'body-gasket-w': 'gasketW', 'body-gasket-t': 'gasketT', 'body-gasket-sp': 'gasketSpacing',
        'body-bezel-top': 'bezelTop', 'body-bezel-bottom': 'bezelBottom', 'body-bezel-side': 'bezelSide',
        'body-corner-radius': 'cornerRadius', 'body-chamfer': 'chamfer', 'body-wall-thickness': 'wallThickness',
        'body-bottom-thickness': 'bottomThickness', 'body-tilt-angle': 'tiltAngle',
        'body-comfort-edge': 'comfortEdge',
        'body-usb-x': 'usbPosX', 'body-usb-y': 'usbPosY', 'body-port-margin': 'portMargin',
        'body-pcb-clearance': 'pcbClearance', 'body-tolerance': 'tolerance',
        // color pickers removed - AMS palette used instead
    };
    for (const [id, key] of Object.entries(idMap)) {
        const el = document.getElementById(id);
        if (el) el.value = state[key];
    }
    // Sync layout preset buttons
    document.querySelectorAll('.layout-preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.layout === state.layout);
    });
    // Sync feet stage buttons
    document.querySelectorAll('.feet-stage-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.stage, 10) === (state.feetStage || 0));
    });
    // Sync toggles
    const togSyncMap = {
        'body-wkl': 'wkl', 'body-hhkb-blocker': 'hhkbBlocker', 'body-neg-tilt': 'negTilt',
        'body-ribs': 'ribs', 'body-battery-space': 'batterySpace',
        'body-split-print': 'splitPrint', 'body-mouse-ear': 'mouseEar',
        'body-encoder': 'encoder', 'body-oled': 'oled', 'body-tripod': 'tripod',
        'body-rubber-pads': 'showRubberPads'
    };
    for (const [id, key] of Object.entries(togSyncMap)) {
        const el = document.getElementById(id);
        if (el) el.checked = !!state[key];
    }
    // Sync render mode and display mode dropdowns
    const renderSel = document.getElementById('render-mode');
    if (renderSel) renderSel.value = state.displayMode;
    const dispSel = document.getElementById('body-display-filter');
    if (dispSel) dispSel.value = state.partFilter;

    // ── テキスト印字 UI 同期 ──
    // ターゲットドロップダウン + パネル切替
    const targetSel = document.getElementById('body-text-target-select');
    if (targetSel) targetSel.value = currentBodyTextTarget;
    switchBodyTextPanel(currentBodyTextTarget);

    // トグルスイッチ
    const textToggles = {
        'body-enable-top-text': 'enableTopText',
        'body-enable-top-side': 'enableTopSide',
        'body-enable-bottom-text': 'enableBottomText',
        'body-enable-bottom-side': 'enableBottomSide',
    };
    for (const [id, prop] of Object.entries(textToggles)) {
        const el = document.getElementById(id);
        if (el) el.checked = !!state[prop];
    }
    // テキスト入力
    const textInputSync = {
        'body-top-text': 'topText', 'body-top-side-text': 'topSideText',
        'body-bottom-text': 'bottomText', 'body-bottom-side-text': 'bottomSideText',
    };
    for (const [id, prop] of Object.entries(textInputSync)) {
        const el = document.getElementById(id);
        if (el) el.value = state[prop];
    }
    // テキスト用スライダー
    const textSliderSync = {
        'body-top-text-size': { prop: 'topTextSize', vid: 'v-top-text-size' },
        'body-top-text-height': { prop: 'topTextHeight', vid: 'v-top-text-height' },
        'body-top-text-x': { prop: 'topTextX', vid: 'v-top-text-x' },
        'body-top-text-z': { prop: 'topTextZ', vid: 'v-top-text-z' },
        'body-top-side-size': { prop: 'topSideSize', vid: 'v-top-side-size' },
        'body-top-side-y': { prop: 'topSideY', vid: 'v-top-side-y' },
        'body-bottom-text-size': { prop: 'bottomTextSize', vid: 'v-bottom-text-size' },
        'body-bottom-text-height': { prop: 'bottomTextHeight', vid: 'v-bottom-text-height' },
        'body-bottom-text-x': { prop: 'bottomTextX', vid: 'v-bottom-text-x' },
        'body-bottom-text-z': { prop: 'bottomTextZ', vid: 'v-bottom-text-z' },
        'body-bottom-side-size': { prop: 'bottomSideSize', vid: 'v-bottom-side-size' },
        'body-bottom-side-y': { prop: 'bottomSideY', vid: 'v-bottom-side-y' },
    };
    for (const [id, cfg] of Object.entries(textSliderSync)) {
        const el = document.getElementById(id);
        if (el) el.value = state[cfg.prop];
        const v = document.getElementById(cfg.vid);
        if (v) v.textContent = state[cfg.prop];
    }
    // テキスト用セレクト（モードはHUDに移行、面選択のみ）
    const textSelectSync = {
        'body-top-side-face': 'topSideFace',
        'body-bottom-side-face': 'bottomSideFace',
    };
    for (const [id, prop] of Object.entries(textSelectSync)) {
        const el = document.getElementById(id);
        if (el) el.value = state[prop];
    }
    // フォント カスタムドロップダウン ヘッダー同期
    const fontHeadSync = {
        'body-top-text-font-head': 'topTextFont',
        'body-top-side-font-head': 'topSideFont',
        'body-bottom-text-font-head': 'bottomTextFont',
        'body-bottom-side-font-head': 'bottomSideFont',
    };
    for (const [id, prop] of Object.entries(fontHeadSync)) {
        const el = document.getElementById(id);
        if (el) {
            const label = (state[prop] || 'helvetiker').replace(/_/g, ' ').replace(/^custom /, '');
            el.textContent = label + ' ▼';
        }
    }
    // SVG UI 同期
    const svgToggle = document.getElementById('body-enable-svg');
    if (svgToggle) svgToggle.checked = !!state.enableSvg;
    const svgSyncMap = {
        'body-svg-scale': { prop: 'svgScale', vid: 'v-body-svg-scale' },
        'body-svg-icon-scale': { prop: 'svgScale', vid: 'v-body-svg-icon-scale' },
        'body-svg-thickness': { prop: 'svgThickness', vid: 'v-body-svg-thickness' },
        'body-svg-pos-x': { prop: 'svgPosX', vid: 'v-body-svg-pos-x' },
        'body-svg-pos-z': { prop: 'svgPosZ', vid: 'v-body-svg-pos-z' },
        'body-svg-rot-z': { prop: 'svgRotZ', vid: 'v-body-svg-rot-z' },
    };
    for (const [id, cfg] of Object.entries(svgSyncMap)) {
        const el = document.getElementById(id);
        if (el) el.value = state[cfg.prop];
        const v = document.getElementById(cfg.vid);
        if (v) v.textContent = state[cfg.prop];
    }
    const svgFace = document.getElementById('body-svg-target-face');
    if (svgFace) svgFace.value = state.svgTarget;

    // HUD mode同期
    syncBodyHudMode();
    // Custom layout UI同期
    syncCustomLayoutUI();
}

// ── Custom Layout UI State ────────────────
let _loadBodyGalleryFn = null;

function syncCustomLayoutUI() {
    const isCustom = !!state.customLayoutData;
    // Dim preset buttons
    document.querySelectorAll('.layout-preset-btn').forEach(btn => {
        if (isCustom) {
            btn.classList.remove('active');
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
        } else {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            btn.classList.toggle('active', btn.dataset.layout === state.layout);
        }
    });
    // Dim ISO/ANSI/JIS selector
    const stdSel = document.getElementById('body-layout-standard');
    if (stdSel) {
        stdSel.disabled = isCustom;
        stdSel.style.opacity = isCustom ? '0.4' : '1';
    }
    // Custom indicator
    const indicator = document.getElementById('custom-layout-indicator');
    if (indicator) {
        indicator.style.display = isCustom ? 'flex' : 'none';
        const nameEl = indicator.querySelector('.custom-layout-name');
        if (nameEl) nameEl.textContent = state.customLayoutName || 'Custom Layout';
    }
    // Gallery tile active state
    const grid = document.getElementById('layout-gallery-grid');
    if (grid) {
        grid.querySelectorAll('.layout-gallery-tile').forEach(t => {
            t.classList.toggle('active', isCustom && t.dataset.name === state.customLayoutName);
        });
    }
}

// ══════════════════════════════════════════════════════════
//  ANSI Key Layouts — position-based key definitions
//  Each key: { x, y, w }
//    x = left edge in U from plate left
//    y = top edge in U from plate top
//    w = key width in U (height always 1U)
//  Stabilizer wire spacing (Cherry spec):
//    2u-2.75u = 23.8mm (0.94")
//    6.25u    = 100mm  (3.94")
//    7u       = 114.3mm (4.5")
// ══════════════════════════════════════════════════════════

function getStabSpacing(wU) {
    if (wU >= 7) return 114.3;
    if (wU >= 6) return 100.0;
    if (wU >= 3) return 38.1;
    return 23.8;
}

// ── Generate key positions for each layout ──
function generateKeys(layoutId) {
    const keys = [];
    const K = (x, y, w) => keys.push({ x, y, w: w || 1 });

    if (layoutId === '60') {
        // Row 0 (number): 13×1u + BS(2u) = 15u
        for (let i = 0; i < 13; i++) K(i, 0, 1);
        K(13, 0, 2);  // Backspace
        // Row 1 (QWERTY): Tab(1.5) + 12×1u + \|(1.5) = 15u
        K(0, 1, 1.5); for (let i = 0; i < 12; i++) K(1.5 + i, 1, 1); K(13.5, 1, 1.5);
        // Row 2 (home): Caps(1.75) + 11×1u + Enter(2.25) = 15u
        K(0, 2, 1.75); for (let i = 0; i < 11; i++) K(1.75 + i, 2, 1); K(12.75, 2, 2.25);
        // Row 3 (shift): LShift(2.25) + 10×1u + RShift(2.75) = 15u
        K(0, 3, 2.25); for (let i = 0; i < 10; i++) K(2.25 + i, 3, 1); K(12.25, 3, 2.75);
        // Row 4 (ctrl): 1.25×3 + Space(6.25) + 1.25×4 = 15u
        K(0, 4, 1.25); K(1.25, 4, 1.25); K(2.5, 4, 1.25);
        K(3.75, 4, 6.25);
        K(10, 4, 1.25); K(11.25, 4, 1.25); K(12.5, 4, 1.25); K(13.75, 4, 1.25);
        return { keys, totalW: 15, totalH: 5 };
    }

    if (layoutId === '65') {
        // Row 0: 13×1u + BS(2u) + extra(1u) = 16u
        for (let i = 0; i < 13; i++) K(i, 0, 1);
        K(13, 0, 2); K(15, 0, 1);
        // Row 1
        K(0, 1, 1.5); for (let i = 0; i < 12; i++) K(1.5 + i, 1, 1); K(13.5, 1, 1.5); K(15, 1, 1);
        // Row 2
        K(0, 2, 1.75); for (let i = 0; i < 11; i++) K(1.75 + i, 2, 1); K(12.75, 2, 2.25); K(15, 2, 1);
        // Row 3
        K(0, 3, 2.25); for (let i = 0; i < 10; i++) K(2.25 + i, 3, 1); K(12.25, 3, 1.75); K(14, 3, 1); K(15, 3, 1);
        // Row 4
        K(0, 4, 1.25); K(1.25, 4, 1.25); K(2.5, 4, 1.25);
        K(3.75, 4, 6.25);
        K(10, 4, 1.25); K(11.25, 4, 1.25); K(12.5, 4, 1); K(13.5, 4, 1); K(14.5, 4, 1);
        return { keys, totalW: 16, totalH: 5 };
    }

    if (layoutId === '75') {
        // Row 0 (F-row): Esc + gap + F1-F4 + gap + F5-F8 + gap + F9-F12 + Del
        K(0, 0, 1); // Esc
        K(1.25, 0, 1); K(2.25, 0, 1); K(3.25, 0, 1); K(4.25, 0, 1); // F1-F4
        K(5.5, 0, 1); K(6.5, 0, 1); K(7.5, 0, 1); K(8.5, 0, 1); // F5-F8
        K(9.75, 0, 1); K(10.75, 0, 1); K(11.75, 0, 1); K(12.75, 0, 1); // F9-F12
        K(14, 0, 1); K(15, 0, 1); // PrtSc, Del
        // Row 1 (number)
        for (let i = 0; i < 13; i++) K(i, 1, 1);
        K(13, 1, 2); K(15, 1, 1);
        // Row 2
        K(0, 2, 1.5); for (let i = 0; i < 12; i++) K(1.5 + i, 2, 1); K(13.5, 2, 1.5); K(15, 2, 1);
        // Row 3
        K(0, 3, 1.75); for (let i = 0; i < 11; i++) K(1.75 + i, 3, 1); K(12.75, 3, 2.25); K(15, 3, 1);
        // Row 4
        K(0, 4, 2.25); for (let i = 0; i < 10; i++) K(2.25 + i, 4, 1); K(12.25, 4, 1.75); K(14, 4, 1); K(15, 4, 1);
        // Row 5
        K(0, 5, 1.25); K(1.25, 5, 1.25); K(2.5, 5, 1.25);
        K(3.75, 5, 6.25);
        K(10, 5, 1.25); K(11.25, 5, 1.25); K(12.5, 5, 1); K(13.5, 5, 1); K(14.5, 5, 1);
        return { keys, totalW: 16, totalH: 6 };
    }

    if (layoutId === 'tkl') {
        const navX = 15.5;  // nav cluster X offset (0.5u gap after main)
        // Row 0 (F-row): Esc, gap, F1-F4, gap, F5-F8, gap, F9-F12
        K(0, 0, 1);
        for (let i = 0; i < 4; i++) K(2 + i, 0, 1);         // F1-F4
        for (let i = 0; i < 4; i++) K(6.5 + i, 0, 1);       // F5-F8
        for (let i = 0; i < 4; i++) K(11 + i, 0, 1);        // F9-F12
        K(navX, 0, 1); K(navX + 1, 0, 1); K(navX + 2, 0, 1); // PrtSc ScrLk Pause

        const y1 = 1.5; // 0.5u gap after F-row
        // Row 1 (number)
        for (let i = 0; i < 13; i++) K(i, y1, 1);
        K(13, y1, 2); // BS
        K(navX, y1, 1); K(navX + 1, y1, 1); K(navX + 2, y1, 1); // Ins Home PgUp
        // Row 2
        K(0, y1 + 1, 1.5); for (let i = 0; i < 12; i++) K(1.5 + i, y1 + 1, 1); K(13.5, y1 + 1, 1.5);
        K(navX, y1 + 1, 1); K(navX + 1, y1 + 1, 1); K(navX + 2, y1 + 1, 1); // Del End PgDn
        // Row 3
        K(0, y1 + 2, 1.75); for (let i = 0; i < 11; i++) K(1.75 + i, y1 + 2, 1); K(12.75, y1 + 2, 2.25);
        // Row 4
        K(0, y1 + 3, 2.25); for (let i = 0; i < 10; i++) K(2.25 + i, y1 + 3, 1); K(12.25, y1 + 3, 2.75);
        K(navX + 1, y1 + 3, 1); // Up arrow
        // Row 5
        K(0, y1 + 4, 1.25); K(1.25, y1 + 4, 1.25); K(2.5, y1 + 4, 1.25);
        K(3.75, y1 + 4, 6.25);
        K(10, y1 + 4, 1.25); K(11.25, y1 + 4, 1.25); K(12.5, y1 + 4, 1.25); K(13.75, y1 + 4, 1.25);
        K(navX, y1 + 4, 1); K(navX + 1, y1 + 4, 1); K(navX + 2, y1 + 4, 1); // Left Down Right

        return { keys, totalW: 18.5, totalH: 6.5 };
    }

    if (layoutId === 'full') {
        const navX = 15.5;   // nav cluster offset
        const npX = 18.75;  // numpad offset

        // ── F-row (y=0) ──
        K(0, 0, 1); // Esc
        for (let i = 0; i < 4; i++) K(2 + i, 0, 1);         // F1-F4
        for (let i = 0; i < 4; i++) K(6.5 + i, 0, 1);       // F5-F8
        for (let i = 0; i < 4; i++) K(11 + i, 0, 1);        // F9-F12
        K(navX, 0, 1); K(navX + 1, 0, 1); K(navX + 2, 0, 1); // PrtSc ScrLk Pause

        const y1 = 1.5; // 0.5u gap

        // ── Number row (y=1.5) ──
        for (let i = 0; i < 13; i++) K(i, y1, 1);
        K(13, y1, 2);  // Backspace (2u)
        K(navX, y1, 1); K(navX + 1, y1, 1); K(navX + 2, y1, 1); // Ins Home PgUp
        K(npX, y1, 1); K(npX + 1, y1, 1); K(npX + 2, y1, 1); K(npX + 3, y1, 1); // NumLk / * -

        // ── QWERTY row (y=2.5) ──
        K(0, y1 + 1, 1.5);
        for (let i = 0; i < 12; i++) K(1.5 + i, y1 + 1, 1);
        K(13.5, y1 + 1, 1.5); // backslash
        K(navX, y1 + 1, 1); K(navX + 1, y1 + 1, 1); K(navX + 2, y1 + 1, 1); // Del End PgDn
        K(npX, y1 + 1, 1); K(npX + 1, y1 + 1, 1); K(npX + 2, y1 + 1, 1); // 7 8 9
        // Numpad + (1u wide × 2u tall, but one switch at center)
        keys.push({ x: npX + 3, y: y1 + 1, w: 1, h: 2, isTall: true });

        // ── Home row (y=3.5) ──
        K(0, y1 + 2, 1.75);
        for (let i = 0; i < 11; i++) K(1.75 + i, y1 + 2, 1);
        K(12.75, y1 + 2, 2.25); // Enter
        // Nav: empty row
        K(npX, y1 + 2, 1); K(npX + 1, y1 + 2, 1); K(npX + 2, y1 + 2, 1); // 4 5 6

        // ── Shift row (y=4.5) ──
        K(0, y1 + 3, 2.25); // LShift
        for (let i = 0; i < 10; i++) K(2.25 + i, y1 + 3, 1);
        K(12.25, y1 + 3, 2.75); // RShift
        K(navX + 1, y1 + 3, 1); // Up arrow
        K(npX, y1 + 3, 1); K(npX + 1, y1 + 3, 1); K(npX + 2, y1 + 3, 1); // 1 2 3
        // Numpad Enter (1u × 2u tall, one switch)
        keys.push({ x: npX + 3, y: y1 + 3, w: 1, h: 2, isTall: true });

        // ── Ctrl row (y=5.5) ──
        K(0, y1 + 4, 1.25); K(1.25, y1 + 4, 1.25); K(2.5, y1 + 4, 1.25);
        K(3.75, y1 + 4, 6.25); // Space
        K(10, y1 + 4, 1.25); K(11.25, y1 + 4, 1.25); K(12.5, y1 + 4, 1.25); K(13.75, y1 + 4, 1.25);
        K(navX, y1 + 4, 1); K(navX + 1, y1 + 4, 1); K(navX + 2, y1 + 4, 1); // Left Down Right
        K(npX, y1 + 4, 2); // 0 (2u wide)
        K(npX + 2, y1 + 4, 1); // .

        return { keys, totalW: 22.75, totalH: 6.5 };
    }

    if (layoutId === '40') {
        // Row 0: 12×1u = 12u
        for (let i = 0; i < 12; i++) K(i, 0, 1);
        // Row 1: 1.25 + 10×1u + 1.75 = 13u? No, 40% is 12u
        K(0, 1, 1.25); for (let i = 0; i < 10; i++) K(1.25 + i, 1, 1); K(11.25, 1, 0.75);
        // Row 2: 1.75 + 9×1u + 1.25 = 12u
        K(0, 2, 1.75); for (let i = 0; i < 9; i++) K(1.75 + i, 2, 1); K(10.75, 2, 1.25);
        // Row 3: 1.25 + 1.25 + 1.25 + 2.25 + 1 + 2.75 + 1.25 = 11u (pad to 12)
        K(0, 3, 1.25); K(1.25, 3, 1.25); K(2.5, 3, 1.25);
        K(3.75, 3, 2.25); K(6, 3, 1); K(7, 3, 2.75);
        K(9.75, 3, 1); K(10.75, 3, 1.25);
        return { keys, totalW: 12, totalH: 4 };
    }

    if (layoutId === 'alice') {
        // Simplified alice: split ergo, 15u wide × 5 rows
        // Row 0: 1 + 13×1u + BS(2u) - split gap
        for (let i = 0; i < 7; i++) K(i, 0, 1);
        for (let i = 0; i < 6; i++) K(7.5 + i, 0, 1);
        K(13.5, 0, 1.5); // BS
        // Row 1
        K(0, 1, 1.5);
        for (let i = 0; i < 6; i++) K(1.5 + i, 1, 1);
        for (let i = 0; i < 6; i++) K(8 + i, 1, 1);
        K(14, 1, 1);
        // Row 2
        K(0, 2, 1.75);
        for (let i = 0; i < 6; i++) K(1.75 + i, 2, 1);
        for (let i = 0; i < 5; i++) K(8.25 + i, 2, 1);
        K(13.25, 2, 1.75);
        // Row 3
        K(0, 3, 2.25);
        for (let i = 0; i < 5; i++) K(2.25 + i, 3, 1);
        for (let i = 0; i < 5; i++) K(7.75 + i, 3, 1);
        K(12.75, 3, 1.75); K(14.5, 3, 0.5);
        // Row 4
        K(0, 4, 1.25); K(1.25, 4, 1.25); K(2.5, 4, 1.25);
        K(3.75, 4, 2.25); K(6.25, 4, 1.25); K(7.5, 4, 2.75);
        K(10.25, 4, 1.25); K(11.5, 4, 1.25); K(12.75, 4, 1.25);
        return { keys, totalW: 15, totalH: 5 };
    }

    if (layoutId === '1800') {
        // 1800 Compact (96%) — Cherry G80-1800 inspired, modern 96-key style
        // Clusters compressed: main block (15u) + 1u gap + numpad (4u) = 20u
        // Width: 20u, Height: 6.5u (F-row + 0.5u gap + 5 rows)
        // Arrow keys fit in the gap between main block and numpad
        // Numpad 0 is 1u (Cherry G80-1800 standard)
        const npX = 16;  // numpad column 1 starts here (1u gap after main block)

        // ── F-row (y=0): Esc + F1-F12 (grouped) + Del + numpad indicators ──
        K(0, 0, 1); // Esc
        for (let i = 0; i < 4; i++) K(1.25 + i, 0, 1);       // F1-F4
        for (let i = 0; i < 4; i++) K(5.5 + i, 0, 1);        // F5-F8
        for (let i = 0; i < 4; i++) K(9.75 + i, 0, 1);       // F9-F12
        K(14, 0, 1);  // Delete (or PrtSc)
        K(15, 0, 1);  // Insert (or ScrLk)
        K(npX, 0, 1); K(npX + 1, 0, 1); K(npX + 2, 0, 1); K(npX + 3, 0, 1); // Home PgUp PgDn End

        const y1 = 1.5; // 0.5u gap after F-row

        // ── Number row (y=1.5): ~ + 1-0 + -/= + BS(2u) + NumLk / * - ──
        for (let i = 0; i < 13; i++) K(i, y1, 1);
        K(13, y1, 2);  // Backspace (2u)
        K(15, y1, 1);  // Nav key (Ins or extra)
        K(npX, y1, 1); K(npX + 1, y1, 1); K(npX + 2, y1, 1); K(npX + 3, y1, 1); // NumLk / * -

        // ── QWERTY row (y=2.5) ──
        K(0, y1 + 1, 1.5);  // Tab
        for (let i = 0; i < 12; i++) K(1.5 + i, y1 + 1, 1);
        K(13.5, y1 + 1, 1.5);  // Backslash (1.5u)
        K(npX, y1 + 1, 1); K(npX + 1, y1 + 1, 1); K(npX + 2, y1 + 1, 1); // 7 8 9
        keys.push({ x: npX + 3, y: y1 + 1, w: 1, h: 2, isTall: true }); // Numpad + (tall)

        // ── Home row (y=3.5) ──
        K(0, y1 + 2, 1.75);  // CapsLock
        for (let i = 0; i < 11; i++) K(1.75 + i, y1 + 2, 1);
        K(12.75, y1 + 2, 2.25);  // Enter (2.25u)
        K(npX, y1 + 2, 1); K(npX + 1, y1 + 2, 1); K(npX + 2, y1 + 2, 1); // 4 5 6

        // ── Shift row (y=4.5): LShift + keys + RShift(1.75u) + Up + numpad ──
        K(0, y1 + 3, 2.25);  // LShift
        for (let i = 0; i < 10; i++) K(2.25 + i, y1 + 3, 1);
        K(12.25, y1 + 3, 1.75); // RShift (1.75u — Cherry G80-1800 standard)
        K(14, y1 + 3, 1);       // Up arrow (between main block and numpad)
        K(15, y1 + 3, 1);       // PgUp (or extra nav key)
        K(npX, y1 + 3, 1); K(npX + 1, y1 + 3, 1); K(npX + 2, y1 + 3, 1); // 1 2 3
        keys.push({ x: npX + 3, y: y1 + 3, w: 1, h: 2, isTall: true }); // Numpad Enter (tall)

        // ── Bottom row (y=5.5): mods + Space(6.25u) + mods(1u) + arrows + numpad ──
        K(0, y1 + 4, 1.25); K(1.25, y1 + 4, 1.25); K(2.5, y1 + 4, 1.25); // Ctrl Win Alt
        K(3.75, y1 + 4, 6.25); // Space
        K(10, y1 + 4, 1); K(11, y1 + 4, 1); K(12, y1 + 4, 1);  // Alt Fn Ctrl (1u each)
        K(13, y1 + 4, 1);    // Left arrow
        K(14, y1 + 4, 1);    // Down arrow
        K(15, y1 + 4, 1);    // Right arrow
        K(npX, y1 + 4, 1); K(npX + 1, y1 + 4, 1); K(npX + 2, y1 + 4, 1); // 0(1u) . (1u) + extra

        return { keys, totalW: 20, totalH: 6.5 };
    }

    if (layoutId === 'macro') {
        for (let r = 0; r < 3; r++)
            for (let c = 0; c < 3; c++) K(c, r, 1);
        return { keys, totalW: 3, totalH: 3 };
    }

    // default 60%
    return generateKeys('60');
}

// ══════════════════════════════════════════════════════════
//  Convert Layout Studio symbols → Body module layout data
// ══════════════════════════════════════════════════════════
const LAYOUT_SYMBOL_INFO = {
    'switch-1u':         { hasSwitch: true, hasStab: false, isScrew: false },
    'switch-1.25u':      { hasSwitch: true, hasStab: false, isScrew: false },
    'switch-2u-stab':    { hasSwitch: true, hasStab: true,  isScrew: false },
    'switch-2.25u-stab': { hasSwitch: true, hasStab: true,  isScrew: false },
    'switch-2.75u-stab': { hasSwitch: true, hasStab: true,  isScrew: false },
    'switch-6.25u-stab': { hasSwitch: true, hasStab: true,  isScrew: false },
    'switch-7u-stab':    { hasSwitch: true, hasStab: true,  isScrew: false },
    'stab-2u':           { hasSwitch: false, hasStab: true, isScrew: false },
    'stab-6.25u':        { hasSwitch: false, hasStab: true, isScrew: false },
    'stab-7u':           { hasSwitch: false, hasStab: true, isScrew: false },
    'screw-m2':          { hasSwitch: false, hasStab: false, isScrew: true, screwDia: 2.0 },
    'screw-m2.5':        { hasSwitch: false, hasStab: false, isScrew: true, screwDia: 2.5 },
};

function convertLayoutToBodyData(layoutState, pitch) {
    const PX_PER_MM = 2;
    const syms = layoutState.symbols || [];
    const cadLines = layoutState.cadLines || [];

    // Filter switch symbols
    const switchSyms = syms.filter(s => {
        const info = LAYOUT_SYMBOL_INFO[s.type];
        return info && info.hasSwitch;
    });
    if (switchSyms.length === 0 && cadLines.length === 0) return null;

    // Compute effective bounds for each switch symbol
    function getEffBounds(s) {
        const rot = ((s.rotation || 0) % 360 + 360) % 360;
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;
        let effW, effH;
        if (rot === 90 || rot === 270) {
            effW = s.height; effH = s.width;
        } else if (rot === 0 || rot === 180) {
            effW = s.width; effH = s.height;
        } else {
            // Arbitrary rotation: axis-aligned bounding box
            const rad = rot * Math.PI / 180;
            const cosA = Math.abs(Math.cos(rad)), sinA = Math.abs(Math.sin(rad));
            effW = s.width * cosA + s.height * sinA;
            effH = s.width * sinA + s.height * cosA;
        }
        return { cx, cy, left: cx - effW / 2, right: cx + effW / 2, top: cy - effH / 2, bottom: cy + effH / 2, effW, effH };
    }

    // Bounding box of all switch symbols and CAD lines
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const switchBounds = switchSyms.map(s => {
        const b = getEffBounds(s);
        if (b.left < minX) minX = b.left;
        if (b.right > maxX) maxX = b.right;
        if (b.top < minY) minY = b.top;
        if (b.bottom > maxY) maxY = b.bottom;
        return b;
    });

    // Include CAD lines in bounding box
    for (const line of cadLines) {
        if (line.x1 < minX) minX = line.x1;
        if (line.x2 < minX) minX = line.x2;
        if (line.x1 > maxX) maxX = line.x1;
        if (line.x2 > maxX) maxX = line.x2;
        if (line.y1 < minY) minY = line.y1;
        if (line.y2 < minY) minY = line.y2;
        if (line.y1 > maxY) maxY = line.y1;
        if (line.y2 > maxY) maxY = line.y2;
        // Include arc bounds if present
        if (line.arc) {
            const r = line.arc.r;
            if (line.arc.cx - r < minX) minX = line.arc.cx - r;
            if (line.arc.cx + r > maxX) maxX = line.arc.cx + r;
            if (line.arc.cy - r < minY) minY = line.arc.cy - r;
            if (line.arc.cy + r > maxY) maxY = line.arc.cy + r;
        }
    }

    // If only CAD lines (no switches), return null (can't generate plate without switches)
    if (switchSyms.length === 0) return null;

    const totalWmm = (maxX - minX) / PX_PER_MM;
    const totalHmm = (maxY - minY) / PX_PER_MM;
    const totalW = totalWmm / pitch;
    const totalH = totalHmm / pitch;

    // Convert each switch symbol to a key
    const keys = switchSyms.map((s, idx) => {
        const b = switchBounds[idx];
        // Key center position relative to bounding box origin
        const centerX = (b.cx - minX) / PX_PER_MM / pitch;
        const centerY = (b.cy - minY) / PX_PER_MM / pitch;
        // Use original width/height (before rotation) for key size
        const kw = s.width / PX_PER_MM / pitch;
        const kh = s.height / PX_PER_MM / pitch;
        // Key position (top-left) = center - half size
        const kx = centerX - kw / 2;
        const ky = centerY - kh / 2;
        const key = { x: kx, y: ky, w: kw };
        if (Math.abs(kh - 1) > 0.05) {
            key.h = kh;
            if (kh >= 1.8) key.isTall = true;
        }
        return key;
    });

    // Convert screw symbols
    const screwSyms = syms.filter(s => {
        const info = LAYOUT_SYMBOL_INFO[s.type];
        return info && info.isScrew;
    });
    const customScrews = screwSyms.map(s => {
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;
        const xu = ((cx - minX) / PX_PER_MM) / pitch;
        const yu = ((cy - minY) / PX_PER_MM) / pitch;
        return { u: xu - totalW / 2, v: yu - totalH / 2 };
    });

    // ── Build plate outline from CAD lines ──
    let plateOutline = null;
    if (cadLines.length >= 3) {
        // Convert cadLines to shape coords (plate-centered mm, Y-up)
        const outlineSegs = cadLines.map(line => {
            const seg = {
                x1: (line.x1 - minX) / PX_PER_MM - totalWmm / 2,
                y1: totalHmm / 2 - (line.y1 - minY) / PX_PER_MM,
                x2: (line.x2 - minX) / PX_PER_MM - totalWmm / 2,
                y2: totalHmm / 2 - (line.y2 - minY) / PX_PER_MM,
            };
            if (line.arc) {
                seg.arc = {
                    cx: (line.arc.cx - minX) / PX_PER_MM - totalWmm / 2,
                    cy: totalHmm / 2 - (line.arc.cy - minY) / PX_PER_MM,
                    r: line.arc.r / PX_PER_MM,
                    startAngle: -line.arc.startAngle,
                    endAngle: -line.arc.endAngle,
                    ccw: !line.arc.ccw,
                };
            }
            if (line.bezier) {
                seg.bezier = {
                    cpx: (line.bezier.cpx - minX) / PX_PER_MM - totalWmm / 2,
                    cpy: totalHmm / 2 - (line.bezier.cpy - minY) / PX_PER_MM,
                };
            }
            return seg;
        });
        plateOutline = _buildClosedPath(outlineSegs);
    }

    return {
        keys,
        totalW,
        totalH,
        customScrews: customScrews.length > 0 ? customScrews : null,
        plateOutline,
    };
}

// ══════════════════════════════════════════════════════════
//  ISO / JIS Layout Standard Modifier
//  Adjusts ANSI key positions to ISO or JIS standard.
//  alphaY = Y coordinate of the number row (row 0 of alpha block)
// ══════════════════════════════════════════════════════════
function applyLayoutStandard(keys, standard, alphaY) {
    if (!standard || standard === 'ansi') return;

    const qwY = alphaY + 1;   // QWERTY row
    const hmY = alphaY + 2;   // Home row
    const shY = alphaY + 3;   // Shift row

    // === ISO Enter (shared by ISO and JIS) ===

    // Row 1 (QWERTY): Remove backslash key (w=1.5 near end of row)
    const bsIdx = keys.findIndex(k => k.y === qwY && k.w === 1.5 && k.x >= 13);
    if (bsIdx >= 0) keys.splice(bsIdx, 1);

    // Row 2 (Home): Replace horizontal Enter (2.25u) with 1u key + tall ISO Enter
    const entIdx = keys.findIndex(k => k.y === hmY && k.w === 2.25);
    if (entIdx >= 0) {
        const ent = keys.splice(entIdx, 1)[0];
        keys.push({ x: ent.x, y: hmY, w: 1 });                           // # / extra key
        keys.push({ x: ent.x + 1, y: qwY, w: 1.25, h: 2, isTall: true }); // ISO Enter (tall)
    }

    // === ISO-specific: shorter left shift ===
    if (standard === 'iso') {
        const ls = keys.find(k => k.y === shY && k.x === 0 && k.w >= 2 && k.w <= 2.5);
        if (ls) {
            ls.w = 1.25;
            keys.push({ x: 1.25, y: shY, w: 1 }); // extra key (backslash / regional)
        }
    }

    // === JIS-specific modifications ===
    if (standard === 'jis') {
        const numY = alphaY;
        const btY = alphaY + 4;

        // Row 0 (Number): Split 2u Backspace → Yen(1u) + BS(1u)
        const bs = keys.find(k => k.y === numY && k.w === 2);
        if (bs) {
            const bx = bs.x;
            bs.w = 1;                                    // Yen key
            keys.push({ x: bx + 1, y: numY, w: 1 });   // Backspace (1u)
        }

        // Row 3 (Shift): Split RShift (≥2.5u) → extra(1u) + shorter RShift
        const rs = keys.find(k => k.y === shY && k.w >= 2.5);
        if (rs) {
            const rx = rs.x;
            const rw = rs.w;
            rs.w = 1;                                        // extra key (underscore / ro)
            keys.push({ x: rx + 1, y: shY, w: rw - 1 });   // shorter RShift
        }

        // Row 4 (Bottom): Replace main-block mods with JIS layout
        // Keep navigation/numpad keys at x >= 15
        const navBtKeys = keys.filter(k => k.y === btY && k.x >= 15);
        for (let i = keys.length - 1; i >= 0; i--) {
            if (keys[i].y === btY) keys.splice(i, 1);
        }
        // JIS bottom row (15u total, 3.75u spacebar)
        [
            { x: 0, w: 1.25 },       // Ctrl
            { x: 1.25, w: 1.25 },    // Win
            { x: 2.5, w: 1.25 },     // Alt
            { x: 3.75, w: 1.25 },    // 無変換 (Muhenkan)
            { x: 5, w: 3.75 },       // Space (3.75u)
            { x: 8.75, w: 1.25 },    // 変換 (Henkan)
            { x: 10, w: 1.25 },      // カナ (Kana)
            { x: 11.25, w: 1.25 },   // Alt
            { x: 12.5, w: 1.25 },    // Fn
            { x: 13.75, w: 1.25 },   // Ctrl
        ].forEach(k => keys.push({ x: k.x, y: btY, w: k.w }));
        // Re-add nav/numpad keys
        navBtKeys.forEach(k => keys.push(k));
    }
}

// ── Dynamic screw position generator ──
// Screws placed at ROW BOUNDARIES (between rows of keys).
// At a boundary, Y-distance to nearest key center ≥ 0.5u = 9.5mm
// Switch hole half = 7mm, screw radius ~1.25mm → clearance ≥ 1.25mm
//
// Returns [{u, v}] where u,v are pitch units from plate CENTER
function generateScrewPositions(layoutData) {
    const W = layoutData.totalW;
    const H = layoutData.totalH;
    const cx = W / 2, cy = H / 2;
    const keys = layoutData.keys;
    const rowYs = [...new Set(keys.map(k => k.y))].sort((a, b) => a - b);

    const screws = [];
    const added = new Set();
    function add(u, v) {
        const key = (Math.round(u * 10)) + ',' + (Math.round(v * 10));
        if (added.has(key)) return;
        added.add(key);
        screws.push({ u, v });
    }

    // Row boundaries: midpoint between consecutive rows
    const rowBounds = [];
    for (let i = 0; i < rowYs.length - 1; i++) {
        const gapCenter = rowYs[i] + 1 + (rowYs[i + 1] - rowYs[i] - 1) / 2;
        rowBounds.push(gapCenter);
    }

    // Distribute screws along each row boundary
    // Pattern: left-quarter, center, right-quarter (+ extras for wide boards)
    rowBounds.forEach((yBound, idx) => {
        const v = yBound - cy;
        const isFirst = idx === 0;
        const isLast = idx === rowBounds.length - 1;
        const isAlt = idx % 2 === 0;

        // Every boundary: left-third and right-third
        add(-cx * 0.55, v);
        add(cx * 0.55, v);

        // Alternate boundaries (or first/last): center screw
        if (isFirst || isLast || isAlt) {
            add(0, v);
        }

        // Wide boards (>16u): add extra quarter-width screws
        if (W > 16) {
            if (isFirst || isLast) {
                add(-cx * 0.85, v);
                add(cx * 0.85, v);
            }
        }
        // Very wide boards (>20u): even more screws
        if (W > 20 && (isFirst || isLast || isAlt)) {
            add(-cx * 0.85, v);
            add(cx * 0.85, v);
        }
    });

    return screws;
}

const USB_DIMS = {
    'usb-c': { w: 9.0, h: 3.4 },
    'micro-usb': { w: 7.5, h: 2.7 },
    'mini-usb': { w: 7.6, h: 4.0 },
    'trrs': { w: 6.2, h: 6.2 }
};

const SECTION_OPTIONS = [
    { value: '', label: '--- Jump to Section ---' },
    { value: 'sec-body-layout', label: 'Layout' },
    { value: 'sec-body-mount', label: 'Mount Style' },
    { value: 'sec-body-case', label: 'Case Design' },
    { value: 'sec-body-ergo', label: 'Ergonomics' },
    { value: 'sec-body-port', label: 'Connectivity' },
    { value: 'sec-body-internal', label: 'Internal' },
    { value: 'sec-body-print', label: '3D Print' },
    { value: 'sec-body-addon', label: 'Add-ons' },
    { value: 'sec-body-text', label: 'Text / Legend' },
    { value: 'sec-body-color', label: 'Colors' },
    { value: 'sec-body-export', label: 'Export' },
];

// ── Context ────────────────────────────────
let THREE, scene, camera, controls;
let showToast, currentLang, STLExporter, JSZip, saveAs;
let sceneGroup = null;
// テキスト印字用の共有リソース
let makeTextGeo, loadedFontData, loadedFonts;
let csgEvaluator, Brush, SUBTRACTION, ADDITION, safeMerge, BufferGeometryUtils;
let SVGLoader;
let _lastBodyVolCm3 = 0;

// フィラメントコスト計算（body用）
function updateBodyStats() {
    const vol = _lastBodyVolCm3;
    const vEl = document.getElementById('v-internal-volume');
    if (vEl) vEl.textContent = vol.toFixed(1);

    const density = parseFloat(document.getElementById('fil-density')?.value) || 1.24;
    const weight = vol * density;
    const wEl = document.getElementById('info-weight');
    if (wEl) wEl.textContent = weight.toFixed(1);

    const price = parseFloat(document.getElementById('fil-price')?.value) || 0;
    const capacity = parseFloat(document.getElementById('fil-capacity')?.value) || 1000;
    const cost = (capacity > 0) ? weight * (price / capacity) : 0;
    const cEl = document.getElementById('info-cost');
    if (cEl) {
        const lang = typeof currentLang === 'function' ? currentLang() : currentLang;
        cEl.textContent = (lang === 'ja') ? Math.ceil(cost) : cost.toFixed(2);
    }
}

// テキスト編集ターゲット（keycap generator の currentTextTarget と同じ方式）
let currentBodyTextTarget = 'topText';

// requestAnimationFrame ベースの updateModel デバウンス
let _bodyUpdateRAF = null;
let _bodyUpdateTimer = null;
function requestBodyUpdate() {
    if (_bodyUpdateRAF) return;
    _bodyUpdateRAF = requestAnimationFrame(() => {
        _bodyUpdateRAF = null;
        updateModel();
    });
}
// テキスト入力など、重いパイプラインを走らせたくない場面用の遅延デバウンス
function requestBodyUpdateDebounced(delay) {
    if (typeof delay !== 'number') delay = 300;
    if (_bodyUpdateTimer) clearTimeout(_bodyUpdateTimer);
    if (_bodyUpdateRAF) { cancelAnimationFrame(_bodyUpdateRAF); _bodyUpdateRAF = null; }
    _bodyUpdateTimer = setTimeout(() => { _bodyUpdateTimer = null; updateModel(); }, delay);
}

// テキストパネル切替
function switchBodyTextPanel(target) {
    currentBodyTextTarget = target;
    const panels = ['topText', 'topSide', 'bottomText', 'bottomSide', 'svg'];
    panels.forEach(p => {
        const el = document.getElementById('body-text-panel-' + p);
        if (el) el.style.display = (p === target) ? '' : 'none';
    });
    // HUD mode-select を現在ターゲットのモードに同期
    syncBodyHudMode();
    // サイドパネルのターゲットドロップダウンも同期
    const sel = document.getElementById('body-text-target-select');
    if (sel) sel.value = target;
    // HUD target も同期
    const hudTarget = document.getElementById('hud-mode-target');
    if (hudTarget && hudTarget._bodyHandler) hudTarget.value = target;
}

// HUD の生成モードドロップダウンを現在ターゲットのモードに同期
function syncBodyHudMode() {
    const hudMode = document.getElementById('hud-mode-select');
    if (!hudMode) return;
    const modeMap = {
        topText: 'topTextMode', topSide: 'topSideMode',
        bottomText: 'bottomTextMode', bottomSide: 'bottomSideMode',
        svg: 'svgMode',
    };
    const key = modeMap[currentBodyTextTarget];
    if (key) hudMode.value = state[key];
}

// ── Loaders ────────────────────────────────
function loadCSS() {
    if (document.getElementById('body-module-css')) return;
    const link = document.createElement('link');
    link.id = 'body-module-css'; link.rel = 'stylesheet';
    link.href = MODULE_PATH + 'body-css.css';
    document.head.appendChild(link);
}
async function loadUI(container) {
    try {
        const r = await fetch(MODULE_PATH + 'body-ui.html');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        container.innerHTML = await r.text();
    } catch (e) {
        console.error('[BodyModule] UI load failed:', e);
        container.innerHTML = '<p style="color:#ff5252;">Body module UI load failed.</p>';
    }
}

// ── Geometry helpers ───────────────────────
function createRoundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    r = Math.min(r, w / 2, h / 2);
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    if (r > 0) s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    if (r > 0) s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    if (r > 0) s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    if (r > 0) s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
}
function createHolePath(w, h, r, cx, cy) {
    cx = cx || 0; cy = cy || 0;
    r = Math.min(r, w / 2, h / 2);
    const p = new THREE.Path();
    p.moveTo(cx - w / 2 + r, cy - h / 2);
    p.lineTo(cx + w / 2 - r, cy - h / 2);
    if (r > 0) p.quadraticCurveTo(cx + w / 2, cy - h / 2, cx + w / 2, cy - h / 2 + r);
    p.lineTo(cx + w / 2, cy + h / 2 - r);
    if (r > 0) p.quadraticCurveTo(cx + w / 2, cy + h / 2, cx + w / 2 - r, cy + h / 2);
    p.lineTo(cx - w / 2 + r, cy + h / 2);
    if (r > 0) p.quadraticCurveTo(cx - w / 2, cy + h / 2, cx - w / 2, cy + h / 2 - r);
    p.lineTo(cx - w / 2, cy - h / 2 + r);
    if (r > 0) p.quadraticCurveTo(cx - w / 2, cy - h / 2, cx - w / 2 + r, cy - h / 2);
    return p;
}
function rectHolePath(cx, cy, w, h) {
    const p = new THREE.Path();
    p.moveTo(cx - w / 2, cy - h / 2);
    p.lineTo(cx + w / 2, cy - h / 2);
    p.lineTo(cx + w / 2, cy + h / 2);
    p.lineTo(cx - w / 2, cy + h / 2);
    p.lineTo(cx - w / 2, cy - h / 2);
    return p;
}
// ── Custom outline helpers ───────────────────────
// Build a closed path from unordered line segments (tolerance-based)
function _buildClosedPath(segments) {
    if (segments.length < 3) return null;
    const eps = 0.5; // mm tolerance
    const used = new Array(segments.length).fill(false);
    const ordered = [];
    used[0] = true;
    ordered.push(segments[0]);
    let curEnd = { x: segments[0].x2, y: segments[0].y2 };

    for (let iter = 1; iter < segments.length; iter++) {
        let bestDist = Infinity, bestIdx = -1, bestReversed = false;
        for (let i = 0; i < segments.length; i++) {
            if (used[i]) continue;
            const s = segments[i];
            const d1 = Math.hypot(s.x1 - curEnd.x, s.y1 - curEnd.y);
            const d2 = Math.hypot(s.x2 - curEnd.x, s.y2 - curEnd.y);
            if (d1 < bestDist) { bestDist = d1; bestIdx = i; bestReversed = false; }
            if (d2 < bestDist) { bestDist = d2; bestIdx = i; bestReversed = true; }
        }
        if (bestDist > eps || bestIdx < 0) return null;
        used[bestIdx] = true;
        const s = segments[bestIdx];
        if (bestReversed) {
            const rev = { x1: s.x2, y1: s.y2, x2: s.x1, y2: s.y1 };
            if (s.arc) {
                rev.arc = { cx: s.arc.cx, cy: s.arc.cy, r: s.arc.r,
                    startAngle: s.arc.endAngle, endAngle: s.arc.startAngle,
                    ccw: !s.arc.ccw };
            }
            if (s.bezier) rev.bezier = { cpx: s.bezier.cpx, cpy: s.bezier.cpy };
            ordered.push(rev);
        } else {
            ordered.push(s);
        }
        curEnd = { x: ordered[ordered.length - 1].x2, y: ordered[ordered.length - 1].y2 };
    }
    if (Math.hypot(curEnd.x - ordered[0].x1, curEnd.y - ordered[0].y1) > eps) return null;
    return ordered;
}

// Tessellate outline segments into point array
function _tessellateOutline(segments, samplesPerSeg) {
    const points = [];
    const n = samplesPerSeg || 8;
    for (const seg of segments) {
        if (seg.arc) {
            let sa = seg.arc.startAngle, ea = seg.arc.endAngle;
            if (seg.arc.ccw) { while (ea > sa) ea -= Math.PI * 2; }
            else { while (ea < sa) ea += Math.PI * 2; }
            for (let i = 0; i < n; i++) {
                const t = i / n;
                const a = sa + (ea - sa) * t;
                points.push({ x: seg.arc.cx + seg.arc.r * Math.cos(a),
                               y: seg.arc.cy + seg.arc.r * Math.sin(a) });
            }
        } else if (seg.bezier) {
            for (let i = 0; i < n; i++) {
                const t = i / n;
                points.push({
                    x: (1 - t) * (1 - t) * seg.x1 + 2 * (1 - t) * t * seg.bezier.cpx + t * t * seg.x2,
                    y: (1 - t) * (1 - t) * seg.y1 + 2 * (1 - t) * t * seg.bezier.cpy + t * t * seg.y2,
                });
            }
        } else {
            for (let i = 0; i < n; i++) {
                const t = i / n;
                points.push({ x: seg.x1 + (seg.x2 - seg.x1) * t,
                               y: seg.y1 + (seg.y2 - seg.y1) * t });
            }
        }
    }
    return points;
}

// Compute signed area (positive = CCW in math coords)
function _signedArea2D(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y - points[j].x * points[i].y;
    }
    return area / 2;
}

// Offset polygon outward by a uniform distance
function _offsetPolygon(points, offset) {
    const n = points.length;
    if (n < 3) return points.slice();
    const result = [];
    for (let i = 0; i < n; i++) {
        const prev = points[(i - 1 + n) % n];
        const curr = points[i];
        const next = points[(i + 1) % n];
        const e1x = curr.x - prev.x, e1y = curr.y - prev.y;
        const e2x = next.x - curr.x, e2y = next.y - curr.y;
        const l1 = Math.hypot(e1x, e1y) || 1;
        const l2 = Math.hypot(e2x, e2y) || 1;
        // RIGHT normal of edge direction = outward for CCW polygon
        const n1x = e1y / l1, n1y = -e1x / l1;
        const n2x = e2y / l2, n2y = -e2x / l2;
        let nx = n1x + n2x, ny = n1y + n2y;
        const nl = Math.hypot(nx, ny);
        if (nl < 0.01) {
            result.push({ x: curr.x + n1x * offset, y: curr.y + n1y * offset });
        } else {
            nx /= nl; ny /= nl;
            const dot = n1x * nx + n1y * ny;
            const d = dot > 0.2 ? offset / dot : offset * 3;
            const clamped = Math.min(d, offset * 4);
            result.push({ x: curr.x + nx * clamped, y: curr.y + ny * clamped });
        }
    }
    return result;
}

// Offset polygon with directional bezel (bS for X, bT/bB for Y)
function _offsetPolygonDirectional(points, bS, bT, bB) {
    const n = points.length;
    if (n < 3) return points.slice();
    const result = [];
    for (let i = 0; i < n; i++) {
        const prev = points[(i - 1 + n) % n];
        const curr = points[i];
        const next = points[(i + 1) % n];
        const e1x = curr.x - prev.x, e1y = curr.y - prev.y;
        const e2x = next.x - curr.x, e2y = next.y - curr.y;
        const l1 = Math.hypot(e1x, e1y) || 1;
        const l2 = Math.hypot(e2x, e2y) || 1;
        // RIGHT normal = outward for CCW polygon
        const n1x = e1y / l1, n1y = -e1x / l1;
        const n2x = e2y / l2, n2y = -e2x / l2;
        let nx = n1x + n2x, ny = n1y + n2y;
        const nl = Math.hypot(nx, ny);
        if (nl < 0.01) { nx = n1x; ny = n1y; } else { nx /= nl; ny /= nl; }
        const absNx = Math.abs(nx), absNy = Math.abs(ny);
        const vBezel = ny > 0 ? bB : bT;
        const dirBezel = absNx * bS + absNy * vBezel;
        const dot = n1x * nx + n1y * ny;
        const d = dot > 0.2 ? dirBezel / dot : dirBezel * 3;
        const clamped = Math.min(d, dirBezel * 4);
        result.push({ x: curr.x + nx * clamped, y: curr.y + ny * clamped });
    }
    return result;
}

// Create THREE.Shape from ordered outline segments (preserving curves)
function _createShapeFromOutline(segments) {
    const shape = new THREE.Shape();
    shape.moveTo(segments[0].x1, segments[0].y1);
    for (const seg of segments) {
        if (seg.arc) {
            shape.absarc(seg.arc.cx, seg.arc.cy, seg.arc.r,
                seg.arc.startAngle, seg.arc.endAngle, seg.arc.ccw);
        } else if (seg.bezier) {
            shape.quadraticCurveTo(seg.bezier.cpx, seg.bezier.cpy, seg.x2, seg.y2);
        } else {
            shape.lineTo(seg.x2, seg.y2);
        }
    }
    return shape;
}

// Create THREE.Shape from polygon points
function _createShapeFromPoints(points) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, points[i].y);
    shape.closePath();
    return shape;
}

// Create THREE.Path (hole) from polygon points with offset
function _createHolePathFromPoints(points, cx, cy) {
    const path = new THREE.Path();
    const pts = [...points].reverse(); // CW for hole
    path.moveTo(pts[0].x + (cx || 0), pts[0].y + (cy || 0));
    for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x + (cx || 0), pts[i].y + (cy || 0));
    path.closePath();
    return path;
}

// Phase 7-3: ケース断面ビュー — Body 用 clipping plane (Keycap 側とは独立)
// renderer.localClippingEnabled は Phase 4-3 で main 側で true 化済みなので、
// material 側で clippingPlanes を渡せばそのまま効く。
let _bodyCrossSectionPlane = null;
function _updateBodyCrossSectionPlane() {
    if (typeof THREE === 'undefined') return;
    if (!_bodyCrossSectionPlane) _bodyCrossSectionPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000);
    if (!state.crossSectionEnabled) {
        _bodyCrossSectionPlane.normal.set(0, -1, 0);
        _bodyCrossSectionPlane.constant = 1000;
        return;
    }
    const pos = state.crossSectionPos || 0;
    switch (state.crossSectionAxis) {
        case 'x': _bodyCrossSectionPlane.normal.set(-1, 0, 0); _bodyCrossSectionPlane.constant = pos; break;
        case 'z': _bodyCrossSectionPlane.normal.set(0, 0, -1); _bodyCrossSectionPlane.constant = pos; break;
        default:  _bodyCrossSectionPlane.normal.set(0, -1, 0); _bodyCrossSectionPlane.constant = pos; break;
    }
}

function mat(c) {
    const m = new THREE.MeshLambertMaterial({ color: c });
    if (state.displayMode === 'wireframe') { m.wireframe = true; }
    if (state.crossSectionEnabled && _bodyCrossSectionPlane) {
        m.clippingPlanes = [_bodyCrossSectionPlane];
        m.side = THREE.DoubleSide;
        m.clipShadows = true;
    }
    return m;
}

// ══════════════════════════════════════════════
//  テキスト印字ジオメトリ生成
// ══════════════════════════════════════════════

/**
 * 平面（上面/底面）にテキストを配置するジオメトリを生成
 * @param {string} text テキスト内容
 * @param {string} font フォントキー
 * @param {number} size フォントサイズ
 * @param {number} height 押し出し高さ
 * @param {number} posX X位置
 * @param {number} posZ Z位置
 * @param {number} surfaceY 配置するY座標
 * @param {boolean} faceUp true=上向き, false=下向き(底面)
 */
function createBodySurfaceText(text, font, size, height, posX, posZ, surfaceY, faceUp, mode) {
    if (!makeTextGeo || !loadedFontData || !loadedFontData[font]) return null;
    // engrave/doubleshot: 深めにカット + ボディ内に埋め込み
    let genHeight = height;
    let embedOffset = 0;
    if (mode === 'engrave') {
        genHeight = height + 5.0;
        embedOffset = -height;
    } else if (mode === 'doubleshot') {
        genHeight = 3.0;
        embedOffset = -genHeight + 0.02;
    }
    const geo = makeTextGeo(text, font, size, genHeight, 12);
    if (!geo) return null;
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const cx = (bb.max.x + bb.min.x) / 2;
    geo.translate(-cx, 0, 0);
    if (faceUp) {
        geo.rotateX(-Math.PI / 2);
        // embedOffset: マイナスでボディ内に沈み込む
        geo.translate(posX, surfaceY + embedOffset, posZ);
    } else {
        geo.rotateX(Math.PI / 2);
        geo.rotateY(Math.PI);
        // 底面: embedOffsetの方向を逆にする（Y-方向に突き出る）
        geo.translate(posX, surfaceY - embedOffset, posZ);
    }
    geo.computeVertexNormals();
    return geo;
}

/**
 * 側面（前/後/左/右）にテキストを配置するジオメトリを生成
 * @param {string} text テキスト内容
 * @param {string} font フォントキー
 * @param {number} size フォントサイズ
 * @param {string} face 'front'|'back'|'left'|'right'
 * @param {number} posY Y位置（ケース中心からのオフセット）
 * @param {number} caseW ケース幅
 * @param {number} caseD ケース奥行き
 * @param {number} baseY テキストの基準Y座標
 * @param {number} zOff ケースのZ方向オフセット
 * @param {string} mode 'emboss'|'engrave'|'doubleshot'
 */
function createBodySideText(text, font, size, face, posY, caseW, caseD, baseY, zOff, mode) {
    if (!makeTextGeo || !loadedFontData || !loadedFontData[font]) return null;
    // mode-aware depth: emboss は薄く表面から突出、engrave/doubleshot は深くカット
    const genHeight = (mode === 'engrave') ? 5.5
                    : (mode === 'doubleshot') ? 3.0
                    : 0.5;
    const geo = makeTextGeo(text, font, size, genHeight, 12);
    if (!geo) return null;
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const cx = (bb.max.x + bb.min.x) / 2;
    geo.translate(-cx, 0, 0);
    // TextGeometry: 文字は+X方向に並び、深さは+Z方向。readable face は -Z 方向。
    // 各面では「外側から見て左→右に読める」向きに回転する。
    // テキストは壁面に配置（genHeight分だけ壁の内側に食い込む）
    switch (face) {
        case 'front': // +Z面: 外から見てX=左→右、回転不要
            geo.translate(0, baseY + posY, caseD / 2 + zOff);
            break;
        case 'back':  // -Z面: 外から見てX=右→左、PI回転で反転
            geo.rotateY(Math.PI);
            geo.translate(0, baseY + posY, -caseD / 2 + zOff);
            break;
        case 'left':  // -X面: -PI/2 で文字を-X方向に向ける
            geo.rotateY(-Math.PI / 2);
            geo.translate(-caseW / 2, baseY + posY, zOff);
            break;
        case 'right': // +X面: PI/2 で文字を+X方向に向ける
            geo.rotateY(Math.PI / 2);
            geo.translate(caseW / 2, baseY + posY, zOff);
            break;
    }
    geo.computeVertexNormals();
    return geo;
}

/**
 * SVGアイコンをケース表面に配置するジオメトリを生成
 * keycap の createConformedSVG() を簡略化（body表面は平面なので conform 不要）
 */
function createBodySurfaceSVG(svgContent, scale, thickness, posX, posZ, surfaceY, isTop, mode, rotZ) {
    if (!svgContent || !SVGLoader) return null;
    const loader = new SVGLoader();
    let data;
    try { data = loader.parse(svgContent); } catch (e) { return null; }

    // Shape 抽出 + bounding box
    let gMinX = Infinity, gMaxX = -Infinity, gMinY = Infinity, gMaxY = -Infinity;
    const allShapes = [];
    data.paths.forEach(path => {
        SVGLoader.createShapes(path).forEach(shape => {
            allShapes.push(shape);
            shape.getPoints().forEach(pt => {
                if (pt.x < gMinX) gMinX = pt.x; if (pt.x > gMaxX) gMaxX = pt.x;
                if (pt.y < gMinY) gMinY = pt.y; if (pt.y > gMaxY) gMaxY = pt.y;
            });
        });
    });
    if (allShapes.length === 0) return null;

    // 背景フィルタリング（keycap と同じロジック）
    const gW = gMaxX - gMinX, gH = gMaxY - gMinY;
    const gArea = gW * gH;
    const validShapes = [];
    allShapes.forEach((shape, i) => {
        const pts = shape.getPoints();
        let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
        pts.forEach(pt => {
            if (pt.x < sMinX) sMinX = pt.x; if (pt.x > sMaxX) sMaxX = pt.x;
            if (pt.y < sMinY) sMinY = pt.y; if (pt.y > sMaxY) sMaxY = pt.y;
        });
        const ratio = gArea > 0 ? ((sMaxX - sMinX) * (sMaxY - sMinY) / gArea) : 0;
        const isBg = (ratio > 0.80 && allShapes.length > 1) || (i === 0 && ratio > 0.70 && allShapes.length > 1);
        if (!isBg) validShapes.push(shape);
    });
    if (validShapes.length === 0) return null;

    // Extrude — mode に応じた深さ
    const genThick = (mode === 'engrave') ? 5.5 : (mode === 'doubleshot') ? 3.0 : thickness;
    let geo = new THREE.ExtrudeGeometry(validShapes, { depth: genThick, bevelEnabled: false });
    geo.computeBoundingBox();
    const c = new THREE.Vector3();
    geo.boundingBox.getCenter(c);
    geo.translate(-c.x, -c.y, 0);
    geo.scale(0.1 * scale, -0.1 * scale, 1.0);
    if (rotZ) geo.rotateZ(THREE.MathUtils.degToRad(rotZ));
    geo = BufferGeometryUtils.mergeVertices(geo, 0.001);
    geo.computeVertexNormals();

    // 平面配置（createBodySurfaceText と同じ座標系）
    // ExtrudeGeometry は +Z 方向に深さが伸びる
    if (isTop) {
        // 上面: -90度回転で Z-up → Y-up、深さは +Y 方向（emboss: 上に突出）
        geo.rotateX(-Math.PI / 2);
        if (mode === 'engrave' || mode === 'doubleshot') {
            // engrave/doubleshot: 深さを下方向にするため Y 反転
            geo.scale(1, -1, 1);
            geo.translate(posX, surfaceY + 0.02, posZ);
        } else {
            geo.translate(posX, surfaceY, posZ);
        }
    } else {
        // 底面: +90度回転 + Y反転で下向き配置
        geo.rotateX(Math.PI / 2);
        geo.rotateY(Math.PI);
        if (mode === 'engrave' || mode === 'doubleshot') {
            geo.scale(1, -1, 1);
            geo.translate(posX, surfaceY - 0.02, posZ);
        } else {
            geo.translate(posX, surfaceY, posZ);
        }
    }
    geo.computeVertexNormals();
    return geo;
}

/**
 * 指定パートのメッシュを集めてCSG SUBTRACTIONを適用し差し替える
 * @param {string} partTag userData.part に一致するタグ
 * @param {string|null} subPartTag userData.subPart に一致するタグ (nullなら無視)
 * @param {THREE.BufferGeometry} engraveGeo 引き算するジオメトリ
 */
function applyCSGToPartMeshes(partTag, subPartTag, engraveGeo) {
    if (!engraveGeo || !csgEvaluator || !Brush || !SUBTRACTION) return;
    const meshes = [];
    sceneGroup.traverse(c => {
        if (c.isMesh && c.userData.part === partTag) {
            if (subPartTag && c.userData.subPart !== subPartTag) return;
            if (!subPartTag && c.userData.subPart) return;  // skip sub-parts
            meshes.push(c);
        }
    });
    if (meshes.length === 0) return;

    const geos = meshes.map(m => {
        const g = m.geometry.clone();
        // matrixWorld は未算出（レンダー前）の為 identity になる
        // → mesh.rotation / mesh.position を反映するため local matrix を使用
        m.updateMatrix();
        g.applyMatrix4(m.matrix);
        return g;
    });
    const merged = safeMerge(geos);
    if (!merged) return;

    try {
        const b1 = new Brush(merged); b1.updateMatrixWorld();
        const b2 = new Brush(engraveGeo); b2.updateMatrixWorld();
        const res = csgEvaluator.evaluate(b1, b2, SUBTRACTION);
        const resultGeo = res.geometry;
        resultGeo.computeVertexNormals();

        const material = meshes[0].material;
        meshes.forEach(m => { m.geometry.dispose(); sceneGroup.remove(m); });
        const newMesh = new THREE.Mesh(resultGeo, material);
        newMesh.userData.part = partTag;
        if (subPartTag) newMesh.userData.subPart = subPartTag;
        sceneGroup.add(newMesh);
        console.log(`[BodyText] CSG SUBTRACTION applied to ${partTag}${subPartTag ? '/' + subPartTag : ''}`);
    } catch (err) {
        console.warn('[BodyText] CSG failed:', err.message);
    }
}

// ══════════════════════════════════════════════
//  3D Model Builder
// ══════════════════════════════════════════════
function updateModel() {
    if (!sceneGroup) return;

    // Phase 7-3: 断面ビュー clipping plane を毎回更新 (state 反映)
    _updateBodyCrossSectionPlane();

    // Dispose & clear (handles nested Groups from feet etc.)
    function disposeObj(obj) {
        while (obj.children.length) {
            const c = obj.children[0];
            if (c.children && c.children.length) disposeObj(c);
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
                if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                else c.material.dispose();
            }
            obj.remove(c);
        }
    }
    disposeObj(sceneGroup);
    // 前回の tilt / position をリセット（CSGがmatrixの影響を受けないようにする）
    sceneGroup.rotation.set(0, 0, 0);
    sceneGroup.position.set(0, 0, 0);

    let layoutData;
    if (state.customLayoutData) {
        layoutData = JSON.parse(JSON.stringify(state.customLayoutData));
    } else {
        layoutData = generateKeys(state.layout);
        // Apply ISO/JIS standard modifications (only for preset layouts)
        if (state.layoutStandard !== 'ansi' && !['40', 'alice', 'macro'].includes(state.layout)) {
            const alphaY = ['75'].includes(state.layout) ? 1
                         : ['tkl', 'full', '1800'].includes(state.layout) ? 1.5 : 0;
            applyLayoutStandard(layoutData.keys, state.layoutStandard, alphaY);
        }
    }
    const keysList = layoutData.keys;
    const pitch = state.keyPitch;
    const plateW = layoutData.totalW * pitch;
    const plateH = layoutData.totalH * pitch;
    const bT = state.bezelTop, bB = state.bezelBottom, bS = state.bezelSide;
    const caseW = plateW + bS * 2;
    const caseD = plateH + bT + bB;
    const wall = state.wallThickness;
    const cornerR = state.cornerRadius;
    const chamVal = state.chamfer;
    // Auto-increase bottom thickness to house embedded flip-out feet
    const footRecessDepth = 2.5;  // foot (2mm) + clearance (0.5mm)
    const footRecessFloor = 1.5;  // minimum wall below foot recess
    const bottomT = Math.max(state.bottomThickness, footRecessDepth + footRecessFloor);
    const pcbCl = state.pcbClearance;
    const tiltDeg = state.tiltAngle * (state.negTilt ? -1 : 1);
    const plT = 1.5;
    const topH = state.profileType === 'high' ? 7 : state.profileType === 'low' ? 3.5 : 1.5;
    const totalH = bottomT + pcbCl + plT + topH;
    // Inner cavity: fixed relative to plate (outer edge moves with bezel)
    const plateGap = 1.0; // 0.5mm clearance per side
    const iw = plateW + plateGap;
    const ih = plateH + plateGap;
    const effectiveWallW = bS - plateGap / 2;          // side wall thickness
    const effectiveWallFront = bT - plateGap / 2;      // front wall (bezel top side)
    const effectiveWallBack = bB - plateGap / 2;        // back wall (bezel bottom / USB side)
    const minWall = Math.min(effectiveWallW, effectiveWallFront, effectiveWallBack);
    const innerR = Math.max(0, cornerR - minWall);
    // Inner hole offset: center on plate, not on case geometric center
    const holeOffY = (bT - bB) / 2;
    // zOff: offset from plate center to case center (plate is reference at z=0)
    const zOff = (bB - bT) / 2;
    const wallH = pcbCl + plT;
    const switchSz = 14.0;

    // ── Custom outline from CAD lines ──
    const _plateOutline = layoutData.plateOutline || null;
    let _platePts = null, _caseOuterPts = null, _innerCavityPts = null, _lipInnerPts = null;
    if (_plateOutline) {
        _platePts = _tessellateOutline(_plateOutline, 12);
        if (_signedArea2D(_platePts) < 0) _platePts.reverse();
        // Case outer: plate outline + directional bezel, in case center coords
        _caseOuterPts = _offsetPolygonDirectional(_platePts, bS, bT, bB)
            .map(p => ({ x: p.x, y: p.y + holeOffY }));
        // Inner cavity: plate outline + small gap (in plate coords, shift when used)
        _innerCavityPts = _offsetPolygon(_platePts, plateGap / 2);
        // Lip inner: plate outline + lip clearance (in plate coords)
        _lipInnerPts = _offsetPolygon(_platePts, 0.25);
    }

    // USB port params
    const usb = USB_DIMS[state.usbType];
    const margin = state.portMargin;
    const portW = usb.w + margin * 2;
    const portH = usb.h + margin * 2;
    // Port X within inner width
    const portX = -iw / 2 + (state.usbPosX / 100) * iw;
    // Port Y range: top case walls only (above bottomT) — never in bottom slab
    const yMin = bottomT + portH / 2 + 0.5;
    const yMax = bottomT + wallH - portH / 2 - 0.5;
    const portCenterY = yMin + (state.usbPosY / 100) * Math.max(0, yMax - yMin);

    const topMat = mat(state.topCaseColor);
    const bottomMat = mat(state.bottomCaseColor);
    const plMat = new THREE.MeshLambertMaterial({
        color: state.plateColor, side: THREE.DoubleSide,
        wireframe: state.displayMode === 'wireframe'
    });

    // ════════════════════════════════════════
    //  BOTTOM SLAB (two-layer: recess layer + ceiling)
    //  Case geometry centered at z = -zOff so plate stays at z=0
    // ════════════════════════════════════════
    // Foot geometry params (shared with feet section below)
    // Nested design: ロ-shaped outer frame (stage 2) stores solid inner foot (stage 1)
    const footW = 16, footT = 2;
    const frameFLen = 18;            // outer frame length (stage 2, longer → higher tilt)
    const innerFLen = 10;            // inner solid foot length (stage 1, shorter → lower tilt)
    const frameBarT = 2.5;          // frame bar thickness
    const innerFootW = footW - 2 * frameBarT - 1; // fits inside frame with clearance
    const recessLen = frameFLen + 4; // accommodate frame + hinge clearance
    const recessW = footW + 2;
    const hingeR = 1.0;
    const spacingRatio = 0.65;
    const footInset = caseW * (1 - spacingRatio) / 2;
    const pivotFromRear = 4;        // hinge at rear edge
    const hingeShapeY = caseD / 2 - pivotFromRear;
    const recessCenterY = hingeShapeY - recessLen / 2 + 2;

    // Layer 1: Bottom face with foot recess holes (recesses open from underside)
    try {
    const floorS = _caseOuterPts ? _createShapeFromPoints(_caseOuterPts) : createRoundedRectShape(caseW, caseD, cornerR);
    if (!_caseOuterPts) {
        // Foot recesses only for rectangular shapes (might be outside custom outline)
        [-1, 1].forEach(side => {
            const fx = side * (caseW / 2 - footInset);
            floorS.holes.push(rectHoleCW(fx, recessCenterY, recessW / 2, recessLen / 2));
        });
    }
    const floorGeo = new THREE.ExtrudeGeometry(floorS, { depth: footRecessDepth, bevelEnabled: false });
    const floorMesh = new THREE.Mesh(floorGeo, bottomMat.clone());
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.z = -zOff;
    floorMesh.userData.part = 'bottom';
    floorMesh.userData.subPart = 'structure';
    sceneGroup.add(floorMesh);
    } catch (e) { console.warn('[BodyModule] Custom floor failed:', e.message); }

    // Layer 2: Solid ceiling above recesses (separates recess from case interior)
    const ceilT = bottomT - footRecessDepth;
    if (ceilT > 0) {
        try {
        const ceilS = _caseOuterPts ? _createShapeFromPoints(_caseOuterPts) : createRoundedRectShape(caseW, caseD, cornerR);
        const ceilGeo = new THREE.ExtrudeGeometry(ceilS, { depth: ceilT, bevelEnabled: false });
        const ceilMesh = new THREE.Mesh(ceilGeo, bottomMat.clone());
        ceilMesh.rotation.x = -Math.PI / 2;
        ceilMesh.position.y = footRecessDepth;
        ceilMesh.position.z = -zOff;
        ceilMesh.userData.part = 'bottom';
        ceilMesh.userData.subPart = 'structure';
        sceneGroup.add(ceilMesh);
        } catch (e) { console.warn('[BodyModule] Custom ceiling failed:', e.message); }
    }

    // ════════════════════════════════════════
    //  CHAMFER — separate tapered ring at bottom edge
    // ════════════════════════════════════════
    if (chamVal > 0) {
        try {
        let chamOuter, chamInner;
        if (_caseOuterPts) {
            chamOuter = _createShapeFromPoints(_caseOuterPts);
            const chamInnerPts = _offsetPolygon(_caseOuterPts, -chamVal);
            chamInner = _createHolePathFromPoints(chamInnerPts, 0, 0);
        } else {
            const cR2 = Math.max(0, cornerR - chamVal);
            chamOuter = createRoundedRectShape(caseW, caseD, cornerR);
            chamInner = createHolePath(caseW - chamVal * 2, caseD - chamVal * 2, cR2);
        }
        chamOuter.holes.push(chamInner);
        const chamGeo = new THREE.ExtrudeGeometry(chamOuter, { depth: chamVal, bevelEnabled: false });
        const chamMesh = new THREE.Mesh(chamGeo, bottomMat.clone());
        chamMesh.rotation.x = -Math.PI / 2;
        chamMesh.position.y = -chamVal;
        chamMesh.position.z = -zOff;
        chamMesh.userData.part = 'bottom';
        chamMesh.userData.subPart = 'structure';
        sceneGroup.add(chamMesh);
        } catch (e) { console.warn('[BodyModule] Custom chamfer failed:', e.message); }
    }

    // ════════════════════════════════════════
    //  WALLS: Split into 3 segments with USB port hole cut-through
    //  Port uses notched outer shape for full penetration regardless of bezel.
    // ════════════════════════════════════════

    // Port position relative to wall extrusion base (bottomT)
    const wPortBot = Math.max(0, portCenterY - portH / 2 - bottomT);
    const wPortTop = Math.min(wallH, portCenterY + portH / 2 - bottomT);

    if (_caseOuterPts) {
        // Custom outline walls (single extrusion, no USB port notch)
        try {
        const ws = _createShapeFromPoints(_caseOuterPts);
        ws.holes.push(_createHolePathFromPoints(_innerCavityPts, 0, holeOffY));
        const wg = new THREE.ExtrudeGeometry(ws, { depth: wallH, bevelEnabled: false });
        const wm = new THREE.Mesh(wg, topMat.clone());
        wm.rotation.x = -Math.PI / 2;
        wm.position.y = bottomT;
        wm.position.z = -zOff;
        wm.userData.part = 'body';
        sceneGroup.add(wm);
        } catch (e) { console.warn('[BodyModule] Custom walls failed:', e.message); }
    } else {
        function addWallSegment(depth, yOffset, withPort) {
            if (depth <= 0) return;
            let ws;
            if (withPort) {
                ws = new THREE.Shape();
                const hw = caseW / 2, hh = caseD / 2, r = cornerR;
                const pL = portX - portW / 2, pR = portX + portW / 2;
                const notchInner = holeOffY + ih / 2 + 0.1;
                ws.moveTo(-hw + r, -hh);
                ws.lineTo(hw - r, -hh);
                if (r > 0) ws.quadraticCurveTo(hw, -hh, hw, -hh + r);
                ws.lineTo(hw, hh - r);
                if (r > 0) ws.quadraticCurveTo(hw, hh, hw - r, hh);
                ws.lineTo(pR, hh);
                ws.lineTo(pR, notchInner);
                ws.lineTo(pL, notchInner);
                ws.lineTo(pL, hh);
                ws.lineTo(-hw + r, hh);
                if (r > 0) ws.quadraticCurveTo(-hw, hh, -hw, hh - r);
                ws.lineTo(-hw, -hh + r);
                if (r > 0) ws.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
                ws.holes.push(createHolePath(iw, ih, innerR, 0, holeOffY));
            } else {
                ws = createRoundedRectShape(caseW, caseD, cornerR);
                ws.holes.push(createHolePath(iw, ih, innerR, 0, holeOffY));
            }
            const wg = new THREE.ExtrudeGeometry(ws, { depth, bevelEnabled: false });
            const wm = new THREE.Mesh(wg, topMat.clone());
            wm.rotation.x = -Math.PI / 2;
            wm.position.y = bottomT + yOffset;
            wm.position.z = -zOff;
            wm.userData.part = 'body';
            sceneGroup.add(wm);
        }
        addWallSegment(wPortBot, 0, false);
        addWallSegment(wPortTop - wPortBot, wPortBot, true);
        addWallSegment(wallH - wPortTop, wPortTop, false);
    }

    // ════════════════════════════════════════
    //  COMFORT EDGE (rounded front-bottom edge)
    // ════════════════════════════════════════
    if (state.comfortEdge > 0) {
        const cer = Math.min(state.comfortEdge, bottomT, effectiveWallW);
        // Quarter-circle cross-section filling front-bottom corner
        const ceShape = new THREE.Shape();
        ceShape.moveTo(0, 0);
        ceShape.lineTo(cer, 0);
        ceShape.absarc(0, 0, cer, 0, Math.PI / 2, false);
        ceShape.lineTo(0, 0);
        const ceLen = caseW - cornerR * 2;
        if (ceLen > 0) {
            const ceGeo = new THREE.ExtrudeGeometry(ceShape, { depth: ceLen, bevelEnabled: false });
            const ceMesh = new THREE.Mesh(ceGeo, topMat.clone());
            ceMesh.rotation.y = -Math.PI / 2;
            ceMesh.rotation.x = Math.PI;
            ceMesh.position.set(ceLen / 2, bottomT + cer, caseD / 2 - zOff);
            ceMesh.userData.part = 'body';
            sceneGroup.add(ceMesh);
        }
    }

    // ════════════════════════════════════════
    //  TOP CASE LIP
    // ════════════════════════════════════════
    if (state.profileType !== 'floating') {
        try {
        let lipS;
        if (_caseOuterPts) {
            lipS = _createShapeFromPoints(_caseOuterPts);
            lipS.holes.push(_createHolePathFromPoints(_lipInnerPts, 0, holeOffY));
        } else {
            lipS = createRoundedRectShape(caseW, caseD, cornerR);
            const lIW = plateW + 0.5, lIH = plateH + 0.5;
            const lR = Math.min(innerR, lIW / 2, lIH / 2);
            lipS.holes.push(createHolePath(lIW, lIH, lR, 0, holeOffY));
        }
        const lGeo = new THREE.ExtrudeGeometry(lipS, { depth: topH, bevelEnabled: false });
        const lMesh = new THREE.Mesh(lGeo, topMat.clone());
        lMesh.rotation.x = -Math.PI / 2;
        lMesh.position.y = bottomT + wallH;
        lMesh.position.z = -zOff;
        lMesh.userData.part = 'body';
        sceneGroup.add(lMesh);
        } catch (e) { console.warn('[BodyModule] Custom lip failed:', e.message); }
    }

    // ════════════════════════════════════════
    //  INTERNAL STRUCTURE: Ribs, Weight Pocket, Battery Space
    // ════════════════════════════════════════
    if (state.ribs) {
        // Reinforcement ribs on bottom slab interior
        const ribH = Math.min(pcbCl - 1, 4);
        const ribT = 1.5;
        const ribMat = bottomMat.clone();
        if (ribH > 0) {
            // Cross ribs along X (2-3 ribs evenly spaced along depth)
            const ribCountD = Math.max(2, Math.floor(ih / 40));
            for (let i = 0; i < ribCountD; i++) {
                const t = (i + 0.5) / ribCountD - 0.5;
                const rz = t * (ih - 10);
                const rGeo = new THREE.BoxGeometry(iw - 4, ribH, ribT);
                const rM = new THREE.Mesh(rGeo, ribMat);
                rM.position.set(0, bottomT + ribH / 2, rz);
                rM.userData.part = 'bottom';
                rM.userData.subPart = 'structure';
                sceneGroup.add(rM);
            }
            // Cross ribs along Z (2-3 ribs evenly spaced along width)
            const ribCountW = Math.max(2, Math.floor(iw / 60));
            for (let i = 0; i < ribCountW; i++) {
                const t = (i + 0.5) / ribCountW - 0.5;
                const rx = t * (iw - 10);
                const rGeo = new THREE.BoxGeometry(ribT, ribH, ih - 4);
                const rM = new THREE.Mesh(rGeo, ribMat);
                rM.position.set(rx, bottomT + ribH / 2, 0);
                rM.userData.part = 'bottom';
                rM.userData.subPart = 'structure';
                sceneGroup.add(rM);
            }
        }
    }
    if (state.batterySpace) {
        // Battery pocket (typical 502030 LiPo: ~30x20x5mm) — position adjustable
        const batW = 30, batD = 20, batH = Math.min(pcbCl - 1, 5);
        if (batH > 0) {
            const batX = -iw / 2 + batW / 2 + (state.batteryPosX / 100) * (iw - batW);
            const batZ = -ih / 2 + batD / 2 + (state.batteryPosZ / 100) * (ih - batD);
            const batGeo = new THREE.BoxGeometry(batW, batH, batD);
            const batM = new THREE.Mesh(batGeo, mat(0x3366aa));
            batM.position.set(batX, bottomT + batH / 2, batZ);
            batM.userData.part = 'bottom';
            batM.userData.subPart = 'structure';
            sceneGroup.add(batM);
        }
    }

    // ════════════════════════════════════════
    //  PLATE — Row-strip approach with REAL switch holes
    //  One horizontal strip per key row, full plate width.
    //  Switch holes + stab cutouts as Shape.holes (CW winding).
    //  Screw holes rendered as separate dark cylinders (avoids earcut crash
    //  when circles cross strip boundaries).
    //  Strips overlap 0.1mm to prevent visible seam lines.
    // ════════════════════════════════════════
    const plateY = bottomT + pcbCl;
    const plR = Math.max(0, cornerR - bS);

    // ── Dynamic screw positions (U coords from plate top-left) ──
    // If custom layout: use custom screws only (no auto-generation)
    // If preset layout: auto-generate screws
    const rawScrews = state.customLayoutData
        ? (state.customLayoutData.customScrews || [])
        : generateScrewPositions(layoutData);
    const _plateScrew = rawScrews.map(s => {
        let xu = layoutData.totalW / 2 + s.u;
        let yu = layoutData.totalH / 2 + s.v;
        const marginU = 2.0 / pitch;
        xu = Math.max(marginU, Math.min(layoutData.totalW - marginU, xu));
        yu = Math.max(marginU, Math.min(layoutData.totalH - marginU, yu));
        return { xu, yu };
    });
    const screwR = state.standoffScrew / 2;

    // ── Group keys by row Y ──
    const rowYsSet = new Set();
    keysList.forEach(k => rowYsSet.add(k.y));
    const rowYsSorted = [...rowYsSet].sort((a, b) => a - b);

    // Helper: create CW rectangular hole path (opposite to CCW outer shape)
    function rectHoleCW(cx, cy, hw, hh) {
        const h = new THREE.Path();
        h.moveTo(cx - hw, cy - hh);   // BL
        h.lineTo(cx - hw, cy + hh);   // TL ↑
        h.lineTo(cx + hw, cy + hh);   // TR →
        h.lineTo(cx + hw, cy - hh);   // BR ↓
        h.closePath();
        return h;
    }

    if (_plateOutline) {
        // ── Custom outline plate (single shape with holes) ──
        try {
            const plateShape = _createShapeFromOutline(_plateOutline);
            // Switch holes
            keysList.forEach(key => {
                const kw = key.w || 1, kh = key.h || 1;
                const kcx = -plateW / 2 + (key.x + kw / 2) * pitch;
                const kcy = plateH / 2 - (key.y + kh / 2) * pitch;
                const hw = switchSz / 2;
                plateShape.holes.push(rectHoleCW(kcx, kcy, hw, hw));
                // Stabilizer cutouts — horizontal
                if (kw >= 2) {
                    const ss = getStabSpacing(kw);
                    const stabHW = 6.7 / 2, stabHH = 12.3 / 2;
                    [-1, 1].forEach(side => {
                        plateShape.holes.push(rectHoleCW(kcx + side * ss / 2, kcy, stabHW, stabHH));
                    });
                }
                // Stabilizer cutouts — vertical
                if (kh >= 2 && kw < 2) {
                    const ss = 23.8;
                    const stabHW = 12.3 / 2, stabHH = 6.7 / 2;
                    [-1, 1].forEach(side => {
                        plateShape.holes.push(rectHoleCW(kcx, kcy + side * ss / 2, stabHW, stabHH));
                    });
                }
            });
            // Screw holes
            _plateScrew.forEach(s => {
                const sx = -plateW / 2 + s.xu * pitch;
                const sy = plateH / 2 - s.yu * pitch;
                plateShape.holes.push(rectHoleCW(sx, sy, screwR, screwR));
            });
            const geo = new THREE.ExtrudeGeometry(plateShape, { depth: plT, bevelEnabled: false });
            const mesh = new THREE.Mesh(geo, plMat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = plateY;
            mesh.userData.part = 'plate';
            sceneGroup.add(mesh);
        } catch (e) {
            console.warn('[BodyModule] Custom plate (segments) failed:', e.message);
            // Fallback 1: tessellated polygon with holes
            try {
                const fbShape = _createShapeFromPoints(_platePts);
                keysList.forEach(key => {
                    const kw = key.w || 1, kh = key.h || 1;
                    const kcx = -plateW / 2 + (key.x + kw / 2) * pitch;
                    const kcy = plateH / 2 - (key.y + kh / 2) * pitch;
                    const hw = switchSz / 2;
                    fbShape.holes.push(rectHoleCW(kcx, kcy, hw, hw));
                });
                const fbGeo = new THREE.ExtrudeGeometry(fbShape, { depth: plT, bevelEnabled: false });
                const fbMesh = new THREE.Mesh(fbGeo, plMat);
                fbMesh.rotation.x = -Math.PI / 2;
                fbMesh.position.y = plateY;
                fbMesh.userData.part = 'plate';
                sceneGroup.add(fbMesh);
            } catch (e2) {
                console.warn('[BodyModule] Custom plate (polygon) failed:', e2.message);
                // Fallback 2: solid polygon without holes
                try {
                    const solidShape = _createShapeFromPoints(_platePts);
                    const solidGeo = new THREE.ExtrudeGeometry(solidShape, { depth: plT, bevelEnabled: false });
                    const solidMesh = new THREE.Mesh(solidGeo, plMat);
                    solidMesh.rotation.x = -Math.PI / 2;
                    solidMesh.position.y = plateY;
                    solidMesh.userData.part = 'plate';
                    sceneGroup.add(solidMesh);
                } catch (e3) {
                    console.warn('[BodyModule] Plate all fallbacks failed:', e3.message);
                }
            }
        }
    } else {
        // ── Build horizontal strips (one per key row) ──
        for (let ri = 0; ri < rowYsSorted.length; ri++) {
            const rowY = rowYsSorted[ri];

            // Strip vertical extent in U coordinates
            const stripTopU = ri === 0
                ? 0
                : (rowYsSorted[ri - 1] + 1 + rowY) / 2;
            const stripBotU = ri === rowYsSorted.length - 1
                ? layoutData.totalH
                : (rowY + 1 + rowYsSorted[ri + 1]) / 2;

            // Convert to Shape Y coords (positive Y = back/top of keyboard)
            // Strips overlap 0.3mm to prevent seams and ensure split holes join seamlessly
            const sYtop = Math.min(plateH / 2 - stripTopU * pitch + 0.3, plateH / 2);
            const sYbot = Math.max(plateH / 2 - stripBotU * pitch - 0.3, -plateH / 2);
            const sXL = -plateW / 2;
            const sXR = plateW / 2;

            // Outer shape (CCW)
            const sShape = new THREE.Shape();
            sShape.moveTo(sXL, sYbot);
            sShape.lineTo(sXR, sYbot);
            sShape.lineTo(sXR, sYtop);
            sShape.lineTo(sXL, sYtop);
            sShape.closePath();

            // ── Switch holes for ALL keys whose hole overlaps this strip ──
            keysList.forEach(key => {
                const kw = key.w || 1;
                const kh = key.h || 1;
                const kcx = -plateW / 2 + (key.x + kw / 2) * pitch;
                const kcy = plateH / 2 - (key.y + kh / 2) * pitch;
                const hw = switchSz / 2;

                const holeTop = kcy + hw;
                const holeBot = kcy - hw;
                if (holeTop <= sYbot || holeBot >= sYtop) return;

                const clT = Math.min(holeTop, sYtop);
                const clB = Math.max(holeBot, sYbot);
                if (clT - clB < 1.0) return;

                const clL = Math.max(kcx - hw, sXL + 0.3);
                const clR = Math.min(kcx + hw, sXR - 0.3);
                if (clR - clL < 1.0) return;

                sShape.holes.push(rectHoleCW((clL + clR) / 2, (clT + clB) / 2, (clR - clL) / 2, (clT - clB) / 2));

                if (kw >= 2) {
                    const ss = getStabSpacing(kw);
                    const stabHW = 6.7 / 2, stabHH = 12.3 / 2;
                    const stabClT = Math.min(kcy + stabHH, sYtop);
                    const stabClB = Math.max(kcy - stabHH, sYbot);
                    if (stabClT - stabClB >= 1.0) {
                        [-1, 1].forEach(side => {
                            const scx = kcx + side * ss / 2;
                            const sL = Math.max(scx - stabHW, sXL + 0.3);
                            const sR = Math.min(scx + stabHW, sXR - 0.3);
                            if (sR - sL >= 1.0) {
                                sShape.holes.push(rectHoleCW((sL + sR) / 2, (stabClT + stabClB) / 2, (sR - sL) / 2, (stabClT - stabClB) / 2));
                            }
                        });
                    }
                }
                if (kh >= 2 && kw < 2) {
                    const ss = 23.8;
                    const stabHW = 12.3 / 2, stabHH = 6.7 / 2;
                    [-1, 1].forEach(side => {
                        const scy = kcy + side * ss / 2;
                        const sclT = Math.min(scy + stabHH, sYtop);
                        const sclB = Math.max(scy - stabHH, sYbot);
                        const sclL = Math.max(kcx - stabHW, sXL + 0.3);
                        const sclR = Math.min(kcx + stabHW, sXR - 0.3);
                        if (sclT - sclB >= 1.0 && sclR - sclL >= 1.0) {
                            sShape.holes.push(rectHoleCW((sclL + sclR) / 2, (sclT + sclB) / 2, (sclR - sclL) / 2, (sclT - sclB) / 2));
                        }
                    });
                }
            });

            // ── Screw holes ──
            _plateScrew.forEach(s => {
                const sx = -plateW / 2 + s.xu * pitch;
                const sy = plateH / 2 - s.yu * pitch;
                const holeTop = sy + screwR;
                const holeBot = sy - screwR;
                if (holeTop <= sYbot || holeBot >= sYtop) return;
                const clT = Math.min(holeTop, sYtop);
                const clB = Math.max(holeBot, sYbot);
                if (clT - clB < 0.5) return;
                const clL = Math.max(sx - screwR, sXL + 0.3);
                const clR = Math.min(sx + screwR, sXR - 0.3);
                if (clR - clL < 0.5) return;
                sShape.holes.push(rectHoleCW((clL + clR) / 2, (clT + clB) / 2, (clR - clL) / 2, (clT - clB) / 2));
            });

            // ── Extrude strip ──
            try {
                const geo = new THREE.ExtrudeGeometry(sShape, { depth: plT, bevelEnabled: false });
                const mesh = new THREE.Mesh(geo, plMat);
                mesh.rotation.x = -Math.PI / 2;
                mesh.position.y = plateY;
                mesh.userData.part = 'plate';
                sceneGroup.add(mesh);
            } catch (e) {
                console.warn('[BodyModule] Plate strip', ri, 'failed:', e.message);
                const fb = new THREE.Shape();
                fb.moveTo(sXL, sYbot); fb.lineTo(sXR, sYbot);
                fb.lineTo(sXR, sYtop); fb.lineTo(sXL, sYtop);
                const fbGeo = new THREE.ExtrudeGeometry(fb, { depth: plT, bevelEnabled: false });
                const fbMesh = new THREE.Mesh(fbGeo, plMat);
                fbMesh.rotation.x = -Math.PI / 2;
                fbMesh.position.y = plateY;
                fbMesh.userData.part = 'plate';
                sceneGroup.add(fbMesh);
            }
        }
    }

    // Screw holes are now integrated as shape holes in plate strips above

    // ── Stabilizer wires below plate (visual) ──
    keysList.forEach(key => {
        const kw = key.w || 1;
        const kh = key.h || 1;
        if (kw >= 2) {
            // Horizontal stabilizer wire
            const cx = -plateW / 2 + (key.x + kw / 2) * pitch;
            const cz = -plateH / 2 + (key.y + kh / 2) * pitch;
            const ss = getStabSpacing(kw);
            const wireGeo = new THREE.CylinderGeometry(0.8, 0.8, ss, 8);
            wireGeo.rotateZ(Math.PI / 2);
            const wireM = new THREE.Mesh(wireGeo, mat(0xaaaaaa));
            wireM.position.set(cx, plateY - 4, cz + 4);
            wireM.userData.part = 'plate';
            sceneGroup.add(wireM);
        } else if (kh >= 2) {
            // Vertical stabilizer wire (ISO Enter, numpad tall keys)
            const cx = -plateW / 2 + (key.x + kw / 2) * pitch;
            const cz = -plateH / 2 + (key.y + kh / 2) * pitch;
            const ss = 23.8; // 2u stab spacing
            const wireGeo = new THREE.CylinderGeometry(0.8, 0.8, ss, 8);
            // rotateX for vertical orientation (wire goes front-to-back)
            wireGeo.rotateX(Math.PI / 2);
            const wireM = new THREE.Mesh(wireGeo, mat(0xaaaaaa));
            wireM.position.set(cx - 4, plateY - 4, cz);
            wireM.userData.part = 'plate';
            sceneGroup.add(wireM);
        }
    });

    // ════════════════════════════════════════
    //  TRAY MOUNT STANDOFFS
    // ════════════════════════════════════════
    if (state.mountType === 'tray') {
        const stMat = mat(0x999999);
        const holMat = mat(0x222222);

        // Clamp standoff height so it doesn't protrude through the plate
        const effH = Math.min(state.standoffH, pcbCl - 1.0);

        // Reuse same clamped screw positions as plate holes
        const outerR = state.standoffD / 2;
        const innerR = state.standoffScrew / 2;
        const tubeSeg = 16;

        _plateScrew.forEach(s => {
            const cx = -plateW / 2 + s.xu * pitch;
            const cz = -plateH / 2 + s.yu * pitch;

            // チューブジオメトリ（外径 - 内径穴）を生成して自己交差を排除
            const shape = new THREE.Shape();
            shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
            const holePath = new THREE.Path();
            holePath.absarc(0, 0, innerR, 0, Math.PI * 2, true);
            shape.holes.push(holePath);

            const tubeGeo = new THREE.ExtrudeGeometry(shape, {
                depth: effH, bevelEnabled: false, curveSegments: tubeSeg
            });
            tubeGeo.rotateX(-Math.PI / 2); // Z方向→Y方向に回転

            const tubeMesh = new THREE.Mesh(tubeGeo, stMat);
            tubeMesh.position.set(cx, bottomT, cz);
            tubeMesh.userData.part = 'bottom';
            tubeMesh.userData.subPart = 'structure';
            sceneGroup.add(tubeMesh);
        });
    }

    // ════════════════════════════════════════
    //  GASKET TABS
    // ════════════════════════════════════════
    if (state.mountType === 'gasket') {
        const tabMat = mat(0x777777);
        const tabW = state.gasketW, tabT = state.gasketT, tabH = 4;
        const sp = state.gasketSpacing, tabY = bottomT + pcbCl;
        for (let side = 0; side < 4; side++) {
            const isH = side < 2;
            const len = isH ? plateW : plateH;
            const cnt = Math.max(2, Math.floor(len / sp));
            for (let i = 0; i < cnt; i++) {
                const t = (i + 0.5) / cnt - 0.5;
                const g = new THREE.BoxGeometry(isH ? tabW : tabT, tabH, isH ? tabT : tabW);
                const m = new THREE.Mesh(g, tabMat);
                if (side === 0) m.position.set(t * len, tabY + tabH / 2, -plateH / 2 - tabT / 2);
                else if (side === 1) m.position.set(t * len, tabY + tabH / 2, plateH / 2 + tabT / 2);
                else if (side === 2) m.position.set(-plateW / 2 - tabT / 2, tabY + tabH / 2, t * len);
                else m.position.set(plateW / 2 + tabT / 2, tabY + tabH / 2, t * len);
                sceneGroup.add(m);
            }
        }
    }

    // ════════════════════════════════════════
    //  NESTED ADJUSTABLE KEYBOARD FEET
    //  ロ-shaped outer frame (stage 2) stores solid inner foot (stage 1).
    //  Hinge at rear edge, foot stows toward front (+Z).
    //  Deploy = pure X rotation, swings foot straight down. No splay.
    //  Stage 0 = both stowed flat in recess
    //  Stage 1 = inner solid foot deploys (low tilt)
    //  Stage 2 = outer ロ frame deploys (high tilt), inner foot stored inside
    // ════════════════════════════════════════
    {
        const hingeZ = -caseD / 2 + pivotFromRear - zOff;
        const hingeY = footT / 2;
        const feetStage = state.feetStage || 0;
        const deployAngle = 120 * Math.PI / 180;
        const fOff = 1;

        // Rubber pads on bottom of case (anti-slip at corners)
        const padR = 4, padH = 1.5;
        const padMat = mat(state.rubberPadColor);
        const padYBase = chamVal > 0 ? -chamVal : 0;
        if (state.showRubberPads) {
            [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
                const padGeo = new THREE.CylinderGeometry(padR, padR, padH, 12);
                const padMesh = new THREE.Mesh(padGeo, padMat);
                padMesh.position.set(sx * (caseW / 2 - 12), padYBase - padH / 2, sz * (caseD / 2 - 12) - zOff);
                padMesh.userData.part = 'bottom';
                padMesh.userData.subPart = 'pads';
                sceneGroup.add(padMesh);
            });
        }

        const footMat = mat(state.feetColor);
        const hingeMat = mat(state.feetColor);
        const recessMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a,
            wireframe: state.displayMode === 'wireframe' });

        // Recess: hinge at rear, foot extends in +Z (toward front)
        const recessSceneCZ = hingeZ + recessLen / 2 - 2;

        [-1, 1].forEach(side => {
            const fx = side * (caseW / 2 - footInset);

            // ── Recess ceiling visual ──
            const rcGeo = new THREE.BoxGeometry(recessW, 0.2, recessLen);
            const rcMesh = new THREE.Mesh(rcGeo, recessMat);
            rcMesh.position.set(fx, footRecessDepth - 0.1, recessSceneCZ);
            rcMesh.userData.part = 'bottom';
            rcMesh.userData.subPart = 'feet';
            sceneGroup.add(rcMesh);

            // ── Hinge support walls ──
            const hwH = footRecessDepth, hwW = 1.2, hwD = hingeR * 4;
            [-1, 1].forEach(ws => {
                const wGeo = new THREE.BoxGeometry(hwW, hwH, hwD);
                const wMesh = new THREE.Mesh(wGeo, bottomMat.clone());
                wMesh.position.set(fx + ws * (recessW / 2 + hwW / 2), hwH / 2, hingeZ);
                wMesh.userData.part = 'bottom';
                wMesh.userData.subPart = 'feet';
                sceneGroup.add(wMesh);
            });

            // ── Hinge pin ──
            const pinGeo = new THREE.CylinderGeometry(hingeR, hingeR, recessW, 12);
            pinGeo.rotateZ(Math.PI / 2);
            const pinMesh = new THREE.Mesh(pinGeo, hingeMat);
            pinMesh.position.set(fx, hingeY, hingeZ);
            pinMesh.userData.part = 'bottom';
            pinMesh.userData.subPart = 'feet';
            sceneGroup.add(pinMesh);

            // ── Outer frame foot (ロ shape, stage 2) ──
            const frameGroup = new THREE.Group();
            frameGroup.position.set(fx, hingeY, hingeZ);

            // Hinge collar
            const collarGeo = new THREE.CylinderGeometry(hingeR + 0.4, hingeR + 0.4, footW - 1, 12);
            collarGeo.rotateZ(Math.PI / 2);
            const collarMesh = new THREE.Mesh(collarGeo, footMat);
            frameGroup.add(collarMesh);

            // Frame ロ shape — extends in +Z (toward front, stows in recess)
            const sideRailGeo = new THREE.BoxGeometry(frameBarT, footT, frameFLen);
            [-1, 1].forEach(s => {
                const rail = new THREE.Mesh(sideRailGeo, footMat);
                rail.position.set(s * (footW / 2 - frameBarT / 2), 0, frameFLen / 2 + fOff);
                frameGroup.add(rail);
            });
            const crossBarW = footW - 2 * frameBarT;
            const crossBarGeo = new THREE.BoxGeometry(crossBarW, footT, frameBarT);
            const farBar = new THREE.Mesh(crossBarGeo, footMat);
            farBar.position.set(0, 0, frameFLen + fOff - frameBarT / 2);
            frameGroup.add(farBar);
            const nearBar = new THREE.Mesh(crossBarGeo.clone(), footMat);
            nearBar.position.set(0, 0, fOff + frameBarT / 2);
            frameGroup.add(nearBar);

            // Frame rubber tip
            const fTipGeo = new THREE.BoxGeometry(footW - 1, 1.0, 3);
            const fTipMesh = new THREE.Mesh(fTipGeo, padMat);
            fTipMesh.position.set(0, -footT / 2 - 0.5, frameFLen + fOff - 1.5);
            frameGroup.add(fTipMesh);

            // ── Inner solid foot (stage 1, stored inside ロ frame) ──
            const innerGroup = new THREE.Group();

            const ifBodyGeo = new THREE.BoxGeometry(innerFootW, footT * 0.8, innerFLen);
            const ifBodyMesh = new THREE.Mesh(ifBodyGeo, footMat);
            ifBodyMesh.position.set(0, 0, innerFLen / 2 + fOff);
            innerGroup.add(ifBodyMesh);

            const iTipGeo = new THREE.BoxGeometry(innerFootW - 1, 0.8, 2.5);
            const iTipMesh = new THREE.Mesh(iTipGeo, padMat);
            iTipMesh.position.set(0, -footT * 0.4 - 0.4, innerFLen + fOff - 1);
            innerGroup.add(iTipMesh);

            frameGroup.add(innerGroup);

            // ── Deploy: pure X rotation only — perfectly horizontal ──
            if (feetStage === 1) {
                innerGroup.rotation.x = deployAngle;
            } else if (feetStage === 2) {
                frameGroup.rotation.x = deployAngle;
            }

            frameGroup.traverse(child => { child.userData.part = 'bottom'; child.userData.subPart = 'feet'; });
            sceneGroup.add(frameGroup);

            // ── Detent notches ──
            const nz = hingeZ + Math.cos(deployAngle) * (hingeR + 2);
            const ny = hingeY - Math.sin(deployAngle) * (hingeR + 2);
            [-1, 1].forEach(ns => {
                const nGeo = new THREE.SphereGeometry(0.5, 6, 6);
                const nMesh = new THREE.Mesh(nGeo, hingeMat);
                nMesh.position.set(fx + ns * (recessW / 2 + 0.3), ny, nz);
                nMesh.userData.part = 'bottom';
                nMesh.userData.subPart = 'feet';
                sceneGroup.add(nMesh);
            });
        });
    }

    // ════════════════════════════════════════
    //  テキスト印字
    // ════════════════════════════════════════
    const hasAnyText = state.enableTopText || state.enableTopSide ||
                       state.enableBottomText || state.enableBottomSide;
    const hasAnySvg = state.enableSvg && state.svgContent;
    if ((hasAnyText && makeTextGeo) || hasAnySvg) {
        const textGeos = [];
        const topEngraveGeos = [];
        const bottomEngraveGeos = [];

        const handleGeo = (geo, mode, target) => {
            if (!geo) return;
            const engraveArr = (target === 'top') ? topEngraveGeos : bottomEngraveGeos;
            if (mode === 'emboss') textGeos.push(geo);
            else if (mode === 'engrave') engraveArr.push(geo);
            else if (mode === 'doubleshot') { textGeos.push(geo); engraveArr.push(geo.clone()); }
            // lithophane は廃止
        };

        // トップケース上面テキスト（上面Y = totalH, zOff でケース中心補正）
        if (state.enableTopText && state.topText) {
            const topY = totalH;
            const g = createBodySurfaceText(
                state.topText, state.topTextFont, state.topTextSize,
                state.topTextHeight, state.topTextX, state.topTextZ + zOff, topY, true, state.topTextMode
            );
            handleGeo(g, state.topTextMode, 'top');
        }
        // トップケース側面テキスト
        if (state.enableTopSide && state.topSideText) {
            const midY = bottomT + wallH / 2 + plT;
            const g = createBodySideText(
                state.topSideText, state.topSideFont, state.topSideSize,
                state.topSideFace, state.topSideY, caseW, caseD, midY, zOff, state.topSideMode
            );
            handleGeo(g, state.topSideMode, 'top');
        }
        // ボトムケース底面テキスト（底面Y = 0, 下向き）
        if (state.enableBottomText && state.bottomText) {
            const g = createBodySurfaceText(
                state.bottomText, state.bottomTextFont, state.bottomTextSize,
                state.bottomTextHeight, state.bottomTextX, state.bottomTextZ + zOff, 0, false, state.bottomTextMode
            );
            handleGeo(g, state.bottomTextMode, 'bottom');
        }
        // ボトムケース側面テキスト
        if (state.enableBottomSide && state.bottomSideText) {
            const midY = bottomT / 2;
            const g = createBodySideText(
                state.bottomSideText, state.bottomSideFont, state.bottomSideSize,
                state.bottomSideFace, state.bottomSideY, caseW, caseD, midY, zOff, state.bottomSideMode
            );
            handleGeo(g, state.bottomSideMode, 'bottom');
        }

        // SVGアイコン
        if (state.enableSvg && state.svgContent) {
            const isTop = (state.svgTarget === 'top');
            const svgSurfaceY = isTop ? totalH : 0;
            const g = createBodySurfaceSVG(
                state.svgContent, state.svgScale, state.svgThickness,
                state.svgPosX, state.svgPosZ + zOff, svgSurfaceY, isTop, state.svgMode, state.svgRotZ
            );
            handleGeo(g, state.svgMode, isTop ? 'top' : 'bottom');
        }

        // CSG: engrave をボディから引く
        if (topEngraveGeos.length > 0) {
            const merged = safeMerge(topEngraveGeos);
            if (merged) applyCSGToPartMeshes('body', null, merged);
        }
        if (bottomEngraveGeos.length > 0) {
            const merged = safeMerge(bottomEngraveGeos);
            if (merged) applyCSGToPartMeshes('bottom', 'structure', merged);
        }

        // テキストメッシュ追加（emboss/doubleshot）
        if (textGeos.length > 0) {
            const merged = safeMerge(textGeos);
            if (merged) {
                const textMesh = new THREE.Mesh(merged, mat(state.textColor));
                textMesh.userData.part = 'text';
                sceneGroup.add(textMesh);
            }
        }
    }

    // ════════════════════════════════════════
    //  TILT (from tilt angle slider + feet stage)
    // ════════════════════════════════════════
    // Calculate effective tilt: slider angle + feet contribution
    const feetTiltAdd = state.feetStage === 2 ? 8 : state.feetStage === 1 ? 4 : 0;
    const effectiveTilt = tiltDeg + feetTiltAdd;
    if (effectiveTilt !== 0) {
        const rad = effectiveTilt * Math.PI / 180;
        sceneGroup.rotation.x = rad;
        sceneGroup.position.y = Math.sin(Math.abs(rad)) * caseD / 2;
    } else {
        sceneGroup.rotation.x = 0;
        sceneGroup.position.y = 0;
    }

    // ════════════════════════════════════════
    //  HUD
    // ════════════════════════════════════════
    //  PART FILTER (body-only / plate-only / all)
    // ════════════════════════════════════════
    // Tag untagged meshes: anything without userData.part defaults to 'body'
    sceneGroup.children.forEach(ch => {
        if (!ch.userData.part) ch.userData.part = 'body';
    });
    // Apply visibility filter (handles nested Groups)
    if (state.partFilter !== 'all') {
        sceneGroup.children.forEach(ch => {
            const part = ch.userData.part || 'body';
            // テキストパーツは'body'フィルタ時にも表示
            if (part === 'text') {
                ch.visible = (state.partFilter === 'body');
            } else {
                ch.visible = (part === state.partFilter);
            }
        });
    }

    // ════════════════════════════════════════
    //  STATS
    // ════════════════════════════════════════
    _lastBodyVolCm3 = (caseW * caseD * totalH - iw * ih * (totalH - bottomT)) / 1000;
    updateBodyStats();
    const kEl = document.getElementById('info-key-count');
    if (kEl) kEl.textContent = keysList.length;
}

// ── SVG Stock Icons for Body ────────────────
function autoScaleBodySvg(svgString) {
    const m = svgString.match(/viewBox=["']([^"']+)["']/);
    if (!m) return;
    const parts = m[1].split(/[\s,]+/).map(Number);
    const maxDim = Math.max(parts[2] || 24, parts[3] || 24);
    const autoScale = 24 / maxDim;
    state.svgScale = autoScale;
    const s1 = document.getElementById('body-svg-scale');
    const v1 = document.getElementById('v-body-svg-scale');
    const s2 = document.getElementById('body-svg-icon-scale');
    const v2 = document.getElementById('v-body-svg-icon-scale');
    if (s1) s1.value = autoScale;
    if (v1) v1.textContent = autoScale.toFixed(2);
    if (s2) s2.value = autoScale;
    if (v2) v2.textContent = autoScale.toFixed(2);
}

function renderBodyStockIcons(category) {
    const grid = document.getElementById('body-svg-icon-grid');
    if (!grid) return;
    const data = window._stockIconsData;
    if (!data || !data.icons) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:10px;">アイコンなし</div>';
        return;
    }
    grid.innerHTML = '';
    const icons = (category === 'all') ? data.icons : data.icons.filter(ic => ic.category === category);
    if (icons.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:10px;">アイコンなし</div>';
        return;
    }
    const normFn = window.normalizeSVGForPreview || (s => s);
    for (const icon of icons) {
        const btn = document.createElement('button');
        btn.className = 'stock-icon-btn';
        btn.title = icon.nameJa || icon.name;
        btn.innerHTML = normFn(icon.svgContent);
        btn.addEventListener('click', () => {
            // 選択状態
            grid.querySelectorAll('.stock-icon-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            // SVG適用
            state.svgContent = icon.svgContent;
            state.svgName = icon.id;
            state.enableSvg = true;
            const cb = document.getElementById('body-enable-svg');
            if (cb) cb.checked = true;
            autoScaleBodySvg(icon.svgContent);
            requestBodyUpdate();
            bodyCommitHistory();
        });
        grid.appendChild(btn);
    }
}

function initBodySvgCategoryDropdown() {
    const catSel = document.getElementById('body-svg-icon-category');
    if (!catSel) return;
    const data = window._stockIconsData;
    if (!data || !data.categories) return;
    // カテゴリオプション追加（"すべて"の後に）
    data.categories.forEach(cat => {
        if (catSel.querySelector(`option[value="${cat.id}"]`)) return;
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = (cat.nameJa || cat.name) + ' (' + cat.name + ')';
        catSel.appendChild(opt);
    });
    catSel.addEventListener('change', (e) => renderBodyStockIcons(e.target.value));
}

// ── UI Binding ─────────────────────────────
// ── Phase 9: アシスト機能ヘルパー ───────────────
function estimateBodyVolume() {
    const p = (typeof getParams === 'function') ? getParams() : null;
    // Fallback: simple bbox from layout
    const w = (p && p.totalW) || 380;
    const d = (p && p.totalD) || 130;
    const h = (state.bezelTop + state.bezelBottom + state.bottomThickness) || 25;
    // Outer shell volume minus rough hollow
    const outer = w * d * h;
    const inner = (w - state.wallThickness * 2) * (d - state.wallThickness * 2) * (h - state.bottomThickness - 2);
    return Math.max(0, outer - inner) / 1000; // cm³
}
function bodyMaterialPresets() {
    return [
        { id: 'pla', name: 'PLA', density: 1.24, pricePerKg: 25 },
        { id: 'abs', name: 'ABS', density: 1.04, pricePerKg: 28 },
        { id: 'petg', name: 'PETG', density: 1.27, pricePerKg: 28 },
        { id: 'nylon', name: 'Nylon', density: 1.13, pricePerKg: 60 },
        { id: 'resin', name: 'Resin', density: 1.10, pricePerKg: 70 }
    ];
}
function suggestScrewPostPositions() {
    const p = (typeof getParams === 'function') ? getParams() : null;
    const w = (p && p.totalW) || 380;
    const d = (p && p.totalD) || 130;
    const margin = (state.bezelSide || 5) + 4;
    const positions = [];
    // 4 corners
    positions.push({ x: -w / 2 + margin, z: -d / 2 + margin });
    positions.push({ x:  w / 2 - margin, z: -d / 2 + margin });
    positions.push({ x: -w / 2 + margin, z:  d / 2 - margin });
    positions.push({ x:  w / 2 - margin, z:  d / 2 - margin });
    // Every ~85mm along long edges
    const usableW = w - margin * 2;
    const stepCount = Math.max(0, Math.floor(usableW / 85) - 1);
    if (stepCount > 0) {
        const step = usableW / (stepCount + 1);
        for (let i = 1; i <= stepCount; i++) {
            const xPos = -w / 2 + margin + step * i;
            positions.push({ x: xPos, z: -d / 2 + margin });
            positions.push({ x: xPos, z:  d / 2 - margin });
        }
    }
    return positions;
}
const INSERT_GUIDE = {
    m2:   { name: 'M2',   hole: 3.2, depth: 4.0, clearance: 0.1 },
    m2_5: { name: 'M2.5', hole: 3.5, depth: 5.0, clearance: 0.1 },
    m3:   { name: 'M3',   hole: 4.0, depth: 5.5, clearance: 0.15 }
};
const ACOUSTIC_PRESETS = {
    hollow: { wallThickness: 1.5, pcbClearance: 5, bottomThickness: 2.0, ribs: false },
    bass:   { wallThickness: 3.5, pcbClearance: 4, bottomThickness: 4.0, ribs: true },
    firm:   { wallThickness: 4.0, pcbClearance: 2, bottomThickness: 5.0, ribs: true },
    silent: { wallThickness: 3.0, pcbClearance: 3, bottomThickness: 3.5, ribs: true },
    foam:   { wallThickness: 2.5, pcbClearance: 6, bottomThickness: 3.0, ribs: false }
};
const USB_PORT_TEMPLATES = {
    'usb-c':     { name: 'USB-C',         w: 10.0, h: 3.2 },
    'mini-usb':  { name: 'Mini-B',        w:  7.5, h: 3.5 },
    'micro-usb': { name: 'Micro-B',       w:  8.0, h: 3.0 },
    'trrs':      { name: 'TRRS / 3.5mm',  w:  6.0, h: 6.0 }
};
function computeTiltGeometry() {
    const angle = state.tiltAngle || 0;
    const totalH = (state.bezelTop + state.bezelBottom + state.bottomThickness) || 25;
    const totalD = 130; // approximate
    const rearLift = totalD * Math.sin(angle * Math.PI / 180);
    return { angle, frontH: totalH, rearH: totalH + rearLift, typingAngle: angle };
}
const VARIATION_PRESETS = {
    low:      { profileType: 'low',  bezelTop: 3, bezelBottom: 5, bottomThickness: 2 },
    standard: { profileType: 'mid',  bezelTop: 5, bezelBottom: 8, bottomThickness: 2.5 },
    high:     { profileType: 'high', bezelTop: 8, bezelBottom: 12, bottomThickness: 3 },
    wedge:    { profileType: 'high', tiltAngle: 7, bezelTop: 5, bezelBottom: 12 },
    floating: { profileType: 'low',  bezelTop: 2, bezelBottom: 4, wallThickness: 2 }
};

// Phase 11: 分割ケース設計 (ベッドサイズチェック)
// 主要 3D プリンタの造形サイズを参照し、現在のケースが収まるか判定する。
// 収まらない場合は、推奨される分割数 (例: 左右 / 4分割) を提示する。
const PRINTER_BED_SIZES = Object.freeze({
    'bambu-x1':       { name: 'Bambu Lab X1/P1',     w: 256, d: 256, h: 256 },
    'bambu-a1':       { name: 'Bambu Lab A1',        w: 256, d: 256, h: 256 },
    'bambu-a1m':      { name: 'Bambu Lab A1 mini',   w: 180, d: 180, h: 180 },
    'prusa-mk4':      { name: 'Prusa MK4',           w: 250, d: 210, h: 220 },
    'prusa-xl':       { name: 'Prusa XL',            w: 360, d: 360, h: 360 },
    'creality-k1':    { name: 'Creality K1',         w: 220, d: 220, h: 250 },
    'creality-k2':    { name: 'Creality K2 Plus',    w: 350, d: 350, h: 350 },
    'voron-2.4-300':  { name: 'Voron 2.4 (300)',     w: 300, d: 300, h: 300 },
    'voron-2.4-350':  { name: 'Voron 2.4 (350)',     w: 350, d: 350, h: 350 }
});

function checkSplitCase(bedKey) {
    const bed = PRINTER_BED_SIZES[bedKey] || PRINTER_BED_SIZES['bambu-x1'];
    // 現在のレイアウトから推定外寸を計算
    const layout = state.layout || '60';
    const layoutW = { '60': 290, '65': 320, '75': 340, 'tkl': 360, 'full': 440, '40': 240, 'alice': 320, 'macro': 60, '1800': 410 }[layout] || 290;
    const layoutD = 130; // 概算 (5 row)
    const totalW = layoutW + (state.bezelSide || 5) * 2 + (state.wallThickness || 3) * 2;
    const totalD = layoutD + (state.bezelTop || 5) + (state.bezelBottom || 8) + (state.wallThickness || 3) * 2;
    const totalH = (state.bezelTop || 5) + (state.bezelBottom || 8) + (state.bottomThickness || 2.5) + (state.tiltAngle ? totalD * Math.sin((state.tiltAngle || 0) * Math.PI / 180) : 0);

    const fitsW = totalW <= bed.w;
    const fitsD = totalD <= bed.d;
    const fitsH = totalH <= bed.h;
    const fits = fitsW && fitsD && fitsH;

    let splitSuggestion = null;
    if (!fits) {
        const splitW = Math.ceil(totalW / bed.w);
        const splitD = Math.ceil(totalD / bed.d);
        const totalParts = splitW * splitD;
        splitSuggestion = {
            partsW: splitW,
            partsD: splitD,
            totalParts,
            partW: (totalW / splitW).toFixed(1),
            partD: (totalD / splitD).toFixed(1),
            joinerType: totalParts === 2 ? 'ダボ + ネジ' : '蟻継ぎ + ネジ'
        };
    }
    return { bed, totalW, totalD, totalH, fits, fitsW, fitsD, fitsH, splitSuggestion };
}
function bodyAssistShowResult(html) {
    const el = document.getElementById('body-assist-result');
    if (!el) return;
    el.style.display = '';
    el.innerHTML = html;
}

function bindUI() {
    document.querySelectorAll('.layout-preset-btn').forEach(b => {
        b.addEventListener('click', () => {
            // Clear custom layout when selecting a preset
            state.customLayoutData = null;
            state.customLayoutName = null;
            document.querySelectorAll('.layout-preset-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            state.layout = b.dataset.layout;
            syncCustomLayoutUI();
            updateModel();
            bodyCommitHistory();
        });
    });
    // ── Layout Gallery ──────────────────────
    function loadBodyLayoutGallery() {
        const grid = document.getElementById('layout-gallery-grid');
        if (!grid) return;
        if (!window._layoutModule || !window._layoutModule.loadGalleryItems) {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:8px; font-size:11px;">Layout Studioで保存したレイアウトがここに表示されます</div>';
            return;
        }
        window._layoutModule.loadGalleryItems((items) => {
            if (!items || items.length === 0) {
                grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; padding:8px; font-size:11px;">ギャラリーにアイテムがありません</div>';
                return;
            }
            items.sort((a, b) => b.timestamp - a.timestamp);
            grid.innerHTML = '';
            for (const item of items) {
                const tile = document.createElement('div');
                tile.className = 'layout-gallery-tile';
                tile.dataset.id = item.id;
                tile.dataset.name = item.name || '';
                tile.title = item.name || 'Unnamed';
                if (state.customLayoutName && state.customLayoutName === item.name) {
                    tile.classList.add('active');
                }
                if (item.thumbnail) {
                    const img = document.createElement('img');
                    img.src = item.thumbnail;
                    img.style.cssText = 'width:100%; height:100%; object-fit:contain; pointer-events:none;';
                    tile.appendChild(img);
                } else {
                    tile.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#666; font-size:10px;">' + (item.name || '?') + '</div>';
                }
                tile.addEventListener('click', () => {
                    if (!item.state) return;
                    const bodyData = convertLayoutToBodyData(item.state, state.keyPitch);
                    if (!bodyData) {
                        if (typeof showToast === 'function') showToast('スイッチシンボルが見つかりません', true);
                        return;
                    }
                    state.customLayoutData = bodyData;
                    state.customLayoutName = item.name || 'Custom';
                    syncCustomLayoutUI();
                    updateModel();
                    bodyCommitHistory();
                });
                grid.appendChild(tile);
            }
        });
    }
    _loadBodyGalleryFn = loadBodyLayoutGallery;

    // Initial gallery load
    loadBodyLayoutGallery();

    // Gallery refresh button
    const refreshGalleryBtn = document.getElementById('btn-refresh-layout-gallery');
    if (refreshGalleryBtn) {
        refreshGalleryBtn.addEventListener('click', () => loadBodyLayoutGallery());
    }

    // Clear custom layout button
    const clearCustomBtn = document.getElementById('btn-clear-custom-layout');
    if (clearCustomBtn) {
        clearCustomBtn.addEventListener('click', () => {
            state.customLayoutData = null;
            state.customLayoutName = null;
            syncCustomLayoutUI();
            updateModel();
            bodyCommitHistory();
        });
    }

    // Phase 7-1: PCB / プレート取込
    const pcbBtn = document.getElementById('body-pcb-import-btn');
    const pcbInput = document.getElementById('body-pcb-file-input');
    if (pcbBtn && pcbInput) {
        pcbBtn.addEventListener('click', () => pcbInput.click());
        pcbInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const ext = file.name.split('.').pop().toLowerCase();
                let parsed;
                if (ext === 'dxf') {
                    parsed = _parsePCBImportDXF(text);
                } else if (ext === 'svg') {
                    parsed = _parsePCBImportSVG(text);
                } else {
                    throw new Error('Unsupported format: ' + ext);
                }
                state.pcbImportName = file.name;
                state.pcbImportData = parsed;
                const info = document.getElementById('body-pcb-loaded-info');
                if (info) {
                    info.style.display = '';
                    info.textContent = `${file.name} — outline: ${parsed.outline ? 'OK' : 'なし'} / switch holes: ${parsed.switchHoles?.length || 0} / screw holes: ${parsed.screwHoles?.length || 0}`;
                }
                requestBodyUpdate();
                bodyCommitHistory();
                if (showToast) showToast(`PCB/プレート読込完了: ${file.name}`);
            } catch (err) {
                console.error('PCB import error:', err);
                if (showToast) showToast('PCB/プレート読込失敗: ' + (err.message || err));
            }
        });
    }

    document.querySelectorAll('#mount-type-buttons .mount-option').forEach(o => {
        o.addEventListener('click', () => {
            document.querySelectorAll('#mount-type-buttons .mount-option').forEach(x => x.classList.remove('active'));
            o.classList.add('active');
            state.mountType = o.dataset.mount;
            document.getElementById('mount-tray-params').style.display = state.mountType === 'tray' ? 'block' : 'none';
            document.getElementById('mount-gasket-params').style.display = state.mountType === 'gasket' ? 'block' : 'none';
            updateModel();
            bodyCommitHistory();
        });
    });

    const sliders = [
        ['body-key-pitch', 'v-body-pitch', 'keyPitch'],
        ['bezel-top', 'v-bezel-top', 'bezelBottom'], ['bezel-bottom', 'v-bezel-bottom', 'bezelTop'],
        ['bezel-side', 'v-bezel-side', 'bezelSide'], ['body-corner-radius', 'v-body-fillet', 'cornerRadius'],
        ['body-wall-thickness', 'v-body-wall', 'wallThickness'],
        ['body-bottom-thickness', 'v-body-bottom-thick', 'bottomThickness'],
        ['body-tilt-angle', 'v-body-tilt', 'tiltAngle'], ['body-comfort-edge', 'v-comfort-edge', 'comfortEdge'],
        ['body-port-margin', 'v-port-margin', 'portMargin'], ['body-pcb-clearance', 'v-pcb-clearance', 'pcbClearance'],
        ['body-tolerance', 'v-body-tolerance', 'tolerance'],
        ['standoff-height', 'v-standoff-h', 'standoffH'], ['standoff-diameter', 'v-standoff-d', 'standoffD'],
        ['standoff-screw', 'v-standoff-screw', 'standoffScrew'],
        ['gasket-tab-width', 'v-gasket-w', 'gasketW'], ['gasket-tab-thickness', 'v-gasket-t', 'gasketT'],
        ['gasket-tab-spacing', 'v-gasket-spacing', 'gasketSpacing'],
        ['body-usb-pos-x', 'v-usb-pos-x', 'usbPosX'], ['body-usb-pos-y', 'v-usb-pos-y', 'usbPosY'],
        ['body-bat-pos-x', 'v-bat-pos-x', 'batteryPosX'], ['body-bat-pos-z', 'v-bat-pos-z', 'batteryPosZ'],
    ];
    let _bodyCommitTimer = null;
    function debouncedCommit() {
        clearTimeout(_bodyCommitTimer);
        _bodyCommitTimer = setTimeout(() => bodyCommitHistory(), 400);
    }

    sliders.forEach(([id, vid, prop]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => {
            state[prop] = parseFloat(el.value);
            const v = document.getElementById(vid);
            if (v) v.textContent = el.value;
            updateModel();
            debouncedCommit();
        });
    });

    const selMap = {
        'body-layout-standard': 'layoutStandard', 'body-profile-type': 'profileType',
        'body-usb-type': 'usbType', 'body-insert-nut': 'insertNut'
    };
    Object.entries(selMap).forEach(([id, p]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => { state[p] = el.value; updateModel(); bodyCommitHistory(); });
    });

    const togMap = {
        'body-wkl': 'wkl', 'body-hhkb-blocker': 'hhkbBlocker', 'body-neg-tilt': 'negTilt',
        'body-ribs': 'ribs', 'body-battery-space': 'batterySpace',
        'body-split-print': 'splitPrint', 'body-mouse-ear': 'mouseEar',
        'body-encoder': 'encoder', 'body-oled': 'oled', 'body-tripod': 'tripod',
        'body-rubber-pads': 'showRubberPads'
    };
    Object.entries(togMap).forEach(([id, p]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            state[p] = el.checked;
            // Show/hide battery position params
            if (p === 'batterySpace') {
                const bp = document.getElementById('battery-pos-params');
                if (bp) bp.style.display = el.checked ? 'block' : 'none';
            }
            updateModel();
            bodyCommitHistory();
        });
    });

    // Feet stage buttons
    document.querySelectorAll('.feet-stage-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.feet-stage-btn').forEach(x => x.classList.remove('active'));
            btn.classList.add('active');
            state.feetStage = parseInt(btn.dataset.stage, 10);
            updateModel();
            bodyCommitHistory();
        });
    });

    // AMS パレット描画
    renderBodyAMSPalette();
    // ドロップダウン change でパレット再描画
    document.getElementById('body-palette-target-select')?.addEventListener('change', () => renderBodyAMSPalette());

    // AMS設定ボタン → keycap generatorと同じダイアログを開く
    document.getElementById('btn-body-ams-config')?.addEventListener('click', () => {
        document.getElementById('btn-ams-config')?.click();
    });

    // ── テキスト印字 UI バインディング ──
    populateBodyFontSelects();

    // ターゲットドロップダウン
    document.getElementById('body-text-target-select')?.addEventListener('change', (e) => {
        switchBodyTextPanel(e.target.value);
    });

    // トグルスイッチ（各パネル内）
    const textToggleMap = {
        'body-enable-top-text': 'enableTopText',
        'body-enable-top-side': 'enableTopSide',
        'body-enable-bottom-text': 'enableBottomText',
        'body-enable-bottom-side': 'enableBottomSide',
    };
    Object.entries(textToggleMap).forEach(([id, prop]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            state[prop] = el.checked;
            requestBodyUpdate();
            bodyCommitHistory();
            if (window._gumballDelegate && window.updateGumballTargetDropdown) {
                window.updateGumballTargetDropdown();
            }
        });
    });

    // テキスト入力
    const textInputMap = {
        'body-top-text': 'topText',
        'body-top-side-text': 'topSideText',
        'body-bottom-text': 'bottomText',
        'body-bottom-side-text': 'bottomSideText',
    };
    // IME 入力中はテキスト確定までパイプラインを動かさない（漢字変換時のカクツキ対策）。
    // それ以外は requestBodyUpdate (rAF 集約) でほぼ瞬時に反映。
    Object.entries(textInputMap).forEach(([id, prop]) => {
        const el = document.getElementById(id);
        if (!el) return;
        let _bodyComposing = false;
        el.addEventListener('compositionstart', () => { _bodyComposing = true; });
        el.addEventListener('compositionend', () => {
            _bodyComposing = false;
            state[prop] = el.value;
            requestBodyUpdate();
        });
        el.addEventListener('input', () => {
            if (_bodyComposing) return;
            state[prop] = el.value;
            requestBodyUpdate();
        });
        el.addEventListener('change', () => bodyCommitHistory());
    });

    // テキスト用スライダー
    const textSliderMap = {
        'body-top-text-size': { prop: 'topTextSize', vid: 'v-top-text-size' },
        'body-top-text-height': { prop: 'topTextHeight', vid: 'v-top-text-height' },
        'body-top-text-x': { prop: 'topTextX', vid: 'v-top-text-x' },
        'body-top-text-z': { prop: 'topTextZ', vid: 'v-top-text-z' },
        'body-top-side-size': { prop: 'topSideSize', vid: 'v-top-side-size' },
        'body-top-side-y': { prop: 'topSideY', vid: 'v-top-side-y' },
        'body-bottom-text-size': { prop: 'bottomTextSize', vid: 'v-bottom-text-size' },
        'body-bottom-text-height': { prop: 'bottomTextHeight', vid: 'v-bottom-text-height' },
        'body-bottom-text-x': { prop: 'bottomTextX', vid: 'v-bottom-text-x' },
        'body-bottom-text-z': { prop: 'bottomTextZ', vid: 'v-bottom-text-z' },
        'body-bottom-side-size': { prop: 'bottomSideSize', vid: 'v-bottom-side-size' },
        'body-bottom-side-y': { prop: 'bottomSideY', vid: 'v-bottom-side-y' },
    };
    Object.entries(textSliderMap).forEach(([id, cfg]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => {
            state[cfg.prop] = parseFloat(el.value);
            const v = document.getElementById(cfg.vid);
            if (v) v.textContent = el.value;
            requestBodyUpdate();
            debouncedCommit();
        });
    });

    // テキスト用セレクト（面選択のみ — モードはHUDに移行）
    const textSelectMap = {
        'body-top-side-face': 'topSideFace',
        'body-bottom-side-face': 'bottomSideFace',
    };
    Object.entries(textSelectMap).forEach(([id, prop]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            state[prop] = el.value;
            requestBodyUpdate();
            bodyCommitHistory();
        });
    });

    // 統合エクスポートボタン
    document.getElementById('btn-body-export')?.addEventListener('click', () => showBodyExportDialog());

    // Phase 7-3: ケース断面ビュー — トグル / 軸 / 位置スライダー
    document.getElementById('body-cross-section-enabled')?.addEventListener('change', (e) => {
        state.crossSectionEnabled = e.target.checked;
        requestBodyUpdate();
    });
    document.getElementById('body-cross-section-axis')?.addEventListener('change', (e) => {
        state.crossSectionAxis = e.target.value;
        requestBodyUpdate();
    });
    const csPos = document.getElementById('body-cross-section-pos');
    if (csPos) csPos.addEventListener('input', (e) => {
        state.crossSectionPos = parseFloat(e.target.value);
        const vEl = document.getElementById('v-body-cross-section-pos');
        if (vEl) vEl.textContent = e.target.value;
        requestBodyUpdate();
    });

    // ── Phase 9: アシスト機能 ──────────────────
    // 1. Weight & material estimate
    const matSel = document.getElementById('body-assist-material');
    if (matSel) {
        matSel.value = state.assistMaterial;
        matSel.addEventListener('change', () => { state.assistMaterial = matSel.value; });
    }
    document.getElementById('body-assist-weight-btn')?.addEventListener('click', () => {
        const presets = bodyMaterialPresets();
        const mat = presets.find(p => p.id === state.assistMaterial) || presets[0];
        const volCm3 = estimateBodyVolume();
        const weightG = volCm3 * mat.density;
        const costUSD = (weightG / 1000) * mat.pricePerKg;
        bodyAssistShowResult(
            '<b>重量・コスト推定 / Weight &amp; Cost</b><br>' +
            '材料 / Material: ' + mat.name + '<br>' +
            '体積 / Volume: ' + volCm3.toFixed(1) + ' cm³<br>' +
            '密度 / Density: ' + mat.density.toFixed(2) + ' g/cm³<br>' +
            '推定重量 / Est. Weight: <b>' + weightG.toFixed(1) + ' g</b><br>' +
            '推定コスト / Est. Cost: <b>$' + costUSD.toFixed(2) + '</b> (@$' + mat.pricePerKg + '/kg)'
        );
    });

    // 2. Screw post auto-placement
    document.getElementById('body-assist-screwpost-btn')?.addEventListener('click', () => {
        const positions = suggestScrewPostPositions();
        let html = '<b>ネジ柱推奨位置 / Suggested Screw Posts</b> (' + positions.length + ' 箇所)<br>';
        html += '<table style="width:100%; font-size:0.7rem; margin-top:4px; border-collapse:collapse;">';
        html += '<tr style="color:#888;"><th style="text-align:left;">#</th><th style="text-align:right;">X (mm)</th><th style="text-align:right;">Z (mm)</th></tr>';
        positions.forEach((p, i) => {
            html += '<tr><td>' + (i + 1) + '</td><td style="text-align:right;">' + p.x.toFixed(1) + '</td><td style="text-align:right;">' + p.z.toFixed(1) + '</td></tr>';
        });
        html += '</table>';
        bodyAssistShowResult(html);
    });

    // 3. Insert (heat-set) guide
    const insSel = document.getElementById('body-assist-insert');
    if (insSel) {
        insSel.value = state.assistInsertSize;
        insSel.addEventListener('change', () => { state.assistInsertSize = insSel.value; });
    }
    document.getElementById('body-assist-insert-btn')?.addEventListener('click', () => {
        const g = INSERT_GUIDE[state.assistInsertSize] || INSERT_GUIDE.m3;
        const html =
            '<b>インサート寸法 / Heat-set Insert</b><br>' +
            'サイズ / Size: <b>' + g.name + '</b><br>' +
            '穴径 / Hole Diameter: <b>' + g.hole.toFixed(1) + ' mm</b><br>' +
            '深さ / Pocket Depth: <b>' + g.depth.toFixed(1) + ' mm</b><br>' +
            'クリアランス / Clearance: ' + g.clearance.toFixed(2) + ' mm';
        bodyAssistShowResult(html);
        if (typeof showToast === 'function') showToast(g.name + ': φ' + g.hole + 'mm × ' + g.depth + 'mm');
    });

    // 4. Gasket compression simulator
    const gThick = document.getElementById('body-assist-gasket-thickness');
    const gHard = document.getElementById('body-assist-gasket-hardness');
    const gCompr = document.getElementById('body-assist-gasket-compression');
    if (gThick) {
        gThick.value = state.assistGasketThickness;
        gThick.addEventListener('input', () => { state.assistGasketThickness = parseFloat(gThick.value) || 2.5; });
    }
    if (gHard) {
        gHard.value = state.assistGasketHardness;
        gHard.addEventListener('input', () => { state.assistGasketHardness = parseFloat(gHard.value) || 50; });
    }
    if (gCompr) {
        gCompr.value = state.assistGasketCompression;
        gCompr.addEventListener('input', () => { state.assistGasketCompression = parseFloat(gCompr.value) || 20; });
    }
    document.getElementById('body-assist-gasket-btn')?.addEventListener('click', () => {
        const t = state.assistGasketThickness || 2.5;
        const c = state.assistGasketCompression || 20;
        const h = state.assistGasketHardness || 50;
        const recommendedH = state.bezelTop + state.bezelBottom - t * (1 - c / 100);
        const compressedT = t * (1 - c / 100);
        bodyAssistShowResult(
            '<b>ガスケット圧縮 / Gasket Compression</b><br>' +
            '厚み / Thickness: ' + t.toFixed(2) + ' mm<br>' +
            '硬度 / Hardness: Shore A ' + h + '<br>' +
            '圧縮率 / Compression: ' + c + '%<br>' +
            '圧縮後厚み / Compressed Thickness: ' + compressedT.toFixed(2) + ' mm<br>' +
            '推奨内部高さ / Recommended Internal Height: <b>' + recommendedH.toFixed(2) + ' mm</b>'
        );
    });

    // 5. Acoustic tuning preset
    const acSel = document.getElementById('body-assist-acoustic');
    if (acSel) {
        acSel.value = state.assistAcousticPreset;
        acSel.addEventListener('change', () => { state.assistAcousticPreset = acSel.value; });
    }
    document.getElementById('body-assist-acoustic-btn')?.addEventListener('click', () => {
        const preset = ACOUSTIC_PRESETS[state.assistAcousticPreset] || ACOUSTIC_PRESETS.firm;
        Object.assign(state, preset);
        if (typeof bodySyncUI === 'function') bodySyncUI();
        requestBodyUpdate();
        bodyCommitHistory();
        bodyAssistShowResult(
            '<b>音響プリセット適用 / Acoustic Preset</b>: ' + state.assistAcousticPreset + '<br>' +
            'wallThickness: ' + preset.wallThickness + ' mm<br>' +
            'pcbClearance: ' + preset.pcbClearance + ' mm<br>' +
            'bottomThickness: ' + preset.bottomThickness + ' mm<br>' +
            'ribs: ' + (preset.ribs ? 'ON' : 'OFF')
        );
        if (typeof showToast === 'function') showToast('Acoustic preset: ' + state.assistAcousticPreset);
    });

    // 6. USB port template
    document.getElementById('body-assist-usb-btn')?.addEventListener('click', () => {
        const t = USB_PORT_TEMPLATES[state.usbType] || USB_PORT_TEMPLATES['usb-c'];
        let dimStr;
        if (state.usbType === 'trrs') {
            dimStr = 'φ' + t.w.toFixed(1) + ' mm';
        } else {
            dimStr = t.w.toFixed(1) + ' × ' + t.h.toFixed(1) + ' mm';
        }
        bodyAssistShowResult(
            '<b>USBポート / USB Port Template</b><br>' +
            '選択中 / Selected: <b>' + t.name + '</b><br>' +
            '開口寸法 / Cutout: ' + dimStr + '<br>' +
            'ポートマージン / Margin: ' + (state.portMargin || 0.5).toFixed(2) + ' mm'
        );
    });

    // 7. Tilt angle verification
    document.getElementById('body-assist-tilt-btn')?.addEventListener('click', () => {
        const g = computeTiltGeometry();
        bodyAssistShowResult(
            '<b>タイピング角度検証 / Typing Angle Verification</b><br>' +
            '入力角度 / Input Angle: <b>' + g.angle.toFixed(1) + '°</b><br>' +
            '前縁高さ / Front Height: ' + g.frontH.toFixed(1) + ' mm<br>' +
            '後縁高さ / Rear Height: <b>' + g.rearH.toFixed(1) + ' mm</b><br>' +
            '実効タイピング角度 / Effective Typing Angle: ' + g.typingAngle.toFixed(1) + '°'
        );
    });

    // Phase 11: 分割ケース設計 — ベッドサイズに収まるかチェック + 推奨分割数提示
    document.getElementById('body-split-check-btn')?.addEventListener('click', () => {
        const sel = document.getElementById('body-split-printer');
        const key = sel ? sel.value : 'bambu-x1';
        const r = checkSplitCase(key);
        const isJa = (typeof currentLang !== 'undefined' && currentLang === 'ja');
        let html = `<div style="font-weight:bold; margin-bottom:6px;">${r.bed.name} (${r.bed.w}×${r.bed.d}×${r.bed.h}mm)</div>`;
        html += `<div style="margin-bottom:4px;">推定外寸: <strong>${r.totalW.toFixed(0)} × ${r.totalD.toFixed(0)} × ${r.totalH.toFixed(0)} mm</strong></div>`;
        if (r.fits) {
            html += `<div style="color:#69f0ae;">✅ ${isJa ? '一体出力可能' : 'Single piece OK'}</div>`;
        } else {
            const ng = [];
            if (!r.fitsW) ng.push(`W (${r.totalW.toFixed(0)} > ${r.bed.w})`);
            if (!r.fitsD) ng.push(`D (${r.totalD.toFixed(0)} > ${r.bed.d})`);
            if (!r.fitsH) ng.push(`H (${r.totalH.toFixed(0)} > ${r.bed.h})`);
            html += `<div style="color:#ff5252; margin-bottom:6px;">❌ ${isJa ? 'ベッドサイズ超過' : 'Exceeds bed'}: ${ng.join(' / ')}</div>`;
            if (r.splitSuggestion) {
                const s = r.splitSuggestion;
                html += `<div style="padding:6px; background:rgba(255,183,77,0.08); border-left:3px solid #ffb74d; border-radius:3px;">`;
                html += `<div style="font-weight:bold; color:#ffb74d;">${isJa ? '推奨分割' : 'Recommended split'}: ${s.partsW} × ${s.partsD} = ${s.totalParts} ${isJa ? 'パーツ' : 'parts'}</div>`;
                html += `<div style="font-size:0.7rem; color:#ccc; margin-top:4px;">${isJa ? '1パーツあたり' : 'per part'}: ${s.partW} × ${s.partD} mm</div>`;
                html += `<div style="font-size:0.7rem; color:#ccc;">${isJa ? '推奨ジョイント' : 'Suggested joint'}: ${s.joinerType}</div>`;
                html += `<div style="font-size:0.66rem; color:#888; margin-top:4px;">※ 実際の分割ジオメトリ生成は Phase 12+。現状は判定のみ。</div>`;
                html += `</div>`;
            }
        }
        bodyAssistShowResult(html);
    });

    // 8. Variation generator
    document.querySelectorAll('.body-assist-var-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.variation;
            const preset = VARIATION_PRESETS[key];
            if (!preset) return;
            Object.assign(state, preset);
            state.assistVariationApplied = key;
            if (typeof bodySyncUI === 'function') bodySyncUI();
            requestBodyUpdate();
            bodyCommitHistory();
            const lines = Object.entries(preset).map(([k, v]) => k + ': ' + v).join('<br>');
            bodyAssistShowResult(
                '<b>バリエーション適用 / Variation</b>: ' + key + '<br>' + lines
            );
            if (typeof showToast === 'function') showToast('Variation: ' + key);
        });
    });
}

// ── Font Custom Dropdown (with hover preview) ─────────────
const bodyFontDropdowns = {};  // { prefix: { committed, head, list, uiContainer, stateProp } }

function setupBodyFontDropdown(prefix, stateProp) {
    const head = document.getElementById(prefix + '-head');
    const list = document.getElementById(prefix + '-list');
    const ui   = document.getElementById(prefix + '-ui');
    if (!head || !list || !ui || !loadedFontData) return;

    let committed = state[stateProp];
    bodyFontDropdowns[prefix] = { committed, head, list, ui, stateProp };

    function populate() {
        list.innerHTML = '';
        const currentVal = state[stateProp];
        for (const key of Object.keys(loadedFontData)) {
            const div = document.createElement('div');
            div.className = 'custom-option';
            div.textContent = key.replace(/_/g, ' ').replace(/^custom /, '');
            if (key === currentVal) div.classList.add('selected');

            div.addEventListener('mouseenter', () => {
                state[stateProp] = key;
                requestBodyUpdate();
            });

            div.addEventListener('click', () => {
                committed = key;
                bodyFontDropdowns[prefix].committed = key;
                state[stateProp] = key;
                list.classList.remove('open');
                head.textContent = key.replace(/_/g, ' ').replace(/^custom /, '') + ' ▼';
                bodyCommitHistory();
                requestBodyUpdate();
            });

            list.appendChild(div);
        }
    }

    head.addEventListener('click', () => {
        if (!list.classList.contains('open')) {
            committed = state[stateProp];
            bodyFontDropdowns[prefix].committed = committed;
            populate();
            list.classList.add('open');
        } else {
            list.classList.remove('open');
        }
    });

    list.addEventListener('mouseleave', () => {
        state[stateProp] = bodyFontDropdowns[prefix].committed;
        requestBodyUpdate();
    });

    document.addEventListener('click', (e) => {
        if (!ui.contains(e.target) && list.classList.contains('open')) {
            list.classList.remove('open');
            state[stateProp] = bodyFontDropdowns[prefix].committed;
            requestBodyUpdate();
        }
    });

    // 初期ヘッダー設定
    const label = (state[stateProp] || 'helvetiker').replace(/_/g, ' ').replace(/^custom /, '');
    head.textContent = label + ' ▼';
}

function populateBodyFontSelects() {
    if (!loadedFontData) return;
    setupBodyFontDropdown('body-top-text-font', 'topTextFont');
    setupBodyFontDropdown('body-top-side-font', 'topSideFont');
    setupBodyFontDropdown('body-bottom-text-font', 'bottomTextFont');
    setupBodyFontDropdown('body-bottom-side-font', 'bottomSideFont');

    // ── SVG アイコン バインディング ──
    document.getElementById('body-enable-svg')?.addEventListener('change', (e) => {
        state.enableSvg = e.target.checked;
        requestBodyUpdate();
        bodyCommitHistory();
    });

    // SVG スライダー
    const svgSliderMap = {
        'body-svg-scale': { prop: 'svgScale', vid: 'v-body-svg-scale' },
        'body-svg-thickness': { prop: 'svgThickness', vid: 'v-body-svg-thickness' },
        'body-svg-pos-x': { prop: 'svgPosX', vid: 'v-body-svg-pos-x' },
        'body-svg-pos-z': { prop: 'svgPosZ', vid: 'v-body-svg-pos-z' },
        'body-svg-rot-z': { prop: 'svgRotZ', vid: 'v-body-svg-rot-z' },
        'body-svg-icon-scale': { prop: 'svgScale', vid: 'v-body-svg-icon-scale' },
    };
    for (const [id, cfg] of Object.entries(svgSliderMap)) {
        const el = document.getElementById(id);
        if (!el) continue;
        el.addEventListener('input', () => {
            const val = parseFloat(el.value);
            state[cfg.prop] = val;
            const v = document.getElementById(cfg.vid);
            if (v) v.textContent = val;
            // icon-scale と main scale を相互同期
            if (id === 'body-svg-icon-scale') {
                const ms = document.getElementById('body-svg-scale');
                const mv = document.getElementById('v-body-svg-scale');
                if (ms) ms.value = val;
                if (mv) mv.textContent = val;
            } else if (id === 'body-svg-scale') {
                const is = document.getElementById('body-svg-icon-scale');
                const iv = document.getElementById('v-body-svg-icon-scale');
                if (is) is.value = val;
                if (iv) iv.textContent = val;
            }
            requestBodyUpdate();
        });
        el.addEventListener('change', () => bodyCommitHistory());
    }

    // 配置面セレクト
    document.getElementById('body-svg-target-face')?.addEventListener('change', (e) => {
        state.svgTarget = e.target.value;
        requestBodyUpdate();
        bodyCommitHistory();
    });

    // ファイルアップロード
    document.getElementById('body-svg-upload-btn')?.addEventListener('click', () => {
        document.getElementById('body-svg-file-input')?.click();
    });
    document.getElementById('body-svg-file-input')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            state.svgContent = ev.target.result;
            state.svgName = file.name.replace(/\.svg$/i, '');
            state.enableSvg = true;
            const cb = document.getElementById('body-enable-svg');
            if (cb) cb.checked = true;
            // viewBox からスケール自動調整
            autoScaleBodySvg(ev.target.result);
            requestBodyUpdate();
            bodyCommitHistory();
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // 選択解除
    document.getElementById('body-svg-clear')?.addEventListener('click', () => {
        state.svgContent = null;
        state.svgName = null;
        state.enableSvg = false;
        const cb = document.getElementById('body-enable-svg');
        if (cb) cb.checked = false;
        // グリッドの選択状態クリア
        document.querySelectorAll('#body-svg-icon-grid .stock-icon-btn').forEach(b => b.classList.remove('selected'));
        requestBodyUpdate();
        bodyCommitHistory();
    });

    // ストックアイコン初期化（遅延）
    // ストックアイコン初期化（keycap のアイコンデータ読み込み後に実行されるよう遅延）
    setTimeout(() => {
        initBodySvgCategoryDropdown();
        renderBodyStockIcons('all');
    }, 1000);
}

// ── AMS Palette (ドロップダウン統合) ────────────────────────────
function renderBodyAMSPalette() {
    const amsConfig = window.amsConfig;
    const palettes = [
        { colorKey: 'topCaseColor', extruderKey: 'topCaseExtruder', labelColor: '#00e5ff' },
        { colorKey: 'bottomCaseColor', extruderKey: 'bottomCaseExtruder', labelColor: '#ff9800' },
        { colorKey: 'plateColor', extruderKey: 'plateExtruder', labelColor: '#4caf50' },
        { colorKey: 'rubberPadColor', extruderKey: 'rubberPadExtruder', labelColor: '#aaa' },
        { colorKey: 'feetColor', extruderKey: 'feetExtruder', labelColor: '#bbb' },
        { colorKey: 'textColor', extruderKey: 'textExtruder', labelColor: '#e040fb' },
    ];

    const select = document.getElementById('body-palette-target-select');
    const container = document.getElementById('body-unified-ams-palette');
    if (!container) return;

    const selectedIdx = select ? parseInt(select.value, 10) : 0;
    const cfg = palettes[selectedIdx] || palettes[0];

    // ドロップダウンのボーダー色を更新
    if (select) {
        select.style.borderColor = cfg.labelColor;
        select.style.color = cfg.labelColor;
    }

    container.innerHTML = '';

    const allSlots = [];
    if (amsConfig) {
        (amsConfig.units || []).forEach(unit => { (unit.slots || []).forEach(s => allSlots.push(s)); });
        (amsConfig.htUnits || []).forEach(unit => { (unit.slots || []).forEach(s => allSlots.push(s)); });
    }

    if (!amsConfig || allSlots.length === 0) {
        container.innerHTML = '<div style="color:#666; font-size:0.7rem; padding:5px;">AMS設定で色を登録</div>';
        return;
    }

    let hasSlots = false;
    allSlots.forEach((slotData, idx) => {
        if (!slotData || !slotData.color) return;
        hasSlots = true;
        const item = document.createElement('div');
        item.className = 'ams-select-item';
        item.style.cssText = 'width:48px; height:52px; padding:3px; cursor:pointer;';
        item.dataset.slot = idx + 1;
        item.dataset.color = slotData.color;

        if (state[cfg.extruderKey] === idx + 1) {
            item.classList.add('body-selected');
        }

        const material = slotData.material || '';
        item.innerHTML = `
            <span class="ams-select-item-num" style="font-size:0.6rem;">${idx + 1}</span>
            <div class="ams-select-item-color" style="width:24px; height:24px; background:${slotData.color}"></div>
            <div class="ams-select-item-material" style="font-size:0.5rem; max-width:44px;">${material}</div>
        `;

        item.onclick = () => {
            state[cfg.colorKey] = slotData.color;
            state[cfg.extruderKey] = idx + 1;
            updateModel();
            bodyCommitHistory();
            renderBodyAMSPalette();
            setTimeout(() => { if (typeof window.refreshActiveGalleryThumbnail === 'function') window.refreshActiveGalleryThumbnail(); }, 200);
        };

        container.appendChild(item);
    });

    if (!hasSlots) {
        container.innerHTML = '<div style="color:#666; font-size:0.7rem; padding:5px;">AMS設定で色を登録</div>';
    }
}

// ── Export Dialog ───────────────────────────
async function showBodyExportDialog() {
    if (!sceneGroup) return;

    const lang = typeof currentLang === 'function' ? currentLang() : currentLang;

    // エクスポート用extruder値（ダイアログ内で変更可能）
    const exportExtruders = {
        body: state.topCaseExtruder || 1,
        bottom: state.bottomCaseExtruder || 1,
        plate: state.plateExtruder || 1,
        bottom_feet: state.feetExtruder || 1,
        bottom_pads: state.rubberPadExtruder || 1,
    };

    // 既存のオーバーレイを削除して再作成（状態リセット）
    let overlay = document.getElementById('body-export-overlay');
    if (overlay) overlay.remove();

    {
        overlay = document.createElement('div');
        overlay.id = 'body-export-overlay';
        overlay.className = 'export-popup-overlay';
        overlay.style.display = 'none';
        overlay.innerHTML = `
        <div class="export-popup" id="body-export-popup" style="min-width:min(500px, 95vw); max-width:min(600px, 95vw);">
            <div class="export-popup-header">
                <h3 class="export-popup-title">ボディエクスポート</h3>
                <span class="export-popup-format" id="body-export-format-badge">3MF</span>
            </div>

            <!-- 3Dプレビュー -->
            <div style="background:#0a0a15; border-radius:8px; padding:10px; margin-bottom:15px;">
                <div id="body-export-3d-preview" style="width:100%; height:200px; border-radius:6px; overflow:hidden; background:#111;"></div>
            </div>

            <!-- パーツ選択 -->
            <div style="margin-bottom:15px;">
                <label style="color:#888; font-size:0.75rem; display:block; margin-bottom:8px;">エクスポートするパーツ</label>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <label style="display:flex; align-items:center; gap:6px; background:rgba(0,229,255,0.1); padding:8px 14px; border-radius:6px; cursor:pointer; border:1px solid #444; transition:all 0.2s;">
                        <input type="checkbox" name="body-export-part" value="body" checked style="accent-color:#00e5ff;"> <span style="color:#00e5ff; font-size:0.85rem;">トップケース</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:6px; background:rgba(255,152,0,0.1); padding:8px 14px; border-radius:6px; cursor:pointer; border:1px solid #444; transition:all 0.2s;">
                        <input type="checkbox" name="body-export-part" value="bottom" checked style="accent-color:#ff9800;"> <span style="color:#ff9800; font-size:0.85rem;">ボトムケース</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:6px; background:rgba(76,175,80,0.1); padding:8px 14px; border-radius:6px; cursor:pointer; border:1px solid #444; transition:all 0.2s;">
                        <input type="checkbox" name="body-export-part" value="plate" checked style="accent-color:#4caf50;"> <span style="color:#4caf50; font-size:0.85rem;">プレート</span>
                    </label>
                </div>
            </div>

            <!-- フォーマット選択 -->
            <div style="margin-bottom:15px;">
                <label style="color:#888; font-size:0.75rem; display:block; margin-bottom:8px;">出力形式</label>
                <div style="display:flex; gap:10px;">
                    <label class="batch-format-option" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; background:rgba(76,175,80,0.1); padding:12px; border-radius:8px; cursor:pointer; border:2px solid transparent; transition:all 0.2s;">
                        <input type="radio" name="body-export-format" value="3mf" checked style="accent-color:#4caf50;"> <span style="color:#4caf50; font-weight:bold;">3MF</span>
                    </label>
                    <label class="batch-format-option" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; background:rgba(79,195,247,0.1); padding:12px; border-radius:8px; cursor:pointer; border:2px solid transparent; transition:all 0.2s;">
                        <input type="radio" name="body-export-format" value="stl" style="accent-color:#4fc3f7;"> <span style="color:#4fc3f7; font-weight:bold;">STL</span>
                    </label>
                </div>
            </div>

            <!-- AMS色割当 -->
            <div id="body-export-ams-section" style="margin-bottom:15px; border:1px solid #333; border-radius:8px; padding:12px; background:rgba(0,0,0,0.2);">
                <label style="color:#888; font-size:0.75rem; display:block; margin-bottom:8px;">フィラメント割当（3MFのみ）</label>
                <div style="max-height:240px; overflow-y:auto; padding-right:4px;">
                    <div style="margin-bottom:8px;">
                        <label style="color:#00e5ff; font-size:0.75rem; font-weight:bold;">トップケース</label>
                        <div id="body-export-top-palette" class="ams-select-palette" style="margin-top:4px;"></div>
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="color:#ff9800; font-size:0.75rem; font-weight:bold;">ボトムケース</label>
                        <div id="body-export-bottom-palette" class="ams-select-palette" style="margin-top:4px;"></div>
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="color:#4caf50; font-size:0.75rem; font-weight:bold;">プレート</label>
                        <div id="body-export-plate-palette" class="ams-select-palette" style="margin-top:4px;"></div>
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="color:#78909c; font-size:0.75rem; font-weight:bold;">ゴム足</label>
                        <div id="body-export-pads-palette" class="ams-select-palette" style="margin-top:4px;"></div>
                    </div>
                    <div style="margin-bottom:0;">
                        <label style="color:#8d6e63; font-size:0.75rem; font-weight:bold;">角度調節足</label>
                        <div id="body-export-feet-palette" class="ams-select-palette" style="margin-top:4px;"></div>
                    </div>
                </div>
            </div>

            <!-- ボタン -->
            <div class="export-popup-buttons" style="position:relative;">
                <span style="flex:1;"></span>
                <span id="body-export-bridge-indicator" class="export-bridge-status" style="display:none;"></span>
                <button class="export-popup-btn cancel" id="body-export-cancel-btn">キャンセル</button>
                <div class="export-split-wrap" id="body-export-split-wrap">
                    <button class="export-popup-btn confirm" id="body-export-confirm-btn">エクスポート</button>
                    <button class="export-split-toggle" id="body-export-split-toggle" style="display:none;">▲</button>
                </div>
                <div class="export-split-dropdown" id="body-export-split-dropdown"></div>
            </div>
        </div>`;
        document.body.appendChild(overlay);
    }

    const popup = document.getElementById('body-export-popup');
    const confirmBtn = document.getElementById('body-export-confirm-btn');
    const cancelBtn = document.getElementById('body-export-cancel-btn');
    const formatBadge = document.getElementById('body-export-format-badge');
    const previewEl = document.getElementById('body-export-3d-preview');

    // 3Dプレビュー
    let thumbRenderer, thumbScene, thumbCam;

    function createPreview() {
        if (thumbRenderer) { thumbRenderer.dispose(); previewEl.innerHTML = ''; }
        const w = previewEl.clientWidth || 460;
        const h = 200;
        thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        thumbRenderer.setSize(w, h);
        thumbRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        previewEl.appendChild(thumbRenderer.domElement);

        thumbScene = new THREE.Scene();
        thumbScene.background = new THREE.Color(0x111111);
        thumbCam = new THREE.PerspectiveCamera(35, w / h, 0.1, 1000);

        thumbScene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(5, 10, 7);
        thumbScene.add(dir);

        const previewGroup = new THREE.Group();
        thumbScene.add(previewGroup);

        // 選択パーツに基づいてメッシュを追加
        const selectedParts = new Set();
        document.querySelectorAll('input[name="body-export-part"]:checked').forEach(cb => selectedParts.add(cb.value));

        if (sceneGroup) {
            sceneGroup.children.forEach(child => {
                if (!child.userData || !child.userData.part) return;
                const part = child.userData.part;
                // テキストパーツはbody選択時に含める
                const show = selectedParts.has(part) ||
                             (part === 'text' && selectedParts.has('body'));
                if (show) {
                    const clone = child.clone();
                    if (child.isMesh && child.material) {
                        clone.material = child.material.clone();
                    }
                    previewGroup.add(clone);
                }
            });
        }

        // 中央配置
        const box = new THREE.Box3().setFromObject(previewGroup);
        if (!box.isEmpty()) {
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            previewGroup.position.sub(center);
            const maxDim = Math.max(size.x, size.y, size.z);
            thumbCam.position.set(maxDim * 0.8, maxDim * 0.6, maxDim * 0.9);
            thumbCam.lookAt(0, 0, 0);
        }

        thumbRenderer.render(thumbScene, thumbCam);
    }

    function updatePreviewColors() {
        if (!thumbScene) return;
        const previewGroup = thumbScene.children.find(c => c.isGroup);
        if (!previewGroup) return;
        previewGroup.traverse(child => {
            if (!child.isMesh || !child.userData) return;
            const part = child.userData.part;
            const subPart = child.userData.subPart;
            let color = null;
            if (part === 'body')   color = state.topCaseColor;
            if (part === 'bottom' && subPart === 'structure') color = state.bottomCaseColor;
            if (part === 'bottom' && subPart === 'pads')      color = state.rubberPadColor;
            if (part === 'bottom' && subPart === 'feet')      color = state.feetColor;
            if (part === 'bottom' && !subPart)                color = state.bottomCaseColor;
            if (part === 'plate')  color = state.plateColor;
            if (part === 'text')   color = state.textColor;
            if (color && child.material) {
                child.material.color.set(color);
            }
        });
        if (thumbRenderer && thumbCam) thumbRenderer.render(thumbScene, thumbCam);
    }

    // パーツチェック変更時にプレビュー更新
    document.querySelectorAll('input[name="body-export-part"]').forEach(cb => {
        cb.onchange = () => createPreview();
    });

    // フォーマットバッジ更新
    const formatInputs = document.querySelectorAll('input[name="body-export-format"]');
    const updateBadge = () => {
        const sel = document.querySelector('input[name="body-export-format"]:checked');
        if (sel) {
            const fmt = sel.value.toUpperCase();
            formatBadge.textContent = fmt;
            formatBadge.style.background = fmt === '3MF' ? '#4caf50' : '#4fc3f7';
        }
    };
    updateBadge();

    // スライサーブリッジ スプリットボタン
    function setupBodySplitButton() {
        const toggle = document.getElementById('body-export-split-toggle');
        const dropdown = document.getElementById('body-export-split-dropdown');
        const indicator = document.getElementById('body-export-bridge-indicator');
        if (!toggle || !dropdown || !confirmBtn) return;

        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
        if (isMobile) { toggle.style.display = 'none'; dropdown.innerHTML = ''; confirmBtn.dataset.slicerTarget = ''; if (indicator) indicator.style.display = 'none'; return; }

        const bridge = typeof window.getSlicerBridgeInfo === 'function' ? window.getSlicerBridgeInfo() : { connected: false };
        const hasSlicer = bridge.connected && (bridge.bambu || bridge.orca);
        const t = (window.translations && window.translations[lang]) || {};
        const openLabel = (name) => (t.slicer_open_label || '{name} で開く').replace('{name}', name);

        function setSlicerColor(target) {
            confirmBtn.classList.remove('slicer-bambu', 'slicer-orca');
            toggle.classList.remove('slicer-bambu', 'slicer-orca');
            if (target === 'bambu') { confirmBtn.classList.add('slicer-bambu'); toggle.classList.add('slicer-bambu'); }
            else if (target === 'orca') { confirmBtn.classList.add('slicer-orca'); toggle.classList.add('slicer-orca'); }
        }

        dropdown.innerHTML = '';
        dropdown.classList.remove('show');
        setSlicerColor('');

        if (indicator) {
            if (bridge.connected) {
                indicator.innerHTML = `<span class="export-bridge-dot ok"></span> Slicer Bridge ${t.slicer_connected || '接続済み'}`;
                indicator.style.display = 'flex';
            } else {
                indicator.style.display = 'none';
            }
        }

        const fmt = document.querySelector('input[name="body-export-format"]:checked')?.value;
        if (!hasSlicer || fmt !== '3mf') {
            toggle.style.display = 'none';
            confirmBtn.textContent = t.popup_export || 'エクスポート';
            confirmBtn.dataset.slicerTarget = '';
            return;
        }

        const primarySlicer = bridge.bambu ? 'bambu' : 'orca';
        const primaryName = primarySlicer === 'bambu' ? 'Bambu Studio' : 'OrcaSlicer';
        confirmBtn.textContent = openLabel(primaryName);
        confirmBtn.dataset.slicerTarget = primarySlicer;
        setSlicerColor(primarySlicer);
        toggle.style.display = 'flex';

        let items = '';
        items += `<button class="export-split-item" data-target="download"><span><span class="split-label">${t.popup_export || 'エクスポート'}</span><br><span class="split-sub">${t.slicer_download_desc || 'ファイルをダウンロード'}</span></span></button>`;
        items += '<div class="export-split-separator"></div>';
        if (bridge.bambu) items += `<button class="export-split-item" data-target="bambu"><span><span class="split-label">${openLabel('Bambu Studio')}</span></span></button>`;
        if (bridge.orca) items += `<button class="export-split-item" data-target="orca"><span><span class="split-label">${openLabel('OrcaSlicer')}</span></span></button>`;
        dropdown.innerHTML = items;

        toggle.onclick = (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); };
        dropdown.querySelectorAll('.export-split-item').forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                const target = item.dataset.target;
                if (target === 'download') {
                    confirmBtn.textContent = t.popup_export || 'エクスポート';
                    confirmBtn.dataset.slicerTarget = '';
                    setSlicerColor('');
                } else {
                    confirmBtn.textContent = openLabel(target === 'bambu' ? 'Bambu Studio' : 'OrcaSlicer');
                    confirmBtn.dataset.slicerTarget = target;
                    setSlicerColor(target);
                }
                dropdown.classList.remove('show');
            };
        });
    }
    setupBodySplitButton();

    // AMS色割当パレットを描画
    function renderExportAMSPalettes() {
        const amsConfig = window.amsConfig;
        const amsSection = document.getElementById('body-export-ams-section');
        const fmt = document.querySelector('input[name="body-export-format"]:checked')?.value;
        if (amsSection) amsSection.style.display = fmt === '3mf' ? 'block' : 'none';

        const paletteConfigs = [
            { id: 'body-export-top-palette', partKey: 'body', colorKey: 'topCaseColor', selectedClass: 'body-selected' },
            { id: 'body-export-bottom-palette', partKey: 'bottom', colorKey: 'bottomCaseColor', selectedClass: 'text-selected' },
            { id: 'body-export-plate-palette', partKey: 'plate', colorKey: 'plateColor', selectedClass: 'body-selected' },
            { id: 'body-export-pads-palette', partKey: 'bottom_pads', colorKey: 'rubberPadColor', selectedClass: 'body-selected' },
            { id: 'body-export-feet-palette', partKey: 'bottom_feet', colorKey: 'feetColor', selectedClass: 'body-selected' },
        ];

        const allSlots = [];
        if (amsConfig) {
            (amsConfig.units || []).forEach(u => { (u.slots || []).forEach(s => allSlots.push(s)); });
            (amsConfig.htUnits || []).forEach(u => { (u.slots || []).forEach(s => allSlots.push(s)); });
        }

        paletteConfigs.forEach(cfg => {
            const container = document.getElementById(cfg.id);
            if (!container) return;
            container.innerHTML = '';

            if (!amsConfig || allSlots.length === 0) {
                container.innerHTML = '<div style="color:#666; font-size:0.7rem; padding:5px;">AMS設定で色を登録</div>';
                return;
            }

            let hasSlots = false;
            allSlots.forEach((slotData, idx) => {
                if (!slotData || !slotData.color) return;
                hasSlots = true;
                const item = document.createElement('div');
                item.className = 'ams-select-item';
                item.style.cssText = 'width:44px; height:48px; padding:2px; cursor:pointer;';
                item.dataset.slot = idx + 1;

                if (exportExtruders[cfg.partKey] === idx + 1) {
                    item.classList.add(cfg.selectedClass);
                }

                item.innerHTML = `
                    <span class="ams-select-item-num" style="font-size:0.55rem;">${idx + 1}</span>
                    <div class="ams-select-item-color" style="width:22px; height:22px; background:${slotData.color}"></div>
                    <div class="ams-select-item-material" style="font-size:0.45rem; max-width:40px;">${slotData.material || ''}</div>
                `;

                item.onclick = () => {
                    exportExtruders[cfg.partKey] = idx + 1;
                    if (cfg.colorKey) state[cfg.colorKey] = slotData.color;
                    renderExportAMSPalettes();
                    updatePreviewColors();
                };

                container.appendChild(item);
            });

            if (!hasSlots) {
                container.innerHTML = '<div style="color:#666; font-size:0.7rem; padding:5px;">AMS設定で色を登録</div>';
            }
        });
    }
    renderExportAMSPalettes();

    // フォーマット切替時にバッジ・スライサーボタン・AMSセクション更新
    formatInputs.forEach(r => {
        r.onchange = () => { updateBadge(); setupBodySplitButton(); renderExportAMSPalettes(); };
    });

    // ポップアップ表示（プレビュー生成前に表示してclientWidth取得を可能に）
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
        overlay.style.background = 'rgba(0,0,0,0.7)';
        popup.classList.add('show');
    });

    try { createPreview(); } catch (e) { console.warn('Export preview error:', e); }

    return new Promise(resolve => {
        const cleanup = () => {
            if (thumbRenderer) { thumbRenderer.dispose(); thumbRenderer = null; }
            previewEl.innerHTML = '';
            overlay.style.background = 'rgba(0,0,0,0)';
            popup.classList.remove('show');
            setTimeout(() => { overlay.style.display = 'none'; overlay.remove(); }, 300);
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
        };

        confirmBtn.onclick = async () => {
            const format = document.querySelector('input[name="body-export-format"]:checked')?.value || 'stl';
            const slicerTarget = confirmBtn.dataset.slicerTarget || '';
            const selectedParts = [];
            document.querySelectorAll('input[name="body-export-part"]:checked').forEach(cb => selectedParts.push(cb.value));
            cleanup();

            if (selectedParts.length === 0) {
                showToast(lang === 'ja' ? 'パーツを選択してください' : 'Select at least one part', true);
                return;
            }

            showToast(lang === 'ja' ? 'エクスポート中...' : 'Exporting...', false);

            try {
                const exp = new STLExporter();
                const prefix = `keyboard_${state.layout}`;

                // パーツ別にメッシュを収集するヘルパー
                function collectPartMeshes(partName, subPart) {
                    const group = new THREE.Group();
                    sceneGroup.children.forEach(child => {
                        if (child.userData && child.userData.part === partName) {
                            if (subPart && child.userData.subPart !== subPart) return;
                            if (child.isMesh) group.add(child.clone());
                            else if (child.isGroup) group.add(child.clone());
                        }
                    });
                    return group;
                }

                if (format === '3mf') {
                    // 3MF: 全パーツを1ファイルに統合
                    const partColorMap = {
                        body: state.topCaseColor || '#333333',
                        bottom: state.bottomCaseColor || '#333333',
                        bottom_feet: state.feetColor || '#666666',
                        bottom_pads: state.rubberPadColor || '#222222',
                        plate: state.plateColor || '#999999',
                        text: state.textColor || '#ffffff'
                    };
                    const partsData = [];
                    // テキストパーツがある場合、exportExtrudersにtext追加
                    const hasTextMesh = sceneGroup.children.some(c => c.userData?.part === 'text');
                    if (hasTextMesh) {
                        exportExtruders.text = state.textExtruder || 2;
                    }
                    for (const part of selectedParts) {
                        if (part === 'bottom') {
                            // ボトムケースは3ボディに分離: 構造体、角度調節足、ゴム足
                            const subParts = [
                                { subPart: 'structure', name: 'bottom', label: 'ボトムケース' },
                                { subPart: 'feet',      name: 'bottom_feet', label: '角度調節足' },
                                { subPart: 'pads',      name: 'bottom_pads', label: 'ゴム足' },
                            ];
                            for (const sp of subParts) {
                                const partGroup = collectPartMeshes('bottom', sp.subPart);
                                if (partGroup.children.length === 0) continue;
                                const extruder = exportExtruders[sp.name] || 1;
                                const repairedGeo = await repairBodyPartGeo(partGroup, sp.label);
                                partsData.push({
                                    partName: sp.name,
                                    geometry: repairedGeo || partGroup,
                                    extruder,
                                    isRepaired: !!repairedGeo,
                                    color: partColorMap[sp.name]
                                });
                            }
                        } else {
                            const partGroup = collectPartMeshes(part);
                            if (partGroup.children.length === 0) continue;
                            const extruder = exportExtruders[part] || 1;
                            const repairedGeo = await repairBodyPartGeo(partGroup, part);
                            partsData.push({
                                partName: part,
                                geometry: repairedGeo || partGroup,
                                extruder,
                                isRepaired: !!repairedGeo,
                                color: partColorMap[part]
                            });
                        }
                    }
                    // テキストパーツを追加（body選択時のみ）
                    if (hasTextMesh && selectedParts.includes('body')) {
                        const textGroup = collectPartMeshes('text');
                        if (textGroup.children.length > 0) {
                            const textGeo = await repairBodyPartGeo(textGroup, 'text');
                            partsData.push({
                                partName: 'text',
                                geometry: textGeo || textGroup,
                                extruder: exportExtruders.text || 2,
                                isRepaired: !!textGeo,
                                color: partColorMap.text
                            });
                        }
                    }
                    if (partsData.length > 0) {
                        const blob = await exportBodyPartsCombined3MF(partsData, prefix);
                        if (blob) {
                            const fileName = `${prefix}_body.3mf`;
                            if (slicerTarget) {
                                await window.sendBlobToSlicer(blob, fileName, slicerTarget);
                            } else {
                                saveAs(blob, fileName);
                            }
                        }
                    }
                } else {
                    // STL: パーツ別に出力
                    async function exportSTLPart(group, name) {
                        let repairedGeo = await repairBodyPartGeo(group, name);
                        if (repairedGeo) {
                            const mesh = new THREE.Mesh(repairedGeo, new THREE.MeshBasicMaterial());
                            const exportGroup = new THREE.Group();
                            exportGroup.add(mesh);
                            const res = exp.parse(exportGroup, { binary: true });
                            saveAs(new Blob([res], { type: 'application/octet-stream' }), `${prefix}_${name}.stl`);
                        } else {
                            const res = exp.parse(group, { binary: true });
                            saveAs(new Blob([res], { type: 'application/octet-stream' }), `${prefix}_${name}.stl`);
                        }
                        await new Promise(r => setTimeout(r, 300));
                    }
                    for (const part of selectedParts) {
                        if (part === 'bottom') {
                            // ボトムケースは3パーツに分離
                            const subParts = [
                                { subPart: 'structure', name: 'bottom' },
                                { subPart: 'feet',      name: 'bottom_feet' },
                                { subPart: 'pads',      name: 'bottom_pads' },
                            ];
                            for (const sp of subParts) {
                                const partGroup = collectPartMeshes('bottom', sp.subPart);
                                if (partGroup.children.length === 0) continue;
                                await exportSTLPart(partGroup, sp.name);
                            }
                        } else {
                            const partGroup = collectPartMeshes(part);
                            if (partGroup.children.length === 0) continue;
                            await exportSTLPart(partGroup, part);
                        }
                    }
                }

                showToast(lang === 'ja' ? 'エクスポート完了!' : 'Export complete!', false);
            } catch (e) {
                showToast('Export failed: ' + e.message, true);
            }
        };

        cancelBtn.onclick = () => { cleanup(); };
        overlay.onclick = (e) => { if (e.target === overlay) cleanup(); };
    });
}

// ── MeshFix Helper ──────────────────────
async function repairBodyPartGeo(partGroup, partName) {
    if (window._meshFixEnabled === false) {
        console.log(`[MeshFix] Body ${partName}: スキップ（修復OFF）`);
        return null;
    }
    if (!window.meshFixLib) {
        console.warn(`[MeshFix] Body ${partName}: meshFixLib が利用不可 — スキップ`);
        return null;
    }

    // 各子メッシュから頂点/三角形配列を直接収集
    const allVertices = [];   // [[x,y,z], ...]
    const allTriangles = [];  // [[i,j,k], ...]
    let vertexOffset = 0;
    let meshCount = 0;

    partGroup.traverse(child => {
        if (!child.isMesh || !child.geometry) return;
        const geo = child.geometry.clone();
        child.updateWorldMatrix(true, false);
        geo.applyMatrix4(child.matrixWorld);

        const pos = geo.attributes.position;
        if (!pos) return;

        for (let i = 0; i < pos.count; i++) {
            allVertices.push([pos.getX(i), pos.getY(i), pos.getZ(i)]);
        }

        const idx = geo.index;
        if (idx && idx.array) {
            for (let i = 0; i < idx.array.length; i += 3) {
                allTriangles.push([
                    idx.array[i] + vertexOffset,
                    idx.array[i + 1] + vertexOffset,
                    idx.array[i + 2] + vertexOffset
                ]);
            }
        } else {
            for (let i = 0; i < pos.count; i += 3) {
                allTriangles.push([
                    i + vertexOffset,
                    i + 1 + vertexOffset,
                    i + 2 + vertexOffset
                ]);
            }
        }
        vertexOffset += pos.count;
        meshCount++;
    });

    if (allVertices.length === 0 || allTriangles.length === 0) {
        console.warn(`[MeshFix] Body ${partName}: メッシュデータなし（meshCount=${meshCount}）`);
        return null;
    }

    // 事前頂点マージ: 複数メッシュの重複頂点を統合し、MeshFixLibのマニフォールドマージスキップを回避
    if (meshCount > 1) {
        const factor = 1e4; // 0.0001mm精度
        const map = new Map();
        const mergedVerts = [];
        const idxMap = new Array(allVertices.length);
        for (let i = 0; i < allVertices.length; i++) {
            const [x, y, z] = allVertices[i];
            const key = `${Math.round(x * factor)}_${Math.round(y * factor)}_${Math.round(z * factor)}`;
            if (map.has(key)) {
                idxMap[i] = map.get(key);
            } else {
                const ni = mergedVerts.length;
                map.set(key, ni);
                mergedVerts.push(allVertices[i]);
                idxMap[i] = ni;
            }
        }
        const mergedTris = [];
        for (const [a, b, c] of allTriangles) {
            const ma = idxMap[a], mb = idxMap[b], mc = idxMap[c];
            if (ma !== mb && mb !== mc && ma !== mc) mergedTris.push([ma, mb, mc]);
        }
        const removedVerts = allVertices.length - mergedVerts.length;
        if (removedVerts > 0) {
            console.log(`[MeshFix] Body ${partName}: 事前マージ - ${removedVerts}頂点統合, ${allTriangles.length - mergedTris.length}縮退除去`);
        }
        allVertices.length = 0;
        allTriangles.length = 0;
        allVertices.push(...mergedVerts);
        allTriangles.push(...mergedTris);
    }

    console.log(`[MeshFix] Body ${partName}: 修復前 - ${allVertices.length}頂点, ${allTriangles.length}三角形 (${meshCount}メッシュ)`);

    try {
        const result = await window.meshFixLib.repairMesh(allVertices, allTriangles, (status) => {
            console.log(`[MeshFix] Body ${partName}: ${status}`);
        });

        console.log(`[MeshFix] Body ${partName}: 修復後 - ${result.vertices.length}頂点, ${result.triangles.length}三角形`);
        console.log(`[MeshFix] Body ${partName}: 診断 - 水密=${result.diagnosis.isWatertight}, 境界=${result.diagnosis.boundary}, 非多様体=${result.diagnosis.nonManifold}`);

        // 修復済みデータをダミーのBufferGeometryに格納
        const dummyGeo = new THREE.BufferGeometry();
        dummyGeo._meshFixData = {
            vertices: result.vertices,
            triangles: result.triangles
        };
        return dummyGeo;
    } catch (e) {
        console.error(`[MeshFix] Body ${partName}: 修復失敗:`, e);
        return null;
    }
}

// ── 3MF Export Helper ──────────────────────
async function exportBodyPart3MF(geoOrGroup, partName, prefix, extruder, isRepairedGeo) {
    const ext = extruder || 1;
    const allVertices = [];
    const allTriangles = [];

    if (isRepairedGeo && geoOrGroup._meshFixData) {
        const { vertices, triangles } = geoOrGroup._meshFixData;
        vertices.forEach(v => {
            allVertices.push(`        <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}"/>`);
        });
        triangles.forEach(t => {
            allTriangles.push(`        <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`);
        });
    } else if (isRepairedGeo) {
        let geo = geoOrGroup;
        if (!geo.index) geo = window.BufferGeometryUtils.mergeVertices(geo.clone(), 0.0001);
        const pos = geo.attributes.position;
        if (!pos) return null;
        const idx = geo.index;
        if (idx && idx.array) {
            for (let i = 0; i < pos.count; i++) {
                allVertices.push(`        <vertex x="${pos.getX(i)}" y="${pos.getY(i)}" z="${pos.getZ(i)}"/>`);
            }
            for (let i = 0; i < idx.array.length; i += 3) {
                allTriangles.push(`        <triangle v1="${idx.array[i]}" v2="${idx.array[i + 1]}" v3="${idx.array[i + 2]}"/>`);
            }
        } else {
            for (let i = 0; i < pos.count; i++) {
                allVertices.push(`        <vertex x="${pos.getX(i)}" y="${pos.getY(i)}" z="${pos.getZ(i)}"/>`);
            }
            for (let i = 0; i < pos.count; i += 3) {
                allTriangles.push(`        <triangle v1="${i}" v2="${i + 1}" v3="${i + 2}"/>`);
            }
        }
    } else {
        let vertexOffset = 0;
        geoOrGroup.traverse(child => {
            if (!child.isMesh || !child.geometry) return;
            const geo = child.geometry.clone();
            child.updateWorldMatrix(true, false);
            geo.applyMatrix4(child.matrixWorld);
            const pos = geo.attributes.position;
            if (!pos) return;
            for (let i = 0; i < pos.count; i++) {
                allVertices.push(`        <vertex x="${pos.getX(i)}" y="${pos.getY(i)}" z="${pos.getZ(i)}"/>`);
            }
            const idx = geo.index;
            if (idx && idx.array) {
                for (let i = 0; i < idx.array.length; i += 3) {
                    allTriangles.push(`        <triangle v1="${idx.array[i] + vertexOffset}" v2="${idx.array[i + 1] + vertexOffset}" v3="${idx.array[i + 2] + vertexOffset}"/>`);
                }
            } else {
                for (let i = 0; i < pos.count; i += 3) {
                    allTriangles.push(`        <triangle v1="${i + vertexOffset}" v2="${i + 1 + vertexOffset}" v3="${i + 2 + vertexOffset}"/>`);
                }
            }
            vertexOffset += pos.count;
        });
    }

    if (allVertices.length === 0) return null;

    const itemName = `${prefix}_${partName}`;

    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US"
  xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
  xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">
  <metadata name="Application">Keycap Engine - Body Generator</metadata>
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
${allVertices.join('\n')}
        </vertices>
        <triangles>
${allTriangles.join('\n')}
        </triangles>
      </mesh>
    </object>
    <object id="2" type="model">
      <components>
        <component objectid="1" transform="1 0 0 0 1 0 0 0 1 0 0 0" />
      </components>
    </object>
  </resources>
  <build><item objectid="2" /></build>
</model>`;

    const slic3rConfig = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="2">
    <metadata type="object" key="name" value="${itemName}"/>
    <volume id="0" firstid="1">
      <metadata type="volume" key="name" value="${partName}"/>
      <metadata type="volume" key="extruder" value="${ext}"/>
    </volume>
  </object>
</config>`;

    const modelSettingsConfig = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="locked" value="false"/>
  </plate>
  <object id="2">
    <metadata key="name" value="${itemName}"/>
    <part id="1" subtype="normal_part">
      <metadata key="name" value="${partName}"/>
      <metadata key="extruder" value="${ext}"/>
    </part>
  </object>
</config>`;

    const zip = new JSZip();
    zip.folder('3D').file('3dmodel.model', modelXml);
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />\n  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />\n</Types>`);
    zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />\n</Relationships>`);
    zip.file('Metadata/Slic3r_PE_model.config', slic3rConfig);
    zip.file('Metadata/model_settings.config', modelSettingsConfig);

    return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

// ── Combined 3MF Export (複数パーツを1ファイルに統合・キーキャップ方式) ──────────
async function exportBodyPartsCombined3MF(partsData, prefix) {
    // keycap generator方式: component + volume + firstid でフィラメント割当
    let objects = '';
    const componentRefs = [];
    const volumeConfigs = [];
    let objectId = 1;

    for (const pd of partsData) {
        const allVertices = [];
        const allTriangles = [];

        const hasMFD = !!(pd.geometry && pd.geometry._meshFixData);
        console.log(`[MeshFix] 3MF Export: ${pd.partName} — isRepaired=${pd.isRepaired}, _meshFixData=${hasMFD}, geoType=${pd.geometry?.constructor?.name}`);

        if (pd.isRepaired && pd.geometry._meshFixData) {
            const { vertices, triangles } = pd.geometry._meshFixData;
            console.log(`[MeshFix] 3MF Export: ${pd.partName} — 修復データ使用: ${vertices.length}頂点, ${triangles.length}三角形`);
            vertices.forEach(v => {
                allVertices.push(`        <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}"/>`);
            });
            triangles.forEach(t => {
                allTriangles.push(`        <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`);
            });
        } else if (pd.isRepaired) {
            let geo = pd.geometry;
            if (!geo.index) geo = window.BufferGeometryUtils.mergeVertices(geo.clone(), 0.0001);
            const pos = geo.attributes.position;
            if (!pos) continue;
            const idx = geo.index;
            if (idx && idx.array) {
                for (let i = 0; i < pos.count; i++) {
                    allVertices.push(`        <vertex x="${pos.getX(i)}" y="${pos.getY(i)}" z="${pos.getZ(i)}"/>`);
                }
                for (let i = 0; i < idx.array.length; i += 3) {
                    allTriangles.push(`        <triangle v1="${idx.array[i]}" v2="${idx.array[i + 1]}" v3="${idx.array[i + 2]}"/>`);
                }
            } else {
                for (let i = 0; i < pos.count; i++) {
                    allVertices.push(`        <vertex x="${pos.getX(i)}" y="${pos.getY(i)}" z="${pos.getZ(i)}"/>`);
                }
                for (let i = 0; i < pos.count; i += 3) {
                    allTriangles.push(`        <triangle v1="${i}" v2="${i + 1}" v3="${i + 2}"/>`);
                }
            }
        } else {
            let vertexOffset = 0;
            pd.geometry.traverse(child => {
                if (!child.isMesh || !child.geometry) return;
                const geo = child.geometry.clone();
                child.updateWorldMatrix(true, false);
                geo.applyMatrix4(child.matrixWorld);
                const pos = geo.attributes.position;
                if (!pos) return;
                for (let i = 0; i < pos.count; i++) {
                    allVertices.push(`        <vertex x="${pos.getX(i)}" y="${pos.getY(i)}" z="${pos.getZ(i)}"/>`);
                }
                const idx = geo.index;
                if (idx && idx.array) {
                    for (let i = 0; i < idx.array.length; i += 3) {
                        allTriangles.push(`        <triangle v1="${idx.array[i] + vertexOffset}" v2="${idx.array[i + 1] + vertexOffset}" v3="${idx.array[i + 2] + vertexOffset}"/>`);
                    }
                } else {
                    for (let i = 0; i < pos.count; i += 3) {
                        allTriangles.push(`        <triangle v1="${i + vertexOffset}" v2="${i + 1 + vertexOffset}" v3="${i + 2 + vertexOffset}"/>`);
                    }
                }
                vertexOffset += pos.count;
            });
        }

        if (allVertices.length === 0) continue;

        objects += `
    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${allVertices.join('\n')}
        </vertices>
        <triangles>
${allTriangles.join('\n')}
        </triangles>
      </mesh>
    </object>`;
        componentRefs.push(`        <component objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0" />`);
        volumeConfigs.push({ objectId, partName: pd.partName, extruder: pd.extruder });
        objectId++;
    }

    if (componentRefs.length === 0) return null;

    const wrapperId = objectId;

    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US"
  xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
  xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">
  <metadata name="Application">Keycap Engine - Body Generator</metadata>
  <resources>${objects}
    <object id="${wrapperId}" type="model">
      <components>
${componentRefs.join('\n')}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${wrapperId}" />
  </build>
</model>`;

    // Slic3r PE config: volume + firstid でフィラメント番号割当
    let volumeXml = '';
    volumeConfigs.forEach((vc, idx) => {
        volumeXml += `    <volume id="${idx}" firstid="${vc.objectId}">\n`;
        volumeXml += `      <metadata type="volume" key="name" value="${vc.partName}"/>\n`;
        volumeXml += `      <metadata type="volume" key="extruder" value="${vc.extruder}"/>\n`;
        volumeXml += `    </volume>\n`;
    });
    const slic3rConfig = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="${wrapperId}">
    <metadata type="object" key="name" value="${prefix}_body"/>
${volumeXml}  </object>
</config>`;

    // model_settings.config: Bambu Studio / OrcaSlicer 用
    let partsXml = '';
    volumeConfigs.forEach(vc => {
        partsXml += `    <part id="${vc.objectId}" subtype="normal_part">\n`;
        partsXml += `      <metadata key="name" value="${vc.partName}"/>\n`;
        partsXml += `      <metadata key="extruder" value="${vc.extruder}"/>\n`;
        partsXml += `    </part>\n`;
    });
    const modelSettingsConfig = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="locked" value="false"/>
  </plate>
  <object id="${wrapperId}">
    <metadata key="name" value="${prefix}_body"/>
${partsXml}  </object>
</config>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypes);
    zip.folder('_rels').file('.rels', rels);
    zip.folder('3D').file('3dmodel.model', modelXml);
    zip.file('Metadata/Slic3r_PE_model.config', slic3rConfig);
    zip.file('Metadata/model_settings.config', modelSettingsConfig);

    return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

// Phase 7-1: 簡易 DXF/SVG パーサー — PCB/プレートの外形・スイッチ穴・ネジ穴を抽出
// 実用的な精度ではないが「読み込めた / 何が検出されたか」をユーザーに提示するには十分。
function _parsePCBImportDXF(text) {
    const result = { outline: [], switchHoles: [], screwHoles: [], source: 'dxf' };
    const lines = text.split(/\r?\n/);
    let i = 0;
    let cx = 0, cy = 0, cr = 0;
    while (i < lines.length) {
        const code = lines[i]?.trim();
        const val = lines[i + 1]?.trim();
        if (code === '0' && val === 'CIRCLE') {
            cx = 0; cy = 0; cr = 0;
            // 次の数行で 10/20/40 (x/y/radius) を拾う
            for (let j = i + 2; j < Math.min(i + 30, lines.length); j += 2) {
                const c = lines[j]?.trim(), v = parseFloat(lines[j + 1]);
                if (c === '10') cx = v;
                else if (c === '20') cy = v;
                else if (c === '40') cr = v;
                else if (c === '0') { i = j - 2; break; }
            }
            if (cr > 0.5 && cr < 2.0) {
                result.screwHoles.push({ x: cx, y: cy, r: cr });
            } else if (cr >= 2.0 && cr < 8.0) {
                result.switchHoles.push({ x: cx, y: cy, r: cr });
            } else {
                result.outline.push({ type: 'circle', x: cx, y: cy, r: cr });
            }
        } else if (code === '0' && val === 'LINE') {
            let x1=0,y1=0,x2=0,y2=0;
            for (let j = i + 2; j < Math.min(i + 30, lines.length); j += 2) {
                const c = lines[j]?.trim(), v = parseFloat(lines[j + 1]);
                if (c === '10') x1 = v;
                else if (c === '20') y1 = v;
                else if (c === '11') x2 = v;
                else if (c === '21') y2 = v;
                else if (c === '0') { i = j - 2; break; }
            }
            result.outline.push({ type: 'line', x1, y1, x2, y2 });
        }
        i += 2;
    }
    return result;
}

function _parsePCBImportSVG(text) {
    const result = { outline: [], switchHoles: [], screwHoles: [], source: 'svg' };
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    // <circle cx cy r>
    doc.querySelectorAll('circle').forEach(c => {
        const cx = parseFloat(c.getAttribute('cx') || '0');
        const cy = parseFloat(c.getAttribute('cy') || '0');
        const r = parseFloat(c.getAttribute('r') || '0');
        if (r > 0.5 && r < 2.0) result.screwHoles.push({ x: cx, y: cy, r });
        else if (r >= 2.0 && r < 8.0) result.switchHoles.push({ x: cx, y: cy, r });
        else result.outline.push({ type: 'circle', x: cx, y: cy, r });
    });
    // <rect x y width height> — 14x14mm 付近はスイッチ穴扱い
    doc.querySelectorAll('rect').forEach(r => {
        const x = parseFloat(r.getAttribute('x') || '0');
        const y = parseFloat(r.getAttribute('y') || '0');
        const w = parseFloat(r.getAttribute('width') || '0');
        const h = parseFloat(r.getAttribute('height') || '0');
        if (Math.abs(w - 14) < 0.5 && Math.abs(h - 14) < 0.5) {
            result.switchHoles.push({ x: x + w / 2, y: y + h / 2, r: w / 2 });
        } else {
            result.outline.push({ type: 'rect', x, y, w, h });
        }
    });
    // <line x1 y1 x2 y2>
    doc.querySelectorAll('line').forEach(ln => {
        result.outline.push({
            type: 'line',
            x1: parseFloat(ln.getAttribute('x1') || '0'),
            y1: parseFloat(ln.getAttribute('y1') || '0'),
            x2: parseFloat(ln.getAttribute('x2') || '0'),
            y2: parseFloat(ln.getAttribute('y2') || '0')
        });
    });
    // <path d="..."> はそのまま outline に文字列として保持 (今回はジオメトリ詳細展開は省略)
    doc.querySelectorAll('path').forEach(p => {
        const d = p.getAttribute('d');
        if (d) result.outline.push({ type: 'path', d });
    });
    return result;
}

// Phase 7-2: 内部干渉チェック — Body Generator のパラメトリックなパーツ間で
// 寸法的に干渉しそうな組合せを bbox / 距離ベースで検出する。
// 物理的なメッシュ交差ではなく state のスカラー値で判定する軽量チェック。
function runBodyCollisionCheck() {
    const issues = [];
    const ok = [];
    const isJa = (typeof currentLang !== 'undefined' && currentLang === 'ja');
    const t = (j, e) => isJa ? j : e;

    const wall = state.wallThickness || 3.0;
    const bezT = state.bezelTop || 5.0;
    const bezB = state.bezelBottom || 8.0;
    const bezS = state.bezelSide || 5.0;

    // 壁厚とベゼルの整合性
    if (wall > Math.min(bezT, bezB, bezS)) {
        issues.push({ level: 'warn', msg: t(`壁厚 (${wall}mm) がベゼル (top:${bezT} / bottom:${bezB} / side:${bezS}mm) より大きく、PCB に干渉する可能性。`,
            `Wall thickness (${wall}mm) exceeds bezel margins (top:${bezT} / bottom:${bezB} / side:${bezS}mm); may eat into PCB area.`) });
    } else {
        ok.push(t('壁厚はベゼル内に収まる', 'Wall thickness fits within bezel'));
    }

    // ガスケットマウント時のスペース
    if (state.mountType === 'gasket') {
        const gW = state.gasketW || 5.0;
        const gT = state.gasketT || 2.5;
        if (gW > Math.min(bezT, bezB) - wall) {
            issues.push({ level: 'warn', msg: t(`ガスケットタブ幅 ${gW}mm が壁厚を引いた上下ベゼル (${Math.min(bezT, bezB) - wall}mm) を超えています。`,
                `Gasket tab width ${gW}mm exceeds available bezel space (${Math.min(bezT, bezB) - wall}mm).`) });
        }
        if (gT > state.bottomThickness - 0.5) {
            issues.push({ level: 'warn', msg: t(`ガスケット厚 ${gT}mm がボトム肉厚 ${state.bottomThickness}mm に対して厚すぎます。`,
                `Gasket thickness ${gT}mm too close to bottom thickness ${state.bottomThickness}mm.`) });
        }
    }

    // スタンドオフ vs 壁厚
    if (state.mountType === 'tray') {
        const standoffD = state.standoffD || 5.5;
        if (standoffD > Math.min(bezT, bezS) * 2) {
            issues.push({ level: 'info', msg: t(`スタンドオフ径 ${standoffD}mm が大きく、ベゼル内に余裕がない可能性。`,
                `Standoff diameter ${standoffD}mm is large relative to bezels; tight fit.`) });
        } else {
            ok.push(t(`スタンドオフ径 ${standoffD}mm`, `Standoff diameter ${standoffD}mm`));
        }
        if (state.standoffH && state.standoffH < 3) {
            issues.push({ level: 'warn', msg: t(`スタンドオフ高さ ${state.standoffH}mm が低く、ネジ山が十分にかからない可能性。`,
                `Standoff height ${state.standoffH}mm is low; thread may not bite enough.`) });
        }
    }

    // USB ポート位置
    const usbX = state.usbPosX != null ? state.usbPosX : 50;
    const usbY = state.usbPosY != null ? state.usbPosY : 50;
    if (usbX < 5 || usbX > 95 || usbY < 5 || usbY > 95) {
        issues.push({ level: 'warn', msg: t(`USB ポート位置 (X:${usbX}, Y:${usbY}) が端に近すぎ、フィレットや角丸と干渉する可能性。`,
            `USB position (X:${usbX}, Y:${usbY}) is too close to the edge; may clash with corner radius.`) });
    } else {
        ok.push(t(`USB ポート位置 OK`, `USB position OK`));
    }
    const portMargin = state.portMargin != null ? state.portMargin : 0.5;
    if (portMargin < 0.2) {
        issues.push({ level: 'warn', msg: t(`USB 開口マージン ${portMargin}mm がきつく、ケーブル抜き差しに影響する可能性。`,
            `USB port margin ${portMargin}mm is tight; may affect cable insertion.`) });
    }

    // バッテリースペース
    if (state.batterySpace) {
        if (state.bottomThickness < 4) {
            issues.push({ level: 'warn', msg: t(`バッテリースペース ON で底厚が ${state.bottomThickness}mm と薄く、配線スペースが不足する可能性。`,
                `Battery space ON but bottom thickness ${state.bottomThickness}mm is thin; routing room may be limited.`) });
        }
        ok.push(t('バッテリースペース有効', 'Battery space enabled'));
    }

    // PCB クリアランス
    const clr = state.pcbClearance != null ? state.pcbClearance : 3.0;
    if (clr < 1.0) {
        issues.push({ level: 'err', msg: t(`PCB クリアランス ${clr}mm が小さすぎ、PCB が壁にぶつかる可能性大。`,
            `PCB clearance ${clr}mm is too small; PCB will likely hit the wall.`) });
    } else if (clr < 2.0) {
        issues.push({ level: 'warn', msg: t(`PCB クリアランス ${clr}mm はやや小さめ。基板の許容差を確認してください。`,
            `PCB clearance ${clr}mm is borderline; verify board tolerance.`) });
    } else {
        ok.push(t(`PCB クリアランス ${clr}mm`, `PCB clearance ${clr}mm`));
    }

    // アドオン併用
    const addons = [];
    if (state.encoder) addons.push('encoder');
    if (state.oled) addons.push('OLED');
    if (state.tripod) addons.push('tripod');
    if (addons.length >= 2 && state.layout === '40') {
        issues.push({ level: 'info', msg: t(`小型レイアウト (40%) に複数アドオン (${addons.join(', ')}) を載せています。配置スペースに注意。`,
            `Small layout (40%) with multiple add-ons (${addons.join(', ')}); space may be tight.`) });
    }
    if (addons.length > 0) ok.push(t(`アドオン: ${addons.join(', ')}`, `Add-ons: ${addons.join(', ')}`));

    return { issues, ok };
}

// ── Public API ─────────────────────────────
export const BodyModule = {
    id: MODULE_ID, name: MODULE_NAME,
    async init(ctx) {
        THREE = ctx.THREE; scene = ctx.scene; camera = ctx.camera; controls = ctx.controls;
        showToast = ctx.showToast; currentLang = ctx.currentLang;
        STLExporter = ctx.STLExporter; JSZip = ctx.JSZip; saveAs = ctx.saveAs;
        // テキスト印字用の共有リソース
        makeTextGeo = ctx.makeTextGeo; loadedFontData = ctx.loadedFontData;
        loadedFonts = ctx.loadedFonts; csgEvaluator = ctx.csgEvaluator;
        Brush = ctx.Brush; SUBTRACTION = ctx.SUBTRACTION; ADDITION = ctx.ADDITION;
        safeMerge = ctx.safeMerge; BufferGeometryUtils = ctx.BufferGeometryUtils;
        SVGLoader = ctx.SVGLoader;
        loadCSS();
        const c = document.getElementById('module-body');
        if (c) await loadUI(c);
        sceneGroup = new THREE.Group();
        sceneGroup.visible = false;
        scene.add(sceneGroup);
        bindUI();
        console.log('[BodyModule] Initialised');
    },
    activate() {
        const el = document.getElementById('module-body');
        if (el) el.style.display = 'block';
        if (sceneGroup) sceneGroup.visible = true;
        updateModel();
        // Refresh layout gallery on module switch
        if (_loadBodyGalleryFn) setTimeout(_loadBodyGalleryFn, 0);
        camera.position.set(150, 120, 200);
        controls.target.set(0, 10, 0);
        controls.update();

        // Take over history buttons for body module
        const uBtn = document.getElementById('btn-undo');
        const rBtn = document.getElementById('btn-redo');
        _bodyUndoHandler = () => bodyUndo();
        _bodyRedoHandler = () => bodyRedo();
        if (uBtn) uBtn.addEventListener('click', _bodyUndoHandler);
        if (rBtn) rBtn.addEventListener('click', _bodyRedoHandler);
        bodyUpdateHistoryBtns();

        // Show history controls
        const hCtrl = document.getElementById('history-controls');
        if (hCtrl) hCtrl.style.display = 'flex';

        // render-mode-controls は削除済み（不要）

        // body-display-controls は mode-controls に統合するので非表示
        const dispCtrl = document.getElementById('body-display-controls');
        if (dispCtrl) dispCtrl.style.display = 'none';

        // Take over HUD view-mode button
        const hudView = document.getElementById('hud-view-mode');
        if (hudView) {
            hudView._bodyHandler = () => {
                state.displayMode = state.displayMode === 'wireframe' ? 'standard' : 'wireframe';
                const renderSel2 = document.getElementById('render-mode');
                if (renderSel2) renderSel2.value = state.displayMode;
                updateModel();
            };
            hudView.addEventListener('click', hudView._bodyHandler);
        }

        // HUD mode-controls を body 用に丸ごと差し替え（重なり防止）
        const modeCtrl = document.getElementById('mode-controls');
        if (modeCtrl) {
            modeCtrl._savedHTML = modeCtrl.innerHTML;
            modeCtrl.style.display = 'block';
            modeCtrl.innerHTML =
                '<span class="mode-label">対象</span>' +
                '<select id="hud-mode-target" title="Select Target">' +
                    '<option value="topText">トップ上面</option>' +
                    '<option value="topSide">トップ側面</option>' +
                    '<option value="bottomText">ボトム底面</option>' +
                    '<option value="bottomSide">ボトム側面</option>' +
                    '<option value="svg">SVG</option>' +
                '</select>' +
                '<span class="mode-label">パーツ表示</span>' +
                '<select id="body-display-filter-hud">' +
                    '<option value="all">全パーツ</option>' +
                    '<option value="body">Body</option>' +
                    '<option value="plate">Plate</option>' +
                '</select>' +
                '<span class="mode-label">生成モード</span>' +
                '<select id="hud-mode-select" title="Select Mode">' +
                    '<option value="emboss">浮き出し (Emboss)</option>' +
                    '<option value="engrave">刻印 (Engrave)</option>' +
                    '<option value="doubleshot">埋め込み (Doubleshot)</option>' +
                '</select>';

            // ターゲットドロップダウン
            const hudTarget = document.getElementById('hud-mode-target');
            if (hudTarget) {
                hudTarget.value = currentBodyTextTarget;
                hudTarget._bodyHandler = (e) => {
                    switchBodyTextPanel(e.target.value);
                };
                hudTarget.addEventListener('change', hudTarget._bodyHandler);
            }

            // パーツ表示フィルター
            const dispFilter = document.getElementById('body-display-filter-hud');
            if (dispFilter) {
                dispFilter.value = state.partFilter;
                dispFilter._bodyHandler = (e) => {
                    state.partFilter = e.target.value;
                    // 元の body-display-filter も同期
                    const orig = document.getElementById('body-display-filter');
                    if (orig) orig.value = e.target.value;
                    updateModel();
                };
                dispFilter.addEventListener('change', dispFilter._bodyHandler);
            }

            // 生成モード
            const hudMode = document.getElementById('hud-mode-select');
            if (hudMode) {
                syncBodyHudMode();
                hudMode._bodyHandler = (e) => {
                    const mode = e.target.value;
                    const modeMap = {
                        topText: 'topTextMode', topSide: 'topSideMode',
                        bottomText: 'bottomTextMode', bottomSide: 'bottomSideMode',
                        svg: 'svgMode',
                    };
                    const key = modeMap[currentBodyTextTarget];
                    if (key) state[key] = mode;
                    requestBodyUpdate();
                    bodyCommitHistory();
                };
                hudMode.addEventListener('change', hudMode._bodyHandler);
            }
        }

        // フローティングコントロールの再配置
        if (window.updateFloatingControlsLayout) {
            requestAnimationFrame(window.updateFloatingControlsLayout);
        }

        // Phase 7-2: 内部干渉チェック ボタン
        const collBtn = document.getElementById('body-collision-check-btn');
        if (collBtn) {
            collBtn.addEventListener('click', () => {
                const r = runBodyCollisionCheck();
                const out = document.getElementById('body-collision-result');
                if (!out) return;
                const isJa = (typeof currentLang !== 'undefined' && currentLang === 'ja');
                const lvlIcon = { err: '❌', warn: '⚠️', info: 'ℹ️' };
                const lvlColor = { err: '#ff5252', warn: '#ffb74d', info: '#4fc3f7' };
                let html = '';
                if (r.issues.length === 0) {
                    html += `<div style="color:#69f0ae; font-weight:bold;">${isJa ? '✅ 干渉なし' : '✅ No collisions'}</div>`;
                } else {
                    html += `<div style="color:#ff9800; font-weight:bold; margin-bottom:6px;">${isJa ? `指摘 ${r.issues.length} 件` : `${r.issues.length} issues`}</div><ul style="list-style:none; padding:0; margin:0;">`;
                    for (const i of r.issues) {
                        html += `<li style="padding:4px 6px; margin-bottom:3px; border-left:3px solid ${lvlColor[i.level]}; background:rgba(255,255,255,0.03);"><span style="margin-right:4px;">${lvlIcon[i.level]}</span>${i.msg}</li>`;
                    }
                    html += '</ul>';
                }
                if (r.ok.length > 0) {
                    html += `<details style="margin-top:6px;"><summary style="cursor:pointer; color:#69f0ae; font-size:0.72rem;">✓ ${isJa ? `OK 項目 (${r.ok.length})` : `Passing (${r.ok.length})`}</summary><ul style="list-style:none; padding:4px 0 0 12px; margin:0; font-size:0.7rem; color:#aaa;">`;
                    for (const o of r.ok) html += `<li>✓ ${o}</li>`;
                    html += '</ul></details>';
                }
                out.innerHTML = html;
                out.style.display = '';
            });
        }

        // ガムボール委譲: Body テキスト用ターゲット
        window._gumballDelegate = {
            getTargets() {
                const t = [];
                if (state.enableTopText && state.topText) t.push('bodyTopText');
                if (state.enableTopSide && state.topSideText) t.push('bodyTopSide');
                if (state.enableBottomText && state.bottomText) t.push('bodyBottomText');
                if (state.enableBottomSide && state.bottomSideText) t.push('bodyBottomSide');
                if (state.enableSvg && state.svgContent) t.push('bodySvg');
                return t;
            },
            getLabels() {
                return {
                    bodyTopText: 'トップ上面',
                    bodyTopSide: 'トップ側面',
                    bodyBottomText: 'ボトム底面',
                    bodyBottomSide: 'ボトム側面',
                    bodySvg: 'SVG',
                };
            },
            getPosition(target) {
                // ケース寸法を取得してY座標を計算
                const layoutData = state.customLayoutData
                    ? JSON.parse(JSON.stringify(state.customLayoutData))
                    : generateKeys(state.layout);
                const pitch = state.keyPitch;
                const plateW = layoutData.totalW * pitch;
                const plateH = layoutData.totalH * pitch;
                const bT = state.bezelTop, bB = state.bezelBottom;
                const caseD = plateH + bT + bB;
                const bottomT = Math.max(state.bottomThickness, 4.0);
                const pcbCl = state.pcbClearance;
                const plT = 1.5;
                const topH = state.profileType === 'high' ? 7 : state.profileType === 'low' ? 3.5 : 1.5;
                const totalH = bottomT + pcbCl + plT + topH;
                const zOff = (bB - bT) / 2;

                switch (target) {
                    case 'bodyTopText':
                        return new THREE.Vector3(state.topTextX, totalH, state.topTextZ + zOff);
                    case 'bodyTopSide': {
                        const wallH = pcbCl + plT;
                        const midY = bottomT + wallH / 2 + plT;
                        return new THREE.Vector3(0, midY + state.topSideY, zOff);
                    }
                    case 'bodyBottomText':
                        return new THREE.Vector3(state.bottomTextX, 0, state.bottomTextZ + zOff);
                    case 'bodyBottomSide':
                        return new THREE.Vector3(0, bottomT / 2 + state.bottomSideY, zOff);
                    case 'bodySvg': {
                        const svgY = state.svgTarget === 'top' ? totalH : 0;
                        return new THREE.Vector3(state.svgPosX, svgY, state.svgPosZ + zOff);
                    }
                    default:
                        return new THREE.Vector3(0, 0, 0);
                }
            },
            onObjectChange(pos, target) {
                switch (target) {
                    case 'bodyTopText':
                        state.topTextX = parseFloat(pos.x.toFixed(2));
                        state.topTextZ = parseFloat(pos.z.toFixed(2));
                        break;
                    case 'bodyBottomText':
                        state.bottomTextX = parseFloat(pos.x.toFixed(2));
                        state.bottomTextZ = parseFloat(pos.z.toFixed(2));
                        break;
                    case 'bodyTopSide':
                        state.topSideY = parseFloat(pos.y.toFixed(2));
                        break;
                    case 'bodyBottomSide':
                        state.bottomSideY = parseFloat(pos.y.toFixed(2));
                        break;
                    case 'bodySvg':
                        state.svgPosX = parseFloat(pos.x.toFixed(2));
                        state.svgPosZ = parseFloat(pos.z.toFixed(2));
                        break;
                }
                bodySyncUI();
                updateModel();
            },
            onDragEnd() {
                bodyCommitHistory();
            }
        };
        if (window.updateGumballTargetDropdown) window.updateGumballTargetDropdown();
    },
    deactivate() {
        const el = document.getElementById('module-body');
        if (el) el.style.display = 'none';
        if (sceneGroup) sceneGroup.visible = false;

        // Release history buttons
        const uBtn = document.getElementById('btn-undo');
        const rBtn = document.getElementById('btn-redo');
        if (uBtn && _bodyUndoHandler) uBtn.removeEventListener('click', _bodyUndoHandler);
        if (rBtn && _bodyRedoHandler) rBtn.removeEventListener('click', _bodyRedoHandler);
        _bodyUndoHandler = null;
        _bodyRedoHandler = null;

        // Release HUD view-mode button
        const hudView = document.getElementById('hud-view-mode');
        if (hudView && hudView._bodyHandler) {
            hudView.removeEventListener('click', hudView._bodyHandler);
            hudView._bodyHandler = null;
        }

        // HUD mode-controls を keycap 用に復元（innerHTML 丸ごと戻す）
        const modeCtrl = document.getElementById('mode-controls');
        if (modeCtrl && modeCtrl._savedHTML) {
            modeCtrl.innerHTML = modeCtrl._savedHTML;
            modeCtrl._savedHTML = null;
        }

        // フローティングコントロールの再配置
        if (window.updateFloatingControlsLayout) {
            requestAnimationFrame(window.updateFloatingControlsLayout);
        }

        // ガムボール委譲をクリア → keycap用ドロップダウン復元
        window._gumballDelegate = null;
        if (window.updateGumballTargetDropdown) window.updateGumballTargetDropdown();
    },
    getSectionOptions() { return SECTION_OPTIONS; },
    getState() { return { ...state }; },
    setState(newState) {
        Object.assign(state, newState);
        bodySyncUI();
        updateModel();
        renderBodyAMSPalette();
        bodyCommitHistory();
    },
    getGroup() { return sceneGroup; },
    // プレビュー用: 色だけ変更してモデル更新（履歴・UI同期なし）
    setColorsForPreview(colors) {
        const colorKeys = ['topCaseColor', 'bottomCaseColor', 'plateColor', 'rubberPadColor', 'feetColor', 'textColor'];
        colorKeys.forEach(k => { if (colors[k] !== undefined) state[k] = colors[k]; });
        updateModel();
    },
    _bodyUndoFn: bodyUndo,
    _bodyRedoFn: bodyRedo,
    updateModel,
    updateBodyStats,
    renderBodyAMSPalette,
    showBodyExportDialog,
};
