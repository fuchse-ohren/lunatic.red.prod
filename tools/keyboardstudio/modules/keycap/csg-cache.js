// CSG subtraction cache extracted from keycap-app.js.
// keycap × text の subtraction が処理時間の大半を占めるため、ジオメトリ
// ハッシュキー (vertex 数 + bounding box 小数3桁丸め) で結果を再利用する。

export function createCsgCache({ Brush, SUBTRACTION, evaluator, maxEntries = 6 } = {}) {
    const cache = new Map();

    function geoQuickHash(geo) {
        if (!geo) return 'null';
        const pos = geo.attributes && geo.attributes.position;
        if (!pos) return 'no-attr';
        if (!geo.boundingBox) geo.computeBoundingBox();
        const bb = geo.boundingBox;
        return pos.count + ':' +
            bb.min.x.toFixed(3) + ',' + bb.min.y.toFixed(3) + ',' + bb.min.z.toFixed(3) + ':' +
            bb.max.x.toFixed(3) + ',' + bb.max.y.toFixed(3) + ',' + bb.max.z.toFixed(3);
    }

    function touch(key, geo) {
        if (cache.has(key)) cache.delete(key);
        cache.set(key, geo);
        while (cache.size > maxEntries) {
            const oldest = cache.keys().next().value;
            const oldGeo = cache.get(oldest);
            cache.delete(oldest);
            if (oldGeo && oldGeo.dispose) oldGeo.dispose();
        }
    }

    function subtract(aGeo, bGeo) {
        if (!Brush || !SUBTRACTION || !evaluator) {
            throw new Error('csg-cache: Brush, SUBTRACTION, and evaluator are required.');
        }
        const key = 'sub|' + geoQuickHash(aGeo) + '|' + geoQuickHash(bGeo);
        const hit = cache.get(key);
        if (hit) {
            touch(key, hit);
            return hit.clone();
        }
        const b1 = new Brush(aGeo); b1.updateMatrixWorld();
        const b2 = new Brush(bGeo); b2.updateMatrixWorld();
        const res = evaluator.evaluate(b1, b2, SUBTRACTION);
        const out = res.geometry;
        touch(key, out);
        return out.clone();
    }

    function clear() {
        for (const geo of cache.values()) {
            if (geo && geo.dispose) geo.dispose();
        }
        cache.clear();
    }

    function size() { return cache.size; }
    function get(key) { return cache.get(key); }
    function has(key) { return cache.has(key); }

    return {
        geoQuickHash,
        touch,
        subtract,
        get,
        has,
        clear,
        size
    };
}

// Pure helper for any geometry-keyed LRU cache (text geometry, etc).
export function createGeoLRU(maxEntries = 24) {
    const cache = new Map();
    function touch(key, geo) {
        if (cache.has(key)) cache.delete(key);
        cache.set(key, geo);
        while (cache.size > maxEntries) {
            const oldest = cache.keys().next().value;
            const oldGeo = cache.get(oldest);
            cache.delete(oldest);
            if (oldGeo && oldGeo.dispose) oldGeo.dispose();
        }
    }
    function get(key) { return cache.get(key); }
    function has(key) { return cache.has(key); }
    function clear() {
        for (const geo of cache.values()) {
            if (geo && geo.dispose) geo.dispose();
        }
        cache.clear();
    }
    return { get, has, touch, clear, size: () => cache.size };
}
