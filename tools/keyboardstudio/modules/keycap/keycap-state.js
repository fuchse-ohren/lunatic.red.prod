// =============================================
// KeybordStudio V1 - Keycap Studio State Definition
// modules/keycap/keycap-state.js
// =============================================
// Phase 12-C: keycap の initialState 定義をモジュール化。
// index.html 側にも同等の定義が残っているが (互換維持)、新規コードは
// このファイルから KEYCAP_INITIAL_STATE を import して使うのが推奨。
//
// 将来 index.html 側から initialState の重複定義を削除し、ここから
// import するように移行する。

export const KEYCAP_INITIAL_STATE = Object.freeze({
    // Basic
    uSize: 1.0, profile: 'cherry', row: 'R3', unitSize: 19.05, topScale: 1.0, dishType: 'cylindrical',

    // Texture (procedural)
    textureType: 'none', textureScale: 50, textureStrength: 0.05, textureGlobal: false,

    // Image texture
    imgTextureVisible: false, imgScale: 1.0, imgPosX: 0.0, imgPosY: 0.0, imgRot: 0, imgContent: null,

    // Stem extension / stabilizer
    enableStemExtension: false, stemExtension: 1.0, stabilizerType: 'auto', stabilizerOffset: 0.0,

    // Geometry
    twist: 0, tiltX: 0, tiltZ: 0, boxStem: false, legoStud: false,
    legoX: 0.0, legoY: 0.0, legoZ: 0.0, legoClear: 0.0,
    wallThickness: 1.5, ribShorten: 4.3, enableRibs: true,
    homingBump: false, homingType: 'round', bumpX: 0, bumpZ: 0, bumpOffsetY: 0.0, roundCorner: 0.0,
    stemType: 'mx', stemDiameter: 5.50, stemClearance: 0.3,

    // Text (main)
    enableText: true, text: 'A', font: 'helvetiker', fontSize: 8.0, textHeight: 0.5, textMode: 'emboss',
    textThicknessLocked: true, textConform: true, posX: 0, posZ: 0, textOffsetY: 0.0,

    // Text 2 (sub)
    enableText2: false, text2: 'あ', text2Size: 4.0, text2X: 3.5, text2Z: 3.5,
    text2Mode: 'emboss', text2Font: 'helvetiker',

    // Side print
    enableSide: false, sideText: 'FRONT', sideSize: 3.0, sideY: -2.0, sideRot: 0,
    sideMode: 'emboss', sideFont: 'helvetiker',

    // Render
    renderMode: 'standard',

    // Imported model
    modelVisible: true, modelScale: 1.0, modelX: 0, modelY: 0, modelZ: 0,
    modelRX: 0, modelRY: 0, modelRZ: 0, modelOperation: 'union',

    // Global rotation
    globalRotX: 0, globalRotY: 0,

    // SVG
    svgContent: null, svgName: null, svgVisible: true,
    svgScale: 1.0, svgThickness: 0.6, svgMode: 'emboss', svgConform: true,
    svgRotX: 0, svgRotY: 0, svgRotZ: 0, svgOffsetY: 0.0, svgPosX: 0, svgPosZ: 0,

    // Colors / AMS
    colBody: '#333333', colText: '#00e5ff',
    bodyExtruder: null, textExtruder: null,

    // Shape variants
    keyShapeType: 'rectangle', polygonSides: 6, starPoints: 5, starInner: 0.5,
    isoTopWidth: 1.5, isoBottomWidth: 1.25, isoHeight: 2.0,
    isoStemX: 2.4, isoStemZ: 0, isoStabTopZ: -12, isoStabBottomZ: 12,
    customHeight: 9.5, customAngle: 3,

    // Strap hole (Phase 7)
    strapHoleEnabled: false,
    strapHoleFace: 'top',
    strapHoleShape: 'circle',
    strapHoleDiameter: 3.0,
    strapHoleX: 0, strapHoleZ: 0,
    strapHoleLength: 5.0,
    strapHoleAngle: 0,

    // Cross-section view (Phase 4)
    crossSectionEnabled: false,
    crossSectionAxis: 'y',
    crossSectionPos: 0,

    // Phase 9 assist
    materialPreset: 'pla',
    keycapRow: 'r3',
    currentTheme: null,
    showSafeArea: false,
    engraveDepthPreset: 'fdm'
});

/**
 * 新しい state インスタンスを作る (deep clone)。
 * index.html の `let state = JSON.parse(JSON.stringify(initialState));` と同じ動作。
 */
export function createKeycapState() {
    return JSON.parse(JSON.stringify(KEYCAP_INITIAL_STATE));
}
