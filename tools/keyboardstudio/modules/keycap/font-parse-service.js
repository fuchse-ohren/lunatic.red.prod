// Worker-backed font parser with a synchronous fallback.
export function createFontParser(parseSync) {
    let worker = null;
    let callId = 0;
    const pending = new Map();

    function ensureWorker() {
        if (worker !== null) return worker;

        try {
            worker = new Worker(new URL('../../workers/font-parse-worker.js', import.meta.url));
            worker.onmessage = (e) => {
                const data = e.data || {};
                if (data.ready) return;

                const request = pending.get(data.id);
                if (!request) return;
                pending.delete(data.id);

                if (!data.ok) {
                    request.reject(new Error(data.error || 'Font parse worker failed'));
                    return;
                }

                request.resolve(data.json);
            };

            worker.onerror = (ev) => {
                console.warn('Font worker error, falling back to sync parse:', ev && (ev.message || ev.filename) || ev);
                for (const request of pending.values()) request.reject(new Error('Font worker error'));
                pending.clear();
                try { worker.terminate(); } catch (e) { /* ignore */ }
                worker = false;
            };
        } catch (err) {
            console.warn('Font worker init failed, using sync parse:', err);
            worker = false;
        }

        return worker;
    }

    return function parseFontAsync(buffer) {
        const currentWorker = ensureWorker();

        if (currentWorker === false) {
            try {
                return Promise.resolve(parseSync(buffer));
            } catch (e) {
                return Promise.reject(e);
            }
        }

        return new Promise((resolve, reject) => {
            const id = ++callId;
            pending.set(id, { resolve, reject });

            const bufClone = buffer instanceof ArrayBuffer ? buffer.slice(0) : buffer;
            currentWorker.postMessage({ id, type: 'parse', buffer: bufClone }, [bufClone]);
        });
    };
}
