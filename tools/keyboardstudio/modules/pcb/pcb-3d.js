// =============================================
// KeybordStudio V1 - PCB 3D preview
// modules/pcb/pcb-3d.js
// =============================================
// PCB データを 3D シーンに表示する。基板本体 + シルクスクリーン +
// 銅トレース (上下) + 部品マーカー + ホール。
//
// 標準的な実機写真に近い見た目になるよう:
//   - 基板色 8 種 (Green/Red/Blue/Black/White/Purple/Yellow/MatteBlack)
//   - シルクスクリーンは白 (黒基板) または黒 (白基板)
//   - 銅トレースは金色 (HASL/ENIG をエミュレート)
//   - 部品マーカーは footprint.bbox から立体描画
//
// 使い方:
//   const pcbViewer = new PCBViewer3D(THREE, scene);
//   pcbViewer.update(pcbData, { color: '#0a4d2a', thickness: 1.6 });
//   pcbViewer.show();   pcbViewer.hide();
//
// PCBViewer3D は内部で 1 つの THREE.Group を保持し、再描画のたびに
// 子要素を全て破棄して作り直す。

import { LAYERS, PCB_COLORS } from './pcb-constants.js';

// 銅 / シルク / 基板厚
const COPPER_COLOR  = 0xb98a3a;   // 金色 (HASL)
const SILK_COLOR    = 0xffffff;   // 白
const SILK_DARK     = 0x0a0a0a;   // 暗い基板用
const HOLE_COLOR    = 0x111111;
const PAD_COLOR     = 0xb98a3a;
const TRACE_HEIGHT  = 0.018;      // 視認しやすいように 0.018mm 持ち上げ
const COMP_DEFAULT_COLOR = 0x222222;

function colorIsLight(hex) {
    const v = (typeof hex === 'string') ? hex.replace('#','') : hex.toString(16).padStart(6,'0');
    const r = parseInt(v.substr(0,2),16);
    const g = parseInt(v.substr(2,2),16);
    const b = parseInt(v.substr(4,2),16);
    return (0.299*r + 0.587*g + 0.114*b) > 140;
}

export class PCBViewer3D {
    /**
     * @param {THREE} THREE   three.js モジュール参照 (グローバル)
     * @param {THREE.Scene} parentScene  追加先のシーン
     * @param {object} options { name, group?: THREE.Group }
     */
    constructor(THREE, parentScene, options = {}) {
        this.THREE = THREE;
        this.scene = parentScene;
        this.group = options.group || new THREE.Group();
        this.group.name = options.name || 'PCBPreview';
        this.group.visible = false;
        parentScene.add(this.group);

        this.boardMesh    = null;
        this.holesGroup   = null;
        this.tracesGroup  = null;
        this.padsGroup    = null;
        this.silkGroup    = null;
        this.compGroup    = null;
        this.boardColorHex = PCB_COLORS.GREEN.hex;
        this.boardThickness = 1.6;
    }

    show() { this.group.visible = true; }
    hide() { this.group.visible = false; }

    /**
     * 既存ジオメトリ・マテリアルを破棄。
     */
    clear() {
        const T = this.THREE;
        const dispose = (obj) => {
            obj.traverse?.(o => {
                if (o.geometry) o.geometry.dispose();
                if (o.material) {
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    mats.forEach(m => m.dispose());
                }
            });
        };
        while (this.group.children.length > 0) {
            const c = this.group.children.pop();
            dispose(c);
        }
        this.boardMesh = null;
        this.holesGroup = null;
        this.tracesGroup = null;
        this.padsGroup = null;
        this.silkGroup = null;
        this.compGroup = null;
    }

    /**
     * 基板色 (16進文字列 or hex) を変更。
     */
    setColor(hex) {
        this.boardColorHex = (typeof hex === 'string') ? hex : `#${hex.toString(16).padStart(6,'0')}`;
        if (this.boardMesh) {
            this.boardMesh.material.color.set(this.boardColorHex);
            // シルク色も基板色に応じて切り替え
            if (this.silkGroup) {
                const dark = colorIsLight(this.boardColorHex);
                this.silkGroup.traverse(o => {
                    if (o.material) o.material.color.setHex(dark ? SILK_DARK : SILK_COLOR);
                });
            }
        }
    }

    /**
     * 基板厚を変更 (再構築が必要なら呼び出し側で update を再実行)。
     */
    setThickness(mm) {
        this.boardThickness = mm;
    }

    /**
     * @param {object} pcbData PCB 全体データ
     *   board: {width, height, thickness?, cornerR?}
     *   holes: [{x,y,drill,plated}]
     *   vias:  [{x,y,drill}]
     *   traces:[{layer, width, points:[{x,y}], net?}]
     *   pads:  [{layer, x, y, w, h, shape}]   ※ pads は components から派生してもよい
     *   components: [{x, y, rotation, ref, footprint, type, side?}]
     *   silkscreen: [{layer, type, ...}]
     * @param {object} options { color, thickness, originX, originY }
     */
    update(pcbData, options = {}) {
        const T = this.THREE;
        this.clear();
        const board = pcbData.board || { width: 100, height: 100, cornerR: 1.5 };
        const thick = options.thickness ?? board.thickness ?? this.boardThickness;
        this.boardThickness = thick;
        const colorHex = options.color || this.boardColorHex;
        this.boardColorHex = colorHex;
        const ox = options.originX ?? 0;
        const oy = options.originY ?? 0;

        // PCB は y-up、x→ 横、z→ 奥行き で配置 (Body Module と同じ規約)
        // Three.js シーン内では基板平面を (x,z) に取り、基板厚を y 方向に持つ。
        // 入力データの (x,y) → THREE では (x, 0, y)。

        // ── 1. 基板本体 ───────────────────────────
        const cornerR = board.cornerR ?? 1.5;
        const shape = new T.Shape();
        const w = board.width, h = board.height;
        const r = Math.max(0, Math.min(cornerR, w/2, h/2));
        shape.moveTo(r, 0);
        shape.lineTo(w - r, 0);
        if (r > 0) shape.quadraticCurveTo(w, 0, w, r);
        shape.lineTo(w, h - r);
        if (r > 0) shape.quadraticCurveTo(w, h, w - r, h);
        shape.lineTo(r, h);
        if (r > 0) shape.quadraticCurveTo(0, h, 0, h - r);
        shape.lineTo(0, r);
        if (r > 0) shape.quadraticCurveTo(0, 0, r, 0);

        // 機械穴 (NPTH/PTH) も基板にくり抜く
        const allHoles = [
            ...(pcbData.holes || []),
            ...(pcbData.vias  || []).map(v => ({ x: v.x, y: v.y, drill: v.drill ?? 0.30 }))
        ];
        for (const hole of allHoles) {
            if (!hole.drill || hole.drill <= 0) continue;
            const path = new T.Path();
            path.absarc(hole.x, hole.y, hole.drill / 2, 0, Math.PI * 2, true);
            shape.holes.push(path);
        }

        const extrude = new T.ExtrudeGeometry(shape, {
            depth: thick, bevelEnabled: false, curveSegments: 12
        });
        // Y-up に回転させる (Shape は xy 平面で生成される)
        extrude.rotateX(-Math.PI / 2);
        extrude.translate(-ox, 0, -oy);
        const boardMat = new T.MeshStandardMaterial({
            color: new T.Color(colorHex),
            roughness: 0.55, metalness: 0.05
        });
        const boardMesh = new T.Mesh(extrude, boardMat);
        boardMesh.name = 'pcb-board';
        boardMesh.castShadow = true;
        boardMesh.receiveShadow = true;
        this.boardMesh = boardMesh;
        this.group.add(boardMesh);

        // ── 2. ホール (黒) ─────────────────────────
        this.holesGroup = new T.Group();
        this.holesGroup.name = 'pcb-holes';
        this.group.add(this.holesGroup);
        const holeMat = new T.MeshStandardMaterial({
            color: HOLE_COLOR, roughness: 0.9, metalness: 0.0
        });
        for (const hole of allHoles) {
            if (!hole.drill || hole.drill <= 0) continue;
            const cyl = new T.CylinderGeometry(hole.drill / 2 * 0.95, hole.drill / 2 * 0.95, thick + 0.01, 12);
            const m = new T.Mesh(cyl, holeMat);
            m.position.set(hole.x - ox, thick / 2, hole.y - oy);
            this.holesGroup.add(m);
        }

        // ── 3. 銅トレース (Top + Bottom) ────────────
        this.tracesGroup = new T.Group();
        this.tracesGroup.name = 'pcb-traces';
        this.group.add(this.tracesGroup);
        const traceMat = new T.MeshStandardMaterial({
            color: COPPER_COLOR, roughness: 0.35, metalness: 0.6
        });
        for (const t of pcbData.traces || []) {
            const layerY = (t.layer === LAYERS.B_CU)
                ? -TRACE_HEIGHT
                : thick + TRACE_HEIGHT;
            const pts = t.points || [];
            for (let i = 1; i < pts.length; i++) {
                const a = pts[i-1], b = pts[i];
                const dx = b.x - a.x, dy = b.y - a.y;
                const len = Math.sqrt(dx*dx + dy*dy);
                if (len < 1e-4) continue;
                const angle = Math.atan2(dy, dx);
                const geo = new T.BoxGeometry(len, 0.03, t.width || 0.25);
                const m = new T.Mesh(geo, traceMat);
                m.position.set(
                    (a.x + b.x) / 2 - ox,
                    layerY,
                    (a.y + b.y) / 2 - oy
                );
                m.rotation.y = -angle;
                this.tracesGroup.add(m);
            }
        }

        // ── 4. パッド (銅露出) ─────────────────────
        this.padsGroup = new T.Group();
        this.padsGroup.name = 'pcb-pads';
        this.group.add(this.padsGroup);
        const padMat = new T.MeshStandardMaterial({
            color: PAD_COLOR, roughness: 0.4, metalness: 0.6
        });
        for (const p of pcbData.pads || []) {
            const layerY = (p.layer === LAYERS.B_CU)
                ? -TRACE_HEIGHT - 0.005
                : thick + TRACE_HEIGHT + 0.005;
            const w = p.w || p.padW || 1.6;
            const h = p.h || p.padH || 1.6;
            const geo = (p.shape === 'circle')
                ? new T.CylinderGeometry(w / 2, w / 2, 0.04, 16)
                : new T.BoxGeometry(w, 0.04, h);
            const m = new T.Mesh(geo, padMat);
            m.position.set(p.x - ox, layerY, p.y - oy);
            if (p.rotation) m.rotation.y = -(p.rotation * Math.PI / 180);
            this.padsGroup.add(m);
        }

        // ── 5. シルクスクリーン (text + line) ──────
        this.silkGroup = new T.Group();
        this.silkGroup.name = 'pcb-silkscreen';
        this.group.add(this.silkGroup);
        const dark = colorIsLight(colorHex);
        const silkMat = new T.LineBasicMaterial({
            color: dark ? SILK_DARK : SILK_COLOR
        });
        for (const s of pcbData.silkscreen || []) {
            const layerY = (s.layer === LAYERS.B_SILK)
                ? -0.025
                : thick + 0.025;
            if (s.type === 'line') {
                const geo = new T.BufferGeometry().setFromPoints([
                    new T.Vector3(s.x1 - ox, layerY, s.y1 - oy),
                    new T.Vector3(s.x2 - ox, layerY, s.y2 - oy)
                ]);
                this.silkGroup.add(new T.Line(geo, silkMat));
            } else if (s.type === 'circle') {
                const segs = 24;
                const pts = [];
                for (let i = 0; i <= segs; i++) {
                    const a = (i / segs) * Math.PI * 2;
                    pts.push(new T.Vector3(
                        s.cx + Math.cos(a) * s.r - ox,
                        layerY,
                        s.cy + Math.sin(a) * s.r - oy
                    ));
                }
                const geo = new T.BufferGeometry().setFromPoints(pts);
                this.silkGroup.add(new T.LineLoop(geo, silkMat));
            } else if (s.type === 'rect') {
                const x0 = s.x - ox, y0 = s.y - oy;
                const w2 = s.w, h2 = s.h;
                const pts = [
                    [x0, y0], [x0 + w2, y0], [x0 + w2, y0 + h2], [x0, y0 + h2], [x0, y0]
                ].map(([x,y]) => new T.Vector3(x, layerY, y));
                const geo = new T.BufferGeometry().setFromPoints(pts);
                this.silkGroup.add(new T.Line(geo, silkMat));
            }
        }

        // ── 6. コンポーネント (bbox 立体プレビュー) ──
        this.compGroup = new T.Group();
        this.compGroup.name = 'pcb-components';
        this.group.add(this.compGroup);
        for (const c of pcbData.components || []) {
            const fp = c.footprint;
            if (!fp || !fp.bbox) continue;
            const bb = fp.bbox;
            const isBottom = c.side === 'B' || c.side === 'bottom' || c.layer === 'B.Cu';
            const geo = new T.BoxGeometry(bb.w || 5, bb.depth || 3, bb.h || 5);
            const mat = new T.MeshStandardMaterial({
                color: bb.color ? new T.Color(bb.color) : COMP_DEFAULT_COLOR,
                roughness: 0.7, metalness: 0.1
            });
            const m = new T.Mesh(geo, mat);
            const yPos = isBottom
                ? -(bb.depth || 3) / 2 - 0.05
                : thick + (bb.depth || 3) / 2 + 0.05;
            m.position.set(c.x - ox, yPos, c.y - oy);
            if (c.rotation) m.rotation.y = -(c.rotation * Math.PI / 180);
            m.userData = { type: 'pcb-component', ref: c.ref, fpId: c.footprintId };
            this.compGroup.add(m);
        }

        return {
            children: this.group.children.length,
            traceCount:    (pcbData.traces || []).length,
            holeCount:     allHoles.length,
            componentCount: (pcbData.components || []).length
        };
    }

    /**
     * Group ごとの可視化トグル (UI でレイヤー個別表示用)。
     */
    setLayerVisible(layerName, visible) {
        const map = {
            traces: this.tracesGroup,
            pads:   this.padsGroup,
            silk:   this.silkGroup,
            comp:   this.compGroup,
            holes:  this.holesGroup
        };
        const g = map[layerName];
        if (g) g.visible = visible;
    }

    /**
     * シーンから完全に切り離して破棄。
     */
    dispose() {
        this.clear();
        if (this.scene && this.group) this.scene.remove(this.group);
    }
}

/**
 * 8 色プリセット (UI のカラー選択ボタン用)。
 */
export const COLOR_PRESETS = Object.freeze(Object.values(PCB_COLORS));

export default PCBViewer3D;
