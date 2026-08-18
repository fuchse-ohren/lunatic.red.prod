/**
 * CSG Web Worker
 *
 * three-bvh-csg は完全に同期的な API なので、メインスレッドで evaluate すると
 * 大型ジオメトリで 100–500ms 程度の UI 凍結を引き起こす。
 * このワーカーは Brush + Evaluator を Worker 内で動かし、メインスレッドを
 * ブロックしないようにする。
 *
 * - importmap は Worker には継承されないので CDN URL で直接 import している
 *   （メインの index.html の three / three-bvh-csg バージョンと揃えること）
 * - 入出力は Float32Array / Uint16Array / Uint32Array を Transferable で渡す
 *   ためコピーレス。boundingBox はメイン側で再計算する
 *
 * メッセージプロトコル:
 *   in:  { id, op: 'sub' | 'add', a: SerializedGeo, b: SerializedGeo }
 *   out: { id, ok: true,  g: SerializedGeo }
 *        { id, ok: false, error: string }
 *
 *   SerializedGeo = {
 *       position: Float32Array,      // 必須
 *       normal:   Float32Array|null, // 任意（生成済みなら）
 *       index:    Uint16Array | Uint32Array | null
 *   }
 */
'use strict';

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { Brush, Evaluator, SUBTRACTION, ADDITION } from 'https://cdn.jsdelivr.net/npm/three-bvh-csg@0.0.16/+esm';

const evaluator = new Evaluator();

function deserialize(d) {
    if (!d) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(d.position, 3));
    if (d.normal) g.setAttribute('normal', new THREE.BufferAttribute(d.normal, 3));
    if (d.index) g.setIndex(new THREE.BufferAttribute(d.index, 1));
    return g;
}

function serialize(g) {
    g.computeVertexNormals();
    const out = { position: g.attributes.position.array };
    if (g.attributes.normal) out.normal = g.attributes.normal.array;
    if (g.index) out.index = g.index.array;
    return out;
}

self.onmessage = (e) => {
    const data = e.data || {};
    const { id, op, a, b } = data;
    try {
        const A = deserialize(a);
        const B = deserialize(b);
        if (!A || !B) throw new Error('Missing geometry input');
        const ba = new Brush(A); ba.updateMatrixWorld();
        const bb = new Brush(B); bb.updateMatrixWorld();
        const opType = (op === 'sub' || op === 'subtract') ? SUBTRACTION : ADDITION;
        const r = evaluator.evaluate(ba, bb, opType);
        const s = serialize(r.geometry);
        const transfer = [s.position.buffer];
        if (s.normal) transfer.push(s.normal.buffer);
        if (s.index) transfer.push(s.index.buffer);
        self.postMessage({ id, ok: true, g: s }, transfer);
    } catch (err) {
        self.postMessage({ id, ok: false, error: err && err.message ? err.message : String(err) });
    }
};

self.postMessage({ ready: true });
