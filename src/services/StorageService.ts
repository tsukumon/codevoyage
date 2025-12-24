import * as vscode from 'vscode';
import { StorageSchema, DailyStats, CodingSession, ExtensionSettings } from '../types';
import { getTodayDate } from '../utils/dateUtils';

const STORAGE_KEY = 'codevoyage.data';
const SCHEMA_VERSION = 1;

export class StorageService {
  private globalState: vscode.Memento;
  private cache: StorageSchema | null = null;

  constructor(globalState: vscode.Memento) {
    this.globalState = globalState;
  }

  /**
   * ストレージの初期化
   */
  public async initialize(): Promise<void> {
    const stored = this.globalState.get<StorageSchema>(STORAGE_KEY);

    if (!stored) {
      this.cache = this.getDefaultSchema();
      await this.persist();
    } else if (stored.version < SCHEMA_VERSION) {
      this.cache = await this.migrate(stored);
      await this.persist();
    } else {
      this.cache = stored;
    }
  }

  /**
   * デフォルトスキーマを取得
   */
  private getDefaultSchema(): StorageSchema {
    return {
      version: SCHEMA_VERSION,
      currentSession: null,
      dailyStats: {},
      settings: {
        idleTimeoutMs: 300000,
        showStatusBar: true,
        language: 'ja'
      }
    };
  }

  /**
   * スキーママイグレーション
   */
  private async migrate(oldSchema: StorageSchema): Promise<StorageSchema> {
    // 現在はバージョン1のみ
    return {
      ...this.getDefaultSchema(),
      dailyStats: oldSchema.dailyStats || {},
      settings: { ...this.getDefaultSchema().settings, ...oldSchema.settings }
    };
  }

  /**
   * 現在のセッションを取得
   */
  public getCurrentSession(): CodingSession | null {
    return this.cache?.currentSession || null;
  }

  /**
   * 現在のセッションを設定
   */
  public async setCurrentSession(session: CodingSession | null): Promise<void> {
    if (this.cache) {
      this.cache.currentSession = session;
      await this.persist();
    }
  }

  /**
   * 指定日の統計を取得
   */
  public getDailyStats(date: string): DailyStats | null {
    return this.cache?.dailyStats[date] || null;
  }

  /**
   * 日付範囲の統計を取得
   */
  public getStatsRange(startDate: string, endDate: string): DailyStats[] {
    if (!this.cache) return [];

    const stats: DailyStats[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      if (this.cache.dailyStats[dateKey]) {
        stats.push(this.cache.dailyStats[dateKey]);
      }
    }

    return stats;
  }

  /**
   * 今日の統計を取得または作成
   */
  public getOrCreateTodayStats(): DailyStats {
    const today = getTodayDate();
    let stats = this.getDailyStats(today);

    if (!stats) {
      stats = this.createEmptyDailyStats(today);
      if (this.cache) {
        this.cache.dailyStats[today] = stats;
        // 新規作成時は即座に永続化（データ消失防止）
        this.persist().catch(err => {
          console.error('CodeVoyage: Failed to persist new daily stats', err);
        });
      }
    }

    return stats;
  }

  /**
   * 空の日別統計を作成
   */
  private createEmptyDailyStats(date: string): DailyStats {
    return {
      date,
      totalTimeMs: 0,
      activeTimeMs: 0,
      projectTime: {},
      languageTime: {},
      hourlyDistribution: new Array(24).fill(0),
      fileTimeMs: {},
      fileWorkspaces: {},
      editedFileCount: 0,
      totalCharactersEdited: 0,
      nightOwlTimeMs: 0,
      longestSessionMs: 0
    };
  }

  /**
   * 日別統計を更新
   */
  public async updateDailyStats(date: string, stats: DailyStats): Promise<void> {
    if (this.cache) {
      this.cache.dailyStats[date] = stats;
      await this.persist();
    }
  }

  /**
   * セッション情報から日別統計を更新
   */
  public async recordSessionTime(
    session: CodingSession,
    durationMs: number,
    hour: number,
    isNightOwl: boolean
  ): Promise<void> {
    const today = getTodayDate();
    const stats = this.getOrCreateTodayStats();

    // 総時間を更新
    stats.totalTimeMs += durationMs;
    if (session.isActive) {
      stats.activeTimeMs += durationMs;
    }

    // プロジェクト時間を更新
    stats.projectTime[session.workspacePath] =
      (stats.projectTime[session.workspacePath] || 0) + durationMs;

    // 言語時間を更新
    stats.languageTime[session.languageId] =
      (stats.languageTime[session.languageId] || 0) + durationMs;

    // 時間帯別分布を更新
    stats.hourlyDistribution[hour] += durationMs;

    // 夜ふかし時間を更新
    if (isNightOwl) {
      stats.nightOwlTimeMs += durationMs;
    }

    await this.updateDailyStats(today, stats);
  }

  /**
   * ファイル編集時間を記録
   */
  public async recordFileTime(filePath: string, durationMs: number, workspaceName?: string): Promise<void> {
    const stats = this.getOrCreateTodayStats();

    // 既存データとの互換性のためfileWorkspacesがなければ初期化
    if (!stats.fileWorkspaces) {
      stats.fileWorkspaces = {};
    }

    // 既存データとの互換性のためfileTimeMsがなければ初期化
    if (!stats.fileTimeMs) {
      stats.fileTimeMs = {};
    }

    stats.fileTimeMs[filePath] =
      (stats.fileTimeMs[filePath] || 0) + durationMs;

    // ワークスペース名が指定されていれば記録
    if (workspaceName) {
      stats.fileWorkspaces[filePath] = workspaceName;
    }

    await this.updateDailyStats(stats.date, stats);
  }

  /**
   * 編集文字数を記録
   */
  public async recordCharactersEdited(count: number): Promise<void> {
    const stats = this.getOrCreateTodayStats();

    stats.totalCharactersEdited += count;

    await this.updateDailyStats(stats.date, stats);
  }

  /**
   * 最長セッションを更新
   */
  public async updateLongestSession(durationMs: number): Promise<void> {
    const stats = this.getOrCreateTodayStats();

    if (durationMs > stats.longestSessionMs) {
      stats.longestSessionMs = durationMs;
      await this.updateDailyStats(stats.date, stats);
    }
  }

  /**
   * 編集ファイル数を更新
   */
  public async incrementEditedFileCount(): Promise<void> {
    const stats = this.getOrCreateTodayStats();
    stats.editedFileCount += 1;
    await this.updateDailyStats(stats.date, stats);
  }

  /**
   * 設定を取得
   */
  public getSettings(): ExtensionSettings {
    return this.cache?.settings || this.getDefaultSchema().settings;
  }

  /**
   * 設定を更新
   */
  public async updateSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    if (this.cache) {
      this.cache.settings = { ...this.cache.settings, ...settings };
      await this.persist();
    }
  }

  /**
   * 全データをクリア
   */
  public async clearAllData(): Promise<void> {
    this.cache = this.getDefaultSchema();
    await this.persist();
  }

  /**
   * データをエクスポート用に取得
   */
  public exportData(): StorageSchema | null {
    return this.cache ? { ...this.cache } : null;
  }

  /**
   * データをインポート
   */
  public async importData(data: StorageSchema): Promise<{ success: boolean; message: string }> {
    try {
      // バージョンチェック
      if (!data.version || data.version > SCHEMA_VERSION) {
        return {
          success: false,
          message: `Unsupported data version: ${data.version}. Current version: ${SCHEMA_VERSION}`
        };
      }

      // 必須フィールドの検証
      if (!data.dailyStats || typeof data.dailyStats !== 'object') {
        return {
          success: false,
          message: 'Invalid data format: dailyStats is missing or invalid'
        };
      }

      // マイグレーションが必要な場合
      if (data.version < SCHEMA_VERSION) {
        data = await this.migrate(data);
      }

      // 既存データとマージ（インポートデータで上書き）
      if (this.cache) {
        this.cache = {
          ...this.cache,
          dailyStats: { ...this.cache.dailyStats, ...data.dailyStats },
          settings: { ...this.cache.settings, ...data.settings }
        };
      } else {
        this.cache = data;
      }

      await this.persist();

      const importedDays = Object.keys(data.dailyStats).length;
      return {
        success: true,
        message: `Successfully imported ${importedDays} days of data`
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * データの統計情報を取得
   */
  public getDataStats(): { totalDays: number; dateRange: { start: string; end: string } | null } {
    if (!this.cache || !this.cache.dailyStats) {
      return { totalDays: 0, dateRange: null };
    }

    const dates = Object.keys(this.cache.dailyStats).sort();
    return {
      totalDays: dates.length,
      dateRange: dates.length > 0
        ? { start: dates[0], end: dates[dates.length - 1] }
        : null
    };
  }

  /**
   * キャッシュを永続化（リトライ付き）
   */
  private async persist(retryCount: number = 3): Promise<void> {
    if (!this.cache) return;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        await this.globalState.update(STORAGE_KEY, this.cache);
        return; // 成功
      } catch (error) {
        console.error(`CodeVoyage: Persist failed (attempt ${attempt}/${retryCount})`, error);
        if (attempt === retryCount) {
          // 最終試行も失敗した場合、ユーザーに通知
          vscode.window.showErrorMessage(
            'CodeVoyage: Failed to save data. Your recent coding time may not be recorded.'
          );
          throw error;
        }
        // 少し待ってからリトライ
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
  }
}
