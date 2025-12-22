import * as vscode from 'vscode';
import { CodingSession } from '../types';
import { ActivityDetector } from './ActivityDetector';
import { StorageService } from './StorageService';
import { generateUUID, isNightOwlHour, formatDurationShort } from '../utils/dateUtils';

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

  constructor(
    context: vscode.ExtensionContext,
    storageService: StorageService
  ) {
    this.storageService = storageService;
    const settings = storageService.getSettings();
    this.activityDetector = new ActivityDetector(settings.idleTimeoutMs);

    // ステータスバーアイテムを作成
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
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
      if (editor) {
        await this.startNewSession(editor);
      }
    }
    this.activityDetector.recordActivity();
  }

  /**
   * 新しいセッションを開始
   */
  private async startNewSession(editor: vscode.TextEditor): Promise<void> {
    if (this.currentSession) {
      await this.endCurrentSession();
    }

    const workspace = vscode.workspace.getWorkspaceFolder(editor.document.uri);

    this.currentSession = {
      id: generateUUID(),
      startTime: Date.now(),
      endTime: null,
      workspaceName: workspace?.name || 'Unknown',
      workspacePath: workspace?.uri.fsPath || 'unknown',
      languageId: editor.document.languageId,
      fileName: editor.document.fileName,
      isActive: true,
      charactersEdited: 0
    };

    this.sessionStartTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.activityDetector.recordActivity();

    // ファイルアクセスを記録（ワークスペース名も一緒に記録）
    this.storageService.recordFileAccess(editor.document.fileName, workspace?.name);
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
   */
  private async saveSessionProgress(): Promise<void> {
    if (!this.currentSession) return;

    const now = Date.now();
    const duration = now - this.lastUpdateTime;
    const hour = new Date().getHours();
    const isNightOwl = isNightOwlHour(hour);

    await this.storageService.recordSessionTime(
      this.currentSession,
      duration,
      hour,
      isNightOwl
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

    // セッションがなければ新規作成
    if (!this.currentSession) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
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

      // アクティブファイルが変わった場合、新しいセッションを開始
      // （同じワークスペース・言語でも、ファイルが変われば新しいセッション）
      const newFileName = editor.document.fileName;

      if (this.currentSession && this.currentSession.fileName !== newFileName) {
        // 前のセッションの時間を保存してから新しいセッションを開始
        await this.saveSessionProgress();
        await this.startNewSession(editor);
      } else if (!this.currentSession) {
        await this.startNewSession(editor);
      }

      // ファイルアクセスを記録（ワークスペース名も一緒に記録）
      const workspace = vscode.workspace.getWorkspaceFolder(editor.document.uri);
      this.storageService.recordFileAccess(editor.document.fileName, workspace?.name);
    }
  }

  /**
   * ドキュメント変更を処理
   */
  private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    if (!this.isTracking) return;

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
    const todayStats = this.storageService.getOrCreateTodayStats();
    const formatted = formatDurationShort(todayStats.totalTimeMs);
    this.statusBarItem.text = `$(clock) ${formatted}`;
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
