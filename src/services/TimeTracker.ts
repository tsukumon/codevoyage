import * as vscode from 'vscode';
import { CodingSession } from '../types';
import { ActivityDetector } from './ActivityDetector';
import { StorageService } from './StorageService';
import { generateUUID, isNightOwlHour, formatDurationShort } from '../utils/dateUtils';

/**
 * コーディング時間を追跡するサービス
 *
 * ## セッションの仕様
 *
 * ### セッションの定義
 * - セッション = VSCodeでの連続作業期間
 * - startTime: セッション開始時刻（ファイル切り替えでは更新されない）
 * - endTime: セッション終了時刻
 *
 * ### セッション終了の条件
 * 1. アイドルタイムアウト超過（設定値、0で無効化）
 * 2. VSCode終了/トラッキング停止
 * 3. ワークスペース変更
 *
 * ### セッションが終了しないケース
 * 1. ファイル切り替え → セッション情報（languageId, fileName等）のみ更新
 * 2. ターミナル/Webview切り替え → セッション継続
 * 3. VSCodeウィンドウのフォーカス喪失 → セッション継続、時間カウント継続
 *
 * ### アイドルタイムアウト=0の動作
 * - アイドル判定無効（常にアクティブ扱い）
 * - VSCode外の作業時間もカウントされる
 * - これは意図した動作
 *
 * ### 言語別・プロジェクト別・ファイル別時間の記録
 * - ファイル切り替え時に saveSessionProgress() でここまでの時間を前の言語/プロジェクト/ファイルに記録
 * - その後 updateSessionInfo() でセッション情報を更新
 * - 次の記録は新しい言語/プロジェクト/ファイルでカウント
 */
export class TimeTracker implements vscode.Disposable {
  private currentSession: CodingSession | null = null;
  private activityDetector: ActivityDetector;
  private storageService: StorageService;
  private statusBarItem: vscode.StatusBarItem;
  private updateInterval: NodeJS.Timeout | null = null;
  private disposables: vscode.Disposable[] = [];
  private isTracking: boolean = false;
  private lastUpdateTime: number = Date.now();
  private sessionStartTime: number = Date.now();
  private editedFiles: Set<string> = new Set();
  private lastSessionInfo: {
    workspaceName: string;
    workspacePath: string;
    languageId: string;
    fileName: string;
  } | null = null;

  constructor(
    context: vscode.ExtensionContext,
    storageService: StorageService
  ) {
    this.storageService = storageService;
    const settings = storageService.getSettings();
    this.activityDetector = new ActivityDetector(settings.idleTimeoutMs);

    // ステータスバーアイテムを作成（左側の一番右に表示）
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      0
    );
    this.statusBarItem.command = 'codevoyage.openDashboard';
    this.statusBarItem.tooltip = 'View your journey';

    this.setupEventListeners();
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    // アクティブエディタの変更
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.handleEditorChange(editor);
      })
    );

    // テキストドキュメントの変更
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.handleDocumentChange(event);
      })
    );

    // 選択範囲の変更
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(() => {
        this.activityDetector.recordActivity();
      })
    );

    // ウィンドウフォーカスの変更
    this.disposables.push(
      vscode.window.onDidChangeWindowState((state) => {
        if (state.focused) {
          this.resumeTracking();
        } else {
          this.pauseTracking();
        }
      })
    );

    // ワークスペースフォルダの変更
    this.disposables.push(
      vscode.workspace.onDidChangeWorkspaceFolders(() => {
        this.handleWorkspaceChange();
      })
    );

    // ターミナルのアクティビティ検出
    this.disposables.push(
      vscode.window.onDidChangeActiveTerminal(() => {
        this.activityDetector.recordActivity();
      })
    );

    this.disposables.push(
      vscode.window.onDidOpenTerminal(() => {
        this.activityDetector.recordActivity();
      })
    );

    this.disposables.push(
      vscode.window.onDidCloseTerminal(() => {
        this.activityDetector.recordActivity();
      })
    );

    // Webviewパネル等への切り替え検出（エディタがundefinedになった場合）
    // Note: onDidChangeActiveTextEditorは既に登録済みだが、
    // handleEditorChangeでundefinedの場合もアクティビティを記録するよう修正済み
  }

  /**
   * トラッキングを開始
   */
  public startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      // 初回セッション開始（非同期だが待たない）
      this.startNewSession(editor).catch(err => {
        console.error('CodeVoyage: Failed to start initial session', err);
      });
    }

    // 30秒ごとに更新
    this.updateInterval = setInterval(() => {
      this.periodicUpdate();
    }, 30000);

    const settings = this.storageService.getSettings();
    if (settings.showStatusBar) {
      this.statusBarItem.show();
    }

    this.updateStatusBar();
  }

  /**
   * トラッキングを停止
   */
  public async stopTracking(): Promise<void> {
    if (!this.isTracking) return;

    this.isTracking = false;

    if (this.currentSession) {
      // セッション終了前に進捗を保存
      await this.saveSessionProgress();
      await this.endCurrentSession();
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.statusBarItem.hide();
  }

  /**
   * トラッキングを一時停止
   */
  private async pauseTracking(): Promise<void> {
    if (this.currentSession) {
      await this.saveSessionProgress();
    }
  }

  /**
   * トラッキングを再開
   */
  private async resumeTracking(): Promise<void> {
    if (this.isTracking && !this.currentSession) {
      const editor = vscode.window.activeTextEditor;
      // エディタがなくてもlastSessionInfoがあれば継続
      if (editor || this.lastSessionInfo) {
        await this.startNewSession(editor);
      }
    }
    this.activityDetector.recordActivity();
  }

  /**
   * 新しいセッションを開始
   * エディタがない場合は前回のセッション情報を使用して継続
   */
  private async startNewSession(editor?: vscode.TextEditor): Promise<void> {
    if (this.currentSession) {
      await this.endCurrentSession();
    }

    // エディタがある場合は情報を取得、ない場合は前回の情報を使用
    let sessionInfo: {
      workspaceName: string;
      workspacePath: string;
      languageId: string;
      fileName: string;
    };

    if (editor) {
      const workspace = vscode.workspace.getWorkspaceFolder(editor.document.uri);
      sessionInfo = {
        workspaceName: workspace?.name || 'Unknown',
        workspacePath: workspace?.uri.fsPath || 'unknown',
        languageId: editor.document.languageId,
        fileName: editor.document.fileName,
      };
      // 次回のために保存
      this.lastSessionInfo = sessionInfo;
    } else if (this.lastSessionInfo) {
      // エディタがない場合は前回の情報を使用
      sessionInfo = this.lastSessionInfo;
    } else {
      // 初回でエディタもない場合はスキップ
      return;
    }

    this.currentSession = {
      id: generateUUID(),
      startTime: Date.now(),
      endTime: null,
      workspaceName: sessionInfo.workspaceName,
      workspacePath: sessionInfo.workspacePath,
      languageId: sessionInfo.languageId,
      fileName: sessionInfo.fileName,
      isActive: true,
      charactersEdited: 0
    };

    this.sessionStartTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.activityDetector.recordActivity();
    // ファイル時間は saveSessionProgress で記録されるため、ここでは記録しない
  }

  /**
   * 現在のセッションを終了
   */
  private async endCurrentSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    const duration = this.currentSession.endTime - this.currentSession.startTime;

    // 最長セッションを更新
    await this.storageService.updateLongestSession(duration);

    this.currentSession = null;
  }

  /**
   * セッションの進捗を保存
   * - 言語別・プロジェクト別時間を recordSessionTime で記録
   * - ファイル別時間を recordFileTime で記録
   */
  private async saveSessionProgress(): Promise<void> {
    if (!this.currentSession) return;

    const now = Date.now();
    const duration = now - this.lastUpdateTime;
    const hour = new Date().getHours();
    const isNightOwl = isNightOwlHour(hour);

    // 言語別・プロジェクト別時間を記録
    await this.storageService.recordSessionTime(
      this.currentSession,
      duration,
      hour,
      isNightOwl
    );

    // ファイル別時間を記録
    await this.storageService.recordFileTime(
      this.currentSession.fileName,
      duration,
      this.currentSession.workspaceName
    );

    this.lastUpdateTime = now;
  }

  /**
   * 定期更新
   */
  private async periodicUpdate(): Promise<void> {
    if (!this.isTracking) return;

    // アイドル状態をチェック
    if (this.activityDetector.isIdle()) {
      if (this.currentSession) {
        await this.endCurrentSession();
      }
      return;
    }

    // セッションがなければ新規作成（エディタがなくてもlastSessionInfoがあれば継続）
    if (!this.currentSession) {
      const editor = vscode.window.activeTextEditor;
      if (editor || this.lastSessionInfo) {
        await this.startNewSession(editor);
      }
      return;
    }

    // 進捗を保存
    await this.saveSessionProgress();
    this.updateStatusBar();
  }

  /**
   * エディタ変更を処理
   * ファイル切り替え時はセッションを終了せず、情報のみ更新する
   */
  private async handleEditorChange(editor: vscode.TextEditor | undefined): Promise<void> {
    if (!this.isTracking) return;

    this.activityDetector.recordActivity();

    if (editor) {
      // 新しいファイルを開いた場合
      if (!this.editedFiles.has(editor.document.fileName)) {
        this.editedFiles.add(editor.document.fileName);
        this.storageService.incrementEditedFileCount();
      }

      const newFileName = editor.document.fileName;

      if (this.currentSession && this.currentSession.fileName !== newFileName) {
        // ファイル切り替え: セッションは継続し、情報のみ更新
        // まず現在のファイルの時間を保存
        await this.saveSessionProgress();
        // セッション情報を更新（セッションは終了しない）
        this.updateSessionInfo(editor);
      } else if (!this.currentSession) {
        // セッションがない場合は新規作成
        await this.startNewSession(editor);
      }
    }
  }

  /**
   * セッション情報を更新（セッションは終了しない）
   * ファイル切り替え時に呼び出され、languageId, fileName, workspace情報を更新する
   */
  private updateSessionInfo(editor: vscode.TextEditor): void {
    if (!this.currentSession) return;

    const workspace = vscode.workspace.getWorkspaceFolder(editor.document.uri);

    // セッション情報を更新
    this.currentSession.languageId = editor.document.languageId;
    this.currentSession.fileName = editor.document.fileName;
    this.currentSession.workspaceName = workspace?.name || 'Unknown';
    this.currentSession.workspacePath = workspace?.uri.fsPath || 'unknown';

    // lastSessionInfo も更新
    this.lastSessionInfo = {
      workspaceName: this.currentSession.workspaceName,
      workspacePath: this.currentSession.workspacePath,
      languageId: this.currentSession.languageId,
      fileName: this.currentSession.fileName,
    };
  }

  /**
   * ドキュメント変更を処理
   */
  private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    if (!this.isTracking) return;

    // 通常のファイルと新規ファイルのみカウント（出力パネル等を除外）
    const scheme = event.document.uri.scheme;
    if (scheme !== 'file' && scheme !== 'untitled') {
      return;
    }

    this.activityDetector.recordActivity();

    // 編集文字数をカウント
    const changeSize = event.contentChanges.reduce(
      (sum, change) => sum + change.text.length,
      0
    );

    if (changeSize > 0) {
      this.storageService.recordCharactersEdited(changeSize);

      if (this.currentSession) {
        this.currentSession.charactersEdited += changeSize;
      }
    }
  }

  /**
   * ワークスペース変更を処理
   */
  private async handleWorkspaceChange(): Promise<void> {
    if (!this.isTracking) return;

    // 新しいセッションを開始
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await this.saveSessionProgress();
      await this.startNewSession(editor);
    }
  }

  /**
   * ステータスバーを更新
   */
  private updateStatusBar(): void {
    const settings = this.storageService.getSettings();
    const period = settings.statusBarPeriod || 'today';

    let timeMs: number;
    let label: string;

    switch (period) {
      case 'week':
        timeMs = this.storageService.getWeekTotalTimeMs();
        label = '7d';
        break;
      case 'month':
        timeMs = this.storageService.getMonthTotalTimeMs();
        label = '30d';
        break;
      default:
        timeMs = this.storageService.getOrCreateTodayStats().totalTimeMs;
        label = '';
        break;
    }

    const formatted = formatDurationShort(timeMs);
    this.statusBarItem.text = label ? `$(clock) ${formatted} (${label})` : `$(clock) ${formatted}`;
  }

  /**
   * 今日の統計を取得
   */
  public getTodayStats() {
    return this.storageService.getOrCreateTodayStats();
  }

  /**
   * トラッキング状態を取得
   */
  public isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * アイドルタイムアウトを更新
   */
  public updateIdleTimeout(timeoutMs: number): void {
    this.activityDetector.setIdleTimeout(timeoutMs);
  }

  /**
   * ステータスバーを更新（設定変更時に外部から呼び出し用）
   */
  public refreshStatusBar(): void {
    this.updateStatusBar();
  }

  /**
   * リソースを解放（非同期版）
   */
  public async disposeAsync(): Promise<void> {
    await this.stopTracking();

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];

    this.statusBarItem.dispose();
  }

  /**
   * リソースを解放（VSCode Disposableインターフェース用）
   * 注意: 非同期処理の完了を待たない。確実な保存にはdisposeAsync()を使用
   */
  public dispose(): void {
    // 非同期で停止を開始（完了を待たない）
    this.stopTracking().catch(err => {
      console.error('CodeVoyage: Error during dispose', err);
    });

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];

    this.statusBarItem.dispose();
  }
}
