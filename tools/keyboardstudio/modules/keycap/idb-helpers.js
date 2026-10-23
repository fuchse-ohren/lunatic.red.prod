// IndexedDB helper utilities extracted from keycap-app.js.
// 環境バックアップ / プロジェクトファイル等で使用される共通 IDB 操作を提供する。

/**
 * 既存 DB の全レコードを一括取得。
 * - DB が存在しない / store が無い場合は [] を返す (例外を投げない)。
 */
export function readAllFromIDB(dbName, storeName) {
    return new Promise((resolve) => {
        const req = indexedDB.open(dbName);
        req.onerror = () => resolve([]);
        req.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(storeName)) { db.close(); resolve([]); return; }
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const getAll = store.getAll();
            getAll.onsuccess = () => { db.close(); resolve(getAll.result || []); };
            getAll.onerror = () => { db.close(); resolve([]); };
        };
    });
}

/**
 * 全レコードを差し替え (clear → add)。
 * Auto-increment id は自動で振り直すため、入力 item.id は破棄。
 * 失敗してもエラーを投げず resolve() する (バックアップ復元の継続性優先)。
 */
export function writeAllToIDB(dbName, storeName, items) {
    return new Promise((resolve) => {
        const req = indexedDB.open(dbName);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onerror = () => resolve();
        req.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(storeName)) { db.close(); resolve(); return; }
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            store.clear();
            for (const item of items) {
                const clone = Object.assign({}, item);
                delete clone.id;
                store.add(clone);
            }
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); resolve(); };
        };
    });
}

/**
 * IDB を開いて 1 つの store を確実に作成する小ヘルパー。
 * 既存スキーマに store が無い場合は version を bump して onupgradeneeded で追加。
 *
 * @returns {Promise<IDBDatabase>}
 */
export function openWithStore(dbName, storeName, options = {}) {
    const { keyPath = 'id', autoIncrement = true } = options;
    return new Promise((resolve, reject) => {
        const probe = indexedDB.open(dbName);
        probe.onerror = () => reject(probe.error);
        probe.onsuccess = (e) => {
            const db = e.target.result;
            if (db.objectStoreNames.contains(storeName)) {
                resolve(db);
                return;
            }
            const ver = db.version + 1;
            db.close();
            const upgrade = indexedDB.open(dbName, ver);
            upgrade.onupgradeneeded = (ev) => {
                const udb = ev.target.result;
                if (!udb.objectStoreNames.contains(storeName)) {
                    udb.createObjectStore(storeName, { keyPath, autoIncrement });
                }
            };
            upgrade.onsuccess = (ev) => resolve(ev.target.result);
            upgrade.onerror = () => reject(upgrade.error);
        };
    });
}

/**
 * 1 件追加。
 */
export function dbPut(db, storeName, item) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/**
 * 1 件削除 (キーで)。
 */
export function dbDelete(db, storeName, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

/**
 * 全件取得。
 */
export function dbGetAll(db, storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

/**
 * 全件削除。
 */
export function dbClear(db, storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite');
        const req = tx.objectStore(storeName).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}
