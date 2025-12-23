import * as vscode from 'vscode';
import { WeeklySummary, MonthlySummary, YearlySummary, ReviewPeriodType } from '../types';
import { StatisticsService } from '../services/StatisticsService';
import { formatDuration, formatHour, isDecember, getDaysUntilDecember } from '../utils/dateUtils';
import { getLanguageColor } from '../utils/languageUtils';

export class WebviewProvider {
  private static currentPanel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext;
  private statsService: StatisticsService;
  private currentWeekOffset: number = 0;
  private currentMonthOffset: number = 0;
  private currentYearOffset: number = 0;
  private currentPeriodType: ReviewPeriodType = 'week';
  private showingPeriodSelection: boolean = true;

  constructor(
    context: vscode.ExtensionContext,
    statsService: StatisticsService
  ) {
    this.context = context;
    this.statsService = statsService;
  }

  /**
   * レビューを表示（期間選択画面から開始）
   */
  public showWeeklyReview(weekOffset: number = 0): void {
    this.currentWeekOffset = weekOffset;
    this.currentMonthOffset = 0;
    this.currentYearOffset = 0;
    this.showingPeriodSelection = true;
    this.currentPeriodType = 'week';
    const column = vscode.ViewColumn.One;

    if (WebviewProvider.currentPanel) {
      WebviewProvider.currentPanel.reveal(column);
      this.updateContent();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'codevoyageDashboard',
      '#codevoyage',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'media')
        ]
      }
    );

    WebviewProvider.currentPanel = panel;

    panel.onDidDispose(() => {
      WebviewProvider.currentPanel = undefined;
      // モックデータモードをリセット
      this.statsService.setUseMockData(false);
    }, null, this.context.subscriptions);

    panel.webview.onDidReceiveMessage(
      (message) => this.handleMessage(message),
      undefined,
      this.context.subscriptions
    );

    this.updateContent();
  }

  /**
   * コンテンツを更新
   */
  private updateContent(): void {
    if (!WebviewProvider.currentPanel) return;

    if (this.showingPeriodSelection) {
      WebviewProvider.currentPanel.webview.html = this.getPeriodSelectionContent(
        WebviewProvider.currentPanel.webview
      );
    } else {
      const summary = this.getSummaryForCurrentPeriod();
      if (summary === null) {
        WebviewProvider.currentPanel.webview.html = this.getNoDataContent(
          WebviewProvider.currentPanel.webview
        );
      } else {
        WebviewProvider.currentPanel.webview.html = this.getWebviewContent(
          WebviewProvider.currentPanel.webview,
          summary
        );
      }
    }
  }

  /**
   * 現在の期間タイプに応じたサマリーを取得
   */
  private getSummaryForCurrentPeriod(): WeeklySummary | MonthlySummary | YearlySummary | null {
    switch (this.currentPeriodType) {
      case 'month':
        return this.statsService.generateMonthlySummary(this.currentMonthOffset);
      case 'year':
        return this.statsService.generateYearlySummary(this.currentYearOffset);
      case 'week':
      default:
        return this.statsService.generateWeeklySummary(this.currentWeekOffset);
    }
  }

  /**
   * メッセージを処理
   */
  private handleMessage(message: { command: string; period?: ReviewPeriodType }): void {
    switch (message.command) {
      case 'selectPeriod':
        if (message.period) {
          this.currentPeriodType = message.period;
          this.showingPeriodSelection = false;
          this.updateContent();
        }
        break;
      case 'backToPeriodSelection':
        this.showingPeriodSelection = true;
        this.updateContent();
        break;
      case 'previousWeek':
        this.currentWeekOffset--;
        this.updateContent();
        break;
      case 'nextWeek':
        if (this.currentWeekOffset < 0) {
          this.currentWeekOffset++;
          this.updateContent();
        }
        break;
      case 'previousMonth':
        this.currentMonthOffset--;
        this.updateContent();
        break;
      case 'nextMonth':
        if (this.currentMonthOffset < 0) {
          this.currentMonthOffset++;
          this.updateContent();
        }
        break;
      case 'previousYear':
        this.currentYearOffset--;
        this.updateContent();
        break;
      case 'nextYear':
        if (this.currentYearOffset < 0) {
          this.currentYearOffset++;
          this.updateContent();
        }
        break;
      case 'goToCurrentPeriod':
        // 現在の期間（今週/今月/今年）に戻る
        if (this.currentPeriodType === 'week') {
          this.currentWeekOffset = 0;
        } else if (this.currentPeriodType === 'month') {
          this.currentMonthOffset = 0;
        } else if (this.currentPeriodType === 'year') {
          this.currentYearOffset = 0;
        }
        this.updateContent();
        break;
      case 'close':
        if (WebviewProvider.currentPanel) {
          WebviewProvider.currentPanel.dispose();
        }
        break;
    }
  }

  /**
   * 期間選択画面のコンテンツを生成
   */
  private getPeriodSelectionContent(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    const canViewYearly = isDecember();
    const daysUntilDecember = getDaysUntilDecember();

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'none';
        style-src ${webview.cspSource} 'unsafe-inline';
        script-src 'nonce-${nonce}';
        img-src ${webview.cspSource} data:;
        font-src ${webview.cspSource};
    ">
    <title>振り返りを選択</title>
    <style>
      ${this.getPeriodSelectionStyles()}
    </style>
</head>
<body>
    <div class="period-selection-container" id="selectionContainer">
        <div class="bg-gradient"></div>

        <div class="selection-content">
            <div class="hero-section">
                <p class="hero-eyebrow">あなたのコーディングを振り返る</p>
                <h1 class="hero-title">
                    <span class="title-word">Choose</span>
                    <span class="title-word">Your</span>
                    <span class="title-word accent">Journey</span>
                </h1>
            </div>

            <div class="period-cards">
                <!-- Weekly Card -->
                <div class="period-card weekly" data-period="week">
                    <div class="card-accent"></div>
                    <div class="card-inner">
                        <div class="card-top">
                            <span class="card-icon">⚡</span>
                            <span class="card-label">WEEKLY</span>
                        </div>
                        <div class="card-period">
                            <span class="period-number">7</span>
                            <span class="period-unit">days</span>
                        </div>
                        <p class="card-desc">1週間を振り返る</p>
                        <div class="card-action">START</div>
                    </div>
                </div>

                <!-- Monthly Card -->
                <div class="period-card monthly" data-period="month">
                    <div class="card-accent"></div>
                    <div class="card-inner">
                        <div class="card-top">
                            <span class="card-icon">🌙</span>
                            <span class="card-label">MONTHLY</span>
                        </div>
                        <div class="card-period">
                            <span class="period-number">30</span>
                            <span class="period-unit">days</span>
                        </div>
                        <p class="card-desc">1ヶ月の成長を振り返る</p>
                        <div class="card-action">START</div>
                    </div>
                </div>

                <!-- Yearly Card -->
                <div class="period-card yearly ${canViewYearly ? '' : 'locked'}" ${canViewYearly ? 'data-period="year"' : ''}>
                    <div class="card-accent"></div>
                    <div class="card-inner">
                        ${canViewYearly ? `
                            <div class="card-top">
                                <span class="card-icon">🎆</span>
                                <span class="card-label">YEARLY</span>
                            </div>
                            <div class="card-period">
                                <span class="period-number">365</span>
                                <span class="period-unit">days</span>
                            </div>
                            <p class="card-desc">1年間のコーディング航海記録</p>
                            <div class="card-action">START</div>
                        ` : `
                            <div class="card-top">
                                <span class="card-icon">🔒</span>
                                <span class="card-label">YEARLY</span>
                            </div>
                            <div class="countdown-display">
                                <span class="countdown-num">${daysUntilDecember}</span>
                                <span class="countdown-text">days until unlock</span>
                            </div>
                            <p class="card-desc muted">12月になったら1年間の振り返りが解放されます</p>
                        `}
                    </div>
                </div>
            </div>
        </div>

        <!-- Departure overlay -->
        <div class="departure-overlay" id="departureOverlay">
            <div class="departure-content">
                <div class="departure-icon" id="departureIcon">⚡</div>
                <div class="departure-text">
                    <span class="departure-label" id="departureLabel">WEEKLY</span>
                    <span class="departure-subtitle">Journey を準備中...</span>
                </div>
                <div class="departure-loader">
                    <div class="loader-track">
                        <div class="loader-fill"></div>
                    </div>
                </div>
            </div>
            <div class="departure-particles">
                ${Array.from({length: 20}, () => `<div class="departure-particle"></div>`).join('')}
            </div>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let isTransitioning = false;

        // 期間カードのクリックイベント
        document.querySelectorAll('.period-card:not(.locked)').forEach(card => {
            card.addEventListener('click', function() {
                if (isTransitioning) return;
                isTransitioning = true;

                const period = this.dataset.period;
                if (period) {
                    // 出航アニメーション開始
                    startDepartureAnimation(period, this);
                }
            });
        });

        function startDepartureAnimation(period, selectedCard) {
            const overlay = document.getElementById('departureOverlay');
            const container = document.getElementById('selectionContainer');
            const departureIcon = document.getElementById('departureIcon');
            const departureLabel = document.getElementById('departureLabel');

            // アイコンとラベルを設定
            const config = {
                week: { icon: '⚡', label: 'WEEKLY', color: '#06b6d4' },
                month: { icon: '🌙', label: 'MONTHLY', color: '#a78bfa' },
                year: { icon: '🎆', label: 'YEARLY', color: '#f59e0b' }
            };

            departureIcon.textContent = config[period].icon;
            departureLabel.textContent = config[period].label;
            overlay.style.setProperty('--departure-color', config[period].color);

            // 選択されたカードをハイライト
            selectedCard.classList.add('selected');

            // 他のカードをフェードアウト
            document.querySelectorAll('.period-card').forEach(c => {
                if (c !== selectedCard) {
                    c.classList.add('fade-out');
                }
            });

            // オーバーレイを表示
            setTimeout(() => {
                overlay.classList.add('active');
            }, 300);

            // 実際の遷移
            setTimeout(() => {
                vscode.postMessage({ command: 'selectPeriod', period: period });
            }, 1800);
        }

        // 画面幅に応じてコンテンツをスケーリング
        function adjustScale() {
            const baseWidth = 944; // カードが折り返されない最小幅
            const content = document.querySelector('.selection-content');
            const viewportWidth = window.innerWidth;

            if (viewportWidth < baseWidth) {
                const scale = viewportWidth / baseWidth;
                content.style.zoom = scale;
            } else {
                content.style.zoom = 1;
            }
        }

        window.addEventListener('resize', adjustScale);
        adjustScale();
    </script>
</body>
</html>`;
  }

  /**
   * データがない場合の画面を生成
   */
  private getNoDataContent(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    const periodLabel = this.currentPeriodType === 'week' ? '週間' :
                        this.currentPeriodType === 'month' ? '月間' : '年間';
    const currentOffset = this.getCurrentOffset(this.currentPeriodType);
    const isNextDisabled = currentOffset >= 0;
    const prevCommand = this.currentPeriodType === 'month' ? 'previousMonth' :
                        this.currentPeriodType === 'year' ? 'previousYear' : 'previousWeek';
    const nextCommand = this.currentPeriodType === 'month' ? 'nextMonth' :
                        this.currentPeriodType === 'year' ? 'nextYear' : 'nextWeek';

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'none';
        style-src ${webview.cspSource} 'unsafe-inline';
        script-src 'nonce-${nonce}';
        img-src ${webview.cspSource} data:;
        font-src ${webview.cspSource};
    ">
    <title>航海の始まり</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        background: #050510;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      }

      /* ナビゲーションバー - スライドと同じスタイル */
      .week-nav {
        position: fixed;
        top: 1rem;
        right: 1rem;
        display: flex;
        gap: 0.5rem;
        z-index: 100;
      }

      .week-nav-btn {
        padding: 0.6rem 1.2rem;
        border-radius: 100px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(10, 10, 15, 0.6);
        backdrop-filter: blur(10px);
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .week-nav-btn:hover:not(:disabled) {
        border-color: #1db954;
        color: #1db954;
        background: rgba(29, 185, 84, 0.1);
      }

      .week-nav-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .week-nav-btn.current-btn {
        border-color: rgba(29, 185, 84, 0.5);
        color: #1db954;
      }

      .week-nav-btn.current-btn:hover {
        background: rgba(29, 185, 84, 0.2);
      }

      /* 期間選択に戻るボタン - 左上 */
      .back-nav {
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 100;
      }

      .back-nav-btn {
        padding: 0.6rem 1.2rem;
        border-radius: 100px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(10, 10, 15, 0.6);
        backdrop-filter: blur(10px);
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .back-nav-btn:hover {
        border-color: rgba(255, 255, 255, 0.3);
        color: rgba(255, 255, 255, 0.8);
      }

      /* メインコンテナ */
      .main-content {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      /* 星空背景 */
      .starfield {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .star {
        position: absolute;
        background: white;
        border-radius: 50%;
        animation: twinkle var(--duration) ease-in-out infinite;
        animation-delay: var(--delay);
      }

      @keyframes twinkle {
        0%, 100% { opacity: var(--base-opacity); transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }

      /* 流れ星 */
      .shooting-star {
        position: absolute;
        width: 100px;
        height: 2px;
        background: linear-gradient(90deg, rgba(255,255,255,0.8), transparent);
        animation: shoot 3s linear infinite;
        opacity: 0;
      }

      .shooting-star:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
      .shooting-star:nth-child(2) { top: 40%; left: 60%; animation-delay: 2s; }
      .shooting-star:nth-child(3) { top: 70%; left: 30%; animation-delay: 4s; }

      @keyframes shoot {
        0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 0; }
        10% { opacity: 1; }
        30% { opacity: 0; }
        100% { transform: translateX(300px) translateY(300px) rotate(-45deg); opacity: 0; }
      }

      /* ネビュラ効果 */
      .nebula {
        position: fixed;
        width: 600px;
        height: 600px;
        border-radius: 50%;
        filter: blur(100px);
        opacity: 0.15;
        pointer-events: none;
      }

      .nebula-1 {
        top: -200px;
        right: -200px;
        background: radial-gradient(circle, #4f46e5 0%, transparent 70%);
        animation: nebulaPulse 8s ease-in-out infinite;
      }

      .nebula-2 {
        bottom: -200px;
        left: -200px;
        background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
        animation: nebulaPulse 10s ease-in-out infinite reverse;
      }

      @keyframes nebulaPulse {
        0%, 100% { transform: scale(1); opacity: 0.15; }
        50% { transform: scale(1.1); opacity: 0.2; }
      }

      /* コンテンツ */
      .container {
        text-align: center;
        padding: 3rem;
        max-width: 600px;
        position: relative;
        z-index: 10;
      }

      /* 宇宙船アイコン */
      .spacecraft {
        font-size: 5rem;
        margin-bottom: 2rem;
        display: inline-block;
        animation: float 4s ease-in-out infinite, glow 2s ease-in-out infinite alternate;
        filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.5));
      }

      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(-5deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }

      @keyframes glow {
        0% { filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.4)); }
        100% { filter: drop-shadow(0 0 40px rgba(99, 102, 241, 0.8)); }
      }

      /* タイトル */
      .eyebrow {
        font-family: 'Orbitron', monospace;
        font-size: 0.75rem;
        letter-spacing: 0.4em;
        text-transform: uppercase;
        color: #06b6d4;
        margin-bottom: 1rem;
        opacity: 0;
        animation: fadeSlideUp 0.8s ease forwards;
        animation-delay: 0.2s;
      }

      .title {
        font-family: 'Orbitron', monospace;
        font-size: 2rem;
        font-weight: 900;
        line-height: 1.3;
        margin-bottom: 1.5rem;
        background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #e2e8f0 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: fadeSlideUp 0.8s ease forwards, shimmer 3s linear infinite;
        animation-delay: 0.4s, 0s;
        opacity: 0;
      }

      @keyframes shimmer {
        0% { background-position: 200% center; }
        100% { background-position: -200% center; }
      }

      @keyframes fadeSlideUp {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      /* メッセージ */
      .message {
        color: #64748b;
        font-size: 1rem;
        line-height: 2;
        margin-bottom: 2.5rem;
        opacity: 0;
        animation: fadeSlideUp 0.8s ease forwards;
        animation-delay: 0.6s;
      }

      .message strong {
        color: #94a3b8;
      }

      /* ヒント */
      .hint {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(100, 116, 139, 0.2);
        opacity: 0;
        animation: fadeSlideUp 0.8s ease forwards;
        animation-delay: 0.8s;
      }

      .hint-label {
        font-family: 'Orbitron', monospace;
        font-size: 0.65rem;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: #475569;
        margin-bottom: 0.75rem;
      }

      .hint-text {
        color: #64748b;
        font-size: 0.875rem;
      }

      .hint-text code {
        background: rgba(99, 102, 241, 0.1);
        padding: 0.2em 0.5em;
        border-radius: 4px;
        font-family: 'Orbitron', monospace;
        font-size: 0.8em;
        color: #818cf8;
      }
    </style>
</head>
<body>
    <!-- 期間選択に戻るボタン -->
    <div class="back-nav">
      <button class="back-nav-btn" id="backBtn">← 期間選択に戻る</button>
    </div>

    <!-- 期間ナビゲーション -->
    <div class="week-nav">
      <button class="week-nav-btn" id="prevPeriod">← ${this.getPrevPeriodLabel(this.currentPeriodType)}</button>
      <button class="week-nav-btn current-btn" id="currentPeriod">${this.currentPeriodType === 'week' ? '今週' : this.currentPeriodType === 'month' ? '今月' : '今年'}</button>
      <button class="week-nav-btn" id="nextPeriod" ${isNextDisabled ? 'disabled' : ''}>${this.getNextPeriodLabel(this.currentPeriodType)} →</button>
    </div>

    <!-- 星空 -->
    <div class="starfield">
      ${Array.from({length: 80}, () => {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 3;
        const opacity = Math.random() * 0.5 + 0.3;
        return `<div class="star" style="width:${size}px;height:${size}px;left:${x}%;top:${y}%;--duration:${duration}s;--delay:${delay}s;--base-opacity:${opacity}"></div>`;
      }).join('')}
      <div class="shooting-star"></div>
      <div class="shooting-star"></div>
      <div class="shooting-star"></div>
    </div>

    <!-- ネビュラ -->
    <div class="nebula nebula-1"></div>
    <div class="nebula nebula-2"></div>

    <!-- メインコンテンツ -->
    <div class="main-content">
      <div class="container">
        <div class="spacecraft">🚀</div>
        <p class="eyebrow">Voyage Awaits</p>
        <h1 class="title">航海記録は<br>まだ始まったばかり</h1>
        <p class="message">
          コードを書くたびに、あなたの航海記録が刻まれます。<br>
          <strong>VS Code</strong>で開発を続けて、データを蓄積しましょう。
        </p>

        <div class="hint">
          <p class="hint-label">Demo Mode</p>
          <p class="hint-text">コマンドパレットから <code>Show Demo Review</code> でサンプルを確認できます</p>
        </div>
      </div>
    </div>

    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();

      // 期間選択に戻る
      const backBtn = document.getElementById('backBtn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          vscode.postMessage({ command: 'backToPeriodSelection' });
        });
      }

      // Previous期間
      const prevBtn = document.getElementById('prevPeriod');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          vscode.postMessage({ command: '${prevCommand}' });
        });
      }

      // Next期間
      const nextBtn = document.getElementById('nextPeriod');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          vscode.postMessage({ command: '${nextCommand}' });
        });
      }

      // 今週/今月/今年に飛ぶ
      const currentBtn = document.getElementById('currentPeriod');
      if (currentBtn) {
        currentBtn.addEventListener('click', () => {
          vscode.postMessage({ command: 'goToCurrentPeriod' });
        });
      }
    </script>
</body>
</html>`;
  }

  /**
   * 期間選択画面のスタイル
   */
  private getPeriodSelectionStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #0a0a0f;
        color: #ffffff;
        overflow: hidden;
        height: 100vh;
      }

      .period-selection-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }

      /* Background - matches slide style */
      .bg-gradient {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse 60% 40% at 30% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 50% 35% at 70% 80%, rgba(118, 75, 162, 0.12) 0%, transparent 50%);
        z-index: 0;
      }

      /* Noise overlay for texture - matches slide */
      .period-selection-container::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        opacity: 0.03;
        pointer-events: none;
        z-index: 1000;
      }

      .selection-content {
        position: relative;
        z-index: 2;
        text-align: center;
        padding: 2rem;
        max-width: 1000px;
        animation: contentFadeIn 0.6s ease-out;
        transform-origin: center center;
        transition: transform 0.2s ease;
      }

      @keyframes contentFadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Hero Section */
      .hero-section {
        margin-bottom: 3.5rem;
      }

      .hero-eyebrow {
        font-size: 0.85rem;
        color: #8b8b9e;
        letter-spacing: 0.05em;
        margin-bottom: 1rem;
        animation: contentFadeIn 0.6s ease-out 0.1s both;
      }

      .hero-title {
        display: flex;
        justify-content: center;
        gap: 0.6rem;
        flex-wrap: wrap;
        animation: contentFadeIn 0.6s ease-out 0.2s both;
      }

      .title-word {
        font-size: clamp(2.2rem, 6vw, 3.5rem);
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #ffffff;
        line-height: 1.1;
      }

      .title-word.accent {
        color: #25bcd6ff;
      }

      /* Period Cards */
      .period-cards {
        display: flex;
        gap: 1.25rem;
        justify-content: center;
        animation: contentFadeIn 0.6s ease-out 0.3s both;
      }

      .period-card {
        position: relative;
        width: 280px;
        border-radius: 16px;
        cursor: pointer;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        overflow: hidden;
      }

      .period-card:not(.locked):hover {
        transform: translateY(-6px);
      }

      /* Card accent line */
      .card-accent {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .period-card.weekly .card-accent { background: #06b6d4; }
      .period-card.monthly .card-accent { background: #a78bfa; }
      .period-card.yearly .card-accent { background: #f59e0b; }

      .period-card:not(.locked):hover .card-accent {
        opacity: 1;
      }

      .card-inner {
        padding: 1.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        backdrop-filter: blur(10px);
        transition: background 0.3s ease, border-color 0.3s ease;
      }

      .period-card:not(.locked):hover .card-inner {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .card-top {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .card-icon {
        font-size: 1.5rem;
      }

      .card-label {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        color: #8b8b9e;
      }

      .period-card.weekly .card-label { color: #06b6d4; }
      .period-card.monthly .card-label { color: #a78bfa; }
      .period-card.yearly:not(.locked) .card-label { color: #f59e0b; }

      .card-period {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .period-number {
        font-size: 3.5rem;
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.03em;
        color: #ffffff;
      }

      .period-unit {
        font-size: 1rem;
        font-weight: 500;
        color: #6b6b7e;
        text-transform: lowercase;
      }

      .card-desc {
        font-size: 0.9rem;
        color: #6b6b7e;
        line-height: 1.5;
        margin-bottom: 1.5rem;
        text-align: left;
      }

      .card-desc.muted {
        color: #5b5b6e;
      }

      .card-action {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 10px;
        font-size: 0.85rem;
        font-weight: 500;
        color: #8b8b9e;
        transition: all 0.3s ease;
      }

      .period-card.weekly:hover .card-action {
        background: rgba(6, 182, 212, 0.1);
        color: #06b6d4;
      }

      .period-card.monthly:hover .card-action {
        background: rgba(167, 139, 250, 0.1);
        color: #a78bfa;
      }

      .period-card.yearly:not(.locked):hover .card-action {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }


      /* Countdown for locked yearly */
      .countdown-display {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .countdown-num {
        font-size: 3rem;
        font-weight: 700;
        color: #5b5b6e;
        line-height: 1;
      }

      .countdown-text {
        font-size: 0.85rem;
        color: #4b4b5e;
      }

      /* Locked state */
      .period-card.locked {
        cursor: not-allowed;
      }

      .period-card.locked .card-inner {
        opacity: 0.5;
      }

      .period-card.locked .card-icon {
        filter: grayscale(1);
      }

      /* Card transition animations */
      .period-card.selected {
        transform: scale(1.02);
        z-index: 100;
      }

      .period-card.fade-out {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
        transition: all 0.35s ease-out;
      }

      /* Departure Overlay */
      .departure-overlay {
        position: fixed;
        inset: 0;
        background: radial-gradient(circle at center, rgba(10, 10, 15, 0.95) 0%, #0a0a0f 100%);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.5s ease;
      }

      .departure-overlay.active {
        opacity: 1;
        pointer-events: auto;
      }

      .departure-content {
        text-align: center;
        transform: scale(0.8) translateY(30px);
        opacity: 0;
        transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s;
      }

      .departure-overlay.active .departure-content {
        transform: scale(1) translateY(0);
        opacity: 1;
      }

      .departure-icon {
        font-size: 5rem;
        margin-bottom: 1.5rem;
        animation: departureIconPulse 1s ease-in-out infinite;
        filter: drop-shadow(0 0 40px var(--departure-color, #06b6d4));
      }

      @keyframes departureIconPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .departure-text {
        margin-bottom: 2rem;
      }

      .departure-label {
        display: block;
        font-size: 2.5rem;
        font-weight: 900;
        letter-spacing: 0.15em;
        color: var(--departure-color, #06b6d4);
        margin-bottom: 0.5rem;
      }

      .departure-subtitle {
        font-size: 1rem;
        color: #6b6b7e;
        letter-spacing: 0.1em;
      }

      .departure-loader {
        width: 200px;
        margin: 0 auto;
      }

      .loader-track {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 100px;
        overflow: hidden;
      }

      .loader-fill {
        height: 100%;
        width: 0%;
        background: var(--departure-color, #06b6d4);
        border-radius: 100px;
        animation: loaderProgress 1.5s ease-out forwards;
      }

      @keyframes loaderProgress {
        0% { width: 0%; }
        100% { width: 100%; }
      }

      .departure-particles {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .departure-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--departure-color, #06b6d4);
        border-radius: 50%;
        opacity: 0;
      }

      .departure-overlay.active .departure-particle {
        animation: departureParticle 1.5s ease-out forwards;
      }

      .departure-overlay.active .departure-particle:nth-child(1) { left: 50%; top: 50%; animation-delay: 0.3s; --angle: 0deg; }
      .departure-overlay.active .departure-particle:nth-child(2) { left: 50%; top: 50%; animation-delay: 0.35s; --angle: 18deg; }
      .departure-overlay.active .departure-particle:nth-child(3) { left: 50%; top: 50%; animation-delay: 0.4s; --angle: 36deg; }
      .departure-overlay.active .departure-particle:nth-child(4) { left: 50%; top: 50%; animation-delay: 0.45s; --angle: 54deg; }
      .departure-overlay.active .departure-particle:nth-child(5) { left: 50%; top: 50%; animation-delay: 0.5s; --angle: 72deg; }
      .departure-overlay.active .departure-particle:nth-child(6) { left: 50%; top: 50%; animation-delay: 0.55s; --angle: 90deg; }
      .departure-overlay.active .departure-particle:nth-child(7) { left: 50%; top: 50%; animation-delay: 0.6s; --angle: 108deg; }
      .departure-overlay.active .departure-particle:nth-child(8) { left: 50%; top: 50%; animation-delay: 0.65s; --angle: 126deg; }
      .departure-overlay.active .departure-particle:nth-child(9) { left: 50%; top: 50%; animation-delay: 0.7s; --angle: 144deg; }
      .departure-overlay.active .departure-particle:nth-child(10) { left: 50%; top: 50%; animation-delay: 0.75s; --angle: 162deg; }
      .departure-overlay.active .departure-particle:nth-child(11) { left: 50%; top: 50%; animation-delay: 0.8s; --angle: 180deg; }
      .departure-overlay.active .departure-particle:nth-child(12) { left: 50%; top: 50%; animation-delay: 0.85s; --angle: 198deg; }
      .departure-overlay.active .departure-particle:nth-child(13) { left: 50%; top: 50%; animation-delay: 0.9s; --angle: 216deg; }
      .departure-overlay.active .departure-particle:nth-child(14) { left: 50%; top: 50%; animation-delay: 0.95s; --angle: 234deg; }
      .departure-overlay.active .departure-particle:nth-child(15) { left: 50%; top: 50%; animation-delay: 1s; --angle: 252deg; }
      .departure-overlay.active .departure-particle:nth-child(16) { left: 50%; top: 50%; animation-delay: 1.05s; --angle: 270deg; }
      .departure-overlay.active .departure-particle:nth-child(17) { left: 50%; top: 50%; animation-delay: 1.1s; --angle: 288deg; }
      .departure-overlay.active .departure-particle:nth-child(18) { left: 50%; top: 50%; animation-delay: 1.15s; --angle: 306deg; }
      .departure-overlay.active .departure-particle:nth-child(19) { left: 50%; top: 50%; animation-delay: 1.2s; --angle: 324deg; }
      .departure-overlay.active .departure-particle:nth-child(20) { left: 50%; top: 50%; animation-delay: 1.25s; --angle: 342deg; }

      @keyframes departureParticle {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-150px) scale(0);
        }
      }
    `;
  }

  /**
   * Webviewコンテンツを生成
   */
  private getWebviewContent(
    webview: vscode.Webview,
    summary: WeeklySummary | MonthlySummary | YearlySummary
  ): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'none';
        style-src ${webview.cspSource} 'unsafe-inline';
        script-src 'nonce-${nonce}';
        img-src ${webview.cspSource} data:;
        font-src ${webview.cspSource};
    ">
    <title>Weekly Review</title>
    <style>
      ${this.getStyles()}
      ${this.getPeriodSpecificStyles(summary.periodType || 'week')}
    </style>
</head>
<body class="period-${summary.periodType || 'week'}">
    <div class="wrapped-container period-${summary.periodType || 'week'}">
        ${this.renderSlides(summary)}
    </div>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        ${this.getScripts()}
    </script>
</body>
</html>`;
  }

  /**
   * スタイルを取得
   */
  private getStyles(): string {
    return `
      :root {
        --bg-primary: #0a0a0f;
        --bg-secondary: #12121a;
        --bg-elevated: #1a1a2e;
        --bg-card: rgba(255, 255, 255, 0.03);
        --text-primary: #ffffff;
        --text-secondary: #8b8b9e;
        --accent-green: #1DB954;
        --accent-purple: #a855f7;
        --accent-blue: #3b82f6;
        --accent-orange: #f97316;
        --accent-pink: #ec4899;
        --accent-cyan: #06b6d4;
        --gradient-hero: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        --gradient-time: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
        --gradient-daily: linear-gradient(135deg, #10b981 0%, #059669 100%);
        --gradient-project: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        --gradient-language: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        --gradient-pattern: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        --gradient-night: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%);
        --gradient-records: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        --gradient-files: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: var(--bg-primary);
        color: var(--text-primary);
        overflow: hidden;
        height: 100vh;
      }

      .wrapped-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
      }

      /* Noise overlay for texture */
      .wrapped-container::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        opacity: 0.03;
        pointer-events: none;
        z-index: 1000;
      }

      .slide {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        opacity: 0;
        transform: translateX(100%) scale(0.95);
        transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .slide.active {
        opacity: 1;
        transform: translateX(0) scale(1);
      }

      .slide.prev {
        transform: translateX(-100%) scale(0.95);
        opacity: 0;
      }

      /* Slide backgrounds */
      .slide::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.15;
        z-index: -1;
      }

      .slide[data-slide="1"]::before {
        background: radial-gradient(ellipse at 30% 20%, rgba(102, 126, 234, 0.4) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 80%, rgba(118, 75, 162, 0.4) 0%, transparent 50%);
      }
      .slide[data-slide="2"]::before {
        background: radial-gradient(ellipse at 50% 30%, rgba(6, 182, 212, 0.4) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 50%);
      }
      .slide[data-slide="3"]::before {
        background: radial-gradient(ellipse at 20% 50%, rgba(16, 185, 129, 0.4) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 30%, rgba(5, 150, 105, 0.3) 0%, transparent 50%);
      }
      .slide[data-slide="4"]::before {
        background: radial-gradient(ellipse at 60% 20%, rgba(249, 115, 22, 0.4) 0%, transparent 50%),
                    radial-gradient(ellipse at 30% 80%, rgba(234, 88, 12, 0.3) 0%, transparent 50%);
      }
      .slide[data-slide="5"]::before {
        background: radial-gradient(ellipse at 40% 30%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 70%, rgba(124, 58, 237, 0.3) 0%, transparent 50%);
      }
      .slide[data-slide="6"]::before {
        background: radial-gradient(ellipse at 50% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
                    radial-gradient(ellipse at 20% 70%, rgba(29, 78, 216, 0.3) 0%, transparent 50%);
      }
      .slide[data-slide="7"]::before {
        background: radial-gradient(ellipse at 30% 30%, rgba(99, 102, 241, 0.5) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 60%, rgba(124, 58, 237, 0.4) 0%, transparent 50%);
      }
      .slide[data-slide="8"]::before {
        background: radial-gradient(ellipse at 50% 40%, rgba(245, 158, 11, 0.4) 0%, transparent 50%),
                    radial-gradient(ellipse at 20% 80%, rgba(217, 119, 6, 0.3) 0%, transparent 50%);
      }
      .slide[data-slide="9"]::before {
        background: radial-gradient(ellipse at 60% 30%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
                    radial-gradient(ellipse at 30% 70%, rgba(219, 39, 119, 0.3) 0%, transparent 50%);
      }
      .slide[data-slide="10"]::before {
        background: radial-gradient(ellipse at 50% 50%, rgba(102, 126, 234, 0.5) 0%, transparent 50%),
                    radial-gradient(ellipse at 50% 50%, rgba(118, 75, 162, 0.4) 0%, transparent 60%);
      }
      .slide[data-slide="11"]::before {
        background: radial-gradient(ellipse at 30% 30%, rgba(6, 182, 212, 0.4) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 50%);
      }

      .slides-container {
        width: 100%;
        height: 100%;
        position: relative;
        transform-origin: center center;
        transition: transform 0.2s ease;
      }

      .slide-content {
        max-width: 800px;
        width: 100%;
        text-align: center;
        position: relative;
        z-index: 1;
      }

      /* Slide header with emoji */
      .slide-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
      }

      .slide-emoji {
        font-size: 4rem;
        margin-bottom: 0.5rem;
        filter: drop-shadow(0 0 25px rgba(255, 255, 255, 0.4));
        animation: float 3s ease-in-out infinite;
      }

      .slide-title {
        font-size: 1.6rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
        background: var(--gradient-hero);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      h2 {
        font-size: 1.8rem;
        margin-bottom: 1.5rem;
        color: var(--text-primary);
      }

      .date-range {
        color: var(--text-secondary);
        font-size: 1rem;
        margin-bottom: 2rem;
      }

      .big-number {
        font-size: 5.5rem;
        font-weight: 900;
        background: var(--gradient-time);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 1rem 0;
        line-height: 1;
        letter-spacing: -0.03em;
        text-shadow: 0 0 80px rgba(6, 182, 212, 0.5);
      }

      .subtitle {
        font-size: 1.1rem;
        color: var(--text-secondary);
        margin-top: 0.5rem;
        font-weight: 400;
      }

      .comparison {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 100px;
        margin-top: 1.5rem;
        font-size: 0.95rem;
        font-weight: 600;
        backdrop-filter: blur(10px);
      }

      .comparison.positive {
        background: rgba(29, 185, 84, 0.15);
        color: #4ade80;
        border: 1px solid rgba(29, 185, 84, 0.3);
      }

      .comparison.negative {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      /* Project cards */
      .project-cards {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }

      .project-card {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 1.2rem 1.5rem;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 1rem;
        align-items: center;
        text-align: left;
        transition: all 0.3s ease;
      }

      .project-card:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(249, 115, 22, 0.3);
        transform: translateX(4px);
      }

      .rank {
        font-size: 1.3rem;
        font-weight: 800;
        background: var(--gradient-project);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        width: 40px;
      }

      .project-name {
        font-size: 1.05rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .project-time {
        font-size: 0.95rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .progress-bar-container {
        grid-column: 1 / -1;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-bar {
        height: 100%;
        background: var(--gradient-project);
        border-radius: 2px;
        transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
      }

      /* Language bars */
      .language-bars {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .language-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        text-align: left;
        padding: 0.75rem;
        border-radius: 12px;
        transition: all 0.3s ease;
      }

      .language-bar:hover {
        background: rgba(255, 255, 255, 0.03);
      }

      .language-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.85rem;
        color: white;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      }

      .language-info {
        flex: 1;
      }

      .language-name {
        font-weight: 600;
        margin-bottom: 0.4rem;
        font-size: 0.95rem;
      }

      .language-bar-container {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }

      .language-bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .language-time {
        color: var(--text-secondary);
        min-width: 80px;
        text-align: right;
        font-weight: 500;
        font-size: 0.9rem;
      }

      /* Pattern grid */
      .pattern-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-top: 2rem;
      }

      .pattern-item {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 1.5rem 1rem;
        text-align: center;
        transition: all 0.3s ease;
      }

      .pattern-item:hover {
        background: rgba(255, 255, 255, 0.06);
        transform: translateY(-4px);
      }

      .pattern-label {
        display: block;
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 500;
      }

      .pattern-value {
        display: block;
        font-size: 2rem;
        font-weight: 800;
        background: var(--gradient-records);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.4rem;
        line-height: 1.1;
      }

      .pattern-desc {
        display: block;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .pattern-extra {
        display: block;
        font-size: 0.85rem;
        color: var(--accent-green);
        margin-top: 0.3rem;
        font-weight: 600;
      }

      /* Coding Styles スライド */
      .slide-subtitle {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-bottom: 2rem;
        text-align: center;
      }

      .coding-styles-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .coding-style-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 0.875rem 0.75rem;
        transition: all 0.3s ease;
      }

      .coding-style-card:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.12);
        transform: translateY(-4px);
      }

      .style-emoji {
        font-size: 1.5rem;
        line-height: 1;
        flex-shrink: 0;
      }

      .style-content {
        flex: 1;
        text-align: center;
      }

      .style-title {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 0.25rem 0;
      }

      .style-description {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin: 0 0 0.35rem 0;
        line-height: 1.4;
      }

      .style-observation {
        display: inline-block;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--accent-cyan);
        background: rgba(6, 182, 212, 0.1);
        padding: 0.25rem 0.75rem;
        border-radius: 100px;
      }

      .coding-style-note {
        font-size: 0.8rem !important;
        color: var(--text-secondary) !important;
        max-width: 500px;
        margin: 1rem auto 0 !important;
        text-align: center;
        line-height: 1.5;
        opacity: 0.8;
      }

      .coding-style-empty {
        text-align: center;
        color: var(--text-secondary);
        padding: 2rem;
      }

      /* ========================================
       * Coding Styles Intro Slide - Dramatic Reveal
       * ======================================== */
      .coding-styles-intro-slide {
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* 背景エフェクトコンテナ */
      .intro-bg-effects {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }

      /* === 年間用: ゴールデンレイ === */
      .golden-rays {
        position: absolute;
        inset: -50%;
        background: conic-gradient(
          from 0deg at 50% 50%,
          transparent 0deg,
          rgba(251, 191, 36, 0.03) 10deg,
          transparent 20deg,
          rgba(251, 191, 36, 0.05) 30deg,
          transparent 40deg
        );
        animation: rotateRays 30s linear infinite;
      }

      @keyframes rotateRays {
        to { transform: rotate(360deg); }
      }

      .sparkle-field {
        position: absolute;
        inset: 0;
      }

      .bg-sparkle {
        position: absolute;
        left: var(--x);
        top: var(--y);
        width: var(--size);
        height: var(--size);
        background: #fbbf24;
        border-radius: 50%;
        opacity: 0;
        animation: sparkleFlash 2s ease-in-out var(--delay) infinite;
      }

      @keyframes sparkleFlash {
        0%, 100% { opacity: 0; transform: scale(0); }
        50% { opacity: 1; transform: scale(1); }
      }

      /* === 月間用: パープルオーロラ === */
      .purple-aurora {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse 80% 50% at 50% 120%,
          rgba(168, 85, 247, 0.15) 0%,
          rgba(139, 92, 246, 0.05) 40%,
          transparent 70%
        );
        animation: auroraBreath 4s ease-in-out infinite;
      }

      @keyframes auroraBreath {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }

      .floating-orbs {
        position: absolute;
        inset: 0;
      }

      .aurora-orb {
        position: absolute;
        left: var(--x);
        bottom: -20%;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
        border-radius: 50%;
        filter: blur(20px);
        animation: orbFloat 6s ease-in-out var(--delay) infinite;
      }

      @keyframes orbFloat {
        0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
        50% { transform: translateY(-30px) scale(1.1); opacity: 0.6; }
      }

      /* === 絵文字オービット === */
      .floating-emojis-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
      }

      .floating-emoji {
        position: absolute;
        left: 50%;
        top: 50%;
        font-size: 1.8rem;
        opacity: 0;
        offset-path: ellipse(calc(30% * var(--radius-scale, 1)) calc(26% * var(--radius-scale, 1)) at 50% 50%);
        offset-rotate: 0deg;
        transform: translate(var(--pos-offset, 0), var(--pos-offset, 0));
        animation:
          floatEmojiIn 0.8s ease-out var(--delay) forwards,
          orbitEmoji 60s linear var(--delay) infinite;
        animation-delay:
          var(--delay),
          calc(var(--delay) - 60s * var(--index) / var(--total));
      }

      @keyframes floatEmojiIn {
        from { opacity: 0; transform: translate(var(--pos-offset, 0), var(--pos-offset, 0)) scale(0); }
        to { opacity: 0.5; transform: translate(var(--pos-offset, 0), var(--pos-offset, 0)) scale(1); }
      }

      @keyframes orbitEmoji {
        from { offset-distance: 0%; }
        to { offset-distance: 100%; }
      }

      /* === メインタイトル === */
      .coding-styles-intro-slide .intro-centered {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100%;
        z-index: 10;
        position: relative;
      }

      .intro-reveal-container {
        text-align: center;
        position: relative;
      }

      /* 年間用: クラウン */
      .year-crown {
        font-size: 3rem;
        opacity: 0;
        animation: crownDrop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
        margin-bottom: 0.5rem;
      }

      @keyframes crownDrop {
        from { opacity: 0; transform: translateY(-30px) scale(0.5); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* タイトルラッパー */
      .intro-title-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.3rem;
      }

      .intro-line {
        display: block;
        font-weight: 700;
        opacity: 0;
        transform: translateY(20px);
      }

      .intro-line.line-1 {
        font-size: 1.4rem;
        color: var(--text-secondary);
        animation: lineReveal 0.6s ease-out 0.3s forwards;
      }

      .intro-line.line-2 {
        font-size: 2rem;
        animation: lineReveal 0.6s ease-out 0.5s forwards;
      }

      .intro-line.line-3 {
        font-size: 1.6rem;
        animation: lineReveal 0.6s ease-out 0.7s forwards;
      }

      @keyframes lineReveal {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* 年間用: タイトルにゴールド */
      .coding-styles-intro-slide.yearly .intro-line.line-2 {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fef3c7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3));
      }

      /* 月間用: タイトルにパープル */
      .coding-styles-intro-slide.monthly .intro-line.line-2 {
        background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #c4b5fd 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      /* パルスリング */
      .intro-pulse-ring {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 200px;
        height: 200px;
        border: 2px solid currentColor;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        opacity: 0;
        animation: pulseRing 3s ease-out 1s infinite;
      }

      .intro-pulse-ring.ring-2 {
        animation-delay: 1.5s;
      }

      .coding-styles-intro-slide.yearly .intro-pulse-ring {
        border-color: rgba(251, 191, 36, 0.3);
      }

      .coding-styles-intro-slide.monthly .intro-pulse-ring {
        border-color: rgba(168, 85, 247, 0.3);
      }

      @keyframes pulseRing {
        0% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.8); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
      }

      /* Coding Styles Slide - Header Animation */
      .coding-styles-slide .slide-header {
        opacity: 0;
        transform: scale(0.8);
      }

      .coding-styles-slide .slide-header.visible {
        opacity: 1;
        transform: scale(1);
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .coding-styles-slide .slide-message {
        opacity: 0;
        transform: translateY(10px);
      }

      .coding-styles-slide .slide-message.visible {
        opacity: 1;
        transform: translateY(0);
        transition: all 0.5s ease;
      }

      /* Coding Styles - Category Groups */
      .coding-styles-container {
        max-width: 800px;
        margin: 0 auto;
        opacity: 0;
      }

      .coding-styles-container.visible {
        opacity: 1;
      }

      .style-category-group {
        margin-bottom: 1rem;
        opacity: 0;
        transform: translateY(20px);
      }

      .style-category-group.visible {
        opacity: 1;
        transform: translateY(0);
        transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .style-category-label {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
        padding: 0.25rem 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 100px;
      }

      .style-category-label.time { color: #06b6d4; }
      .style-category-label.rhythm { color: #a855f7; }
      .style-category-label.focus { color: #f97316; }
      .style-category-label.exploration { color: #10b981; }

      .style-category-cards {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: center;
      }

      .coding-styles-slide .coding-style-card {
        opacity: 0;
        transform: scale(0.8) translateY(10px);
      }

      .coding-styles-slide .coding-style-card.visible {
        opacity: 1;
        transform: scale(1) translateY(0);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      /* ========================================
       * 年間用カテゴリ別コーディングスタイルスライド
       * Luxury Celebration × Maximalist Motion
       * ======================================== */
      .coding-styles-category-slide {
        /* position: absolute は .slide から継承 */
        overflow: hidden;
        background: rgba(20, 20, 30, 0.95);
      }

      .coding-styles-category-slide .slide-content {
        position: relative;
        z-index: 10;
        width: 100%;
        max-width: 700px;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: var(--text-primary);
      }

      /* 背景エフェクト共通 */
      .category-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }

      .category-bg .bg-effect-layer {
        position: absolute;
        inset: 0;
      }

      /* === TIME: ゴールド＋歯車回転 === */
      .category-time .category-bg {
        background: radial-gradient(ellipse at 50% 0%, rgba(251, 191, 36, 0.08) 0%, transparent 60%);
      }

      .category-time .bg-effect-layer {
        background:
          repeating-conic-gradient(from 0deg at 20% 80%, transparent 0deg, rgba(251, 191, 36, 0.02) 5deg, transparent 10deg),
          repeating-conic-gradient(from 45deg at 80% 20%, transparent 0deg, rgba(251, 191, 36, 0.02) 5deg, transparent 10deg);
        animation: rotateGears 40s linear infinite;
      }

      @keyframes rotateGears {
        to { transform: rotate(360deg); }
      }

      /* === RHYTHM: ピンク＋波打つグラデーション === */
      .category-rhythm .category-bg {
        background: radial-gradient(ellipse at 50% 100%, rgba(236, 72, 153, 0.08) 0%, transparent 60%);
      }

      .category-rhythm .bg-effect-layer {
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(236, 72, 153, 0.03) 25%,
          rgba(168, 85, 247, 0.03) 50%,
          rgba(236, 72, 153, 0.03) 75%,
          transparent 100%
        );
        background-size: 200% 100%;
        animation: waveFlow 4s ease-in-out infinite;
      }

      @keyframes waveFlow {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      /* === FOCUS: ブルー＋集中線 === */
      .category-focus .category-bg {
        background: radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
      }

      .category-focus .bg-effect-layer {
        background: repeating-linear-gradient(
          0deg,
          transparent 0px,
          transparent 100px,
          rgba(59, 130, 246, 0.02) 100px,
          rgba(59, 130, 246, 0.02) 101px
        ),
        repeating-linear-gradient(
          90deg,
          transparent 0px,
          transparent 100px,
          rgba(59, 130, 246, 0.02) 100px,
          rgba(59, 130, 246, 0.02) 101px
        );
        animation: pulseLines 3s ease-in-out infinite;
      }

      @keyframes pulseLines {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }

      /* === EXPLORATION: エメラルド＋星空 === */
      .category-exploration .category-bg {
        background: radial-gradient(ellipse at 30% 20%, rgba(16, 185, 129, 0.06) 0%, transparent 40%),
                    radial-gradient(ellipse at 70% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 40%);
      }

      .category-exploration .floating-particles {
        position: absolute;
        inset: 0;
      }

      .category-exploration .floating-particles::before,
      .category-exploration .floating-particles::after {
        content: '✦';
        position: absolute;
        font-size: 0.8rem;
        color: rgba(16, 185, 129, 0.4);
        animation: twinkle 2s ease-in-out infinite;
      }

      .category-exploration .floating-particles::before {
        top: 20%; left: 15%;
        animation-delay: 0s;
      }

      .category-exploration .floating-particles::after {
        top: 60%; right: 20%;
        animation-delay: 1s;
      }

      @keyframes twinkle {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
      }

      /* カテゴリヘッダー */
      .category-header {
        text-align: center;
        margin-bottom: 2rem;
        position: relative;
        z-index: 10;
        width: 100%;
      }

      .category-icon-wrapper {
        position: relative;
        display: inline-block;
        margin-bottom: 0.75rem;
      }

      .category-icon {
        font-size: 3rem;
        display: block;
      }

      .slide.active .category-icon {
        animation: iconBurst 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
      }

      @keyframes iconBurst {
        0% { transform: scale(0) rotate(-180deg); opacity: 0; }
        60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }

      .icon-glow {
        position: absolute;
        inset: -20px;
        border-radius: 50%;
        filter: blur(20px);
        opacity: 0;
      }

      .slide.active .icon-glow {
        animation: glowPulse 2s ease-in-out 0.5s infinite;
      }

      @keyframes glowPulse {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.1); }
      }

      .category-time .icon-glow { background: rgba(251, 191, 36, 0.3); }
      .category-rhythm .icon-glow { background: rgba(236, 72, 153, 0.3); }
      .category-focus .icon-glow { background: rgba(59, 130, 246, 0.3); }
      .category-exploration .icon-glow { background: rgba(16, 185, 129, 0.3); }

      .category-title {
        font-size: 1.6rem;
        font-weight: 700;
        margin: 0;
      }

      .slide.active .category-title {
        animation: titleSlideUp 0.6s ease-out 0.3s both;
      }

      .category-time .category-title { color: #fbbf24; }
      .category-rhythm .category-title { color: #ec4899; }
      .category-focus .category-title { color: #3b82f6; }
      .category-exploration .category-title { color: #10b981; }

      @keyframes titleSlideUp {
        from { transform: translateY(30px); opacity: 0; filter: blur(8px); }
        to { transform: translateY(0); opacity: 1; filter: blur(0); }
      }

      .category-subtitle {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin: 0.5rem 0 0 0;
      }

      .slide.active .category-subtitle {
        animation: fadeIn 0.5s ease-out 0.5s both;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* カテゴリスタイルグリッド */
      .category-styles-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        position: relative;
        z-index: 10;
      }

      /* スタイルカード（カテゴリ用） */
      .category-styles-grid .style-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
      }

      .slide.active .category-styles-grid .style-card {
        animation: cardFlipIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) calc(0.4s + var(--card-index) * 0.12s) both;
      }

      @keyframes cardFlipIn {
        from {
          opacity: 0;
          transform: perspective(1000px) rotateY(-30deg) translateX(-20px);
        }
        to {
          opacity: 1;
          transform: perspective(1000px) rotateY(0) translateX(0);
        }
      }

      .category-styles-grid .style-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .category-time .style-card:hover { box-shadow: 0 10px 30px rgba(251, 191, 36, 0.15); }
      .category-rhythm .style-card:hover { box-shadow: 0 10px 30px rgba(236, 72, 153, 0.15); }
      .category-focus .style-card:hover { box-shadow: 0 10px 30px rgba(59, 130, 246, 0.15); }
      .category-exploration .style-card:hover { box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15); }

      .category-styles-grid .card-emoji {
        font-size: 2.5rem;
        flex-shrink: 0;
      }

      .slide.active .category-styles-grid .card-emoji {
        animation: emojiPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) calc(0.6s + var(--card-index) * 0.12s) both;
      }

      @keyframes emojiPop {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }

      .category-styles-grid .card-content {
        flex: 1;
        min-width: 0;
      }

      .category-styles-grid .card-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
        color: var(--text-primary);
      }

      .category-styles-grid .card-description {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin: 0 0 0.5rem 0;
        line-height: 1.4;
      }

      .category-styles-grid .card-observation {
        display: inline-block;
        font-size: 0.75rem;
        padding: 0.25rem 0.75rem;
        border-radius: 100px;
        background: rgba(255, 255, 255, 0.05);
      }

      .category-time .card-observation { color: #fbbf24; }
      .category-rhythm .card-observation { color: #ec4899; }
      .category-focus .card-observation { color: #3b82f6; }
      .category-exploration .card-observation { color: #10b981; }

      /* 空状態 */
      .category-empty {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
      }

      .slide.active .category-empty {
        animation: fadeIn 0.5s ease-out 0.5s both;
      }

      .category-empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      /* ========================================
       * 個別スタイルスライド - Achievement Unlock Style
       * Dramatic reveal with bold geometric design
       * ======================================== */
      .individual-style-slide {
        overflow: hidden;
        background: #0a0a0f;
      }

      .individual-style-slide .slide-content {
        position: relative;
        z-index: 10;
        width: 100%;
        max-width: 520px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        padding: 2rem;
      }

      /* === 背景レイヤー === */
      .style-slide-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
      }

      .mesh-gradient {
        position: absolute;
        inset: -50%;
        background:
          radial-gradient(ellipse 80% 50% at 20% 20%, rgba(120, 80, 220, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 60% 80% at 80% 80%, rgba(60, 180, 220, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse 50% 50% at 50% 50%, rgba(220, 100, 180, 0.08) 0%, transparent 40%);
        animation: meshFloat 12s ease-in-out infinite;
      }

      @keyframes meshFloat {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        33% { transform: translate(2%, -2%) rotate(1deg); }
        66% { transform: translate(-1%, 1%) rotate(-0.5deg); }
      }

      .noise-overlay {
        position: absolute;
        inset: 0;
        opacity: 0.03;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      }

      /* 幾何学図形 */
      .geometric-shapes {
        position: absolute;
        inset: 0;
      }

      .geo-circle {
        position: absolute;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.06);
      }

      .geo-1 {
        width: 400px;
        height: 400px;
        top: -100px;
        right: -100px;
        animation: geoRotate 30s linear infinite;
      }

      .geo-2 {
        width: 300px;
        height: 300px;
        bottom: -80px;
        left: -80px;
        animation: geoRotate 25s linear infinite reverse;
      }

      @keyframes geoRotate {
        to { transform: rotate(360deg); }
      }

      .geo-line {
        position: absolute;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      }

      .geo-line-1 {
        width: 200px;
        top: 15%;
        left: 5%;
        transform: rotate(-15deg);
      }

      .geo-line-2 {
        width: 150px;
        bottom: 20%;
        right: 8%;
        transform: rotate(25deg);
      }

      .geo-line-3 {
        width: 100px;
        top: 60%;
        left: 10%;
        transform: rotate(-5deg);
      }

      /* スパークルバースト */
      .sparkle-burst {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        pointer-events: none;
      }

      .sparkle-particle {
        position: absolute;
        width: 3px;
        height: 3px;
        background: #fff;
        border-radius: 50%;
        opacity: 0;
        transform: rotate(var(--angle)) translateY(-80px);
        box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.5);
      }

      .slide.active .sparkle-particle {
        animation: sparkleBurst 1s ease-out var(--delay) both;
      }

      @keyframes sparkleBurst {
        0% {
          opacity: 0;
          transform: rotate(var(--angle)) translateY(0);
        }
        30% {
          opacity: 1;
        }
        100% {
          opacity: 0;
          transform: rotate(var(--angle)) translateY(-120px);
        }
      }

      /* === アクセントライン === */
      .accent-line {
        width: 60px;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--theme-color), transparent);
        opacity: 0;
      }

      .slide.active .top-line {
        animation: lineExpand 0.8s ease-out 0.1s both;
      }

      .slide.active .bottom-line {
        animation: lineExpand 0.8s ease-out 1.2s both;
      }

      @keyframes lineExpand {
        from { width: 0; opacity: 0; }
        to { width: 60px; opacity: 1; }
      }

      /* === アイコンステージ === */
      .style-icon-stage {
        position: relative;
        width: 140px;
        height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-backdrop {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, rgba(120, 80, 220, 0.2) 0%, transparent 70%);
        filter: blur(20px);
        opacity: 0;
      }

      .slide.active .icon-backdrop {
        animation: backdropPulse 2s ease-out 0.3s infinite;
      }

      @keyframes backdropPulse {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 0.3; transform: scale(1.1); }
      }

      .icon-ring {
        position: absolute;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      .ring-outer {
        inset: 0;
        opacity: 0;
      }

      .ring-inner {
        inset: 15px;
        opacity: 0;
      }

      .slide.active .ring-outer {
        animation: ringReveal 0.6s ease-out 0.2s both, ringPulse 3s ease-in-out 0.8s infinite;
      }

      .slide.active .ring-inner {
        animation: ringReveal 0.6s ease-out 0.35s both;
      }

      @keyframes ringReveal {
        from { transform: scale(0.5); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      @keyframes ringPulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.05); opacity: 0.4; }
      }

      .individual-style-slide .style-emoji {
        font-size: 4.5rem;
        position: relative;
        z-index: 2;
        filter: drop-shadow(0 0 20px rgba(120, 80, 220, 0.4));
        opacity: 0;
        transform: scale(0) rotate(-30deg);
      }

      .slide.active .individual-style-slide .style-emoji,
      .individual-style-slide.active .style-emoji {
        animation: emojiUnlock 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.4s both;
      }

      @keyframes emojiUnlock {
        0% { opacity: 0; transform: scale(0) rotate(-30deg); }
        60% { transform: scale(1.2) rotate(10deg); }
        80% { transform: scale(0.95) rotate(-5deg); }
        100% { opacity: 1; transform: scale(1) rotate(0); }
      }

      /* === タイトルエリア === */
      .style-title-area {
        text-align: center;
        position: relative;
      }

      .individual-style-slide .style-title {
        font-size: 1.8rem;
        font-weight: 800;
        color: #fff;
        margin: 0;
        letter-spacing: -0.02em;
        text-shadow: 0 0 40px rgba(120, 80, 220, 0.5);
        opacity: 0;
      }

      .slide.active .individual-style-slide .style-title,
      .individual-style-slide.active .style-title {
        animation: titleReveal 0.7s ease-out 0.6s both;
      }

      @keyframes titleReveal {
        from {
          opacity: 0;
          transform: translateY(20px);
          filter: blur(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
      }

      .title-underline {
        width: 0;
        height: 2px;
        margin: 0.75rem auto 0;
        background: linear-gradient(90deg, transparent, var(--theme-color), transparent);
      }

      .slide.active .title-underline {
        animation: underlineGrow 0.5s ease-out 0.9s both;
      }

      @keyframes underlineGrow {
        from { width: 0; }
        to { width: 80px; }
      }

      /* === スタイルカード === */
      .style-card {
        position: relative;
        padding: 1.5rem 2rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        backdrop-filter: blur(10px);
        max-width: 400px;
        opacity: 0;
        overflow: hidden;
      }

      .slide.active .style-card {
        animation: cardFloat 0.7s ease-out 1s both;
      }

      @keyframes cardFloat {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .card-glow {
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: conic-gradient(
          from 0deg,
          transparent,
          rgba(120, 80, 220, 0.1),
          transparent,
          rgba(60, 180, 220, 0.1),
          transparent
        );
        animation: cardGlowRotate 8s linear infinite;
        opacity: 0;
      }

      .slide.active .card-glow {
        animation: cardGlowRotate 8s linear 1.2s infinite;
        opacity: 1;
      }

      @keyframes cardGlowRotate {
        to { transform: rotate(360deg); }
      }

      .individual-style-slide .style-description {
        position: relative;
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.75);
        line-height: 1.7;
        margin: 0 0 1.25rem 0;
        text-align: center;
      }

      .style-stat {
        display: flex;
        justify-content: center;
      }

      .stat-value {
        display: inline-block;
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--theme-color);
        padding: 0.5rem 1.25rem;
        background: rgba(120, 80, 220, 0.15);
        border: 1px solid rgba(120, 80, 220, 0.25);
        border-radius: 100px;
        letter-spacing: 0.03em;
      }

      /* === マスター版スタイルの特別な装飾 === */
      .individual-style-slide.master-style .style-emoji {
        filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.6));
      }

      .individual-style-slide.master-style .icon-backdrop {
        background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%);
      }

      .individual-style-slide.master-style .style-title {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fef3c7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .individual-style-slide.master-style .stat-value {
        background: rgba(251, 191, 36, 0.15);
        border-color: rgba(251, 191, 36, 0.35);
        color: #fbbf24;
      }

      /* スタイルバッジ共通（タイトル上に中央寄せ） */
      .style-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 100px;
        font-size: 0.75rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }

      /* 年間専用スタイルのバッジ */
      .yearly-exclusive-badge {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: #1a1a2e;
      }

      /* マスター版バッジ */
      .master-badge {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%);
        color: #1a1a2e;
        box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
      }

      /* === 月間スタイルまとめスライド === */
      .monthly-styles-slide {
        overflow: hidden;
        background: #0a0a0f;
      }

      .monthly-styles-slide .slide-content {
        position: relative;
        z-index: 10;
        width: 100%;
        max-width: 700px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        padding: 2rem;
      }

      .monthly-styles-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
      }

      .monthly-bg-gradient {
        position: absolute;
        inset: -50%;
        background:
          radial-gradient(ellipse 80% 50% at 20% 30%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 60% 80% at 80% 70%, rgba(120, 80, 220, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse 50% 50% at 50% 50%, rgba(200, 100, 180, 0.08) 0%, transparent 40%);
        animation: monthlyMeshFloat 12s ease-in-out infinite;
      }

      @keyframes monthlyMeshFloat {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        33% { transform: translate(2%, -2%) rotate(1deg); }
        66% { transform: translate(-1%, 1%) rotate(-0.5deg); }
      }

      .monthly-floating-shapes {
        position: absolute;
        inset: 0;
      }

      .monthly-floating-shapes::before,
      .monthly-floating-shapes::after {
        content: '';
        position: absolute;
        border-radius: 50%;
        opacity: 0.06;
        background: var(--theme-color);
      }

      .monthly-floating-shapes::before {
        width: 300px;
        height: 300px;
        top: -100px;
        right: -100px;
        animation: monthlyShapeFloat 8s ease-in-out infinite;
      }

      .monthly-floating-shapes::after {
        width: 200px;
        height: 200px;
        bottom: -50px;
        left: -50px;
        animation: monthlyShapeFloat 10s ease-in-out infinite reverse;
      }

      @keyframes monthlyShapeFloat {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(20px, -20px) scale(1.1); }
      }

      /* 月間スタイルグリッド */
      .monthly-styles-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        width: 100%;
        max-width: 600px;
      }

      .monthly-style-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 1.25rem;
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
      }

      .monthly-style-card.animate-slide-up {
        animation: monthlyCardSlideUp 0.6s ease-out var(--card-delay, 0.3s) both;
      }

      @keyframes monthlyCardSlideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .monthly-style-card:hover {
        background: rgba(255, 255, 255, 0.07);
        transform: translateY(-2px);
        border-color: rgba(168, 85, 247, 0.3);
      }

      .monthly-card-emoji {
        font-size: 2.5rem;
        line-height: 1;
        flex-shrink: 0;
        filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.3));
      }

      .monthly-card-content {
        flex: 1;
        min-width: 0;
      }

      .monthly-card-title {
        font-size: 1rem;
        font-weight: 700;
        color: #fff;
        margin: 0 0 0.4rem 0;
        letter-spacing: -0.01em;
      }

      .monthly-card-desc {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        margin: 0 0 0.6rem 0;
        line-height: 1.4;
      }

      .monthly-card-stat {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--theme-color);
        padding: 0.25rem 0.75rem;
        background: rgba(168, 85, 247, 0.15);
        border: 1px solid rgba(168, 85, 247, 0.25);
        border-radius: 100px;
      }

      /* 月間スライドのアニメーション用クラス */
      .monthly-styles-slide .animate-pop-in {
        opacity: 0;
        transform: scale(0);
      }

      .monthly-styles-slide.active .animate-pop-in {
        animation: monthlyPopIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
      }

      .monthly-styles-slide .animate-pop-in.delay-1 {
        animation-delay: 0.1s;
      }

      @keyframes monthlyPopIn {
        from {
          opacity: 0;
          transform: scale(0);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .monthly-styles-slide .animate-fade-in {
        opacity: 0;
      }

      .monthly-styles-slide.active .animate-fade-in {
        animation: monthlyFadeIn 0.5s ease-out both;
      }

      .monthly-styles-slide .animate-fade-in.delay-2 {
        animation-delay: 0.2s;
      }

      .monthly-styles-slide .animate-fade-in.delay-6 {
        animation-delay: 1s;
      }

      @keyframes monthlyFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .monthly-styles-slide .slide-message {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.7);
        text-align: center;
        margin-top: 0.5rem;
      }

      /* レスポンシブ対応 */
      @media (max-width: 600px) {
        .monthly-styles-grid {
          grid-template-columns: 1fr;
        }
      }

      /* Heatmap */
      .heatmap {
        display: grid;
        grid-template-columns: repeat(24, 1fr);
        gap: 3px;
        margin-top: 2rem;
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
      }

      /* 月別ヒートマップ（年間用：12セル） */
      .heatmap.monthly-heatmap {
        grid-template-columns: repeat(12, 1fr);
        gap: 6px;
      }

      .heatmap.monthly-heatmap .heatmap-cell {
        aspect-ratio: 1;
        min-width: 28px;
        min-height: 28px;
        border-radius: 6px;
      }

      /* 週別ヒートマップ（月間用：4-5セル） */
      .heatmap.weekly-heatmap {
        grid-template-columns: repeat(var(--cell-count, 5), 1fr);
        gap: 10px;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
      }

      .heatmap.weekly-heatmap .heatmap-cell {
        aspect-ratio: 1;
        min-width: 50px;
        min-height: 50px;
        border-radius: 10px;
      }

      .heatmap-cell {
        aspect-ratio: 1;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.05);
        position: relative;
        transition: all 0.2s ease;
      }

      .heatmap-cell:hover {
        transform: scale(1.3);
        z-index: 10;
      }

      .heatmap-cell.level-1 { background: rgba(59, 130, 246, 0.2); }
      .heatmap-cell.level-2 { background: rgba(59, 130, 246, 0.4); }
      .heatmap-cell.level-3 { background: rgba(59, 130, 246, 0.6); }
      .heatmap-cell.level-4 { background: rgba(59, 130, 246, 0.8); }
      .heatmap-cell.level-5 { background: var(--accent-blue); box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }

      .heatmap-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 0.75rem;
        padding: 0 0.5rem;
        font-size: 0.7rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      /* File list */
      .file-list {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        margin-top: 1.5rem;
      }

      .file-item {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1rem 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        text-align: left;
        transition: all 0.3s ease;
      }

      .file-item:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(236, 72, 153, 0.3);
        transform: translateX(4px);
      }

      .file-rank {
        font-size: 1.1rem;
        font-weight: 800;
        background: var(--gradient-files);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        width: 30px;
      }

      .file-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .file-name {
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 0.9rem;
        font-weight: 500;
      }

      .file-project {
        font-size: 0.75rem;
        color: var(--text-secondary);
        opacity: 0.7;
      }

      .file-count {
        color: var(--text-secondary);
        font-size: 0.85rem;
        font-weight: 500;
      }

      /* Navigation */
      .slide-nav {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 1.5rem;
        z-index: 100;
        background: rgba(10, 10, 15, 0.8);
        backdrop-filter: blur(20px);
        padding: 0.75rem 1.5rem;
        border-radius: 100px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .nav-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        font-size: 1.1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .nav-btn:hover:not(:disabled) {
        background: var(--accent-green);
        transform: scale(1.1);
      }

      .nav-btn:disabled {
        opacity: 0.2;
        cursor: not-allowed;
      }

      .nav-dots {
        display: flex;
        gap: 0.4rem;
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .dot:hover {
        background: rgba(255, 255, 255, 0.4);
      }

      .dot.active {
        background: var(--accent-green);
        transform: scale(1.4);
        box-shadow: 0 0 10px rgba(29, 185, 84, 0.5);
      }

      /* Week navigation */
      .week-nav {
        position: fixed;
        top: 1rem;
        right: 1rem;
        display: flex;
        gap: 0.5rem;
        z-index: 100;
      }

      .week-nav-btn {
        padding: 0.6rem 1.2rem;
        border-radius: 100px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(10, 10, 15, 0.6);
        backdrop-filter: blur(10px);
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .week-nav-btn:hover:not(:disabled) {
        border-color: var(--accent-green);
        color: var(--accent-green);
        background: rgba(29, 185, 84, 0.1);
      }

      .week-nav-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .week-nav-btn.current-btn {
        border-color: rgba(29, 185, 84, 0.5);
        color: var(--accent-green);
      }

      .week-nav-btn.current-btn:hover {
        background: rgba(29, 185, 84, 0.2);
      }

      /* Animations */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.3); }
        to { opacity: 1; transform: scale(1); }
      }

      @keyframes floatIn {
        from { opacity: 0; transform: translateY(40px) scale(0.9); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes glow {
        0%, 100% { filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.2)); }
        50% { filter: drop-shadow(0 0 40px rgba(255, 255, 255, 0.4)); }
      }

      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-60px); }
        to { opacity: 1; transform: translateX(0); }
      }

      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(60px); }
        to { opacity: 1; transform: translateX(0); }
      }

      @keyframes bounceIn {
        0% { opacity: 0; transform: scale(0.3); }
        50% { transform: scale(1.1); }
        70% { transform: scale(0.9); }
        100% { opacity: 1; transform: scale(1); }
      }

      @keyframes popIn {
        0% { opacity: 0; transform: scale(0) rotate(-10deg); }
        60% { transform: scale(1.2) rotate(5deg); }
        100% { opacity: 1; transform: scale(1) rotate(0deg); }
      }

      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      @keyframes pulse-glow {
        0%, 100% {
          box-shadow: 0 0 20px rgba(29, 185, 84, 0.3);
          transform: scale(1);
        }
        50% {
          box-shadow: 0 0 40px rgba(29, 185, 84, 0.6);
          transform: scale(1.02);
        }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      @keyframes typewriter {
        from { width: 0; }
        to { width: 100%; }
      }

      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }

      @keyframes barGrow {
        from { transform: scaleY(0); }
        to { transform: scaleY(1); }
      }

      @keyframes fillWidth {
        from { width: 0%; }
        to { width: var(--target-width, 100%); }
      }

      @keyframes celebrateShake {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-5deg); }
        75% { transform: rotate(5deg); }
      }

      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0); }
        50% { opacity: 1; transform: scale(1); }
      }

      @keyframes countUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Animations only trigger when slide is active */
      .animate-fade-in {
        opacity: 0;
      }
      .slide.active .animate-fade-in {
        animation: fadeIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      .animate-scale-in {
        opacity: 0;
      }
      .slide.active .animate-scale-in {
        animation: scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      .animate-float-in {
        opacity: 0;
      }
      .slide.active .animate-float-in {
        animation: floatIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      .animate-glow {
        animation: glow 3s ease-in-out infinite;
      }

      .animate-slide-left {
        opacity: 0;
      }
      .slide.active .animate-slide-left {
        animation: slideInLeft 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      .animate-slide-right {
        opacity: 0;
      }
      .slide.active .animate-slide-right {
        animation: slideInRight 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      .animate-bounce-in {
        opacity: 0;
      }
      .slide.active .animate-bounce-in {
        animation: bounceIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      .animate-pop-in {
        opacity: 0;
      }
      .slide.active .animate-pop-in {
        animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      .animate-float {
        animation: float 3s ease-in-out infinite;
      }

      .animate-pulse-glow {
        animation: pulse-glow 2s ease-in-out infinite;
      }

      .animate-celebrate {
        animation: celebrateShake 0.5s ease-in-out 3;
      }

      .animate-bar-grow {
        transform-origin: bottom;
        animation: barGrow 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        transform: scaleY(0);
      }

      .shimmer-text {
        background: linear-gradient(90deg,
          var(--text-primary) 0%,
          rgba(255,255,255,0.8) 25%,
          var(--text-primary) 50%,
          rgba(255,255,255,0.8) 75%,
          var(--text-primary) 100%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        animation: shimmer 3s linear infinite;
      }

      /* Extended delays for progressive reveal - header → content → footer */
      .delay-1 { animation-delay: 0.1s; }   /* emoji */
      .delay-2 { animation-delay: 0.25s; }  /* title */
      .delay-3 { animation-delay: 0.5s; }   /* content start */
      .delay-4 { animation-delay: 0.7s; }
      .delay-5 { animation-delay: 0.9s; }
      .delay-6 { animation-delay: 1.1s; }   /* footer/message */
      .delay-7 { animation-delay: 1.3s; }
      .delay-8 { animation-delay: 1.5s; }
      .delay-9 { animation-delay: 1.7s; }
      .delay-10 { animation-delay: 1.9s; }
      .delay-11 { animation-delay: 2.1s; }
      .delay-12 { animation-delay: 2.3s; }
      .delay-13 { animation-delay: 2.5s; }
      .delay-14 { animation-delay: 2.7s; }
      .delay-15 { animation-delay: 2.9s; }

      /* Count-up number animation */
      .count-up {
        display: inline-block;
      }

      .count-up-char {
        display: inline-block;
        animation: countUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        opacity: 0;
      }

      /* Sparkle effects */
      .sparkle {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, white 0%, transparent 70%);
        border-radius: 50%;
        animation: sparkle 1.5s ease-in-out infinite;
      }

      /* Pattern grid 2 columns */
      .pattern-grid-2 {
        grid-template-columns: repeat(2, 1fr);
      }

      /* Night owl emoji - larger than normal */
      .night-owl-emoji {
        font-size: 4.5rem !important;
        filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.6)) !important;
      }

      /* Fix for emojis with multiple animations - ensure visibility */
      /* Slide emoji with float animation - only when slide is active */
      .slide.active .slide-emoji.animate-float {
        animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                   float 3s ease-in-out infinite 0.6s;
      }

      .slide.active .slide-emoji.animate-celebrate {
        animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                   celebrateShake 0.5s ease-in-out 0.6s 3;
      }

      /* Final slide emojis */
      .final-emoji {
        opacity: 0;
      }

      .slide.active .final-emoji.animate-bounce-in {
        animation: bounceIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      /* Night owl stats */
      .night-owl-stats {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        margin-top: 1.5rem;
      }

      .night-owl-main {
        text-align: center;
      }

      .night-owl-percentage {
        display: block;
        font-size: 7rem;
        font-weight: 900;
        background: var(--gradient-night);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1;
        letter-spacing: -0.03em;
        filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.6));
      }

      .night-owl-percentage.animate-night-glow {
        animation: nightGlow 2s ease-in-out infinite;
      }

      @keyframes nightGlow {
        0%, 100% {
          filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.6));
        }
        50% {
          filter: drop-shadow(0 0 60px rgba(99, 102, 241, 0.9)) drop-shadow(0 0 80px rgba(124, 58, 237, 0.5));
        }
      }

      /* Number scramble animation styles */
      .scramble-number {
        display: inline-block;
        font-variant-numeric: tabular-nums;
      }

      .scramble-char {
        display: inline-block;
        animation: scrambleReveal 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        opacity: 0;
      }

      @keyframes scrambleReveal {
        0% { opacity: 0; transform: translateY(-20px) scale(0.8); }
        50% { opacity: 1; transform: translateY(5px) scale(1.1); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }

      .night-owl-label {
        display: block;
        font-size: 1rem;
        color: var(--text-secondary);
        margin-top: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        font-weight: 500;
      }

      .night-owl-time {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 1.25rem 2rem;
        text-align: center;
      }

      .night-owl-time-value {
        display: block;
        font-size: 1.8rem;
        font-weight: 700;
        background: var(--gradient-night);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .night-owl-time-label {
        display: block;
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-top: 0.4rem;
      }

      .night-owl-message {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-top: 1rem;
        padding: 1rem 1.5rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
        text-align: center;
      }

      /* Daily breakdown chart */
      .daily-chart {
        margin-top: 1.5rem;
        width: 100%;
      }

      .daily-bars {
        display: flex;
        justify-content: center;
        align-items: flex-end;
        gap: 0.75rem;
        height: 280px;
        padding: 1rem;
      }

      .daily-bar-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        max-width: 70px;
      }

      .daily-bar-wrapper {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .daily-bar {
        width: 100%;
        background: var(--gradient-daily);
        border-radius: 10px 10px 4px 4px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 0.5rem;
        min-height: 20px;
        transition: all 1s cubic-bezier(0.22, 1, 0.36, 1);
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
      }

      .daily-bar:hover {
        transform: scaleY(1.02);
        box-shadow: 0 4px 30px rgba(16, 185, 129, 0.5);
      }

      .daily-bar.weekend {
        background: linear-gradient(180deg, #a855f7 0%, #7c3aed 100%);
        box-shadow: 0 4px 20px rgba(168, 85, 247, 0.3);
      }

      .daily-bar.weekend:hover {
        box-shadow: 0 4px 30px rgba(168, 85, 247, 0.5);
      }

      .daily-bar-time {
        font-size: 0.7rem;
        font-weight: 700;
        color: white;
        white-space: nowrap;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .daily-bar-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 0.75rem;
      }

      .day-name {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .day-num {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      /* Title slide */
      .title-slide {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
      }

      .title-icon {
        font-size: 6rem;
        margin-bottom: 1.5rem;
        filter: drop-shadow(0 0 30px rgba(29, 185, 84, 0.5));
      }

      .title-main {
        font-size: 4rem;
        font-weight: 900;
        margin: 0;
        line-height: 1;
        letter-spacing: -0.03em;
        background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .title-highlight {
        background: linear-gradient(135deg, #1DB954 0%, #1ed760 50%, #34d399 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 60px rgba(29, 185, 84, 0.5);
      }

      .title-date {
        font-size: 1.1rem;
        color: var(--text-secondary);
        margin-top: 2rem;
        font-weight: 500;
        letter-spacing: 0.05em;
      }

      .title-hint {
        margin-top: 4rem;
        padding: 1rem 2rem;
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 100px;
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-weight: 500;
      }

      .title-hint span {
        opacity: 0.9;
      }

      /* Demo badge */
      .demo-badge {
        position: fixed;
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 0.5rem 1.25rem;
        border-radius: 100px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        z-index: 1000;
        animation: demoPulse 2s ease-in-out infinite;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
      }

      @keyframes demoPulse {
        0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
        50% { opacity: 0.9; transform: translateX(-50%) scale(1.03); }
      }

      /* Back button - matches week-nav-btn style */
      .back-button {
        position: fixed;
        top: 1rem;
        left: 1rem;
        padding: 0.6rem 1.2rem;
        border-radius: 100px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(10, 10, 15, 0.6);
        backdrop-filter: blur(10px);
        cursor: pointer;
        color: var(--text-secondary);
        font-size: 0.85rem;
        font-weight: 500;
        z-index: 1000;
        transition: all 0.3s ease;
      }

      .back-button:hover {
        border-color: var(--accent-green);
        color: var(--accent-green);
        background: rgba(29, 185, 84, 0.1);
      }

      /* Slide message */
      .slide-message {
        margin-top: 1.5rem;
        padding: 1rem 1.5rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        color: var(--text-secondary);
        font-size: 0.95rem;
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
      }

      /* Story-style progress bar - moved to bottom */
      .story-progress {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 6px;
        z-index: 100;
        width: 85%;
        max-width: 700px;
        padding: 1rem 1.5rem;
        background: rgba(10, 10, 15, 0.8);
        backdrop-filter: blur(20px);
        border-radius: 100px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .story-bar {
        flex: 1;
        height: 6px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 3px;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .story-bar:hover {
        transform: scaleY(1.5);
      }

      .story-bar-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, var(--accent-green), #1ed760);
        border-radius: 3px;
        will-change: width;
      }

      .story-bar-fill.active {
        animation: storyProgress 5s linear forwards;
      }

      .story-bar-fill.completed {
        width: 100%;
        animation: none;
        background: var(--accent-green);
      }

      .story-bar-fill.paused {
        animation-play-state: paused;
      }

      @keyframes storyProgress {
        0% { width: 0%; }
        100% { width: 100%; }
      }

      /* Final slide */
      .final-slide {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .final-emojis {
        display: flex;
        gap: 1rem;
        justify-content: center;
        align-items: center;
        margin-bottom: 1rem;
      }

      .final-emoji {
        font-size: 5rem;
        filter: drop-shadow(0 0 40px rgba(251, 191, 36, 0.5));
      }

      .final-emojis .final-emoji:nth-child(2) {
        font-size: 6rem;
      }

      .final-title {
        font-size: 3.5rem;
        font-weight: 900;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.5rem;
      }

      .final-subtitle {
        font-size: 1.6rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 1.5rem;
        opacity: 0.9;
      }

      .final-message {
        max-width: 500px;
        padding: 1.5rem 2rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        color: var(--text-primary);
        font-size: 1.1rem;
        line-height: 1.6;
        text-align: center;
        margin-bottom: 2rem;
      }

      /* Summary slide styles */
      .summary-slide {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
      }

      /* ===== SUMMARY CARD - New Bold Design ===== */
      .summary-card {
        width: 100%;
        max-width: 380px;
        border-radius: 24px;
        overflow: hidden;
        position: relative;
      }

      .summary-card-inner {
        padding: 28px;
        position: relative;
        z-index: 1;
      }

      .summary-header {
        margin-bottom: 24px;
      }

      .summary-brand-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .summary-brand {
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.1em;
      }

      .summary-date {
        font-size: 12px;
        font-weight: 500;
        opacity: 0.7;
        letter-spacing: 0.02em;
      }

      .summary-main {
        margin-bottom: 28px;
      }

      .summary-hero {
        text-align: center;
      }

      .summary-hero-label {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        padding: 6px 18px;
        border-radius: 20px;
        margin-bottom: 12px;
      }

      .summary-hero-value {
        display: block;
        font-size: 52px;
        font-weight: 900;
        letter-spacing: -0.03em;
        line-height: 1;
      }

      .summary-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .summary-stat {
        padding: 14px;
        border-radius: 14px;
        text-align: center;
      }

      .stat-value {
        display: block;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 4px;
        letter-spacing: -0.01em;
      }

      .stat-unit {
        font-size: 12px;
        font-weight: 500;
        opacity: 0.7;
        margin-left: 2px;
      }

      .stat-label {
        display: block;
        font-size: 10px;
        font-weight: 600;
        opacity: 0.5;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }

      .summary-footer {
        margin-top: 24px;
        text-align: center;
      }

      .summary-tagline {
        font-size: 11px;
        font-weight: 500;
        opacity: 0.4;
        letter-spacing: 0.05em;
      }

      .summary-actions {
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;
      }

      .summary-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .summary-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }

      .summary-btn .btn-icon {
        font-size: 1rem;
      }

      .summary-btn.success {
        background: rgba(29, 185, 84, 0.3);
        border-color: rgba(29, 185, 84, 0.5);
      }

      .summary-btn:disabled {
        opacity: 0.7;
        cursor: wait;
      }

      .summary-btn .btn-icon.spinning {
        display: inline-block;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Back to selection button */
      .back-to-selection-wrapper {
        margin-top: 1.5rem;
        padding-top: 1rem;
      }

      .back-to-selection-btn {
        padding: 0.6rem 1.2rem;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-secondary);
        background: rgba(10, 10, 15, 0.6);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 100px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .back-to-selection-btn:hover {
        border-color: var(--accent-green);
        color: var(--accent-green);
        background: rgba(29, 185, 84, 0.1);
      }

      /* Pause indicator */
      .pause-indicator {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%) scale(0);
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 24px;
        padding: 1rem 2rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 200;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .pause-indicator.visible {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }

      .pause-indicator-icon {
        font-size: 2rem;
      }

      .pause-indicator-text {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .pause-indicator-hint {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-top: 0.25rem;
      }

      /* Story bar paused state */
      .story-bar-fill.paused {
        animation-play-state: paused !important;
        background: linear-gradient(90deg, var(--accent-orange), #f59e0b) !important;
      }

      .story-progress.paused {
        border-color: rgba(249, 115, 22, 0.5);
      }

      /* Story progress wrapper with hint */
      .story-progress-wrapper {
        position: fixed;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        z-index: 100;
        width: 85%;
        max-width: 700px;
      }

      .story-progress-wrapper .story-progress {
        position: static;
        transform: none;
        bottom: auto;
        left: auto;
        width: 100%;
        max-width: none;
      }

      .pause-hint {
        font-size: 0.75rem;
        color: var(--text-secondary);
        opacity: 0.7;
        letter-spacing: 0.05em;
      }

      /* ===== 週間 SUMMARY CARD - シアン系 ===== */
      .period-week .summary-card {
        background: linear-gradient(160deg, #0c1929 0%, #0f2132 50%, #0a1520 100%);
        border: 1px solid rgba(6, 182, 212, 0.25);
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
      }

      .period-week .summary-brand {
        color: #06b6d4;
      }

      .period-week .summary-date {
        color: rgba(6, 182, 212, 0.7);
      }

      .period-week .summary-hero-label {
        color: #22d3ee;
        background: rgba(6, 182, 212, 0.1);
        border: 1px solid rgba(6, 182, 212, 0.3);
      }

      .period-week .summary-hero-value {
        color: #06b6d4;
        text-shadow: 0 0 60px rgba(6, 182, 212, 0.5);
      }

      .period-week .summary-stat {
        background: rgba(6, 182, 212, 0.08);
        border: 1px solid rgba(6, 182, 212, 0.12);
      }

      .period-week .stat-value {
        color: #e0f7fa;
      }

      .period-week .stat-label {
        color: rgba(6, 182, 212, 0.6);
      }

      .period-week .summary-tagline {
        color: rgba(6, 182, 212, 0.4);
      }

      /* ===== 月間 SUMMARY CARD - パープル系 ===== */
      .period-month .summary-card {
        background: linear-gradient(160deg, #1a0a2e 0%, #251340 50%, #150825 100%);
        border: 1px solid rgba(168, 85, 247, 0.3);
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
      }

      .period-month .summary-brand {
        color: #a855f7;
      }

      .period-month .summary-date {
        color: rgba(168, 85, 247, 0.7);
      }

      .period-month .summary-hero-label {
        color: #c084fc;
        background: rgba(168, 85, 247, 0.1);
        border: 1px solid rgba(168, 85, 247, 0.3);
      }

      .period-month .summary-hero-value {
        color: #a855f7;
        text-shadow: 0 0 60px rgba(168, 85, 247, 0.5);
      }

      .period-month .summary-stat {
        background: rgba(168, 85, 247, 0.08);
        border: 1px solid rgba(168, 85, 247, 0.12);
      }

      .period-month .stat-value {
        color: #f3e8ff;
      }

      .period-month .stat-label {
        color: rgba(168, 85, 247, 0.6);
      }

      .period-month .summary-tagline {
        color: rgba(168, 85, 247, 0.4);
      }

      /* ===== 年間 SUMMARY CARD - ゴールド系 ===== */
      .period-year .summary-card {
        background: linear-gradient(160deg, #1a1400 0%, #2a1f00 50%, #141000 100%);
        border: 1px solid rgba(251, 191, 36, 0.35);
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
      }

      .period-year .summary-brand {
        color: #fbbf24;
      }

      .period-year .summary-date {
        color: rgba(251, 191, 36, 0.7);
      }

      .period-year .summary-hero-label {
        color: #fcd34d;
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.3);
      }

      .period-year .summary-hero-value {
        color: #fbbf24;
        text-shadow: 0 0 60px rgba(251, 191, 36, 0.5);
      }

      .period-year .summary-stat {
        background: rgba(251, 191, 36, 0.08);
        border: 1px solid rgba(251, 191, 36, 0.12);
      }

      .period-year .stat-value {
        color: #fef3c7;
      }

      .period-year .stat-label {
        color: rgba(251, 191, 36, 0.6);
      }

      .period-year .summary-tagline {
        color: rgba(251, 191, 36, 0.4);
      }

    `;
  }

  /**
   * 期間別の追加スタイルを取得
   * 週間はベーシック、月間はリッチ、年間は豪華絢爛なアワード風
   */
  private getPeriodSpecificStyles(periodType: ReviewPeriodType): string {
    if (periodType === 'week') {
      return ''; // 週間はベースのスタイルをそのまま使用
    }

    const monthStyles = `
      /* ===== MONTHLY ENHANCED STYLES ===== */

      /* 月間用グラデーションメッシュ背景 */
      .period-month .wrapped-container::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background:
          radial-gradient(ellipse at 20% 0%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(168, 85, 247, 0.12) 0%, transparent 45%),
          radial-gradient(ellipse at 40% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 90% 90%, rgba(236, 72, 153, 0.08) 0%, transparent 40%);
        pointer-events: none;
        z-index: 0;
        animation: meshFloat 20s ease-in-out infinite;
      }

      @keyframes meshFloat {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }

      /* 月間スライド背景の強化 */
      .period-month .slide::before {
        opacity: 0.25;
      }

      .period-month .slide[data-slide="1"]::before {
        background:
          radial-gradient(ellipse at 30% 20%, rgba(236, 72, 153, 0.5) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(168, 85, 247, 0.5) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 60%);
      }

      /* 月間タイトルスライドの強化 */
      .period-month .title-slide .title-icon {
        font-size: 6rem;
        animation: monthlyIconPulse 3s ease-in-out infinite;
      }

      @keyframes monthlyIconPulse {
        0%, 100% {
          transform: scale(1);
          filter: drop-shadow(0 0 30px rgba(236, 72, 153, 0.5));
        }
        50% {
          transform: scale(1.1);
          filter: drop-shadow(0 0 50px rgba(236, 72, 153, 0.8));
        }
      }

      .period-month .title-main {
        font-size: 3rem;
        letter-spacing: 0.02em;
      }

      .period-month .title-highlight {
        background: linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #3b82f6 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: monthlyGradientShift 5s ease-in-out infinite;
        background-size: 200% 200%;
      }

      @keyframes monthlyGradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      /* 月間の数値表示強化 */
      .period-month .big-number {
        font-size: 6rem;
        background: linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #3b82f6 100%);
        -webkit-background-clip: text;
        background-clip: text;
        text-shadow: 0 0 100px rgba(236, 72, 153, 0.6);
      }

      /* 月間カード強化 */
      .period-month .project-card,
      .period-month .language-bar,
      .period-month .pattern-item {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(236, 72, 153, 0.15);
        transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .period-month .project-card:hover,
      .period-month .language-bar:hover,
      .period-month .pattern-item:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(236, 72, 153, 0.4);
        box-shadow: 0 10px 40px rgba(236, 72, 153, 0.2);
        transform: translateY(-4px);
      }

      /* 月間のスライド遷移強化 */
      .period-month .slide {
        transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .period-month .slide.active {
        animation: monthlySlideIn 0.8s cubic-bezier(0.22, 1, 0.36, 1);
      }

      @keyframes monthlySlideIn {
        from {
          opacity: 0;
          transform: translateX(80px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      /* 月間絵文字グロー */
      .period-month .slide-emoji {
        filter: drop-shadow(0 0 30px rgba(236, 72, 153, 0.5));
        animation: monthlyEmojiGlow 2s ease-in-out infinite;
      }

      @keyframes monthlyEmojiGlow {
        0%, 100% { filter: drop-shadow(0 0 30px rgba(236, 72, 153, 0.5)); }
        50% { filter: drop-shadow(0 0 50px rgba(168, 85, 247, 0.7)); }
      }

      /* 月間フローティングパーティクル */
      .period-month .wrapped-container {
        position: relative;
      }

      .period-month .wrapped-container::before {
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        opacity: 0.04;
      }

      /* ===== 月間スライド別フローティング絵文字エフェクト ===== */

      @keyframes monthlyFloatEmoji {
        0%, 100% {
          opacity: 0.15;
          transform: translateY(0) scale(1) rotate(0deg);
        }
        50% {
          opacity: 0.45;
          transform: translateY(-6px) scale(1.08) rotate(5deg);
        }
      }

      @keyframes monthlyFloatEmojiReverse {
        0%, 100% {
          opacity: 0.2;
          transform: translateY(0) scale(1) rotate(0deg);
        }
        50% {
          opacity: 0.5;
          transform: translateY(-5px) scale(1.05) rotate(-4deg);
        }
      }

      @keyframes monthlyTwinkle {
        0%, 100% { opacity: 0.2; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.1); }
      }

      /* 月間スライドの共通セットアップ */
      .period-month .slide .slide-content {
        position: relative;
      }

      /* Slide 1: タイトル - 🎊✨ */
      .period-month .slide[data-slide="1"] .slide-content::before {
        content: '🎊';
        position: absolute;
        top: 12%;
        left: 6%;
        font-size: 1.4rem;
        animation: monthlyFloatEmoji 4s ease-in-out infinite;
        pointer-events: none;
      }
      .period-month .slide[data-slide="1"] .slide-content::after {
        content: '✨';
        position: absolute;
        top: 18%;
        right: 8%;
        font-size: 1.2rem;
        animation: monthlyFloatEmojiReverse 3.5s ease-in-out infinite 0.5s;
        pointer-events: none;
      }

      /* Slide 2: 総時間 - ⏱️💪 */
      .period-month .slide[data-slide="2"] .slide-content::before {
        content: '💪';
        position: absolute;
        top: 8%;
        left: 6%;
        font-size: 1.3rem;
        animation: monthlyFloatEmoji 3.5s ease-in-out infinite;
        pointer-events: none;
      }
      .period-month .slide[data-slide="2"] .slide-content::after {
        content: '✨';
        position: absolute;
        top: 12%;
        right: 8%;
        font-size: 1.1rem;
        animation: monthlyFloatEmojiReverse 4s ease-in-out infinite 0.3s;
        pointer-events: none;
      }

      /* Slide 3: 期間別チャート - 📊📈 */
      .period-month .slide[data-slide="3"] .slide-content::before {
        content: '📈';
        position: absolute;
        top: 6%;
        left: 5%;
        font-size: 1.2rem;
        animation: monthlyFloatEmoji 4s ease-in-out infinite 0.2s;
        pointer-events: none;
      }
      .period-month .slide[data-slide="3"] .slide-content::after {
        content: '✨';
        position: absolute;
        top: 12%;
        right: 6%;
        font-size: 1rem;
        animation: monthlyTwinkle 2.5s ease-in-out infinite;
        pointer-events: none;
      }

      /* Slide 4: トッププロジェクト - 🚀⭐ */
      .period-month .slide[data-slide="4"] .slide-content::before {
        content: '⭐';
        position: absolute;
        top: 6%;
        left: 5%;
        font-size: 1.3rem;
        animation: monthlyFloatEmoji 3.5s ease-in-out infinite;
        pointer-events: none;
      }
      .period-month .slide[data-slide="4"] .slide-content::after {
        content: '💫';
        position: absolute;
        top: 10%;
        right: 6%;
        font-size: 1.1rem;
        animation: monthlyFloatEmojiReverse 4s ease-in-out infinite 0.4s;
        pointer-events: none;
      }

      /* Slide 5: トップファイル - 📄✨ */
      .period-month .slide[data-slide="5"] .slide-content::before {
        content: '📁';
        position: absolute;
        top: 8%;
        left: 5%;
        font-size: 1.2rem;
        animation: monthlyFloatEmoji 3.8s ease-in-out infinite 0.1s;
        pointer-events: none;
      }
      .period-month .slide[data-slide="5"] .slide-content::after {
        content: '✨';
        position: absolute;
        top: 14%;
        right: 10%;
        font-size: 1rem;
        animation: monthlyTwinkle 2.8s ease-in-out infinite;
        pointer-events: none;
      }

      /* Slide 6: 言語 - 💻🌐 */
      .period-month .slide[data-slide="6"] .slide-content::before {
        content: '🌐';
        position: absolute;
        top: 8%;
        left: 6%;
        font-size: 1.2rem;
        animation: monthlyFloatEmoji 4s ease-in-out infinite;
        pointer-events: none;
      }
      .period-month .slide[data-slide="6"] .slide-content::after {
        content: '✨';
        position: absolute;
        top: 12%;
        right: 8%;
        font-size: 1rem;
        animation: monthlyFloatEmojiReverse 3.5s ease-in-out infinite 0.3s;
        pointer-events: none;
      }

      /* Slide 7: Night Owl - 🌙⭐ */
      .period-month .slide[data-slide="7"] .slide-content::before {
        content: '⭐';
        position: absolute;
        top: 8%;
        left: 6%;
        font-size: 1.1rem;
        animation: monthlyTwinkle 2s ease-in-out infinite;
        pointer-events: none;
      }
      .period-month .slide[data-slide="7"] .slide-content::after {
        content: '💫';
        position: absolute;
        top: 12%;
        right: 5%;
        font-size: 1rem;
        animation: monthlyFloatEmojiReverse 3.8s ease-in-out infinite 0.2s;
        pointer-events: none;
      }

      /* Slide 8: Records - 🏆🎯 */
      .period-month .slide[data-slide="8"] .slide-content::before {
        content: '🎯';
        position: absolute;
        top: 6%;
        left: 6%;
        font-size: 1.2rem;
        animation: monthlyFloatEmoji 3.5s ease-in-out infinite;
        pointer-events: none;
      }
      .period-month .slide[data-slide="8"] .slide-content::after {
        content: '⭐';
        position: absolute;
        top: 10%;
        right: 8%;
        font-size: 1.1rem;
        animation: monthlyFloatEmojiReverse 4s ease-in-out infinite 0.4s;
        pointer-events: none;
      }

      /* Slide 9: Coding Styles - 💎🌈 */
      .period-month .slide[data-slide="9"] .slide-content::before {
        content: '💎';
        position: absolute;
        top: 6%;
        left: 8%;
        font-size: 1.2rem;
        animation: monthlyFloatEmoji 4s ease-in-out infinite;
        pointer-events: none;
      }
      .period-month .slide[data-slide="9"] .slide-content::after {
        content: '🌈';
        position: absolute;
        top: 10%;
        right: 6%;
        font-size: 1.1rem;
        animation: monthlyFloatEmojiReverse 3.5s ease-in-out infinite 0.3s;
        pointer-events: none;
      }
    `;

    const yearStyles = `
      /* ===== YEARLY AWARDS CEREMONY STYLES - 豪華絢爛 ===== */

      /* 年間専用CSS変数 */
      .period-year {
        --gold-primary: #fbbf24;
        --gold-secondary: #f59e0b;
        --gold-dark: #d97706;
        --gold-glow: rgba(251, 191, 36, 0.6);
        --champagne: #f5e6d3;
        --platinum: #e5e7eb;
        --award-gradient: linear-gradient(135deg, #fbbf24 0%, #f59e0b 25%, #fcd34d 50%, #f59e0b 75%, #fbbf24 100%);
      }

      /* 豪華なグラデーションメッシュ背景 */
      .period-year .wrapped-container::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background:
          radial-gradient(ellipse at 10% 10%, rgba(251, 191, 36, 0.2) 0%, transparent 40%),
          radial-gradient(ellipse at 90% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 45%),
          radial-gradient(ellipse at 50% 50%, rgba(252, 211, 77, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 20% 80%, rgba(251, 191, 36, 0.12) 0%, transparent 45%),
          radial-gradient(ellipse at 80% 90%, rgba(217, 119, 6, 0.15) 0%, transparent 40%);
        pointer-events: none;
        z-index: 0;
        animation: yearlyMeshShimmer 15s ease-in-out infinite;
      }

      @keyframes yearlyMeshShimmer {
        0%, 100% {
          opacity: 1;
          filter: hue-rotate(0deg);
        }
        50% {
          opacity: 0.9;
          filter: hue-rotate(10deg);
        }
      }

      /* 輝くスポットライト効果 */
      .period-year .slide::after {
        content: '';
        position: absolute;
        top: -50%;
        left: 50%;
        width: 200%;
        height: 200%;
        background: conic-gradient(
          from 0deg at 50% 50%,
          transparent 0deg,
          rgba(251, 191, 36, 0.03) 60deg,
          transparent 120deg,
          rgba(245, 158, 11, 0.02) 180deg,
          transparent 240deg,
          rgba(252, 211, 77, 0.03) 300deg,
          transparent 360deg
        );
        animation: spotlightRotate 30s linear infinite;
        pointer-events: none;
        z-index: 0;
      }

      @keyframes spotlightRotate {
        from { transform: translateX(-50%) rotate(0deg); }
        to { transform: translateX(-50%) rotate(360deg); }
      }

      /* 年間スライド背景の豪華化 */
      .period-year .slide::before {
        opacity: 0.35;
      }

      .period-year .slide[data-slide="1"]::before {
        background:
          radial-gradient(ellipse at 50% 30%, rgba(251, 191, 36, 0.6) 0%, transparent 50%),
          radial-gradient(ellipse at 30% 70%, rgba(245, 158, 11, 0.4) 0%, transparent 45%),
          radial-gradient(ellipse at 70% 60%, rgba(252, 211, 77, 0.5) 0%, transparent 50%);
        animation: yearlyTitleGlow 4s ease-in-out infinite;
      }

      @keyframes yearlyTitleGlow {
        0%, 100% { opacity: 0.35; }
        50% { opacity: 0.5; }
      }

      /* 年間タイトル - アワード風 */
      .period-year .title-slide .title-icon {
        font-size: 7rem;
        animation: yearlyTrophyBounce 2s ease-in-out infinite;
        filter: drop-shadow(0 0 60px rgba(251, 191, 36, 0.8));
      }

      @keyframes yearlyTrophyBounce {
        0%, 100% {
          transform: scale(1) rotate(-3deg);
          filter: drop-shadow(0 0 60px rgba(251, 191, 36, 0.8));
        }
        25% {
          transform: scale(1.05) rotate(0deg);
          filter: drop-shadow(0 0 80px rgba(251, 191, 36, 1));
        }
        50% {
          transform: scale(1) rotate(3deg);
          filter: drop-shadow(0 0 60px rgba(251, 191, 36, 0.8));
        }
        75% {
          transform: scale(1.05) rotate(0deg);
          filter: drop-shadow(0 0 80px rgba(251, 191, 36, 1));
        }
      }

      .period-year .title-main {
        font-size: 3.5rem;
        font-weight: 900;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .period-year .title-highlight {
        background: var(--award-gradient);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: yearlyGoldShimmer 3s ease-in-out infinite;
        text-shadow: 0 0 80px rgba(251, 191, 36, 0.5);
      }

      @keyframes yearlyGoldShimmer {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      /* 年間の数値表示 - ゴールド&輝き */
      .period-year .big-number {
        font-size: 7rem;
        font-weight: 900;
        background: var(--award-gradient);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        background-clip: text;
        animation: yearlyGoldShimmer 3s ease-in-out infinite, yearlyNumberPulse 2s ease-in-out infinite;
        position: relative;
      }

      @keyframes yearlyNumberPulse {
        0%, 100% {
          text-shadow: 0 0 100px rgba(251, 191, 36, 0.6);
          transform: scale(1);
        }
        50% {
          text-shadow: 0 0 150px rgba(251, 191, 36, 0.9);
          transform: scale(1.02);
        }
      }

      /* 年間ヘッダー強化 */
      .period-year .slide-title {
        font-size: 2rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        background: linear-gradient(135deg, #ffffff 0%, #fbbf24 50%, #ffffff 100%);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        background-clip: text;
        animation: yearlyTitleShine 4s ease-in-out infinite;
      }

      @keyframes yearlyTitleShine {
        0%, 100% { background-position: 200% 50%; }
        50% { background-position: 0% 50%; }
      }

      /* 年間絵文字 - 輝く王冠効果 */
      .period-year .slide-emoji {
        font-size: 5rem;
        animation: yearlyEmojiCrown 3s ease-in-out infinite;
        filter: drop-shadow(0 0 40px rgba(251, 191, 36, 0.7));
      }

      @keyframes yearlyEmojiCrown {
        0%, 100% {
          transform: scale(1) rotate(0deg);
          filter: drop-shadow(0 0 40px rgba(251, 191, 36, 0.7));
        }
        25% {
          transform: scale(1.1) rotate(-5deg);
          filter: drop-shadow(0 0 60px rgba(251, 191, 36, 1));
        }
        75% {
          transform: scale(1.1) rotate(5deg);
          filter: drop-shadow(0 0 60px rgba(251, 191, 36, 1));
        }
      }

      /* 年間カード - ゴールド縁取り */
      .period-year .project-card,
      .period-year .language-bar,
      .period-year .pattern-item {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
        border: 1px solid rgba(251, 191, 36, 0.25);
        box-shadow:
          0 4px 20px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(251, 191, 36, 0.1);
        transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .period-year .project-card:hover,
      .period-year .language-bar:hover,
      .period-year .pattern-item:hover {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(0, 0, 0, 0.15) 100%);
        border-color: rgba(251, 191, 36, 0.6);
        box-shadow:
          0 15px 50px rgba(251, 191, 36, 0.3),
          0 5px 20px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(251, 191, 36, 0.3);
        transform: translateY(-6px) scale(1.02);
      }

      /* 年間ランク - メダル風 */
      .period-year .rank {
        background: var(--award-gradient);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        background-clip: text;
        animation: yearlyGoldShimmer 3s ease-in-out infinite;
        font-weight: 900;
      }

      .period-year .project-card:first-child .rank::before {
        content: '👑';
        position: absolute;
        top: -1.5rem;
        left: 50%;
        transform: translateX(-50%);
        font-size: 1.5rem;
        animation: crownFloat 2s ease-in-out infinite;
      }

      @keyframes crownFloat {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(-5px); }
      }

      /* 年間スライド遷移 - ドラマティック */
      .period-year .slide {
        transition: all 1s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .period-year .slide.active {
        animation: yearlySlideReveal 1s cubic-bezier(0.22, 1, 0.36, 1);
      }

      @keyframes yearlySlideReveal {
        from {
          opacity: 0;
          transform: translateX(100px) scale(0.9);
          filter: blur(10px);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
          filter: blur(0);
        }
      }

      /* 年間プログレスバー - ゴールド */
      .period-year .progress-bar,
      .period-year .language-bar-fill {
        background: var(--award-gradient) !important;
        background-size: 200% 200% !important;
        animation: yearlyGoldShimmer 3s ease-in-out infinite !important;
        box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
      }

      /* ===== 年間スライド別フローティング絵文字エフェクト ===== */

      /* 共通のtwinkleアニメーション */
      @keyframes floatEmoji {
        0%, 100% {
          opacity: 0.3;
          transform: translateY(0) scale(1) rotate(0deg);
        }
        50% {
          opacity: 0.8;
          transform: translateY(-10px) scale(1.2) rotate(10deg);
        }
      }

      @keyframes floatEmojiReverse {
        0%, 100% {
          opacity: 0.4;
          transform: translateY(0) scale(1) rotate(0deg);
        }
        50% {
          opacity: 0.9;
          transform: translateY(-8px) scale(1.15) rotate(-8deg);
        }
      }

      @keyframes starTwinkle {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }

      /* 年間スライドの共通セットアップ */
      .period-year .slide .slide-content {
        position: relative;
      }

      /* Slide 1: タイトル - 🎆✨🌟 */
      .period-year .slide[data-slide="1"] .slide-content::before {
        content: '🎆';
        position: absolute;
        top: 10%;
        left: 8%;
        font-size: 2rem;
        animation: floatEmoji 3s ease-in-out infinite;
        pointer-events: none;
      }
      .period-year .slide[data-slide="1"] .slide-content::after {
        content: '✨';
        position: absolute;
        top: 15%;
        right: 10%;
        font-size: 1.8rem;
        animation: floatEmojiReverse 2.5s ease-in-out infinite 0.5s;
        pointer-events: none;
      }

      /* Slide 2: 総時間 - ⏱️⚡💫 */
      .period-year .slide[data-slide="2"] .slide-content::before {
        content: '⚡';
        position: absolute;
        top: 6%;
        left: 8%;
        font-size: 1.8rem;
        animation: floatEmoji 2.8s ease-in-out infinite;
        pointer-events: none;
      }
      .period-year .slide[data-slide="2"] .slide-content::after {
        content: '💫';
        position: absolute;
        top: 12%;
        right: 10%;
        font-size: 1.5rem;
        animation: floatEmojiReverse 3.2s ease-in-out infinite 0.3s;
        pointer-events: none;
      }

      /* Slide 3: 期間別チャート - 📊📈✨ */
      .period-year .slide[data-slide="3"] .slide-content::before {
        content: '📈';
        position: absolute;
        top: 5%;
        left: 5%;
        font-size: 1.6rem;
        animation: floatEmoji 3s ease-in-out infinite 0.2s;
        pointer-events: none;
      }
      .period-year .slide[data-slide="3"] .slide-content::after {
        content: '✨';
        position: absolute;
        top: 10%;
        right: 8%;
        font-size: 1.4rem;
        animation: floatEmojiReverse 2.6s ease-in-out infinite;
        pointer-events: none;
      }

      /* Slide 4: トッププロジェクト - 🚀💫🌟 */
      .period-year .slide[data-slide="4"] .slide-content::before {
        content: '💫';
        position: absolute;
        top: 5%;
        left: 6%;
        font-size: 1.7rem;
        animation: floatEmoji 2.5s ease-in-out infinite;
        pointer-events: none;
      }
      .period-year .slide[data-slide="4"] .slide-content::after {
        content: '🌟';
        position: absolute;
        top: 10%;
        right: 8%;
        font-size: 1.5rem;
        animation: floatEmojiReverse 3s ease-in-out infinite 0.4s;
        pointer-events: none;
      }

      /* Slide 5: トップファイル - 📄✨📁 */
      .period-year .slide[data-slide="5"] .slide-content::before {
        content: '📂';
        position: absolute;
        top: 6%;
        left: 6%;
        font-size: 1.5rem;
        animation: floatEmoji 2.8s ease-in-out infinite 0.1s;
        pointer-events: none;
      }
      .period-year .slide[data-slide="5"] .slide-content::after {
        content: '✨';
        position: absolute;
        top: 12%;
        right: 12%;
        font-size: 1.4rem;
        animation: floatEmojiReverse 3.2s ease-in-out infinite;
        pointer-events: none;
      }

      /* Slide 6: 言語 - 💻🗣️✨ */
      .period-year .slide[data-slide="6"] .slide-content::before {
        content: '💻';
        position: absolute;
        top: 6%;
        left: 6%;
        font-size: 1.6rem;
        animation: floatEmoji 3s ease-in-out infinite;
        pointer-events: none;
      }
      .period-year .slide[data-slide="6"] .slide-content::after {
        content: '✨';
        position: absolute;
        top: 10%;
        right: 8%;
        font-size: 1.3rem;
        animation: floatEmojiReverse 2.7s ease-in-out infinite 0.3s;
        pointer-events: none;
      }

      /* Slide 7 (8 - offset): Night Owl - 🦉🌙⭐✨ */
      .period-year .night-owl-stats {
        position: relative;
      }

      .period-year .night-owl-stats::before {
        content: '✨';
        position: absolute;
        top: 0;
        right: 10%;
        font-size: 1.5rem;
        animation: starTwinkle 1.5s ease-in-out infinite;
      }

      .period-year .night-owl-stats::after {
        content: '⭐';
        position: absolute;
        top: 5%;
        left: 15%;
        font-size: 1.2rem;
        animation: starTwinkle 2s ease-in-out infinite 0.5s;
      }

      .period-year .slide[data-slide="7"] .slide-content::before {
        content: '🌙';
        position: absolute;
        top: 5%;
        left: 8%;
        font-size: 1.8rem;
        animation: floatEmoji 4s ease-in-out infinite;
        pointer-events: none;
      }
      .period-year .slide[data-slide="7"] .slide-content::after {
        content: '💫';
        position: absolute;
        top: 10%;
        right: 5%;
        font-size: 1.4rem;
        animation: floatEmojiReverse 3.5s ease-in-out infinite 0.2s;
        pointer-events: none;
      }

      /* Slide 8 (9 - offset): Records - 🏆🥇🎯 */
      .period-year .slide[data-slide="8"] .slide-content::before {
        content: '🥇';
        position: absolute;
        top: 5%;
        left: 8%;
        font-size: 1.7rem;
        animation: floatEmoji 2.6s ease-in-out infinite;
        pointer-events: none;
      }
      .period-year .slide[data-slide="8"] .slide-content::after {
        content: '🎯';
        position: absolute;
        top: 10%;
        right: 10%;
        font-size: 1.5rem;
        animation: floatEmojiReverse 3s ease-in-out infinite 0.4s;
        pointer-events: none;
      }

      /* Slide 9: Coding Styles - ✨🌈💎 */
      .period-year .slide[data-slide="9"] .slide-content::before {
        content: '💎';
        position: absolute;
        top: 5%;
        left: 10%;
        font-size: 1.6rem;
        animation: floatEmoji 3.2s ease-in-out infinite;
        pointer-events: none;
      }
      .period-year .slide[data-slide="9"] .slide-content::after {
        content: '🌈';
        position: absolute;
        top: 8%;
        right: 8%;
        font-size: 1.5rem;
        animation: floatEmojiReverse 2.8s ease-in-out infinite 0.3s;
        pointer-events: none;
      }

      /* 年間ファイナルスライド - 究極の演出 */
      .period-year .final-slide {
        position: relative;
      }

      .period-year .final-title {
        font-size: 4rem;
        background: var(--award-gradient);
        background-size: 300% 300%;
        -webkit-background-clip: text;
        background-clip: text;
        animation: yearlyFinalShimmer 2s ease-in-out infinite;
      }

      @keyframes yearlyFinalShimmer {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .period-year .final-emojis .final-emoji {
        font-size: 4rem;
        animation: yearlyFinalBounce 1s ease-in-out infinite;
      }

      .period-year .final-emojis .final-emoji:nth-child(1) { animation-delay: 0s; }
      .period-year .final-emojis .final-emoji:nth-child(2) { animation-delay: 0.2s; }
      .period-year .final-emojis .final-emoji:nth-child(3) { animation-delay: 0.4s; }

      @keyframes yearlyFinalBounce {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-20px) rotate(-10deg); }
        75% { transform: translateY(-20px) rotate(10deg); }
      }

      /* 年間レコードスライド - トロフィー効果 */
      .period-year .pattern-item {
        position: relative;
        overflow: visible;
      }

      .period-year .slide[data-slide="8"] .pattern-item::before,
      .period-year .slide[data-slide="9"] .pattern-item::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: var(--award-gradient);
        background-size: 200% 200%;
        border-radius: inherit;
        z-index: -1;
        opacity: 0;
        animation: yearlyGoldShimmer 3s ease-in-out infinite;
        transition: opacity 0.3s ease;
      }

      .period-year .pattern-item:hover::before {
        opacity: 1;
      }

      /* コーディングスタイルカード - 年間特別版 */
      .period-year .coding-style-card {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(0, 0, 0, 0.3) 100%);
        border: 1px solid rgba(251, 191, 36, 0.3);
        box-shadow:
          0 8px 32px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(251, 191, 36, 0.15);
      }

      .period-year .coding-style-card:hover {
        border-color: rgba(251, 191, 36, 0.6);
        box-shadow:
          0 15px 50px rgba(251, 191, 36, 0.25),
          0 8px 25px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(251, 191, 36, 0.3);
        transform: translateY(-6px) scale(1.02);
      }

      .period-year .coding-style-card .style-emoji {
        filter: drop-shadow(0 0 25px rgba(251, 191, 36, 0.6));
      }

      /* ストーリーバー - ゴールド */
      .period-year .story-bar-fill {
        background: linear-gradient(90deg, #fbbf24, #f59e0b) !important;
      }

      .period-year .story-bar.active .story-bar-fill {
        box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
      }

      /* ノイズテクスチャ強化 */
      .period-year .wrapped-container::before {
        opacity: 0.025;
      }

      /* ===== SPARKLES FOR YEARLY ===== */

      .sparkles-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        z-index: 5;
      }

      .sparkle {
        position: absolute;
        left: var(--x);
        top: var(--y);
        width: 4px;
        height: 4px;
        background: #fbbf24;
        border-radius: 50%;
        box-shadow: 0 0 10px #fbbf24, 0 0 20px #fbbf24, 0 0 30px #f59e0b;
        animation: sparkleGlow 1.5s ease-in-out var(--delay) infinite;
        transform: scale(var(--scale));
      }

      .sparkle::before,
      .sparkle::after {
        content: '';
        position: absolute;
        background: #fbbf24;
      }

      .sparkle::before {
        width: 2px;
        height: 16px;
        left: 1px;
        top: -6px;
        border-radius: 2px;
      }

      .sparkle::after {
        width: 16px;
        height: 2px;
        left: -6px;
        top: 1px;
        border-radius: 2px;
      }

      @keyframes sparkleGlow {
        0%, 100% {
          opacity: 0.3;
          transform: scale(var(--scale)) rotate(0deg);
        }
        50% {
          opacity: 1;
          transform: scale(calc(var(--scale) * 1.5)) rotate(180deg);
        }
      }

      /* Final slide container special effects */
      .period-year .final-slide-container:not(.active) .sparkle {
        animation-play-state: paused;
        opacity: 0;
      }

      /* ===== YEARLY SUMMARY SPARKLES ===== */
      .summary-sparkle-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
      }

      .summary-sparkle {
        position: absolute;
        left: var(--x);
        top: var(--y);
        width: 4px;
        height: 4px;
        background: #fbbf24;
        border-radius: 50%;
        box-shadow: 0 0 8px #fbbf24, 0 0 16px #f59e0b;
        animation: summarySparkleGlow 2s ease-in-out var(--delay) infinite;
        transform: scale(var(--scale));
      }

      .summary-sparkle::before,
      .summary-sparkle::after {
        content: '';
        position: absolute;
        background: #fbbf24;
      }

      .summary-sparkle::before {
        width: 2px;
        height: 12px;
        left: 1px;
        top: -4px;
        border-radius: 2px;
      }

      .summary-sparkle::after {
        width: 12px;
        height: 2px;
        left: -4px;
        top: 1px;
        border-radius: 2px;
      }

      @keyframes summarySparkleGlow {
        0%, 100% {
          opacity: 0.2;
          transform: scale(var(--scale)) rotate(0deg);
        }
        50% {
          opacity: 0.9;
          transform: scale(calc(var(--scale) * 1.3)) rotate(180deg);
        }
      }
    `;

    const monthParticleStyles = `
      /* ===== MONTHLY FLOATING PARTICLES ===== */

      .monthly-particles-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        z-index: 5;
      }

      .monthly-particle {
        position: absolute;
        bottom: -20px;
        left: var(--x);
        width: 8px;
        height: 8px;
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.6), rgba(168, 85, 247, 0.6));
        border-radius: 50%;
        opacity: 0;
        animation: monthlyParticleFloat var(--duration) ease-out var(--delay) infinite;
      }

      .monthly-particle::before {
        content: '';
        position: absolute;
        inset: -2px;
        background: radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%);
        border-radius: 50%;
      }

      @keyframes monthlyParticleFloat {
        0% {
          opacity: 0;
          transform: translateY(0) scale(0.5);
        }
        20% {
          opacity: 0.8;
        }
        100% {
          opacity: 0;
          transform: translateY(-100vh) scale(1.2);
        }
      }

      .period-month .final-slide-container.active .monthly-particle {
        animation-play-state: running;
      }

      .period-month .final-slide-container:not(.active) .monthly-particle {
        animation-play-state: paused;
        opacity: 0;
      }

      /* ===== MONTHLY SUMMARY SHIMMER ===== */
      .summary-shimmer-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
      }

      .summary-shimmer {
        position: absolute;
        left: var(--x);
        top: var(--y);
        width: 6px;
        height: 6px;
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.5), rgba(168, 85, 247, 0.5));
        border-radius: 50%;
        opacity: 0;
        animation: summaryShimmerFloat var(--duration) ease-in-out var(--delay) infinite;
      }

      .summary-shimmer::before {
        content: '';
        position: absolute;
        inset: -3px;
        background: radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%);
        border-radius: 50%;
      }

      @keyframes summaryShimmerFloat {
        0%, 100% {
          opacity: 0;
          transform: translateY(0) scale(0.8);
        }
        50% {
          opacity: 0.7;
          transform: translateY(-20px) scale(1.2);
        }
      }

      /* ===== CALENDAR HEATMAP ===== */
      .calendar-heatmap-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        width: 100%;
        max-width: 400px;
        margin: 0 auto;
      }

      .calendar-month-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      .calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 3px;
        width: 100%;
        margin-bottom: 4px;
      }

      .calendar-weekday {
        font-size: 0.65rem;
        color: var(--text-secondary);
        text-align: center;
        padding: 2px;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 3px;
        width: 100%;
      }

      .calendar-day {
        aspect-ratio: 1;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.6);
        transition: all 0.2s ease;
        position: relative;
      }

      .calendar-day:hover {
        transform: scale(1.2);
        z-index: 10;
      }

      .calendar-day.empty {
        background: transparent;
      }

      /* Heatmap intensity levels - darker = more activity */
      .period-month .calendar-day.level-0 { background: #3d4451; }
      .period-month .calendar-day.level-1 { background: #4ade80; }
      .period-month .calendar-day.level-2 { background: #39d353; }
      .period-month .calendar-day.level-3 { background: #26a641; }
      .period-month .calendar-day.level-4 { background: #006d32; }
      .period-month .calendar-day.level-5 { background: #0e4429; }

      /* Yearly uses same color scheme - darker = more activity */
      .period-year .calendar-day.level-0 { background: #3d4451; }
      .period-year .calendar-day.level-1 { background: #4ade80; }
      .period-year .calendar-day.level-2 { background: #39d353; }
      .period-year .calendar-day.level-3 { background: #26a641; }
      .period-year .calendar-day.level-4 { background: #006d32; }
      .period-year .calendar-day.level-5 { background: #0e4429; }

      .calendar-day.today {
        box-shadow: 0 0 0 2px var(--accent-primary);
      }

      .calendar-legend {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.7rem;
        color: var(--text-secondary);
        margin-top: 1rem;
      }

      .legend-label {
        margin-right: 0.25rem;
      }

      .legend-squares {
        display: flex;
        gap: 3px;
      }

      .legend-square {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }

      /* Yearly: 12 mini calendars grid */
      .yearly-calendar-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 0.5rem;
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
      }

      .mini-calendar {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        padding: 0.35rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .mini-calendar-title {
        font-size: 0.55rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-align: center;
        margin-bottom: 0.15rem;
      }

      .mini-calendar .calendar-grid {
        gap: 1px;
      }

      .mini-calendar .calendar-day {
        font-size: 0;
        border-radius: 1px;
      }

      .mini-calendar .calendar-day:hover {
        transform: scale(1.3);
      }

      /* Calendar slide compact message */
      .calendar-slide .slide-subtitle {
        margin-bottom: 0.5rem;
      }

      .calendar-slide .slide-message {
        margin-top: 0.75rem;
        padding: 0.75rem 1rem;
      }

      /* Animation for calendar appearance */
      @keyframes calendarFadeIn {
        0% {
          opacity: 0;
          transform: scale(0.95);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      .calendar-heatmap-container,
      .yearly-calendar-grid {
        animation: calendarFadeIn 0.5s ease forwards;
      }

      .mini-calendar {
        animation: calendarFadeIn 0.3s ease forwards;
        animation-delay: calc(var(--index) * 0.05s);
        opacity: 0;
      }
    `;

    if (periodType === 'month') {
      return monthStyles + monthParticleStyles;
    } else if (periodType === 'year') {
      // 年間は月間のスタイルも継承しつつ、年間専用のゴールド装飾とsparklesを追加
      return monthStyles + yearStyles + monthParticleStyles;
    }

    return '';
  }

  /**
   * スライドをレンダリング
   */
  private renderSlides(summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    const isDemo = this.statsService.isUsingMockData();
    const demoBadge = isDemo ? '<div class="demo-badge">DEMO DATA</div>' : '';

    // 期間タイプに応じたタイトル
    const periodType: import('../types').ReviewPeriodType = ('periodType' in summary && summary.periodType) ? summary.periodType : 'week';
    const isWeek = periodType === 'week';
    const isYear = periodType === 'year';
    const isMonth = periodType === 'month';

    // コーディングスタイルを取得
    // 月間: 最大4つ（1スライドにまとめて表示、通常スタイルのみ）
    // 年間: 上限なし（個別スライドで表示、マスター版・年間専用スタイルのみ）
    const codingStyles = ('codingStyles' in summary && summary.codingStyles) ? summary.codingStyles : [];
    const maxStyles = isYear ? Infinity : 4;
    const styleCount = Math.min(codingStyles.length, maxStyles);

    /*
     * スライド番号オフセットの計算
     * ※スライド追加時は getScripts() 内のコメント「スライド数の管理について」を参照
     */
    // 週間のみ「When You Code」スライドがあるため、週間以外はスライド番号を-1する
    const slideOffset = isWeek ? 0 : -1;
    // 月間・年間のみ「Coding Styles」スライドがあるため、その分を追加
    // 月間: 固定1（まとめ1枚のみ、導入なし）、年間: 動的（導入 + 個別スライド数）
    const styleSlideOffset = isWeek ? 0 :
      (styleCount > 0 ? (isYear ? 1 + styleCount : 1) : 0);
    // 月間・年間のみ「Calendar Heatmap」スライドがあるため、その分を+1する
    const calendarSlideOffset = isWeek ? 0 : 1;
    // 結果: 週間11、月間12（固定）、年間12〜17（動的）
    const titleText = this.getPeriodTitle(periodType, summary);
    const hintText = this.getPeriodHint(periodType);

    return `
      ${demoBadge}
      <button class="back-button" id="backToPeriodBtn">← 期間選択に戻る</button>
      <div class="slides-container">
        <!-- Slide 1: タイトル -->
        <div class="slide active" data-slide="1">
          <div class="slide-content title-slide">
            <div class="title-icon animate-bounce-in delay-1">${this.getPeriodEmoji(periodType)}</div>
            <h1 class="title-main animate-slide-left delay-2">${titleText.line1}</h1>
            <h1 class="title-main title-highlight animate-slide-right delay-3">${titleText.line2}</h1>
            <p class="title-date animate-fade-in delay-4">
              ${summary.weekStartDate} ~ ${summary.weekEndDate}
            </p>
            <div class="title-hint animate-fade-in delay-6">
              <span>${hintText}</span>
            </div>
          </div>
        </div>

        <!-- Slide 2: 総時間 -->
        <div class="slide" data-slide="2">
          <div class="slide-content">
            <div class="slide-header">
              <div class="slide-emoji animate-pop-in delay-1">⏱️</div>
              <h2 class="slide-title animate-fade-in delay-2">${periodType === 'year' ? '今年' : periodType === 'month' ? '今月' : '今週'}の総コーディング時間</h2>
            </div>
            <div class="big-number animate-bounce-in delay-3" data-scramble="${formatDuration(summary.totalCodingTimeMs)}">
              ${formatDuration(summary.totalCodingTimeMs)}
            </div>
            <div class="animate-fade-in delay-5">
              ${this.renderComparisonByPeriod(periodType, summary)}
            </div>
            <p class="slide-message animate-fade-in delay-6">
              ${this.getTotalTimeMessageByPeriod(periodType, summary)}
            </p>
          </div>
        </div>

        <!-- Slide 3: 期間別コーディング時間 -->
        <div class="slide" data-slide="3">
          <div class="slide-content">
            <div class="slide-header">
              <div class="slide-emoji animate-pop-in delay-1">📊</div>
              <h2 class="slide-title animate-fade-in delay-2">${this.getBreakdownTitle(periodType)}</h2>
            </div>
            <div class="daily-chart animate-fade-in delay-4">
              ${this.renderBreakdownChart(periodType, summary)}
            </div>
            <p class="slide-message animate-fade-in delay-5">
              ${this.getBreakdownMessage(periodType, summary)}
            </p>
          </div>
        </div>

        <!-- Slide 4: トッププロジェクト -->
        <div class="slide" data-slide="4">
          <div class="slide-content">
            <div class="slide-header">
              <div class="slide-emoji animate-pop-in delay-1">🚀</div>
              <h2 class="slide-title animate-fade-in delay-2">プロジェクトランキング</h2>
            </div>
            <div class="project-cards">
              ${summary.topProjects.map((p, i, arr) => {
                const reverseDelay = (arr.length - 1 - i) + 3;
                return `
                <div class="project-card animate-slide-${i % 2 === 0 ? 'left' : 'right'} delay-${reverseDelay}">
                  <span class="rank">#${i + 1}</span>
                  <span class="project-name">${this.escapeHtml(p.name)}</span>
                  <span class="project-time">${formatDuration(p.totalTimeMs)}</span>
                  <div class="progress-bar-container">
                    <div class="progress-bar" style="--target-width: ${p.percentage}%; width: 0;" data-animate-width="${p.percentage}"></div>
                  </div>
                </div>
              `}).join('')}
              ${summary.topProjects.length === 0 ? '<p class="subtitle animate-fade-in delay-3">データがありません</p>' : ''}
            </div>
            <p class="slide-message animate-fade-in delay-9">
              ${this.getProjectMessage(summary.topProjects.length, periodType)}
            </p>
          </div>
        </div>

        <!-- Slide 5: ファイルランキング -->
        <div class="slide" data-slide="5">
          <div class="slide-content">
            <div class="slide-header">
              <div class="slide-emoji animate-pop-in delay-1">📄</div>
              <h2 class="slide-title animate-fade-in delay-2">よく開いたファイル</h2>
            </div>
            <div class="file-list">
              ${summary.topFiles.map((f, i, arr) => {
                const reverseDelay = (arr.length - 1 - i) + 3;
                return `
                <div class="file-item animate-slide-left delay-${reverseDelay}">
                  <span class="file-rank">#${i + 1}</span>
                  <div class="file-info">
                    <span class="file-name">${this.escapeHtml(f.fileName)}</span>
                    <span class="file-project">${this.escapeHtml(f.projectName)}</span>
                  </div>
                  <span class="file-count">${f.accessCount} opens</span>
                </div>
              `}).join('')}
              ${summary.topFiles.length === 0 ? '<p class="subtitle animate-fade-in delay-3">データがありません</p>' : ''}
            </div>
            <p class="slide-message animate-fade-in delay-9">
              ${this.getFilesMessage(summary.topFiles.length)}
            </p>
          </div>
        </div>

        <!-- Slide 6: 言語 -->
        <div class="slide" data-slide="6">
          <div class="slide-content">
            <div class="slide-header">
              <div class="slide-emoji animate-pop-in delay-1">💬</div>
              <h2 class="slide-title animate-fade-in delay-2">使用した言語</h2>
            </div>
            <div class="language-bars">
              ${summary.topLanguages.map((l, i, arr) => {
                const reverseDelay = (arr.length - 1 - i) + 3;
                return `
                <div class="language-bar animate-slide-${i % 2 === 0 ? 'left' : 'right'} delay-${reverseDelay}">
                  <div class="language-icon" style="background: ${getLanguageColor(l.languageId)}">
                    ${l.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div class="language-info">
                    <div class="language-name">${l.displayName}</div>
                    <div class="language-bar-container">
                      <div class="language-bar-fill" style="--target-width: ${l.percentage}%; width: 0; background: ${getLanguageColor(l.languageId)}" data-animate-width="${l.percentage}"></div>
                    </div>
                  </div>
                  <span class="language-time">${formatDuration(l.totalTimeMs)}</span>
                </div>
              `}).join('')}
              ${summary.topLanguages.length === 0 ? '<p class="subtitle animate-fade-in delay-3">データがありません</p>' : ''}
            </div>
            <p class="slide-message animate-fade-in delay-9">
              ${this.getLanguageMessage(summary.topLanguages, periodType)}
            </p>
          </div>
        </div>

        ${isWeek ? `
        <!-- Slide 7: コーディングパターン（時間帯分布） - 週間のみ -->
        <div class="slide" data-slide="7">
          <div class="slide-content">
            <div class="slide-header">
              <div class="slide-emoji animate-pop-in delay-1">⏰</div>
              <h2 class="slide-title animate-fade-in delay-2">コーディングスタイル</h2>
            </div>
            <div class="pattern-grid pattern-grid-2 animate-fade-in delay-3">
              <div class="pattern-item">
                <span class="pattern-label">${this.getDistributionDesc(periodType)}</span>
                <span class="pattern-value">${this.getDistributionValue(periodType, summary)}</span>
              </div>
              <div class="pattern-item">
                <span class="pattern-label">${this.getMostActivePeriodDesc(periodType)}</span>
                <span class="pattern-value">${this.getMostActivePeriodValue(periodType, summary)}</span>
                ${this.getMostActivePeriodExtra(periodType, summary) ? `<span class="pattern-extra">${this.getMostActivePeriodExtra(periodType, summary)}</span>` : ''}
              </div>
            </div>
            <div class="animate-fade-in delay-5">
              ${this.renderDistributionChart(periodType, summary)}
            </div>
            <p class="slide-message animate-fade-in delay-7">
              ${this.getPatternMessage(summary.peakHour, periodType, summary)}
            </p>
          </div>
        </div>
        ` : ''}

        <!-- Slide ${8 + slideOffset}: 夜ふかしコーディング -->
        <div class="slide" data-slide="${8 + slideOffset}">
          <div class="slide-content">
            <div class="slide-header">
              <div class="slide-emoji night-owl-emoji animate-pop-in animate-float delay-1">🦉</div>
              <h2 class="slide-title animate-fade-in delay-2">夜ふかしコーディング</h2>
            </div>
            <div class="night-owl-stats animate-fade-in delay-3">
              <div class="night-owl-main">
                <span class="night-owl-percentage animate-night-glow" data-scramble="${Math.round(summary.nightOwlPercentage)}%">${Math.round(summary.nightOwlPercentage)}%</span>
                <span class="night-owl-label">夜ふかし率</span>
              </div>
              <div class="night-owl-time">
                <span class="night-owl-time-value">${formatDuration(summary.nightOwlTimeMs)}</span>
                <span class="night-owl-time-label">22:00〜4:00のコーディング時間</span>
              </div>
            </div>
            <p class="night-owl-message animate-fade-in delay-5">
              ${this.getNightOwlMessage(summary.nightOwlPercentage)}
            </p>
          </div>
        </div>

        <!-- Slide ${9 + slideOffset}: 記録 -->
        <div class="slide" data-slide="${9 + slideOffset}">
          <div class="slide-content">
            <div class="slide-header">
              <div class="slide-emoji animate-pop-in animate-celebrate delay-1">🏆</div>
              <h2 class="slide-title animate-fade-in delay-2">あなたの記録</h2>
            </div>
            <div class="pattern-grid animate-fade-in delay-3">
              ${this.renderRecordsContent(periodType, summary)}
            </div>
            <p class="slide-message animate-fade-in delay-5">
              ${this.getRecordsMessage(summary.streakDays, summary.longestSessionMs, periodType, summary)}
            </p>
          </div>
        </div>

        ${!isWeek ? `
        <!-- Slide ${10 + slideOffset}: カレンダーヒートマップ（月間・年間のみ） -->
        <div class="slide calendar-slide" data-slide="${10 + slideOffset}">
          <div class="slide-content">
            <div class="slide-header">
              <div class="slide-emoji animate-pop-in delay-1">📅</div>
              <h2 class="slide-title animate-fade-in delay-2">${periodType === 'year' ? '1年間のコーディング活動' : 'この月のコーディング活動'}</h2>
            </div>
            ${periodType === 'year'
              ? this.renderYearlyCalendarHeatmap(summary as YearlySummary)
              : this.renderMonthlyCalendarHeatmap(summary as MonthlySummary)
            }
            <p class="slide-message animate-fade-in delay-5">
              ${this.getCalendarHeatmapMessage(periodType, summary)}
            </p>
          </div>
        </div>
        ` : ''}

        ${isYear && styleCount > 0 ? `
        <!-- Slide ${11 + slideOffset}: コーディングスタイル導入（年間のみ、スタイルがある場合） -->
        <div class="slide coding-styles-intro-slide yearly" data-slide="${11 + slideOffset}">
          <!-- 背景エフェクト -->
          <div class="intro-bg-effects">
            <div class="golden-rays"></div>
            <div class="sparkle-field">
              ${Array.from({length: 30}, () => `
                <div class="bg-sparkle" style="
                  --x: ${Math.random() * 100}%;
                  --y: ${Math.random() * 100}%;
                  --size: ${2 + Math.random() * 4}px;
                  --delay: ${Math.random() * 3}s;
                "></div>
              `).join('')}
            </div>
          </div>

          <!-- 絵文字オービット -->
          <div class="floating-emojis-container">
            ${['🐢', '🏃', '⚡', '🦉', '🐓', '💼', '🎮', '🎯', '🎪', '🗺️', '🌍', '🔬', '🔥'].map((emoji, i) => `
              <div class="floating-emoji" style="
                --index: ${i};
                --total: 13;
                --delay: ${(i * 0.08).toFixed(2)}s;
                --pos-offset: ${(-6 + Math.random() * 12).toFixed(1)}%;
                --radius-scale: ${(0.88 + Math.random() * 0.24).toFixed(2)};
              ">${emoji}</div>
            `).join('')}
          </div>

          <!-- メインコンテンツ -->
          <div class="slide-content intro-centered">
            <div class="intro-reveal-container">
              <div class="year-crown">👑</div>
              <div class="intro-title-wrapper">
                <span class="intro-line line-1">あなたの</span>
                <span class="intro-line line-2">コーディングスタイルを</span>
                <span class="intro-line line-3">見てみましょう</span>
              </div>
              <div class="intro-pulse-ring"></div>
              <div class="intro-pulse-ring ring-2"></div>
            </div>
          </div>
        </div>

        ${isYear ? `
        <!-- 年間用: 個別スタイルスライド（マスター版・年間専用スタイル、上限なし） -->
        ${codingStyles.map((style, index) => `
        <div class="slide individual-style-slide${style.isMaster ? ' master-style' : ''}" data-slide="${12 + slideOffset + index}" style="--slide-index: ${index}">
          <!-- 背景レイヤー -->
          <div class="style-slide-bg">
            <div class="mesh-gradient"></div>
            <div class="noise-overlay"></div>
            <div class="geometric-shapes">
              <div class="geo-circle geo-1"></div>
              <div class="geo-circle geo-2"></div>
              <div class="geo-line geo-line-1"></div>
              <div class="geo-line geo-line-2"></div>
              <div class="geo-line geo-line-3"></div>
            </div>
            <div class="sparkle-burst">
              ${Array.from({length: 12}, (_, i) => `
                <div class="sparkle-particle" style="--angle: ${i * 30}deg; --delay: ${i * 0.05}s"></div>
              `).join('')}
            </div>
          </div>

          <!-- メインコンテンツ -->
          <div class="slide-content">
            <!-- 上部装飾ライン -->
            <div class="accent-line top-line"></div>

            <!-- アイコンエリア -->
            <div class="style-icon-stage">
              <div class="icon-backdrop"></div>
              <div class="icon-ring ring-outer"></div>
              <div class="icon-ring ring-inner"></div>
              <span class="style-emoji">${style.emoji}</span>
            </div>

            <!-- タイトルエリア -->
            <div class="style-title-area">
              ${style.isYearlyExclusive ? '<div class="style-badge yearly-exclusive-badge">✨ 年間限定</div>' : ''}
              ${style.isMaster ? '<div class="style-badge master-badge">🏆 マスター</div>' : ''}
              <h2 class="style-title">${style.title}</h2>
              <div class="title-underline"></div>
            </div>

            <!-- 説明カード -->
            <div class="style-card">
              <div class="card-glow"></div>
              <p class="style-description">${style.description}</p>
              <div class="style-stat">
                <span class="stat-value">${style.observation}</span>
              </div>
            </div>

            <!-- 下部装飾 -->
            <div class="accent-line bottom-line"></div>
          </div>
        </div>
        `).join('')}
        ` : ''}
        ` : ''}

        ${isMonth && styleCount > 0 ? `
        <!-- 月間用: コーディングスタイルまとめスライド（最大4つ） -->
        <div class="slide monthly-styles-slide" data-slide="${11 + slideOffset}">
          <div class="monthly-styles-bg">
            <div class="monthly-bg-gradient"></div>
            <div class="monthly-floating-shapes">
              ${Array.from({length: 6}, (_, i) => `
                <div class="floating-shape shape-${i + 1}" style="--delay: ${i * 0.3}s"></div>
              `).join('')}
            </div>
          </div>
          <div class="slide-content">
            <div class="slide-header">
              <div class="slide-emoji animate-pop-in delay-1">✨</div>
              <h2 class="slide-title animate-fade-in delay-2">あなたのコーディングスタイル</h2>
            </div>
            <div class="monthly-styles-grid">
              ${codingStyles.slice(0, 4).map((style, index) => `
                <div class="monthly-style-card animate-slide-up" style="--card-delay: ${0.3 + index * 0.15}s">
                  <div class="monthly-card-emoji">${style.emoji}</div>
                  <div class="monthly-card-content">
                    <h3 class="monthly-card-title">${style.title}</h3>
                    <p class="monthly-card-desc">${style.description}</p>
                    <span class="monthly-card-stat">${style.observation}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            <p class="slide-message animate-fade-in delay-6">
              どんなスタイルも、あなたの努力の証です。
            </p>
          </div>
        </div>
        ` : ''}

        <!-- Slide ${10 + slideOffset + styleSlideOffset + calendarSlideOffset}: 最終スライド -->
        <div class="slide final-slide-container" data-slide="${10 + slideOffset + styleSlideOffset + calendarSlideOffset}">
          ${periodType === 'year' ? `
          <!-- Sparkles for yearly celebration -->
          <div class="sparkles-container">
            ${Array.from({length: 25}, (_, i) => `
              <div class="sparkle" style="
                --x: ${Math.random() * 100}%;
                --y: ${Math.random() * 100}%;
                --delay: ${Math.random() * 2}s;
                --scale: ${0.5 + Math.random() * 1};
              "></div>
            `).join('')}
          </div>
          ` : ''}
          ${periodType === 'month' ? `
          <!-- Subtle particles for monthly -->
          <div class="monthly-particles-container">
            ${Array.from({length: 15}, (_, i) => `
              <div class="monthly-particle" style="
                --x: ${Math.random() * 100}%;
                --delay: ${Math.random() * 2}s;
                --duration: ${4 + Math.random() * 2}s;
              "></div>
            `).join('')}
          </div>
          ` : ''}
          <div class="slide-content final-slide">
            <div class="final-emojis">
              <div class="final-emoji animate-bounce-in delay-1">${periodType === 'year' ? '🎆' : '🎊'}</div>
              <div class="final-emoji animate-bounce-in delay-1">${periodType === 'year' ? '🥳' : '🎉'}</div>
              <div class="final-emoji animate-bounce-in delay-1">${periodType === 'year' ? '🎆' : '🎊'}</div>
            </div>
            <h1 class="final-title animate-scale-in delay-3 shimmer-text">${this.getFinalTitle(periodType)}</h1>
            <p class="final-subtitle animate-fade-in delay-4">${this.getFinalSubtitle(periodType)}</p>
            <div class="final-message animate-fade-in delay-5">
              ${this.getFinalMessage(summary)}
            </div>
          </div>
        </div>

        <!-- Slide ${11 + slideOffset + styleSlideOffset + calendarSlideOffset}: サマリー（画像エクスポート用） -->
        <div class="slide" data-slide="${11 + slideOffset + styleSlideOffset + calendarSlideOffset}">
          <div class="slide-content summary-slide">
            ${periodType === 'year' ? `
            <!-- Yearly summary sparkles -->
            <div class="summary-sparkle-container">
              ${Array.from({length: 20}, () => `
                <div class="summary-sparkle" style="
                  --x: ${Math.random() * 100}%;
                  --y: ${Math.random() * 100}%;
                  --delay: ${Math.random() * 3}s;
                  --scale: ${0.4 + Math.random() * 0.8};
                "></div>
              `).join('')}
            </div>
            ` : ''}
            ${periodType === 'month' ? `
            <!-- Monthly summary shimmer -->
            <div class="summary-shimmer-container">
              ${Array.from({length: 15}, () => `
                <div class="summary-shimmer" style="
                  --x: ${Math.random() * 100}%;
                  --y: ${Math.random() * 100}%;
                  --duration: ${3 + Math.random() * 2}s;
                  --delay: ${Math.random() * 2}s;
                "></div>
              `).join('')}
            </div>
            ` : ''}
            <div class="summary-card" id="summaryCard">
              <div class="summary-card-inner">
                <div class="summary-header">
                  <div class="summary-brand-row">
                    <span class="summary-brand">${periodType === 'year' ? `#codevoyage${new Date(summary.weekStartDate).getFullYear()}` : '#codevoyage'}</span>
                    <span class="summary-date">${this.formatDateRange(summary.weekStartDate, summary.weekEndDate)}</span>
                  </div>
                </div>
                <div class="summary-main">
                  <div class="summary-hero">
                    <span class="summary-hero-label">${this.getPeriodBadge(periodType)} CODING TIME</span>
                    <span class="summary-hero-value">${formatDuration(summary.totalCodingTimeMs)}</span>
                  </div>
                </div>
                <div class="summary-stats">
                  <div class="summary-stat">
                    <span class="stat-value">${periodType === 'year' ? (summary as YearlySummary).totalDaysActive : periodType === 'month' ? (summary as MonthlySummary).activeDaysCount : summary.dailyBreakdown.filter(d => d.totalTimeMs > 0).length}<span class="stat-unit">days</span></span>
                    <span class="stat-label">Days</span>
                  </div>
                  <div class="summary-stat">
                    <span class="stat-value">${formatDuration(summary.longestSessionMs)}</span>
                    <span class="stat-label">Longest Session</span>
                  </div>
                  <div class="summary-stat">
                    <span class="stat-value">${summary.topLanguages[0]?.displayName || '-'}</span>
                    <span class="stat-label">Top Language</span>
                  </div>
                  <div class="summary-stat">
                    <span class="stat-value">${this.formatLargeNumber(summary.totalCharactersEdited)}</span>
                    <span class="stat-label">Characters</span>
                  </div>
                </div>
                <div class="summary-footer">
                  <span class="summary-tagline">Your coding journey, visualized</span>
                </div>
              </div>
            </div>
            <div class="summary-actions animate-fade-in delay-3">
              <button class="summary-btn" id="downloadImage">
                <span class="btn-icon">📥</span>
                画像をダウンロード
              </button>
              <button class="summary-btn" id="copyImage">
                <span class="btn-icon">📋</span>
                画像をコピー
              </button>
            </div>
            <div class="back-to-selection-wrapper animate-fade-in delay-4">
              <button class="back-to-selection-btn" id="backToSelection">別の期間を振り返る</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pause Indicator -->
      <div class="pause-indicator" id="pauseIndicator">
        <div class="pause-indicator-icon">⏸️</div>
        <div>
          <div class="pause-indicator-text">一時停止中</div>
          <div class="pause-indicator-hint">スペースキーで再開</div>
        </div>
      </div>

      <!-- Story-style Progress Bar -->
      <!-- ※スライド追加時は getScripts() 内のコメント「スライド数の管理について」を参照 -->
      <div class="story-progress-wrapper">
        <div class="story-progress" id="storyProgress" data-total-slides="${isWeek ? 11 : (styleCount > 0 ? (isYear ? 12 + styleCount : 12) : 11)}" data-style-count="${styleCount}" data-is-year="${isYear}">
          ${Array.from({length: isWeek ? 11 : (styleCount > 0 ? (isYear ? 12 + styleCount : 12) : 11)}, (_, i) => i + 1).map(i => `
            <div class="story-bar" data-slide="${i}">
              <div class="story-bar-fill ${i === 1 ? 'active' : ''}"></div>
            </div>
          `).join('')}
        </div>
        <div class="pause-hint">スペースキーで一時停止</div>
      </div>

      <!-- Period navigation -->
      <div class="week-nav">
        <button class="week-nav-btn" id="prevPeriod">← ${this.getPrevPeriodLabel(periodType)}</button>
        <button class="week-nav-btn current-btn" id="currentPeriod">${periodType === 'week' ? '今週' : periodType === 'month' ? '今月' : '今年'}</button>
        <button class="week-nav-btn" id="nextPeriod" ${this.getCurrentOffset(periodType) >= 0 ? 'disabled' : ''}>${this.getNextPeriodLabel(periodType)} →</button>
      </div>
    `;
  }

  /**
   * 夜ふかしメッセージを取得
   */
  private getNightOwlMessage(percentage: number): string {
    if (percentage >= 40) {
      return '🦉 完全に夜型ですね！健康に気をつけて！';
    } else if (percentage >= 25) {
      return '🌙 夜更かし多めですね。たまには早めに休みましょう';
    } else if (percentage >= 10) {
      return '⭐ 時々夜更かしする程度。バランス良いですね';
    } else {
      return '☀️ 健康的な時間帯にコーディングしていますね！';
    }
  }

  /**
   * ブレイクダウンのタイトルを取得
   */
  private getBreakdownTitle(periodType: import('../types').ReviewPeriodType): string {
    switch (periodType) {
      case 'year':
        return '月ごとの推移';
      case 'month':
        return '週ごとの推移';
      default:
        return '日ごとの推移';
    }
  }

  /**
   * 期間に応じたブレイクダウンチャートをレンダリング
   */
  private renderBreakdownChart(periodType: import('../types').ReviewPeriodType, summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    switch (periodType) {
      case 'year':
        return this.renderMonthlyBreakdownAnimated(summary as YearlySummary);
      case 'month':
        return this.renderWeeklyBreakdownAnimated(summary as MonthlySummary);
      default:
        return this.renderDailyBreakdownAnimated(summary.dailyBreakdown);
    }
  }

  /**
   * 期間に応じたブレイクダウンメッセージを取得
   */
  private getBreakdownMessage(periodType: import('../types').ReviewPeriodType, summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    switch (periodType) {
      case 'year': {
        const yearlySummary = summary as YearlySummary;
        const bestMonth = yearlySummary.bestMonth;
        if (bestMonth) {
          return `🏆 ${bestMonth.monthName}が最も頑張った月！${bestMonth.activeDays}日間アクティブでした`;
        }
        return '✨ 1年間のコーディングジャーニーを振り返ろう';
      }
      case 'month': {
        const monthlySummary = summary as MonthlySummary;
        const bestWeek = monthlySummary.bestWeek;
        if (bestWeek && monthlySummary.weeklyBreakdown) {
          // 月内の週番号を計算（配列のインデックス+1）
          const weekInMonth = monthlySummary.weeklyBreakdown.findIndex(w => w.weekNumber === bestWeek.weekNumber) + 1;
          return `🏆 ${weekInMonth}週目が最も頑張った週でした！`;
        }
        return '✨ 今月のコーディングを振り返ろう';
      }
      default:
        return this.getDailyBreakdownMessage(summary.dailyBreakdown, summary.peakDay);
    }
  }

  /**
   * 日別コーディング時間のメッセージを取得
   */
  private getDailyBreakdownMessage(dailyBreakdown: import('../types').DailyStats[], peakDay: string): string {
    const activeDays = dailyBreakdown.filter(d => d.totalTimeMs > 0).length;
    const dayNames: Record<string, string> = {
      'Sunday': '日曜日',
      'Monday': '月曜日',
      'Tuesday': '火曜日',
      'Wednesday': '水曜日',
      'Thursday': '木曜日',
      'Friday': '金曜日',
      'Saturday': '土曜日'
    };
    const peakDayJa = dayNames[peakDay] || peakDay;

    if (activeDays === 7) {
      return `🔥 毎日コーディング！${peakDayJa}が最も頑張った日でした`;
    } else if (activeDays >= 5) {
      return `💪 ${activeDays}日間コーディング！${peakDayJa}が最も集中できた日`;
    } else if (activeDays >= 3) {
      return `✨ ${peakDayJa}を中心に${activeDays}日間コードを書きました`;
    } else if (activeDays >= 1) {
      return `🌱 ${activeDays}日間のコーディング。少しずつでも継続が大切！`;
    } else {
      return '💡 来週はコーディングの時間を作ってみましょう！';
    }
  }

  /**
   * カレンダーヒートマップのメッセージを取得
   */
  private getCalendarHeatmapMessage(periodType: import('../types').ReviewPeriodType, summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    switch (periodType) {
      case 'year': {
        const yearlySummary = summary as YearlySummary;
        const activeDays = yearlySummary.totalDaysActive || 0;
        const bestMonth = yearlySummary.bestMonth;
        if (bestMonth && activeDays > 0) {
          return `🗓️ ${activeDays}日間コーディング！${bestMonth.monthName}が最も活発な月でした`;
        }
        return `🗓️ ${activeDays}日間、コードと向き合いました`;
      }
      case 'month': {
        const monthlySummary = summary as MonthlySummary;
        const activeDays = monthlySummary.activeDaysCount || 0;
        const bestDay = monthlySummary.bestDay;
        if (bestDay && activeDays > 0) {
          const bestDate = new Date(bestDay.date);
          const day = bestDate.getDate();
          return `📅 ${activeDays}日間コーディング！${day}日が最も集中した日`;
        }
        return `📅 ${activeDays}日間、コードを書きました`;
      }
      default:
        return '📅 コーディング活動の記録';
    }
  }

  /**
   * 期間に応じた比較表示をレンダリング
   */
  private renderComparisonByPeriod(periodType: import('../types').ReviewPeriodType, summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    switch (periodType) {
      case 'year': {
        const yearlySummary = summary as YearlySummary;
        return this.renderComparison(yearlySummary.comparisonToPreviousYear || 0, summary.totalCodingTimeMs, '昨年');
      }
      case 'month': {
        const monthlySummary = summary as MonthlySummary;
        return this.renderComparison(monthlySummary.comparisonToPreviousMonth || 0, summary.totalCodingTimeMs, '先月');
      }
      default:
        return this.renderComparison(summary.comparisonToPreviousWeek, summary.totalCodingTimeMs, '先週');
    }
  }

  /**
   * 期間に応じた総時間メッセージを取得
   */
  private getTotalTimeMessageByPeriod(periodType: import('../types').ReviewPeriodType, summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    switch (periodType) {
      case 'year': {
        const yearlySummary = summary as YearlySummary;
        return this.getTotalTimeMessage(summary.totalCodingTimeMs, yearlySummary.comparisonToPreviousYear || 0, 'year');
      }
      case 'month': {
        const monthlySummary = summary as MonthlySummary;
        return this.getTotalTimeMessage(summary.totalCodingTimeMs, monthlySummary.comparisonToPreviousMonth || 0, 'month');
      }
      default:
        return this.getTotalTimeMessage(summary.totalCodingTimeMs, summary.comparisonToPreviousWeek, 'week');
    }
  }

  /**
   * 総時間メッセージを取得
   */
  private getTotalTimeMessage(totalMs: number, comparisonPercentage: number = 0, periodType: import('../types').ReviewPeriodType = 'week'): string {
    const hours = totalMs / (1000 * 60 * 60);
    const minutes = totalMs / (1000 * 60);
    const isIncreased = comparisonPercentage > 0;

    // 期間ラベル
    const prevLabel = periodType === 'year' ? '昨年' : periodType === 'month' ? '先月' : '先週';
    const periodLabel = periodType === 'year' ? '今年' : periodType === 'month' ? '今月' : '今週';

    // 前期間比で増加している場合は特別なメッセージ
    if (isIncreased && comparisonPercentage >= 50) {
      return `🚀 ${prevLabel}から大幅アップ！成長が止まらない！`;
    } else if (isIncreased && comparisonPercentage >= 20) {
      return `📈 ${prevLabel}よりしっかり時間を取れましたね！素晴らしい！`;
    } else if (isIncreased) {
      return `⬆️ ${prevLabel}より増えてます！その調子！`;
    }

    // 年間用メッセージ
    if (periodType === 'year') {
      if (hours >= 1500) {
        return '🏆 年間1500時間超え！プロフェッショナルの証！';
      } else if (hours >= 1000) {
        return '🔥 年間1000時間達成！情熱的な1年でした！';
      } else if (hours >= 500) {
        return '💪 500時間以上！着実にスキルアップした1年！';
      } else if (hours >= 200) {
        return '✨ コツコツ積み重ねた1年。来年も頑張ろう！';
      } else {
        return '🌱 来年はもっとコードを書く時間を作ろう！';
      }
    }

    // 月間用メッセージ
    if (periodType === 'month') {
      if (hours >= 160) {
        return '🔥 フルタイム以上！情熱がすごい月でした！';
      } else if (hours >= 100) {
        return '💪 100時間超え！充実した月でしたね！';
      } else if (hours >= 50) {
        return '👍 安定したペースで開発できました！';
      } else if (hours >= 20) {
        return '✨ 着実に進歩しています。この調子で！';
      } else {
        return `🌟 コツコツ積み重ねが大事。${periodLabel}もお疲れさま！`;
      }
    }

    // 週間用メッセージ（デフォルト）
    if (hours >= 40) {
      return '🔥 フルタイム以上！情熱がすごい！';
    } else if (hours >= 30) {
      return '💪 しっかりコードと向き合った一週間でしたね';
    } else if (hours >= 20) {
      return '👍 安定したペースで開発を進められています';
    } else if (hours >= 10) {
      return '✨ 着実に進歩しています。この調子で！';
    } else if (hours >= 5) {
      return `🌟 コツコツ積み重ねが大事。${periodLabel}もお疲れさま！`;
    } else if (hours >= 1) {
      return '👏 忙しい中でも時間を作れたこと、それ自体がすごい！';
    } else if (minutes >= 10) {
      return '🎯 少しでもコードに触れた、その一歩が大切です！';
    } else {
      return '💡 また来週、一緒にコードを書きましょう！';
    }
  }

  /**
   * プロジェクトメッセージを取得
   */
  private getProjectMessage(projectCount: number, periodType: import('../types').ReviewPeriodType = 'week'): string {
    const periodLabel = periodType === 'year' ? '1年' : periodType === 'month' ? '1ヶ月' : '1週間';
    if (projectCount >= 5) {
      return '🎯 マルチタスクの達人！複数プロジェクトを並行してますね';
    } else if (projectCount >= 3) {
      return '📚 バランス良く複数のプロジェクトに取り組んでいます';
    } else if (projectCount >= 2) {
      return '🎪 複数プロジェクトを上手く切り替えていますね';
    } else {
      return `🎯 1つのプロジェクトに集中できた${periodLabel}でした`;
    }
  }

  /**
   * 言語メッセージを取得
   */
  private getLanguageMessage(languages: import('../types').LanguageStat[], periodType: import('../types').ReviewPeriodType = 'week'): string {
    if (languages.length === 0) return '';
    const topLang = languages[0].displayName;
    const periodLabel = periodType === 'year' ? '1年' : periodType === 'month' ? '1ヶ月' : '今週';
    if (languages.length >= 5) {
      return '🌍 ポリグロットプログラマー！多言語を操っていますね';
    } else if (languages.length >= 3) {
      return `💡 ${topLang}をメインに、幅広く活躍中`;
    } else {
      return `🎯 ${topLang}に集中した${periodLabel}でしたね`;
    }
  }

  /**
   * パターンメッセージを取得（期間別）
   */
  private getPatternMessage(peakHour: number, periodType: import('../types').ReviewPeriodType = 'week', summary?: WeeklySummary | MonthlySummary | YearlySummary): string {
    // 時間帯のメッセージ
    let timeMessage = '';
    if (peakHour >= 5 && peakHour < 9) {
      timeMessage = '🌅 朝型プログラマー！静かな時間に集中できていますね';
    } else if (peakHour >= 9 && peakHour < 12) {
      timeMessage = '☀️ 午前中が最も生産的な時間帯のようです';
    } else if (peakHour >= 12 && peakHour < 14) {
      timeMessage = '🍽️ ランチタイムもコーディング！熱心ですね';
    } else if (peakHour >= 14 && peakHour < 18) {
      timeMessage = '🏢 午後の集中タイムを上手く活用していますね';
    } else if (peakHour >= 18 && peakHour < 22) {
      timeMessage = '🌆 夕方から夜にかけてエンジン全開ですね';
    } else {
      timeMessage = '🌙 深夜の静けさの中で集中していますね';
    }

    // 期間別の追加メッセージ
    if (periodType === 'year' && summary) {
      const yearlySummary = summary as YearlySummary;
      if (yearlySummary.bestMonth) {
        return `📅 ${yearlySummary.bestMonth.monthName}が最も熱中した月でした。${timeMessage}`;
      }
    } else if (periodType === 'month' && summary) {
      const monthlySummary = summary as MonthlySummary;
      if (monthlySummary.bestWeek && monthlySummary.weeklyBreakdown) {
        const weekInMonth = monthlySummary.weeklyBreakdown.findIndex(w => w.weekNumber === monthlySummary.bestWeek!.weekNumber) + 1;
        return `📅 ${weekInMonth}週目が最も集中した週でした。${timeMessage}`;
      }
    }

    return timeMessage;
  }

  /**
   * 分布表示の値を取得（期間に応じて変更）
   */
  private getDistributionValue(periodType: import('../types').ReviewPeriodType, summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    switch (periodType) {
      case 'year': {
        const yearlySummary = summary as YearlySummary;
        if (yearlySummary.monthlyBreakdown && yearlySummary.monthlyBreakdown.length > 0) {
          const peakMonth = yearlySummary.monthlyBreakdown.reduce((best, m) =>
            m.totalTimeMs > best.totalTimeMs ? m : best
          );
          return peakMonth.monthName.substring(0, 3);
        }
        return '-';
      }
      case 'month': {
        const monthlySummary = summary as MonthlySummary;
        if (monthlySummary.weeklyBreakdown && monthlySummary.weeklyBreakdown.length > 0) {
          let peakIndex = 0;
          let maxTime = 0;
          monthlySummary.weeklyBreakdown.forEach((w, i) => {
            if (w.totalTimeMs > maxTime) {
              maxTime = w.totalTimeMs;
              peakIndex = i;
            }
          });
          return `${peakIndex + 1}週目`;
        }
        return '-';
      }
      default:
        return formatHour(summary.peakHour);
    }
  }

  /**
   * 分布表示の説明を取得（期間に応じて変更）
   */
  private getDistributionDesc(periodType: import('../types').ReviewPeriodType): string {
    switch (periodType) {
      case 'year':
        return '最もコードを書いた月';
      case 'month':
        return '最もコードを書いた週';
      default:
        return '最もコードを書いた時間帯';
    }
  }

  /**
   * 期間に応じた分布チャートをレンダリング
   */
  private renderDistributionChart(periodType: import('../types').ReviewPeriodType, summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    switch (periodType) {
      case 'year': {
        const yearlySummary = summary as YearlySummary;
        return this.renderMonthlyDistributionChart(yearlySummary.monthlyBreakdown || []);
      }
      case 'month': {
        const monthlySummary = summary as MonthlySummary;
        return this.renderWeeklyDistributionChart(monthlySummary.weeklyBreakdown || []);
      }
      default:
        return this.renderHeatmapAnimated(summary.hourlyDistribution);
    }
  }

  /**
   * 月別分布チャートをレンダリング（年間用） - ヒートマップスタイル
   */
  private renderMonthlyDistributionChart(monthlyBreakdown: import('../types').MonthBreakdown[]): string {
    if (monthlyBreakdown.length === 0) {
      return '<p class="subtitle">データがありません</p>';
    }

    const maxTime = Math.max(...monthlyBreakdown.map(m => m.totalTimeMs), 1);
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // 12ヶ月分のセルを生成（月がない場合は0として扱う）
    const cells = Array.from({ length: 12 }, (_, i) => {
      const month = monthlyBreakdown.find(m => m.month === i + 1);
      const time = month?.totalTimeMs || 0;
      const level = time === 0 ? 0 : Math.ceil((time / maxTime) * 5);
      const delayClass = `delay-${Math.floor(i / 2) + 1}`;
      return `<div class="heatmap-cell level-${level} animate-scale-in ${delayClass}" title="${monthLabels[i]}: ${formatDuration(time)}"></div>`;
    }).join('');

    return `
      <div class="heatmap monthly-heatmap">
        ${cells}
      </div>
      <div class="heatmap-labels animate-fade-in delay-7">
        <span>Jan</span>
        <span>Apr</span>
        <span>Jul</span>
        <span>Oct</span>
        <span>Dec</span>
      </div>
    `;
  }

  /**
   * 週別分布チャートをレンダリング（月間用） - ヒートマップスタイル
   */
  private renderWeeklyDistributionChart(weeklyBreakdown: import('../types').WeekBreakdown[]): string {
    if (weeklyBreakdown.length === 0) {
      return '<p class="subtitle">データがありません</p>';
    }

    const maxTime = Math.max(...weeklyBreakdown.map(w => w.totalTimeMs), 1);
    const weekCount = weeklyBreakdown.length;

    const cells = weeklyBreakdown.map((week, i) => {
      const time = week.totalTimeMs;
      const level = time === 0 ? 0 : Math.ceil((time / maxTime) * 5);
      const delayClass = `delay-${i + 1}`;
      const weekInMonth = i + 1;
      return `<div class="heatmap-cell level-${level} animate-scale-in ${delayClass}" title="${weekInMonth}週目: ${formatDuration(time)}"></div>`;
    }).join('');

    // ラベルを生成（週数に応じて）
    const labels = weeklyBreakdown.map((_, i) => `${i + 1}週`);

    return `
      <div class="heatmap weekly-heatmap" style="--cell-count: ${weekCount}">
        ${cells}
      </div>
      <div class="heatmap-labels animate-fade-in delay-7">
        ${labels.map(l => `<span>${l}</span>`).join('')}
      </div>
    `;
  }

  /**
   * 期間別の「最もアクティブな期間単位」の値を取得
   */
  private getMostActivePeriodValue(periodType: import('../types').ReviewPeriodType, summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    switch (periodType) {
      case 'year': {
        const yearlySummary = summary as YearlySummary;
        if (yearlySummary.bestMonth) {
          return yearlySummary.bestMonth.monthName;
        }
        return '-';
      }
      case 'month': {
        const monthlySummary = summary as MonthlySummary;
        if (monthlySummary.bestWeek && monthlySummary.weeklyBreakdown) {
          const weekInMonth = monthlySummary.weeklyBreakdown.findIndex(w => w.weekNumber === monthlySummary.bestWeek!.weekNumber) + 1;
          return `${weekInMonth}週目`;
        }
        return '-';
      }
      default: {
        const dayNames: Record<string, string> = {
          'Sunday': '日曜日',
          'Monday': '月曜日',
          'Tuesday': '火曜日',
          'Wednesday': '水曜日',
          'Thursday': '木曜日',
          'Friday': '金曜日',
          'Saturday': '土曜日'
        };
        return dayNames[summary.peakDay] || summary.peakDay || '-';
      }
    }
  }

  /**
   * 期間別の「最もアクティブな期間単位」の説明を取得
   */
  private getMostActivePeriodDesc(periodType: import('../types').ReviewPeriodType): string {
    switch (periodType) {
      case 'year':
        return '最もコードを書いた月';
      case 'month':
        return '最もコードを書いた週';
      default:
        return '最もコードを書いた曜日';
    }
  }

  /**
   * 期間別の「最もアクティブな期間単位」の追加情報を取得
   */
  private getMostActivePeriodExtra(periodType: import('../types').ReviewPeriodType, summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    switch (periodType) {
      case 'year': {
        const yearlySummary = summary as YearlySummary;
        if (yearlySummary.bestMonth) {
          return formatDuration(yearlySummary.bestMonth.totalTimeMs);
        }
        return '';
      }
      case 'month': {
        const monthlySummary = summary as MonthlySummary;
        if (monthlySummary.bestWeek) {
          return formatDuration(monthlySummary.bestWeek.totalTimeMs);
        }
        return '';
      }
      default:
        return '';
    }
  }

  /**
   * 記録コンテンツをレンダリング（期間別）
   */
  private renderRecordsContent(periodType: import('../types').ReviewPeriodType, summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    if (periodType === 'year') {
      const yearlySummary = summary as YearlySummary;
      return `
        <div class="pattern-item">
          <span class="pattern-label">コードを書いた日数</span>
          <span class="pattern-value" data-scramble="${yearlySummary.totalDaysActive} days">${yearlySummary.totalDaysActive} days</span>
        </div>
        <div class="pattern-item">
          <span class="pattern-label">連続でコードを書いた最大日数</span>
          <span class="pattern-value" data-scramble="${yearlySummary.longestStreakInYear} days">${yearlySummary.longestStreakInYear} days</span>
        </div>
        <div class="pattern-item">
          <span class="pattern-label">推定コード行数</span>
          <span class="pattern-value" data-scramble="${this.formatNumber(yearlySummary.totalLinesEstimate)}">${this.formatNumber(yearlySummary.totalLinesEstimate)}</span>
        </div>
      `;
    } else if (periodType === 'month') {
      const monthlySummary = summary as MonthlySummary;
      return `
        <div class="pattern-item">
          <span class="pattern-label">コードを書いた日数</span>
          <span class="pattern-value" data-scramble="${monthlySummary.activeDaysCount} days">${monthlySummary.activeDaysCount} days</span>
        </div>
        <div class="pattern-item">
          <span class="pattern-label">最長連続コーディング時間</span>
          <span class="pattern-value" data-scramble="${formatDuration(summary.longestSessionMs)}">${formatDuration(summary.longestSessionMs)}</span>
        </div>
        <div class="pattern-item">
          <span class="pattern-label">編集した文字数</span>
          <span class="pattern-value" data-scramble="${this.formatNumber(summary.totalCharactersEdited)}">${this.formatNumber(summary.totalCharactersEdited)}</span>
        </div>
      `;
    } else {
      // 週間
      return `
        <div class="pattern-item">
          <span class="pattern-label">最長コーディング</span>
          <span class="pattern-value" data-scramble="${formatDuration(summary.longestSessionMs)}">${formatDuration(summary.longestSessionMs)}</span>
        </div>
        <div class="pattern-item">
          <span class="pattern-label">連続コーディング</span>
          <span class="pattern-value" data-scramble="${summary.streakDays} days">${summary.streakDays} days</span>
        </div>
        <div class="pattern-item">
          <span class="pattern-label">編集した文字数</span>
          <span class="pattern-value" data-scramble="${this.formatNumber(summary.totalCharactersEdited)}">${this.formatNumber(summary.totalCharactersEdited)}</span>
        </div>
      `;
    }
  }

  /**
   * 月間カレンダーヒートマップをレンダリング
   */
  private renderMonthlyCalendarHeatmap(summary: MonthlySummary): string {
    const dailyData = new Map<string, number>();
    let maxTime = 0;

    // 日別データを集計し最大値を取得
    for (const day of summary.dailyBreakdown) {
      dailyData.set(day.date, day.totalTimeMs);
      if (day.totalTimeMs > maxTime) {
        maxTime = day.totalTimeMs;
      }
    }

    // 月の開始日と終了日を取得
    const startDate = new Date(summary.weekStartDate);
    const endDate = new Date(summary.weekEndDate);
    const year = startDate.getFullYear();
    const month = startDate.getMonth();

    // 月の1日目の曜日を取得（0=日曜）
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // 月の最終日を取得
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    // カレンダーグリッドを生成
    let calendarHtml = '';

    // 空のセルを追加（月初めの曜日調整）
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarHtml += '<div class="calendar-day empty"></div>';
    }

    // 各日のセルを追加
    const today = new Date().toISOString().split('T')[0];
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const timeMs = dailyData.get(dateStr) || 0;
      const level = this.getHeatmapLevel(timeMs, maxTime);
      const isToday = dateStr === today;
      const hours = Math.round(timeMs / (1000 * 60 * 60) * 10) / 10;
      const tooltip = hours > 0 ? `${hours}h` : '';

      calendarHtml += `<div class="calendar-day level-${level}${isToday ? ' today' : ''}" title="${dateStr}: ${tooltip}">${day}</div>`;
    }

    return `
      <div class="calendar-heatmap-container animate-fade-in delay-3">
        <div class="calendar-month-title">${summary.monthName}</div>
        <div class="calendar-weekdays">
          <div class="calendar-weekday">Sun</div>
          <div class="calendar-weekday">Mon</div>
          <div class="calendar-weekday">Tue</div>
          <div class="calendar-weekday">Wed</div>
          <div class="calendar-weekday">Thu</div>
          <div class="calendar-weekday">Fri</div>
          <div class="calendar-weekday">Sat</div>
        </div>
        <div class="calendar-grid">
          ${calendarHtml}
        </div>
        <div class="calendar-legend">
          <span class="legend-label">Less</span>
          <div class="legend-squares">
            <div class="legend-square level-0" style="background: #3d4451;"></div>
            <div class="legend-square level-1" style="background: #4ade80;"></div>
            <div class="legend-square level-2" style="background: #39d353;"></div>
            <div class="legend-square level-3" style="background: #26a641;"></div>
            <div class="legend-square level-4" style="background: #006d32;"></div>
            <div class="legend-square level-5" style="background: #0e4429;"></div>
          </div>
          <span class="legend-label">More</span>
        </div>
      </div>
    `;
  }

  /**
   * 年間カレンダーヒートマップをレンダリング（12ヶ月のミニカレンダー）
   */
  private renderYearlyCalendarHeatmap(summary: YearlySummary): string {
    const dailyData = new Map<string, number>();
    let maxTime = 0;

    // 日別データを集計し最大値を取得
    for (const day of summary.dailyBreakdown) {
      dailyData.set(day.date, day.totalTimeMs);
      if (day.totalTimeMs > maxTime) {
        maxTime = day.totalTimeMs;
      }
    }

    const year = summary.year;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let calendarsHtml = '';

    // 12ヶ月分のミニカレンダーを生成
    for (let month = 0; month < 12; month++) {
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

      let monthCalendarHtml = '';

      // 空のセルを追加
      for (let i = 0; i < firstDayOfMonth; i++) {
        monthCalendarHtml += '<div class="calendar-day empty"></div>';
      }

      // 各日のセルを追加
      for (let day = 1; day <= lastDayOfMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const timeMs = dailyData.get(dateStr) || 0;
        const level = this.getHeatmapLevel(timeMs, maxTime);
        const hours = Math.round(timeMs / (1000 * 60 * 60) * 10) / 10;
        const tooltip = hours > 0 ? `${hours}h` : '';

        monthCalendarHtml += `<div class="calendar-day level-${level}" title="${dateStr}: ${tooltip}"></div>`;
      }

      calendarsHtml += `
        <div class="mini-calendar" style="--index: ${month}">
          <div class="mini-calendar-title">${monthNames[month]}</div>
          <div class="calendar-grid">
            ${monthCalendarHtml}
          </div>
        </div>
      `;
    }

    return `
      <div class="yearly-calendar-grid animate-fade-in delay-3">
        ${calendarsHtml}
      </div>
      <div class="calendar-legend animate-fade-in delay-5" style="justify-content: center; margin-top: 1.5rem;">
        <span class="legend-label">Less</span>
        <div class="legend-squares">
          <div class="legend-square" style="background: #3d4451;"></div>
          <div class="legend-square" style="background: #4ade80;"></div>
          <div class="legend-square" style="background: #39d353;"></div>
          <div class="legend-square" style="background: #26a641;"></div>
          <div class="legend-square" style="background: #006d32;"></div>
          <div class="legend-square" style="background: #0e4429;"></div>
        </div>
        <span class="legend-label">More</span>
      </div>
    `;
  }

  /**
   * ヒートマップのレベル（0-5）を計算
   */
  private getHeatmapLevel(timeMs: number, maxTime: number): number {
    if (timeMs === 0) return 0;
    if (maxTime === 0) return 0;

    const ratio = timeMs / maxTime;
    if (ratio < 0.1) return 1;
    if (ratio < 0.25) return 2;
    if (ratio < 0.5) return 3;
    if (ratio < 0.75) return 4;
    return 5;
  }

  /**
   * 記録メッセージを取得（期間別）
   */
  private getRecordsMessage(streakDays: number, longestSessionMs: number, periodType: import('../types').ReviewPeriodType = 'week', summary?: WeeklySummary | MonthlySummary | YearlySummary): string {
    const sessionHours = longestSessionMs / (1000 * 60 * 60);

    if (periodType === 'year' && summary) {
      const yearlySummary = summary as YearlySummary;
      if (yearlySummary.totalDaysActive >= 300) {
        return '🔥 年間300日以上コーディング！驚異的な継続力です';
      } else if (yearlySummary.totalDaysActive >= 200) {
        return '💪 年間200日以上アクティブ！素晴らしい1年でした';
      } else if (yearlySummary.longestStreakInYear >= 30) {
        return `🏆 ${yearlySummary.longestStreakInYear}日連続の記録は立派です！`;
      } else {
        return '🌟 1年間お疲れさまでした。来年も頑張りましょう！';
      }
    } else if (periodType === 'month' && summary) {
      const monthlySummary = summary as MonthlySummary;
      if (monthlySummary.activeDaysCount >= 25) {
        return '🔥 ほぼ毎日コーディング！素晴らしい継続力です';
      } else if (monthlySummary.activeDaysCount >= 20) {
        return '💪 月の大半をコーディングに費やしましたね';
      } else if (sessionHours >= 4) {
        return '🎯 長時間集中できるのは才能です。深い没入を楽しんで！';
      } else {
        return '🌟 今月もお疲れさまでした。来月も頑張りましょう！';
      }
    }

    // 週間用
    if (streakDays >= 7) {
      return '🔥 毎日コードを書いている！素晴らしい継続力です';
    } else if (streakDays >= 5) {
      return '💪 平日は毎日コーディング！良いリズムですね';
    } else if (sessionHours >= 4) {
      return '🎯 長時間集中できるのは才能です。深い没入を楽しんで！';
    } else if (sessionHours >= 2) {
      return '⚡ 適度な集中時間を維持できていますね';
    } else {
      return '🌟 コツコツと積み重ねることが大切です';
    }
  }

  /**
   * ファイルメッセージを取得
   */
  private getFilesMessage(fileCount: number): string {
    if (fileCount >= 5) {
      return '📂 多くのファイルを行き来して作業しましたね';
    } else if (fileCount >= 3) {
      return '📝 いくつかのファイルに集中して作業しました';
    } else if (fileCount >= 1) {
      return '🎯 少数のファイルに集中して取り組みました';
    } else {
      return '📄 ファイルアクセスデータがありません';
    }
  }

  /**
   * 最終メッセージを取得
   */
  private getFinalMessage(summary: WeeklySummary | MonthlySummary | YearlySummary): string {
    const hours = summary.totalCodingTimeMs / (1000 * 60 * 60);
    const messages = [];
    const periodType = (summary as MonthlySummary | YearlySummary).periodType || 'week';

    if (periodType === 'year') {
      if (hours >= 500) {
        messages.push(`今年は${Math.round(hours)}時間もコードと向き合いました！`);
      } else {
        messages.push(`今年は${Math.round(hours)}時間のコーディング、お疲れさまでした。`);
      }
      const yearlySummary = summary as YearlySummary;
      if (yearlySummary.totalDaysActive >= 200) {
        messages.push(`${yearlySummary.totalDaysActive}日もアクティブに活動した1年でした！`);
      }
      messages.push('来年も素敵なコーディングライフを！🎆');
    } else if (periodType === 'month') {
      if (hours >= 80) {
        messages.push(`今月は${Math.round(hours)}時間もコードと向き合いました！`);
      } else {
        messages.push(`今月も${Math.round(hours)}時間のコーディング、お疲れさまでした。`);
      }
      if (summary.streakDays >= 10) {
        messages.push(`${summary.streakDays}日連続でコードを書いた継続力は素晴らしいです！`);
      }
      messages.push('来月も素敵なコーディングライフを！');
    } else {
      if (hours >= 20) {
        messages.push(`今週は${Math.round(hours)}時間もコードと向き合いました。`);
      } else {
        messages.push(`今週も${Math.round(hours)}時間のコーディング、お疲れさまでした。`);
      }
      if (summary.streakDays >= 5) {
        messages.push(`${summary.streakDays}日連続でコードを書いた継続力は素晴らしいです！`);
      }
      messages.push('来週も素敵なコーディングライフを！');
    }

    if (summary.topLanguages.length > 0) {
      messages.splice(messages.length - 1, 0, `${summary.topLanguages[0].displayName}を中心に、着実にスキルを磨いています。`);
    }

    return messages.join('<br>');
  }

  /**
   * 比較をレンダリング
   */
  private renderComparison(percentage: number, currentTotalMs: number, label: string = '先週'): string {
    if (percentage === 0) return '';

    const isPositive = percentage > 0;
    const sign = isPositive ? '+' : '';
    const cssClass = isPositive ? 'positive' : 'negative';

    // 前期間の時間を計算: current = previous * (1 + percentage/100)
    // previous = current / (1 + percentage/100)
    const previousTotalMs = currentTotalMs / (1 + percentage / 100);
    const timeDiffMs = currentTotalMs - previousTotalMs;
    const timeDiffFormatted = formatDuration(Math.abs(timeDiffMs));

    return `
      <div class="comparison ${cssClass} animate-fade-in delay-4">
        ${label}比 ${sign}${Math.round(percentage)}%（${sign}${timeDiffFormatted}）
      </div>
    `;
  }

  /**
   * ヒートマップをレンダリング
   */
  private renderHeatmap(hourlyDistribution: number[]): string {
    const maxTime = Math.max(...hourlyDistribution, 1);

    const cells = hourlyDistribution.map((time, hour) => {
      const level = time === 0 ? 0 : Math.ceil((time / maxTime) * 5);
      return `<div class="heatmap-cell level-${level}" title="${formatHour(hour)}: ${formatDuration(time)}"></div>`;
    }).join('');

    return `
      <div class="heatmap animate-fade-in delay-4">
        ${cells}
      </div>
      <div class="heatmap-labels">
        <span>0時</span>
        <span>6時</span>
        <span>12時</span>
        <span>18時</span>
        <span>23時</span>
      </div>
    `;
  }

  /**
   * 日別コーディング時間をレンダリング
   */
  private renderDailyBreakdown(dailyStats: import('../types').DailyStats[]): string {
    if (dailyStats.length === 0) {
      return '<p class="subtitle">データがありません</p>';
    }

    const maxTime = Math.max(...dailyStats.map(d => d.totalTimeMs), 1);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    return `
      <div class="daily-bars">
        ${dailyStats.map((day, i) => {
          const date = new Date(day.date);
          const dayName = dayNames[date.getDay()];
          const dayNum = date.getDate();
          const heightPercent = (day.totalTimeMs / maxTime) * 100;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return `
            <div class="daily-bar-item animate-fade-in delay-${i + 1}">
              <div class="daily-bar-wrapper">
                <div class="daily-bar ${isWeekend ? 'weekend' : ''}" style="height: ${Math.max(heightPercent, 5)}%">
                  <span class="daily-bar-time">${formatDuration(day.totalTimeMs)}</span>
                </div>
              </div>
              <div class="daily-bar-label">
                <span class="day-name">${dayName}</span>
                <span class="day-num">${dayNum}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * 日別コーディング時間をアニメーション付きでレンダリング
   */
  private renderDailyBreakdownAnimated(dailyStats: import('../types').DailyStats[]): string {
    if (dailyStats.length === 0) {
      return '<p class="subtitle animate-fade-in delay-3">データがありません</p>';
    }

    const maxTime = Math.max(...dailyStats.map(d => d.totalTimeMs), 1);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    // データがある項目のみにアニメーション遅延を割り当て
    let dataItemCount = 0;

    return `
      <div class="daily-bars">
        ${dailyStats.map((day, i) => {
          const date = new Date(day.date);
          const dayName = dayNames[date.getDay()];
          const dayNum = date.getDate();
          const heightPercent = (day.totalTimeMs / maxTime) * 100;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const hasData = day.totalTimeMs > 0;

          // データがある場合のみ遅延を増加
          const delayIndex = hasData ? (dataItemCount++ + 4) : 3;

          return `
            <div class="daily-bar-item animate-fade-in delay-${hasData ? delayIndex : 3}">
              <div class="daily-bar-wrapper">
                ${hasData ? `
                  <div class="daily-bar ${isWeekend ? 'weekend' : ''} animate-bar-grow delay-${delayIndex + 1}" style="height: ${Math.max(heightPercent, 5)}%">
                    <span class="daily-bar-time animate-fade-in delay-${delayIndex + 2}">${formatDuration(day.totalTimeMs)}</span>
                  </div>
                ` : ''}
              </div>
              <div class="daily-bar-label animate-fade-in delay-${hasData ? delayIndex : 3}">
                <span class="day-name">${dayName}</span>
                <span class="day-num">${dayNum}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * 週別コーディング時間をレンダリング（月間レビュー用）
   */
  private renderWeeklyBreakdownAnimated(summary: import('../types').MonthlySummary): string {
    const weeklyBreakdown = summary.weeklyBreakdown || [];

    // 月の開始日と終了日から全ての週を計算
    const monthStart = new Date(summary.weekStartDate);
    const monthEnd = new Date(summary.weekEndDate);

    // 月内の全ての週を生成
    const allWeeks: Array<{ weekNum: number; startDate: Date; data: import('../types').WeekBreakdown | null }> = [];
    const currentDate = new Date(monthStart);
    let weekNum = 1;

    while (currentDate <= monthEnd) {
      // この週の開始日（月曜日に調整、または月初）
      const weekStart = new Date(currentDate);

      // 既存データから該当する週を探す
      const existingWeek = weeklyBreakdown.find(w => {
        const wStart = new Date(w.weekStartDate);
        const wEnd = new Date(w.weekEndDate);
        return weekStart >= wStart && weekStart <= wEnd;
      });

      allWeeks.push({
        weekNum,
        startDate: new Date(weekStart),
        data: existingWeek || null
      });

      // 次の週へ（7日後）
      currentDate.setDate(currentDate.getDate() + 7);
      // 月の最初の週から始まるように調整
      if (weekNum === 1) {
        // 最初の週は月曜日まで進める
        const dayOfWeek = currentDate.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
        if (daysUntilMonday > 0 && daysUntilMonday < 7) {
          currentDate.setDate(currentDate.getDate() - 7 + daysUntilMonday);
        }
      }
      weekNum++;

      // 安全のため最大6週まで
      if (weekNum > 6) break;
    }

    if (allWeeks.length === 0) {
      return '<p class="subtitle animate-fade-in delay-3">データがありません</p>';
    }

    const maxTime = Math.max(...allWeeks.map(w => w.data?.totalTimeMs || 0), 1);

    // データがある項目のみにアニメーション遅延を割り当て
    let dataItemCount = 0;

    return `
      <div class="daily-bars weekly-bars">
        ${allWeeks.map((week) => {
          const totalTimeMs = week.data?.totalTimeMs || 0;
          const heightPercent = (totalTimeMs / maxTime) * 100;
          const weekLabel = `${week.startDate.getMonth() + 1}/${week.startDate.getDate()}`;
          const hasData = totalTimeMs > 0;

          // データがある場合のみ遅延を増加
          const delayIndex = hasData ? (dataItemCount++ + 4) : 3;

          return `
            <div class="daily-bar-item animate-fade-in delay-${hasData ? delayIndex : 3}">
              <div class="daily-bar-wrapper">
                ${hasData ? `
                  <div class="daily-bar animate-bar-grow delay-${delayIndex + 1}" style="height: ${Math.max(heightPercent, 5)}%">
                    <span class="daily-bar-time animate-fade-in delay-${delayIndex + 2}">${formatDuration(totalTimeMs)}</span>
                  </div>
                ` : ''}
              </div>
              <div class="daily-bar-label animate-fade-in delay-${hasData ? delayIndex : 3}">
                <span class="day-name">${week.weekNum}週目</span>
                <span class="day-num">${weekLabel}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * 月別コーディング時間をレンダリング（年間レビュー用）
   */
  private renderMonthlyBreakdownAnimated(summary: import('../types').YearlySummary): string {
    const monthlyBreakdown = summary.monthlyBreakdown || [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // 12ヶ月すべてのデータを生成
    const allMonths: Array<{ month: number; data: import('../types').MonthBreakdown | null }> = [];
    for (let month = 1; month <= 12; month++) {
      const existingMonth = monthlyBreakdown.find(m => m.month === month);
      allMonths.push({
        month,
        data: existingMonth || null
      });
    }

    const maxTime = Math.max(...allMonths.map(m => m.data?.totalTimeMs || 0), 1);

    // データがある項目のみにアニメーション遅延を割り当て
    let dataItemCount = 0;

    return `
      <div class="daily-bars monthly-bars">
        ${allMonths.map((monthData) => {
          const totalTimeMs = monthData.data?.totalTimeMs || 0;
          const activeDays = monthData.data?.activeDays || 0;
          const heightPercent = (totalTimeMs / maxTime) * 100;
          const hasData = totalTimeMs > 0;

          // データがある場合のみ遅延を増加（2つずつグループ化）
          const delayIndex = hasData ? (Math.floor(dataItemCount++ / 2) + 4) : 3;

          return `
            <div class="daily-bar-item animate-fade-in delay-${hasData ? delayIndex : 3}">
              <div class="daily-bar-wrapper">
                ${hasData ? `
                  <div class="daily-bar animate-bar-grow delay-${delayIndex + 1}" style="height: ${Math.max(heightPercent, 5)}%">
                    <span class="daily-bar-time animate-fade-in delay-${delayIndex + 2}">${formatDuration(totalTimeMs)}</span>
                  </div>
                ` : ''}
              </div>
              <div class="daily-bar-label animate-fade-in delay-${hasData ? delayIndex : 3}">
                <span class="day-name">${monthNames[monthData.month - 1]}</span>
                <span class="day-num">${activeDays}d</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * ヒートマップをアニメーション付きでレンダリング
   */
  private renderHeatmapAnimated(hourlyDistribution: number[]): string {
    const maxTime = Math.max(...hourlyDistribution, 1);

    const cells = hourlyDistribution.map((time, hour) => {
      const level = time === 0 ? 0 : Math.ceil((time / maxTime) * 5);
      const delayClass = `delay-${Math.floor(hour / 4) + 1}`;
      return `<div class="heatmap-cell level-${level} animate-scale-in ${delayClass}" title="${formatHour(hour)}: ${formatDuration(time)}"></div>`;
    }).join('');

    return `
      <div class="heatmap">
        ${cells}
      </div>
      <div class="heatmap-labels animate-fade-in delay-7">
        <span>0時</span>
        <span>6時</span>
        <span>12時</span>
        <span>18時</span>
        <span>23時</span>
      </div>
    `;
  }

  /**
   * スクリプトを取得
   */
  private getScripts(): string {
    return `
      // 期間選択に戻るボタン
      const backToPeriodBtn = document.getElementById('backToPeriodBtn');
      if (backToPeriodBtn) {
        backToPeriodBtn.addEventListener('click', function() {
          vscode.postMessage({ command: 'backToPeriodSelection' });
        });
      }

      // 画面幅に応じてコンテンツをスケーリング
      function adjustScale() {
        const baseWidth = 944;
        const container = document.querySelector('.slides-container');
        const viewportWidth = window.innerWidth;

        if (viewportWidth < baseWidth) {
          const scale = viewportWidth / baseWidth;
          container.style.zoom = scale;
        } else {
          container.style.zoom = 1;
        }
      }

      window.addEventListener('resize', adjustScale);
      adjustScale();

      let currentSlide = 1;
      const currentPeriodType = '${this.currentPeriodType}';

      /*
       * ========================================
       * スライド数の管理について（重要）
       * ========================================
       * スライドを追加・削除する場合、以下の箇所を必ず更新すること:
       *
       * 1. totalSlides (この下 - HTMLから動的に取得)
       * 2. slideDurations (buildSlideDurations()で動的生成)
       * 3. story-bar の生成数 (getFooter() 内の Array.from({length: ...}))
       * 4. スライド番号のオフセット計算 (slideOffset, styleSlideOffset, calendarSlideOffset)
       *
       * 現在のスライド構成:
       * [週間: 11スライド]
       *   1: タイトル, 2: 総時間, 3: 日別グラフ, 4: プロジェクト, 5: ファイル,
       *   6: 言語, 7: パターン(When You Code), 8: 夜ふかし, 9: 記録,
       *   10: 最終, 11: サマリー
       *
       * [月間: スタイル数N=0〜4により11〜12スライド]
       *   1: タイトル, 2: 総時間, 3: 日別グラフ, 4: プロジェクト, 5: ファイル,
       *   6: 言語, 7: 夜ふかし, 8: 記録, 9: カレンダー,
       *   (N>0の場合) 10: スタイルまとめ（1枚に最大4つ）,
       *   (N>0: 11, N=0: 10): 最終, (N>0: 12, N=0: 11): サマリー
       *
       * [年間: スタイル数N=0〜5により11〜17スライド]
       *   1: タイトル, 2: 総時間, 3: 日別グラフ, 4: プロジェクト, 5: ファイル,
       *   6: 言語, 7: 夜ふかし, 8: 記録, 9: カレンダー,
       *   (N>0の場合) 10: スタイル導入, 11〜(10+N): 個別スタイル,
       *   (10+N+1 または 10): 最終, (10+N+2 または 11): サマリー
       * ========================================
       */
      // スライド総数とスタイル数をHTMLから取得
      const storyProgressEl = document.getElementById('storyProgress');
      const totalSlides = storyProgressEl ? parseInt(storyProgressEl.dataset.totalSlides || '11') : 11;
      const styleCount = storyProgressEl ? parseInt(storyProgressEl.dataset.styleCount || '0') : 0;
      const isYear = storyProgressEl ? storyProgressEl.dataset.isYear === 'true' : false;

      // スライドごとの表示時間（ミリ秒）を動的に生成
      function buildSlideDurations() {
        if (currentPeriodType === 'week') {
          return {
            1: 3000,    // タイトル - 短め
            2: 8000,    // 総時間 - 数字に注目
            3: 9000,    // 日別グラフ - グラフ確認のため長め
            4: 9000,    // プロジェクトTOP5 - リスト確認
            5: 9000,    // ファイルTOP5 - リスト確認
            6: 9000,    // 言語 - リスト確認
            7: 8500,    // パターン(When You Code) - ヒートマップ確認
            8: 7500,    // 夜ふかし - 標準
            9: 8000,    // 記録 - 複数項目
            10: 6000,   // 最終スライド - 短め
            11: 0       // サマリー - 自動スクロールなし
          };
        }

        // 月間・年間共通: 基本スライド
        const durations = {
          1: 3000,    // タイトル - 短め
          2: 8000,    // 総時間 - 数字に注目
          3: 9000,    // 日別グラフ - グラフ確認のため長め
          4: 9000,    // プロジェクトTOP5 - リスト確認
          5: 9000,    // ファイルTOP5 - リスト確認
          6: 9000,    // 言語 - リスト確認
          7: 7500,    // 夜ふかし - 標準
          8: 8000,    // 記録 - 複数項目
          9: 12000,   // カレンダーヒートマップ - 確認長め
        };

        if (styleCount > 0) {
          if (isYear) {
            // 年間: 導入 + 個別スタイルスライド（最大5枚）
            durations[10] = 3000;  // スタイル導入 - 短め
            for (let i = 0; i < styleCount; i++) {
              durations[11 + i] = 5000;
            }
            durations[11 + styleCount] = 6000;  // 最終スライド
            durations[12 + styleCount] = 0;     // サマリー
          } else {
            // 月間: まとめスライド1枚のみ（導入なし、固定12スライド）
            durations[10] = 15000;  // スタイルまとめ - 長め
            durations[11] = 6000;   // 最終スライド
            durations[12] = 0;      // サマリー
          }
        } else {
          // スタイルがない場合
          durations[10] = 6000;  // 最終スライド
          durations[11] = 0;     // サマリー - 自動スクロールなし
        }

        return durations;
      }

      const slideDurations = buildSlideDurations();

      let autoScrollTimer = null;
      let isPaused = false;

      const slides = document.querySelectorAll('.slide');
      const storyBars = document.querySelectorAll('.story-bar');
      const prevPeriodBtn = document.getElementById('prevPeriod');
      const nextPeriodBtn = document.getElementById('nextPeriod');
      const currentPeriodBtn = document.getElementById('currentPeriod');
      const pauseIndicator = document.getElementById('pauseIndicator');
      const storyProgress = document.getElementById('storyProgress');

      // Animate progress bars on slide
      function animateProgressBars(slideElement) {
        const bars = slideElement.querySelectorAll('[data-animate-width]');
        bars.forEach((bar, index) => {
          const targetWidth = bar.dataset.animateWidth;
          setTimeout(() => {
            bar.style.transition = 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
            bar.style.width = targetWidth + '%';
          }, 500 + index * 150);
        });
      }

      // Number scramble animation - only scramble digits, keep units intact
      function animateScrambleNumbers(slideElement) {
        const scrambleElements = slideElement.querySelectorAll('[data-scramble]');
        scrambleElements.forEach((el, index) => {
          const finalText = el.dataset.scramble;
          const chars = '0123456789';
          const scrambleDuration = 600; // 0.6秒間のスクランブル（全スライド共通）
          const iterations = 60; // 10msごとの更新で超高速な文字変化
          let currentIteration = 0;

          // 数字のみを抽出してインデックスを記録
          const digitIndices = [];
          const digitValues = [];
          for (let i = 0; i < finalText.length; i++) {
            if (/[0-9]/.test(finalText[i])) {
              digitIndices.push(i);
              digitValues.push(finalText[i]);
            }
          }

          // 初期表示: 数字部分を0で埋めて表示（桁数を正確に維持）
          let initialText = '';
          for (let i = 0; i < finalText.length; i++) {
            if (digitIndices.includes(i)) {
              initialText += '0';
            } else {
              initialText += finalText[i];
            }
          }
          el.textContent = initialText;

          setTimeout(() => {
            const interval = setInterval(() => {
              currentIteration++;
              let displayText = '';

              // すべての数字が同時に確定するように（最後の1回で全て確定）
              const isLastIteration = currentIteration >= iterations;

              for (let i = 0; i < finalText.length; i++) {
                const digitPos = digitIndices.indexOf(i);
                if (digitPos !== -1) {
                  if (isLastIteration) {
                    // 最後のイテレーションで全て確定
                    displayText += digitValues[digitPos];
                  } else {
                    // ランダムな数字を表示
                    displayText += chars[Math.floor(Math.random() * chars.length)];
                  }
                } else {
                  // 単位文字などはそのまま表示
                  displayText += finalText[i];
                }
              }

              el.textContent = displayText;

              if (isLastIteration) {
                clearInterval(interval);
                el.textContent = finalText;
              }
            }, scrambleDuration / iterations);
          }, 200 + index * 80);
        });
      }

      function updateStoryBars(targetSlide, animate = true) {
        const duration = slideDurations[targetSlide] || 7500;

        storyBars.forEach((bar, index) => {
          const fill = bar.querySelector('.story-bar-fill');
          const slideNum = index + 1;

          fill.classList.remove('active', 'completed', 'paused');
          fill.style.animation = '';

          if (slideNum < targetSlide) {
            fill.classList.add('completed');
          } else if (slideNum === targetSlide && animate && duration > 0) {
            // Use linear easing so progress bar fills at constant rate and matches slide timing
            fill.style.animation = 'storyProgress ' + (duration / 1000) + 's linear forwards';
            fill.classList.add('active');
            if (isPaused) {
              fill.classList.add('paused');
            }
          }
        });
      }

      function togglePause() {
        isPaused = !isPaused;

        // Update pause indicator
        if (pauseIndicator) {
          if (isPaused) {
            pauseIndicator.classList.add('visible');
          } else {
            pauseIndicator.classList.remove('visible');
          }
        }

        // Update story progress bar style
        if (storyProgress) {
          storyProgress.classList.toggle('paused', isPaused);
        }

        // Update current progress bar animation
        const currentFill = storyBars[currentSlide - 1]?.querySelector('.story-bar-fill');
        if (currentFill) {
          currentFill.classList.toggle('paused', isPaused);
        }

        // Handle auto-scroll timer
        if (isPaused) {
          if (autoScrollTimer) {
            clearTimeout(autoScrollTimer);
            autoScrollTimer = null;
          }
        } else {
          // Resume with remaining time (simplified: restart with adjusted duration)
          const duration = slideDurations[currentSlide] || 7500;
          const transitionDuration = Math.max(duration - 100, 1000);
          if (currentSlide < totalSlides && duration > 0) {
            autoScrollTimer = setTimeout(() => {
              goToSlide(currentSlide + 1);
            }, transitionDuration);
          }
        }
      }

      // Reset animations by forcing reflow
      function resetAnimations(slideElement) {
        const animatedElements = slideElement.querySelectorAll('[class*="animate-"]');
        animatedElements.forEach(el => {
          // Force reflow to restart animation
          el.style.animation = 'none';
          el.offsetHeight; // Trigger reflow
          el.style.animation = '';
        });
      }

      // Animate coding styles slide with sequential category reveals
      function animateCodingStylesSlide(slideElement) {
        if (!slideElement.classList.contains('coding-styles-slide')) return;

        // Reset all visible classes
        const header = slideElement.querySelector('.slide-header');
        const container = slideElement.querySelector('.coding-styles-container');
        const groups = slideElement.querySelectorAll('.style-category-group');
        const cards = slideElement.querySelectorAll('.coding-style-card');
        const message = slideElement.querySelector('.slide-message');

        [header, container, message].forEach(el => el?.classList.remove('visible'));
        groups.forEach(g => g.classList.remove('visible'));
        cards.forEach(c => c.classList.remove('visible'));

        let delay = 0;

        // 1. Header appears first (centered)
        setTimeout(() => {
          header?.classList.add('visible');
        }, delay);
        delay += 600;

        // 2. Container becomes visible
        setTimeout(() => {
          container?.classList.add('visible');
        }, delay);
        delay += 200;

        // 3. Each category group appears sequentially
        groups.forEach((group, groupIndex) => {
          setTimeout(() => {
            group.classList.add('visible');

            // 4. Cards within each group appear with slight stagger
            const groupCards = group.querySelectorAll('.coding-style-card');
            groupCards.forEach((card, cardIndex) => {
              setTimeout(() => {
                card.classList.add('visible');
              }, cardIndex * 100);
            });
          }, delay + groupIndex * 400);
        });

        // 5. Final message appears after all groups
        const totalGroupDelay = delay + groups.length * 400 + 300;
        setTimeout(() => {
          message?.classList.add('visible');
        }, totalGroupDelay);
      }

      function goToSlide(n, animate = true) {
        if (autoScrollTimer) {
          clearTimeout(autoScrollTimer);
          autoScrollTimer = null;
        }

        slides.forEach(slide => {
          slide.classList.remove('active', 'prev');
        });

        let activeSlide = null;
        slides.forEach(slide => {
          const slideNum = parseInt(slide.dataset.slide);
          if (slideNum < n) {
            slide.classList.add('prev');
          } else if (slideNum === n) {
            slide.classList.add('active');
            activeSlide = slide;
          }
        });

        updateStoryBars(n, animate);
        currentSlide = n;

        // Reset and animate on the active slide
        if (activeSlide) {
          resetAnimations(activeSlide);
          animateProgressBars(activeSlide);
          animateScrambleNumbers(activeSlide);
          animateCodingStylesSlide(activeSlide);
        }

        // Start auto-scroll timer with slide-specific duration
        // Subtract 100ms for snappier transition feel
        const duration = slideDurations[n] || 7500;
        const transitionDuration = Math.max(duration - 100, 1000);
        if (!isPaused && currentSlide < totalSlides && duration > 0) {
          autoScrollTimer = setTimeout(() => {
            goToSlide(currentSlide + 1);
          }, transitionDuration);
        }
      }

      // Story bar click navigation
      storyBars.forEach((bar, index) => {
        bar.addEventListener('click', () => {
          goToSlide(index + 1, true);
        });
      });

      // Click on slide to go to next
      document.querySelector('.slides-container').addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('.week-nav') || e.target.closest('.story-progress')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        if (clickX < width * 0.3) {
          if (currentSlide > 1) goToSlide(currentSlide - 1);
        } else {
          if (currentSlide < totalSlides) goToSlide(currentSlide + 1);
        }
      });

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' && currentSlide < totalSlides) {
          goToSlide(currentSlide + 1);
        } else if (e.key === 'ArrowLeft' && currentSlide > 1) {
          goToSlide(currentSlide - 1);
        } else if (e.key === ' ') {
          e.preventDefault();
          togglePause();
        } else if (e.key === 'Escape') {
          vscode.postMessage({ command: 'close' });
        }
      });

      // Period navigation
      prevPeriodBtn.addEventListener('click', () => {
        const command = currentPeriodType === 'month' ? 'previousMonth' :
                        currentPeriodType === 'year' ? 'previousYear' : 'previousWeek';
        vscode.postMessage({ command: command });
      });

      nextPeriodBtn.addEventListener('click', () => {
        const command = currentPeriodType === 'month' ? 'nextMonth' :
                        currentPeriodType === 'year' ? 'nextYear' : 'nextWeek';
        vscode.postMessage({ command: command });
      });

      // 今週/今月/今年に飛ぶ
      if (currentPeriodBtn) {
        currentPeriodBtn.addEventListener('click', () => {
          vscode.postMessage({ command: 'goToCurrentPeriod' });
        });
      }

      // Image export functionality
      const downloadBtn = document.getElementById('downloadImage');
      const copyBtn = document.getElementById('copyImage');
      const summaryCard = document.getElementById('summaryCard');

      async function captureCardAsImage() {
        if (!summaryCard) return null;

        // Period-specific color themes matching CSS exactly
        const colorThemes = {
          week: {
            outerBg: ['#060a10', '#0c1929'],
            cardBg: ['#0c1929', '#0f2132', '#0a1520'],
            border: 'rgba(6, 182, 212, 0.25)',
            brandColor: '#06b6d4',
            badgeBg: 'rgba(6, 182, 212, 0.15)',
            badgeColor: '#22d3ee',
            badgeBorder: 'rgba(6, 182, 212, 0.3)',
            dateColor: 'rgba(6, 182, 212, 0.7)',
            heroLabelColor: 'rgba(6, 182, 212, 0.6)',
            heroValueColor: '#06b6d4',
            statBg: 'rgba(6, 182, 212, 0.08)',
            statBorder: 'rgba(6, 182, 212, 0.12)',
            statValueColor: '#e0f7fa',
            statLabelColor: 'rgba(6, 182, 212, 0.6)',
            taglineColor: 'rgba(6, 182, 212, 0.4)'
          },
          month: {
            outerBg: ['#0d0515', '#1a0a2e'],
            cardBg: ['#1a0a2e', '#251340', '#150825'],
            border: 'rgba(168, 85, 247, 0.3)',
            brandColor: '#a855f7',
            badgeBg: 'rgba(168, 85, 247, 0.15)',
            badgeColor: '#c084fc',
            badgeBorder: 'rgba(168, 85, 247, 0.3)',
            dateColor: 'rgba(168, 85, 247, 0.7)',
            heroLabelColor: 'rgba(168, 85, 247, 0.6)',
            heroValueColor: '#a855f7',
            statBg: 'rgba(168, 85, 247, 0.08)',
            statBorder: 'rgba(168, 85, 247, 0.12)',
            statValueColor: '#f3e8ff',
            statLabelColor: 'rgba(168, 85, 247, 0.6)',
            taglineColor: 'rgba(168, 85, 247, 0.4)'
          },
          year: {
            outerBg: ['#0a0800', '#1a1400'],
            cardBg: ['#1a1400', '#2a1f00', '#141000'],
            border: 'rgba(251, 191, 36, 0.35)',
            brandColor: '#fbbf24',
            badgeBg: 'rgba(251, 191, 36, 0.15)',
            badgeColor: '#fcd34d',
            badgeBorder: 'rgba(251, 191, 36, 0.3)',
            dateColor: 'rgba(251, 191, 36, 0.7)',
            heroLabelColor: 'rgba(251, 191, 36, 0.6)',
            heroValueColor: '#fbbf24',
            statBg: 'rgba(251, 191, 36, 0.08)',
            statBorder: 'rgba(251, 191, 36, 0.12)',
            statValueColor: '#fef3c7',
            statLabelColor: 'rgba(251, 191, 36, 0.6)',
            taglineColor: 'rgba(251, 191, 36, 0.4)'
          }
        };
        const theme = colorThemes[currentPeriodType] || colorThemes.week;

        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Set canvas size with padding
        const padding = 48;
        const cardRect = summaryCard.getBoundingClientRect();
        const scale = 2; // For higher resolution
        canvas.width = (cardRect.width + padding * 2) * scale;
        canvas.height = (cardRect.height + padding * 2) * scale;
        ctx.scale(scale, scale);

        const canvasW = canvas.width / scale;
        const canvasH = canvas.height / scale;

        // Helper function to get element position relative to card
        function getRelPos(el) {
          const rect = el.getBoundingClientRect();
          return {
            x: rect.left - cardRect.left + padding,
            y: rect.top - cardRect.top + padding,
            width: rect.width,
            height: rect.height,
            centerX: rect.left - cardRect.left + padding + rect.width / 2,
            centerY: rect.top - cardRect.top + padding + rect.height / 2
          };
        }

        // Draw outer background
        const outerGradient = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        outerGradient.addColorStop(0, theme.outerBg[0]);
        outerGradient.addColorStop(1, theme.outerBg[1]);
        ctx.fillStyle = outerGradient;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Card position
        const cardX = padding;
        const cardY = padding;
        const cardW = cardRect.width;
        const cardH = cardRect.height;

        // Draw card shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 12;

        // Draw card background with 160deg gradient (matching CSS)
        const cardGradient = ctx.createLinearGradient(
          cardX, cardY,
          cardX + cardW * 0.8, cardY + cardH
        );
        cardGradient.addColorStop(0, theme.cardBg[0]);
        cardGradient.addColorStop(0.5, theme.cardBg[1]);
        cardGradient.addColorStop(1, theme.cardBg[2]);
        ctx.fillStyle = cardGradient;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 24);
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Draw border
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 24);
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Add noise texture overlay for grainy effect (matching CSS noise)
        // Use sparse noise for performance (every 2nd pixel)
        const cardPixelX = Math.floor(cardX * scale);
        const cardPixelY = Math.floor(cardY * scale);
        const cardPixelW = Math.floor(cardW * scale);
        const cardPixelH = Math.floor(cardH * scale);

        // Get current card area pixels
        const cardImageData = ctx.getImageData(cardPixelX, cardPixelY, cardPixelW, cardPixelH);
        const pixels = cardImageData.data;

        // Apply noise to every 2nd pixel for performance (visually similar result)
        const step = 2;
        for (let y = 0; y < cardPixelH; y += step) {
          for (let x = 0; x < cardPixelW; x += step) {
            const i = (y * cardPixelW + x) * 4;
            const noise = (Math.random() - 0.5) * 30;
            pixels[i] = Math.max(0, Math.min(255, pixels[i] + noise));     // R
            pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noise)); // G
            pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noise)); // B
          }
        }

        // Put modified pixels back
        ctx.putImageData(cardImageData, cardPixelX, cardPixelY);

        // Get elements
        const brandEl = summaryCard.querySelector('.summary-brand');
        const dateEl = summaryCard.querySelector('.summary-date');
        const heroLabel = summaryCard.querySelector('.summary-hero-label');
        const heroValue = summaryCard.querySelector('.summary-hero-value');
        const stats = summaryCard.querySelectorAll('.summary-stat');
        const taglineEl = summaryCard.querySelector('.summary-tagline');

        // Draw brand (left aligned)
        if (brandEl) {
          const pos = getRelPos(brandEl);
          ctx.font = '800 14px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = theme.brandColor;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(brandEl.textContent || '#codevoyage', pos.x, pos.centerY);
        }

        // Draw date (right aligned)
        if (dateEl) {
          const pos = getRelPos(dateEl);
          ctx.font = '500 12px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = theme.dateColor;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(dateEl.textContent || '', pos.x + pos.width, pos.centerY);
        }

        // Draw hero label pill (WEEKLY TOTAL TIME, etc.)
        if (heroLabel) {
          const pos = getRelPos(heroLabel);
          // Pill background
          ctx.fillStyle = theme.badgeBg;
          ctx.beginPath();
          ctx.roundRect(pos.x, pos.y, pos.width, pos.height, 20);
          ctx.fill();
          // Pill border
          ctx.strokeStyle = theme.badgeBorder;
          ctx.lineWidth = 1;
          ctx.stroke();
          // Text
          ctx.font = '700 11px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = theme.badgeColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(heroLabel.textContent || '', pos.centerX, pos.centerY);
        }

        // Draw hero value with glow effect (matching CSS text-shadow: 0 0 60px)
        if (heroValue) {
          const pos = getRelPos(heroValue);
          const text = heroValue.textContent || '';
          ctx.font = '900 52px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Draw glow layers (multiple passes for soft glow)
          ctx.shadowColor = theme.heroValueColor;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = theme.heroValueColor;

          // Layer 1: Wide soft glow
          ctx.shadowBlur = 60;
          ctx.globalAlpha = 0.3;
          ctx.fillText(text, pos.centerX, pos.centerY);

          // Layer 2: Medium glow
          ctx.shadowBlur = 30;
          ctx.globalAlpha = 0.5;
          ctx.fillText(text, pos.centerX, pos.centerY);

          // Reset and draw main text (crisp, no shadow)
          ctx.shadowBlur = 0;
          ctx.shadowColor = 'transparent';
          ctx.globalAlpha = 1;
          ctx.fillText(text, pos.centerX, pos.centerY);
        }

        // Draw stats
        stats.forEach((stat) => {
          const statPos = getRelPos(stat);

          // Stat background
          ctx.fillStyle = theme.statBg;
          ctx.beginPath();
          ctx.roundRect(statPos.x, statPos.y, statPos.width, statPos.height, 14);
          ctx.fill();

          // Stat border
          ctx.strokeStyle = theme.statBorder;
          ctx.lineWidth = 1;
          ctx.stroke();

          const value = stat.querySelector('.stat-value');
          const label = stat.querySelector('.stat-label');

          // Value
          if (value) {
            const valuePos = getRelPos(value);
            ctx.font = '700 18px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = theme.statValueColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.textContent || '', valuePos.centerX, valuePos.centerY);
          }

          // Label
          if (label) {
            const labelPos = getRelPos(label);
            ctx.font = '600 10px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = theme.statLabelColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label.textContent || '', labelPos.centerX, labelPos.centerY);
          }
        });

        // Draw tagline
        if (taglineEl) {
          const pos = getRelPos(taglineEl);
          ctx.font = '500 11px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = theme.taglineColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(taglineEl.textContent || '', pos.centerX, pos.centerY);
        }

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        return canvas;
      }

      if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
          const canvas = await captureCardAsImage();
          if (!canvas) return;

          // Create download link with period-specific filename
          const periodNames = { week: 'weekly', month: 'monthly', year: 'yearly' };
          const periodName = periodNames[currentPeriodType] || 'weekly';
          const link = document.createElement('a');
          link.download = \`codevoyage-\${periodName}-summary.png\`;
          link.href = canvas.toDataURL('image/png');
          link.click();

          // Show success feedback
          downloadBtn.classList.add('success');
          const originalText = downloadBtn.innerHTML;
          downloadBtn.innerHTML = '<span class="btn-icon">✓</span> ダウンロード完了';
          setTimeout(() => {
            downloadBtn.classList.remove('success');
            downloadBtn.innerHTML = originalText;
          }, 2000);
        });
      }

      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          // Show loading state immediately
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '<span class="btn-icon spinning">⏳</span> コピー中...';
          copyBtn.disabled = true;

          const canvas = await captureCardAsImage();
          if (!canvas) {
            copyBtn.innerHTML = originalText;
            copyBtn.disabled = false;
            return;
          }

          try {
            canvas.toBlob(async (blob) => {
              if (!blob) {
                copyBtn.innerHTML = originalText;
                copyBtn.disabled = false;
                return;
              }
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);

              // Show success feedback
              copyBtn.classList.add('success');
              copyBtn.innerHTML = '<span class="btn-icon">✓</span> コピー完了';
              copyBtn.disabled = false;
              setTimeout(() => {
                copyBtn.classList.remove('success');
                copyBtn.innerHTML = originalText;
              }, 2000);
            });
          } catch (err) {
            console.error('Failed to copy image:', err);
            copyBtn.innerHTML = '<span class="btn-icon">✗</span> コピー失敗';
            copyBtn.disabled = false;
            setTimeout(() => {
              copyBtn.innerHTML = '<span class="btn-icon">📋</span> 画像をコピー';
            }, 2000);
          }
        });
      }

      // Back to selection button
      const backToSelectionBtn = document.getElementById('backToSelection');
      if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', () => {
          vscode.postMessage({ command: 'backToPeriodSelection' });
        });
      }

      // Start - use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          goToSlide(1, true);
        });
      });
    `;
  }

  /**
   * 数値をフォーマット
   */
  private formatNumber(n: number): string {
    if (n >= 1000000) {
      return (n / 1000000).toFixed(1) + 'M';
    }
    if (n >= 1000) {
      return (n / 1000).toFixed(1) + 'K';
    }
    return n.toString();
  }

  /**
   * HTMLエスケープ
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 期間タイプに応じたタイトルを取得
   */
  private getPeriodTitle(periodType: ReviewPeriodType, summary: WeeklySummary | MonthlySummary | YearlySummary): { line1: string; line2: string } {
    switch (periodType) {
      case 'month':
        const monthSummary = summary as MonthlySummary;
        return {
          line1: monthSummary.monthName,
          line2: 'in VSCode'
        };
      case 'year':
        const yearSummary = summary as YearlySummary;
        return {
          line1: `${yearSummary.year}`,
          line2: 'Year in Code'
        };
      case 'week':
      default:
        return {
          line1: 'Your Week',
          line2: 'in VSCode'
        };
    }
  }

  /**
   * 期間タイプに応じたヒントテキストを取得
   */
  private getPeriodHint(periodType: ReviewPeriodType): string {
    switch (periodType) {
      case 'month':
        return '✨ 今月のあなたの頑張りを振り返ろう';
      case 'year':
        return '🎊 今年のコーディングジャーニーを振り返ろう';
      case 'week':
      default:
        return '✨ 今週のあなたの頑張りを振り返ろう';
    }
  }

  /**
   * 期間タイプに応じた絵文字を取得
   */
  private getPeriodEmoji(periodType: ReviewPeriodType): string {
    switch (periodType) {
      case 'month':
        return '📆';
      case 'year':
        return '🎊';
      case 'week':
      default:
        return '⌨️';
    }
  }

  /**
   * 最終スライドのタイトルを取得
   */
  private getFinalTitle(periodType: ReviewPeriodType): string {
    switch (periodType) {
      case 'month':
        return 'Great Month!';
      case 'year':
        return 'What a Year!';
      case 'week':
      default:
        return 'Great Week!';
    }
  }

  /**
   * 最終スライドのサブタイトルを取得
   */
  private getFinalSubtitle(periodType: ReviewPeriodType): string {
    switch (periodType) {
      case 'month':
        return '今月もお疲れさまでした';
      case 'year':
        return '今年もお疲れさまでした';
      case 'week':
      default:
        return '今週もお疲れさまでした';
    }
  }

  /**
   * サマリースライドのタイトルを取得
   */
  private getSummaryTitle(periodType: ReviewPeriodType): string {
    switch (periodType) {
      case 'month':
        return 'Monthly Summary';
      case 'year':
        return 'Yearly Summary';
      case 'week':
      default:
        return 'Weekly Summary';
    }
  }

  /**
   * 期間バッジのテキストを取得
   */
  private getPeriodBadge(periodType: ReviewPeriodType): string {
    switch (periodType) {
      case 'month':
        return 'MONTHLY';
      case 'year':
        return 'YEARLY';
      case 'week':
      default:
        return 'WEEKLY';
    }
  }

  /**
   * 日付範囲をフォーマット
   */
  private formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.getMonth() + 1;
    const startDay = start.getDate();
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${year}.${startMonth}.${startDay} - ${endDay}`;
    }
    return `${year}.${startMonth}.${startDay} - ${endMonth}.${endDay}`;
  }

  /**
   * 大きな数字をフォーマット（K, M表記）
   */
  private formatLargeNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString();
  }

  /**
   * 前の期間のラベルを取得（具体的な日付表示）
   */
  private getPrevPeriodLabel(periodType: ReviewPeriodType): string {
    const now = new Date();
    switch (periodType) {
      case 'month': {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + this.currentMonthOffset - 1, 1);
        return `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月`;
      }
      case 'year': {
        const targetYear = now.getFullYear() + this.currentYearOffset - 1;
        return `${targetYear}年`;
      }
      case 'week':
      default: {
        // 週の開始日を計算（月曜始まり）
        const targetDate = new Date(now);
        const dayOfWeek = targetDate.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 月曜日を基準に
        targetDate.setDate(targetDate.getDate() - diff + (this.currentWeekOffset - 1) * 7);
        return `${targetDate.getMonth() + 1}/${targetDate.getDate()}週`;
      }
    }
  }

  /**
   * 次の期間のラベルを取得（具体的な日付表示）
   */
  private getNextPeriodLabel(periodType: ReviewPeriodType): string {
    const now = new Date();
    switch (periodType) {
      case 'month': {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + this.currentMonthOffset + 1, 1);
        return `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月`;
      }
      case 'year': {
        const targetYear = now.getFullYear() + this.currentYearOffset + 1;
        return `${targetYear}年`;
      }
      case 'week':
      default: {
        // 週の開始日を計算（月曜始まり）
        const targetDate = new Date(now);
        const dayOfWeek = targetDate.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 月曜日を基準に
        targetDate.setDate(targetDate.getDate() - diff + (this.currentWeekOffset + 1) * 7);
        return `${targetDate.getMonth() + 1}/${targetDate.getDate()}週`;
      }
    }
  }

  /**
   * 現在の期間オフセットを取得
   */
  private getCurrentOffset(periodType: ReviewPeriodType): number {
    switch (periodType) {
      case 'month':
        return this.currentMonthOffset;
      case 'year':
        return this.currentYearOffset;
      case 'week':
      default:
        return this.currentWeekOffset;
    }
  }

  /**
   * nonceを生成
   */
  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
