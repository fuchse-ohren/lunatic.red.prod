/**
 * Font Parse Worker
 *
 * 3dfont-engine の `FontEngine3D.parse(buffer)` をワーカー内で動かして
 * メインスレッドの UI 凍結を回避する。
 *
 * - 大型フォント (CJK, 10,000+ glyphs) でも parse 自体は table 読み + 軽量メタ展開のみ
 *   (Phase 1 で TTF / CFF lazy 化済み) なので速いが、それでも数十〜数百ms単位の
 *   コストがメインスレッドに乗ると体感に響くため worker 化する。
 * - parse 結果は **lazy getter を含むので transferable では送れない**。
 *   よってメインで再度 parse できる ArrayBuffer を返すか、parse 済み JSON を
 *   structuredClone 互換形に変換する必要がある。今回は構造を「事前確定」して
 *   {glyphs(eager展開済)} を返す方針にする。
 *
 * 補足: lazy 化の利点を保つには、よく使うグリフだけ解決して送る方法もあるが、
 * その場合メインで使う文字が後から追加されたとき再要求が必要。シンプルさ優先で
 * worker 内では「事前展開」モードで全グリフ展開し、メインはそれをそのまま使う。
 *
 * メッセージプロトコル:
 *   in:  { id, type: 'parse', buffer: ArrayBuffer }
 *   out: { id, ok: true, json: typefaceJSON }
 *        { id, ok: false, error: string }
 */
'use strict';

importScripts('../3dfont-engine.js');

self.onmessage = (e) => {
    const data = e.data || {};
    const { id, type } = data;
    if (type !== 'parse') {
        self.postMessage({ id, ok: false, error: 'Unknown message type: ' + type });
        return;
    }
    try {
        const buffer = data.buffer;
        if (!buffer) throw new Error('No buffer provided');
        const json = self.FontEngine3D.parse(buffer);
        // glyphs は lazy getter を含むため structuredClone できない。
        // 文字列化して全グリフを実体化させる。
        const glyphs = {};
        if (json && json.glyphs) {
            const keys = Object.keys(json.glyphs);
            for (const k of keys) {
                const g = json.glyphs[k];
                if (!g) continue;
                glyphs[k] = { ha: g.ha || 0, o: typeof g.o === 'string' ? g.o : (g.o || '') };
            }
        }
        const out = {
            glyphs,
            familyName: json.familyName,
            ascender: json.ascender,
            descender: json.descender,
            underlinePosition: json.underlinePosition,
            underlineThickness: json.underlineThickness,
            boundingBox: json.boundingBox,
            resolution: json.resolution,
            kerning: json.kerning || {},
            original_font_information: json.original_font_information || {},
            _meta: json._meta || {}
        };
        self.postMessage({ id, ok: true, json: out });
    } catch (err) {
        self.postMessage({ id, ok: false, error: err && err.message ? err.message : String(err) });
    }
};

self.postMessage({ ready: true });
