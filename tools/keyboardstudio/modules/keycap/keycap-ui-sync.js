export function syncKeycapUI({
    state,
    paramMap,
    boolMap,
    currentTextTarget,
    syncSlidersToTarget,
    updateLanguageUI
}) {
    for (const [id, key] of Object.entries(paramMap)) {
        const el = document.getElementById(id);
        if (!el) continue;

        el.value = state[key];

        const span = document.getElementById('v-' + id);
        if (span) {
            span.textContent = typeof state[key] === 'number' ? state[key].toFixed(2) : state[key];
            if (id === 'tex-scale' || id === 'polygon-sides' || id === 'star-points') {
                span.textContent = parseInt(state[key], 10);
            }
        }
    }

    for (const [id, key] of Object.entries(boolMap)) {
        const el = document.getElementById(id);
        if (el) el.checked = state[key];
    }

    const tHeight = document.getElementById('text-height');
    if (tHeight) tHeight.disabled = state.textThicknessLocked;

    if (typeof syncSlidersToTarget === 'function') syncSlidersToTarget(currentTextTarget);

    setDisplay('stem-ext-control', state.enableStemExtension);
    setDisplay('stabilizer-custom-ui', state.stabilizerType === 'custom');
    setDisplay('lego-adj-panel', state.legoStud);
    setDisplay('custom-profile-panel', state.profile === 'custom');
    setDisplay('shape-polygon-options', state.keyShapeType === 'polygon');
    setDisplay('shape-star-options', state.keyShapeType === 'star');
    setDisplay('shape-iso-options', state.keyShapeType === 'iso-enter');

    setValue('key-shape-type', state.keyShapeType);
    setValue('col-body', state.colBody);
    setValue('col-text', state.colText);
    setValue('simple-col-body', state.colBody);
    setValue('simple-col-text', state.colText);

    const simpleTextMode = document.getElementById('simple-text-mode');
    if (simpleTextMode) simpleTextMode.value = state.svgContent ? state.svgMode : state.textMode;

    setNumericValue('simple-taper', 'v-simple-taper', state.topScale, 2);
    setValue('simple-dish-type', state.dishType);
    setNumericValue('simple-fillet', 'v-simple-fillet', state.roundCorner, 1);
    setValue('text-content', state.text);
    setValue('text2-content', state.text2);
    setValue('side-text', state.sideText);
    setValue('stem-type-select', state.stemType || 'mx');

    if (typeof window.updateSimpleCustomDropdownHead === 'function') window.updateSimpleCustomDropdownHead();

    const hudModeTarget = document.getElementById('hud-mode-target');
    const hudModeSelect = document.getElementById('hud-mode-select');
    if (hudModeTarget && hudModeSelect) {
        const target = hudModeTarget.value;
        if (target === 'text') hudModeSelect.value = state.textMode;
        else if (target === 'text2') hudModeSelect.value = state.text2Mode;
        else if (target === 'side') hudModeSelect.value = state.sideMode;
        else if (target === 'svg') hudModeSelect.value = state.svgMode;
    }

    if (typeof updateLanguageUI === 'function') updateLanguageUI();
}

function setDisplay(id, visible) {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? 'block' : 'none';
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function setNumericValue(inputId, labelId, value, digits) {
    const input = document.getElementById(inputId);
    if (input) input.value = value;

    const label = document.getElementById(labelId);
    if (label) label.textContent = Number(value).toFixed(digits);
}
