# #CodeVoyage

**Your coding journey, beautifully visualized.**

Track your coding time effortlessly and relive your programming adventures with beautiful visual reviews.
like Youtube Recap, Spotify Wrapped.

![CodeVoyage Dashboard](https://raw.githubusercontent.com/tsukumon/codevoyage/refs/heads/main/images/demo.gif)

---

## Designed for Programmers, by the Three Virtues

### Laziness
> "The quality that makes you go to great effort to reduce overall energy expenditure."

**Zero configuration. Zero buttons. Just code.**

CodeVoyage runs silently in the background from the moment you open VS Code. No start buttons, no stop buttons, no interruptions. Your coding time is tracked automatically while you focus on what matters most—writing great code.

### Impatience
> "The anger you feel when the computer is being lazy."

**Instant insights when you want them.**

Open your dashboard anytime with a single command. See your weekly, monthly, or yearly statistics instantly. No waiting for reports, no syncing delays. Your data is always ready.

### Hubris
> "The quality that makes you write programs that other people won't want to say bad things about."

**Privacy-first. Your data stays yours.**

All data is stored locally on your machine. No accounts, no cloud sync, no telemetry. Your coding habits are nobody's business but your own.

---

## Features

- **Automatic Time Tracking** — Starts when you code, pauses when you're idle
- **Beautiful Visualizations** — Stunning weekly, monthly, and yearly reviews
- **Language Statistics** — See which languages you spend the most time with
- **Project Insights** — Track time across different projects and workspaces
- **Peak Hours Analysis** — Discover when you're most productive
- **Coding Styles** — Get insights like "Night Owl" or "Early Bird" based on your patterns
- **Data Export/Import** — Backup and restore your coding history anytime

---

## Usage

### Just Code

That's it. Really.

CodeVoyage starts tracking automatically when VS Code opens. Write code, and your journey is recorded.

### View Your Dashboard

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

```
CodeVoyage: Open Dashboard
```

Or click the clock icon in the status bar showing today's coding time.

### Switch Time Periods

In the dashboard, use the buttons to switch between:
- **Weekly Review** — Your past 7 days
- **Monthly Review** — Your past month
- **Yearly Review** — Your entire year (perfect for year-end reflection!)

---

## Commands

| Command | Description |
|---------|-------------|
| `CodeVoyage: Open Dashboard` | Open the statistics dashboard |
| `CodeVoyage: Export Data (Backup)` | Export all data to a JSON file |
| `CodeVoyage: Import Data (Restore)` | Import data from a backup file |
| `CodeVoyage: Show Demo Review` | Preview with sample data |

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `codevoyage.idleTimeout` | `300` | Seconds of inactivity before tracking pauses |
| `codevoyage.showStatusBar` | `true` | Show today's coding time in the status bar |

---

## Privacy

- All data is stored locally using VS Code's built-in storage
- No internet connection required
- No accounts or sign-ups
- No analytics or telemetry
- Your coding data never leaves your machine

---

## Backup Your Journey

Your coding history is precious. Use the export feature regularly:

1. Open Command Palette
2. Run `CodeVoyage: Export Data (Backup)`
3. Save the JSON file somewhere safe

You can import this backup anytime, even on a different machine.

---

## License

MIT

---

**Happy coding, and enjoy your voyage!**

---

# 日本語 / Japanese

**あなたのコーディングの旅を、美しく可視化。**

コーディング時間を自動で記録し、週間・月間・年間の振り返りを美しいビジュアルで楽しめます。

---

## プログラマの三大美徳に基づく設計

### 怠惰 (Laziness)
> 「全体の労力を減らすために手間を惜しまない気質」

**設定不要。ボタン不要。ただコードを書くだけ。**

VS Codeを開いた瞬間から、CodeVoyageはバックグラウンドで静かに動作します。スタートボタンもストップボタンもありません。あなたは最も重要なこと—素晴らしいコードを書くこと—に集中できます。

### 短気 (Impatience)
> 「コンピュータが怠けているときに感じる怒り」

**見たいときに、すぐ見れる。**

コマンド一つでダッシュボードを開けます。週間、月間、年間の統計を即座に確認。レポートを待つ必要も、同期の遅延もありません。

### 傲慢 (Hubris)
> 「他人に批判されないようなプログラムを書こうとする気質」

**プライバシーファースト。データはあなただけのもの。**

すべてのデータはローカルに保存されます。アカウント登録不要、クラウド同期なし、テレメトリなし。あなたのコーディング習慣は、あなただけのものです。

---

## 機能

- **自動時間記録** — コーディング開始で記録開始、アイドル時は自動停止
- **美しいビジュアライゼーション** — 週間・月間・年間の振り返り
- **言語別統計** — どの言語に最も時間を使っているか一目で分かる
- **プロジェクト分析** — プロジェクトやワークスペースごとの時間を追跡
- **ピークタイム分析** — 最も生産性が高い時間帯を発見
- **コーディングスタイル** — 「夜型」「朝型」などのパターンを分析
- **データのエクスポート/インポート** — いつでもバックアップ＆復元可能

---

## 使い方

### ただコードを書くだけ

本当にそれだけです。

VS Codeを開くと自動で記録開始。コードを書けば、あなたの旅が記録されます。

### ダッシュボードを開く

コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）を開き、以下を実行:

```
CodeVoyage: Open Dashboard
```

またはステータスバーの時計アイコン（今日のコーディング時間）をクリック。

### 期間の切り替え

ダッシュボード内のボタンで切り替え:
- **週間レビュー** — 過去7日間
- **月間レビュー** — 過去1ヶ月
- **年間レビュー** — 1年間（年末の振り返りに最適！）

---

## コマンド

| コマンド | 説明 |
|---------|------|
| `CodeVoyage: Open Dashboard` | 統計ダッシュボードを開く |
| `CodeVoyage: Export Data (Backup)` | 全データをJSONファイルにエクスポート |
| `CodeVoyage: Import Data (Restore)` | バックアップファイルからインポート |
| `CodeVoyage: Show Demo Review` | サンプルデータでプレビュー |

---

## 設定

| 設定 | デフォルト | 説明 |
|------|-----------|------|
| `codevoyage.idleTimeout` | `300` | 記録を一時停止するまでの非アクティブ秒数 |
| `codevoyage.showStatusBar` | `true` | ステータスバーに今日のコーディング時間を表示 |

---

## プライバシー

- すべてのデータはVS Codeの内蔵ストレージにローカル保存
- インターネット接続不要
- アカウント登録不要
- 分析やテレメトリなし
- あなたのデータがマシンから出ることはありません

---

## データのバックアップ

あなたのコーディング履歴は大切です。定期的にエクスポートしましょう:

1. コマンドパレットを開く
2. `CodeVoyage: Export Data (Backup)` を実行
3. JSONファイルを安全な場所に保存

このバックアップは別のマシンでもインポートできます。

---

**Happy coding, and enjoy your voyage!**