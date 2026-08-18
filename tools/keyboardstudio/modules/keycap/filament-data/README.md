# Filament Data — Vendor TDS Modules

このディレクトリは各 3D 印刷フィラメントメーカーのテクニカルデータシート (TDS) を
ベンダー単位でモジュール化して保持します。

## 構造

```
filament-data/
  index.js        集約 API (FILAMENT_VENDORS, getVendor, getTDS, ...)
  bambulab.js     Bambu Lab 全製品ラインアップ
  polymaker.js    Polymaker 全製品ラインアップ
  esun.js         eSun 全製品ラインアップ
  elegoo.js       Elegoo 全製品ラインアップ
  sunlu.js        Sunlu 全製品ラインアップ
  overture.js     Overture 全製品ラインアップ
  generic.js      フォールバック (ベンダー DB 未登録時に使用)
```

## ベンダーモジュールの形

```js
export default {
    key: 'bambulab',
    name: 'Bambu Lab',
    url: 'https://bambulab.com/en/filament-guide',
    materials: {
        pla: {
            id: 'pla',
            name: 'PLA Basic',
            category: 'pla',                 // pla / petg / abs / asa / nylon / tpu / pc / pei / specialty
            density: 1.24,                   // g/cm³
            price_jp: 2240, price_us: 22,    // 1kg 価格
            tds: {
                E: 2600,                     // MPa (ヤング率)
                yieldMPa: 35,                // 引張降伏応力 (XY 印刷, 室温, ASTM D638)
                ultimateMPa: 44,             // 引張破断応力
                compRatio: 1.4,              // 圧縮 / 引張比 (熱可塑性樹脂は >1)
                layerAdhesion: 0.51,         // Z 方向強度 / XY 強度 (FDM)
                brittleness: 0.80,           // 0=粘り強い, 1=極脆性
                printTempC: [200, 230],      // 推奨ノズル温度 (任意)
                bedTempC: [35, 60]           // 推奨ベッド温度 (任意)
            }
        },
        ...
    }
};
```

## データソース

各ベンダー公開の Technical Data Sheet (PDF) から ASTM D638 / ISO 527 引張試験値を
引用しています。`tds.layerAdhesion` は Z 方向引張強度を XY 方向引張強度で割った
比 (FDM 印刷の異方性指標)。値の精度は ±10% 程度を想定。

## 新規ベンダー / 材料の追加

1. このディレクトリに新規ファイル `<vendor>.js` を作成
2. 上記スキーマで全材料の TDS を記入
3. `index.js` の import に追加するだけで全システム (FEA / フィラメントセレクター /
   AMS パレット) に自動連動
