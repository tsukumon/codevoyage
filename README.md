## コーディング時間を自動記録し、ハイライト風に振り返る

あなたのコーディング時間やコーディングスタイルの傾向を、Spotify WrappedやYoutube Recap風に振り返りできます。

![CodeVoyage Demo](https://raw.githubusercontent.com/tsukumon/codevoyage/refs/heads/main/images/demo.gif)

---

## 特徴

- **完全自動** — VS Codeを開くだけで記録開始。設定不要
- **美しい振り返り** — 週間・月間・年間のアニメーション付きレビュー
- **ローカル保存** — データは全てローカルに保存。アカウント不要、データ漏洩の心配無用

---

## 使い方

### 1. コードを書く

それだけです。VS Codeを開くと自動で記録が始まります。

### 2. 振り返りを見る

コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）から：

```
CodeVoyage: Open Dashboard
```

またはステータスバーの時計アイコンをクリック。

---

## コマンド

| コマンド | 説明 |
|---------|------|
| `CodeVoyage: Open Dashboard` | ダッシュボードを開く |
| `CodeVoyage: Export Data (Backup)` | データをJSONでエクスポート |
| `CodeVoyage: Import Data (Restore)` | データをインポート |
| `CodeVoyage: Show Demo Review` | デモデータでプレビュー |

---

## 設定

| 設定 | デフォルト | 説明 |
|------|-----------|------|
| `codevoyage.idleTimeout` | `300` | アイドル判定までの秒数 |
| `codevoyage.showStatusBar` | `true` | ステータスバー表示 |

---

## ライセンス

MIT
