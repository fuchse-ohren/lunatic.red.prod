#!/usr/bin/env node
/**
 * Stock Icons Auto-Update Script
 * 
 * 使い方:
 *   1. SVGファイルを適切なカテゴリフォルダに追加
 *      例: stock-icons/arrows/my-new-arrow.svg
 *   2. このスクリプトを実行: node update-icons.js
 *   3. icons.json が自動更新される
 * 
 * ファイル名のルール:
 *   - ファイル名がそのままID/名前になります
 *   - 例: "upload-arrow.svg" → id: "upload-arrow", name: "Upload Arrow"
 *   - 日本語名はファイル名から推測、または手動でicons.jsonを編集
 */

const fs = require('fs');
const path = require('path');

const CATEGORIES = [
    { id: 'arrows', name: 'Arrows', nameJa: '矢印' },
    { id: 'media', name: 'Media', nameJa: 'メディア' },
    { id: 'modifiers', name: 'Modifiers', nameJa: '修飾キー' },
    { id: 'system', name: 'System', nameJa: 'システム' },
    { id: 'symbols', name: 'Symbols', nameJa: '記号' }
];

// 日本語名の自動推測マッピング
const NAME_MAP = {
    'up': '上矢印', 'down': '下矢印', 'left': '左矢印', 'right': '右矢印',
    'arrow': '矢印', 'share': 'シェア', 'download': 'ダウンロード', 'upload': 'アップロード',
    'recycle': 'リサイクル', 'reply': '返信', 'uturn': 'Uターン',
    'play': '再生', 'pause': '一時停止', 'stop': '停止', 'volume': '音量', 'mute': 'ミュート',
    'skip': 'スキップ', 'forward': '次へ', 'back': '前へ',
    'command': 'Command', 'shift': 'Shift', 'ctrl': 'Ctrl', 'alt': 'Alt', 'option': 'Option',
    'enter': 'Enter', 'tab': 'Tab', 'escape': 'Esc', 'backspace': 'Backspace',
    'capslock': 'CapsLock', 'fn': 'Fn', 'windows': 'Windows',
    'power': '電源', 'home': 'ホーム', 'gear': '設定', 'settings': '設定',
    'brightness': '明るさ', 'camera': 'カメラ', 'lock': 'ロック',
    'wifi': 'WiFi', 'bluetooth': 'Bluetooth', 'search': '検索',
    'delete': '削除', 'refresh': '更新', 'menu': 'メニュー',
    'star': '星', 'heart': 'ハート', 'check': 'チェック', 'close': '閉じる',
    'plus': 'プラス', 'minus': 'マイナス', 'smile': 'スマイル',
    'gamepad': 'ゲームパッド', 'lightning': '稲妻', 'fire': '炎',
    'skull': 'ドクロ', 'music': '音楽', 'circle': '丸', 'bold': '太',
    'detail': '詳細', 'chart': 'グラフ'
};

function fileNameToTitle(filename) {
    // remove .svg extension
    const name = filename.replace('.svg', '');
    // convert kebab-case to Title Case
    return name.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function fileNameToJapanese(filename) {
    const name = filename.replace('.svg', '').toLowerCase();
    const parts = name.split('-');
    
    let jaName = '';
    for (const part of parts) {
        if (NAME_MAP[part]) {
            jaName += NAME_MAP[part];
        }
    }
    
    // フォールバック: 英語名をそのまま使用
    if (!jaName) {
        jaName = fileNameToTitle(filename);
    }
    
    return jaName;
}

function scanIcons() {
    const baseDir = __dirname;
    const icons = [];
    
    for (const category of CATEGORIES) {
        const categoryDir = path.join(baseDir, category.id);
        
        if (!fs.existsSync(categoryDir)) {
            console.log(`Creating directory: ${category.id}/`);
            fs.mkdirSync(categoryDir, { recursive: true });
            continue;
        }
        
        const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.svg'));
        
        for (const file of files) {
            const id = file.replace('.svg', '');
            icons.push({
                id: id,
                name: fileNameToTitle(file),
                nameJa: fileNameToJapanese(file),
                category: category.id,
                file: `${category.id}/${file}`
            });
        }
        
        console.log(`[${category.id}] ${files.length} icons found`);
    }
    
    return icons;
}

function main() {
    console.log('=== Stock Icons Auto-Update ===\n');
    
    const icons = scanIcons();
    
    const data = {
        categories: CATEGORIES,
        icons: icons
    };
    
    const outputPath = path.join(__dirname, 'icons.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    
    console.log(`\n✅ icons.json updated with ${icons.length} icons`);
    console.log(`   File: ${outputPath}`);
}

main();
