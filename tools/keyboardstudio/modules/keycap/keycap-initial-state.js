// Initial state for Keycap Studio.
export const INITIAL_KEYCAP_STATE = {
    uSize: 1.0, profile: 'cherry', row: 'R3', unitSize: 19.05, topScale: 1.0, dishType: 'cylindrical',
    textureType: 'none', textureScale: 50, textureStrength: 0.05, textureGlobal: false,
    imgTextureVisible: false, imgScale: 1.0, imgPosX: 0.0, imgPosY: 0.0, imgRot: 0, imgContent: null,
    enableStemExtension: false, stemExtension: 1.0, stabilizerType: 'auto', stabilizerOffset: 0.0,
    twist: 0, tiltX: 0, tiltZ: 0, boxStem: false, legoStud: false, legoX: 0.0, legoY: 0.0, legoZ: 0.0, legoClear: 0.0,
    wallThickness: 1.5, ribShorten: 4.3, enableRibs: true,
    homingBump: false, homingType: 'round', bumpX: 0, bumpZ: 0, bumpOffsetY: 0.0, roundCorner: 0.0,
    stemType: 'mx', stemDiameter: 5.50, stemClearance: 0.3,
    enableText: true, text: 'A', font: 'helvetiker', fontSize: 8.0, textHeight: 0.5, textMode: 'emboss',
    textThicknessLocked: true, textConform: true, posX: 0, posZ: 0, textOffsetY: 0.0,
    enableText2: false, text2: 'あ', text2Size: 4.0, text2X: 3.5, text2Z: 3.5, text2Mode: 'emboss', text2Font: 'helvetiker',
    enableSide: false, sideText: 'FRONT', sideSize: 3.0, sideY: -2.0, sideRot: 0, sideMode: 'emboss', sideFont: 'helvetiker',
    renderMode: 'standard',
    modelVisible: true, modelScale: 1.0, modelX: 0, modelY: 0, modelZ: 0, modelRX: 0, modelRY: 0, modelRZ: 0, modelOperation: 'union',
    globalRotX: 0, globalRotY: 0,
    svgContent: null, svgName: null, svgVisible: true, svgScale: 1.0, svgThickness: 0.6, svgMode: 'emboss', svgConform: true,
    svgRotX: 0, svgRotY: 0, svgRotZ: 0, svgOffsetY: 0.0, svgPosX: 0, svgPosZ: 0,
    colBody: '#333333', colText: '#00e5ff',
    bodyExtruder: null, textExtruder: null,
    keyShapeType: 'rectangle', polygonSides: 6, starPoints: 5, starInner: 0.5,
    isoTopWidth: 1.5, isoBottomWidth: 1.25, isoHeight: 2.0,
    isoStemX: 2.4, isoStemZ: 0, isoStabTopZ: -12, isoStabBottomZ: 12,
    customHeight: 9.5, customAngle: 3,
    // ストラップ穴: ペンダント・キーホルダー用途で keycap に貫通穴を空ける
    strapHoleEnabled: false,
    strapHoleFace: 'top',     // 'top' | 'front' | 'back' | 'left' | 'right'
    strapHoleShape: 'circle', // 'circle' | 'slot'
    strapHoleDiameter: 3.0,
    strapHoleX: 0, strapHoleZ: 0, // 面ローカルの U / V (top: X/Z, side: 横/高さ)
    strapHoleLength: 5.0,     // slot 形状時の長さ
    strapHoleAngle: 0,        // slot 形状時の貫通軸まわり回転 (度)
    // 断面ビュー: 内部構造（肉厚・ステム・カーブ）を確認するためのクリッピング表示
    crossSectionEnabled: false,
    crossSectionAxis: 'y',    // 'x' | 'y' | 'z'
    crossSectionPos: 0,
    // Phase 9 Keycap (材料・テーマ・行)
    materialPreset: 'pla',         // 'pla' | 'abs' | 'petg' | 'resin'
    keycapRow: 'r3',               // 'r1' | 'r2' | 'r3' | 'r4' | 'f-row'
    currentTheme: null,            // セットテーマ名
    showSafeArea: false,           // トップ面安全領域 HUD
    engraveDepthPreset: 'fdm',     // 'fdm' | 'resin' | 'laser' | 'inlay'
    // Phase 14: 配列ビュー (キーボード全体を 3D に並べて確認・編集・一括保存)
    keysetViewEnabled: false,
    keysetLayoutId: '60-ansi',     // '60-ansi' | '65-ansi' | 'tkl-ansi' | 'full-ansi' | '60-jis'
    keysetSpacing: 19.05            // mm キーピッチ
};

export function createInitialKeycapState() {
    return JSON.parse(JSON.stringify(INITIAL_KEYCAP_STATE));
}
