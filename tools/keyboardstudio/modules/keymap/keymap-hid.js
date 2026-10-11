// =============================================
// KeybordStudio V1 - WebHID / VIA bridge
// modules/keymap/keymap-hid.js
// =============================================
// 実機 (VIA-compatible firmware を載せたキーボード) と WebHID 経由で
// 接続し、キーマップ / マクロ / LED を読み書きする。
//
// WebHID は HTTPS or localhost、Chrome/Edge/Opera のみ対応。
// 接続しない場合は state を編集するだけのオフライン編集モード。
//
// プロトコル: VIA Custom HID (raw HID, Usage Page 0xFF60)
//   全コマンド = 32 byte パケット
//   [0]: command id, [1..]: payload
//
// 公式仕様: https://www.caniusevia.com/docs/specification

import {
    VIA_CMD, VIA_USAGE_PAGE, VIA_USAGE,
    LAYER_COUNT, MAX_MACROS
} from './keymap-constants.js';
import { keycodeToBytes, bytesToKeycode } from './keymap-keycodes.js';

const PACKET_SIZE = 32;

export class HIDBridge {
    constructor(eventBus) {
        this.device = null;
        this.connected = false;
        this.protocolVersion = 0;
        this.matrix = null;             // { rows, cols } from firmware
        this.layerCount = LAYER_COUNT;
        this.macroCount = MAX_MACROS;
        this.macroBufferSize = 1024;
        this.eventBus = eventBus;       // optional onChange notifier
    }

    isSupported() {
        return typeof navigator !== 'undefined' && !!navigator.hid;
    }

    /**
     * ユーザーに WebHID 許可ダイアログを出す。
     */
    async requestDevice() {
        if (!this.isSupported()) throw new Error('WebHID is not supported in this browser. Use Chrome / Edge.');
        const filters = [{ usagePage: VIA_USAGE_PAGE, usage: VIA_USAGE }];
        const devices = await navigator.hid.requestDevice({ filters });
        if (!devices || devices.length === 0) throw new Error('No device selected.');
        return await this.connect(devices[0]);
    }

    /**
     * 既に許可されているデバイスから自動再接続。
     */
    async tryAutoConnect() {
        if (!this.isSupported()) return null;
        const devices = await navigator.hid.getDevices();
        const candidates = devices.filter(d =>
            d.collections.some(c => c.usagePage === VIA_USAGE_PAGE && c.usage === VIA_USAGE)
        );
        if (candidates.length === 0) return null;
        return await this.connect(candidates[0]);
    }

    async connect(device) {
        if (this.device && this.device !== device) await this.disconnect();
        if (!device.opened) await device.open();
        this.device = device;
        this.connected = true;
        device.addEventListener('inputreport', this._onReport.bind(this));
        try {
            const v = await this.getProtocolVersion();
            this.protocolVersion = v;
        } catch (e) {
            console.warn('[HIDBridge] protocol version probe failed', e);
        }
        try {
            const lc = await this.getLayerCount();
            if (lc > 0) this.layerCount = lc;
        } catch (e) { /* fallthrough */ }
        try {
            this.macroCount       = await this.getMacroCount();
            this.macroBufferSize  = await this.getMacroBufferSize();
        } catch (e) { /* fallthrough */ }
        if (this.eventBus) this.eventBus('connected', this.deviceInfo());
        return this.deviceInfo();
    }

    async disconnect() {
        try {
            if (this.device && this.device.opened) await this.device.close();
        } catch (e) { /* ignore */ }
        this.device = null;
        this.connected = false;
        this.protocolVersion = 0;
        if (this.eventBus) this.eventBus('disconnected', null);
    }

    deviceInfo() {
        if (!this.device) return null;
        return {
            vendorId: this.device.vendorId,
            productId: this.device.productId,
            productName: this.device.productName,
            protocolVersion: this.protocolVersion,
            layerCount: this.layerCount,
            macroCount: this.macroCount
        };
    }

    // ── Low-level send/receive (with reply matching) ────
    _sendRaw(data) {
        if (!this.device) throw new Error('Not connected.');
        const buf = new Uint8Array(PACKET_SIZE);
        for (let i = 0; i < Math.min(data.length, PACKET_SIZE); i++) buf[i] = data[i];
        return this.device.sendReport(0x00, buf);
    }

    /**
     * 1 リクエスト = 1 レスポンスのモデルで send → wait reply.
     * Firmware は echo-style: 同じ command id をエコーで返す。
     */
    _request(payload, timeoutMs = 1000) {
        return new Promise((resolve, reject) => {
            const expected = payload[0];
            const timer = setTimeout(() => {
                this._pending = null;
                reject(new Error(`HID request timeout (cmd 0x${expected.toString(16)})`));
            }, timeoutMs);
            this._pending = { expected, resolve, reject, timer };
            this._sendRaw(payload).catch(err => {
                clearTimeout(timer);
                this._pending = null;
                reject(err);
            });
        });
    }

    _onReport(event) {
        if (!this._pending) return;
        const data = new Uint8Array(event.data.buffer);
        if (data[0] === this._pending.expected) {
            clearTimeout(this._pending.timer);
            const { resolve } = this._pending;
            this._pending = null;
            resolve(data);
        }
    }

    // ── High-level commands ─────────────────────────
    async getProtocolVersion() {
        const r = await this._request([VIA_CMD.GET_PROTOCOL_VERSION]);
        return (r[1] << 8) | r[2];
    }
    async getLayerCount() {
        const r = await this._request([VIA_CMD.DYNAMIC_KEYMAP_GET_LAYER_COUNT]);
        return r[1];
    }
    async getMacroCount() {
        const r = await this._request([VIA_CMD.DYNAMIC_KEYMAP_MACRO_GET_COUNT]);
        return r[1];
    }
    async getMacroBufferSize() {
        const r = await this._request([VIA_CMD.DYNAMIC_KEYMAP_MACRO_GET_BUFFER_SIZE]);
        return (r[1] << 8) | r[2];
    }

    /**
     * 1 つのキーを読み書き。row, col は firmware の物理マトリクスベース。
     */
    async getKeycode(layer, row, col) {
        const r = await this._request([VIA_CMD.DYNAMIC_KEYMAP_GET_KEYCODE, layer & 0xFF, row & 0xFF, col & 0xFF]);
        return bytesToKeycode(r[4], r[5]);
    }
    async setKeycode(layer, row, col, code) {
        const [hi, lo] = keycodeToBytes(code);
        await this._request([VIA_CMD.DYNAMIC_KEYMAP_SET_KEYCODE, layer & 0xFF, row & 0xFF, col & 0xFF, hi, lo]);
    }

    /**
     * ユーザー側 keyIndex (state.physicalKeys) に対応する row/col の解決は
     * firmware のレイアウト依存。matrix が無い場合 keyIndex をそのまま (row=0, col=keyIndex) として送出。
     * ↑ 将来: keyboard.json から row/col map を読み込んで設定。
     */
    async writeKeyByIndex(layer, keyIndex, code) {
        const row = (keyIndex >> 8) & 0xFF;
        const col = keyIndex & 0xFF;
        await this.setKeycode(layer, row, col, code);
    }

    /**
     * バッファ全体を書き込み (高速一括書き込み)。
     */
    async setKeymapBuffer(offset, bytes) {
        const len = Math.min(28, bytes.length);
        const payload = [VIA_CMD.DYNAMIC_KEYMAP_SET_BUFFER, (offset >> 8) & 0xFF, offset & 0xFF, len & 0xFF];
        for (let i = 0; i < len; i++) payload.push(bytes[i]);
        await this._request(payload);
    }

    async getKeymapBuffer(offset, length) {
        const got = [];
        let pos = 0;
        while (pos < length) {
            const chunk = Math.min(28, length - pos);
            const r = await this._request([VIA_CMD.DYNAMIC_KEYMAP_GET_BUFFER,
                ((offset+pos) >> 8) & 0xFF, (offset+pos) & 0xFF, chunk & 0xFF]);
            for (let i = 0; i < chunk; i++) got.push(r[4 + i]);
            pos += chunk;
        }
        return Uint8Array.from(got);
    }

    /**
     * マクロバッファを書き込み (シリアル化済みバイト列)。
     * @param {Uint8Array} bytes  全マクロを連結した buffer (各マクロは 0x00 区切り)
     */
    async setMacroBuffer(bytes) {
        let pos = 0;
        while (pos < bytes.length) {
            const chunk = Math.min(28, bytes.length - pos);
            const payload = [VIA_CMD.DYNAMIC_KEYMAP_MACRO_SET_BUFFER,
                (pos >> 8) & 0xFF, pos & 0xFF, chunk & 0xFF];
            for (let i = 0; i < chunk; i++) payload.push(bytes[pos + i]);
            await this._request(payload);
            pos += chunk;
        }
    }
    async resetMacros() {
        await this._request([VIA_CMD.DYNAMIC_KEYMAP_MACRO_RESET]);
    }

    /**
     * Lighting (RGB) コントロール — VIA channel ID:
     *   QMK BACKLIGHT  channel = 0x01
     *   QMK RGBLIGHT   channel = 0x02
     *   QMK RGB MATRIX channel = 0x03
     *   value = brightness/effect/hue/sat/speed/color
     */
    async setLightingValue(channel, valueId, valueData) {
        const payload = [VIA_CMD.LIGHTING_SET_VALUE, channel & 0xFF, valueId & 0xFF];
        for (const b of valueData) payload.push(b & 0xFF);
        await this._request(payload);
    }
    async getLightingValue(channel, valueId, expectedReplyBytes = 4) {
        const r = await this._request([VIA_CMD.LIGHTING_GET_VALUE, channel & 0xFF, valueId & 0xFF]);
        return Array.from(r.slice(3, 3 + expectedReplyBytes));
    }
    async saveLighting() {
        await this._request([VIA_CMD.LIGHTING_SAVE]);
    }

    // ── 高レベル LED 同期 ────────────────────────
    async pushLedState(state) {
        // RGB Matrix (channel 0x03) — common QMK
        // value 0x01 = brightness, 0x02 = effect, 0x03 = effect speed,
        // 0x04 = color (HSV), 0x05 = custom color
        try {
            await this.setLightingValue(0x03, 0x01, [state.ledBrightness & 0xFF]);
            // effect index by name ordering — keep table simple
            const effectMap = {
                off: 0, solid: 1, breathing: 2, rainbow: 3, rainbow_swirl: 4,
                rainbow_wave: 5, cycle: 6, reactive: 7, ripple: 8, splash: 9,
                static_gradient: 10, per_key: 11
            };
            const eff = effectMap[state.ledMode] ?? 1;
            await this.setLightingValue(0x03, 0x02, [eff]);
            await this.setLightingValue(0x03, 0x03, [state.ledSpeed & 0xFF]);
            const hue255 = Math.round((state.ledHue / 360) * 255) & 0xFF;
            const sat255 = Math.round(state.ledSat * 255) & 0xFF;
            await this.setLightingValue(0x03, 0x04, [hue255, sat255]);
            await this.saveLighting();
        } catch (e) {
            console.warn('[HIDBridge] LED push failed (firmware may not support RGB Matrix)', e.message);
        }
    }

    // ── Connection event listener (browser-level) ──
    static onConnectionChange(cb) {
        if (!navigator.hid) return () => {};
        const onConnect = (e) => cb('connect', e.device);
        const onDisconnect = (e) => cb('disconnect', e.device);
        navigator.hid.addEventListener('connect',    onConnect);
        navigator.hid.addEventListener('disconnect', onDisconnect);
        return () => {
            navigator.hid.removeEventListener('connect',    onConnect);
            navigator.hid.removeEventListener('disconnect', onDisconnect);
        };
    }
}

export default HIDBridge;
