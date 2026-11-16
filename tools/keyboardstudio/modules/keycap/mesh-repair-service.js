// Worker-backed mesh repair service for Keycap Studio.
export class MeshRepairService {
    constructor() {
        this.worker = null;
        this.ready = false;
        this._readyPromise = null;
        this._pendingRequests = new Map();
        this._progressHandlers = new Map();
        this._nextId = 1;
    }

    async init() {
        if (this.ready) return;
        if (this._readyPromise) return this._readyPromise;

        this._readyPromise = new Promise((resolve, reject) => {
            try {
                this.worker = new Worker(new URL('../../workers/mesh-repair-worker.js', import.meta.url));
            } catch (err) {
                this._readyPromise = null;
                reject(new Error('Worker creation failed: ' + err.message));
                return;
            }

            const initTimeout = setTimeout(() => {
                this._readyPromise = null;
                reject(new Error('Worker init timeout'));
            }, 30000);

            this.worker.onmessage = (e) => {
                const msg = e.data;

                if (msg.type === 'ready') {
                    clearTimeout(initTimeout);
                    this.ready = true;
                    this.worker.onmessage = this._handleMessage.bind(this);
                    resolve();
                    return;
                }

                if (msg.type === 'error' && !this.ready) {
                    clearTimeout(initTimeout);
                    this._readyPromise = null;
                    reject(new Error(msg.error));
                    return;
                }
            };

            this.worker.onerror = (err) => {
                clearTimeout(initTimeout);
                this._readyPromise = null;
                reject(new Error('Worker error: ' + err.message));
            };

            this.worker.postMessage({ type: 'init' });
        });

        return this._readyPromise;
    }

    _handleMessage(e) {
        const msg = e.data;

        if (msg.type === 'progress') {
            const handler = this._progressHandlers.get(msg.id);
            if (handler) handler(msg.status);
            return;
        }

        if (msg.type === 'result') {
            const pending = this._pendingRequests.get(msg.id);
            if (pending) {
                this._pendingRequests.delete(msg.id);
                this._progressHandlers.delete(msg.id);
                pending.resolve({
                    vertices: msg.vertices,
                    triangles: msg.triangles,
                    report: msg.report,
                    diagnosis: msg.diagnosis
                });
            }
            return;
        }

        if (msg.type === 'diagnosed') {
            const pending = this._pendingRequests.get(msg.id);
            if (pending) {
                this._pendingRequests.delete(msg.id);
                pending.resolve(msg.diagnosis);
            }
            return;
        }

        if (msg.type === 'error' && msg.id) {
            const pending = this._pendingRequests.get(msg.id);
            if (pending) {
                this._pendingRequests.delete(msg.id);
                this._progressHandlers.delete(msg.id);
                pending.reject(new Error(msg.error));
            }
            return;
        }
    }

    /**
     * repairMesh - meshFixLib.repairMesh() と同じシグネチャ
     * @param {Array} vertices - [[x,y,z], ...]
     * @param {Array} triangles - [[i,j,k], ...]
     * @param {Function} onProgress - (status: string) => void
     * @param {Object} options - 修復オプション（v3.2.0用）
     * @returns {Promise<{vertices, triangles, report, diagnosis}>}
     */
    async repairMesh(vertices, triangles, onProgress = null, options = undefined) {
        if (!this.ready) {
            await this.init();
        }

        const id = this._nextId++;

        return new Promise((resolve, reject) => {
            this._pendingRequests.set(id, { resolve, reject });
            if (onProgress) {
                this._progressHandlers.set(id, onProgress);
            }

            this.worker.postMessage({
                type: 'repair',
                id,
                vertices,
                triangles,
                options
            });
        });
    }

    /**
     * diagnose - メッシュの診断のみ（修復しない）
     */
    async diagnose(vertices, triangles) {
        if (!this.ready) {
            await this.init();
        }

        const id = this._nextId++;

        return new Promise((resolve, reject) => {
            this._pendingRequests.set(id, { resolve, reject });

            this.worker.postMessage({
                type: 'diagnose',
                id,
                vertices,
                triangles
            });
        });
    }

    dispose() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.ready = false;
            this._readyPromise = null;
            this._pendingRequests.clear();
            this._progressHandlers.clear();
        }
    }
}

export const meshRepairService = new MeshRepairService();

if (typeof window !== 'undefined') {
    window.meshRepairService = meshRepairService;
}

// Backward-compatible alias for existing meshFixLib.repairMesh() calls.
export const meshFixLib = meshRepairService;

if (typeof window !== 'undefined') {
    window.meshFixLib = meshRepairService;
}
