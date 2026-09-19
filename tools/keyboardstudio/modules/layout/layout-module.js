// =============================================
// KeybordStudio V1 - Layout Studio Module
// modules/layout/layout-module.js
// =============================================

const MODULE_ID = 'layout';
const MODULE_NAME = 'Layout Studio';

// ── Section Navigation ────────────────────
const SECTION_OPTIONS = [
    { value: '', label: '--- セクション移動 ---' },
    { value: 'sec-layout-preset', label: 'プリセット' },
    { value: 'sec-layout-tools', label: 'ツール' },
    { value: 'sec-layout-symbols', label: 'シンボル' },
    { value: 'sec-layout-canvas', label: 'キャンバス' },
    { value: 'sec-layout-import', label: 'インポート' },
    { value: 'sec-layout-export', label: 'エクスポート' },
];

// ── Constants ─────────────────────────────
const PX_PER_MM = 2; // 1mm = 2 world units

const LAYOUT_PRESETS = {
    '60':       { label: '60%',       totalW: 15,    totalH: 5 },
    '65':       { label: '65%',       totalW: 16,    totalH: 5 },
    '75':       { label: '75%',       totalW: 16,    totalH: 6 },
    'tkl':      { label: 'TKL',       totalW: 18.5,  totalH: 6.5 },
    'full':     { label: 'Full',      totalW: 22.75, totalH: 6.5 },
    '40':       { label: '40%',       totalW: 12,    totalH: 4 },
    'alice':    { label: 'Alice',     totalW: 15,    totalH: 5 },
    'macro':    { label: 'Macro',     totalW: 3,     totalH: 3 },
    '1800':     { label: '1800',      totalW: 20,    totalH: 6.5 },
    // Phase 11: テンプレートギャラリー拡充
    '30':       { label: '30%',       totalW: 10,    totalH: 3 },
    '50':       { label: '50%',       totalW: 13,    totalH: 4 },
    '70':       { label: '70%',       totalW: 17.25, totalH: 5 },
    '96':       { label: '96%',       totalW: 19,    totalH: 6.5 },
    'split-50': { label: 'Split 50%', totalW: 7,     totalH: 4 },     // 片側のみ
    'ortho-44': { label: 'Ortho 4×12', totalW: 12,   totalH: 4 },
    'ortho-60': { label: 'Ortho 5×12', totalW: 12,   totalH: 5 },
    'planck':   { label: 'Planck',    totalW: 12,    totalH: 4 },
    'preonic':  { label: 'Preonic',   totalW: 12,    totalH: 5 },
    'numpad':   { label: 'Numpad',    totalW: 4,     totalH: 5 },
    'corne':    { label: 'Corne',     totalW: 6,     totalH: 4 },     // 片側のみ
    'lily58':   { label: 'Lily58',    totalW: 6,     totalH: 5 },     // 片側のみ
};

function getStabSpacing(wU) {
    if (wU >= 7) return 114.3;
    if (wU >= 6) return 100.0;
    if (wU >= 3) return 38.1;
    return 23.8;
}

// シンボル定義 (寸法はすべてmm)
const SWITCH_SZ = 14.0;
const STAB_W = 6.7;
const STAB_H = 12.3;
const PITCH = 19.05;

const SYMBOL_DEFS = {
    'switch-1u':         { label: '1u',         boundW: PITCH,        boundH: PITCH, hasSwitch: true, hasStab: false },
    'switch-1.25u':      { label: '1.25u',      boundW: PITCH * 1.25, boundH: PITCH, hasSwitch: true, hasStab: false },
    'switch-2u-stab':    { label: '2u+スタビ',    boundW: PITCH * 2,    boundH: PITCH, hasSwitch: true, hasStab: true, stabSpacing: 23.8 },
    'switch-2.25u-stab': { label: '2.25u+スタビ', boundW: PITCH * 2.25, boundH: PITCH, hasSwitch: true, hasStab: true, stabSpacing: 23.8 },
    'switch-2.75u-stab': { label: '2.75u+スタビ', boundW: PITCH * 2.75, boundH: PITCH, hasSwitch: true, hasStab: true, stabSpacing: 23.8 },
    'switch-6.25u-stab': { label: '6.25u+スタビ', boundW: PITCH * 6.25, boundH: PITCH, hasSwitch: true, hasStab: true, stabSpacing: 100 },
    'switch-7u-stab':    { label: '7u+スタビ',    boundW: PITCH * 7,    boundH: PITCH, hasSwitch: true, hasStab: true, stabSpacing: 114.3 },
    'stab-2u':           { label: 'スタビ 2u',    boundW: 23.8 + STAB_W, boundH: STAB_H, hasSwitch: false, hasStab: true, stabSpacing: 23.8 },
    'stab-6.25u':        { label: 'スタビ 6.25u', boundW: 100 + STAB_W,  boundH: STAB_H, hasSwitch: false, hasStab: true, stabSpacing: 100 },
    'stab-7u':           { label: 'スタビ 7u',    boundW: 114.3 + STAB_W, boundH: STAB_H, hasSwitch: false, hasStab: true, stabSpacing: 114.3 },
    'screw-m2':          { label: 'M2 ネジ穴',   boundW: 5, boundH: 5, hasSwitch: false, hasStab: false, isScrew: true, screwDia: 2.0 },
    'screw-m2.5':        { label: 'M2.5 ネジ穴', boundW: 5.5, boundH: 5.5, hasSwitch: false, hasStab: false, isScrew: true, screwDia: 2.5 },
};

// ── Context ───────────────────────────────
let showToast = null;
let currentLang = 'en';

// ── 2D Canvas ─────────────────────────────
let canvas = null;
let ctx = null;
let canvasContainer = null;

// ── State ─────────────────────────────────
const state = {
    gridSize: 19.05,
    showGrid: true,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    activeTool: 'line',
    activePreset: null,
    plateOutline: null,
    cadLines: [],
    snapToGrid: true,
    // Layer system
    layers: [],
    activeLayerId: 1,
    // Phase 8 additions
    switchHoleType: 'mx',
    snapAngles: true,
    showMatrixIds: false,
};

// ── Phase 8 helpers ───────────────────────
function getSwitchHoleSize() {
    const t = state.switchHoleType || 'mx';
    if (t === 'choc') return { w: 13.8, h: 13.8 };
    if (t === 'alps') return { w: 15.5, h: 12.8 };
    return { w: 14.0, h: 14.0 };
}

// ── Symbols ───────────────────────────────
const symbols = [];
const selectedIds = new Set();
const selectedLineIds = new Set();
let nextSymbolId = 1;
let nextLineId = 1;

// ── Interaction State ─────────────────────
let isPanning = false;
let panStartX = 0, panStartY = 0;

let isSelecting = false;
let selStartScreenX = 0, selStartScreenY = 0;
let selCurScreenX = 0, selCurScreenY = 0;

let lineStartWorld = null;
let rectStartWorld = null;
let rectCurWorld = null;

// Circle tool state
let circleCenter = null;      // center world point
let circleRadius = 0;         // current radius in world units

// Polygon tool state
let polyCenter = null;
let polyRadius = 0;
let polySides = 6;            // default hexagon
let polyRotation = -Math.PI / 2; // angle offset (default: vertex at top)

// Curve tool state (quadratic bezier: 3 clicks)
let curvePoints = [];          // [p0, p1, p2] click points

let isMoving = false;
let moveStartWorld = null;
let moveOriginalPositions = [];

let cursorWorldPos = null;
let dimInputWrapper = null;
let dimInputEl = null;
let dimInputMode = null; // null | 'line-length' | 'rect-width' | 'rect-height'
let isSnappedToEndpoint = false;
let isSnappedToMidpoint = false;
let pendingSymbolType = null; // シンボル配置モード

// Gumball state
let layoutGumballActive = false;
let layoutGumballHandler = null;
let gumballMoveAxis = null;     // 'x' | 'y' | null (click-based axis-constrained move)
let gumballMoveSymId = null;
let gumballMoveOrigPos = null;  // { x, y } original symbol position
let gumballDistance = 0;        // current move distance in world units

// Fillet state
let filletLine1Id = null;       // first selected line ID
let filletInfo = null;          // computed corner info (single fillet)
let filletCorners = [];         // all corner infos (multi-fillet)
let filletRadius = 0;           // current radius in world units
let filletMaxRadius = 0;        // safe max for multi-fillet

// Measurement follow toggle
let measureFollowLines = true;

// Gumball for lines
let gumballMoveLineId = null;
let gumballMoveOrigLine = null; // { x1, y1, x2, y2 }
let gumballConnectedLines = []; // [{ id, origX1, origY1, origX2, origY2, end1, end2 }]
// Multi-select gumball state
let gumballMoveMultiSyms = [];    // [{ id, origX, origY }]
let gumballMoveMultiLines = [];   // [{ id, origX1, origY1, origX2, origY2, arc, bezier }]
let gumballMoveMultiCenter = null; // { x, y }

// Copy mode state
let copyModeActive = false;
let copyGhostLines = [];
let copyGhostSyms = [];
let copyBasePoint = null;

// Rotation mode state
let rotationModeActive = false;
let rotationBasePoint = null;      // { x, y }
let rotationAngle = 0;            // radians
let rotationOrigSyms = [];        // [{ id, origX, origY, origRotation }]
let rotationOrigLines = [];       // [{ id, origX1, origY1, origX2, origY2, arc, bezier }]

// Trim/Extend: activeTool = 'trim'
let trimRefLineId = null;

// Align: activeTool = 'align'
let alignRefLineId = null;
let alignRefSymId = null;

// Mirror: activeTool = 'mirror'
let mirrorPoint1 = null;

// Measurement state
let measureLine1Id = null;
let measureLine2Id = null;
let measureResult = null; // { dist, p1, p2 } closest points between two lines
let layoutMeasureActive = false;
let layoutMeasureHandler = null;
let contextMenuClickHandler = null;

// CAD Import state
let importedFiles = []; // [{ name, entities, info, selected }]

// Undo/Redo
const undoStack = [];
const redoStack = [];
const MAX_UNDO = 50;

function _captureSnapshot() {
    if (state.layers.length > 0) commitActiveLayer();
    return {
        layers: state.layers.length > 0 ? _deepCopyLayers(state.layers) : [],
        activeLayerId: state.activeLayerId,
        cadLines: state.cadLines.map(_deepCopyLine),
        syms: symbols.map(s => ({ ...s })),
    };
}

function _restoreSnapshot(snap) {
    if (snap.layers && snap.layers.length > 0) {
        state.layers.length = 0;
        state.layers.push(..._deepCopyLayers(snap.layers));
        state.activeLayerId = snap.activeLayerId;
        syncActiveLayer();
    } else {
        state.cadLines.length = 0;
        state.cadLines.push(...snap.cadLines);
        symbols.length = 0;
        symbols.push(...snap.syms);
    }
    selectedIds.clear();
    selectedLineIds.clear();
    resetFilletState();
    updateUndoButtons();
    renderLayerPanel();
    drawCanvas();
}

function pushUndo() {
    undoStack.push(_captureSnapshot());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0;
    updateUndoButtons();
}

function layoutUndo() {
    if (undoStack.length === 0) return;
    redoStack.push(_captureSnapshot());
    _restoreSnapshot(undoStack.pop());
}

function layoutRedo() {
    if (redoStack.length === 0) return;
    undoStack.push(_captureSnapshot());
    _restoreSnapshot(redoStack.pop());
}

function updateUndoButtons() {
    const u = document.getElementById('btn-undo');
    const r = document.getElementById('btn-redo');
    if (u) u.disabled = undoStack.length === 0;
    if (r) r.disabled = redoStack.length === 0;
}

// ── Layer System ─────────────────────────
let nextLayerId = 2;

function _deepCopyLine(l) {
    const c = { id: l.id, x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 };
    if (l.arc) c.arc = { ...l.arc };
    if (l.bezier) c.bezier = { ...l.bezier };
    return c;
}

function _deepCopyLayers(layers) {
    return layers.map(l => ({
        ...l,
        cadLines: l.cadLines.map(_deepCopyLine),
        symbols: l.symbols.map(s => ({ ...s })),
    }));
}

function createDefaultLayer() {
    return { id: 1, name: 'Layer 1', visible: true, locked: false, cadLines: [], symbols: [] };
}

function initLayers() {
    if (state.layers.length === 0) {
        const layer = createDefaultLayer();
        // 既存データがあればLayer 1に移動
        layer.cadLines = state.cadLines.map(_deepCopyLine);
        layer.symbols = symbols.map(s => ({ ...s }));
        state.layers.push(layer);
        state.activeLayerId = layer.id;
    }
}

function syncActiveLayer() {
    const layer = getActiveLayer();
    if (!layer) return;
    state.cadLines.length = 0;
    state.cadLines.push(...layer.cadLines.map(_deepCopyLine));
    symbols.length = 0;
    symbols.push(...layer.symbols.map(s => ({ ...s })));
}

function commitActiveLayer() {
    const layer = getActiveLayer();
    if (!layer) return;
    layer.cadLines = state.cadLines.map(_deepCopyLine);
    layer.symbols = symbols.map(s => ({ ...s }));
}

function getActiveLayer() {
    return state.layers.find(l => l.id === state.activeLayerId) || state.layers[0];
}

function addLayer(name) {
    commitActiveLayer();
    const id = nextLayerId++;
    const newLayer = { id, name: name || `Layer ${id}`, visible: true, locked: false, cadLines: [], symbols: [] };
    state.layers.push(newLayer);
    setActiveLayer(id);
    return newLayer;
}

function deleteLayer(layerId) {
    if (state.layers.length <= 1) {
        if (showToast) showToast('最後のレイヤーは削除できません');
        return;
    }
    commitActiveLayer();
    pushUndo();
    const idx = state.layers.findIndex(l => l.id === layerId);
    if (idx < 0) return;
    state.layers.splice(idx, 1);
    if (state.activeLayerId === layerId) {
        const newActive = state.layers[Math.min(idx, state.layers.length - 1)];
        state.activeLayerId = newActive.id;
        syncActiveLayer();
    }
    selectedIds.clear();
    selectedLineIds.clear();
    renderLayerPanel();
    drawCanvas();
}

function setActiveLayer(layerId) {
    if (layerId === state.activeLayerId) return;
    commitActiveLayer();
    state.activeLayerId = layerId;
    syncActiveLayer();
    selectedIds.clear();
    selectedLineIds.clear();
    renderLayerPanel();
    drawCanvas();
}

function toggleLayerVisibility(layerId) {
    const layer = state.layers.find(l => l.id === layerId);
    if (!layer) return;
    layer.visible = !layer.visible;
    renderLayerPanel();
    drawCanvas();
}

function getAllVisibleCadLines() {
    commitActiveLayer();
    const lines = [];
    for (const layer of state.layers) {
        if (!layer.visible) continue;
        for (const line of layer.cadLines) lines.push(line);
    }
    return lines;
}

function getAllVisibleSymbols() {
    commitActiveLayer();
    const syms = [];
    for (const layer of state.layers) {
        if (!layer.visible) continue;
        for (const sym of layer.symbols) syms.push(sym);
    }
    return syms;
}

function renderLayerPanel() {
    const list = document.getElementById('layout-layers-list');
    if (!list) return;
    if (state.layers.length > 0) commitActiveLayer();

    const lineCount = (layer) => layer.cadLines.length;
    const symCount = (layer) => layer.symbols.length;

    list.innerHTML = state.layers.map(layer => `
        <div class="layer-item${layer.id === state.activeLayerId ? ' active' : ''}" data-layer-id="${layer.id}">
            <div class="layer-preview">
                <canvas data-layer-id="${layer.id}" width="120" height="90"></canvas>
            </div>
            <div class="layer-info">
                <span class="layer-name" data-layer-id="${layer.id}">${layer.name}</span>
                <span class="layer-meta" data-layer-id="${layer.id}">${lineCount(layer)} 線 / ${symCount(layer)} シンボル</span>
            </div>
            <div class="layer-controls">
                <button class="layer-visibility${layer.visible ? ' visible' : ''}" data-layer-id="${layer.id}"
                        title="${layer.visible ? '非表示にする' : '表示する'}">
                    <svg viewBox="0 0 24 24" width="14" height="14">
                        ${layer.visible
                            ? '<path fill="currentColor" d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>'
                            : '<path fill="currentColor" d="M12 7c2.8 0 5 2.2 5 5 0 .6-.1 1.3-.4 1.8l3 3c1.5-1.3 2.7-3 3.4-4.8-1.7-4.4-6-7.5-11-7.5-1.4 0-2.7.3-4 .7l2.2 2.2c.5-.3 1.2-.4 1.8-.4zM2 4.3l2.3 2.3.4.4C3.1 8.3 1.8 10 1 12c1.7 4.4 6 7.5 11 7.5 1.6 0 3-.3 4.4-.8l.4.4 2.9 2.9 1.3-1.3L3.3 3 2 4.3zm5.5 5.5l1.6 1.6c0 .2-.1.4-.1.6 0 1.7 1.3 3 3 3 .2 0 .4 0 .6-.1l1.6 1.6c-.7.3-1.4.5-2.2.5-2.8 0-5-2.2-5-5 0-.8.2-1.5.5-2.2zm4.3-.8l3.2 3.2V12c0-1.7-1.3-3-3-3h-.2z"/>'
                        }
                    </svg>
                </button>
                <button class="layer-delete" data-layer-id="${layer.id}" title="レイヤーを削除">×</button>
            </div>
        </div>
    `).join('');

    // イベントバインド
    list.querySelectorAll('.layer-item').forEach(item => {
        item.addEventListener('click', e => {
            if (e.target.closest('.layer-visibility') || e.target.closest('.layer-delete') || e.target.closest('.layer-name') || e.target.closest('.layer-name-input')) return;
            setActiveLayer(parseInt(item.dataset.layerId));
        });
    });
    list.querySelectorAll('.layer-visibility').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            toggleLayerVisibility(parseInt(btn.dataset.layerId));
        });
    });
    list.querySelectorAll('.layer-delete').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            deleteLayer(parseInt(btn.dataset.layerId));
        });
    });
    // クリックでインラインリネーム
    list.querySelectorAll('.layer-name').forEach(nameEl => {
        nameEl.addEventListener('click', e => {
            e.stopPropagation();
            const layerId = parseInt(nameEl.dataset.layerId);
            const layer = state.layers.find(l => l.id === layerId);
            if (!layer) return;
            // まずアクティブレイヤーに切替
            if (layerId !== state.activeLayerId) setActiveLayer(layerId);
            // インラインエディタに置き換え
            const input = document.createElement('input');
            input.className = 'layer-name-input';
            input.value = layer.name;
            input.dataset.layerId = layerId;
            nameEl.replaceWith(input);
            input.focus();
            input.select();
            const finishEdit = () => {
                const val = input.value.trim();
                if (val) layer.name = val;
                renderLayerPanel();
                updateAllLayerPreviews();
            };
            input.addEventListener('blur', finishEdit);
            input.addEventListener('keydown', ev => {
                if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
                if (ev.key === 'Escape') { input.value = layer.name; input.blur(); }
            });
        });
    });

    // ドラッグ並べ替え
    let _dragLayerId = null;
    list.querySelectorAll('.layer-item').forEach(item => {
        item.setAttribute('draggable', 'true');

        item.addEventListener('dragstart', e => {
            _dragLayerId = parseInt(item.dataset.layerId);
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', _dragLayerId);
        });

        item.addEventListener('dragend', () => {
            _dragLayerId = null;
            item.classList.remove('dragging');
            list.querySelectorAll('.layer-item').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
        });

        item.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (parseInt(item.dataset.layerId) === _dragLayerId) return;
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            list.querySelectorAll('.layer-item').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            if (e.clientY < midY) {
                item.classList.add('drag-over-top');
            } else {
                item.classList.add('drag-over-bottom');
            }
        });

        item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        item.addEventListener('drop', e => {
            e.preventDefault();
            const targetLayerId = parseInt(item.dataset.layerId);
            if (targetLayerId === _dragLayerId || _dragLayerId == null) return;

            const fromIdx = state.layers.findIndex(l => l.id === _dragLayerId);
            const toIdx = state.layers.findIndex(l => l.id === targetLayerId);
            if (fromIdx < 0 || toIdx < 0) return;

            // ドロップ位置（上半分 or 下半分）で挿入位置を決定
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            const insertBefore = e.clientY < midY;

            pushUndo();
            const [moved] = state.layers.splice(fromIdx, 1);
            let newIdx = state.layers.findIndex(l => l.id === targetLayerId);
            if (!insertBefore) newIdx += 1;
            state.layers.splice(newIdx, 0, moved);

            renderLayerPanel();
            drawCanvas();
        });
    });

    // プレビューホバーで大きなプレビュー表示
    const tooltip = document.getElementById('layer-preview-tooltip');
    list.querySelectorAll('.layer-preview').forEach(prev => {
        prev.addEventListener('mouseenter', e => {
            if (!tooltip) return;
            const layerId = parseInt(prev.querySelector('canvas').dataset.layerId);
            const layer = state.layers.find(l => l.id === layerId);
            if (!layer) return;
            const tipCvs = tooltip.querySelector('canvas');
            _renderLayerThumbnail(tipCvs, layer);
            // パネルの左側に表示
            const rect = prev.getBoundingClientRect();
            let top = rect.top - 60;
            const tipH = 180;
            // 画面外にはみ出さないように
            if (top + tipH > window.innerHeight - 10) top = window.innerHeight - tipH - 10;
            if (top < 10) top = 10;
            tooltip.style.left = (rect.left - 250) + 'px';
            tooltip.style.top = top + 'px';
            tooltip.classList.add('visible');
        });
        prev.addEventListener('mouseleave', () => {
            if (tooltip) tooltip.classList.remove('visible');
        });
    });

    // プレビュー描画
    updateAllLayerPreviews();
}

function updateAllLayerPreviews() {
    const list = document.getElementById('layout-layers-list');
    if (!list) return;
    list.querySelectorAll('.layer-preview canvas').forEach(cvs => {
        const layerId = parseInt(cvs.dataset.layerId);
        const layer = state.layers.find(l => l.id === layerId);
        if (layer) _renderLayerThumbnail(cvs, layer);
    });
}

function _renderLayerThumbnail(cvs, layer) {
    const pCtx = cvs.getContext('2d');
    const w = cvs.width, h = cvs.height;
    pCtx.clearRect(0, 0, w, h);
    pCtx.fillStyle = '#111122';
    pCtx.fillRect(0, 0, w, h);

    const lines = layer.cadLines;
    const syms = layer.symbols;
    if (lines.length === 0 && syms.length === 0) {
        pCtx.fillStyle = '#333';
        pCtx.font = '10px sans-serif';
        pCtx.textAlign = 'center';
        pCtx.fillText('空', w / 2, h / 2 + 4);
        return;
    }

    // バウンディングボックス計算
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const l of lines) {
        minX = Math.min(minX, l.x1, l.x2); minY = Math.min(minY, l.y1, l.y2);
        maxX = Math.max(maxX, l.x1, l.x2); maxY = Math.max(maxY, l.y1, l.y2);
        if (l.arc) {
            const a = l.arc;
            minX = Math.min(minX, a.cx - a.r); minY = Math.min(minY, a.cy - a.r);
            maxX = Math.max(maxX, a.cx + a.r); maxY = Math.max(maxY, a.cy + a.r);
        }
        if (l.bezier) {
            minX = Math.min(minX, l.bezier.cpx); minY = Math.min(minY, l.bezier.cpy);
            maxX = Math.max(maxX, l.bezier.cpx); maxY = Math.max(maxY, l.bezier.cpy);
        }
    }
    for (const s of syms) {
        minX = Math.min(minX, s.x); minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x + s.width); maxY = Math.max(maxY, s.y + s.height);
    }

    const bw = maxX - minX || 1;
    const bh = maxY - minY || 1;
    const pad = 6;
    const scale = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh);
    const ox = (w - bw * scale) / 2 - minX * scale;
    const oy = (h - bh * scale) / 2 - minY * scale;

    pCtx.save();
    pCtx.translate(ox, oy);
    pCtx.scale(scale, scale);

    // CAD線を描画
    pCtx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
    pCtx.lineWidth = 1.5 / scale;
    for (const l of lines) {
        pCtx.beginPath();
        if (l.arc) {
            const a = l.arc;
            pCtx.arc(a.cx, a.cy, a.r, a.startAngle, a.endAngle, a.ccw);
        } else if (l.bezier) {
            pCtx.moveTo(l.x1, l.y1);
            pCtx.quadraticCurveTo(l.bezier.cpx, l.bezier.cpy, l.x2, l.y2);
        } else {
            pCtx.moveTo(l.x1, l.y1);
            pCtx.lineTo(l.x2, l.y2);
        }
        pCtx.stroke();
    }

    // シンボルを描画（簡易）
    pCtx.strokeStyle = 'rgba(255, 200, 0, 0.5)';
    pCtx.lineWidth = 1 / scale;
    for (const s of syms) {
        pCtx.strokeRect(s.x, s.y, s.width, s.height);
    }

    pCtx.restore();
}

// 軽量メタ更新（カウント + プレビュー）— drawCanvasから毎回呼ぶ
let _layerMetaTimer = null;
function updateLayerMeta() {
    if (!_layerPanelVisible) return;
    // デバウンス: 高頻度drawCanvasで呼ばれるのでまとめる
    if (_layerMetaTimer) return;
    _layerMetaTimer = requestAnimationFrame(() => {
        _layerMetaTimer = null;
        if (state.layers.length > 0) commitActiveLayer();
        const list = document.getElementById('layout-layers-list');
        if (!list) return;
        // カウント更新
        list.querySelectorAll('.layer-meta').forEach(el => {
            const layerId = parseInt(el.dataset.layerId);
            const layer = state.layers.find(l => l.id === layerId);
            if (layer) {
                el.textContent = `${layer.cadLines.length} 線 / ${layer.symbols.length} シンボル`;
            }
        });
        // プレビュー更新
        updateAllLayerPreviews();
    });
}

let _layerPanelVisible = false;

function toggleLayerPanel() {
    _layerPanelVisible = !_layerPanelVisible;
    const panel = document.getElementById('layout-layers-panel');
    const hudBtn = document.getElementById('hud-layout-layers');
    if (panel) {
        if (_layerPanelVisible) {
            panel.classList.add('layers-open');
            renderLayerPanel();
        } else {
            panel.classList.remove('layers-open');
        }
    }
    if (hudBtn) hudBtn.classList.toggle('active', _layerPanelVisible);
}

function bindLayerPanel() {
    const addBtn = document.getElementById('btn-add-layer');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            pushUndo();
            addLayer();
        });
    }
}

// ── CAD Import: Parsers ──────────────────
function parseDXF(text, fileName) {
    const lines = text.split(/\r?\n/).map(l => l.trim());
    const result = { lines: [], arcs: [], info: { name: fileName, entityCount: 0, bounds: null } };

    // Find ENTITIES section
    let i = 0;
    while (i < lines.length - 3) {
        if (lines[i] === '0' && lines[i+1] === 'SECTION' && lines[i+2] === '2' && lines[i+3] === 'ENTITIES') { i += 4; break; }
        i++;
    }

    // Parse entities
    while (i < lines.length - 1) {
        if (lines[i] !== '0') { i++; continue; }
        const eType = lines[i+1];
        if (eType === 'ENDSEC' || eType === 'EOF') break;
        // Collect group codes
        const g = {}; const mg = { 10: [], 20: [], 30: [], 42: [] };
        i += 2;
        while (i < lines.length - 1 && lines[i] !== '0') {
            const code = parseInt(lines[i]);
            const val = lines[i+1];
            if (mg[code] !== undefined) mg[code].push(parseFloat(val));
            g[code] = isNaN(parseFloat(val)) ? val : parseFloat(val);
            i += 2;
        }

        if (eType === 'LINE') {
            const x1 = g[10] || 0, y1 = -(g[20] || 0), x2 = g[11] || 0, y2 = -(g[21] || 0);
            result.lines.push({ x1, y1, x2, y2 });
        } else if (eType === 'CIRCLE') {
            const cx = g[10] || 0, cy = -(g[20] || 0), r = g[40] || 0;
            result.arcs.push({ cx, cy, r, startAngle: 0, endAngle: Math.PI * 2 - 0.001, ccw: false });
        } else if (eType === 'ARC') {
            const cx = g[10] || 0, cy = -(g[20] || 0), r = g[40] || 0;
            const sa = (g[50] || 0) * Math.PI / 180;
            const ea = (g[51] || 0) * Math.PI / 180;
            // DXF Y flipped → negate angles
            result.arcs.push({ cx, cy, r, startAngle: -sa, endAngle: -ea, ccw: true });
        } else if (eType === 'LWPOLYLINE') {
            const xs = mg[10], ys = mg[20].map(v => -v), bulges = mg[42];
            const closed = !!((g[70] || 0) & 1);
            const n = xs.length;
            for (let j = 0; j < n - (closed ? 0 : 1); j++) {
                const j2 = (j + 1) % n;
                const bulge = bulges[j] || 0;
                if (Math.abs(bulge) < 1e-6) {
                    result.lines.push({ x1: xs[j], y1: ys[j], x2: xs[j2], y2: ys[j2] });
                } else {
                    const arc = bulgeToArc(xs[j], ys[j], xs[j2], ys[j2], bulge);
                    if (arc) result.arcs.push(arc);
                }
            }
        } else if (eType === 'SPLINE') {
            // Approximate with line segments from control points
            const xs = mg[10], ys = mg[20].map(v => -v);
            if (xs.length >= 2) {
                for (let j = 0; j < xs.length - 1; j++) {
                    result.lines.push({ x1: xs[j], y1: ys[j], x2: xs[j+1], y2: ys[j+1] });
                }
            }
        } else if (eType === 'ELLIPSE') {
            const cx = g[10] || 0, cy = -(g[20] || 0);
            const majDx = g[11] || 1, majDy = -(g[21] || 0);
            const majLen = Math.hypot(majDx, majDy);
            const rot = Math.atan2(majDy, majDx);
            const minLen = majLen * (g[40] || 1);
            const sp = g[41] || 0, ep = g[42] || (Math.PI * 2);
            const numSegs = 64;
            const paramRange = ep - sp;
            const cosR = Math.cos(rot), sinR = Math.sin(rot);
            for (let j = 0; j < numSegs; j++) {
                const t1 = sp + paramRange / numSegs * j;
                const t2 = sp + paramRange / numSegs * (j + 1);
                const px1 = majLen * Math.cos(t1), py1 = minLen * Math.sin(t1);
                const px2 = majLen * Math.cos(t2), py2 = minLen * Math.sin(t2);
                result.lines.push({
                    x1: cx + px1 * cosR - py1 * sinR,
                    y1: cy + px1 * sinR + py1 * cosR,
                    x2: cx + px2 * cosR - py2 * sinR,
                    y2: cy + px2 * sinR + py2 * cosR,
                });
            }
        }
    }

    // Compute bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const l of result.lines) {
        minX = Math.min(minX, l.x1, l.x2); minY = Math.min(minY, l.y1, l.y2);
        maxX = Math.max(maxX, l.x1, l.x2); maxY = Math.max(maxY, l.y1, l.y2);
    }
    for (const a of result.arcs) {
        minX = Math.min(minX, a.cx - a.r); minY = Math.min(minY, a.cy - a.r);
        maxX = Math.max(maxX, a.cx + a.r); maxY = Math.max(maxY, a.cy + a.r);
    }
    if (isFinite(minX)) result.info.bounds = { minX, minY, maxX, maxY };
    result.info.entityCount = result.lines.length + result.arcs.length;
    return result;
}

function bulgeToArc(x1, y1, x2, y2, bulge) {
    const dx = x2 - x1, dy = y2 - y1;
    const chord = Math.hypot(dx, dy);
    if (chord < 1e-10) return null;
    const sagitta = Math.abs(bulge) * chord / 2;
    const r = (chord * chord / 4 + sagitta * sagitta) / (2 * sagitta);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const nx = -dy / chord, ny = dx / chord;
    const d = r - sagitta;
    const sign = bulge > 0 ? -1 : 1;
    const cx = mx + sign * d * nx, cy = my + sign * d * ny;
    const startAngle = Math.atan2(y1 - cy, x1 - cx);
    const endAngle = Math.atan2(y2 - cy, x2 - cx);
    return { cx, cy, r, startAngle, endAngle, ccw: bulge > 0 };
}

function parseSVG(text, fileName) {
    const result = { lines: [], arcs: [], info: { name: fileName, entityCount: 0, bounds: null } };
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return result;

    function traverse(el) {
        const tag = el.tagName;
        if (tag === 'line') {
            result.lines.push({
                x1: parseFloat(el.getAttribute('x1') || 0), y1: parseFloat(el.getAttribute('y1') || 0),
                x2: parseFloat(el.getAttribute('x2') || 0), y2: parseFloat(el.getAttribute('y2') || 0),
            });
        } else if (tag === 'rect') {
            const x = parseFloat(el.getAttribute('x') || 0), y = parseFloat(el.getAttribute('y') || 0);
            const w = parseFloat(el.getAttribute('width') || 0), h = parseFloat(el.getAttribute('height') || 0);
            result.lines.push({ x1: x, y1: y, x2: x + w, y2: y });
            result.lines.push({ x1: x + w, y1: y, x2: x + w, y2: y + h });
            result.lines.push({ x1: x + w, y1: y + h, x2: x, y2: y + h });
            result.lines.push({ x1: x, y1: y + h, x2: x, y2: y });
        } else if (tag === 'circle') {
            const cx = parseFloat(el.getAttribute('cx') || 0), cy = parseFloat(el.getAttribute('cy') || 0);
            const r = parseFloat(el.getAttribute('r') || 0);
            result.arcs.push({ cx, cy, r, startAngle: 0, endAngle: Math.PI * 2 - 0.001, ccw: false });
        } else if (tag === 'ellipse') {
            const cx = parseFloat(el.getAttribute('cx') || 0), cy = parseFloat(el.getAttribute('cy') || 0);
            const rx = parseFloat(el.getAttribute('rx') || 0), ry = parseFloat(el.getAttribute('ry') || 0);
            if (Math.abs(rx - ry) < 0.01) {
                result.arcs.push({ cx, cy, r: rx, startAngle: 0, endAngle: Math.PI * 2 - 0.001, ccw: false });
            } else {
                // Approximate ellipse with line segments
                const segs = 32;
                for (let i = 0; i < segs; i++) {
                    const a1 = (2 * Math.PI / segs) * i, a2 = (2 * Math.PI / segs) * (i + 1);
                    result.lines.push({
                        x1: cx + rx * Math.cos(a1), y1: cy + ry * Math.sin(a1),
                        x2: cx + rx * Math.cos(a2), y2: cy + ry * Math.sin(a2),
                    });
                }
            }
        } else if (tag === 'polygon' || tag === 'polyline') {
            const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
            const coords = [];
            for (let i = 0; i < pts.length - 1; i += 2) coords.push({ x: pts[i], y: pts[i + 1] });
            for (let i = 0; i < coords.length - 1; i++) {
                result.lines.push({ x1: coords[i].x, y1: coords[i].y, x2: coords[i + 1].x, y2: coords[i + 1].y });
            }
            if (tag === 'polygon' && coords.length > 2) {
                result.lines.push({ x1: coords[coords.length - 1].x, y1: coords[coords.length - 1].y, x2: coords[0].x, y2: coords[0].y });
            }
        } else if (tag === 'path') {
            parseSVGPath(el.getAttribute('d') || '', result);
        }
        for (const child of el.children) traverse(child);
    }
    traverse(svg);

    // Compute bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const l of result.lines) {
        minX = Math.min(minX, l.x1, l.x2); minY = Math.min(minY, l.y1, l.y2);
        maxX = Math.max(maxX, l.x1, l.x2); maxY = Math.max(maxY, l.y1, l.y2);
    }
    for (const a of result.arcs) {
        minX = Math.min(minX, a.cx - a.r); minY = Math.min(minY, a.cy - a.r);
        maxX = Math.max(maxX, a.cx + a.r); maxY = Math.max(maxY, a.cy + a.r);
    }
    if (isFinite(minX)) result.info.bounds = { minX, minY, maxX, maxY };
    result.info.entityCount = result.lines.length + result.arcs.length;
    return result;
}

function parseSVGPath(d, result) {
    const tokens = d.match(/[a-zA-Z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g);
    if (!tokens) return;
    let cx = 0, cy = 0, startX = 0, startY = 0, cmd = '', i = 0;
    function num() { return parseFloat(tokens[i++]) || 0; }

    while (i < tokens.length) {
        const t = tokens[i];
        if (/[a-zA-Z]/.test(t)) { cmd = t; i++; } // new command letter
        const rel = cmd === cmd.toLowerCase();
        const C = cmd.toUpperCase();

        if (C === 'M') {
            const x = num(), y = num();
            cx = rel ? cx + x : x; cy = rel ? cy + y : y;
            startX = cx; startY = cy;
            cmd = rel ? 'l' : 'L'; // implicit lineto after moveto
        } else if (C === 'L') {
            const x = num(), y = num();
            const nx = rel ? cx + x : x, ny = rel ? cy + y : y;
            result.lines.push({ x1: cx, y1: cy, x2: nx, y2: ny });
            cx = nx; cy = ny;
        } else if (C === 'H') {
            const x = num(); const nx = rel ? cx + x : x;
            result.lines.push({ x1: cx, y1: cy, x2: nx, y2: cy });
            cx = nx;
        } else if (C === 'V') {
            const y = num(); const ny = rel ? cy + y : y;
            result.lines.push({ x1: cx, y1: cy, x2: cx, y2: ny });
            cy = ny;
        } else if (C === 'C') {
            // Cubic bezier → approximate with line segments
            const x1 = rel ? cx + num() : num(), y1 = rel ? cy + num() : num();
            const x2 = rel ? cx + num() : num(), y2 = rel ? cy + num() : num();
            const x3 = rel ? cx + num() : num(), y3 = rel ? cy + num() : num();
            const segs = 10; let px = cx, py = cy;
            for (let s = 1; s <= segs; s++) {
                const t = s / segs, mt = 1 - t;
                const bx = mt*mt*mt*cx + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*x3;
                const by = mt*mt*mt*cy + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t*t*t*y3;
                result.lines.push({ x1: px, y1: py, x2: bx, y2: by });
                px = bx; py = by;
            }
            cx = x3; cy = y3;
        } else if (C === 'Q') {
            const cpx = rel ? cx + num() : num(), cpy = rel ? cy + num() : num();
            const ex = rel ? cx + num() : num(), ey = rel ? cy + num() : num();
            const segs = 8; let px = cx, py = cy;
            for (let s = 1; s <= segs; s++) {
                const t = s / segs, mt = 1 - t;
                const bx = mt*mt*cx + 2*mt*t*cpx + t*t*ex;
                const by = mt*mt*cy + 2*mt*t*cpy + t*t*ey;
                result.lines.push({ x1: px, y1: py, x2: bx, y2: by });
                px = bx; py = by;
            }
            cx = ex; cy = ey;
        } else if (C === 'A') {
            const rx = num(), ry = num();
            num(); // x-axis-rotation (skip)
            const largeArc = num(), sweep = num();
            const ex = rel ? cx + num() : num(), ey = rel ? cy + num() : num();
            if (Math.abs(rx - ry) < 0.01 && rx > 0) {
                // Circular arc → convert to center parameterization
                const arc = svgArcToCenter(cx, cy, rx, largeArc, sweep, ex, ey);
                if (arc) result.arcs.push(arc);
            } else {
                // Elliptical → approximate with line segments
                const segs = 16; const dx = ex - cx, dy = ey - cy;
                for (let s = 0; s < segs; s++) {
                    const t1 = s / segs, t2 = (s + 1) / segs;
                    result.lines.push({ x1: cx + dx * t1, y1: cy + dy * t1, x2: cx + dx * t2, y2: cy + dy * t2 });
                }
            }
            cx = ex; cy = ey;
        } else if (C === 'Z') {
            if (Math.hypot(cx - startX, cy - startY) > 0.01) {
                result.lines.push({ x1: cx, y1: cy, x2: startX, y2: startY });
            }
            cx = startX; cy = startY;
        } else {
            i++; // unknown command, skip
        }
    }
}

function svgArcToCenter(x1, y1, r, largeArc, sweep, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-10 || r < 1e-10) return null;
    if (r < dist / 2) r = dist / 2;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const h = Math.sqrt(Math.max(0, r * r - (dist / 2) * (dist / 2)));
    const nx = -dy / dist, ny = dx / dist;
    const sign = (largeArc === sweep) ? -1 : 1;
    const cx = mx + sign * h * nx, cy = my + sign * h * ny;
    const startAngle = Math.atan2(y1 - cy, x1 - cx);
    const endAngle = Math.atan2(y2 - cy, x2 - cx);
    return { cx, cy, r, startAngle, endAngle, ccw: !sweep };
}

// ── CAD Import: Preview ──────────────────
function drawImportPreview(canvasEl, entities) {
    const pCtx = canvasEl.getContext('2d');
    const w = canvasEl.width, h = canvasEl.height;
    pCtx.clearRect(0, 0, w, h);
    pCtx.fillStyle = '#0a0a15';
    pCtx.fillRect(0, 0, w, h);

    const allLines = entities.lines || [];
    const allArcs = entities.arcs || [];
    if (allLines.length === 0 && allArcs.length === 0) return;

    // Compute bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const l of allLines) {
        minX = Math.min(minX, l.x1, l.x2); minY = Math.min(minY, l.y1, l.y2);
        maxX = Math.max(maxX, l.x1, l.x2); maxY = Math.max(maxY, l.y1, l.y2);
    }
    for (const a of allArcs) {
        minX = Math.min(minX, a.cx - a.r); minY = Math.min(minY, a.cy - a.r);
        maxX = Math.max(maxX, a.cx + a.r); maxY = Math.max(maxY, a.cy + a.r);
    }
    if (!isFinite(minX)) return;

    const geoW = maxX - minX || 1, geoH = maxY - minY || 1;
    const pad = 0.1;
    const scale = Math.min(w * (1 - pad * 2) / geoW, h * (1 - pad * 2) / geoH);
    const offX = (w - geoW * scale) / 2 - minX * scale;
    const offY = (h - geoH * scale) / 2 - minY * scale;

    pCtx.strokeStyle = '#4fc3f7';
    pCtx.lineWidth = 1;
    // Lines
    for (const l of allLines) {
        pCtx.beginPath();
        pCtx.moveTo(l.x1 * scale + offX, l.y1 * scale + offY);
        pCtx.lineTo(l.x2 * scale + offX, l.y2 * scale + offY);
        pCtx.stroke();
    }
    // Arcs
    for (const a of allArcs) {
        pCtx.beginPath();
        pCtx.arc(a.cx * scale + offX, a.cy * scale + offY, a.r * scale, a.startAngle, a.endAngle, a.ccw);
        pCtx.stroke();
    }
}

// ── KLE Raw Data parser ─────────────────────────────────────────────
// 外部 KLE 依存を避けた簡易実装。Keyboard Layout Editor の Raw Data を
// 配列 of rows (各 row は array of string|object) に変換して、Layout Studio の
// symbol として配置する。
function _parseKLERaw(rawText) {
    let text = rawText.trim();
    // ユーザーが「行配列」だけを貼ったケース (外側の [] が抜けてる) に対応
    let data;
    try {
        // 1) そのまま JSON parse を試す
        data = JSON.parse(text);
    } catch (e1) {
        // 2) [] でラップしてみる
        try {
            data = JSON.parse('[' + text + ']');
        } catch (e2) {
            // 3) 行を `,` でつないで wrap
            const rows = text.split(/\n+/).map(r => r.trim()).filter(r => r.length).join(',');
            data = JSON.parse('[' + rows + ']');
        }
    }
    if (!Array.isArray(data)) throw new Error('Top level is not an array');

    let startIdx = 0;
    if (data.length > 0 && !Array.isArray(data[0]) && typeof data[0] === 'object') {
        // metadata object — skip
        startIdx = 1;
    }

    const keys = [];
    let curY = 0;
    for (let r = startIdx; r < data.length; r++) {
        const row = data[r];
        if (!Array.isArray(row)) continue;
        let curX = 0;
        let nextW = 1, nextH = 1;
        let xMod = 0, yMod = 0;
        for (const item of row) {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
                if (typeof item.w === 'number') nextW = item.w;
                if (typeof item.h === 'number') nextH = item.h;
                if (typeof item.x === 'number') xMod += item.x;
                if (typeof item.y === 'number') yMod += item.y;
            } else {
                curX += xMod;
                curY += yMod;
                xMod = 0; yMod = 0;
                const label = (typeof item === 'string') ? item.split('\n')[0] : '';
                keys.push({ x: curX, y: curY, w: nextW, h: nextH, label });
                curX += nextW;
                nextW = 1;
                nextH = 1;
            }
        }
        curY += 1;
    }
    return keys;
}

// KLE のキー定義から Layout Studio の symbol を選ぶ。
// 幅 (w) によって 1u / 1.25u / 2u-stab / 2.25u-stab / 6.25u-stab / 7u-stab を割当て。
function _kleWidthToSymbolType(w) {
    if (w >= 6.5) return 'switch-7u-stab';
    if (w >= 6.0) return 'switch-6.25u-stab';
    if (w >= 2.5) return 'switch-2.75u-stab';
    if (w >= 2.1) return 'switch-2.25u-stab';
    if (w >= 1.75) return 'switch-2u-stab'; // 1.75u-2u は近い扱い
    if (w >= 1.2) return 'switch-1.25u';
    return 'switch-1u';
}

function importKLERawData(rawText) {
    const keys = _parseKLERaw(rawText);
    if (keys.length === 0) throw new Error('No keys found in KLE data');
    // クリア確認なしで上書き（ユーザー側で手動 confirm を出すなら呼出側で）
    const pitch = state.gridSize || PITCH;
    let added = 0;
    for (const k of keys) {
        const symType = _kleWidthToSymbolType(k.w);
        const def = SYMBOL_DEFS[symType];
        if (!def) continue;
        // KLE 座標は左上基点・y 下向き正。Layout Studio はミリ単位で配置。
        // キーの中心を世界座標 (mm) で計算
        const cx = (k.x + k.w / 2) * pitch;
        const cy = (k.y + k.h / 2) * pitch;
        const id = nextSymbolId++;
        symbols.push({
            id,
            type: symType,
            x: cx * PX_PER_MM,
            y: cy * PX_PER_MM,
            rotation: 0,
            layer: state.activeLayerId || 1,
            label: k.label || ''
        });
        added++;
    }
    drawCanvas();
    return added;
}

// ── CAD Export: DXF ──────────────────────
function exportToDXF() {
    const lines = state.cadLines;
    const syms = symbols;
    let dxf = '0\nSECTION\n2\nENTITIES\n';

    for (const l of lines) {
        const x1 = l.x1 / PX_PER_MM, y1 = -l.y1 / PX_PER_MM;
        const x2 = l.x2 / PX_PER_MM, y2 = -l.y2 / PX_PER_MM;

        if (l.arc) {
            const cx = l.arc.cx / PX_PER_MM, cy = -l.arc.cy / PX_PER_MM;
            const r = l.arc.r / PX_PER_MM;
            // DXF ARC angles in degrees, counterclockwise
            let sa = -l.arc.endAngle * 180 / Math.PI;
            let ea = -l.arc.startAngle * 180 / Math.PI;
            if (l.arc.ccw) { sa = -l.arc.startAngle * 180 / Math.PI; ea = -l.arc.endAngle * 180 / Math.PI; }
            while (sa < 0) sa += 360; while (ea < 0) ea += 360;
            dxf += `0\nARC\n8\n0\n10\n${cx}\n20\n${cy}\n40\n${r}\n50\n${sa}\n51\n${ea}\n`;
        } else if (l.bezier) {
            // Bezier → 16 segment polyline
            const cpx = l.bezier.cpx / PX_PER_MM, cpy = -l.bezier.cpy / PX_PER_MM;
            const segs = 16;
            for (let i = 0; i < segs; i++) {
                const t0 = i / segs, t1 = (i + 1) / segs;
                const bx0 = (1-t0)*(1-t0)*x1 + 2*(1-t0)*t0*cpx + t0*t0*x2;
                const by0 = (1-t0)*(1-t0)*y1 + 2*(1-t0)*t0*cpy + t0*t0*y2;
                const bx1 = (1-t1)*(1-t1)*x1 + 2*(1-t1)*t1*cpx + t1*t1*x2;
                const by1 = (1-t1)*(1-t1)*y1 + 2*(1-t1)*t1*cpy + t1*t1*y2;
                dxf += `0\nLINE\n8\n0\n10\n${bx0}\n20\n${by0}\n11\n${bx1}\n21\n${by1}\n`;
            }
        } else {
            dxf += `0\nLINE\n8\n0\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}\n`;
        }
    }

    // Symbols
    for (const sym of syms) {
        const def = SYMBOL_DEFS[sym.type];
        if (!def) continue;
        const cx = (sym.x + sym.width / 2) / PX_PER_MM;
        const cy = -(sym.y + sym.height / 2) / PX_PER_MM;
        const rot = (sym.rotation || 0) * Math.PI / 180;
        const cosR = Math.cos(rot), sinR = Math.sin(rot);

        const rp = (dx, dy) => ({ x: cx + dx * cosR - dy * sinR, y: cy + dx * sinR + dy * cosR });

        if (def.hasSwitch) {
            const half = SWITCH_SZ / 2;
            const corners = [rp(-half, -half), rp(half, -half), rp(half, half), rp(-half, half)];
            for (let i = 0; i < 4; i++) {
                const a = corners[i], b = corners[(i + 1) % 4];
                dxf += `0\nLINE\n8\nSWITCH\n10\n${a.x}\n20\n${a.y}\n11\n${b.x}\n21\n${b.y}\n`;
            }
        }
        if (def.hasStab) {
            const spacing = def.stabSpacing;
            const hw = STAB_W / 2, hh = STAB_H / 2;
            for (const side of [-1, 1]) {
                const ox = side * spacing / 2;
                const corners = [rp(ox - hw, -hh), rp(ox + hw, -hh), rp(ox + hw, hh), rp(ox - hw, hh)];
                for (let i = 0; i < 4; i++) {
                    const a = corners[i], b = corners[(i + 1) % 4];
                    dxf += `0\nLINE\n8\nSTAB\n10\n${a.x}\n20\n${a.y}\n11\n${b.x}\n21\n${b.y}\n`;
                }
            }
        }
        if (def.isScrew) {
            const r = def.screwDia / 2;
            dxf += `0\nCIRCLE\n8\nSCREW\n10\n${cx}\n20\n${cy}\n40\n${r}\n`;
        }
    }

    dxf += '0\nENDSEC\n0\nEOF\n';
    return dxf;
}

// ── CAD Export: SVG ──────────────────────
function exportToSVG() {
    const lines = state.cadLines;
    const syms = symbols;

    // Compute bounds in mm
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const l of lines) {
        const x1 = l.x1 / PX_PER_MM, y1 = l.y1 / PX_PER_MM;
        const x2 = l.x2 / PX_PER_MM, y2 = l.y2 / PX_PER_MM;
        minX = Math.min(minX, x1, x2); minY = Math.min(minY, y1, y2);
        maxX = Math.max(maxX, x1, x2); maxY = Math.max(maxY, y1, y2);
        if (l.bezier) {
            const cpx = l.bezier.cpx / PX_PER_MM, cpy = l.bezier.cpy / PX_PER_MM;
            minX = Math.min(minX, cpx); minY = Math.min(minY, cpy);
            maxX = Math.max(maxX, cpx); maxY = Math.max(maxY, cpy);
        }
        if (l.arc) {
            minX = Math.min(minX, l.arc.cx / PX_PER_MM - l.arc.r / PX_PER_MM);
            minY = Math.min(minY, l.arc.cy / PX_PER_MM - l.arc.r / PX_PER_MM);
            maxX = Math.max(maxX, l.arc.cx / PX_PER_MM + l.arc.r / PX_PER_MM);
            maxY = Math.max(maxY, l.arc.cy / PX_PER_MM + l.arc.r / PX_PER_MM);
        }
    }
    for (const sym of syms) {
        minX = Math.min(minX, sym.x / PX_PER_MM); minY = Math.min(minY, sym.y / PX_PER_MM);
        maxX = Math.max(maxX, (sym.x + sym.width) / PX_PER_MM); maxY = Math.max(maxY, (sym.y + sym.height) / PX_PER_MM);
    }
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 100; maxY = 100; }
    const margin = 2;
    minX -= margin; minY -= margin; maxX += margin; maxY += margin;
    const vw = maxX - minX, vh = maxY - minY;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${vw} ${vh}" width="${vw}mm" height="${vh}mm">\n`;
    svg += `<g fill="none" stroke="#000" stroke-width="0.2">\n`;

    for (const l of lines) {
        const x1 = l.x1 / PX_PER_MM, y1 = l.y1 / PX_PER_MM;
        const x2 = l.x2 / PX_PER_MM, y2 = l.y2 / PX_PER_MM;
        if (l.arc) {
            const r = l.arc.r / PX_PER_MM;
            const sa = l.arc.startAngle, ea = l.arc.endAngle;
            const sx = l.arc.cx / PX_PER_MM + r * Math.cos(sa);
            const sy = l.arc.cy / PX_PER_MM + r * Math.sin(sa);
            const ex = l.arc.cx / PX_PER_MM + r * Math.cos(ea);
            const ey = l.arc.cy / PX_PER_MM + r * Math.sin(ea);
            let sweep = ea - sa; if (l.arc.ccw) sweep = -sweep;
            while (sweep < 0) sweep += Math.PI * 2;
            const largeArc = sweep > Math.PI ? 1 : 0;
            const sweepFlag = l.arc.ccw ? 0 : 1;
            svg += `<path d="M${sx} ${sy} A${r} ${r} 0 ${largeArc} ${sweepFlag} ${ex} ${ey}" />\n`;
        } else if (l.bezier) {
            const cpx = l.bezier.cpx / PX_PER_MM, cpy = l.bezier.cpy / PX_PER_MM;
            svg += `<path d="M${x1} ${y1} Q${cpx} ${cpy} ${x2} ${y2}" />\n`;
        } else {
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />\n`;
        }
    }

    // Symbols
    for (const sym of syms) {
        const def = SYMBOL_DEFS[sym.type];
        if (!def) continue;
        const cx = (sym.x + sym.width / 2) / PX_PER_MM;
        const cy = (sym.y + sym.height / 2) / PX_PER_MM;
        const rot = sym.rotation || 0;
        const tr = rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : '';

        if (def.hasSwitch) {
            const half = SWITCH_SZ / 2;
            svg += `<rect x="${cx - half}" y="${cy - half}" width="${SWITCH_SZ}" height="${SWITCH_SZ}"${tr} />\n`;
        }
        if (def.hasStab) {
            const spacing = def.stabSpacing;
            for (const side of [-1, 1]) {
                const scx = cx + side * spacing / 2;
                svg += `<rect x="${scx - STAB_W / 2}" y="${cy - STAB_H / 2}" width="${STAB_W}" height="${STAB_H}"${tr} />\n`;
            }
        }
        if (def.isScrew) {
            const r = def.screwDia / 2;
            svg += `<circle cx="${cx}" cy="${cy}" r="${r}" />\n`;
        }
    }

    svg += `</g>\n</svg>`;
    return svg;
}

// ── CAD Export: Dialog ───────────────────
function openCadExportDialog() {
    let overlay = document.getElementById('cad-export-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'cad-export-overlay';
    overlay.className = 'export-popup-overlay';
    overlay.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; z-index:10000; justify-content:center; align-items:center; background:rgba(0,0,0,0); transition:background 0.3s;';
    document.body.appendChild(overlay);

    // Compute info
    const lineCount = state.cadLines.length;
    const symCount = symbols.length;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const l of state.cadLines) {
        minX = Math.min(minX, l.x1, l.x2); minY = Math.min(minY, l.y1, l.y2);
        maxX = Math.max(maxX, l.x1, l.x2); maxY = Math.max(maxY, l.y1, l.y2);
        if (l.arc) {
            minX = Math.min(minX, l.arc.cx - l.arc.r); minY = Math.min(minY, l.arc.cy - l.arc.r);
            maxX = Math.max(maxX, l.arc.cx + l.arc.r); maxY = Math.max(maxY, l.arc.cy + l.arc.r);
        }
    }
    for (const s of symbols) {
        minX = Math.min(minX, s.x); minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x + s.width); maxY = Math.max(maxY, s.y + s.height);
    }
    const dimW = isFinite(minX) ? ((maxX - minX) / PX_PER_MM).toFixed(1) : '0';
    const dimH = isFinite(minY) ? ((maxY - minY) / PX_PER_MM).toFixed(1) : '0';

    overlay.innerHTML = `
        <div class="export-popup" id="cad-export-popup" style="min-width:min(550px,95vw); max-width:min(650px,95vw);">
            <div class="export-popup-header">
                <h3 class="export-popup-title">CADエクスポート</h3>
                <span class="export-popup-format">DXF / SVG</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px; padding:16px;">
                <!-- Preview -->
                <div style="position:relative; width:100%; height:220px; background:#0a0a15; border-radius:6px; overflow:hidden;">
                    <canvas id="cad-export-preview" style="width:100%; height:100%;"></canvas>
                </div>
                <!-- Info Grid -->
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; font-size:0.8rem;">
                    <div style="background:#1a1a2e; border-radius:4px; padding:8px; text-align:center;">
                        <div style="color:#888; margin-bottom:2px;">線数</div>
                        <div style="color:#4fc3f7; font-size:1.1rem; font-weight:bold;">${lineCount}</div>
                    </div>
                    <div style="background:#1a1a2e; border-radius:4px; padding:8px; text-align:center;">
                        <div style="color:#888; margin-bottom:2px;">シンボル</div>
                        <div style="color:#4fc3f7; font-size:1.1rem; font-weight:bold;">${symCount}</div>
                    </div>
                    <div style="background:#1a1a2e; border-radius:4px; padding:8px; text-align:center;">
                        <div style="color:#888; margin-bottom:2px;">寸法 (mm)</div>
                        <div style="color:#4fc3f7; font-size:1.1rem; font-weight:bold;">${dimW} × ${dimH}</div>
                    </div>
                </div>
                <!-- Format Selection -->
                <div>
                    <label style="color:#888; font-size:0.75rem; display:block; margin-bottom:8px;">出力形式を選択</label>
                    <div style="display:flex; gap:10px;">
                        <label class="export-format-option" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; background:rgba(79,195,247,0.1); padding:12px; border-radius:8px; cursor:pointer; border:2px solid transparent; transition:all 0.2s;">
                            <input type="radio" name="cad-export-fmt" value="dxf" checked style="accent-color:#4fc3f7;">
                            <span style="color:#4fc3f7; font-weight:bold;">DXF</span>
                        </label>
                        <label class="export-format-option" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; background:rgba(76,175,80,0.1); padding:12px; border-radius:8px; cursor:pointer; border:2px solid transparent; transition:all 0.2s;">
                            <input type="radio" name="cad-export-fmt" value="svg" style="accent-color:#4caf50;">
                            <span style="color:#4caf50; font-weight:bold;">SVG</span>
                        </label>
                    </div>
                </div>
                <!-- Buttons -->
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button id="cad-export-cancel-btn" class="export-popup-cancel-btn" style="padding:6px 18px; border:1px solid #555; background:transparent; color:#aaa; border-radius:4px; cursor:pointer;">キャンセル</button>
                    <button id="cad-export-confirm-btn" style="padding:6px 18px; border:none; background:#4fc3f7; color:#111; border-radius:4px; cursor:pointer; font-weight:bold;">エクスポート</button>
                </div>
                <!-- Wiki Hint -->
                <div style="text-align:left; margin-top:4px;">
                    <span class="wiki-hint" style="font-size:0.7rem; color:#888; display:inline-flex; align-items:center; gap:4px; cursor:pointer;"
                        data-help-url-ja="https://keycapgeneratorwiki.com/ja/%E6%A9%9F%E8%83%BD%E3%83%AA%E3%83%95%E3%82%A1%E3%83%AC%E3%83%B3%E3%82%B9#:~:text=CAD%E3%82%A8%E3%82%AF%E3%82%B9%E3%83%9D%E3%83%BC%E3%83%88"
                        data-help-url-en="https://keycapgeneratorwiki.com/en/%E6%A9%9F%E8%83%BD%E3%83%AA%E3%83%95%E3%82%A1%E3%83%AC%E3%83%B3%E3%82%B9#:~:text=CAD%20Export"><span class="kbd" style="font-size:0.6rem; padding:2px 4px;">F1</span> <span>Wikiで詳しく見る</span></span>
                </div>
            </div>
        </div>
    `;

    const popup = document.getElementById('cad-export-popup');
    const previewCanvas = document.getElementById('cad-export-preview');
    const cancelBtn = document.getElementById('cad-export-cancel-btn');
    const confirmBtn = document.getElementById('cad-export-confirm-btn');

    function cleanup() {
        overlay.style.background = 'rgba(0,0,0,0)';
        popup.classList.remove('show');
        setTimeout(() => { overlay.style.display = 'none'; overlay.remove(); }, 300);
    }

    cancelBtn.addEventListener('click', cleanup);
    overlay.addEventListener('click', e => { if (e.target === overlay) cleanup(); });

    // F1 jump to wiki
    const wikiHint = popup.querySelector('.wiki-hint');
    function openWiki() {
        const lang = (typeof currentLanguage !== 'undefined' && currentLanguage === 'en') ? 'en' : 'ja';
        const url = wikiHint.dataset[`helpUrl${lang === 'ja' ? 'Ja' : 'En'}`];
        if (url) window.open(url, '_blank');
    }
    if (wikiHint) {
        wikiHint.addEventListener('click', openWiki);
    }
    const f1Handler = (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            openWiki();
        }
    };
    document.addEventListener('keydown', f1Handler);
    const originalCleanup = cleanup;
    cleanup = () => {
        document.removeEventListener('keydown', f1Handler);
        originalCleanup();
    };

    confirmBtn.addEventListener('click', () => {
        const fmt = document.querySelector('input[name="cad-export-fmt"]:checked').value;
        let content, mime, ext;
        if (fmt === 'svg') {
            content = exportToSVG();
            mime = 'image/svg+xml';
            ext = 'svg';
        } else {
            content = exportToDXF();
            mime = 'application/dxf';
            ext = 'dxf';
        }
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `layout-export.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        cleanup();
        if (showToast) showToast(`${ext.toUpperCase()} エクスポート完了`, 'success');
    });

    // Show with animation
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
        overlay.style.background = 'rgba(0,0,0,0.7)';
        popup.classList.add('show');
        setTimeout(() => {
            const rect = previewCanvas.parentElement.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            previewCanvas.width = rect.width * dpr;
            previewCanvas.height = rect.height * dpr;
            // Draw export preview (reuse import preview with current cadLines)
            const previewLines = [];
            const previewArcs = [];
            for (const l of state.cadLines) {
                if (l.arc) {
                    previewArcs.push({ cx: l.arc.cx, cy: l.arc.cy, r: l.arc.r, startAngle: l.arc.startAngle, endAngle: l.arc.endAngle, ccw: l.arc.ccw });
                } else if (l.bezier) {
                    // Convert bezier to line segments for preview
                    const segs = 16;
                    for (let i = 0; i < segs; i++) {
                        const t0 = i / segs, t1 = (i + 1) / segs;
                        previewLines.push({
                            x1: (1-t0)*(1-t0)*l.x1 + 2*(1-t0)*t0*l.bezier.cpx + t0*t0*l.x2,
                            y1: (1-t0)*(1-t0)*l.y1 + 2*(1-t0)*t0*l.bezier.cpy + t0*t0*l.y2,
                            x2: (1-t1)*(1-t1)*l.x1 + 2*(1-t1)*t1*l.bezier.cpx + t1*t1*l.x2,
                            y2: (1-t1)*(1-t1)*l.y1 + 2*(1-t1)*t1*l.bezier.cpy + t1*t1*l.y2,
                        });
                    }
                } else {
                    previewLines.push({ x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 });
                }
            }
            // Add symbol outlines to preview
            for (const sym of symbols) {
                const def = SYMBOL_DEFS[sym.type];
                if (!def) continue;
                const scx = sym.x + sym.width / 2, scy = sym.y + sym.height / 2;
                const r = (sym.rotation || 0) * Math.PI / 180;
                const cosR = Math.cos(r), sinR = Math.sin(r);
                const rp = (dx, dy) => ({ x: scx + dx * cosR - dy * sinR, y: scy + dx * sinR + dy * cosR });
                if (def.hasSwitch) {
                    const h = SWITCH_SZ * PX_PER_MM / 2;
                    const c = [rp(-h, -h), rp(h, -h), rp(h, h), rp(-h, h)];
                    for (let i = 0; i < 4; i++) previewLines.push({ x1: c[i].x, y1: c[i].y, x2: c[(i+1)%4].x, y2: c[(i+1)%4].y });
                }
                if (def.hasStab) {
                    const sp = def.stabSpacing * PX_PER_MM;
                    const hw = STAB_W * PX_PER_MM / 2, hh = STAB_H * PX_PER_MM / 2;
                    for (const side of [-1, 1]) {
                        const ox = side * sp / 2;
                        const c = [rp(ox - hw, -hh), rp(ox + hw, -hh), rp(ox + hw, hh), rp(ox - hw, hh)];
                        for (let i = 0; i < 4; i++) previewLines.push({ x1: c[i].x, y1: c[i].y, x2: c[(i+1)%4].x, y2: c[(i+1)%4].y });
                    }
                }
                if (def.isScrew) {
                    const rad = def.screwDia * PX_PER_MM / 2;
                    previewArcs.push({ cx: scx, cy: scy, r: rad, startAngle: 0, endAngle: Math.PI * 2, ccw: false });
                }
            }
            drawImportPreview(previewCanvas, { lines: previewLines, arcs: previewArcs });
        }, 50);
    });
}

// ── CAD Import: Dialog ───────────────────
function openCadImportDialog() {
    importedFiles = [];
    let activeIdx = -1;

    let overlay = document.getElementById('cad-import-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'cad-import-overlay';
    overlay.className = 'export-popup-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `
    <div class="export-popup" id="cad-import-popup" style="min-width:min(700px,95vw); max-width:min(800px,95vw);">
        <div class="export-popup-header">
            <h3 class="export-popup-title">CADインポート</h3>
            <span class="export-popup-format">DXF / SVG</span>
        </div>

        <div style="display:flex; gap:12px; min-height:320px; margin-top:12px;">
            <div style="width:200px; flex-shrink:0; border:1px solid #333; border-radius:8px; padding:10px; background:rgba(0,0,0,0.2); display:flex; flex-direction:column;">
                <div style="color:#80deea; font-size:0.7rem; font-weight:bold; margin-bottom:8px;">読み込みファイル</div>
                <div id="cad-import-file-list" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:4px;">
                    <div id="cad-import-empty" style="color:#555; font-size:0.7rem; text-align:center; padding:30px 0;">ファイルなし</div>
                </div>
                <button id="cad-import-add-btn" style="margin-top:8px; padding:8px; background:#004d40; border:1px dashed #4fc3f7; color:#e0f7fa; border-radius:4px; cursor:pointer; font-size:0.75rem; transition:all 0.2s;">
                    + ファイル追加
                </button>
                <input type="file" id="cad-import-file-input" accept=".dxf,.svg,.DXF,.SVG" style="display:none;" multiple>
            </div>

            <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
                <div style="flex:1; background:#0a0a15; border-radius:8px; position:relative; min-height:220px;">
                    <canvas id="cad-import-preview-canvas" style="width:100%; height:100%; display:block; border-radius:8px;"></canvas>
                    <div id="cad-import-no-preview" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#555; font-size:0.8rem; pointer-events:none;">
                        ファイルを選択してプレビュー
                    </div>
                </div>
                <div id="cad-import-info" style="display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; font-size:0.7rem;"></div>
            </div>
        </div>

        <div style="color:#666; font-size:0.65rem; margin-top:10px; padding:5px 8px; background:rgba(255,152,0,0.08); border-radius:4px; border:1px solid rgba(255,152,0,0.15);">
            DWG形式はDXFに変換してお使いください
        </div>

        <div class="export-popup-buttons" style="margin-top:12px;">
            <span style="flex:1;"></span>
            <button class="export-popup-btn cancel" id="cad-import-cancel-btn">キャンセル</button>
            <button class="export-popup-btn confirm" id="cad-import-confirm-btn" disabled>キャンバスに追加</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);

    const popup = document.getElementById('cad-import-popup');
    const addBtn = document.getElementById('cad-import-add-btn');
    const fileInput = document.getElementById('cad-import-file-input');
    const fileListEl = document.getElementById('cad-import-file-list');
    const previewCanvas = document.getElementById('cad-import-preview-canvas');
    const noPreview = document.getElementById('cad-import-no-preview');
    const infoEl = document.getElementById('cad-import-info');
    const cancelBtn = document.getElementById('cad-import-cancel-btn');
    const confirmBtn = document.getElementById('cad-import-confirm-btn');

    // Show
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
        overlay.style.background = 'rgba(0,0,0,0.7)';
        popup.classList.add('show');
        // Size preview canvas
        setTimeout(() => {
            const rect = previewCanvas.parentElement.getBoundingClientRect();
            previewCanvas.width = rect.width * (window.devicePixelRatio || 1);
            previewCanvas.height = rect.height * (window.devicePixelRatio || 1);
        }, 50);
    });

    function cleanup() {
        overlay.style.background = 'rgba(0,0,0,0)';
        popup.classList.remove('show');
        setTimeout(() => { overlay.style.display = 'none'; overlay.remove(); }, 300);
        importedFiles = [];
    }

    function renderFileList() {
        const emptyEl = document.getElementById('cad-import-empty');
        if (emptyEl) emptyEl.style.display = importedFiles.length === 0 ? '' : 'none';

        // Remove old items
        fileListEl.querySelectorAll('.cad-import-file-item').forEach(el => el.remove());

        importedFiles.forEach((f, idx) => {
            const item = document.createElement('div');
            item.className = 'cad-import-file-item';
            item.style.cssText = `padding:6px 8px; border:1px solid ${f.selected ? '#4fc3f7' : '#333'}; border-radius:4px; cursor:pointer; font-size:0.7rem; background:${f.selected ? 'rgba(79,195,247,0.12)' : 'rgba(0,0,0,0.15)'}; transition:all 0.15s;`;
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
                    <input type="checkbox" ${f.selected ? 'checked' : ''} style="accent-color:#4fc3f7; cursor:pointer;">
                    <span style="flex:1; color:${f.selected ? '#4fc3f7' : '#ccc'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${f.name}">${f.name}</span>
                    <button style="background:none; border:none; color:#666; cursor:pointer; font-size:0.8rem; padding:0 2px;" title="削除">&times;</button>
                </div>
                <div style="color:#888; font-size:0.6rem; margin-top:2px;">${f.info.entityCount} エンティティ</div>`;

            // Checkbox toggle
            item.querySelector('input[type=checkbox]').addEventListener('change', (e) => {
                f.selected = e.target.checked;
                renderFileList();
                updateConfirmBtn();
            });
            // Click to preview
            item.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
                selectPreview(idx);
            });
            // Delete
            item.querySelector('button').addEventListener('click', (e) => {
                e.stopPropagation();
                importedFiles.splice(idx, 1);
                if (activeIdx >= importedFiles.length) activeIdx = importedFiles.length - 1;
                renderFileList();
                if (activeIdx >= 0) selectPreview(activeIdx); else clearPreview();
                updateConfirmBtn();
            });
            fileListEl.appendChild(item);
        });
    }

    function selectPreview(idx) {
        activeIdx = idx;
        const f = importedFiles[idx];
        if (!f) { clearPreview(); return; }
        noPreview.style.display = 'none';
        // Re-size canvas
        const rect = previewCanvas.parentElement.getBoundingClientRect();
        previewCanvas.width = rect.width * (window.devicePixelRatio || 1);
        previewCanvas.height = rect.height * (window.devicePixelRatio || 1);
        drawImportPreview(previewCanvas, f.entities);

        // Info
        const b = f.info.bounds;
        const wMM = b ? (b.maxX - b.minX).toFixed(1) : '?';
        const hMM = b ? (b.maxY - b.minY).toFixed(1) : '?';
        const ext = f.name.split('.').pop().toUpperCase();
        infoEl.innerHTML = `
            <div style="color:#888;">ファイル名</div><div style="color:#e0f7fa;">${f.name}</div>
            <div style="color:#888;">形式</div><div style="color:#e0f7fa;">${ext}</div>
            <div style="color:#888;">エンティティ数</div><div style="color:#e0f7fa;">${f.info.entityCount}</div>
            <div style="color:#888;">寸法</div><div style="color:#e0f7fa;">${wMM} × ${hMM} mm</div>`;

        // Highlight active in list
        fileListEl.querySelectorAll('.cad-import-file-item').forEach((el, i) => {
            el.style.borderColor = i === idx ? '#4fc3f7' : (importedFiles[i].selected ? '#4fc3f799' : '#333');
        });
    }

    function clearPreview() {
        noPreview.style.display = '';
        const pCtx = previewCanvas.getContext('2d');
        pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        infoEl.innerHTML = '';
    }

    function updateConfirmBtn() {
        confirmBtn.disabled = !importedFiles.some(f => f.selected);
    }

    // File add
    addBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        for (const file of e.target.files) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const text = ev.target.result;
                const ext = file.name.split('.').pop().toLowerCase();
                let parsed;
                try {
                    if (ext === 'dxf') parsed = parseDXF(text, file.name);
                    else if (ext === 'svg') parsed = parseSVG(text, file.name);
                    else { if (showToast) showToast('未対応: ' + ext, true); return; }
                } catch (err) {
                    if (showToast) showToast('パースエラー: ' + err.message, true);
                    return;
                }
                importedFiles.push({ name: file.name, entities: parsed, info: parsed.info, selected: true });
                renderFileList();
                selectPreview(importedFiles.length - 1);
                updateConfirmBtn();
            };
            reader.readAsText(file);
        }
        fileInput.value = '';
    });

    // Cancel
    cancelBtn.addEventListener('click', cleanup);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });

    // Confirm
    confirmBtn.addEventListener('click', () => {
        const selected = importedFiles.filter(f => f.selected);
        if (selected.length === 0) return;
        addImportedToCanvas(selected);
        cleanup();
    });
}

// ── CAD Import: Add to Canvas ────────────
function addImportedToCanvas(selectedFiles) {
    pushUndo();
    let totalAdded = 0;

    for (const file of selectedFiles) {
        const ent = file.entities;
        const b = file.info.bounds;
        if (!b) continue;

        // Center at canvas view center
        const viewCenter = screenToWorld(canvas.width / 2, canvas.height / 2);
        const geoCX = (b.minX + b.maxX) / 2;
        const geoCY = (b.minY + b.maxY) / 2;
        const offX = viewCenter.x - geoCX * PX_PER_MM;
        const offY = viewCenter.y - geoCY * PX_PER_MM;

        for (const l of (ent.lines || [])) {
            state.cadLines.push({
                id: nextLineId++,
                x1: l.x1 * PX_PER_MM + offX, y1: l.y1 * PX_PER_MM + offY,
                x2: l.x2 * PX_PER_MM + offX, y2: l.y2 * PX_PER_MM + offY,
            });
            totalAdded++;
        }

        for (const a of (ent.arcs || [])) {
            const cx = a.cx * PX_PER_MM + offX;
            const cy = a.cy * PX_PER_MM + offY;
            const r = a.r * PX_PER_MM;
            state.cadLines.push({
                id: nextLineId++,
                x1: cx + r * Math.cos(a.startAngle), y1: cy + r * Math.sin(a.startAngle),
                x2: cx + r * Math.cos(a.endAngle), y2: cy + r * Math.sin(a.endAngle),
                arc: { cx, cy, r, startAngle: a.startAngle, endAngle: a.endAngle, ccw: a.ccw || false },
            });
            totalAdded++;
        }
    }

    drawCanvas();
    if (showToast) showToast(`${totalAdded} エンティティをインポートしました`);
}

// ── Coordinate Conversion ─────────────────
function screenToWorld(sx, sy) {
    const w = canvas.width, h = canvas.height;
    return {
        x: (sx - state.panX - w / 2) / state.zoom,
        y: (sy - state.panY - h / 2) / state.zoom,
    };
}

function worldToScreen(wx, wy) {
    const w = canvas.width, h = canvas.height;
    return {
        x: wx * state.zoom + state.panX + w / 2,
        y: wy * state.zoom + state.panY + h / 2,
    };
}

// ── Utility ───────────────────────────────
function snapWorld(wx, wy) {
    if (!state.snapToGrid) return { x: wx, y: wy };
    const g = state.gridSize * PX_PER_MM;
    const halfG = g / 2;
    return {
        x: Math.round(wx / halfG) * halfG,
        y: Math.round(wy / halfG) * halfG,
    };
}

function snapToEndpoint(wx, wy) {
    const tolerance = 10 / state.zoom;
    let bestDist = tolerance;
    let bestPoint = null;
    let bestType = null; // 'endpoint' | 'midpoint'
    for (const line of state.cadLines) {
        // Endpoints
        for (const pt of [{ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 }]) {
            const dist = Math.hypot(wx - pt.x, wy - pt.y);
            if (dist < bestDist) {
                bestDist = dist;
                bestPoint = { x: pt.x, y: pt.y };
                bestType = 'endpoint';
            }
        }
        // Midpoint (for straight lines and bezier curves)
        if (!line.arc) {
            let mx, my;
            if (line.bezier) {
                // Quadratic bezier midpoint at t=0.5
                mx = 0.25 * line.x1 + 0.5 * line.bezier.cpx + 0.25 * line.x2;
                my = 0.25 * line.y1 + 0.5 * line.bezier.cpy + 0.25 * line.y2;
            } else {
                mx = (line.x1 + line.x2) / 2;
                my = (line.y1 + line.y2) / 2;
            }
            const dist = Math.hypot(wx - mx, wy - my);
            if (dist < bestDist) {
                bestDist = dist;
                bestPoint = { x: mx, y: my, isMidpoint: true };
                bestType = 'midpoint';
            }
        }
    }
    return bestPoint;
}

function hitTestSymbol(wx, wy) {
    for (let i = symbols.length - 1; i >= 0; i--) {
        const s = symbols[i];
        if (s.rotation) {
            // Inverse-rotate test point around symbol center
            const cx = s.x + s.width / 2, cy = s.y + s.height / 2;
            const ang = -s.rotation * Math.PI / 180;
            const cosA = Math.cos(ang), sinA = Math.sin(ang);
            const dx = wx - cx, dy = wy - cy;
            const lx = cx + dx * cosA - dy * sinA;
            const ly = cy + dx * sinA + dy * cosA;
            if (lx >= s.x && lx <= s.x + s.width && ly >= s.y && ly <= s.y + s.height) return s;
        } else {
            if (wx >= s.x && wx <= s.x + s.width && wy >= s.y && wy <= s.y + s.height) return s;
        }
    }
    return null;
}

function hitTestLine(wx, wy, tolerance) {
    for (let i = state.cadLines.length - 1; i >= 0; i--) {
        const l = state.cadLines[i];
        if (l.arc) {
            // Arc hit test: check distance to arc curve
            const a = l.arc;
            const dist = Math.abs(Math.hypot(wx - a.cx, wy - a.cy) - a.r);
            if (dist <= tolerance) {
                // Check angle is within arc range
                const angle = Math.atan2(wy - a.cy, wx - a.cx);
                if (isAngleInArc(angle, a.startAngle, a.endAngle, a.ccw)) return l;
            }
        } else if (l.bezier) {
            // Bezier hit test: sample points along curve
            let minDist = Infinity;
            const segs = 16;
            for (let j = 0; j <= segs; j++) {
                const t = j / segs;
                const mt = 1 - t;
                const bx = mt * mt * l.x1 + 2 * mt * t * l.bezier.cpx + t * t * l.x2;
                const by = mt * mt * l.y1 + 2 * mt * t * l.bezier.cpy + t * t * l.y2;
                const d = Math.hypot(wx - bx, wy - by);
                if (d < minDist) minDist = d;
            }
            if (minDist <= tolerance) return l;
        } else {
            if (ptSegDist(wx, wy, l.x1, l.y1, l.x2, l.y2) <= tolerance) return l;
        }
    }
    return null;
}

function isAngleInArc(angle, start, end, ccw) {
    // Normalize angles to [0, 2PI)
    const norm = a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const a = norm(angle), s = norm(start), e = norm(end);
    if (ccw) {
        // Counter-clockwise: from start going backwards to end
        if (s >= e) return a <= s && a >= e;
        return a <= s || a >= e;
    } else {
        // Clockwise: from start going forward to end
        if (e >= s) return a >= s && a <= e;
        return a >= s || a <= e;
    }
}

function ptSegDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// ── Preset System ─────────────────────────
function applyPreset(presetId) {
    const p = LAYOUT_PRESETS[presetId];
    if (!p) return;

    // トグル: 同じプリセットを再度押したら解除
    if (state.activePreset === presetId) {
        state.activePreset = null;
        state.plateOutline = null;
        document.querySelectorAll('#layout-preset-buttons .layout-preset-btn').forEach(b => b.classList.remove('active'));
        drawCanvas();
        return;
    }

    pushUndo();

    state.activePreset = presetId;
    const pitch = state.gridSize;
    const wMM = p.totalW * pitch;
    const hMM = p.totalH * pitch;
    const wPx = wMM * PX_PER_MM;
    const hPx = hMM * PX_PER_MM;

    state.plateOutline = { x: -wPx / 2, y: -hPx / 2, w: wPx, h: hPx };

    // プリセット形状のCAD線を生成（原点中心の矩形）
    const lx = -wPx / 2, ty = -hPx / 2;
    const rx =  wPx / 2, by =  hPx / 2;
    state.cadLines.push(
        { id: nextLineId++, x1: lx, y1: ty, x2: rx, y2: ty },   // Top
        { id: nextLineId++, x1: rx, y1: ty, x2: rx, y2: by },   // Right
        { id: nextLineId++, x1: rx, y1: by, x2: lx, y2: by },   // Bottom
        { id: nextLineId++, x1: lx, y1: by, x2: lx, y2: ty },   // Left
    );

    document.querySelectorAll('#layout-preset-buttons .layout-preset-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`#layout-preset-buttons .layout-preset-btn[data-preset="${presetId}"]`);
    if (btn) btn.classList.add('active');

    drawCanvas();
    if (showToast) showToast(`プレート: ${p.label} (${wMM.toFixed(1)} × ${hMM.toFixed(1)} mm)`);
}

// ── Dimension Input System ────────────────
function ensureDimInput() {
    if (dimInputWrapper) return;
    dimInputWrapper = document.createElement('div');
    dimInputWrapper.style.cssText = 'position:absolute;z-index:100;display:none;align-items:center;gap:2px;pointer-events:auto;';

    dimInputEl = document.createElement('input');
    dimInputEl.type = 'text';
    dimInputEl.style.cssText = 'width:60px;padding:2px 4px;background:#111;color:#00e5ff;border:1px solid #00e5ff;font:bold 11px monospace;text-align:right;border-radius:3px;outline:none;';

    const mmLabel = document.createElement('span');
    mmLabel.textContent = 'mm';
    mmLabel.style.cssText = 'color:#00e5ff;font:bold 10px monospace;';

    dimInputWrapper.appendChild(dimInputEl);
    dimInputWrapper.appendChild(mmLabel);
    canvasContainer.appendChild(dimInputWrapper);

    dimInputEl.addEventListener('keydown', onDimInputKeyDown);
}

function showDimInput(mode) {
    ensureDimInput();
    let screenPos, initialValue;

    if (mode === 'line-length') {
        if (!lineStartWorld || !cursorWorldPos) return;
        const dx = cursorWorldPos.x - lineStartWorld.x;
        const dy = cursorWorldPos.y - lineStartWorld.y;
        const lengthMM = Math.sqrt(dx * dx + dy * dy) / PX_PER_MM;
        const midX = (lineStartWorld.x + cursorWorldPos.x) / 2;
        const midY = (lineStartWorld.y + cursorWorldPos.y) / 2;
        screenPos = worldToScreen(midX, midY);
        initialValue = lengthMM.toFixed(1);
    } else if (mode === 'rect-width') {
        if (!rectStartWorld || !rectCurWorld) return;
        const wMM = Math.abs(rectCurWorld.x - rectStartWorld.x) / PX_PER_MM;
        const rx = Math.min(rectStartWorld.x, rectCurWorld.x);
        const rw = Math.abs(rectCurWorld.x - rectStartWorld.x);
        const ry = Math.min(rectStartWorld.y, rectCurWorld.y);
        screenPos = worldToScreen(rx + rw / 2, ry);
        screenPos.y -= 10;
        initialValue = wMM.toFixed(1);
    } else if (mode === 'rect-height') {
        if (!rectStartWorld || !rectCurWorld) return;
        const hMM = Math.abs(rectCurWorld.y - rectStartWorld.y) / PX_PER_MM;
        const rx = Math.min(rectStartWorld.x, rectCurWorld.x);
        const rw = Math.abs(rectCurWorld.x - rectStartWorld.x);
        const ry = Math.min(rectStartWorld.y, rectCurWorld.y);
        const rh = Math.abs(rectCurWorld.y - rectStartWorld.y);
        screenPos = worldToScreen(rx + rw, ry + rh / 2);
        screenPos.x += 10;
        initialValue = hMM.toFixed(1);
    } else if (mode === 'gumball-dist') {
        if (!gumballMoveAxis) return;
        let cx, cy;
        if (gumballMoveSymId != null) {
            const sym = symbols.find(s => s.id === gumballMoveSymId);
            if (!sym) return;
            cx = sym.x + sym.width / 2; cy = sym.y + sym.height / 2;
        } else if (gumballMoveLineId != null) {
            const line = state.cadLines.find(l => l.id === gumballMoveLineId);
            if (!line) return;
            cx = (line.x1 + line.x2) / 2; cy = (line.y1 + line.y2) / 2;
        } else if (gumballMoveMultiCenter) {
            cx = gumballMoveMultiCenter.x; cy = gumballMoveMultiCenter.y;
        } else return;
        if (gumballMoveAxis === 'x') {
            screenPos = worldToScreen(cx, cy - 18 / state.zoom);
        } else {
            screenPos = worldToScreen(cx + 18 / state.zoom, cy);
        }
        initialValue = Math.abs(gumballDistance / PX_PER_MM).toFixed(1);
    } else if (mode === 'edit-line-length') {
        if (selectedLineIds.size !== 1) return;
        const lineId = [...selectedLineIds][0];
        const line = state.cadLines.find(l => l.id === lineId);
        if (!line) return;
        const lengthMM = Math.hypot(line.x2 - line.x1, line.y2 - line.y1) / PX_PER_MM;
        const midX = (line.x1 + line.x2) / 2;
        const midY = (line.y1 + line.y2) / 2;
        screenPos = worldToScreen(midX, midY);
        screenPos.y -= 16;
        initialValue = lengthMM.toFixed(1);
    } else if (mode === 'measure-dist') {
        if (!measureResult) return;
        const { p1, p2, dist: mDist } = measureResult;
        const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
        // Offset label position (same as drawMeasurement)
        const ddx = p2.x - p1.x, ddy = p2.y - p1.y;
        const lLen = Math.hypot(ddx, ddy);
        let mnx = 0, mny = -1;
        if (lLen > 0.001) { mnx = -ddy / lLen; mny = ddx / lLen; }
        const moff = 30 / state.zoom;
        const lx = midX + mnx * moff, ly = midY + mny * moff;
        screenPos = worldToScreen(lx, ly);
        screenPos.y -= 16;
        initialValue = (mDist / PX_PER_MM).toFixed(2);
    } else if (mode === 'circle-radius') {
        if (!circleCenter || !cursorWorldPos) return;
        const r = Math.hypot(cursorWorldPos.x - circleCenter.x, cursorWorldPos.y - circleCenter.y);
        screenPos = worldToScreen(circleCenter.x + 8 / state.zoom, circleCenter.y - 8 / state.zoom);
        initialValue = (r / PX_PER_MM).toFixed(2);
    } else if (mode === 'polygon-sides') {
        if (!polyCenter) return;
        screenPos = worldToScreen(polyCenter.x, polyCenter.y - 20 / state.zoom);
        initialValue = String(polySides);
    } else if (mode === 'polygon-radius') {
        if (!polyCenter) return;
        const r = polyRadius > 0 ? polyRadius
            : (cursorWorldPos ? Math.hypot(cursorWorldPos.x - polyCenter.x, cursorWorldPos.y - polyCenter.y) : 0);
        screenPos = worldToScreen(polyCenter.x + 8 / state.zoom, polyCenter.y + 8 / state.zoom);
        initialValue = (r / PX_PER_MM).toFixed(2);
    } else if (mode === 'rotation-angle') {
        if (!rotationModeActive || !rotationBasePoint) return;
        const angleDeg = rotationAngle * 180 / Math.PI;
        screenPos = worldToScreen(rotationBasePoint.x + 20 / state.zoom, rotationBasePoint.y - 20 / state.zoom);
        initialValue = angleDeg.toFixed(1);
    } else if (mode === 'copy-dist') {
        if (!copyModeActive || !copyBasePoint || !cursorWorldPos) return;
        const snapped = snapWorld(cursorWorldPos.x, cursorWorldPos.y);
        const dist = Math.hypot(snapped.x - copyBasePoint.x, snapped.y - copyBasePoint.y);
        screenPos = worldToScreen(snapped.x, snapped.y);
        screenPos.y -= 16;
        initialValue = (dist / PX_PER_MM).toFixed(1);
    } else if (mode === 'fillet-radius') {
        if (filletCorners.length > 0) {
            // Multi-fillet: position near the first corner
            const ref = filletCorners[0];
            const displayDist = filletRadius > 0.01 ? (filletRadius / Math.sin(ref.halfAngle)) * 0.5 : 30 / state.zoom;
            screenPos = worldToScreen(ref.corner.x + ref.bisector.x * displayDist, ref.corner.y + ref.bisector.y * displayDist);
            initialValue = (filletRadius / PX_PER_MM).toFixed(1);
        } else if (filletInfo) {
            const { corner, bisector, halfAngle } = filletInfo;
            const displayDist = filletRadius > 0.01 ? (filletRadius / Math.sin(halfAngle)) * 0.5 : 30 / state.zoom;
            screenPos = worldToScreen(corner.x + bisector.x * displayDist, corner.y + bisector.y * displayDist);
            initialValue = (filletRadius / PX_PER_MM).toFixed(1);
        } else return;
    } else return;

    dimInputMode = mode;
    dimInputWrapper.style.display = 'flex';
    dimInputWrapper.style.left = `${screenPos.x - 35}px`;
    dimInputWrapper.style.top = `${screenPos.y - 12}px`;
    dimInputEl.value = initialValue;
    dimInputEl.select();
    dimInputEl.focus();
}

function hideDimInput() {
    if (dimInputWrapper) dimInputWrapper.style.display = 'none';
    dimInputMode = null;
}

function applyDimInputPartial() {
    if (!dimInputEl) return;
    const val = parseFloat(dimInputEl.value);
    if (isNaN(val) || val <= 0) return;
    const worldVal = val * PX_PER_MM;

    if (dimInputMode === 'rect-width' && rectStartWorld && rectCurWorld) {
        const sign = (rectCurWorld.x >= rectStartWorld.x) ? 1 : -1;
        rectCurWorld.x = rectStartWorld.x + sign * worldVal;
    } else if (dimInputMode === 'rect-height' && rectStartWorld && rectCurWorld) {
        const sign = (rectCurWorld.y >= rectStartWorld.y) ? 1 : -1;
        rectCurWorld.y = rectStartWorld.y + sign * worldVal;
    }
    drawCanvas();
}

function commitDimInput() {
    if (!dimInputEl) return;
    const val = parseFloat(dimInputEl.value);
    if (isNaN(val)) { hideDimInput(); return; }
    if (val <= 0 && dimInputMode !== 'rotation-angle') { hideDimInput(); return; }
    const worldVal = val * PX_PER_MM;

    if (dimInputMode === 'line-length' && lineStartWorld) {
        pushUndo();
        let dx = 1, dy = 0;
        if (cursorWorldPos) {
            dx = cursorWorldPos.x - lineStartWorld.x;
            dy = cursorWorldPos.y - lineStartWorld.y;
        }
        const currentLen = Math.sqrt(dx * dx + dy * dy);
        if (currentLen > 0) { dx /= currentLen; dy /= currentLen; }
        state.cadLines.push({
            id: nextLineId++,
            x1: lineStartWorld.x, y1: lineStartWorld.y,
            x2: lineStartWorld.x + dx * worldVal,
            y2: lineStartWorld.y + dy * worldVal,
        });
        lineStartWorld = null;
    } else if ((dimInputMode === 'rect-width' || dimInputMode === 'rect-height') && rectStartWorld) {
        applyDimInputPartial();
        finalizeRect(); // finalizeRect has its own pushUndo
    } else if (dimInputMode === 'gumball-dist' && gumballMoveAxis) {
        pushUndo();
        const sign = gumballDistance >= 0 ? 1 : -1;
        if (gumballMoveSymId != null) {
            const sym = symbols.find(s => s.id === gumballMoveSymId);
            if (sym && gumballMoveOrigPos) {
                if (gumballMoveAxis === 'x') sym.x = gumballMoveOrigPos.x + sign * worldVal;
                else sym.y = gumballMoveOrigPos.y + sign * worldVal;
            }
        } else if (gumballMoveLineId != null) {
            const line = state.cadLines.find(l => l.id === gumballMoveLineId);
            if (line && gumballMoveOrigLine) {
                const d = sign * worldVal;
                if (gumballMoveAxis === 'x') {
                    line.x1 = gumballMoveOrigLine.x1 + d; line.x2 = gumballMoveOrigLine.x2 + d;
                    line.y1 = gumballMoveOrigLine.y1; line.y2 = gumballMoveOrigLine.y2;
                    if (line.arc && gumballMoveOrigLine.arc) line.arc.cx = gumballMoveOrigLine.arc.cx + d;
                    if (line.bezier && gumballMoveOrigLine.bezier) line.bezier.cpx = gumballMoveOrigLine.bezier.cpx + d;
                } else {
                    line.y1 = gumballMoveOrigLine.y1 + d; line.y2 = gumballMoveOrigLine.y2 + d;
                    line.x1 = gumballMoveOrigLine.x1; line.x2 = gumballMoveOrigLine.x2;
                    if (line.arc && gumballMoveOrigLine.arc) line.arc.cy = gumballMoveOrigLine.arc.cy + d;
                    if (line.bezier && gumballMoveOrigLine.bezier) line.bezier.cpy = gumballMoveOrigLine.bezier.cpy + d;
                }
                // Also move connected line endpoints
                for (const cl of gumballConnectedLines) {
                    const other = state.cadLines.find(l => l.id === cl.id);
                    if (!other) continue;
                    if (cl.matchEnd === 1) {
                        other.x1 = cl.origX1 + (gumballMoveAxis === 'x' ? d : 0);
                        other.y1 = cl.origY1 + (gumballMoveAxis === 'y' ? d : 0);
                    } else {
                        other.x2 = cl.origX2 + (gumballMoveAxis === 'x' ? d : 0);
                        other.y2 = cl.origY2 + (gumballMoveAxis === 'y' ? d : 0);
                    }
                }
            }
        } else if (gumballMoveMultiCenter) {
            const d = sign * worldVal;
            const dx = gumballMoveAxis === 'x' ? d : 0;
            const dy = gumballMoveAxis === 'y' ? d : 0;
            for (const ms of gumballMoveMultiSyms) {
                const s = symbols.find(sym => sym.id === ms.id);
                if (s) { s.x = ms.origX + dx; s.y = ms.origY + dy; }
            }
            for (const ml of gumballMoveMultiLines) {
                const l = state.cadLines.find(ln => ln.id === ml.id);
                if (!l) continue;
                l.x1 = ml.origX1 + dx; l.y1 = ml.origY1 + dy;
                l.x2 = ml.origX2 + dx; l.y2 = ml.origY2 + dy;
                if (l.arc && ml.arc) { l.arc.cx = ml.arc.cx + dx; l.arc.cy = ml.arc.cy + dy; }
                if (l.bezier && ml.bezier) { l.bezier.cpx = ml.bezier.cpx + dx; l.bezier.cpy = ml.bezier.cpy + dy; }
            }
        }
        resetGumballMove();
    } else if (dimInputMode === 'circle-radius') {
        if (circleCenter) {
            pushUndo();
            const r = worldVal;
            state.cadLines.push({
                id: nextLineId++,
                x1: circleCenter.x + r, y1: circleCenter.y,
                x2: circleCenter.x + r, y2: circleCenter.y,
                arc: { cx: circleCenter.x, cy: circleCenter.y, r, startAngle: 0, endAngle: Math.PI * 2 - 0.001, ccw: false },
            });
            circleCenter = null;
        }
    } else if (dimInputMode === 'polygon-sides') {
        // Change polygon side count (val is integer, not mm)
        const sides = Math.max(3, Math.round(val));
        polySides = sides;
        hideDimInput();
        drawCanvas();
        return; // don't hide again below
    } else if (dimInputMode === 'polygon-radius') {
        if (polyCenter) {
            pushUndo();
            const r = worldVal;
            const n = polySides;
            const angleOffset = polyRotation;
            for (let i = 0; i < n; i++) {
                const a1 = angleOffset + (2 * Math.PI / n) * i;
                const a2 = angleOffset + (2 * Math.PI / n) * ((i + 1) % n);
                state.cadLines.push({
                    id: nextLineId++,
                    x1: polyCenter.x + r * Math.cos(a1), y1: polyCenter.y + r * Math.sin(a1),
                    x2: polyCenter.x + r * Math.cos(a2), y2: polyCenter.y + r * Math.sin(a2),
                });
            }
            polyCenter = null;
            polyRadius = 0;
        }
    } else if (dimInputMode === 'edit-line-length') {
        if (selectedLineIds.size === 1) {
            const lineId = [...selectedLineIds][0];
            const line = state.cadLines.find(l => l.id === lineId);
            if (line) {
                pushUndo();
                const dx = line.x2 - line.x1, dy = line.y2 - line.y1;
                const curLen = Math.hypot(dx, dy);
                if (curLen > 0.001) {
                    const nx = dx / curLen, ny = dy / curLen;
                    line.x2 = line.x1 + nx * worldVal;
                    line.y2 = line.y1 + ny * worldVal;
                }
            }
        }
    } else if (dimInputMode === 'rotation-angle') {
        if (rotationModeActive && rotationBasePoint) {
            pushUndo();
            const angleRad = val * Math.PI / 180;
            applyRotationToAll(angleRad);
            resetRotationState();
        }
    } else if (dimInputMode === 'measure-dist') {
        if (measureResult && measureLine1Id != null && measureLine2Id != null) {
            const { p1, p2, dist: oldDist } = measureResult;
            if (oldDist > 0.001 && measureFollowLines) {
                pushUndo();
                const dx = p2.x - p1.x, dy = p2.y - p1.y;
                const nx = dx / oldDist, ny = dy / oldDist;
                const delta = worldVal - oldDist;
                const line2 = state.cadLines.find(l => l.id === measureLine2Id);
                if (line2) {
                    // 移動前に接続線を検索
                    const connected = findConnectedLines(measureLine2Id);
                    if (line2.arc) {
                        line2.arc.cx += nx * delta; line2.arc.cy += ny * delta;
                    }
                    line2.x1 += nx * delta; line2.y1 += ny * delta;
                    line2.x2 += nx * delta; line2.y2 += ny * delta;
                    // 接続された線の端点を追従させる
                    for (const cl of connected) {
                        const other = state.cadLines.find(l => l.id === cl.id);
                        if (!other || other.id === measureLine1Id) continue;
                        if (cl.matchEnd === 1) {
                            other.x1 += nx * delta; other.y1 += ny * delta;
                        } else {
                            other.x2 += nx * delta; other.y2 += ny * delta;
                        }
                    }
                    const l1 = state.cadLines.find(l => l.id === measureLine1Id);
                    if (l1) measureResult = computeLineDist(l1, line2);
                }
            } else if (!measureFollowLines) {
                // Just update the display value without moving lines
                measureResult = { ...measureResult, dist: worldVal };
            }
        }
    } else if (dimInputMode === 'copy-dist') {
        if (copyModeActive && copyBasePoint && cursorWorldPos) {
            const snapped = snapWorld(cursorWorldPos.x, cursorWorldPos.y);
            const oldDist = Math.hypot(snapped.x - copyBasePoint.x, snapped.y - copyBasePoint.y);
            if (oldDist > 0.01) {
                const dx = snapped.x - copyBasePoint.x;
                const dy = snapped.y - copyBasePoint.y;
                const nx = dx / oldDist, ny = dy / oldDist;
                // Override cursor to place at exact distance
                cursorWorldPos = { x: copyBasePoint.x + nx * worldVal, y: copyBasePoint.y + ny * worldVal };
            }
            placeCopies();
        }
    } else if (dimInputMode === 'fillet-radius') {
        if (filletCorners.length > 0) {
            pushUndo();
            filletRadius = Math.min(worldVal, filletMaxRadius);
            for (const info of filletCorners) applyFilletToCorner(info, filletRadius);
            resetFilletState();
            selectedLineIds.clear();
        } else if (filletInfo) {
            pushUndo();
            filletRadius = Math.min(worldVal, filletInfo.maxRadius);
            applyFilletToCorner(filletInfo, filletRadius);
            resetFilletState();
        }
    }
    hideDimInput();
    drawCanvas();
}

function onDimInputKeyDown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        commitDimInput();
    } else if (e.key === 'Tab') {
        e.preventDefault();
        if (dimInputMode === 'rect-width') {
            applyDimInputPartial();
            showDimInput('rect-height');
        } else if (dimInputMode === 'rect-height') {
            applyDimInputPartial();
            showDimInput('rect-width');
        } else if (dimInputMode === 'polygon-sides') {
            // Save sides count, then switch to radius input
            const sides = Math.max(3, Math.round(parseFloat(dimInputEl.value) || polySides));
            polySides = sides;
            hideDimInput();
            drawCanvas();
            showDimInput('polygon-radius');
        } else if (dimInputMode === 'polygon-radius') {
            // Save radius, then cycle back to sides
            const rv = parseFloat(dimInputEl.value);
            if (!isNaN(rv) && rv > 0) {
                polyRadius = rv * PX_PER_MM;
            }
            hideDimInput();
            drawCanvas();
            showDimInput('polygon-sides');
        }
    } else if (e.key === 'Escape') {
        e.preventDefault();
        hideDimInput();
        drawCanvas();
    }
}

// ── Tool System ───────────────────────────
function setTool(tool) {
    if (dimInputMode) hideDimInput();
    clearPendingSymbol();
    cancelGumballMove();
    resetFilletState();
    resetTrimState();
    resetAlignState();
    resetMirrorState();
    cancelCopyMode();
    if (rotationModeActive) cancelRotation();

    // トグル: 同じツールを再度押したら解除
    if (state.activeTool === tool) {
        state.activeTool = null;
        lineStartWorld = null;
        rectStartWorld = null; rectCurWorld = null;
        circleCenter = null; polyCenter = null; curvePoints = [];
        updateToolBtnStates();
        updateCursor();
        drawCanvas();
        return;
    }

    state.activeTool = tool;
    lineStartWorld = null;
    rectStartWorld = null; rectCurWorld = null;
    circleCenter = null; polyCenter = null; curvePoints = [];
    updateToolBtnStates();

    // Auto-detect multi-fillet when switching to fillet with lines selected
    if (tool === 'fillet' && selectedLineIds.size >= 2) {
        const corners = findAllCorners([...selectedLineIds]);
        if (corners.length > 0) {
            filletCorners = corners;
            filletRadius = 0;
        }
    }

    updateCursor();
    drawCanvas();
}

function clearPendingSymbol() {
    pendingSymbolType = null;
    document.querySelectorAll('.layout-symbol-item').forEach(i => i.classList.remove('active'));
}

function updateCursor() {
    if (!canvas) return;
    if (pendingSymbolType) { canvas.style.cursor = 'copy'; return; }
    if (copyModeActive) { canvas.style.cursor = 'copy'; return; }
    if (rotationModeActive) { canvas.style.cursor = 'crosshair'; return; }
    const map = { line: 'crosshair', rect: 'crosshair', fillet: 'crosshair', circle: 'crosshair', polygon: 'crosshair', curve: 'crosshair', trim: 'crosshair', align: 'crosshair', mirror: 'crosshair' };
    canvas.style.cursor = map[state.activeTool] || 'default';
}

// ── Gumball ──────────────────────────────
function getGumballArrows() {
    if (!layoutGumballActive) return null;
    const arrowLen = 60 / state.zoom;
    // Symbol gumball
    if (selectedIds.size === 1) {
        const symId = [...selectedIds][0];
        const sym = symbols.find(s => s.id === symId);
        if (!sym) return null;
        const cx = sym.x + sym.width / 2;
        const cy = sym.y + sym.height / 2;
        return { sym, line: null, cx, cy, xEnd: { x: cx + arrowLen, y: cy }, yEnd: { x: cx, y: cy + arrowLen }, arrowLen };
    }
    // Line gumball
    if (selectedLineIds.size === 1) {
        const lineId = [...selectedLineIds][0];
        const line = state.cadLines.find(l => l.id === lineId);
        if (!line) return null;
        const cx = (line.x1 + line.x2) / 2;
        const cy = (line.y1 + line.y2) / 2;
        return { sym: null, line, cx, cy, xEnd: { x: cx + arrowLen, y: cy }, yEnd: { x: cx, y: cy + arrowLen }, arrowLen };
    }
    // Multi-select gumball
    if (selectedIds.size + selectedLineIds.size > 1) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const sid of selectedIds) {
            const s = symbols.find(sym => sym.id === sid);
            if (!s) continue;
            minX = Math.min(minX, s.x); minY = Math.min(minY, s.y);
            maxX = Math.max(maxX, s.x + s.width); maxY = Math.max(maxY, s.y + s.height);
        }
        for (const lid of selectedLineIds) {
            const l = state.cadLines.find(ln => ln.id === lid);
            if (!l) continue;
            minX = Math.min(minX, l.x1, l.x2); minY = Math.min(minY, l.y1, l.y2);
            maxX = Math.max(maxX, l.x1, l.x2); maxY = Math.max(maxY, l.y1, l.y2);
            if (l.arc) {
                minX = Math.min(minX, l.arc.cx - l.arc.r); minY = Math.min(minY, l.arc.cy - l.arc.r);
                maxX = Math.max(maxX, l.arc.cx + l.arc.r); maxY = Math.max(maxY, l.arc.cy + l.arc.r);
            }
        }
        if (!isFinite(minX)) return null;
        const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
        return { sym: null, line: null, multi: true, cx, cy, xEnd: { x: cx + arrowLen, y: cy }, yEnd: { x: cx, y: cy + arrowLen }, arrowLen };
    }
    return null;
}

function hitTestGumball(wx, wy) {
    const arrows = getGumballArrows();
    if (!arrows) return null;
    const tol = 8 / state.zoom;
    if (ptSegDist(wx, wy, arrows.cx, arrows.cy, arrows.xEnd.x, arrows.xEnd.y) < tol) return 'x';
    if (ptSegDist(wx, wy, arrows.cx, arrows.cy, arrows.yEnd.x, arrows.yEnd.y) < tol) return 'y';
    return null;
}

function cancelGumballMove() {
    if (!gumballMoveAxis) return;
    if (gumballMoveSymId != null) {
        const sym = symbols.find(s => s.id === gumballMoveSymId);
        if (sym && gumballMoveOrigPos) { sym.x = gumballMoveOrigPos.x; sym.y = gumballMoveOrigPos.y; }
    }
    if (gumballMoveLineId != null) {
        const line = state.cadLines.find(l => l.id === gumballMoveLineId);
        if (line && gumballMoveOrigLine) {
            line.x1 = gumballMoveOrigLine.x1; line.y1 = gumballMoveOrigLine.y1;
            line.x2 = gumballMoveOrigLine.x2; line.y2 = gumballMoveOrigLine.y2;
            if (line.arc && gumballMoveOrigLine.arc) {
                line.arc.cx = gumballMoveOrigLine.arc.cx;
                line.arc.cy = gumballMoveOrigLine.arc.cy;
            }
            if (line.bezier && gumballMoveOrigLine.bezier) {
                line.bezier.cpx = gumballMoveOrigLine.bezier.cpx;
                line.bezier.cpy = gumballMoveOrigLine.bezier.cpy;
            }
        }
        for (const cl of gumballConnectedLines) {
            const other = state.cadLines.find(l => l.id === cl.id);
            if (other) {
                other.x1 = cl.origX1; other.y1 = cl.origY1;
                other.x2 = cl.origX2; other.y2 = cl.origY2;
            }
        }
    }
    if (gumballMoveMultiCenter) {
        for (const ms of gumballMoveMultiSyms) {
            const s = symbols.find(sym => sym.id === ms.id);
            if (s) { s.x = ms.origX; s.y = ms.origY; }
        }
        for (const ml of gumballMoveMultiLines) {
            const l = state.cadLines.find(ln => ln.id === ml.id);
            if (!l) continue;
            l.x1 = ml.origX1; l.y1 = ml.origY1; l.x2 = ml.origX2; l.y2 = ml.origY2;
            if (l.arc && ml.arc) { l.arc.cx = ml.arc.cx; l.arc.cy = ml.arc.cy; }
            if (l.bezier && ml.bezier) { l.bezier.cpx = ml.bezier.cpx; l.bezier.cpy = ml.bezier.cpy; }
        }
    }
    resetGumballMove();
}

function resetGumballMove() {
    gumballMoveAxis = null;
    gumballMoveSymId = null;
    gumballMoveOrigPos = null;
    gumballMoveLineId = null;
    gumballMoveOrigLine = null;
    gumballConnectedLines = [];
    gumballMoveMultiSyms = [];
    gumballMoveMultiLines = [];
    gumballMoveMultiCenter = null;
    gumballDistance = 0;
    updateCursor();
}

function findConnectedLines(lineId) {
    const line = state.cadLines.find(l => l.id === lineId);
    if (!line) return [];
    const eps = [
        { x: line.x1, y: line.y1, which: 1 },
        { x: line.x2, y: line.y2, which: 2 },
    ];
    const tol = 0.5;
    const result = [];
    for (const other of state.cadLines) {
        if (other.id === lineId || other.arc) continue;
        for (const ep of eps) {
            let end1 = 0, end2 = 0;
            if (Math.hypot(other.x1 - ep.x, other.y1 - ep.y) < tol) end1 = 1;
            if (Math.hypot(other.x2 - ep.x, other.y2 - ep.y) < tol) end2 = 1;
            if (end1 || end2) {
                result.push({
                    id: other.id,
                    origX1: other.x1, origY1: other.y1,
                    origX2: other.x2, origY2: other.y2,
                    matchEnd: end1 ? 1 : 2, // which endpoint of the OTHER line matches
                    srcEnd: ep.which,        // which endpoint of the MOVED line it connects to
                });
            }
        }
    }
    return result;
}

// ── Fillet ────────────────────────────────
function resetFilletState() {
    filletLine1Id = null;
    filletInfo = null;
    filletCorners = [];
    filletRadius = 0;
    filletMaxRadius = 0;
}

function findFilletCorner(line1, line2) {
    const pts1 = [{ x: line1.x1, y: line1.y1, end: 1 }, { x: line1.x2, y: line1.y2, end: 2 }];
    const pts2 = [{ x: line2.x1, y: line2.y1, end: 1 }, { x: line2.x2, y: line2.y2, end: 2 }];
    let best = null, bestDist = Infinity;
    for (const p1 of pts1) {
        for (const p2 of pts2) {
            const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (d < bestDist) { bestDist = d; best = { p1, p2 }; }
        }
    }
    if (!best || bestDist > 8 / state.zoom) return null;

    const corner = { x: (best.p1.x + best.p2.x) / 2, y: (best.p1.y + best.p2.y) / 2 };
    const other1 = best.p1.end === 1
        ? { x: line1.x2, y: line1.y2 } : { x: line1.x1, y: line1.y1 };
    const other2 = best.p2.end === 1
        ? { x: line2.x2, y: line2.y2 } : { x: line2.x1, y: line2.y1 };

    const raw1 = { x: other1.x - corner.x, y: other1.y - corner.y };
    const raw2 = { x: other2.x - corner.x, y: other2.y - corner.y };
    const len1 = Math.hypot(raw1.x, raw1.y);
    const len2 = Math.hypot(raw2.x, raw2.y);
    if (len1 < 0.01 || len2 < 0.01) return null;

    const d1 = { x: raw1.x / len1, y: raw1.y / len1 };
    const d2 = { x: raw2.x / len2, y: raw2.y / len2 };
    const dot = d1.x * d2.x + d1.y * d2.y;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (angle < 0.05 || angle > Math.PI - 0.05) return null;

    const halfAngle = angle / 2;
    const maxRadius = Math.min(len1, len2) * Math.tan(halfAngle);
    const bx = d1.x + d2.x, by = d1.y + d2.y;
    const bLen = Math.hypot(bx, by);
    if (bLen < 0.01) return null;
    const bisector = { x: bx / bLen, y: by / bLen };

    return { corner, d1, d2, len1, len2, angle, halfAngle, maxRadius, bisector,
             line1, line2, end1: best.p1.end, end2: best.p2.end };
}

function applyFilletToCorner(info, radius) {
    if (!info || radius < 0.01) return;
    const { corner, d1, d2, halfAngle, bisector, line1, line2, end1, end2 } = info;
    const r = Math.min(radius, info.maxRadius);
    const t = r / Math.tan(halfAngle);

    const t1 = { x: corner.x + t * d1.x, y: corner.y + t * d1.y };
    const t2 = { x: corner.x + t * d2.x, y: corner.y + t * d2.y };

    // Trim lines
    if (end1 === 1) { line1.x1 = t1.x; line1.y1 = t1.y; }
    else { line1.x2 = t1.x; line1.y2 = t1.y; }
    if (end2 === 1) { line2.x1 = t2.x; line2.y1 = t2.y; }
    else { line2.x2 = t2.x; line2.y2 = t2.y; }

    // Arc center
    const centerDist = r / Math.sin(halfAngle);
    const center = { x: corner.x + centerDist * bisector.x, y: corner.y + centerDist * bisector.y };

    const startAngle = Math.atan2(t1.y - center.y, t1.x - center.x);
    const endAngle = Math.atan2(t2.y - center.y, t2.x - center.x);
    let delta = endAngle - startAngle;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    // Store as vector arc (single cadLine with arc data)
    state.cadLines.push({
        id: nextLineId++,
        x1: t1.x, y1: t1.y, x2: t2.x, y2: t2.y,
        arc: { cx: center.x, cy: center.y, r, startAngle, endAngle, ccw: delta < 0 },
    });
}

function findAllCorners(lineIds) {
    const lines = lineIds.map(id => state.cadLines.find(l => l.id === id)).filter(Boolean);
    const corners = [];
    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            const info = findFilletCorner(lines[i], lines[j]);
            if (info) corners.push(info);
        }
    }
    if (corners.length <= 1) return corners;

    // Compute safe maxRadius: account for lines shared between multiple corners
    const lineCornerCount = new Map();
    for (const c of corners) {
        lineCornerCount.set(c.line1.id, (lineCornerCount.get(c.line1.id) || 0) + 1);
        lineCornerCount.set(c.line2.id, (lineCornerCount.get(c.line2.id) || 0) + 1);
    }
    let safeMax = Infinity;
    for (const c of corners) {
        const cnt1 = lineCornerCount.get(c.line1.id) || 1;
        const cnt2 = lineCornerCount.get(c.line2.id) || 1;
        const maxR1 = c.len1 * Math.tan(c.halfAngle) / cnt1;
        const maxR2 = c.len2 * Math.tan(c.halfAngle) / cnt2;
        safeMax = Math.min(safeMax, maxR1, maxR2);
    }
    filletMaxRadius = safeMax;
    return corners;
}

function handleFilletClick(world, shift) {
    const tol = 8 / state.zoom;

    // Multi-fillet in progress → finalize all corners
    if (filletCorners.length > 0) {
        if (filletRadius > 0.01) {
            pushUndo();
            for (const info of filletCorners) applyFilletToCorner(info, filletRadius);
        }
        resetFilletState();
        selectedLineIds.clear();
        drawCanvas();
        return;
    }

    // Single-fillet radius adjustment mode → finalize
    if (filletInfo) {
        if (filletRadius > 0.01) { pushUndo(); applyFilletToCorner(filletInfo, filletRadius); }
        resetFilletState();
        drawCanvas();
        return;
    }

    // Shift-click for line selection in fillet tool
    const lineHit = hitTestLine(world.x, world.y, tol);
    if (lineHit && shift) {
        if (selectedLineIds.has(lineHit.id)) selectedLineIds.delete(lineHit.id);
        else selectedLineIds.add(lineHit.id);
        drawCanvas();
        return;
    }

    // Check for multi-selection → auto multi-fillet
    if (filletLine1Id == null && selectedLineIds.size >= 2) {
        const corners = findAllCorners([...selectedLineIds]);
        if (corners.length > 0) {
            filletCorners = corners;
            filletRadius = 0;
            drawCanvas();
            return;
        }
    }

    // Normal single-fillet: click first line, then second
    if (!lineHit) { resetFilletState(); drawCanvas(); return; }

    if (filletLine1Id == null) {
        filletLine1Id = lineHit.id;
        drawCanvas();
    } else {
        if (lineHit.id === filletLine1Id) return;
        const line1 = state.cadLines.find(l => l.id === filletLine1Id);
        if (!line1) { resetFilletState(); return; }
        const info = findFilletCorner(line1, lineHit);
        if (!info) {
            if (showToast) showToast('共有コーナーが見つかりません');
            resetFilletState();
            drawCanvas();
            return;
        }
        filletInfo = info;
        filletRadius = 0;
        drawCanvas();
    }
}

// ── Measurement ──────────────────────────
function resetMeasurement() {
    measureLine1Id = null;
    measureLine2Id = null;
    measureResult = null;
}

function handleMeasureClick(world) {
    const tol = 8 / state.zoom;

    // If measurement result exists, check if clicking near the label → edit distance
    if (measureResult) {
        const { p1, p2 } = measureResult;
        const ddx = p2.x - p1.x, ddy = p2.y - p1.y;
        const lLen = Math.hypot(ddx, ddy);
        let mnx = 0, mny = -1;
        if (lLen > 0.001) { mnx = -ddy / lLen; mny = ddx / lLen; }
        const moff = 30 / state.zoom;
        const labelX = (p1.x + p2.x) / 2 + mnx * moff;
        const labelY = (p1.y + p2.y) / 2 + mny * moff;
        const labelDist = Math.hypot(world.x - labelX, world.y - labelY);
        if (labelDist < 20 / state.zoom) {
            showDimInput('measure-dist');
            return;
        }
    }

    const lineHit = hitTestLine(world.x, world.y, tol);
    if (!lineHit) { resetMeasurement(); drawCanvas(); return; }

    if (measureLine1Id == null) {
        measureLine1Id = lineHit.id;
        drawCanvas();
    } else if (measureLine2Id == null) {
        if (lineHit.id === measureLine1Id) return;
        measureLine2Id = lineHit.id;
        const line1 = state.cadLines.find(l => l.id === measureLine1Id);
        const line2 = state.cadLines.find(l => l.id === measureLine2Id);
        if (line1 && line2) {
            measureResult = computeLineDist(line1, line2);
        }
        drawCanvas();
    } else {
        // Reset and start new measurement
        resetMeasurement();
        measureLine1Id = lineHit.id;
        drawCanvas();
    }
}

function computeLineDist(line1, line2) {
    // Find closest point pair between two line segments
    const pts1 = line1.arc ? sampleArcPoints(line1.arc, 16) :
        [{ x: line1.x1, y: line1.y1 }, { x: line1.x2, y: line1.y2 }];
    const pts2 = line2.arc ? sampleArcPoints(line2.arc, 16) :
        [{ x: line2.x1, y: line2.y1 }, { x: line2.x2, y: line2.y2 }];

    let bestDist = Infinity, bestP1 = null, bestP2 = null;

    // For straight lines, use analytical closest point
    if (!line1.arc && !line2.arc) {
        // Check all 4 endpoint-to-segment combinations + segment-segment
        const checks = [
            closestOnSeg(line1.x1, line1.y1, line2),
            closestOnSeg(line1.x2, line1.y2, line2),
            closestOnSeg(line2.x1, line2.y1, line1),
            closestOnSeg(line2.x2, line2.y2, line1),
        ];
        for (const c of checks) {
            if (c.dist < bestDist) { bestDist = c.dist; bestP1 = c.p1; bestP2 = c.p2; }
        }
    } else {
        // Sample-based for arcs
        for (const p1 of pts1) {
            for (const p2 of pts2) {
                const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (d < bestDist) { bestDist = d; bestP1 = p1; bestP2 = p2; }
            }
        }
    }
    return { dist: bestDist, p1: bestP1, p2: bestP2 };
}

function sampleArcPoints(arc, n) {
    const pts = [];
    let delta = arc.endAngle - arc.startAngle;
    if (arc.ccw) { if (delta > 0) delta -= 2 * Math.PI; }
    else { if (delta < 0) delta += 2 * Math.PI; }
    for (let i = 0; i <= n; i++) {
        const a = arc.startAngle + (delta / n) * i;
        pts.push({ x: arc.cx + arc.r * Math.cos(a), y: arc.cy + arc.r * Math.sin(a) });
    }
    return pts;
}

function closestOnSeg(px, py, line) {
    const dx = line.x2 - line.x1, dy = line.y2 - line.y1;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - line.x1) * dx + (py - line.y1) * dy) / lenSq));
    const cx = line.x1 + t * dx, cy = line.y1 + t * dy;
    return { dist: Math.hypot(px - cx, py - cy), p1: { x: px, y: py }, p2: { x: cx, y: cy } };
}

function drawMeasurement() {
    if (!layoutMeasureActive) return;
    // Highlight first selected line
    if (measureLine1Id != null) {
        const l = state.cadLines.find(l => l.id === measureLine1Id);
        if (l) {
            ctx.strokeStyle = '#2196f3';
            ctx.lineWidth = 3 / state.zoom;
            ctx.beginPath();
            if (l.arc) ctx.arc(l.arc.cx, l.arc.cy, l.arc.r, l.arc.startAngle, l.arc.endAngle, l.arc.ccw);
            else { ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); }
            ctx.stroke();
        }
    }
    // Highlight second line
    if (measureLine2Id != null) {
        const l = state.cadLines.find(l => l.id === measureLine2Id);
        if (l) {
            ctx.strokeStyle = '#4caf50';
            ctx.lineWidth = 3 / state.zoom;
            ctx.beginPath();
            if (l.arc) ctx.arc(l.arc.cx, l.arc.cy, l.arc.r, l.arc.startAngle, l.arc.endAngle, l.arc.ccw);
            else { ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); }
            ctx.stroke();
        }
    }
    // Draw measurement result
    if (measureResult) {
        const { dist, p1, p2 } = measureResult;
        // Dimension line with extension lines (offset from geometry)
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const lineLen = Math.hypot(dx, dy);
        // Perpendicular direction for offset
        let nx = 0, ny = -1;
        if (lineLen > 0.001) { nx = -dy / lineLen; ny = dx / lineLen; }
        const offset = 30 / state.zoom;

        // Extension lines from endpoints
        ctx.strokeStyle = 'rgba(255, 152, 0, 0.5)';
        ctx.lineWidth = 0.8 / state.zoom;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p1.x + nx * (offset + 8 / state.zoom), p1.y + ny * (offset + 8 / state.zoom));
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x + nx * (offset + 8 / state.zoom), p2.y + ny * (offset + 8 / state.zoom));
        ctx.stroke();

        // Dimension line (offset from geometry)
        const dp1 = { x: p1.x + nx * offset, y: p1.y + ny * offset };
        const dp2 = { x: p2.x + nx * offset, y: p2.y + ny * offset };
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 1.5 / state.zoom;
        ctx.beginPath(); ctx.moveTo(dp1.x, dp1.y); ctx.lineTo(dp2.x, dp2.y); ctx.stroke();

        // Arrowheads at dimension line ends
        const hs = 6 / state.zoom;
        const dAngle = Math.atan2(dp2.y - dp1.y, dp2.x - dp1.x);
        ctx.fillStyle = '#ff9800';
        for (const [pt, dir] of [[dp1, 1], [dp2, -1]]) {
            const a = dAngle + (dir > 0 ? 0 : Math.PI);
            ctx.beginPath();
            ctx.moveTo(pt.x + hs * Math.cos(a), pt.y + hs * Math.sin(a));
            ctx.lineTo(pt.x + hs * 0.4 * Math.cos(a + 2.3), pt.y + hs * 0.4 * Math.sin(a + 2.3));
            ctx.lineTo(pt.x + hs * 0.4 * Math.cos(a - 2.3), pt.y + hs * 0.4 * Math.sin(a - 2.3));
            ctx.closePath(); ctx.fill();
        }

        // Endpoint markers on actual geometry
        ctx.fillStyle = '#ff9800';
        const mr = 3 / state.zoom;
        ctx.beginPath(); ctx.arc(p1.x, p1.y, mr, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p2.x, p2.y, mr, 0, Math.PI * 2); ctx.fill();

        // Distance label on dimension line (offset, not on geometry)
        const labelX = (dp1.x + dp2.x) / 2;
        const labelY = (dp1.y + dp2.y) / 2;
        const distMM = dist / PX_PER_MM;
        const labelAngle = Math.atan2(dy, dx);
        const normAngle = (labelAngle > Math.PI / 2 || labelAngle < -Math.PI / 2) ? labelAngle + Math.PI : labelAngle;
        drawDimLabel(`${distMM.toFixed(2)}mm`, labelX, labelY - 10 / state.zoom, normAngle);
    }
}

// ── Canvas Setup ──────────────────────────
function initCanvas() {
    canvasContainer = document.getElementById('layout-canvas-container');
    if (!canvasContainer) return;
    canvas = document.getElementById('layout-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', onContextMenu);

    updateCursor();
    drawCanvas();
}

function resizeCanvas() {
    if (!canvas || !canvasContainer) return;
    const rect = canvasContainer.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawCanvas();
}

// ── Mouse Handlers ────────────────────────
function onContextMenu(e) {
    e.preventDefault();
    const menu = document.getElementById('layout-context-menu');
    if (!menu) return;
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
}

function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    world._sx = sx; world._sy = sy; // pass screen coords for selection rect

    // Dimension input active → commit on click
    if (dimInputMode) { commitDimInput(); return; }

    // Pan: middle click or Alt+left click
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanning = true;
        panStartX = e.clientX - state.panX;
        panStartY = e.clientY - state.panY;
        canvas.style.cursor = 'grabbing';
        return;
    }

    if (e.button !== 0 || e.altKey) return;

    // Gumball move in progress → finalize
    if (gumballMoveAxis) {
        if (Math.abs(gumballDistance) > 0.01) pushUndo();
        resetGumballMove();
        drawCanvas();
        return;
    }

    // Copy mode
    if (copyModeActive && cursorWorldPos) {
        if (!copyBasePoint) {
            // First click: set base/reference point
            const epSnap = snapToEndpoint(world.x, world.y);
            const snapped = epSnap || snapWorld(world.x, world.y);
            copyBasePoint = { x: snapped.x, y: snapped.y };
            canvas.style.cursor = 'copy';
            drawCanvas();
            return;
        }
        // Subsequent clicks: place copies
        placeCopies();
        drawCanvas();
        return;
    }

    // Rotation mode
    if (rotationModeActive && cursorWorldPos) {
        if (!rotationBasePoint) {
            const epSnap = snapToEndpoint(world.x, world.y);
            const snapped = epSnap || snapWorld(world.x, world.y);
            rotationBasePoint = { x: snapped.x, y: snapped.y };
            canvas.style.cursor = 'crosshair';
            drawCanvas();
            return;
        }
        if (Math.abs(rotationAngle) > 0.001) pushUndo();
        resetRotationState();
        drawCanvas();
        return;
    }

    // Gumball arrow click → start axis-constrained move
    if (layoutGumballActive && !pendingSymbolType) {
        const gAxis = hitTestGumball(world.x, world.y);
        if (gAxis) {
            const arrows = getGumballArrows();
            gumballMoveAxis = gAxis;
            gumballDistance = 0;
            if (arrows.sym) {
                gumballMoveSymId = arrows.sym.id;
                gumballMoveOrigPos = { x: arrows.sym.x, y: arrows.sym.y };
            } else if (arrows.line) {
                gumballMoveLineId = arrows.line.id;
                gumballMoveOrigLine = {
                    x1: arrows.line.x1, y1: arrows.line.y1,
                    x2: arrows.line.x2, y2: arrows.line.y2,
                    arc: arrows.line.arc ? { ...arrows.line.arc } : null,
                    bezier: arrows.line.bezier ? { ...arrows.line.bezier } : null,
                };
                gumballConnectedLines = findConnectedLines(arrows.line.id);
            } else if (arrows.multi) {
                gumballMoveMultiSyms = [...selectedIds].map(id => {
                    const s = symbols.find(sym => sym.id === id);
                    return s ? { id, origX: s.x, origY: s.y } : null;
                }).filter(Boolean);
                gumballMoveMultiLines = [...selectedLineIds].map(id => {
                    const l = state.cadLines.find(ln => ln.id === id);
                    return l ? { id, origX1: l.x1, origY1: l.y1, origX2: l.x2, origY2: l.y2,
                                 arc: l.arc ? { ...l.arc } : null,
                                 bezier: l.bezier ? { ...l.bezier } : null } : null;
                }).filter(Boolean);
                gumballMoveMultiCenter = { x: arrows.cx, y: arrows.cy };
            }
            canvas.style.cursor = gAxis === 'x' ? 'ew-resize' : 'ns-resize';
            return;
        }
    }

    // Measurement mode
    if (layoutMeasureActive) {
        handleMeasureClick(world);
        return;
    }

    // シンボル配置モード
    if (pendingSymbolType) {
        placeSymbolAt(world);
        return;
    }

    const shift = e.shiftKey;
    switch (state.activeTool) {
        case 'line':
            handleLineClick(world, shift);
            break;
        case 'rect':
            handleRectDown(world, shift);
            break;
        case 'fillet':
            handleFilletClick(world, shift);
            break;
        case 'circle':
            handleCircleClick(world);
            break;
        case 'polygon':
            handlePolygonClick(world);
            break;
        case 'curve':
            handleCurveClick(world);
            break;
        case 'trim':
            handleTrimClick(world);
            break;
        case 'align':
            handleAlignClick(world);
            break;
        case 'mirror':
            handleMirrorClick(world);
            break;
        default:
            handleNullDown(world, shift);
            break;
    }
}

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    if (isPanning) {
        state.panX = e.clientX - panStartX;
        state.panY = e.clientY - panStartY;
        drawCanvas();
        return;
    }

    // Gumball axis-constrained move (click-based, no button held)
    if (gumballMoveAxis) {
        const g = state.gridSize * PX_PER_MM;
        const halfG = g / 2;
        if (gumballMoveSymId != null) {
            const sym = symbols.find(s => s.id === gumballMoveSymId);
            if (sym && gumballMoveOrigPos) {
                const origCX = gumballMoveOrigPos.x + sym.width / 2;
                const origCY = gumballMoveOrigPos.y + sym.height / 2;
                if (gumballMoveAxis === 'x') {
                    const rawDelta = world.x - origCX;
                    const snapped = state.snapToGrid ? Math.round(rawDelta / halfG) * halfG : rawDelta;
                    sym.x = gumballMoveOrigPos.x + snapped;
                    gumballDistance = snapped;
                } else {
                    const rawDelta = world.y - origCY;
                    const snapped = state.snapToGrid ? Math.round(rawDelta / halfG) * halfG : rawDelta;
                    sym.y = gumballMoveOrigPos.y + snapped;
                    gumballDistance = snapped;
                }
            }
        } else if (gumballMoveLineId != null) {
            const line = state.cadLines.find(l => l.id === gumballMoveLineId);
            if (line && gumballMoveOrigLine) {
                const origCX = (gumballMoveOrigLine.x1 + gumballMoveOrigLine.x2) / 2;
                const origCY = (gumballMoveOrigLine.y1 + gumballMoveOrigLine.y2) / 2;
                let delta;
                if (gumballMoveAxis === 'x') {
                    const rawDelta = world.x - origCX;
                    delta = state.snapToGrid ? Math.round(rawDelta / halfG) * halfG : rawDelta;
                    line.x1 = gumballMoveOrigLine.x1 + delta;
                    line.x2 = gumballMoveOrigLine.x2 + delta;
                    line.y1 = gumballMoveOrigLine.y1; line.y2 = gumballMoveOrigLine.y2;
                } else {
                    const rawDelta = world.y - origCY;
                    delta = state.snapToGrid ? Math.round(rawDelta / halfG) * halfG : rawDelta;
                    line.y1 = gumballMoveOrigLine.y1 + delta;
                    line.y2 = gumballMoveOrigLine.y2 + delta;
                    line.x1 = gumballMoveOrigLine.x1; line.x2 = gumballMoveOrigLine.x2;
                }
                if (line.arc && gumballMoveOrigLine.arc) {
                    line.arc.cx = gumballMoveOrigLine.arc.cx + (gumballMoveAxis === 'x' ? delta : 0);
                    line.arc.cy = gumballMoveOrigLine.arc.cy + (gumballMoveAxis === 'y' ? delta : 0);
                }
                if (line.bezier && gumballMoveOrigLine.bezier) {
                    line.bezier.cpx = gumballMoveOrigLine.bezier.cpx + (gumballMoveAxis === 'x' ? delta : 0);
                    line.bezier.cpy = gumballMoveOrigLine.bezier.cpy + (gumballMoveAxis === 'y' ? delta : 0);
                }
                gumballDistance = delta;
                // Move connected line endpoints
                for (const cl of gumballConnectedLines) {
                    const other = state.cadLines.find(l => l.id === cl.id);
                    if (!other) continue;
                    if (cl.matchEnd === 1) {
                        other.x1 = cl.origX1 + (gumballMoveAxis === 'x' ? delta : 0);
                        other.y1 = cl.origY1 + (gumballMoveAxis === 'y' ? delta : 0);
                    } else {
                        other.x2 = cl.origX2 + (gumballMoveAxis === 'x' ? delta : 0);
                        other.y2 = cl.origY2 + (gumballMoveAxis === 'y' ? delta : 0);
                    }
                }
            }
        } else if (gumballMoveMultiCenter) {
            const g = state.gridSize * PX_PER_MM;
            const halfG = g / 2;
            let delta;
            if (gumballMoveAxis === 'x') {
                const rawDelta = world.x - gumballMoveMultiCenter.x;
                delta = state.snapToGrid ? Math.round(rawDelta / halfG) * halfG : rawDelta;
            } else {
                const rawDelta = world.y - gumballMoveMultiCenter.y;
                delta = state.snapToGrid ? Math.round(rawDelta / halfG) * halfG : rawDelta;
            }
            const dx = gumballMoveAxis === 'x' ? delta : 0;
            const dy = gumballMoveAxis === 'y' ? delta : 0;
            for (const ms of gumballMoveMultiSyms) {
                const s = symbols.find(sym => sym.id === ms.id);
                if (s) { s.x = ms.origX + dx; s.y = ms.origY + dy; }
            }
            for (const ml of gumballMoveMultiLines) {
                const l = state.cadLines.find(ln => ln.id === ml.id);
                if (!l) continue;
                l.x1 = ml.origX1 + dx; l.y1 = ml.origY1 + dy;
                l.x2 = ml.origX2 + dx; l.y2 = ml.origY2 + dy;
                if (l.arc && ml.arc) { l.arc.cx = ml.arc.cx + dx; l.arc.cy = ml.arc.cy + dy; }
                if (l.bezier && ml.bezier) { l.bezier.cpx = ml.bezier.cpx + dx; l.bezier.cpy = ml.bezier.cpy + dy; }
            }
            gumballDistance = delta;
        }
        drawCanvas();
        return;
    }

    // Rotation mode: update cursor and live rotation preview
    if (rotationModeActive) {
        cursorWorldPos = snapWorld(world.x, world.y);
        if (!rotationBasePoint) { drawCanvas(); return; }
    }
    if (rotationModeActive && rotationBasePoint) {
        rotationAngle = Math.atan2(cursorWorldPos.y - rotationBasePoint.y,
                                    cursorWorldPos.x - rotationBasePoint.x);
        applyRotationToAll(rotationAngle);
        drawCanvas();
        return;
    }

    if (dimInputMode) return; // freeze preview while dimension input is active

    const epSnap = snapToEndpoint(world.x, world.y);
    isSnappedToEndpoint = !!epSnap;
    isSnappedToMidpoint = !!(epSnap && epSnap.isMidpoint);
    cursorWorldPos = epSnap || snapWorld(world.x, world.y);

    // Fillet radius adjustment (single or multi)
    if (state.activeTool === 'fillet' && (filletInfo || filletCorners.length > 0)) {
        // Find the reference corner (nearest for multi, or single)
        let ref = filletInfo;
        let maxR = filletInfo ? filletInfo.maxRadius : filletMaxRadius;
        if (!ref && filletCorners.length > 0) {
            let bestD = Infinity;
            for (const c of filletCorners) {
                const d = Math.hypot(world.x - c.corner.x, world.y - c.corner.y);
                if (d < bestD) { bestD = d; ref = c; }
            }
        }
        if (ref) {
            const dx = world.x - ref.corner.x;
            const dy = world.y - ref.corner.y;
            const projection = dx * ref.bisector.x + dy * ref.bisector.y;
            filletRadius = Math.max(0, Math.min(maxR, projection * Math.sin(ref.halfAngle)));
            drawCanvas();
            return;
        }
    }

    if (isMoving && moveStartWorld) {
        const dx = world.x - moveStartWorld.x;
        const dy = world.y - moveStartWorld.y;
        const g = state.gridSize * PX_PER_MM;
        const halfG = g / 2;
        const sdx = state.snapToGrid ? Math.round(dx / halfG) * halfG : dx;
        const sdy = state.snapToGrid ? Math.round(dy / halfG) * halfG : dy;
        for (const orig of moveOriginalPositions) {
            const sym = symbols.find(s => s.id === orig.id);
            if (sym) { sym.x = orig.x + sdx; sym.y = orig.y + sdy; }
        }
        drawCanvas();
        return;
    }

    if (isSelecting) {
        selCurScreenX = sx;
        selCurScreenY = sy;
        updateLiveSelection();
        drawCanvas();
        return;
    }

    // Rect tool: update preview
    if (state.activeTool === 'rect' && rectStartWorld) {
        rectCurWorld = { x: cursorWorldPos.x, y: cursorWorldPos.y };
        drawCanvas();
        return;
    }

    // Line tool: rubber-band update
    if (state.activeTool === 'line' && lineStartWorld) {
        drawCanvas();
        return;
    }

    // Circle tool: radius preview
    if (state.activeTool === 'circle' && circleCenter) {
        circleRadius = Math.hypot(cursorWorldPos.x - circleCenter.x, cursorWorldPos.y - circleCenter.y);
        drawCanvas();
        return;
    }

    // Polygon tool: radius preview
    if (state.activeTool === 'polygon' && polyCenter) {
        polyRadius = Math.hypot(cursorWorldPos.x - polyCenter.x, cursorWorldPos.y - polyCenter.y);
        drawCanvas();
        return;
    }

    drawCanvas();
}

function onMouseUp(e) {
    if (isPanning) {
        isPanning = false;
        updateCursor();
        return;
    }

    if (isMoving) {
        // Check if anything actually moved
        const moved = moveOriginalPositions.some(orig => {
            const s = symbols.find(s => s.id === orig.id);
            return s && (s.x !== orig.x || s.y !== orig.y);
        });
        if (moved) {
            // Push undo with original positions
            const currentPositions = moveOriginalPositions.map(orig => {
                const s = symbols.find(s => s.id === orig.id);
                return s ? { id: orig.id, x: s.x, y: s.y } : null;
            }).filter(Boolean);
            // Temporarily restore originals to snapshot
            moveOriginalPositions.forEach(orig => {
                const s = symbols.find(s => s.id === orig.id);
                if (s) { s.x = orig.x; s.y = orig.y; }
            });
            pushUndo();
            // Re-apply moved positions
            currentPositions.forEach(pos => {
                const s = symbols.find(s => s.id === pos.id);
                if (s) { s.x = pos.x; s.y = pos.y; }
            });
        }
        isMoving = false;
        moveStartWorld = null;
        moveOriginalPositions = [];
        updateCursor();
        drawCanvas();
        return;
    }

    if (isSelecting) {
        finalizeSelection();
        isSelecting = false;
        updateCursor();
        drawCanvas();
        return;
    }

}

function onMouseLeave(e) {
    if (isPanning) { isPanning = false; updateCursor(); }
    if (gumballMoveAxis) { cancelGumballMove(); drawCanvas(); }
    if (isMoving) {
        // cancel move, restore positions
        for (const orig of moveOriginalPositions) {
            const sym = symbols.find(s => s.id === orig.id);
            if (sym) { sym.x = orig.x; sym.y = orig.y; }
        }
        isMoving = false;
        moveStartWorld = null;
        moveOriginalPositions = [];
        drawCanvas();
    }
    if (isSelecting) { isSelecting = false; drawCanvas(); }
    cursorWorldPos = null;
}

// ── Symbol Placement ──────────────────────
function placeSymbolAt(world) {
    const def = SYMBOL_DEFS[pendingSymbolType];
    if (!def) return;
    const epSnap = snapToEndpoint(world.x, world.y);
    const snapped = epSnap || snapWorld(world.x, world.y);
    const wPx = def.boundW * PX_PER_MM;
    const hPx = def.boundH * PX_PER_MM;
    pushUndo();
    const sym = {
        id: nextSymbolId++,
        type: pendingSymbolType,
        x: snapped.x - wPx / 2,
        y: snapped.y - hPx / 2,
        width: wPx,
        height: hPx,
        rotation: 0,
    };
    symbols.push(sym);
    selectedIds.clear();
    selectedIds.add(sym.id);
    selectedLineIds.clear();
    drawCanvas();
}

// ── Null Tool (Select/Move) ──────────────
function handleNullDown(world, shift) {
    const symHit = hitTestSymbol(world.x, world.y);
    if (symHit) {
        if (shift) {
            if (selectedIds.has(symHit.id)) selectedIds.delete(symHit.id);
            else selectedIds.add(symHit.id);
        } else {
            if (!selectedIds.has(symHit.id)) { selectedIds.clear(); selectedLineIds.clear(); }
            selectedIds.add(symHit.id);
        }
        // Start move for all selected symbols
        isMoving = true;
        moveStartWorld = { x: world.x, y: world.y };
        moveOriginalPositions = [...selectedIds].map(id => {
            const s = symbols.find(s => s.id === id);
            return s ? { id, x: s.x, y: s.y } : null;
        }).filter(Boolean);
        canvas.style.cursor = 'move';
        drawCanvas();
        return;
    }
    const tol = 8 / state.zoom;
    const lineHit = hitTestLine(world.x, world.y, tol);
    if (lineHit) {
        if (shift) {
            if (selectedLineIds.has(lineHit.id)) selectedLineIds.delete(lineHit.id);
            else selectedLineIds.add(lineHit.id);
        } else {
            selectedLineIds.clear();
            selectedLineIds.add(lineHit.id);
            selectedIds.clear();
        }
        drawCanvas();
        return;
    }
    // Empty space: start selection rectangle
    if (!shift) { selectedIds.clear(); selectedLineIds.clear(); }
    const sx = world._sx, sy = world._sy;
    isSelecting = true;
    selStartScreenX = sx;
    selStartScreenY = sy;
    selCurScreenX = sx;
    selCurScreenY = sy;
    canvas.style.cursor = 'crosshair';
    drawCanvas();
}

// ── Line Tool ─────────────────────────────
function handleLineClick(world, shift) {
    const epSnap = snapToEndpoint(world.x, world.y);
    const snapped = epSnap || snapWorld(world.x, world.y);

    if (!lineStartWorld) {
        // No line in progress: check for selection first (only if not near endpoint)
        if (!epSnap) {
            const tol = 8 / state.zoom;
            const lineHit = hitTestLine(world.x, world.y, tol);
            if (lineHit) {
                if (shift) {
                    if (selectedLineIds.has(lineHit.id)) selectedLineIds.delete(lineHit.id);
                    else selectedLineIds.add(lineHit.id);
                } else {
                    selectedLineIds.clear();
                    selectedLineIds.add(lineHit.id);
                    selectedIds.clear();
                }
                drawCanvas();
                return;
            }
            const symHit = hitTestSymbol(world.x, world.y);
            if (symHit) {
                if (shift) {
                    if (selectedIds.has(symHit.id)) selectedIds.delete(symHit.id);
                    else selectedIds.add(symHit.id);
                    drawCanvas();
                    return;
                }
                selectedIds.clear();
                selectedIds.add(symHit.id);
                selectedLineIds.clear();
                isMoving = true;
                moveStartWorld = { x: world.x, y: world.y };
                moveOriginalPositions = [{ id: symHit.id, x: symHit.x, y: symHit.y }];
                canvas.style.cursor = 'move';
                drawCanvas();
                return;
            }
        }
        // Deselect and start new line
        if (!shift) { selectedLineIds.clear(); selectedIds.clear(); }
        lineStartWorld = { x: snapped.x, y: snapped.y };
    } else {
        // Line in progress: end line
        if (snapped.x !== lineStartWorld.x || snapped.y !== lineStartWorld.y) {
            pushUndo();
            state.cadLines.push({
                id: nextLineId++,
                x1: lineStartWorld.x, y1: lineStartWorld.y,
                x2: snapped.x, y2: snapped.y,
            });
        }
        lineStartWorld = null;
    }
    drawCanvas();
}

// ── Rect Tool ─────────────────────────────
function handleRectDown(world, shift) {
    const epSnap = snapToEndpoint(world.x, world.y);
    const snapped = epSnap || snapWorld(world.x, world.y);

    if (!rectStartWorld) {
        // No rect in progress: check for selection first
        if (!epSnap) {
            const tol = 8 / state.zoom;
            const lineHit = hitTestLine(world.x, world.y, tol);
            if (lineHit) {
                if (shift) {
                    if (selectedLineIds.has(lineHit.id)) selectedLineIds.delete(lineHit.id);
                    else selectedLineIds.add(lineHit.id);
                } else {
                    selectedLineIds.clear();
                    selectedLineIds.add(lineHit.id);
                    selectedIds.clear();
                }
                drawCanvas();
                return;
            }
            const symHit = hitTestSymbol(world.x, world.y);
            if (symHit) {
                if (shift) {
                    if (selectedIds.has(symHit.id)) selectedIds.delete(symHit.id);
                    else selectedIds.add(symHit.id);
                    drawCanvas();
                    return;
                }
                selectedIds.clear();
                selectedIds.add(symHit.id);
                selectedLineIds.clear();
                isMoving = true;
                moveStartWorld = { x: world.x, y: world.y };
                moveOriginalPositions = [{ id: symHit.id, x: symHit.x, y: symHit.y }];
                canvas.style.cursor = 'move';
                drawCanvas();
                return;
            }
        }
        if (!shift) { selectedLineIds.clear(); selectedIds.clear(); }
        rectStartWorld = { x: snapped.x, y: snapped.y };
        rectCurWorld = { x: snapped.x, y: snapped.y };
    } else {
        rectCurWorld = { x: snapped.x, y: snapped.y };
        finalizeRect();
    }
}

function finalizeRect() {
    const x1 = rectStartWorld.x, y1 = rectStartWorld.y;
    const x2 = rectCurWorld.x, y2 = rectCurWorld.y;
    if (x1 !== x2 || y1 !== y2) {
        pushUndo();
        state.cadLines.push(
            { id: nextLineId++, x1, y1, x2, y2: y1 },
            { id: nextLineId++, x1: x2, y1, x2, y2 },
            { id: nextLineId++, x1: x2, y1: y2, x2: x1, y2 },
            { id: nextLineId++, x1, y1: y2, x2: x1, y2: y1 },
        );
    }
    rectStartWorld = null;
    rectCurWorld = null;
    drawCanvas();
}

// ── Circle Tool ──────────────────────────
function handleCircleClick(world) {
    const epSnap = snapToEndpoint(world.x, world.y);
    const snapped = epSnap || snapWorld(world.x, world.y);

    if (!circleCenter) {
        circleCenter = { x: snapped.x, y: snapped.y };
    } else {
        const r = Math.hypot(snapped.x - circleCenter.x, snapped.y - circleCenter.y);
        if (r > 0.5) {
            pushUndo();
            // Store circle as arc cadLine (full 360)
            state.cadLines.push({
                id: nextLineId++,
                x1: circleCenter.x + r, y1: circleCenter.y,
                x2: circleCenter.x + r, y2: circleCenter.y,
                arc: { cx: circleCenter.x, cy: circleCenter.y, r, startAngle: 0, endAngle: Math.PI * 2 - 0.001, ccw: false },
            });
        }
        circleCenter = null;
    }
    drawCanvas();
}

// ── Polygon Tool ─────────────────────────
function handlePolygonClick(world) {
    const epSnap = snapToEndpoint(world.x, world.y);
    const snapped = epSnap || snapWorld(world.x, world.y);

    if (!polyCenter) {
        polyCenter = { x: snapped.x, y: snapped.y };
    } else {
        const r = Math.hypot(snapped.x - polyCenter.x, snapped.y - polyCenter.y);
        if (r > 0.5) {
            pushUndo();
            const n = polySides;
            const angleOffset = polyRotation;
            for (let i = 0; i < n; i++) {
                const a1 = angleOffset + (2 * Math.PI / n) * i;
                const a2 = angleOffset + (2 * Math.PI / n) * ((i + 1) % n);
                state.cadLines.push({
                    id: nextLineId++,
                    x1: polyCenter.x + r * Math.cos(a1), y1: polyCenter.y + r * Math.sin(a1),
                    x2: polyCenter.x + r * Math.cos(a2), y2: polyCenter.y + r * Math.sin(a2),
                });
            }
        }
        polyCenter = null;
        polyRadius = 0;
    }
    drawCanvas();
}

// ── Curve Tool (Quadratic Bezier) ────────
function handleCurveClick(world) {
    const epSnap = snapToEndpoint(world.x, world.y);
    const snapped = epSnap || snapWorld(world.x, world.y);

    curvePoints.push({ x: snapped.x, y: snapped.y });

    if (curvePoints.length >= 3) {
        pushUndo();
        const [p0, p1, p2] = curvePoints;
        // Store as vector quadratic bezier (single cadLine with bezier property)
        state.cadLines.push({
            id: nextLineId++,
            x1: p0.x, y1: p0.y,
            x2: p2.x, y2: p2.y,
            bezier: { cpx: p1.x, cpy: p1.y },
        });
        // 連続モード: 終点を次の始点にする（Escapeで終了）
        curvePoints = [{ x: p2.x, y: p2.y }];
    }
    drawCanvas();
}

// ── Delete Tool ───────────────────────────
function handleDeleteClick(world) {
    const hit = hitTestSymbol(world.x, world.y);
    if (hit) {
        const idx = symbols.findIndex(s => s.id === hit.id);
        if (idx >= 0) symbols.splice(idx, 1);
        selectedIds.delete(hit.id);
        drawCanvas();
        return;
    }
    const tol = 8 / state.zoom;
    const lineHit = hitTestLine(world.x, world.y, tol);
    if (lineHit) {
        const idx = state.cadLines.findIndex(l => l.id === lineHit.id);
        if (idx >= 0) state.cadLines.splice(idx, 1);
        drawCanvas();
    }
}

// ── Trim/Extend Tool ─────────────────────
function resetTrimState() { trimRefLineId = null; }

function lineLineIntersection(l1, l2) {
    const dx1 = l1.x2 - l1.x1, dy1 = l1.y2 - l1.y1;
    const dx2 = l2.x2 - l2.x1, dy2 = l2.y2 - l2.y1;
    const det = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(det) < 1e-10) return null; // parallel
    const t = ((l2.x1 - l1.x1) * dy2 - (l2.y1 - l1.y1) * dx2) / det;
    return { x: l1.x1 + t * dx1, y: l1.y1 + t * dy1, t };
}

function handleTrimClick(world) {
    const tol = 8 / state.zoom;
    const lineHit = hitTestLine(world.x, world.y, tol);
    if (!lineHit) return;

    if (trimRefLineId == null) {
        // First click: select boundary/reference line
        trimRefLineId = lineHit.id;
        drawCanvas();
        return;
    }

    // Second click: trim/extend this line to the boundary
    if (lineHit.id === trimRefLineId) return;
    const refLine = state.cadLines.find(l => l.id === trimRefLineId);
    const targetLine = state.cadLines.find(l => l.id === lineHit.id);
    if (!refLine || !targetLine || refLine.arc || targetLine.arc) {
        resetTrimState();
        drawCanvas();
        return;
    }

    const inter = lineLineIntersection(refLine, targetLine);
    if (!inter) { resetTrimState(); drawCanvas(); return; }

    pushUndo();
    // Determine which endpoint of target to move (nearest to click)
    const d1 = Math.hypot(world.x - targetLine.x1, world.y - targetLine.y1);
    const d2 = Math.hypot(world.x - targetLine.x2, world.y - targetLine.y2);
    if (d1 < d2) {
        targetLine.x1 = inter.x; targetLine.y1 = inter.y;
    } else {
        targetLine.x2 = inter.x; targetLine.y2 = inter.y;
    }
    resetTrimState();
    drawCanvas();
}

// ── Copy Mode ────────────────────────────
function activateCopyMode() {
    if (selectedIds.size === 0 && selectedLineIds.size === 0) return;
    copyGhostLines = [...selectedLineIds].map(id => {
        const l = state.cadLines.find(ln => ln.id === id);
        return l ? { ...l, arc: l.arc ? { ...l.arc } : null, bezier: l.bezier ? { ...l.bezier } : null } : null;
    }).filter(Boolean);
    copyGhostSyms = [...selectedIds].map(id => {
        const s = symbols.find(sym => sym.id === id);
        return s ? { ...s } : null;
    }).filter(Boolean);

    // Don't set base point yet — user clicks to pick it
    copyBasePoint = null;
    copyModeActive = true;
    canvas.style.cursor = 'crosshair';
}

function placeCopies() {
    if (!copyBasePoint || !cursorWorldPos) return;
    const snapped = snapWorld(cursorWorldPos.x, cursorWorldPos.y);
    const dx = snapped.x - copyBasePoint.x;
    const dy = snapped.y - copyBasePoint.y;
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;

    pushUndo();
    const newLineIds = [];
    for (const gl of copyGhostLines) {
        const nl = {
            id: nextLineId++,
            x1: gl.x1 + dx, y1: gl.y1 + dy,
            x2: gl.x2 + dx, y2: gl.y2 + dy,
        };
        if (gl.arc) {
            nl.arc = { ...gl.arc, cx: gl.arc.cx + dx, cy: gl.arc.cy + dy };
        }
        if (gl.bezier) {
            nl.bezier = { cpx: gl.bezier.cpx + dx, cpy: gl.bezier.cpy + dy };
        }
        state.cadLines.push(nl);
        newLineIds.push(nl.id);
    }
    const newSymIds = [];
    for (const gs of copyGhostSyms) {
        const ns = { ...gs, id: nextSymbolId++, x: gs.x + dx, y: gs.y + dy };
        symbols.push(ns);
        newSymIds.push(ns.id);
    }
    // Keep copy mode active for continuous placement (don't cancel)
    // Update base point AND ghost data to new positions so next copy is relative to placement
    copyBasePoint = { x: snapped.x, y: snapped.y };
    for (const gl of copyGhostLines) {
        gl.x1 += dx; gl.y1 += dy;
        gl.x2 += dx; gl.y2 += dy;
        if (gl.arc) { gl.arc.cx += dx; gl.arc.cy += dy; }
        if (gl.bezier) { gl.bezier.cpx += dx; gl.bezier.cpy += dy; }
    }
    for (const gs of copyGhostSyms) {
        gs.x += dx; gs.y += dy;
    }
}

function cancelCopyMode() {
    copyModeActive = false;
    copyGhostLines = [];
    copyGhostSyms = [];
    copyBasePoint = null;
    updateCursor();
}

// ── Rotation Tool ────────────────────────
function rotatePoint(px, py, cx, cy, angle) {
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const dx = px - cx, dy = py - cy;
    return { x: cx + dx * cosA - dy * sinA, y: cy + dx * sinA + dy * cosA };
}

function applyRotationToAll(angle) {
    const cx = rotationBasePoint.x, cy = rotationBasePoint.y;
    for (const os of rotationOrigSyms) {
        const s = symbols.find(sym => sym.id === os.id);
        if (!s) continue;
        const symCx = os.origX + s.width / 2;
        const symCy = os.origY + s.height / 2;
        const rp = rotatePoint(symCx, symCy, cx, cy, angle);
        s.x = rp.x - s.width / 2;
        s.y = rp.y - s.height / 2;
        s.rotation = (os.origRotation + angle * 180 / Math.PI) % 360;
    }
    for (const ol of rotationOrigLines) {
        const l = state.cadLines.find(ln => ln.id === ol.id);
        if (!l) continue;
        const rp1 = rotatePoint(ol.origX1, ol.origY1, cx, cy, angle);
        const rp2 = rotatePoint(ol.origX2, ol.origY2, cx, cy, angle);
        l.x1 = rp1.x; l.y1 = rp1.y; l.x2 = rp2.x; l.y2 = rp2.y;
        if (ol.arc && l.arc) {
            const rc = rotatePoint(ol.arc.cx, ol.arc.cy, cx, cy, angle);
            l.arc.cx = rc.x; l.arc.cy = rc.y;
            l.arc.r = ol.arc.r;
            l.arc.startAngle = ol.arc.startAngle + angle;
            l.arc.endAngle = ol.arc.endAngle + angle;
            l.arc.ccw = ol.arc.ccw;
        }
        if (ol.bezier && l.bezier) {
            const rcp = rotatePoint(ol.bezier.cpx, ol.bezier.cpy, cx, cy, angle);
            l.bezier.cpx = rcp.x; l.bezier.cpy = rcp.y;
        }
    }
}

function activateRotationMode() {
    if (selectedIds.size === 0 && selectedLineIds.size === 0) return;
    rotationOrigSyms = [...selectedIds].map(id => {
        const s = symbols.find(sym => sym.id === id);
        return s ? { id, origX: s.x, origY: s.y, origRotation: s.rotation || 0 } : null;
    }).filter(Boolean);
    rotationOrigLines = [...selectedLineIds].map(id => {
        const l = state.cadLines.find(ln => ln.id === id);
        return l ? { id, origX1: l.x1, origY1: l.y1, origX2: l.x2, origY2: l.y2,
                     arc: l.arc ? { ...l.arc } : null,
                     bezier: l.bezier ? { ...l.bezier } : null } : null;
    }).filter(Boolean);
    rotationBasePoint = null;
    rotationAngle = 0;
    rotationModeActive = true;
    canvas.style.cursor = 'crosshair';
}

function cancelRotation() {
    for (const os of rotationOrigSyms) {
        const s = symbols.find(sym => sym.id === os.id);
        if (s) { s.x = os.origX; s.y = os.origY; s.rotation = os.origRotation; }
    }
    for (const ol of rotationOrigLines) {
        const l = state.cadLines.find(ln => ln.id === ol.id);
        if (!l) continue;
        l.x1 = ol.origX1; l.y1 = ol.origY1; l.x2 = ol.origX2; l.y2 = ol.origY2;
        if (ol.arc) { if (l.arc) Object.assign(l.arc, ol.arc); }
        if (ol.bezier) { if (l.bezier) Object.assign(l.bezier, ol.bezier); }
    }
    resetRotationState();
}

function resetRotationState() {
    rotationModeActive = false;
    rotationBasePoint = null;
    rotationAngle = 0;
    rotationOrigSyms = [];
    rotationOrigLines = [];
    updateCursor();
}

// ── Align Tool ───────────────────────────
function resetAlignState() { alignRefLineId = null; alignRefSymId = null; }

function handleAlignClick(world) {
    const tol = 8 / state.zoom;
    // Try line hit first, then symbol
    const lineHit = hitTestLine(world.x, world.y, tol);
    const symHit = hitTestSymbol(world.x, world.y);

    if (alignRefLineId == null && alignRefSymId == null) {
        // First click: select reference
        if (lineHit) { alignRefLineId = lineHit.id; drawCanvas(); return; }
        if (symHit) { alignRefSymId = symHit.id; drawCanvas(); return; }
        return;
    }

    // Second click: align target to reference
    if (alignRefLineId != null) {
        const refLine = state.cadLines.find(l => l.id === alignRefLineId);
        if (!refLine) { resetAlignState(); return; }

        if (lineHit && lineHit.id !== alignRefLineId && !lineHit.arc) {
            const target = state.cadLines.find(l => l.id === lineHit.id);
            if (target && !target.arc) {
                pushUndo();
                // Determine if lines are more horizontal or vertical
                const refDx = Math.abs(refLine.x2 - refLine.x1);
                const refDy = Math.abs(refLine.y2 - refLine.y1);
                const refMidX = (refLine.x1 + refLine.x2) / 2;
                const refMidY = (refLine.y1 + refLine.y2) / 2;
                const tarMidX = (target.x1 + target.x2) / 2;
                const tarMidY = (target.y1 + target.y2) / 2;

                if (refDx > refDy) {
                    // Horizontal-ish → align Y
                    const dy = refMidY - tarMidY;
                    target.y1 += dy; target.y2 += dy;
                    if (target.arc) target.arc.cy += dy;
                } else {
                    // Vertical-ish → align X
                    const dx = refMidX - tarMidX;
                    target.x1 += dx; target.x2 += dx;
                    if (target.arc) target.arc.cx += dx;
                }
            }
        } else if (symHit) {
            pushUndo();
            const refMidX = (refLine.x1 + refLine.x2) / 2;
            const refMidY = (refLine.y1 + refLine.y2) / 2;
            const refDx = Math.abs(refLine.x2 - refLine.x1);
            const refDy = Math.abs(refLine.y2 - refLine.y1);
            const symCx = symHit.x + symHit.width / 2;
            const symCy = symHit.y + symHit.height / 2;
            if (refDx > refDy) {
                symHit.y += refMidY - symCy;
            } else {
                symHit.x += refMidX - symCx;
            }
        }
    } else if (alignRefSymId != null) {
        const refSym = symbols.find(s => s.id === alignRefSymId);
        if (!refSym) { resetAlignState(); return; }
        const refCx = refSym.x + refSym.width / 2;
        const refCy = refSym.y + refSym.height / 2;

        if (symHit && symHit.id !== alignRefSymId) {
            pushUndo();
            const tarCx = symHit.x + symHit.width / 2;
            const tarCy = symHit.y + symHit.height / 2;
            // Align on closer axis
            if (Math.abs(refCx - tarCx) < Math.abs(refCy - tarCy)) {
                symHit.x += refCx - tarCx;
            } else {
                symHit.y += refCy - tarCy;
            }
        } else if (lineHit) {
            const target = state.cadLines.find(l => l.id === lineHit.id);
            if (target && !target.arc) {
                pushUndo();
                const tarMidX = (target.x1 + target.x2) / 2;
                const tarMidY = (target.y1 + target.y2) / 2;
                if (Math.abs(refCx - tarMidX) < Math.abs(refCy - tarMidY)) {
                    const dx = refCx - tarMidX;
                    target.x1 += dx; target.x2 += dx;
                } else {
                    const dy = refCy - tarMidY;
                    target.y1 += dy; target.y2 += dy;
                }
            }
        }
    }
    resetAlignState();
    drawCanvas();
}

// ── Mirror Tool ──────────────────────────
let mirrorAxisLineId = null; // selected line to use as mirror axis
function resetMirrorState() { mirrorPoint1 = null; mirrorAxisLineId = null; }

function handleMirrorClick(world) {
    // If axis already selected, second click = execute
    if (mirrorAxisLineId != null) {
        executeMirror();
        return;
    }

    const tol = 8 / state.zoom;
    const lineHit = hitTestLine(world.x, world.y, tol);

    // Step 1: Click a line to use as mirror axis
    if (!lineHit) return;

    // Don't allow selecting a line that's in the selection (mirror targets)
    if (selectedLineIds.has(lineHit.id)) return;

    mirrorAxisLineId = lineHit.id;
    drawCanvas();
}

function executeMirror() {
    if (mirrorAxisLineId == null) return;
    const axisLine = state.cadLines.find(l => l.id === mirrorAxisLineId);
    if (!axisLine || axisLine.arc) { resetMirrorState(); return; }

    const linesToMirror = [...selectedLineIds].map(id => state.cadLines.find(l => l.id === id)).filter(Boolean);
    const symsToMirror = [...selectedIds].map(id => symbols.find(s => s.id === id)).filter(Boolean);
    if (linesToMirror.length === 0 && symsToMirror.length === 0) { resetMirrorState(); return; }

    // Mirror axis from the selected line
    const p1 = { x: axisLine.x1, y: axisLine.y1 };
    const adx = axisLine.x2 - axisLine.x1, ady = axisLine.y2 - axisLine.y1;
    const aLen = Math.hypot(adx, ady);
    if (aLen < 0.01) { resetMirrorState(); return; }
    const ax = adx / aLen, ay = ady / aLen;

    function mirrorPoint(px, py) {
        const vx = px - p1.x, vy = py - p1.y;
        const dot = vx * ax + vy * ay;
        return { x: 2 * (p1.x + dot * ax) - px, y: 2 * (p1.y + dot * ay) - py };
    }

    pushUndo();
    const newLineIds = [], newSymIds = [];
    for (const l of linesToMirror) {
        const mp1 = mirrorPoint(l.x1, l.y1);
        const mp2 = mirrorPoint(l.x2, l.y2);
        const nl = { id: nextLineId++, x1: mp1.x, y1: mp1.y, x2: mp2.x, y2: mp2.y };
        if (l.arc) {
            const mc = mirrorPoint(l.arc.cx, l.arc.cy);
            nl.arc = { cx: mc.x, cy: mc.y, r: l.arc.r,
                startAngle: Math.atan2(mp1.y - mc.y, mp1.x - mc.x),
                endAngle: Math.atan2(mp2.y - mc.y, mp2.x - mc.x),
                ccw: !l.arc.ccw };
        }
        if (l.bezier) {
            const mcp = mirrorPoint(l.bezier.cpx, l.bezier.cpy);
            nl.bezier = { cpx: mcp.x, cpy: mcp.y };
        }
        state.cadLines.push(nl);
        newLineIds.push(nl.id);
    }
    for (const s of symsToMirror) {
        const sc = mirrorPoint(s.x + s.width / 2, s.y + s.height / 2);
        const ns = { ...s, id: nextSymbolId++, x: sc.x - s.width / 2, y: sc.y - s.height / 2 };
        symbols.push(ns);
        newSymIds.push(ns.id);
    }
    // Select mirrored copies
    selectedIds.clear(); selectedLineIds.clear();
    newSymIds.forEach(id => selectedIds.add(id));
    newLineIds.forEach(id => selectedLineIds.add(id));
    resetMirrorState();
    setTool(null);
    drawCanvas();
}

// ── Selection Logic ───────────────────────
function getSelectionRect() {
    return {
        x1: Math.min(selStartScreenX, selCurScreenX),
        y1: Math.min(selStartScreenY, selCurScreenY),
        x2: Math.max(selStartScreenX, selCurScreenX),
        y2: Math.max(selStartScreenY, selCurScreenY),
    };
}

function isWindowSelection() {
    return selCurScreenX >= selStartScreenX;
}

function getSymbolScreenBounds(sym) {
    if (sym.rotation) {
        const cx = sym.x + sym.width / 2, cy = sym.y + sym.height / 2;
        const ang = sym.rotation * Math.PI / 180;
        const cosA = Math.cos(ang), sinA = Math.sin(ang);
        const corners = [
            { x: sym.x, y: sym.y }, { x: sym.x + sym.width, y: sym.y },
            { x: sym.x + sym.width, y: sym.y + sym.height }, { x: sym.x, y: sym.y + sym.height }
        ];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const c of corners) {
            const dx = c.x - cx, dy = c.y - cy;
            const rx = cx + dx * cosA - dy * sinA, ry = cy + dx * sinA + dy * cosA;
            const sp = worldToScreen(rx, ry);
            minX = Math.min(minX, sp.x); minY = Math.min(minY, sp.y);
            maxX = Math.max(maxX, sp.x); maxY = Math.max(maxY, sp.y);
        }
        return { x1: minX, y1: minY, x2: maxX, y2: maxY };
    }
    const tl = worldToScreen(sym.x, sym.y);
    const br = worldToScreen(sym.x + sym.width, sym.y + sym.height);
    return { x1: tl.x, y1: tl.y, x2: br.x, y2: br.y };
}

function rectContainsSymbol(selRect, sym) {
    const b = getSymbolScreenBounds(sym);
    return b.x1 >= selRect.x1 && b.x2 <= selRect.x2 &&
           b.y1 >= selRect.y1 && b.y2 <= selRect.y2;
}

function rectIntersectsSymbol(selRect, sym) {
    const b = getSymbolScreenBounds(sym);
    return selRect.x1 <= b.x2 && selRect.x2 >= b.x1 &&
           selRect.y1 <= b.y2 && selRect.y2 >= b.y1;
}

function rectContainsLine(selRect, line) {
    const p1 = worldToScreen(line.x1, line.y1);
    const p2 = worldToScreen(line.x2, line.y2);
    return p1.x >= selRect.x1 && p1.x <= selRect.x2 &&
           p1.y >= selRect.y1 && p1.y <= selRect.y2 &&
           p2.x >= selRect.x1 && p2.x <= selRect.x2 &&
           p2.y >= selRect.y1 && p2.y <= selRect.y2;
}

function rectIntersectsLine(selRect, line) {
    const p1 = worldToScreen(line.x1, line.y1);
    const p2 = worldToScreen(line.x2, line.y2);
    // Check if either endpoint is inside
    if (p1.x >= selRect.x1 && p1.x <= selRect.x2 && p1.y >= selRect.y1 && p1.y <= selRect.y2) return true;
    if (p2.x >= selRect.x1 && p2.x <= selRect.x2 && p2.y >= selRect.y1 && p2.y <= selRect.y2) return true;
    // Check line-rectangle intersection via bounding box overlap
    const lx1 = Math.min(p1.x, p2.x), lx2 = Math.max(p1.x, p2.x);
    const ly1 = Math.min(p1.y, p2.y), ly2 = Math.max(p1.y, p2.y);
    return lx1 <= selRect.x2 && lx2 >= selRect.x1 && ly1 <= selRect.y2 && ly2 >= selRect.y1;
}

function updateLiveSelection() {
    if (!isSelecting) return;
    const selRect = getSelectionRect();
    if (isWindowSelection()) return;
    // Crossing selection: intersects
    for (const sym of symbols) {
        if (rectIntersectsSymbol(selRect, sym)) selectedIds.add(sym.id);
    }
    for (const line of state.cadLines) {
        if (rectIntersectsLine(selRect, line)) selectedLineIds.add(line.id);
    }
}

function finalizeSelection() {
    const dx = selCurScreenX - selStartScreenX;
    const dy = selCurScreenY - selStartScreenY;
    if (Math.sqrt(dx * dx + dy * dy) < 3) { selectedIds.clear(); selectedLineIds.clear(); return; }

    const selRect = getSelectionRect();
    if (isWindowSelection()) {
        // Window selection: fully contained
        selectedIds.clear();
        selectedLineIds.clear();
        for (const sym of symbols) {
            if (rectContainsSymbol(selRect, sym)) selectedIds.add(sym.id);
        }
        for (const line of state.cadLines) {
            if (rectContainsLine(selRect, line)) selectedLineIds.add(line.id);
        }
    }
    // Crossing selection already handled in updateLiveSelection
}

// ── Zoom ──────────────────────────────────
function onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, state.zoom * factor));
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const w = canvas.width, h = canvas.height;
    const r = newZoom / state.zoom;
    state.panX = (mx - w / 2) * (1 - r) + state.panX * r;
    state.panY = (my - h / 2) * (1 - r) + state.panY * r;
    state.zoom = newZoom;
    drawCanvas();
}

// ── Drawing Pipeline ──────────────────────
function drawCanvas() {
    if (!ctx || !canvas) return;
    const w = canvas.width, h = canvas.height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(state.panX + w / 2, state.panY + h / 2);
    ctx.scale(state.zoom, state.zoom);

    if (state.showGrid) drawGrid(w, h);
    drawCrosshair();
    drawPlateOutline();
    drawCadLines();
    drawSymbols();
    drawGumball();
    drawMeasurement();
    drawCopyGhosts();
    drawRotationGuide();
    drawToolPreview();

    ctx.restore();

    if (isSelecting) drawSelectionRect();
    drawCursorInfo();
    updateLayerMeta();
}

function drawCrosshair() {
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 1 / state.zoom;
    ctx.beginPath();
    ctx.moveTo(-20, 0); ctx.lineTo(20, 0);
    ctx.moveTo(0, -20); ctx.lineTo(0, 20);
    ctx.stroke();
}

function drawGrid(w, h) {
    const gridPx = state.gridSize * PX_PER_MM;
    const halfW = (w / 2 + Math.abs(state.panX)) / state.zoom + gridPx;
    const halfH = (h / 2 + Math.abs(state.panY)) / state.zoom + gridPx;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 0.5 / state.zoom;

    const sx = Math.floor(-halfW / gridPx) * gridPx;
    const ex = Math.ceil(halfW / gridPx) * gridPx;
    const sy = Math.floor(-halfH / gridPx) * gridPx;
    const ey = Math.ceil(halfH / gridPx) * gridPx;

    ctx.beginPath();
    for (let x = sx; x <= ex; x += gridPx) { ctx.moveTo(x, -halfH); ctx.lineTo(x, halfH); }
    for (let y = sy; y <= ey; y += gridPx) { ctx.moveTo(-halfW, y); ctx.lineTo(halfW, y); }
    ctx.stroke();
}

function drawPlateOutline() {
    const p = state.plateOutline;
    if (!p) return;

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = 2 / state.zoom;
    ctx.setLineDash([6 / state.zoom, 3 / state.zoom]);
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.setLineDash([]);

    // 寸法ラベル
    const wMM = p.w / PX_PER_MM;
    const hMM = p.h / PX_PER_MM;
    ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
    ctx.font = `${12 / state.zoom}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${wMM.toFixed(1)}mm`, p.x + p.w / 2, p.y - 6 / state.zoom);
    ctx.save();
    ctx.translate(p.x - 6 / state.zoom, p.y + p.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${hMM.toFixed(1)}mm`, 0, 0);
    ctx.restore();
}

function _drawLineSegment(line, strokeStyle, lineWidth) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    if (line.arc) {
        const a = line.arc;
        ctx.arc(a.cx, a.cy, a.r, a.startAngle, a.endAngle, a.ccw);
    } else if (line.bezier) {
        ctx.moveTo(line.x1, line.y1);
        ctx.quadraticCurveTo(line.bezier.cpx, line.bezier.cpy, line.x2, line.y2);
    } else {
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
    }
    ctx.stroke();
}

function drawCadLines() {
    const r = 2 / state.zoom;

    // 描画前にアクティブレイヤーのデータを同期（非アクティブレイヤーが最新データで描画されるように）
    if (state.layers.length > 0) commitActiveLayer();

    // 非アクティブ可視レイヤーを先に描画（薄い色）
    for (const layer of state.layers) {
        if (!layer.visible || layer.id === state.activeLayerId) continue;
        for (const line of layer.cadLines) {
            _drawLineSegment(line, 'rgba(255, 255, 255, 0.25)', 1.0 / state.zoom);
        }
    }

    // アクティブレイヤー（非表示の場合はスキップ）
    const activeLayer = getActiveLayer();
    if (activeLayer && !activeLayer.visible) return;

    for (const line of state.cadLines) {
        const sel = selectedLineIds.has(line.id);
        _drawLineSegment(line, sel ? '#00e5ff' : 'rgba(255, 255, 255, 0.7)', (sel ? 2.5 : 1.5) / state.zoom);

        ctx.fillStyle = sel ? '#00e5ff' : 'rgba(0, 229, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(line.x1, line.y1, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(line.x2, line.y2, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSymbols() {
    // 非アクティブ可視レイヤーのシンボル（薄く描画）
    for (const layer of state.layers) {
        if (!layer.visible || layer.id === state.activeLayerId) continue;
        for (const sym of layer.symbols) drawSymbol(sym, true);
    }
    // アクティブレイヤー（非表示の場合はスキップ）
    const activeLayer = getActiveLayer();
    if (activeLayer && !activeLayer.visible) return;
    for (const sym of symbols) drawSymbol(sym, false);
}

function drawSymbol(sym, dimmed) {
    const def = SYMBOL_DEFS[sym.type];
    if (!def) return;
    const sel = !dimmed && selectedIds.has(sym.id);
    const alpha = dimmed ? 0.25 : 1.0;
    const cx = sym.x + sym.width / 2;
    const cy = sym.y + sym.height / 2;

    ctx.save();
    if (dimmed) ctx.globalAlpha = alpha;
    if (sym.rotation) {
        ctx.translate(cx, cy);
        ctx.rotate(sym.rotation * Math.PI / 180);
        ctx.translate(-cx, -cy);
    }

    // バウンディングボックス（キーキャップ外形）
    ctx.strokeStyle = sel ? '#00e5ff' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = (sel ? 2 : 0.5) / state.zoom;
    ctx.strokeRect(sym.x, sym.y, sym.width, sym.height);
    if (sel) {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
        ctx.fillRect(sym.x, sym.y, sym.width, sym.height);
    }

    // スイッチカットアウト (14mm × 14mm)
    if (def.hasSwitch) {
        const sw = SWITCH_SZ * PX_PER_MM;
        ctx.strokeStyle = sel ? '#00e5ff' : 'rgba(255, 200, 0, 0.6)';
        ctx.lineWidth = 1.5 / state.zoom;
        ctx.strokeRect(cx - sw / 2, cy - sw / 2, sw, sw);
        // 十字マーク
        const cr = 3 / state.zoom;
        ctx.beginPath();
        ctx.moveTo(cx - cr, cy); ctx.lineTo(cx + cr, cy);
        ctx.moveTo(cx, cy - cr); ctx.lineTo(cx, cy + cr);
        ctx.stroke();
    }

    // スタビハウジング (6.7mm × 12.3mm 左右)
    if (def.hasStab) {
        const spacing = def.stabSpacing * PX_PER_MM;
        const stabW = STAB_W * PX_PER_MM;
        const stabH = STAB_H * PX_PER_MM;
        ctx.strokeStyle = sel ? '#00e5ff' : 'rgba(255, 100, 100, 0.5)';
        ctx.lineWidth = 1 / state.zoom;
        for (const side of [-1, 1]) {
            const scx = cx + side * spacing / 2;
            ctx.strokeRect(scx - stabW / 2, cy - stabH / 2, stabW, stabH);
        }
    }

    // ねじ穴 (Screw hole)
    if (def.isScrew) {
        const dia = def.screwDia * PX_PER_MM;
        ctx.strokeStyle = sel ? '#00e5ff' : 'rgba(180, 180, 255, 0.7)';
        ctx.lineWidth = 1.5 / state.zoom;
        ctx.beginPath();
        ctx.arc(cx, cy, dia / 2, 0, Math.PI * 2);
        ctx.stroke();
        const cr = dia / 2 * 0.7;
        ctx.beginPath();
        ctx.moveTo(cx - cr, cy); ctx.lineTo(cx + cr, cy);
        ctx.moveTo(cx, cy - cr); ctx.lineTo(cx, cy + cr);
        ctx.stroke();
    }

    ctx.restore();
}

function drawGumball() {
    const arrows = getGumballArrows();
    if (!arrows) return;

    const { sym, line, cx, cy, arrowLen } = arrows;
    const headSize = 8 / state.zoom;

    // During move: show original position ghost and guide line
    if (gumballMoveAxis && (gumballMoveOrigPos || gumballMoveOrigLine || gumballMoveMultiCenter)) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1 / state.zoom;
        ctx.setLineDash([3 / state.zoom, 3 / state.zoom]);
        if (gumballMoveOrigPos && sym) {
            ctx.strokeRect(gumballMoveOrigPos.x, gumballMoveOrigPos.y, sym.width, sym.height);
        } else if (gumballMoveOrigLine) {
            ctx.beginPath();
            ctx.moveTo(gumballMoveOrigLine.x1, gumballMoveOrigLine.y1);
            ctx.lineTo(gumballMoveOrigLine.x2, gumballMoveOrigLine.y2);
            ctx.stroke();
        } else if (gumballMoveMultiCenter) {
            for (const ms of gumballMoveMultiSyms) {
                const s = symbols.find(sym => sym.id === ms.id);
                if (s) ctx.strokeRect(ms.origX, ms.origY, s.width, s.height);
            }
            for (const ml of gumballMoveMultiLines) {
                ctx.beginPath();
                ctx.moveTo(ml.origX1, ml.origY1);
                ctx.lineTo(ml.origX2, ml.origY2);
                ctx.stroke();
            }
        }
        ctx.setLineDash([]);

        // Axis guide line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1 / state.zoom;
        ctx.setLineDash([4 / state.zoom, 4 / state.zoom]);
        if (gumballMoveAxis === 'x') {
            ctx.beginPath(); ctx.moveTo(cx - 2000, cy); ctx.lineTo(cx + 2000, cy); ctx.stroke();
        } else {
            ctx.beginPath(); ctx.moveTo(cx, cy - 2000); ctx.lineTo(cx, cy + 2000); ctx.stroke();
        }
        ctx.setLineDash([]);

        // Movement line from original to current
        if (Math.abs(gumballDistance) > 0.01) {
            let origCX, origCY;
            if (gumballMoveOrigPos && sym) {
                origCX = gumballMoveOrigPos.x + sym.width / 2;
                origCY = gumballMoveOrigPos.y + sym.height / 2;
            } else if (gumballMoveOrigLine) {
                origCX = (gumballMoveOrigLine.x1 + gumballMoveOrigLine.x2) / 2;
                origCY = (gumballMoveOrigLine.y1 + gumballMoveOrigLine.y2) / 2;
            } else if (gumballMoveMultiCenter) {
                origCX = gumballMoveMultiCenter.x;
                origCY = gumballMoveMultiCenter.y;
            }
            if (origCX != null) {
                const color = gumballMoveAxis === 'x' ? '#ff6666' : '#66ff66';
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5 / state.zoom;
                ctx.setLineDash([4 / state.zoom, 3 / state.zoom]);
                ctx.beginPath(); ctx.moveTo(origCX, origCY); ctx.lineTo(cx, cy); ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    // X arrow (red)
    const xActive = gumballMoveAxis === 'x';
    ctx.strokeStyle = xActive ? '#ff6666' : '#cc3333';
    ctx.lineWidth = (xActive ? 3 : 2) / state.zoom;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + arrowLen, cy); ctx.stroke();
    ctx.fillStyle = xActive ? '#ff6666' : '#cc3333';
    ctx.beginPath();
    ctx.moveTo(cx + arrowLen + headSize, cy);
    ctx.lineTo(cx + arrowLen - headSize * 0.3, cy - headSize * 0.5);
    ctx.lineTo(cx + arrowLen - headSize * 0.3, cy + headSize * 0.5);
    ctx.closePath(); ctx.fill();
    ctx.font = `bold ${9 / state.zoom}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('X', cx + arrowLen + headSize + 8 / state.zoom, cy + 3 / state.zoom);

    // Y arrow (green)
    const yActive = gumballMoveAxis === 'y';
    ctx.strokeStyle = yActive ? '#66ff66' : '#33cc33';
    ctx.lineWidth = (yActive ? 3 : 2) / state.zoom;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + arrowLen); ctx.stroke();
    ctx.fillStyle = yActive ? '#66ff66' : '#33cc33';
    ctx.beginPath();
    ctx.moveTo(cx, cy + arrowLen + headSize);
    ctx.lineTo(cx - headSize * 0.5, cy + arrowLen - headSize * 0.3);
    ctx.lineTo(cx + headSize * 0.5, cy + arrowLen - headSize * 0.3);
    ctx.closePath(); ctx.fill();
    ctx.fillText('Y', cx + 8 / state.zoom, cy + arrowLen + headSize + 8 / state.zoom);

    // Center dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, 3 / state.zoom, 0, Math.PI * 2); ctx.fill();

    // Distance label during move
    if (gumballMoveAxis && Math.abs(gumballDistance) > 0.01) {
        const distMM = gumballDistance / PX_PER_MM;
        const label = `${distMM >= 0 ? '+' : ''}${distMM.toFixed(1)}mm`;
        if (gumballMoveAxis === 'x') {
            drawDimLabel(label, cx, cy - 18 / state.zoom, 0);
        } else {
            drawDimLabel(label, cx + 18 / state.zoom, cy, 0);
        }
    }
}

function drawDimLabel(text, x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    const fs = 11 / state.zoom;
    ctx.font = `bold ${fs}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const m = ctx.measureText(text);
    const pw = 4 / state.zoom, ph = 2 / state.zoom;
    ctx.fillStyle = 'rgba(17, 17, 46, 0.85)';
    ctx.fillRect(-m.width / 2 - pw, -fs / 2 - ph, m.width + pw * 2, fs + ph * 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(text, 0, 0);
    ctx.restore();
}

function drawCopyGhosts() {
    if (!copyModeActive || !cursorWorldPos) return;

    // Waiting for base point: show prompt near cursor
    if (!copyBasePoint) {
        ctx.fillStyle = '#00e5ff';
        ctx.font = `${11 / state.zoom}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText('基準点をクリック', cursorWorldPos.x + 12 / state.zoom, cursorWorldPos.y - 12 / state.zoom);
        return;
    }

    const snapped = snapWorld(cursorWorldPos.x, cursorWorldPos.y);
    const dx = snapped.x - copyBasePoint.x;
    const dy = snapped.y - copyBasePoint.y;

    ctx.globalAlpha = 0.35;
    // Ghost lines
    for (const gl of copyGhostLines) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5 / state.zoom;
        ctx.beginPath();
        if (gl.arc) {
            ctx.arc(gl.arc.cx + dx, gl.arc.cy + dy, gl.arc.r, gl.arc.startAngle, gl.arc.endAngle, gl.arc.ccw);
        } else if (gl.bezier) {
            ctx.moveTo(gl.x1 + dx, gl.y1 + dy);
            ctx.quadraticCurveTo(gl.bezier.cpx + dx, gl.bezier.cpy + dy, gl.x2 + dx, gl.y2 + dy);
        } else {
            ctx.moveTo(gl.x1 + dx, gl.y1 + dy);
            ctx.lineTo(gl.x2 + dx, gl.y2 + dy);
        }
        ctx.stroke();
    }
    // Ghost symbols
    for (const gs of copyGhostSyms) {
        const ghostSym = { ...gs, x: gs.x + dx, y: gs.y + dy, id: -1 };
        drawSymbol(ghostSym);
    }
    ctx.globalAlpha = 1.0;

    // Base point marker
    const bp = 4 / state.zoom;
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2 / state.zoom;
    ctx.beginPath();
    ctx.moveTo(copyBasePoint.x - bp, copyBasePoint.y - bp);
    ctx.lineTo(copyBasePoint.x + bp, copyBasePoint.y + bp);
    ctx.moveTo(copyBasePoint.x + bp, copyBasePoint.y - bp);
    ctx.lineTo(copyBasePoint.x - bp, copyBasePoint.y + bp);
    ctx.stroke();

    // Distance label
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
        const distMM = dist / PX_PER_MM;
        drawDimLabel(`${distMM.toFixed(1)}mm`, snapped.x, snapped.y - 16 / state.zoom, 0);
    }
}

function drawRotationGuide() {
    if (!rotationModeActive || !cursorWorldPos) return;
    if (!rotationBasePoint) {
        ctx.fillStyle = '#ffaa00';
        ctx.font = `${11 / state.zoom}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText('回転中心をクリック', cursorWorldPos.x + 12 / state.zoom, cursorWorldPos.y - 12 / state.zoom);
        return;
    }
    const bp = rotationBasePoint;
    const sz = 6 / state.zoom;
    // Center point × marker
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2 / state.zoom;
    ctx.beginPath();
    ctx.moveTo(bp.x - sz, bp.y - sz); ctx.lineTo(bp.x + sz, bp.y + sz);
    ctx.moveTo(bp.x + sz, bp.y - sz); ctx.lineTo(bp.x - sz, bp.y + sz);
    ctx.stroke();
    // Clock hand rod from center to cursor (solid, thick, prominent)
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3 / state.zoom;
    ctx.beginPath();
    ctx.moveTo(bp.x, bp.y);
    ctx.lineTo(cursorWorldPos.x, cursorWorldPos.y);
    ctx.stroke();
    // Tip circle at cursor end
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(cursorWorldPos.x, cursorWorldPos.y, 4 / state.zoom, 0, Math.PI * 2);
    ctx.fill();
    // Arc showing rotation angle
    const radius = Math.min(40 / state.zoom, Math.hypot(cursorWorldPos.x - bp.x, cursorWorldPos.y - bp.y) * 0.4);
    if (Math.abs(rotationAngle) > 0.01) {
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.7)';
        ctx.lineWidth = 2.5 / state.zoom;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, radius, 0, rotationAngle, rotationAngle < 0);
        ctx.stroke();
    }
    // Angle label
    const angleDeg = rotationAngle * 180 / Math.PI;
    const label = `${angleDeg >= 0 ? '+' : ''}${angleDeg.toFixed(1)}°`;
    ctx.fillStyle = '#ffaa00';
    ctx.font = `bold ${11 / state.zoom}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(label, cursorWorldPos.x + 15 / state.zoom, cursorWorldPos.y - 15 / state.zoom);
}

function drawToolPreview() {
    // Line rubber-band
    if (state.activeTool === 'line' && lineStartWorld && cursorWorldPos) {
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
        ctx.lineWidth = 1 / state.zoom;
        ctx.setLineDash([4 / state.zoom, 4 / state.zoom]);
        ctx.beginPath();
        ctx.moveTo(lineStartWorld.x, lineStartWorld.y);
        ctx.lineTo(cursorWorldPos.x, cursorWorldPos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dimension label: length in mm
        const dx = cursorWorldPos.x - lineStartWorld.x;
        const dy = cursorWorldPos.y - lineStartWorld.y;
        const lengthMM = Math.sqrt(dx * dx + dy * dy) / PX_PER_MM;
        if (lengthMM > 0.1) {
            const midX = (lineStartWorld.x + cursorWorldPos.x) / 2;
            const midY = (lineStartWorld.y + cursorWorldPos.y) / 2;
            const angle = Math.atan2(dy, dx);
            const labelAngle = (angle > Math.PI / 2 || angle < -Math.PI / 2) ? angle + Math.PI : angle;
            drawDimLabel(`${lengthMM.toFixed(1)}mm`, midX, midY - 10 / state.zoom, labelAngle);
        }
    }

    // Rect preview
    if (state.activeTool === 'rect' && rectStartWorld && rectCurWorld) {
        const rx = Math.min(rectStartWorld.x, rectCurWorld.x);
        const ry = Math.min(rectStartWorld.y, rectCurWorld.y);
        const rw = Math.abs(rectCurWorld.x - rectStartWorld.x);
        const rh = Math.abs(rectCurWorld.y - rectStartWorld.y);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
        ctx.lineWidth = 1 / state.zoom;
        ctx.setLineDash([4 / state.zoom, 4 / state.zoom]);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.setLineDash([]);

        // Dimension labels: W and H in mm
        const wMM = rw / PX_PER_MM;
        const hMM = rh / PX_PER_MM;
        if (wMM > 0.1) {
            const highlight = dimInputMode === 'rect-width' ? ' *' : '';
            drawDimLabel(`W: ${wMM.toFixed(1)}mm${highlight}`, rx + rw / 2, ry - 10 / state.zoom, 0);
        }
        if (hMM > 0.1) {
            const highlight = dimInputMode === 'rect-height' ? ' *' : '';
            drawDimLabel(`H: ${hMM.toFixed(1)}mm${highlight}`, rx + rw + 10 / state.zoom, ry + rh / 2, -Math.PI / 2);
        }
    }

    // Symbol placement ghost preview
    if (pendingSymbolType && cursorWorldPos) {
        const def = SYMBOL_DEFS[pendingSymbolType];
        if (def) {
            const wPx = def.boundW * PX_PER_MM;
            const hPx = def.boundH * PX_PER_MM;
            const ghostSym = {
                id: -1, type: pendingSymbolType,
                x: cursorWorldPos.x - wPx / 2, y: cursorWorldPos.y - hPx / 2,
                width: wPx, height: hPx, rotation: 0,
            };
            ctx.globalAlpha = 0.4;
            drawSymbol(ghostSym);
            ctx.globalAlpha = 1.0;
        }
    }

    // Circle preview
    if (state.activeTool === 'circle' && circleCenter && cursorWorldPos) {
        const r = Math.hypot(cursorWorldPos.x - circleCenter.x, cursorWorldPos.y - circleCenter.y);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 1.5 / state.zoom;
        ctx.setLineDash([6 / state.zoom, 4 / state.zoom]);
        ctx.beginPath();
        ctx.arc(circleCenter.x, circleCenter.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Center crosshair
        const ch = 6 / state.zoom;
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 1 / state.zoom;
        ctx.beginPath();
        ctx.moveTo(circleCenter.x - ch, circleCenter.y); ctx.lineTo(circleCenter.x + ch, circleCenter.y);
        ctx.moveTo(circleCenter.x, circleCenter.y - ch); ctx.lineTo(circleCenter.x, circleCenter.y + ch);
        ctx.stroke();
        // Radius label
        const rMM = r / PX_PER_MM;
        ctx.fillStyle = '#00e5ff';
        ctx.font = `${11 / state.zoom}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`r=${rMM.toFixed(2)}mm`, circleCenter.x + 8 / state.zoom, circleCenter.y - 8 / state.zoom);
    }

    // Polygon preview
    if (state.activeTool === 'polygon' && polyCenter && cursorWorldPos) {
        const r = Math.hypot(cursorWorldPos.x - polyCenter.x, cursorWorldPos.y - polyCenter.y);
        const n = polySides;
        // Rotation follows cursor angle: first vertex points toward cursor
        const cursorAngle = Math.atan2(cursorWorldPos.y - polyCenter.y, cursorWorldPos.x - polyCenter.x);
        polyRotation = cursorAngle;
        const angleOffset = polyRotation;
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 1.5 / state.zoom;
        ctx.setLineDash([6 / state.zoom, 4 / state.zoom]);
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
            const a = angleOffset + (2 * Math.PI / n) * i;
            const px = polyCenter.x + r * Math.cos(a);
            const py = polyCenter.y + r * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // Center crosshair
        const ch = 6 / state.zoom;
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 1 / state.zoom;
        ctx.beginPath();
        ctx.moveTo(polyCenter.x - ch, polyCenter.y); ctx.lineTo(polyCenter.x + ch, polyCenter.y);
        ctx.moveTo(polyCenter.x, polyCenter.y - ch); ctx.lineTo(polyCenter.x, polyCenter.y + ch);
        ctx.stroke();
        // Sides label
        ctx.fillStyle = '#00e5ff';
        ctx.font = `${11 / state.zoom}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`${n}角形  r=${(r / PX_PER_MM).toFixed(2)}mm`, polyCenter.x + 8 / state.zoom, polyCenter.y - 8 / state.zoom);
    }

    // Curve preview
    if (state.activeTool === 'curve' && curvePoints.length > 0 && cursorWorldPos) {
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 1.5 / state.zoom;
        ctx.setLineDash([6 / state.zoom, 4 / state.zoom]);
        if (curvePoints.length === 1) {
            // Line from first point to cursor
            ctx.beginPath();
            ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
            ctx.lineTo(cursorWorldPos.x, cursorWorldPos.y);
            ctx.stroke();
        } else if (curvePoints.length === 2) {
            // Quadratic bezier preview: p0=curvePoints[0], p1=curvePoints[1], p2=cursor
            const [p0, p1] = curvePoints;
            const p2 = cursorWorldPos;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            const segs = 16;
            for (let i = 1; i <= segs; i++) {
                const t = i / segs;
                const mt = 1 - t;
                const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
                const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            // Control point lines
            ctx.strokeStyle = 'rgba(255,170,0,0.4)';
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        // Draw control point dots
        ctx.fillStyle = '#ffaa00';
        for (const pt of curvePoints) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3 / state.zoom, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Trim preview: highlight reference line
    if (state.activeTool === 'trim' && trimRefLineId != null) {
        const tLine = state.cadLines.find(l => l.id === trimRefLineId);
        if (tLine) {
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 3 / state.zoom;
            ctx.beginPath();
            if (tLine.arc) {
                ctx.arc(tLine.arc.cx, tLine.arc.cy, tLine.arc.r, tLine.arc.startAngle, tLine.arc.endAngle, tLine.arc.ccw);
            } else {
                ctx.moveTo(tLine.x1, tLine.y1); ctx.lineTo(tLine.x2, tLine.y2);
            }
            ctx.stroke();
        }
    }

    // Align preview: highlight reference
    if (state.activeTool === 'align') {
        if (alignRefLineId != null) {
            const aLine = state.cadLines.find(l => l.id === alignRefLineId);
            if (aLine) {
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 3 / state.zoom;
                ctx.beginPath();
                if (aLine.arc) {
                    ctx.arc(aLine.arc.cx, aLine.arc.cy, aLine.arc.r, aLine.arc.startAngle, aLine.arc.endAngle, aLine.arc.ccw);
                } else {
                    ctx.moveTo(aLine.x1, aLine.y1); ctx.lineTo(aLine.x2, aLine.y2);
                }
                ctx.stroke();
            }
        }
        if (alignRefSymId != null) {
            const aSym = symbols.find(s => s.id === alignRefSymId);
            if (aSym) {
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 2 / state.zoom;
                ctx.strokeRect(aSym.x, aSym.y, aSym.width, aSym.height);
            }
        }
    }

    // Mirror preview: highlight axis line
    if (state.activeTool === 'mirror' && mirrorAxisLineId != null) {
        const mLine = state.cadLines.find(l => l.id === mirrorAxisLineId);
        if (mLine && !mLine.arc) {
            ctx.strokeStyle = '#ff66ff';
            ctx.lineWidth = 3 / state.zoom;
            ctx.setLineDash([6 / state.zoom, 4 / state.zoom]);
            ctx.beginPath();
            // Extend axis line visually
            const dx = mLine.x2 - mLine.x1, dy = mLine.y2 - mLine.y1;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
                const ext = 50 / state.zoom;
                const ux = dx / len, uy = dy / len;
                ctx.moveTo(mLine.x1 - ux * ext, mLine.y1 - uy * ext);
                ctx.lineTo(mLine.x2 + ux * ext, mLine.y2 + uy * ext);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Fillet preview
    if (state.activeTool === 'fillet') {
        // Highlight first selected line (single-fillet first click)
        if (filletLine1Id != null) {
            const fLine = state.cadLines.find(l => l.id === filletLine1Id);
            if (fLine) {
                ctx.strokeStyle = '#ffaa00';
                ctx.lineWidth = 3 / state.zoom;
                ctx.beginPath();
                ctx.moveTo(fLine.x1, fLine.y1); ctx.lineTo(fLine.x2, fLine.y2);
                ctx.stroke();
            }
        }

        // Helper: draw fillet preview at a single corner
        const drawFilletCornerPreview = (info, r, showArrow) => {
            const { corner, d1, d2, bisector, halfAngle, line1, line2 } = info;

            // Highlight both lines
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 3 / state.zoom;
            ctx.beginPath(); ctx.moveTo(line1.x1, line1.y1); ctx.lineTo(line1.x2, line1.y2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(line2.x1, line2.y1); ctx.lineTo(line2.x2, line2.y2); ctx.stroke();

            if (showArrow) {
                // Diagonal arrow along bisector
                const arrowLen = 80 / state.zoom;
                const headSize = 8 / state.zoom;
                const arrowEnd = { x: corner.x + bisector.x * arrowLen, y: corner.y + bisector.y * arrowLen };

                ctx.strokeStyle = '#ffaa00';
                ctx.lineWidth = 2 / state.zoom;
                ctx.beginPath(); ctx.moveTo(corner.x, corner.y); ctx.lineTo(arrowEnd.x, arrowEnd.y); ctx.stroke();

                // Arrowhead
                const aAngle = Math.atan2(bisector.y, bisector.x);
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.moveTo(arrowEnd.x + headSize * Math.cos(aAngle), arrowEnd.y + headSize * Math.sin(aAngle));
                ctx.lineTo(arrowEnd.x + headSize * 0.5 * Math.cos(aAngle + 2.5), arrowEnd.y + headSize * 0.5 * Math.sin(aAngle + 2.5));
                ctx.lineTo(arrowEnd.x + headSize * 0.5 * Math.cos(aAngle - 2.5), arrowEnd.y + headSize * 0.5 * Math.sin(aAngle - 2.5));
                ctx.closePath(); ctx.fill();
            }

            // Corner dot
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath(); ctx.arc(corner.x, corner.y, 3 / state.zoom, 0, Math.PI * 2); ctx.fill();

            // Arc preview
            if (r > 0.01) {
                const rClamped = Math.min(r, info.maxRadius);
                const t = rClamped / Math.tan(halfAngle);
                const t1 = { x: corner.x + t * d1.x, y: corner.y + t * d1.y };
                const t2 = { x: corner.x + t * d2.x, y: corner.y + t * d2.y };
                const centerDist = rClamped / Math.sin(halfAngle);
                const center = { x: corner.x + centerDist * bisector.x, y: corner.y + centerDist * bisector.y };

                const startA = Math.atan2(t1.y - center.y, t1.x - center.x);
                const endA = Math.atan2(t2.y - center.y, t2.x - center.x);
                let dA = endA - startA;
                if (dA > Math.PI) dA -= 2 * Math.PI;
                if (dA < -Math.PI) dA += 2 * Math.PI;

                // Arc curve
                ctx.strokeStyle = '#ffaa00';
                ctx.lineWidth = 2 / state.zoom;
                ctx.setLineDash([4 / state.zoom, 3 / state.zoom]);
                ctx.beginPath();
                const segs = 32;
                for (let i = 0; i <= segs; i++) {
                    const a = startA + (dA / segs) * i;
                    const px = center.x + rClamped * Math.cos(a);
                    const py = center.y + rClamped * Math.sin(a);
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.setLineDash([]);

                // Tangent point markers
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath(); ctx.arc(t1.x, t1.y, 3 / state.zoom, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(t2.x, t2.y, 3 / state.zoom, 0, Math.PI * 2); ctx.fill();

                // Radius label (only on first corner in multi-mode, or always in single)
                if (showArrow) {
                    const rMM = rClamped / PX_PER_MM;
                    drawDimLabel(`R${rMM.toFixed(1)}mm`, center.x, center.y - 12 / state.zoom, 0);
                }
            }
        };

        // Multi-fillet mode: draw preview at all corners
        if (filletCorners.length > 0) {
            const r = Math.min(filletRadius, filletMaxRadius);
            // Find nearest corner to cursor for arrow display
            let nearestIdx = 0;
            if (cursorWorldPos) {
                let bestD = Infinity;
                filletCorners.forEach((c, i) => {
                    const d = Math.hypot(cursorWorldPos.x - c.corner.x, cursorWorldPos.y - c.corner.y);
                    if (d < bestD) { bestD = d; nearestIdx = i; }
                });
            }
            filletCorners.forEach((info, i) => {
                drawFilletCornerPreview(info, r, i === nearestIdx);
            });
            // Show radius label at center of all corners
            if (r > 0.01) {
                const rMM = r / PX_PER_MM;
                let cx = 0, cy = 0;
                filletCorners.forEach(c => { cx += c.corner.x; cy += c.corner.y; });
                cx /= filletCorners.length; cy /= filletCorners.length;
                drawDimLabel(`R${rMM.toFixed(1)}mm × ${filletCorners.length}`, cx, cy - 20 / state.zoom, 0);
            }
        }
        // Single fillet mode
        else if (filletInfo) {
            drawFilletCornerPreview(filletInfo, filletRadius, true);
            // Show radius label for single fillet
            if (filletRadius > 0.01) {
                const r = Math.min(filletRadius, filletInfo.maxRadius);
                const centerDist = r / Math.sin(filletInfo.halfAngle);
                const center = { x: filletInfo.corner.x + centerDist * filletInfo.bisector.x, y: filletInfo.corner.y + centerDist * filletInfo.bisector.y };
                const rMM = r / PX_PER_MM;
                drawDimLabel(`R${rMM.toFixed(1)}mm`, center.x, center.y - 12 / state.zoom, 0);
            }
        }
    }

    // Snap indicator
    if (isSnappedToEndpoint && cursorWorldPos) {
        const r = 5 / state.zoom;
        ctx.strokeStyle = isSnappedToMidpoint ? '#ffaa00' : '#00e5ff';
        ctx.lineWidth = 2 / state.zoom;
        ctx.beginPath();
        ctx.arc(cursorWorldPos.x, cursorWorldPos.y, r, 0, Math.PI * 2);
        ctx.stroke();
        if (isSnappedToMidpoint) {
            // Triangle marker for midpoint
            const s = 4 / state.zoom;
            ctx.fillStyle = 'rgba(255, 170, 0, 0.6)';
            ctx.beginPath();
            ctx.moveTo(cursorWorldPos.x, cursorWorldPos.y - s);
            ctx.lineTo(cursorWorldPos.x - s, cursorWorldPos.y + s * 0.7);
            ctx.lineTo(cursorWorldPos.x + s, cursorWorldPos.y + s * 0.7);
            ctx.closePath();
            ctx.fill();
        } else {
            // Square marker for endpoint
            const s = 3 / state.zoom;
            ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
            ctx.fillRect(cursorWorldPos.x - s, cursorWorldPos.y - s, s * 2, s * 2);
        }
    }
}

function drawSelectionRect() {
    const { x1, y1, x2, y2 } = getSelectionRect();
    const rw = x2 - x1, rh = y2 - y1;
    if (rw < 2 && rh < 2) return;
    const wm = isWindowSelection();

    ctx.save();
    ctx.strokeStyle = wm ? 'rgba(0, 120, 255, 0.8)' : 'rgba(0, 220, 100, 0.8)';
    ctx.fillStyle = wm ? 'rgba(0, 120, 255, 0.08)' : 'rgba(0, 220, 100, 0.08)';
    ctx.lineWidth = 1;
    if (!wm) ctx.setLineDash([4, 3]);
    ctx.fillRect(x1, y1, rw, rh);
    ctx.strokeRect(x1, y1, rw, rh);
    ctx.restore();
}

function drawCursorInfo() {
    if (!cursorWorldPos) return;
    const mmX = (cursorWorldPos.x / PX_PER_MM).toFixed(1);
    const mmY = (cursorWorldPos.y / PX_PER_MM).toFixed(1);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${mmX}, ${mmY} mm`, canvas.width - 10, canvas.height - 10);
    ctx.restore();
}

// ── Keyboard Shortcuts ────────────────────
function onKeyDown(e) {
    if (document.getElementById('module-layout')?.style.display === 'none') return;
    // input要素にフォーカスがある場合は無視
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    // Ctrl+Z / Ctrl+Y undo/redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        layoutUndo();
        return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        layoutRedo();
        return;
    }

    // Enter: execute mirror if axis line is selected
    if (e.key === 'Enter' && state.activeTool === 'mirror' && mirrorAxisLineId != null) {
        e.preventDefault();
        executeMirror();
        return;
    }

    if (e.key === 'Tab') {
        // Rotation mode: Tab to enter exact angle
        if (rotationModeActive && rotationBasePoint && !dimInputMode) {
            e.preventDefault();
            showDimInput('rotation-angle');
            return;
        }
        // Copy mode: Tab to enter exact distance (only after base point is set)
        if (copyModeActive && copyBasePoint && !dimInputMode) {
            e.preventDefault();
            showDimInput('copy-dist');
            return;
        }
        // Gumball: Tab during axis move to enter exact distance
        if (gumballMoveAxis && !dimInputMode) {
            e.preventDefault();
            showDimInput('gumball-dist');
            return;
        }
        // Fillet: Tab during radius adjustment (single or multi)
        if (state.activeTool === 'fillet' && (filletInfo || filletCorners.length > 0) && !dimInputMode) {
            e.preventDefault();
            showDimInput('fillet-radius');
            return;
        }
        // Measurement: Tab during measurement → edit distance
        if (measureResult && measureLine1Id != null && measureLine2Id != null && !dimInputMode) {
            e.preventDefault();
            showDimInput('measure-dist');
            return;
        }
        // Circle: Tab during radius → enter exact radius
        if (state.activeTool === 'circle' && circleCenter && !dimInputMode) {
            e.preventDefault();
            showDimInput('circle-radius');
            return;
        }
        // Polygon: Tab during placement → enter sides first, then radius
        if (state.activeTool === 'polygon' && polyCenter && !dimInputMode) {
            e.preventDefault();
            showDimInput('polygon-sides');
            return;
        }
        if (state.activeTool === 'line' && lineStartWorld && !dimInputMode) {
            e.preventDefault();
            showDimInput('line-length');
            return;
        }
        if (state.activeTool === 'rect' && rectStartWorld && !dimInputMode) {
            e.preventDefault();
            showDimInput('rect-width');
            return;
        }
        // Tab on selected line: edit line length
        if (selectedLineIds.size === 1 && !dimInputMode) {
            e.preventDefault();
            showDimInput('edit-line-length');
            return;
        }
    }
    if (e.key === 'Escape') {
        if (dimInputMode) { hideDimInput(); drawCanvas(); return; }
        if (gumballMoveAxis) { cancelGumballMove(); drawCanvas(); return; }
        if (measureLine1Id != null || measureResult) { resetMeasurement(); drawCanvas(); return; }
        if (filletInfo || filletLine1Id || filletCorners.length > 0) { resetFilletState(); drawCanvas(); return; }
        if (copyModeActive) { cancelCopyMode(); drawCanvas(); return; }
        if (rotationModeActive) { cancelRotation(); drawCanvas(); return; }
        if (pendingSymbolType) { clearPendingSymbol(); updateCursor(); drawCanvas(); return; }
        if (trimRefLineId != null) { resetTrimState(); drawCanvas(); return; }
        if (alignRefLineId != null || alignRefSymId != null) { resetAlignState(); drawCanvas(); return; }
        if (mirrorAxisLineId != null) { resetMirrorState(); drawCanvas(); return; }
        // Cancel in-progress drawing
        if (lineStartWorld) { lineStartWorld = null; drawCanvas(); return; }
        if (rectStartWorld) { rectStartWorld = null; rectCurWorld = null; drawCanvas(); return; }
        if (circleCenter) { circleCenter = null; drawCanvas(); return; }
        if (polyCenter) { polyCenter = null; drawCanvas(); return; }
        if (curvePoints.length > 0) { curvePoints = []; drawCanvas(); return; }
        // Deactivate current tool (return to select mode)
        if (state.activeTool) {
            state.activeTool = null;
            updateToolBtnStates();
            updateCursor();
            drawCanvas();
            return;
        }
        // Clear selection
        selectedIds.clear();
        selectedLineIds.clear();
        drawCanvas();
        return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0 || selectedLineIds.size > 0) pushUndo();
        let changed = false;
        if (selectedIds.size > 0) {
            [...selectedIds].forEach(id => {
                const idx = symbols.findIndex(s => s.id === id);
                if (idx >= 0) symbols.splice(idx, 1);
            });
            selectedIds.clear();
            changed = true;
        }
        if (selectedLineIds.size > 0) {
            [...selectedLineIds].forEach(id => {
                const idx = state.cadLines.findIndex(l => l.id === id);
                if (idx >= 0) state.cadLines.splice(idx, 1);
            });
            selectedLineIds.clear();
            changed = true;
        }
        if (changed) drawCanvas();
        return;
    }
    if (e.key === ' ') {
        e.preventDefault();
        if (selectedIds.size === 1 && selectedLineIds.size === 0) {
            const symId = [...selectedIds][0];
            const sym = symbols.find(s => s.id === symId);
            if (sym) {
                const def = SYMBOL_DEFS[sym.type];
                if (def && def.hasStab) {
                    pushUndo();
                    sym.rotation = ((sym.rotation || 0) + 90) % 360;
                    drawCanvas();
                }
            }
        }
        return;
    }
    if (e.key === 'l' || e.key === 'L') { setTool('line'); return; }
    if (e.key === 'r' || e.key === 'R') { setTool('rect'); return; }
    if (e.key === 'f' || e.key === 'F') { setTool('fillet'); return; }
    if (e.key === 'c' || e.key === 'C') {
        if (e.ctrlKey || e.metaKey) {
            // Ctrl+C: copy mode
            e.preventDefault();
            activateCopyMode();
            drawCanvas();
            return;
        }
        setTool('circle'); return;
    }
    if (e.key === 'p' || e.key === 'P') { setTool('polygon'); return; }
    if (e.key === 'v' || e.key === 'V') { if (!e.ctrlKey && !e.metaKey) { setTool('curve'); return; } }
    if (e.key === 't' || e.key === 'T') { setTool('trim'); return; }
    if (e.key === 'a' || e.key === 'A') { if (!e.ctrlKey && !e.metaKey) { setTool('align'); return; } }
    if (e.key === 'i' || e.key === 'I') { setTool('mirror'); return; }
    if (e.key === 'o' || e.key === 'O') { if (!e.ctrlKey && !e.metaKey) { activateRotationMode(); drawCanvas(); return; } }
    if (e.key === 'g' || e.key === 'G') {
        if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            state.showGrid = !state.showGrid;
            const gb = document.getElementById('hud-layout-grid');
            if (gb) gb.classList.toggle('active', state.showGrid);
            drawCanvas();
            return;
        }
    }
    if (e.key === 's' || e.key === 'S') {
        if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            state.snapToGrid = !state.snapToGrid;
            const sb = document.getElementById('hud-layout-snap');
            if (sb) sb.classList.toggle('active', state.snapToGrid);
            return;
        }
    }
    if (e.key === 'm' || e.key === 'M') {
        if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const dimBtn = document.getElementById('hud-dimension');
            if (dimBtn) dimBtn.click();
            return;
        }
    }
}

// ── Symbol Preview Rendering ──────────────
function renderSymbolPreviews() {
    document.querySelectorAll('.symbol-preview').forEach(cvs => {
        const type = cvs.dataset.type;
        const def = SYMBOL_DEFS[type];
        if (!def) return;

        const pCtx = cvs.getContext('2d');
        const w = cvs.width, h = cvs.height;
        pCtx.clearRect(0, 0, w, h);

        const scale = Math.min((w - 8) / (def.boundW * PX_PER_MM), (h - 8) / (def.boundH * PX_PER_MM));

        pCtx.save();
        pCtx.translate(w / 2, h / 2);
        pCtx.scale(scale, scale);

        const bw = def.boundW * PX_PER_MM;
        const bh = def.boundH * PX_PER_MM;

        // バウンディングボックス
        pCtx.strokeStyle = 'rgba(255,255,255,0.2)';
        pCtx.lineWidth = 1 / scale;
        pCtx.strokeRect(-bw / 2, -bh / 2, bw, bh);

        // スイッチカットアウト
        if (def.hasSwitch) {
            const sw = SWITCH_SZ * PX_PER_MM;
            pCtx.strokeStyle = 'rgba(255,200,0,0.7)';
            pCtx.lineWidth = 1.5 / scale;
            pCtx.strokeRect(-sw / 2, -sw / 2, sw, sw);
        }

        // スタビカットアウト
        if (def.hasStab) {
            const spacing = def.stabSpacing * PX_PER_MM;
            const stabW = STAB_W * PX_PER_MM;
            const stabH = STAB_H * PX_PER_MM;
            pCtx.strokeStyle = 'rgba(255,100,100,0.6)';
            pCtx.lineWidth = 1 / scale;
            for (const side of [-1, 1]) {
                const scx = side * spacing / 2;
                pCtx.strokeRect(scx - stabW / 2, -stabH / 2, stabW, stabH);
            }
        }

        // ねじ穴プレビュー
        if (def.isScrew) {
            const dia = def.screwDia * PX_PER_MM;
            pCtx.strokeStyle = 'rgba(180, 180, 255, 0.7)';
            pCtx.lineWidth = 1.5 / scale;
            pCtx.beginPath();
            pCtx.arc(0, 0, dia / 2, 0, Math.PI * 2);
            pCtx.stroke();
            const cr = dia / 2 * 0.7;
            pCtx.beginPath();
            pCtx.moveTo(-cr, 0); pCtx.lineTo(cr, 0);
            pCtx.moveTo(0, -cr); pCtx.lineTo(0, cr);
            pCtx.stroke();
        }

        pCtx.restore();
    });
}

// ── HUD Toggle Buttons ────────────────────
function createHudToggles() {
    const hud = document.getElementById('hud');
    if (!hud) return;
    const dimBtn = document.getElementById('hud-dimension');
    const insertAfter = dimBtn || null;

    // Grid toggle button
    const gridBtn = document.createElement('button');
    gridBtn.className = 'hud-btn';
    gridBtn.id = 'hud-layout-grid';
    gridBtn.title = 'グリッド切替 (G)';
    gridBtn.style.cssText = 'background:none; border:none; width:28px; height:28px; cursor:pointer; transition: transform 0.2s; padding:2px;';
    gridBtn.innerHTML = `<svg viewBox="0 0 512 512" style="width:100%; height:100%;">
        <path fill="none" stroke="#aaa" stroke-width="40" d="M170 40v432M342 40v432M40 170h432M40 342h432"/>
        <rect x="40" y="40" width="432" height="432" rx="20" fill="none" stroke="#aaa" stroke-width="30"/>
    </svg>`;
    if (state.showGrid) gridBtn.classList.add('active');
    gridBtn.addEventListener('click', () => {
        state.showGrid = !state.showGrid;
        gridBtn.classList.toggle('active', state.showGrid);
        drawCanvas();
    });

    // Snap toggle button
    const snapBtn = document.createElement('button');
    snapBtn.className = 'hud-btn';
    snapBtn.id = 'hud-layout-snap';
    snapBtn.title = 'スナップ切替 (S)';
    snapBtn.style.cssText = 'background:none; border:none; width:28px; height:28px; cursor:pointer; transition: transform 0.2s; padding:2px;';
    snapBtn.innerHTML = `<svg viewBox="0 0 512 512" style="width:100%; height:100%;">
        <circle cx="256" cy="256" r="60" fill="none" stroke="#aaa" stroke-width="30"/>
        <path fill="none" stroke="#aaa" stroke-width="24" d="M256 140v-100M256 372v100M140 256h-100M372 256h100"/>
        <circle cx="256" cy="256" r="12" fill="#aaa"/>
    </svg>`;
    if (state.snapToGrid) snapBtn.classList.add('active');
    snapBtn.addEventListener('click', () => {
        state.snapToGrid = !state.snapToGrid;
        snapBtn.classList.toggle('active', state.snapToGrid);
    });

    // Measurement follow toggle button
    const followBtn = document.createElement('button');
    followBtn.className = 'hud-btn';
    followBtn.id = 'hud-layout-follow';
    followBtn.title = '計測追従 (寸法変更時に線を移動)';
    followBtn.style.cssText = 'background:none; border:none; width:28px; height:28px; cursor:pointer; transition: transform 0.2s; padding:2px;';
    followBtn.innerHTML = `<svg viewBox="0 0 512 512" style="width:100%; height:100%;">
        <path fill="none" stroke="#aaa" stroke-width="30" d="M80 256h200"/>
        <path fill="#aaa" d="M300 220l100 36-100 36z"/>
        <path fill="none" stroke="#aaa" stroke-width="24" stroke-dasharray="20,14" d="M400 256h72"/>
    </svg>`;
    if (measureFollowLines) followBtn.classList.add('active');
    followBtn.addEventListener('click', () => {
        measureFollowLines = !measureFollowLines;
        followBtn.classList.toggle('active', measureFollowLines);
    });

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'hud-btn';
    copyBtn.id = 'hud-layout-copy';
    copyBtn.title = 'コピー (Ctrl+C)';
    copyBtn.style.cssText = 'background:none; border:none; width:28px; height:28px; cursor:pointer; transition: transform 0.2s; padding:2px;';
    copyBtn.innerHTML = `<svg viewBox="0 0 512 512" style="width:100%; height:100%;">
        <rect x="160" y="120" width="260" height="320" rx="20" fill="none" stroke="#aaa" stroke-width="30"/>
        <rect x="90" y="70" width="260" height="320" rx="20" fill="none" stroke="#aaa" stroke-width="30"/>
    </svg>`;
    copyBtn.addEventListener('click', () => {
        activateCopyMode();
        drawCanvas();
    });

    // Trim/Extend button
    const trimBtn = document.createElement('button');
    trimBtn.className = 'hud-btn';
    trimBtn.id = 'hud-layout-trim';
    trimBtn.title = 'トリム/延長 (T)';
    trimBtn.style.cssText = 'background:none; border:none; width:28px; height:28px; cursor:pointer; transition: transform 0.2s; padding:2px;';
    trimBtn.innerHTML = `<svg viewBox="0 0 512 512" style="width:100%; height:100%;">
        <line x1="80" y1="400" x2="432" y2="80" stroke="#aaa" stroke-width="30" stroke-linecap="round"/>
        <line x1="80" y1="80" x2="280" y2="280" stroke="#aaa" stroke-width="30" stroke-linecap="round" stroke-dasharray="20,14"/>
        <circle cx="280" cy="280" r="20" fill="#ff6644"/>
    </svg>`;
    trimBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (state.activeTool === 'trim') {
            setTool(null); resetTrimState();
        } else {
            setTool('trim');
        }
        updateToolBtnStates();
        drawCanvas();
    }, true);

    // Align button
    const alignBtn = document.createElement('button');
    alignBtn.className = 'hud-btn';
    alignBtn.id = 'hud-layout-align';
    alignBtn.title = '位置合わせ (A)';
    alignBtn.style.cssText = 'background:none; border:none; width:28px; height:28px; cursor:pointer; transition: transform 0.2s; padding:2px;';
    alignBtn.innerHTML = `<svg viewBox="0 0 512 512" style="width:100%; height:100%;">
        <line x1="256" y1="60" x2="256" y2="452" stroke="#aaa" stroke-width="24" stroke-dasharray="20,14"/>
        <rect x="100" y="120" width="140" height="80" rx="8" fill="none" stroke="#aaa" stroke-width="24"/>
        <rect x="272" y="300" width="140" height="80" rx="8" fill="none" stroke="#aaa" stroke-width="24"/>
        <path fill="#aaa" d="M220 160l36-20v40z"/>
        <path fill="#aaa" d="M292 340l-36 20v-40z"/>
    </svg>`;
    alignBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (state.activeTool === 'align') {
            setTool(null); resetAlignState();
        } else {
            setTool('align');
        }
        updateToolBtnStates();
        drawCanvas();
    }, true);

    // Mirror button
    const mirrorBtn = document.createElement('button');
    mirrorBtn.className = 'hud-btn';
    mirrorBtn.id = 'hud-layout-mirror';
    mirrorBtn.title = 'ミラー (I)';
    mirrorBtn.style.cssText = 'background:none; border:none; width:28px; height:28px; cursor:pointer; transition: transform 0.2s; padding:2px;';
    mirrorBtn.innerHTML = `<svg viewBox="0 0 512 512" style="width:100%; height:100%;">
        <line x1="256" y1="60" x2="256" y2="452" stroke="#aaa" stroke-width="24" stroke-dasharray="20,14"/>
        <polygon points="100,340 180,200 180,340" fill="none" stroke="#aaa" stroke-width="24" stroke-linejoin="round"/>
        <polygon points="412,340 332,200 332,340" fill="none" stroke="#aaa" stroke-width="24" stroke-linejoin="round"/>
    </svg>`;
    mirrorBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (state.activeTool === 'mirror') {
            setTool(null); resetMirrorState();
        } else {
            setTool('mirror');
        }
        updateToolBtnStates();
        drawCanvas();
    }, true);

    // Rotate button
    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'hud-btn';
    rotateBtn.id = 'hud-layout-rotate';
    rotateBtn.title = '回転 (O)';
    rotateBtn.style.cssText = 'background:none; border:none; width:28px; height:28px; cursor:pointer; transition: transform 0.2s; padding:2px;';
    rotateBtn.innerHTML = `<svg viewBox="0 0 512 512" style="width:100%; height:100%;">
        <path fill="none" stroke="#aaa" stroke-width="30" stroke-linecap="round"
              d="M400 256a144 144 0 1 1-40-100"/>
        <path fill="#aaa" d="M380 120l40 36 10-52z"/>
    </svg>`;
    rotateBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        activateRotationMode();
        drawCanvas();
    }, true);

    // Layer panel toggle button
    const layerBtn = document.createElement('button');
    layerBtn.className = 'hud-btn';
    layerBtn.id = 'hud-layout-layers';
    layerBtn.title = 'レイヤーパネル';
    layerBtn.style.cssText = 'background:none; border:none; width:28px; height:28px; cursor:pointer; transition: transform 0.2s; padding:2px;';
    layerBtn.innerHTML = `<svg viewBox="0 0 24 24" style="width:100%; height:100%;">
        <path fill="#aaa" d="M12 3L2 8l10 5 10-5-10-5z"/>
        <path fill="none" stroke="#aaa" stroke-width="1.5" d="M2 12l10 5 10-5"/>
        <path fill="none" stroke="#aaa" stroke-width="1.5" d="M2 16l10 5 10-5"/>
    </svg>`;
    layerBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        toggleLayerPanel();
    }, true);

    // Separator before layer button
    const layerSep = document.createElement('div');
    layerSep.style.cssText = 'width:1px; height:20px; background:#555; margin:0 4px;';
    layerSep.id = 'hud-layout-layers-sep';

    // Insert after dimension button (next to measurement)
    if (insertAfter && insertAfter.nextSibling) {
        hud.insertBefore(followBtn, insertAfter.nextSibling);
        hud.insertBefore(gridBtn, followBtn.nextSibling);
        hud.insertBefore(snapBtn, gridBtn.nextSibling);
        hud.insertBefore(copyBtn, snapBtn.nextSibling);
        hud.insertBefore(trimBtn, copyBtn.nextSibling);
        hud.insertBefore(alignBtn, trimBtn.nextSibling);
        hud.insertBefore(mirrorBtn, alignBtn.nextSibling);
        hud.insertBefore(rotateBtn, mirrorBtn.nextSibling);
        hud.insertBefore(layerSep, rotateBtn.nextSibling);
        hud.insertBefore(layerBtn, layerSep.nextSibling);
    } else {
        hud.appendChild(followBtn);
        hud.appendChild(gridBtn);
        hud.appendChild(snapBtn);
        hud.appendChild(copyBtn);
        hud.appendChild(trimBtn);
        hud.appendChild(alignBtn);
        hud.appendChild(mirrorBtn);
        hud.appendChild(rotateBtn);
        hud.appendChild(layerSep);
        hud.appendChild(layerBtn);
    }

}

function updateToolBtnStates() {
    // Update HUD tool button active states
    const trimEl = document.getElementById('hud-layout-trim');
    const alignEl = document.getElementById('hud-layout-align');
    const mirrorEl = document.getElementById('hud-layout-mirror');
    if (trimEl) trimEl.classList.toggle('active', state.activeTool === 'trim');
    if (alignEl) alignEl.classList.toggle('active', state.activeTool === 'align');
    if (mirrorEl) mirrorEl.classList.toggle('active', state.activeTool === 'mirror');
    // Also update sidebar tool buttons
    document.querySelectorAll('.layout-tool-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tool === state.activeTool);
    });
}

function removeHudToggles() {
    const ids = ['hud-layout-grid', 'hud-layout-snap', 'hud-layout-follow', 'hud-layout-copy',
                 'hud-layout-trim', 'hud-layout-align', 'hud-layout-mirror', 'hud-layout-rotate',
                 'hud-layout-layers', 'hud-layout-layers-sep'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
}

// ── UI ────────────────────────────────────
function loadUI(container) {
    container.innerHTML = `
        <style>
            .layout-tool-btn {
                padding: 6px 4px; font-size: 0.7rem; border: 1px solid #555;
                background: #222; color: #aaa; cursor: pointer; border-radius: 4px;
                transition: all 0.2s; text-align: center; line-height: 1.2;
            }
            .layout-tool-btn:hover { border-color: #00e5ff; color: #00e5ff; }
            .layout-tool-btn.active { background: #00e5ff; color: #000; border-color: #00e5ff; font-weight: bold; }
            .layout-symbol-item {
                padding: 6px 4px; border: 1px solid #444; border-radius: 4px;
                background: #1a1a2e; cursor: pointer; text-align: center;
                font-size: 0.65rem; color: #aaa; transition: all 0.2s;
            }
            .layout-symbol-item:hover { border-color: #00e5ff; color: #ccc; }
            .layout-symbol-item.active { background: #00e5ff22; border-color: #00e5ff; color: #00e5ff; }
            .lp-desc { display: block; font-size: 0.55rem; color: #666; margin-top: 1px; }
        </style>

        <!-- PRESET -->
        <div class="section-block" id="sec-layout-preset">
            <div class="section-header">プリセット</div>
            <div class="layout-preset-grid" id="layout-preset-buttons" style="grid-template-columns: repeat(3, 1fr);">
                ${Object.entries(LAYOUT_PRESETS).map(([id, p]) => `
                    <button type="button" class="layout-preset-btn" data-preset="${id}">
                        ${p.label}
                        <span class="lp-desc">${p.totalW}u×${p.totalH}u</span>
                    </button>
                `).join('')}
            </div>
        </div>

        <!-- TOOLS -->
        <div class="section-block" id="sec-layout-tools">
            <div class="section-header">ツール</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 6px;">
                <button class="layout-tool-btn active" data-tool="line" title="線を描画 (L)">
                    <span style="font-size:1.1rem;">&#9585;</span><br><span style="font-size:0.6rem;">線</span>
                </button>
                <button class="layout-tool-btn" data-tool="rect" title="四角形を描画 (R)">
                    <span style="font-size:1.1rem;">&#9634;</span><br><span style="font-size:0.6rem;">四角形</span>
                </button>
                <button class="layout-tool-btn" data-tool="fillet" title="フィレット (F)">
                    <span style="font-size:1.1rem;">&#9697;</span><br><span style="font-size:0.6rem;">フィレット</span>
                </button>
                <button class="layout-tool-btn" data-tool="circle" title="円を描画 (C)">
                    <span style="font-size:1.1rem;">&#9675;</span><br><span style="font-size:0.6rem;">円</span>
                </button>
                <button class="layout-tool-btn" data-tool="polygon" title="多角形を描画 (P)">
                    <span style="font-size:1.1rem;">&#11043;</span><br><span style="font-size:0.6rem;">多角形</span>
                </button>
                <button class="layout-tool-btn" data-tool="curve" title="曲線を描画 (V)">
                    <span style="font-size:1.1rem;">&#8767;</span><br><span style="font-size:0.6rem;">曲線</span>
                </button>
            </div>
        </div>

        <!-- SYMBOLS -->
        <div class="section-block" id="sec-layout-symbols">
            <div class="section-header">シンボル</div>
            <div id="layout-symbol-palette" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-top: 6px;">
                ${Object.entries(SYMBOL_DEFS).map(([type, def]) => `
                    <div class="layout-symbol-item" data-symbol-type="${type}">
                        <canvas class="symbol-preview" data-type="${type}" width="60" height="40"
                                style="display:block; margin:0 auto 3px;"></canvas>
                        ${def.label}
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- CANVAS -->
        <div class="section-block" id="sec-layout-canvas">
            <div class="section-header">キャンバス</div>
            <div class="param-row">
                <label>グリッドサイズ (mm)</label>
                <input type="number" id="layout-grid-size" value="${state.gridSize}" step="0.05" min="1" max="100">
            </div>
            <div class="param-row">
                <button id="layout-reset-view" style="flex:1; background:#222; border:1px solid #555; color:#fff; padding:5px; border-radius:3px; cursor:pointer;">
                    ビューリセット</button>
            </div>
            <div class="param-row">
                <button id="layout-clear-all" style="flex:1; background:#331111; border:1px solid #ff5252; color:#ff5252; padding:5px; border-radius:3px; cursor:pointer;">
                    すべてクリア</button>
            </div>
        </div>

        <!-- IMPORT -->
        <div class="section-block" id="sec-layout-import">
            <div class="section-header">インポート</div>
            <button id="layout-cad-import-btn" style="width:100%; background:#1a1a2e; border:1px solid #4fc3f7; color:#4fc3f7; padding:8px 12px; border-radius:4px; cursor:pointer; font-size:0.8rem; transition: background 0.2s;">
                CADインポート (DXF / SVG)
            </button>
            <div style="color:#666; font-size:0.65rem; padding:4px 2px 0;">
                DXF/SVGファイルを読み込み、キャンバスに配置します
            </div>
            <div style="margin-top:10px; padding-top:10px; border-top:1px solid #333;">
                <label style="color:#aaa; font-size:0.72rem; display:block; margin-bottom:4px;">KLE Raw Data</label>
                <textarea id="layout-kle-input" placeholder='[{"a":7},["Q","W","E"]]' style="width:100%; min-height:60px; background:#0a0a1a; border:1px solid #3a3a4e; color:#e0f7fa; padding:6px; border-radius:3px; font-size:0.7rem; font-family:monospace; resize:vertical; box-sizing:border-box;"></textarea>
                <button id="layout-kle-import-btn" style="width:100%; margin-top:6px; background:#1a1a2e; border:1px solid #ffb74d; color:#ffb74d; padding:7px 12px; border-radius:4px; cursor:pointer; font-size:0.78rem; transition:background 0.2s;">
                    KLE インポート
                </button>
                <div style="color:#666; font-size:0.62rem; padding:4px 2px 0; line-height:1.3;">
                    Keyboard Layout Editor の Raw Data をペーストして読み込みます
                </div>
            </div>
        </div>

        <!-- EXPORT -->
        <div class="section-block" id="sec-layout-export">
            <div class="section-header">エクスポート</div>
            <div style="padding:5px;">
                <button id="layout-cad-export-btn" style="width:100%; padding:6px 12px; background:#2a2a3e; border:1px solid #4fc3f7; color:#4fc3f7; border-radius:4px; cursor:pointer; font-size:0.8rem;">
                    CADエクスポート (DXF / SVG)
                </button>
                <button id="layout-qmk-export-btn" style="width:100%; margin-top:6px; padding:6px 12px; background:#2a2a3e; border:1px solid #81c784; color:#81c784; border-radius:4px; cursor:pointer; font-size:0.8rem;">
                    QMK info.json 出力
                </button>
                <button id="layout-csv-dim-btn" style="width:100%; margin-top:6px; padding:6px 12px; background:#2a2a3e; border:1px solid #ffb74d; color:#ffb74d; border-radius:4px; cursor:pointer; font-size:0.8rem;">
                    寸法表 (CSV)
                </button>
                <button id="layout-ergo-eval-btn" style="width:100%; margin-top:6px; padding:6px 12px; background:#2a2a3e; border:1px solid #ce93d8; color:#ce93d8; border-radius:4px; cursor:pointer; font-size:0.8rem;">
                    エルゴ評価
                </button>
            </div>
        </div>

        <!-- PHASE 8: ADVANCED -->
        <div class="section-block" id="sec-layout-advanced">
            <div class="section-header">高度設定</div>
            <div style="padding:5px;">
                <div class="param-row" style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
                    <label style="color:#aaa; font-size:0.72rem; flex:1;">スイッチ穴タイプ</label>
                    <select id="layout-switch-hole-type" style="flex:1; background:#0a0a1a; border:1px solid #3a3a4e; color:#e0f7fa; padding:4px; border-radius:3px; font-size:0.72rem;">
                        <option value="mx">MX (14×14)</option>
                        <option value="choc">Choc (13.8×13.8)</option>
                        <option value="alps">Alps (15.5×12.8)</option>
                    </select>
                </div>
                <button id="layout-mirror-sel-btn" style="width:100%; margin-top:6px; padding:6px 12px; background:#2a2a3e; border:1px solid #4fc3f7; color:#4fc3f7; border-radius:4px; cursor:pointer; font-size:0.8rem;">
                    選択を左右反転
                </button>
                <label style="display:flex; align-items:center; gap:6px; margin-top:8px; color:#aaa; font-size:0.72rem; cursor:pointer;">
                    <input type="checkbox" id="layout-snap-angles" checked>
                    回転スナップ (5°)
                </label>
                <label style="display:flex; align-items:center; gap:6px; margin-top:6px; color:#aaa; font-size:0.72rem; cursor:pointer;">
                    <input type="checkbox" id="layout-show-matrix-ids">
                    マトリクスID表示 (R{row}C{col})
                </label>
            </div>
        </div>

        <!-- GALLERY -->
    `;
}

function bindUI() {
    // Preset buttons
    document.querySelectorAll('#layout-preset-buttons .layout-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    // Tool buttons
    document.querySelectorAll('.layout-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => setTool(btn.dataset.tool));
    });

    // Grid size
    const gridEl = document.getElementById('layout-grid-size');
    if (gridEl) gridEl.addEventListener('input', e => {
        state.gridSize = parseFloat(e.target.value) || 19.05;
        // プリセットが選択中ならplateOutlineのみ再計算（CAD線は再生成しない）
        if (state.activePreset) {
            const p = LAYOUT_PRESETS[state.activePreset];
            if (p) {
                const pitch = state.gridSize;
                const wPx = p.totalW * pitch * PX_PER_MM;
                const hPx = p.totalH * pitch * PX_PER_MM;
                state.plateOutline = { x: -wPx / 2, y: -hPx / 2, w: wPx, h: hPx };
            }
        }
        drawCanvas();
    });

    // Reset view
    const resetBtn = document.getElementById('layout-reset-view');
    if (resetBtn) resetBtn.addEventListener('click', () => {
        state.zoom = 1.0; state.panX = 0; state.panY = 0;
        drawCanvas();
    });

    // Clear all
    const clearBtn = document.getElementById('layout-clear-all');
    if (clearBtn) clearBtn.addEventListener('click', () => {
        pushUndo();
        // 全レイヤーのデータをクリア
        for (const layer of state.layers) {
            layer.cadLines.length = 0;
            layer.symbols.length = 0;
        }
        symbols.length = 0;
        state.cadLines.length = 0;
        state.plateOutline = null;
        state.activePreset = null;
        selectedIds.clear();
        selectedLineIds.clear();
        clearPendingSymbol();
        cancelGumballMove();
        resetFilletState();
        resetMeasurement();
        lineStartWorld = null;
        rectStartWorld = null;
        document.querySelectorAll('#layout-preset-buttons .layout-preset-btn').forEach(b => b.classList.remove('active'));
        updateCursor();
        renderLayerPanel();
        drawCanvas();
    });

    // CAD Import
    const importBtn = document.getElementById('layout-cad-import-btn');
    if (importBtn) importBtn.addEventListener('click', openCadImportDialog);

    // CAD Export
    const exportBtnSidebar = document.getElementById('layout-cad-export-btn');
    if (exportBtnSidebar) exportBtnSidebar.addEventListener('click', openCadExportDialog);

    // Phase 8: QMK info.json
    const qmkBtn = document.getElementById('layout-qmk-export-btn');
    if (qmkBtn) qmkBtn.addEventListener('click', exportQMKInfoJson);

    // Phase 8: 寸法表 CSV
    const csvBtn = document.getElementById('layout-csv-dim-btn');
    if (csvBtn) csvBtn.addEventListener('click', exportDimensionsCSV);

    // Phase 8: エルゴ評価
    const ergoBtn = document.getElementById('layout-ergo-eval-btn');
    if (ergoBtn) ergoBtn.addEventListener('click', evaluateErgonomics);

    // Phase 8: スイッチ穴タイプ
    const holeSel = document.getElementById('layout-switch-hole-type');
    if (holeSel) {
        holeSel.value = state.switchHoleType || 'mx';
        holeSel.addEventListener('change', e => {
            state.switchHoleType = e.target.value || 'mx';
            const sz = getSwitchHoleSize();
            console.log(`[layout] switch hole type=${state.switchHoleType} size=${sz.w}x${sz.h}mm`);
            if (showToast) showToast(`スイッチ穴: ${state.switchHoleType} (${sz.w}×${sz.h}mm)`);
            drawCanvas();
        });
    }

    // Phase 8: ミラー
    const mirrorBtn = document.getElementById('layout-mirror-sel-btn');
    if (mirrorBtn) mirrorBtn.addEventListener('click', mirrorSelectedSymbols);

    // Phase 8: 回転スナップ
    const snapAng = document.getElementById('layout-snap-angles');
    if (snapAng) {
        snapAng.checked = !!state.snapAngles;
        snapAng.addEventListener('change', e => {
            state.snapAngles = !!e.target.checked;
            if (showToast) showToast(`回転スナップ: ${state.snapAngles ? 'ON' : 'OFF'}`);
        });
    }

    // Phase 8: マトリクスID表示
    const matIds = document.getElementById('layout-show-matrix-ids');
    if (matIds) {
        matIds.checked = !!state.showMatrixIds;
        matIds.addEventListener('change', e => {
            state.showMatrixIds = !!e.target.checked;
            if (showToast) showToast(`マトリクスID: ${state.showMatrixIds ? 'ON' : 'OFF'}`);
            drawCanvas();
        });
    }

    // Phase 4-5: KLE Raw Data インポート
    const kleBtn = document.getElementById('layout-kle-import-btn');
    if (kleBtn) kleBtn.addEventListener('click', () => {
        const ta = document.getElementById('layout-kle-input');
        if (!ta) return;
        const text = ta.value.trim();
        if (!text) {
            if (showToast) showToast('KLE Raw Data が空です。');
            return;
        }
        try {
            const added = importKLERawData(text);
            if (showToast) showToast(`KLE インポート完了: ${added} キー`);
        } catch (err) {
            console.error('KLE import error:', err);
            if (showToast) showToast('KLE 読み込み失敗: ' + (err.message || err));
        }
    });

    // Gallery save
    // Symbol palette click-to-place
    document.querySelectorAll('.layout-symbol-item').forEach(item => {
        item.addEventListener('click', () => {
            const type = item.dataset.symbolType;
            if (pendingSymbolType === type) {
                clearPendingSymbol();
            } else {
                document.querySelectorAll('.layout-symbol-item').forEach(i => i.classList.remove('active'));
                pendingSymbolType = type;
                item.classList.add('active');
            }
            updateCursor();
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', onKeyDown);

    // Context menu handlers
    const ctxResetView = document.getElementById('ctx-layout-reset-view');
    if (ctxResetView) {
        ctxResetView.addEventListener('click', () => {
            state.panX = 0;
            state.panY = 0;
            state.zoom = 1;
            drawCanvas();
            document.getElementById('layout-context-menu').style.display = 'none';
        });
    }

    const ctxToggleGrid = document.getElementById('ctx-layout-toggle-grid');
    if (ctxToggleGrid) {
        ctxToggleGrid.addEventListener('click', () => {
            state.showGrid = !state.showGrid;
            const btn = document.getElementById('hud-layout-grid');
            if (btn) btn.classList.toggle('active', state.showGrid);
            drawCanvas();
            document.getElementById('layout-context-menu').style.display = 'none';
        });
    }

    const ctxToggleSnap = document.getElementById('ctx-layout-toggle-snap');
    if (ctxToggleSnap) {
        ctxToggleSnap.addEventListener('click', () => {
            state.snapEnabled = !state.snapEnabled;
            const btn = document.getElementById('hud-layout-snap');
            if (btn) btn.classList.toggle('active', state.snapEnabled);
            drawCanvas();
            document.getElementById('layout-context-menu').style.display = 'none';
        });
    }

    const ctxExport = document.getElementById('ctx-layout-export');
    if (ctxExport) {
        ctxExport.addEventListener('click', () => {
            openCadExportDialog();
            document.getElementById('layout-context-menu').style.display = 'none';
        });
    }

    const ctxSaveGallery = document.getElementById('ctx-layout-save-gallery');
    if (ctxSaveGallery) {
        ctxSaveGallery.addEventListener('click', () => {
            const name = prompt('レイアウト名を入力してください:', 'My Layout ' + Date.now());
            if (name) saveLayoutToGallery(name);
            document.getElementById('layout-context-menu').style.display = 'none';
        });
    }
}

// ── Gallery: IndexedDB ───────────────────
const LAYOUT_DB_NAME = 'LayoutGalleryDB_V1';
const LAYOUT_STORE_NAME = 'presets';
let layoutGalleryDB = null;

function initLayoutGalleryDB() {
    const request = indexedDB.open(LAYOUT_DB_NAME, 1);
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(LAYOUT_STORE_NAME)) {
            db.createObjectStore(LAYOUT_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
    };
    request.onsuccess = (e) => {
        layoutGalleryDB = e.target.result;
        console.log('[LayoutModule] Gallery DB initialized');
    };
    request.onerror = (e) => {
        console.warn('[LayoutModule] Gallery DB error:', e.target.error);
    };
}

function saveLayoutToGallery(name) {
    if (!layoutGalleryDB) {
        if (showToast) showToast('ギャラリーDBが初期化されていません', true);
        return;
    }
    // Generate thumbnail from canvas
    let thumbnail = '';
    if (canvas) {
        try {
            thumbnail = canvas.toDataURL('image/png', 0.4);
        } catch (e) { /* cross-origin etc */ }
    }

    if (state.layers.length > 0) commitActiveLayer();
    const presetName = name || 'Layout ' + new Date().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const item = {
        timestamp: Date.now(),
        name: presetName,
        thumbnail: thumbnail,
        state: {
            ...JSON.parse(JSON.stringify(state)),
            symbols: symbols.map(s => ({ ...s })),
        }
    };

    const tx = layoutGalleryDB.transaction([LAYOUT_STORE_NAME], 'readwrite');
    tx.objectStore(LAYOUT_STORE_NAME).add(item);
    tx.oncomplete = () => {
        if (showToast) showToast(`「${presetName}」をギャラリーに保存しました`);
        if (typeof window.loadLayoutGallery === 'function') window.loadLayoutGallery();
        // Auto-show gallery strip
        const strip = document.getElementById('gallery-strip');
        if (strip && !strip.classList.contains('show')) {
            strip.style.display = 'block';
            strip.classList.add('show');
            if (typeof window.updateHintTooltipPosition === 'function') window.updateHintTooltipPosition();
            if (typeof window.updateViewHelperPosition === 'function') window.updateViewHelperPosition();
        }
    };
    tx.onerror = (e) => {
        if (showToast) showToast('保存に失敗しました', true);
        console.error('[LayoutModule] Gallery save error:', e);
    };
}

function loadLayoutFromGallery(item) {
    if (!item || !item.state) return;
    pushUndo();
    const { symbols: newSyms, layers: newLayers, activeLayerId: newActiveId, ...rest } = item.state;
    Object.assign(state, rest);
    if (newLayers && newLayers.length > 0) {
        state.layers.length = 0;
        state.layers.push(..._deepCopyLayers(newLayers));
        state.activeLayerId = newActiveId || newLayers[0].id;
        let maxLid = 0;
        for (const l of state.layers) if (l.id > maxLid) maxLid = l.id;
        nextLayerId = maxLid + 1;
        syncActiveLayer();
    } else if (newSyms) {
        symbols.length = 0;
        symbols.push(...newSyms);
    }
    // Restore nextLineId/nextSymbolId
    let maxId = 0;
    const allLines = state.layers.length > 0 ? getAllVisibleCadLines() : state.cadLines;
    const allSyms = state.layers.length > 0 ? getAllVisibleSymbols() : symbols;
    for (const l of allLines) { if (l.id > maxId) maxId = l.id; }
    for (const s of allSyms) { if (s.id > maxId) maxId = s.id; }
    nextLineId = maxId + 1;
    nextSymbolId = maxId + 1;
    selectedIds.clear();
    selectedLineIds.clear();
    renderLayerPanel();
    drawCanvas();
    if (showToast) showToast(`「${item.name}」を読み込みました`);
}

function deleteLayoutFromGallery(id) {
    if (!layoutGalleryDB) return;
    const tx = layoutGalleryDB.transaction([LAYOUT_STORE_NAME], 'readwrite');
    tx.objectStore(LAYOUT_STORE_NAME).delete(id);
    tx.oncomplete = () => {
        if (showToast) showToast('プリセットを削除しました');
        if (typeof window.loadLayoutGallery === 'function') window.loadLayoutGallery();
    };
}

function renameLayoutInGallery(id, newName) {
    if (!layoutGalleryDB) return;
    const tx = layoutGalleryDB.transaction([LAYOUT_STORE_NAME], 'readwrite');
    const store = tx.objectStore(LAYOUT_STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
        const item = req.result;
        if (item) {
            item.name = newName;
            store.put(item);
        }
    };
    tx.oncomplete = () => {
        if (typeof window.loadLayoutGallery === 'function') window.loadLayoutGallery();
    };
}

function loadLayoutGalleryItems(callback) {
    if (!layoutGalleryDB) { callback([]); return; }
    const tx = layoutGalleryDB.transaction([LAYOUT_STORE_NAME], 'readonly');
    const req = tx.objectStore(LAYOUT_STORE_NAME).getAll();
    req.onsuccess = () => { callback(req.result || []); };
    req.onerror = () => { callback([]); };
}

// ── Gallery: Batch Export Dialog ─────────
function openLayoutBatchExportDialog() {
    loadLayoutGalleryItems((items) => {
        if (items.length === 0) {
            if (showToast) showToast('ギャラリーにプリセットがありません', true);
            return;
        }
        items.sort((a, b) => b.timestamp - a.timestamp);

        let overlay = document.getElementById('layout-batch-overlay');
        if (overlay) overlay.remove();
        overlay = document.createElement('div');
        overlay.id = 'layout-batch-overlay';
        overlay.className = 'export-popup-overlay';
        overlay.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; z-index:10000; justify-content:center; align-items:center; background:rgba(0,0,0,0); transition:background 0.3s;';
        document.body.appendChild(overlay);

        const selectedSet = new Set(items.map(i => i.id));

        overlay.innerHTML = `
            <div class="export-popup" id="layout-batch-popup" style="min-width:min(650px,95vw); max-width:min(800px,95vw);">
                <div class="export-popup-header">
                    <h3 class="export-popup-title">一括エクスポート</h3>
                    <span class="export-popup-format">Layout</span>
                </div>
                <div style="padding:16px; display:flex; flex-direction:column; gap:12px;">
                    <!-- Preview tiles -->
                    <div id="layout-batch-tiles" style="display:flex; gap:8px; overflow-x:auto; padding:8px 0; min-height:100px; align-items:center;">
                    </div>
                    <!-- Format -->
                    <div style="display:flex; gap:12px; align-items:center;">
                        <span style="color:#aaa; font-size:0.8rem;">形式:</span>
                        <label style="color:#ccc; cursor:pointer; display:flex; align-items:center; gap:4px;">
                            <input type="radio" name="layout-batch-fmt" value="dxf" checked style="accent-color:#4fc3f7;"> DXF
                        </label>
                        <label style="color:#ccc; cursor:pointer; display:flex; align-items:center; gap:4px;">
                            <input type="radio" name="layout-batch-fmt" value="svg" style="accent-color:#4fc3f7;"> SVG
                        </label>
                        <span style="flex:1;"></span>
                        <span style="color:#888; font-size:0.75rem;" id="layout-batch-count">${items.length}件選択中</span>
                    </div>
                    <!-- Buttons -->
                    <div style="display:flex; justify-content:flex-end; gap:8px;">
                        <button id="layout-batch-cancel" class="export-popup-cancel-btn" style="padding:6px 18px; border:1px solid #555; background:transparent; color:#aaa; border-radius:4px; cursor:pointer;">キャンセル</button>
                        <button id="layout-batch-confirm" style="padding:6px 18px; border:none; background:#4fc3f7; color:#111; border-radius:4px; cursor:pointer; font-weight:bold;">エクスポート</button>
                    </div>
                </div>
            </div>
        `;

        const popup = document.getElementById('layout-batch-popup');
        const tilesContainer = document.getElementById('layout-batch-tiles');
        const countLabel = document.getElementById('layout-batch-count');

        // Render tiles
        items.forEach(item => {
            const tile = document.createElement('div');
            tile.style.cssText = 'width:85px; height:85px; position:relative; cursor:pointer; border:2px solid #00e5ff; border-radius:6px; overflow:hidden; flex-shrink:0; transition:all 0.2s;';
            tile.dataset.id = item.id;
            const img = document.createElement('img');
            img.src = item.thumbnail || '';
            img.style.cssText = 'width:100%; height:100%; object-fit:cover; pointer-events:none;';
            const label = document.createElement('div');
            label.style.cssText = 'position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.7); color:#fff; font-size:0.55rem; padding:2px 4px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
            label.textContent = item.name;
            const check = document.createElement('div');
            check.style.cssText = 'position:absolute; top:3px; right:3px; width:16px; height:16px; background:rgba(0,229,255,0.9); border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:10px; color:#000; font-weight:bold;';
            check.textContent = '✓';
            tile.appendChild(img);
            tile.appendChild(label);
            tile.appendChild(check);
            tile.addEventListener('click', () => {
                const id = item.id;
                if (selectedSet.has(id)) {
                    selectedSet.delete(id);
                    tile.style.borderColor = '#444';
                    check.style.display = 'none';
                } else {
                    selectedSet.add(id);
                    tile.style.borderColor = '#00e5ff';
                    check.style.display = 'flex';
                }
                countLabel.textContent = `${selectedSet.size}件選択中`;
            });
            tilesContainer.appendChild(tile);
        });

        function cleanup() {
            overlay.style.background = 'rgba(0,0,0,0)';
            popup.classList.remove('show');
            setTimeout(() => { overlay.style.display = 'none'; overlay.remove(); }, 300);
        }

        document.getElementById('layout-batch-cancel').addEventListener('click', cleanup);
        overlay.addEventListener('click', e => { if (e.target === overlay) cleanup(); });

        document.getElementById('layout-batch-confirm').addEventListener('click', () => {
            if (selectedSet.size === 0) {
                if (showToast) showToast('エクスポートするプリセットを選択してください', true);
                return;
            }
            const fmt = document.querySelector('input[name="layout-batch-fmt"]:checked').value;

            // Save current state to restore after
            const origState = JSON.parse(JSON.stringify(state));
            const origSymbols = symbols.map(s => ({ ...s }));

            let exported = 0;
            for (const item of items) {
                if (!selectedSet.has(item.id)) continue;
                // Apply state temporarily
                const { symbols: newSyms, ...rest } = item.state;
                Object.assign(state, rest);
                if (newSyms) { symbols.length = 0; symbols.push(...newSyms); }

                let content, ext;
                if (fmt === 'svg') {
                    content = exportToSVG();
                    ext = 'svg';
                } else {
                    content = exportToDXF();
                    ext = 'dxf';
                }
                const blob = new Blob([content], { type: fmt === 'svg' ? 'image/svg+xml' : 'application/dxf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${item.name}.${ext}`;
                a.click();
                URL.revokeObjectURL(url);
                exported++;
            }

            // Restore original state
            Object.assign(state, origState);
            symbols.length = 0;
            symbols.push(...origSymbols);
            drawCanvas();

            cleanup();
            if (showToast) showToast(`${exported}件のレイアウトをエクスポートしました`);
        });

        // Show
        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            overlay.style.background = 'rgba(0,0,0,0.7)';
            popup.classList.add('show');
        });
    });
}

// ── Phase 8 feature implementations ────────
function exportQMKInfoJson() {
    const layouts = { LAYOUT: { layout: [] } };
    const pitch = state.gridSize || PITCH;
    symbols.forEach(s => {
        if (s.type && s.type.startsWith('switch-')) {
            const def = SYMBOL_DEFS[s.type];
            const wU = def ? (def.boundW / pitch) : 1;
            layouts.LAYOUT.layout.push({
                matrix: [Math.floor(s.y / pitch / PX_PER_MM), Math.floor(s.x / pitch / PX_PER_MM)],
                x: parseFloat((s.x / PX_PER_MM / pitch).toFixed(2)),
                y: parseFloat((s.y / PX_PER_MM / pitch).toFixed(2)),
                w: wU,
            });
        }
    });
    const json = {
        manufacturer: 'KeybordStudio',
        keyboard_name: 'custom_layout',
        maintainer: 'user',
        usb: { vid: '0xFEED', pid: '0x0000', device_version: '0.0.1' },
        matrix_pins: { rows: [], cols: [] },
        diode_direction: 'COL2ROW',
        layouts,
    };
    try {
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        if (typeof saveAs === 'function') {
            saveAs(blob, 'info.json');
            if (showToast) showToast(`QMK info.json 出力 (${layouts.LAYOUT.layout.length} keys)`);
        } else if (showToast) {
            showToast('saveAs 不可');
        }
    } catch (err) {
        console.error('[layout] QMK export error:', err);
        if (showToast) showToast('QMK 出力失敗: ' + (err.message || err));
    }
}

function exportDimensionsCSV() {
    const rows = ['id,type,x_mm,y_mm,rotation'];
    symbols.forEach(s => {
        const xMm = (s.x / PX_PER_MM).toFixed(3);
        const yMm = (s.y / PX_PER_MM).toFixed(3);
        const rot = (typeof s.rotation === 'number' ? s.rotation : 0).toFixed(2);
        rows.push(`${s.id},${s.type || ''},${xMm},${yMm},${rot}`);
    });
    try {
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
        if (typeof saveAs === 'function') {
            saveAs(blob, 'layout-dimensions.csv');
            if (showToast) showToast(`寸法表 CSV 出力 (${symbols.length} 行)`);
        } else if (showToast) {
            showToast('saveAs 不可');
        }
    } catch (err) {
        console.error('[layout] CSV export error:', err);
        if (showToast) showToast('CSV 出力失敗: ' + (err.message || err));
    }
}

function evaluateErgonomics() {
    if (!symbols.length) {
        if (showToast) showToast('シンボルがありません');
        return;
    }
    const xs = symbols.map(s => s.x);
    const ys = symbols.map(s => s.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const widthMm = (maxX - minX) / PX_PER_MM;
    const heightMm = (maxY - minY) / PX_PER_MM;
    const keyCount = symbols.filter(s => s.type && s.type.startsWith('switch-')).length;
    const pitch = state.gridSize || PITCH;
    // Home row heuristic: rows 3-4 (0-indexed) from top of layout
    const homeRowYStart = minY + 2 * pitch * PX_PER_MM;
    const homeRowYEnd = minY + 4 * pitch * PX_PER_MM;
    const homeCenter = (homeRowYStart + homeRowYEnd) / 2;
    let totalDist = 0, n = 0;
    symbols.forEach(s => {
        if (s.type && s.type.startsWith('switch-')) {
            totalDist += Math.abs(s.y - homeCenter) / PX_PER_MM;
            n++;
        }
    });
    const avgDist = n > 0 ? (totalDist / n).toFixed(2) : '0.00';
    const msg = `エルゴ評価: ${widthMm.toFixed(1)}×${heightMm.toFixed(1)}mm / ${keyCount} keys / ホーム行平均距離 ${avgDist}mm`;
    console.log('[layout] ' + msg);
    if (showToast) showToast(msg);
    else alert(msg);
}

function mirrorSelectedSymbols() {
    if (!selectedIds || selectedIds.size === 0) {
        if (showToast) showToast('シンボルを選択してください');
        return;
    }
    const sel = symbols.filter(s => selectedIds.has(s.id));
    if (sel.length === 0) return;
    if (typeof pushUndo === 'function') pushUndo();
    const minX = Math.min(...sel.map(s => s.x));
    const maxX = Math.max(...sel.map(s => s.x));
    const cx = (minX + maxX) / 2;
    sel.forEach(s => {
        s.x = 2 * cx - s.x;
        if (typeof s.rotation === 'number') s.rotation = -s.rotation;
    });
    drawCanvas();
    if (showToast) showToast(`${sel.length} シンボルを左右反転`);
}

// ── Export Module ──────────────────────────
export const LayoutModule = {
    id: MODULE_ID, name: MODULE_NAME,
    async init(ctx) {
        showToast = ctx.showToast;
        currentLang = ctx.currentLang;

        const c = document.getElementById('module-layout');
        if (c) loadUI(c);
        bindUI();
        initLayoutGalleryDB();

        // Expose gallery functions for index.html integration
        window._layoutModule = {
            saveToGallery: saveLayoutToGallery,
            loadFromGallery: loadLayoutFromGallery,
            deleteFromGallery: deleteLayoutFromGallery,
            renameInGallery: renameLayoutInGallery,
            loadGalleryItems: loadLayoutGalleryItems,
            openBatchExport: openLayoutBatchExportDialog,
            openExportDialog: openCadExportDialog,
        };

        initLayers();
        bindLayerPanel();

        console.log('[LayoutModule] Initialised');
    },
    activate() {
        const el = document.getElementById('module-layout');
        if (el) el.style.display = 'block';

        initCanvas();
        renderSymbolPreviews();
        renderLayerPanel();
        // レイヤーパネルの表示状態はHUDボタンで制御（_layerPanelVisible）
        const layersPanel = document.getElementById('layout-layers-panel');
        if (layersPanel) {
            if (_layerPanelVisible) layersPanel.classList.add('layers-open');
            else layersPanel.classList.remove('layers-open');
        }

        // Layout Studio用HUD設定: 不要なボタンを非表示
        const hideIds = ['hud-view-mode', 'hud-place-mode', 'hud-mode-toggle',
            'hud-toggle-text', 'hud-toggle-svg', 'hud-ams', 'hud-font-manager', 'hud-svg-manager'];
        hideIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
        });
        // セパレータも非表示 (不要な区切り線)
        const hud = document.getElementById('hud');
        if (hud) {
            hud.querySelectorAll('div[style*="width:1px"]').forEach(sep => {
                sep._layoutHidden = true;
                sep.style.display = 'none';
            });
        }
        // フローティングコントロールパネルも非表示
        const mc = document.getElementById('mode-controls');
        if (mc) mc.style.display = 'none';
        const gc = document.getElementById('gumball-target-controls');
        if (gc) gc.style.display = 'none';

        // Gumball toggle handler for layout
        const gumballBtn = document.getElementById('hud-gumball-toggle');
        if (gumballBtn) {
            layoutGumballHandler = (e) => {
                e.stopImmediatePropagation();
                e.preventDefault();
                layoutGumballActive = !layoutGumballActive;
                gumballBtn.classList.toggle('active', layoutGumballActive);
                drawCanvas();
            };
            gumballBtn.addEventListener('click', layoutGumballHandler, true);
        }

        // Dimension button → Layout measurement tool
        const dimBtn = document.getElementById('hud-dimension');
        if (dimBtn) {
            layoutMeasureHandler = (e) => {
                e.stopImmediatePropagation();
                e.preventDefault();
                layoutMeasureActive = !layoutMeasureActive;
                dimBtn.classList.toggle('active', layoutMeasureActive);
                if (!layoutMeasureActive) resetMeasurement();
                drawCanvas();
            };
            dimBtn.addEventListener('click', layoutMeasureHandler, true);
        }

        // Undo/Redo handlers for layout
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        if (undoBtn) {
            undoBtn._layoutHandler = () => layoutUndo();
            undoBtn.addEventListener('click', undoBtn._layoutHandler, true);
        }
        if (redoBtn) {
            redoBtn._layoutHandler = () => layoutRedo();
            redoBtn.addEventListener('click', redoBtn._layoutHandler, true);
        }
        updateUndoButtons();

        // Add Snap/Grid HUD buttons
        createHudToggles();

        // Context menu click handler
        contextMenuClickHandler = (e) => {
            const menu = document.getElementById('layout-context-menu');
            if (menu && !e.target.closest('#layout-context-menu')) {
                menu.style.display = 'none';
            }
        };
        window.addEventListener('click', contextMenuClickHandler);

        if (window.updateFloatingControlsLayout) {
            requestAnimationFrame(window.updateFloatingControlsLayout);
        }
    },
    deactivate() {
        const el = document.getElementById('module-layout');
        if (el) el.style.display = 'none';

        // レイヤーパネル非表示
        const layersPanel = document.getElementById('layout-layers-panel');
        if (layersPanel) layersPanel.classList.remove('layers-open');

        // レイヤーデータを保存
        if (state.layers.length > 0) commitActiveLayer();

        window.removeEventListener('resize', resizeCanvas);

        // HUDボタン復元
        const showIds = ['hud-view-mode', 'hud-place-mode', 'hud-mode-toggle',
            'hud-toggle-text', 'hud-toggle-svg', 'hud-ams', 'hud-font-manager', 'hud-svg-manager'];
        showIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = '';
        });
        // セパレータ復元
        const hud = document.getElementById('hud');
        if (hud) {
            hud.querySelectorAll('div[style*="width:1px"]').forEach(sep => {
                if (sep._layoutHidden) {
                    sep.style.display = '';
                    delete sep._layoutHidden;
                }
            });
        }

        // Gumball handler cleanup
        const gumballBtn = document.getElementById('hud-gumball-toggle');
        if (gumballBtn && layoutGumballHandler) {
            gumballBtn.removeEventListener('click', layoutGumballHandler, true);
            gumballBtn.classList.remove('active');
        }
        layoutGumballActive = false;
        layoutGumballHandler = null;
        cancelGumballMove();

        // Measurement handler cleanup
        const dimBtn = document.getElementById('hud-dimension');
        if (dimBtn && layoutMeasureHandler) {
            dimBtn.removeEventListener('click', layoutMeasureHandler, true);
            dimBtn.classList.remove('active');
        }
        layoutMeasureActive = false;
        layoutMeasureHandler = null;
        resetMeasurement();

        // Undo/Redo handler cleanup
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        if (undoBtn && undoBtn._layoutHandler) {
            undoBtn.removeEventListener('click', undoBtn._layoutHandler, true);
            delete undoBtn._layoutHandler;
        }
        if (redoBtn && redoBtn._layoutHandler) {
            redoBtn.removeEventListener('click', redoBtn._layoutHandler, true);
            delete redoBtn._layoutHandler;
        }

        // Context menu handler cleanup
        if (contextMenuClickHandler) {
            window.removeEventListener('click', contextMenuClickHandler);
            contextMenuClickHandler = null;
        }
        const ctxMenu = document.getElementById('layout-context-menu');
        if (ctxMenu) ctxMenu.style.display = 'none';

        // Remove HUD toggles
        removeHudToggles();

        if (window.updateFloatingControlsLayout) {
            requestAnimationFrame(window.updateFloatingControlsLayout);
        }
    },
    getSectionOptions() { return SECTION_OPTIONS; },
    getState() {
        if (state.layers.length > 0) commitActiveLayer();
        const allLines = state.layers.length > 0 ? getAllVisibleCadLines() : state.cadLines;
        const allSyms = state.layers.length > 0 ? getAllVisibleSymbols() : symbols;
        return {
            ...state,
            cadLines: allLines.map(_deepCopyLine),
            symbols: allSyms.map(s => ({ ...s })),
            layers: _deepCopyLayers(state.layers),
            activeLayerId: state.activeLayerId,
        };
    },
    setState(newState) {
        const { symbols: newSyms, layers: newLayers, activeLayerId: newActiveId, ...rest } = newState;
        Object.assign(state, rest);
        if (newLayers && newLayers.length > 0) {
            state.layers.length = 0;
            state.layers.push(..._deepCopyLayers(newLayers));
            state.activeLayerId = newActiveId || newLayers[0].id;
            let maxLid = 0;
            for (const l of state.layers) if (l.id > maxLid) maxLid = l.id;
            nextLayerId = maxLid + 1;
            syncActiveLayer();
        } else if (newSyms) {
            symbols.length = 0;
            symbols.push(...newSyms);
            if (state.layers.length === 0) initLayers();
            else commitActiveLayer();
        }
        renderLayerPanel();
        drawCanvas();
    },
    getSymbols() { return symbols; },
    getSelectedIds() { return selectedIds; },
};
