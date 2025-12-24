## INDEX
- [日本語](#特徴)
- [English](#features)


## コーディング時間を自動記録し、ハイライト風に振り返る

あなたのコーディング時間やコーディングスタイルの傾向を、Spotify WrappedやYoutube Recap風に振り返りできます。

振り返りの最後にダウンロードできるサマリーカードを、SNSにハッシュタグ``#codevoyage``で投稿して共有しよう。

![CodeVoyage Demo](https://raw.githubusercontent.com/tsukumon/codevoyage/refs/heads/main/images/demo.gif)

---

## 特徴

- **完全自動** — VS Codeを開くだけで記録開始。スタート・ストップの必要なし。
- **美しい振り返り** — 1週間・1ヶ月・1年をアニメーション付きで振り返り。
- **ローカル保存** — データは全てローカルに保存。アカウント不要、データ漏洩の心配無用。

---

## 使い方

### 1. コードを書く

それだけです。VS Codeを開くと自動で記録が始まります。

### 2. 振り返りを見る

コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）から``CodeVoyage: Open Dashboard``

またはステータスバーの時計アイコンをクリック。

---

## 振り返りできる項目

- 📊 **総コーディング時間** — 期間中の合計時間
- 💻 **言語ランキング** — 使用した言語の内訳
- 📁 **プロジェクトランキング** — プロジェクト別の作業時間
- ⏰ **ピーク時間帯** — 最も集中した時間帯
- 🔥 **連続コーディング日数** — ストリーク記録
- 🎨 **コーディングスタイル** — あなたの傾向を診断（夜型、朝型など）
- 📅 **カレンダーヒートマップ** — 日々の活動を可視化

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
| `codevoyage.idleTimeout` | `300` | アイドル判定までの秒数（0で無効化） |
| `codevoyage.showStatusBar` | `true` | ステータスバー表示 |
| `codevoyage.language` | `ja` | 表示言語（`ja` / `en`） |

---

## バグ報告
バグ報告はこちらにお願いします。

https://github.com/tsukumon/codevoyage/issues

---
---

# English

## Automatically track your coding time and review it in style

Review your coding time and coding style trends in a Spotify Wrapped / YouTube Recap style presentation.

Download your summary card at the end of the review and share it on social media with the hashtag ``#codevoyage``.

![CodeVoyage Demo](https://raw.githubusercontent.com/tsukumon/codevoyage/refs/heads/main/images/demo.gif)

---

## Features

- **Fully Automatic** — Tracking starts when you open VS Code. No need to start or stop.
- **Beautiful Reviews** — Review your week, month, or year with smooth animations.
- **Local Storage** — All data is stored locally. No account required, no data leaks.

---

## How to Use

### 1. Write Code

That's it. Tracking starts automatically when you open VS Code.

### 2. View Your Review

Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run ``CodeVoyage: Open Dashboard``

Or click the clock icon in the status bar.

---

## What You Can Review

- 📊 **Total Coding Time** — Total time during the period
- 💻 **Language Ranking** — Breakdown of languages used
- 📁 **Project Ranking** — Time spent on each project
- ⏰ **Peak Hours** — Your most focused hours
- 🔥 **Streak Days** — Consecutive coding days
- 🎨 **Coding Style** — Your coding patterns (night owl, early bird, etc.)
- 📅 **Calendar Heatmap** — Visualize your daily activity

---

## Commands

| Command | Description |
|---------|-------------|
| `CodeVoyage: Open Dashboard` | Open the dashboard |
| `CodeVoyage: Export Data (Backup)` | Export data as JSON |
| `CodeVoyage: Import Data (Restore)` | Import data |
| `CodeVoyage: Show Demo Review` | Preview with demo data |

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `codevoyage.idleTimeout` | `300` | Seconds until idle detection (0 to disable) |
| `codevoyage.showStatusBar` | `true` | Show status bar |
| `codevoyage.language` | `ja` | Display language (`ja` / `en`) |

---

## Bug Reports

Please report bugs here:

https://github.com/tsukumon/codevoyage/issues
