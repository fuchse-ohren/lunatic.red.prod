// Worker bridge for CSG operations used by the keycap runtime.
export function createCsgSubtractAsync({ THREE, Brush, SUBTRACTION, csgEvaluator }) {
    let worker = null;
    let callId = 0;
    const pending = new Map();

    function ensureWorker() {
        if (worker !== null) return worker;

        try {
            worker = new Worker(new URL('../../workers/csg-worker.js', import.meta.url), { type: 'module' });
            worker.onmessage = (e) => {
                const data = e.data || {};
                if (data.ready) return;

                const request = pending.get(data.id);
                if (!request) return;
                pending.delete(data.id);

                if (!data.ok) {
                    request.reject(new Error(data.error || 'CSG worker failed'));
                    return;
                }

                const g = data.g;
                const geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.BufferAttribute(g.position, 3));
                if (g.normal) geo.setAttribute('normal', new THREE.BufferAttribute(g.normal, 3));
                if (g.index) geo.setIndex(new THREE.BufferAttribute(g.index, 1));
                geo.computeBoundingBox();
                request.resolve(geo);
            };

            worker.onerror = (ev) => {
                console.warn('CSG worker error, falling back to sync CSG:', ev && (ev.message || ev.filename) || ev);
                for (const request of pending.values()) request.reject(new Error('Worker error'));
                pending.clear();
                try { worker.terminate(); } catch (e) { /* ignore */ }
                worker = false;
            };
        } catch (err) {
            console.warn('CSG worker init failed, using sync CSG:', err);
            worker = false;
        }

        return worker;
    }

    function serializeGeometryForWorker(g) {
        const pos = g.attributes.position.array;
        const out = { position: new Float32Array(pos), normal: null, index: null };

        if (g.attributes.normal) out.normal = new Float32Array(g.attributes.normal.array);
        if (g.index) {
            const idx = g.index.array;
            out.index = idx.constructor === Uint16Array ? new Uint16Array(idx) : new Uint32Array(idx);
        }

        return out;
    }

    return function csgSubtractAsync(aGeo, bGeo) {
        const currentWorker = ensureWorker();

        if (currentWorker === false) {
            try {
                const b1 = new Brush(aGeo);
                b1.updateMatrixWorld();
                const b2 = new Brush(bGeo);
                b2.updateMatrixWorld();
                const res = csgEvaluator.evaluate(b1, b2, SUBTRACTION);
                return Promise.resolve(res.geometry);
            } catch (e) {
                return Promise.reject(e);
            }
        }

        return new Promise((resolve, reject) => {
            const id = ++callId;
            pending.set(id, { resolve, reject });

            const aData = serializeGeometryForWorker(aGeo);
            const bData = serializeGeometryForWorker(bGeo);
            const transfer = [aData.position.buffer, bData.position.buffer];

            if (aData.normal) transfer.push(aData.normal.buffer);
            if (bData.normal) transfer.push(bData.normal.buffer);
            if (aData.index) transfer.push(aData.index.buffer);
            if (bData.index) transfer.push(bData.index.buffer);

            currentWorker.postMessage({ id, op: 'sub', a: aData, b: bData }, transfer);
        });
    };
}
