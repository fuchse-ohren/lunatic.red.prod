// =============================================
// Generic <select> dropdown enhancer
// modules/keycap/dropdown-enhance.js
// =============================================
// ネイティブ <select> の OS popup は CSS でアニメーションできないため、
// 1 つずつカスタムドロップダウンに置き換えてアニメーション付きの展開を提供する。
//
// 元の <select> は DOM に残し、選択値の同期と change イベントの dispatch は
// そのまま維持する → 既存の addEventListener('change', ...) はそのまま動作。
//
// 使い方:
//   import { enhanceAllSelects, enhanceSelect } from './dropdown-enhance.js';
//   enhanceAllSelects();   // 既存の <select> をすべて変換
//   // 動的追加された <select> は MutationObserver で自動変換
//
// オプトアウト:
//   <select class="no-enhance">  または  data-no-enhance 属性

const ENHANCED_FLAG = '_dropdownEnhanced';
const SKIP_CLASSES = ['no-enhance'];
let _docClickHandlerInstalled = false;

// ── Document-wide click handler: close any open dropdown when user
//    clicks outside it ────────────────────────────────────────────
function _installDocClickHandler() {
    if (_docClickHandlerInstalled) return;
    _docClickHandlerInstalled = true;
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.es-wrapper.open').forEach(w => {
            if (!w.contains(e.target)) {
                w.classList.remove('open');
                const list = w.querySelector('.es-list');
                if (list) list.classList.remove('open');
            }
        });
    }, true);
    // Esc 閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.es-wrapper.open').forEach(w => {
                w.classList.remove('open');
                const list = w.querySelector('.es-list');
                if (list) list.classList.remove('open');
            });
        }
    });
}

// ── 個別の <select> を強化 ────────────────────────────
export function enhanceSelect(selectEl) {
    if (!selectEl) return null;
    if (selectEl[ENHANCED_FLAG]) return selectEl[ENHANCED_FLAG];
    if (selectEl.multiple || selectEl.size > 1) return null;
    if (selectEl.type !== 'select-one') return null;
    if (SKIP_CLASSES.some(c => selectEl.classList.contains(c))) return null;
    if (selectEl.dataset.noEnhance != null) return null;
    // 隠し select (data store として使われているもの) はスキップ。
    // 例: フォントセレクターは <select style="display:none"> + 既存カスタム UI。
    if (selectEl.style && selectEl.style.display === 'none') return null;
    // 既存の .custom-select-container 内の隠し select もスキップ
    if (selectEl.closest('.custom-select-container')) return null;
    // すでに .es-wrapper でラップ済みの select は二重ラップしない
    if (selectEl.parentElement && selectEl.parentElement.classList.contains('es-wrapper')) {
        // 既存の wrapper を再利用 (api 未保存の場合のためにフラグだけ立てる)
        if (!selectEl[ENHANCED_FLAG]) {
            selectEl[ENHANCED_FLAG] = { wrapper: selectEl.parentElement };
        }
        return selectEl[ENHANCED_FLAG];
    }
    // 早めにフラグを立てて再入を防ぐ (MutationObserver の非同期コールバックで
    // この関数が再呼び出しされても二重ラップしないように)
    selectEl[ENHANCED_FLAG] = { _building: true };

    _installDocClickHandler();

    const wrapper = document.createElement('div');
    wrapper.className = 'es-wrapper';
    // 元 select の inline style から「レイアウト系」のみを wrapper に転送する。
    // 視覚プロパティ (border / background / color / padding / font-* / cursor)
    // は .es-head 側で別途スタイルされるので転送しない (二重描画防止)。
    const LAYOUT_PROPS = new Set([
        'width', 'min-width', 'max-width',
        'height', 'min-height', 'max-height',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
        'align-self', 'justify-self', 'order',
        'display', 'position', 'top', 'right', 'bottom', 'left',
        'z-index', 'box-sizing'
    ]);
    if (selectEl.style) {
        for (let i = 0; i < selectEl.style.length; i++) {
            const prop = selectEl.style[i];
            if (LAYOUT_PROPS.has(prop)) {
                const val = selectEl.style.getPropertyValue(prop);
                const pri = selectEl.style.getPropertyPriority(prop);
                wrapper.style.setProperty(prop, val, pri);
            }
        }
    }

    selectEl.parentNode.insertBefore(wrapper, selectEl);
    wrapper.appendChild(selectEl);
    // 元 select の inline style はもう使わない (隠すだけ)。残しておくと
    // 視覚スタイル (border / background) が透けて見える / レイアウトを乱すので除去。
    selectEl.removeAttribute('style');

    // ネイティブ select は完全に消すと a11y / フォーム送信が壊れる。
    // visually 隠してフォーカスは custom head に渡す。
    selectEl.classList.add('es-native');

    // Custom head (見た目: <select> 風)
    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'es-head';
    head.setAttribute('aria-haspopup', 'listbox');
    head.setAttribute('aria-expanded', 'false');
    head.tabIndex = (selectEl.disabled ? -1 : 0);
    head.innerHTML = '<span class="es-label"></span><span class="es-arrow" aria-hidden="true">▾</span>';
    wrapper.appendChild(head);
    if (selectEl.disabled) head.disabled = true;

    // List (展開部)
    const list = document.createElement('div');
    list.className = 'es-list';
    list.setAttribute('role', 'listbox');
    wrapper.appendChild(list);

    let highlightedIndex = -1;

    function rebuild() {
        const labelEl = head.querySelector('.es-label');
        const sel = selectEl.options[selectEl.selectedIndex];
        if (labelEl) labelEl.textContent = sel ? sel.text : '';

        list.innerHTML = '';
        for (let i = 0; i < selectEl.options.length; i++) {
            const opt = selectEl.options[i];
            const item = document.createElement('div');
            item.className = 'es-item';
            item.setAttribute('role', 'option');
            if (opt.disabled) item.classList.add('disabled');
            if (i === selectEl.selectedIndex) item.classList.add('selected');
            item.textContent = opt.text;
            item.dataset.value = opt.value;
            item.dataset.idx = String(i);
            item.addEventListener('mousedown', (e) => {
                if (opt.disabled) return;
                e.preventDefault();
                _commit(opt.value);
            });
            list.appendChild(item);
        }
    }

    function _commit(value) {
        if (selectEl.value === value) {
            close();
            return;
        }
        selectEl.value = value;
        // change + input 両方発火 (一部のリスナーが input を聞いている可能性)
        try { selectEl.dispatchEvent(new Event('input',  { bubbles: true })); } catch (e) {}
        try { selectEl.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
        rebuild();
        close();
    }

    function open() {
        if (selectEl.disabled) return;
        rebuild();
        wrapper.classList.add('open');
        list.classList.add('open');
        head.setAttribute('aria-expanded', 'true');
        // 選択中アイテムへスクロール
        const sel = list.querySelector('.es-item.selected');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
        highlightedIndex = selectEl.selectedIndex;
    }
    function close() {
        wrapper.classList.remove('open');
        list.classList.remove('open');
        head.setAttribute('aria-expanded', 'false');
        highlightedIndex = -1;
    }
    function toggle() {
        if (wrapper.classList.contains('open')) close();
        else open();
    }

    head.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
    });

    // キーボード操作
    head.addEventListener('keydown', (e) => {
        if (selectEl.disabled) return;
        const open_ = wrapper.classList.contains('open');
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!open_) open();
        }
        if (open_) {
            const items = Array.from(list.querySelectorAll('.es-item:not(.disabled)'));
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightedIndex = Math.min(items.length - 1, highlightedIndex + 1);
                _highlightItem(items, highlightedIndex);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightedIndex = Math.max(0, highlightedIndex - 1);
                _highlightItem(items, highlightedIndex);
            }
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (highlightedIndex >= 0 && items[highlightedIndex]) {
                    _commit(items[highlightedIndex].dataset.value);
                }
            }
        }
        if (e.key === 'Escape' && open_) {
            e.preventDefault();
            close();
        }
    });
    function _highlightItem(items, idx) {
        items.forEach((it, i) => it.classList.toggle('highlight', i === idx));
        if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
    }

    // <select>.value がプログラム的に変更されたとき (外部 JS) → 同期
    // change/input イベントは selectEl.dispatchEvent でも飛ぶので無限ループを避けるため
    // フラグでガード
    let _selfDispatching = false;
    selectEl.addEventListener('change', () => {
        if (_selfDispatching) return;
        rebuild();
    });
    // <option> が動的に追加・削除されたら label / list を更新
    const optObserver = new MutationObserver(() => rebuild());
    optObserver.observe(selectEl, { childList: true, subtree: true, attributes: true, attributeFilter: ['value', 'disabled', 'selected', 'innerHTML'] });

    rebuild();

    const api = { open, close, toggle, rebuild, wrapper, head, list, select: selectEl };
    selectEl[ENHANCED_FLAG] = api;
    return api;
}

// ── 全 <select> を強化 ────────────────────────────────
export function enhanceAllSelects(root = document) {
    if (!root || !root.querySelectorAll) return;
    const selects = root.querySelectorAll('select');
    selects.forEach(s => enhanceSelect(s));
}

// ── 動的追加された <select> も自動強化 ────────────────
let _mutationObserverInstalled = false;
export function installAutoEnhance() {
    if (_mutationObserverInstalled) return;
    _mutationObserverInstalled = true;
    enhanceAllSelects(document);
    const obs = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.tagName === 'SELECT') enhanceSelect(node);
                else if (node.querySelectorAll) {
                    node.querySelectorAll('select').forEach(s => enhanceSelect(s));
                }
            }
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
}

export default enhanceAllSelects;
