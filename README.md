# Amazon2MFCloud

Amazon.co.jp の注文履歴を MFクラウド会計用 CSV としてエクスポートする Chrome 拡張機能です。

## 機能

- Amazon.co.jp の注文履歴ページから注文データを自動取得
- 「全件取得」で複数ページを一括取得
- 複数ページにまたがる注文を蓄積（重複排除あり）
- MFクラウド会計にインポート可能な CSV を生成・ダウンロード

## インストール

### Chrome Web Store から（推奨）

<!-- TODO: ストア公開後にリンクを追加 -->
Chrome Web Store からインストールできます。

### 開発者向け（手動インストール）

1. このリポジトリをクローンまたはダウンロード
2. Chrome で `chrome://extensions` を開く
3. 右上の「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、このディレクトリを選択

## 使い方

1. [Amazon.co.jp の注文履歴](https://www.amazon.co.jp/your-orders/orders)を開く
2. ブラウザツールバーの Amazon2MFCloud アイコンをクリック
3. 「注文データを取得」で現在のページの注文を取得、または「全件取得」で全ページ一括取得
4. 「CSV ダウンロード」ボタンで MFクラウド会計用 CSV をダウンロード

## CSV 出力形式

| 日付 | 内容 | 出金額 | 入金額 |
|------|------|--------|--------|
| 2025/3/8 | Amazon: 商品名 (注文番号) | 1980 | |

同一注文内の複数商品は `商品A / 商品B` のようにまとめられます。

## ファイル構成

```
amazon2mfcloud/
├── manifest.json        # 拡張機能の設定（Manifest V3）
├── popup/
│   ├── popup.html       # ポップアップ UI
│   ├── popup.js         # ポップアップのロジック
│   └── popup.css        # スタイル
├── content/
│   └── content.js       # コンテンツスクリプト（メッセージ受信）
├── lib/
│   ├── scraper.js       # Amazon ページの DOM 解析
│   └── csv.js           # CSV 生成・ダウンロード
├── icons/               # 拡張機能アイコン
└── build.sh             # Chrome Web Store 提出用 ZIP 生成
```

## ビルド

Chrome Web Store 提出用の ZIP を生成:

```bash
./build.sh
```

## 技術仕様

- Chrome Manifest V3
- 外部ライブラリ不使用（純粋な JavaScript）
- `chrome.storage.local` によるデータ永続化
- UTF-8 BOM 付き CSV（Excel 対応）

## プライバシー

この拡張機能は:
- ユーザーの注文データをローカル (`chrome.storage.local`) にのみ保存します
- 外部サーバーへのデータ送信は一切行いません
- Amazon.co.jp の注文履歴ページでのみ動作します

## ライセンス

MIT License
