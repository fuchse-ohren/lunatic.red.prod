// =============================================
// KeybordStudio V1 - Keymap Studio module
// modules/keymap/keymap-module.js
// =============================================
// 5 番目の Studio。Razer Synapse 風のブラウザベース キーマップ /
// マクロ / LED コントローラー。VIA-compatible firmware を載せたキー
// ボードに WebHID で繋げばリアルタイム反映、繋がない場合はオフライン
// 編集 + JSON エクスポートのみ。

import {
    getState, setState, on, off, setLayer, setKey, getKey, selectKey,
    setLedMode, setLedHue, setLedSat, setLedBright, setLedSpeed, setLedPerKey, clearLedPerKey,
    setMacro, setMacroName, clearMacro, appendMacroAction,
    loadPhysicalLayout, exportJSON, importJSON, resetState, setPhysicalKeys
} from './keymap-state.js';
import {
    KEYCODE_GROUPS, KEYCODES, listByGroup, searchKeycodes,
    getKeycode, getKeycodeById, formatKeycode
} from './keymap-keycodes.js';
import { LAYER_COUNT, LED_MODES, RGB_PRESETS, MAX_MACROS, MACRO_ACTION } from './keymap-constants.js';
import KeymapRenderer from './keymap-render.js';
import {
    getRecorder, playMacroSimulated, serializeViaBuffer, deserializeViaBuffer,
    actionsToString, textToMacro
} from './keymap-macro.js';
import { computeAllColors, hexToRgb, rgbToHex, notifyKeyPress } from './keymap-led.js';
import HIDBridge from './keymap-hid.js';
import {
    downloadKeymapJSON, downloadViaJSON, downloadQmkJSON, downloadTextSummary, importFromFile
} from './keymap-export.js';

const MODULE_ID = 'keymap';
const MODULE_NAME = 'Keymap Studio';

let showToast = (m) => console.log('[Keymap]', m);
let currentLang = 'en';
let renderer = null;
let hidBridge = null;
let _uiLoaded = false;

// Section definitions for nav
const SECTION_OPTIONS = [
    { value: '',                  label: '--- Jump to Section ---' },
    { value: 'km-sec-keyboard',   label: 'Keyboard' },
    { value: 'km-sec-keys',       label: 'Keycode picker' },
    { value: 'km-sec-layers',     label: 'Layers' },
    { value: 'km-sec-macros',     label: 'Macros' },
    { value: 'km-sec-lighting',   label: 'Lighting' },
    { value: 'km-sec-device',     label: 'Device' },
    { value: 'km-sec-export',     label: 'Export' }
];

// ── i18n helpers ─────────────────────────────
const _T = {
    en: {
        'km.title':       'Keymap Studio',
        'km.connect':     'Connect Keyboard',
        'km.disconnect':  'Disconnect',
        'km.realtime':    'Real-time sync',
        'km.layer':       'Layer',
        'km.macros':      'Macros',
        'km.lighting':    'Lighting',
        'km.export':      'Export',
        'km.import':      'Import',
        'km.record':      'Record macro',
        'km.stop':        'Stop',
        'km.test':        'Test (simulate)',
        'km.write':       'Write to keyboard',
        'km.no_hid':      'WebHID not available — use Chrome / Edge over HTTPS or localhost.'
    },
    ja: {
        'km.title':       'Keymap Studio',
        'km.connect':     'キーボードを接続',
        'km.disconnect':  '切断',
        'km.realtime':    'リアルタイム同期',
        'km.layer':       'レイヤー',
        'km.macros':      'マクロ',
        'km.lighting':    'ライティング',
        'km.export':      'エクスポート',
        'km.import':      'インポート',
        'km.record':      'マクロを録画',
        'km.stop':        '停止',
        'km.test':        'テスト (シミュレート)',
        'km.write':       'キーボードに書き込み',
        'km.no_hid':      'WebHID は Chrome/Edge かつ HTTPS/localhost 環境のみ。'
    }
};
function t(key) {
    const lang = currentLang === 'ja' ? 'ja' : 'en';
    return (_T[lang] && _T[lang][key]) || _T.en[key] || key;
}

// ── UI loader ────────────────────────────────
async function loadUI(container) {
    if (_uiLoaded) return;
    _uiLoaded = true;
    try {
        const html = await fetch('modules/keymap/keymap-ui.html').then(r => r.text());
        container.innerHTML = html;
    } catch (e) { console.error('[KeymapModule] UI load failed', e); }
    if (!document.querySelector('link[data-keymap-css]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'modules/keymap/keymap-css.css';
        link.dataset.keymapCss = '1';
        document.head.appendChild(link);
    }
}

function $(id) { return document.getElementById(id); }

// ── Keycode picker ────────────────────────────
let _pickerPanel = null;
let _pickerActiveKey = -1;

function buildKeycodePicker(host) {
    if (!host) return;
    host.innerHTML = '';
    // Search
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Search keycodes...';
    search.id = 'km-keycode-search';
    search.className = 'km-search';
    host.appendChild(search);

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'km-kc-tabs';
    KEYCODE_GROUPS.forEach((g, i) => {
        const b = document.createElement('button');
        b.className = 'km-kc-tab' + (i === 0 ? ' active' : '');
        b.textContent = g;
        b.dataset.group = g;
        b.addEventListener('click', () => {
            tabs.querySelectorAll('.km-kc-tab').forEach(t => t.classList.remove('active'));
            b.classList.add('active');
            renderGrid(g);
        });
        tabs.appendChild(b);
    });
    host.appendChild(tabs);

    const grid = document.createElement('div');
    grid.className = 'km-kc-grid';
    host.appendChild(grid);

    function renderGrid(group, query = '') {
        grid.innerHTML = '';
        const items = query ? searchKeycodes(query) : listByGroup(group);
        items.slice(0, 200).forEach(kc => {
            const b = document.createElement('button');
            b.className = 'km-kc-item';
            b.dataset.code = kc.code;
            b.textContent = kc.label || kc.id;
            b.title = kc.id + (kc.desc ? ` — ${kc.desc}` : '');
            b.addEventListener('click', () => assignKeycode(kc.code));
            grid.appendChild(b);
        });
    }

    search.addEventListener('input', () => {
        if (search.value.trim()) renderGrid('', search.value);
        else {
            const active = tabs.querySelector('.km-kc-tab.active');
            renderGrid(active?.dataset.group || 'basic');
        }
    });
    renderGrid('basic');
    _pickerPanel = host;
}

function assignKeycode(code) {
    const s = getState();
    if (s.selectedKey == null || s.selectedKey < 0) {
        showToast('Select a key on the keyboard first.');
        return;
    }
    setKey(s.currentLayer, s.selectedKey, code);
    if (s.realTimePreview && hidBridge?.connected) {
        // Best-effort live write
        hidBridge.writeKeyByIndex(s.currentLayer, s.selectedKey, code).catch(e => {
            console.warn('[KeymapModule] HID write failed', e);
        });
    }
    refreshSelectedKeyInfo();
}

// ── Layer tabs ───────────────────────────────
function buildLayerTabs(host) {
    if (!host) return;
    host.innerHTML = '';
    for (let i = 0; i < LAYER_COUNT; i++) {
        const b = document.createElement('button');
        b.className = 'km-layer-tab' + (i === 0 ? ' active' : '');
        b.dataset.layer = i;
        b.textContent = `L${i}`;
        b.addEventListener('click', () => {
            host.querySelectorAll('.km-layer-tab').forEach(t => t.classList.remove('active'));
            b.classList.add('active');
            setLayer(i);
        });
        host.appendChild(b);
    }
}

// ── Macros panel ──────────────────────────────
let _activeMacroIdx = 0;
function buildMacrosUI() {
    const list = $('km-macro-list');
    if (list) {
        list.innerHTML = '';
        for (let i = 0; i < MAX_MACROS; i++) {
            const b = document.createElement('button');
            b.className = 'km-macro-item' + (i === _activeMacroIdx ? ' active' : '');
            b.dataset.idx = i;
            const s = getState();
            b.textContent = (s.macroNames?.[i] || `Macro ${i}`);
            b.addEventListener('click', () => {
                _activeMacroIdx = i;
                list.querySelectorAll('.km-macro-item').forEach(it => it.classList.remove('active'));
                b.classList.add('active');
                refreshMacroEditor();
            });
            list.appendChild(b);
        }
    }
    refreshMacroEditor();

    $('km-macro-record')?.addEventListener('click', () => {
        const rec = getRecorder();
        if (rec.recording) {
            const acts = rec.stop();
            setMacro(_activeMacroIdx, acts);
            $('km-macro-record').textContent = '● Record';
            $('km-macro-record').classList.remove('recording');
            showToast('Macro recorded.');
            refreshMacroEditor();
        } else {
            rec.start();
            $('km-macro-record').textContent = '■ Stop (Esc)';
            $('km-macro-record').classList.add('recording');
            showToast('Recording — press Esc to stop.');
        }
    });
    $('km-macro-clear')?.addEventListener('click', () => {
        clearMacro(_activeMacroIdx);
        refreshMacroEditor();
    });
    $('km-macro-test')?.addEventListener('click', () => {
        const acts = getState().macros[_activeMacroIdx] || [];
        playMacroSimulated(acts);
    });
    $('km-macro-text-add')?.addEventListener('click', () => {
        const txt = ($('km-macro-text-input')?.value || '').trim();
        if (!txt) return;
        const cur = getState().macros[_activeMacroIdx] || [];
        setMacro(_activeMacroIdx, [...cur, { type: MACRO_ACTION.TEXT, text: txt }]);
        $('km-macro-text-input').value = '';
        refreshMacroEditor();
    });
    $('km-macro-name')?.addEventListener('change', () => {
        setMacroName(_activeMacroIdx, $('km-macro-name').value);
        buildMacrosUI();
    });
    $('km-macro-write')?.addEventListener('click', async () => {
        if (!hidBridge?.connected) { showToast('Connect a keyboard first.'); return; }
        try {
            const buffers = getState().macros.map(m => serializeViaBuffer(m));
            // Concatenate all macros into one buffer
            const total = buffers.reduce((s, b) => s + b.length, 0);
            const combined = new Uint8Array(total);
            let off = 0;
            for (const b of buffers) { combined.set(b, off); off += b.length; }
            await hidBridge.setMacroBuffer(combined);
            showToast('Macros written to keyboard.');
        } catch (e) { showToast('Write failed: ' + e.message); }
    });
}

function refreshMacroEditor() {
    const editor = $('km-macro-editor');
    const nameInput = $('km-macro-name');
    const s = getState();
    if (nameInput) nameInput.value = s.macroNames?.[_activeMacroIdx] || `Macro ${_activeMacroIdx}`;
    if (!editor) return;
    const acts = s.macros[_activeMacroIdx] || [];
    editor.innerHTML = '';
    if (!acts.length) {
        editor.innerHTML = '<div class="km-empty">(empty — record or add a text)</div>';
        return;
    }
    acts.forEach((a, i) => {
        const row = document.createElement('div');
        row.className = 'km-macro-row';
        row.innerHTML = `<span class="km-macro-tag">${a.type}</span>` +
            `<span class="km-macro-val">${
                a.type === MACRO_ACTION.DELAY ? `${a.ms} ms` :
                a.type === MACRO_ACTION.TEXT ? `"${a.text}"` :
                getKeycode(a.code)?.label || `0x${a.code?.toString(16)}`
            }</span>` +
            `<button class="km-macro-rm" data-i="${i}" aria-label="remove">×</button>`;
        editor.appendChild(row);
    });
    editor.querySelectorAll('.km-macro-rm').forEach(b =>
        b.addEventListener('click', () => {
            const i = +b.dataset.i;
            const cur = (getState().macros[_activeMacroIdx] || []).slice();
            cur.splice(i, 1);
            setMacro(_activeMacroIdx, cur);
            refreshMacroEditor();
        })
    );
}

// ── Lighting panel ───────────────────────────
function buildLightingUI() {
    const modes = $('km-led-mode');
    if (modes) {
        modes.innerHTML = LED_MODES.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        modes.value = getState().ledMode;
        modes.addEventListener('change', () => {
            setLedMode(modes.value);
            pushLedToHidIfRealtime();
        });
    }
    bindRange('km-led-hue',    v => { setLedHue(+v); pushLedToHidIfRealtime(); });
    bindRange('km-led-sat',    v => { setLedSat(+v / 100); pushLedToHidIfRealtime(); });
    bindRange('km-led-bright', v => { setLedBright(+v); pushLedToHidIfRealtime(); });
    bindRange('km-led-speed',  v => { setLedSpeed(+v); pushLedToHidIfRealtime(); });

    const presets = $('km-led-presets');
    if (presets) {
        presets.innerHTML = '';
        for (const p of RGB_PRESETS) {
            const b = document.createElement('button');
            b.className = 'km-led-preset';
            b.title = p.name;
            b.style.background = p.hex;
            b.dataset.hex = p.hex;
            b.addEventListener('click', () => applyHexToLed(p.hex));
            presets.appendChild(b);
        }
    }
    const picker = $('km-led-color');
    if (picker) {
        picker.addEventListener('change', () => applyHexToLed(picker.value));
    }
    $('km-led-clear')?.addEventListener('click', () => {
        clearLedPerKey();
    });
    $('km-led-write')?.addEventListener('click', () => pushLedToHid());
}

function applyHexToLed(hex) {
    const s = getState();
    if (s.ledMode === 'per_key' && s.selectedKey != null) {
        setLedPerKey(s.selectedKey, hex);
    } else {
        // Convert hex to HSV
        const [r, g, b] = hexToRgb(hex);
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const v = max / 255;
        const sat = max ? (max - min) / max : 0;
        let h = 0;
        if (max !== min) {
            if (max === r) h = ((g - b) / (max - min)) * 60;
            else if (max === g) h = ((b - r) / (max - min) + 2) * 60;
            else                 h = ((r - g) / (max - min) + 4) * 60;
        }
        if (h < 0) h += 360;
        setLedHue(h);
        setLedSat(sat);
        setLedBright(Math.max(getState().ledBrightness, Math.round(v * 255)));
    }
    pushLedToHidIfRealtime();
}

function pushLedToHid() {
    if (!hidBridge?.connected) { showToast('Connect a keyboard first.'); return; }
    hidBridge.pushLedState(getState()).catch(e => showToast('LED write failed: ' + e.message));
}
function pushLedToHidIfRealtime() {
    if (hidBridge?.connected && getState().realTimePreview) {
        hidBridge.pushLedState(getState()).catch(() => {});
    }
}

function bindRange(id, cb) {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', () => cb(el.value));
}

// ── Device panel ─────────────────────────────
function buildDeviceUI() {
    const supports = !!navigator.hid;
    const status = $('km-device-status');
    if (status) {
        status.textContent = supports ? 'Click "Connect" to pair.' : t('km.no_hid');
        if (!supports) status.classList.add('km-warn');
    }
    $('km-device-connect')?.addEventListener('click', async () => {
        try {
            if (!hidBridge.isSupported()) throw new Error(t('km.no_hid'));
            const info = await hidBridge.requestDevice();
            const s = $('km-device-status');
            if (s) {
                s.classList.remove('km-warn');
                s.innerHTML = `<b>Connected:</b> ${info.productName || '(unnamed)'}<br>
                    Protocol v${info.protocolVersion}, ${info.layerCount} layers, ${info.macroCount} macros`;
            }
            getState().connected = true;
            // Auto-pull existing keymap
            try { await pullKeymapFromDevice(); } catch (e) { console.warn(e); }
        } catch (e) {
            showToast('Connect failed: ' + e.message);
        }
    });
    $('km-device-disconnect')?.addEventListener('click', async () => {
        await hidBridge.disconnect();
        getState().connected = false;
        const s = $('km-device-status');
        if (s) s.textContent = 'Disconnected.';
    });
    $('km-device-write')?.addEventListener('click', writeFullKeymapToDevice);
    $('km-device-read')?.addEventListener('click', () => pullKeymapFromDevice().then(
        () => showToast('Read complete.'),
        e => showToast('Read failed: ' + e.message)
    ));
    const rt = $('km-realtime');
    if (rt) {
        rt.checked = getState().realTimePreview;
        rt.addEventListener('change', () => {
            getState().realTimePreview = rt.checked;
        });
    }
}

async function pullKeymapFromDevice() {
    if (!hidBridge?.connected) return;
    const s = getState();
    for (let layer = 0; layer < s.layers.length; layer++) {
        for (let i = 0; i < s.physicalKeys.length; i++) {
            const row = (i >> 8) & 0xFF;
            const col = i & 0xFF;
            try {
                const code = await hidBridge.getKeycode(layer, row, col);
                s.layers[layer][i] = code;
            } catch (e) { /* ignore individual failures */ }
        }
    }
    setState(s);
}

async function writeFullKeymapToDevice() {
    if (!hidBridge?.connected) { showToast('Connect a keyboard first.'); return; }
    const s = getState();
    let count = 0;
    for (let layer = 0; layer < s.layers.length; layer++) {
        for (let i = 0; i < s.physicalKeys.length; i++) {
            try {
                await hidBridge.writeKeyByIndex(layer, i, s.layers[layer][i]);
                count++;
            } catch (e) { /* ignore */ }
        }
    }
    showToast(`Wrote ${count} keymap entries.`);
}

// ── Selected key info pane ────────────────────
function refreshSelectedKeyInfo() {
    const host = $('km-key-info');
    if (!host) return;
    const s = getState();
    const idx = s.selectedKey;
    if (idx == null || idx < 0) {
        host.innerHTML = '<i>Select a key…</i>';
        return;
    }
    const phys = s.physicalKeys[idx];
    const code = s.layers[s.currentLayer][idx];
    const k = getKeycode(code);
    host.innerHTML = `
        <div><b>${phys?.label || 'Key'} (${idx})</b> — pos (${phys?.x}, ${phys?.y}), ${phys?.w}u</div>
        <div>Layer ${s.currentLayer}: <b>${formatKeycode(code)}</b> ${k ? `<i>(${k.id})</i>` : ''}</div>
        ${k?.desc ? `<div class="km-help">${k.desc}</div>` : ''}
    `;
}

// ── Wiring ──────────────────────────────────
function bindUI() {
    buildLayerTabs($('km-layer-tabs'));
    buildKeycodePicker($('km-keycode-picker'));
    buildMacrosUI();
    buildLightingUI();
    buildDeviceUI();

    // Tab switching
    document.querySelectorAll('.km-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.km-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.km-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('km-panel-' + tab)?.classList.add('active');
        });
    });

    // Layout chooser (default ANSI60 already loaded)
    const layoutSel = $('km-layout-select');
    if (layoutSel) {
        layoutSel.innerHTML = `<option value="ansi60">60% ANSI</option>`;
        layoutSel.value = 'ansi60';
        layoutSel.addEventListener('change', () => {
            loadPhysicalLayout(layoutSel.value);
            refreshSelectedKeyInfo();
        });
    }

    // Sync from Layout Studio button
    $('km-sync-from-layout')?.addEventListener('click', () => {
        try {
            const layoutMod = window._layoutModule;
            if (!layoutMod) { showToast('Layout Studio not available.'); return; }
            // Pull current symbols from layout state and convert to physicalKeys
            const layoutState = window._layoutModuleState?.() || null;
            if (!layoutState || !layoutState.symbols) {
                showToast('Open Layout Studio and place key symbols first.');
                return;
            }
            const keys = layoutState.symbols.map((s, i) => ({
                index: i, x: s.x / 19.05, y: s.y / 19.05,
                w: (s.w || 19.05) / 19.05, h: (s.h || 19.05) / 19.05,
                label: s.label || '', defaultKey: 'KC_NO'
            }));
            setPhysicalKeys(keys);
            showToast(`Synced ${keys.length} keys from Layout Studio.`);
        } catch (e) { showToast('Sync failed: ' + e.message); }
    });

    // Export / Import buttons
    $('km-export-json')?.addEventListener('click', () => downloadKeymapJSON());
    $('km-export-via')?.addEventListener('click',  () => downloadViaJSON());
    $('km-export-qmk')?.addEventListener('click',  () => downloadQmkJSON());
    $('km-export-txt')?.addEventListener('click',  () => downloadTextSummary());
    $('km-import-file')?.addEventListener('change', async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        try {
            await importFromFile(f);
            showToast('Imported.');
        } catch (err) { showToast('Import failed: ' + err.message); }
        e.target.value = '';
    });
    $('km-reset')?.addEventListener('click', () => {
        if (confirm('Reset all keymap / macros / LED to defaults?')) resetState();
    });

    // Subscribe to state changes
    on('state',  () => refreshSelectedKeyInfo());
    on('select', () => refreshSelectedKeyInfo());
    on('layer',  () => refreshSelectedKeyInfo());
    on('key',    () => refreshSelectedKeyInfo());
    on('macro',  () => refreshMacroEditor());
}

// ── Public Module API ────────────────────────
let _container = null;

export const KeymapModule = {
    id: MODULE_ID, name: MODULE_NAME,

    async init(ctx) {
        showToast = ctx.showToast || showToast;
        currentLang = ctx.currentLang || 'en';

        const container = document.getElementById('module-keymap');
        _container = container;
        if (container) await loadUI(container);

        hidBridge = new HIDBridge((evt, data) => {
            if (evt === 'connected') getState().connected = true;
            if (evt === 'disconnected') getState().connected = false;
        });
        // try silent reconnect (already-permitted devices)
        if (hidBridge.isSupported()) {
            hidBridge.tryAutoConnect().catch(() => {});
        }

        // Build canvas + renderer
        const canvas = document.getElementById('km-canvas');
        if (canvas) {
            renderer = new KeymapRenderer(canvas, {
                getState,
                onKeyClick: (idx) => {
                    selectKey(idx);
                    refreshSelectedKeyInfo();
                },
                onKeyDoubleClick: (idx) => {
                    selectKey(idx);
                    // Surface the picker — focus the search field if present
                    const search = document.getElementById('km-keycode-search');
                    if (search) search.focus();
                }
            });
        }

        bindUI();
        console.log('[KeymapModule] Initialised');
    },

    activate() {
        if (_container) _container.style.display = 'block';
        renderer?.start();
        renderer?.resize();
    },

    deactivate() {
        if (_container) _container.style.display = 'none';
        renderer?.stop();
        // Stop macro recording if active
        const rec = getRecorder();
        if (rec.recording) rec.stop();
    },

    getSectionOptions() { return SECTION_OPTIONS; },
    getState,
    setState,

    // Programmatic API
    loadPhysicalLayout,
    setPhysicalKeys,
    importJSON,
    exportJSON,
    connectDevice: () => hidBridge?.requestDevice(),
    disconnectDevice: () => hidBridge?.disconnect(),
    writeFullKeymapToDevice,
    pullKeymapFromDevice
};

export default KeymapModule;
