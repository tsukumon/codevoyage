/**
 * ユーザーアクティビティを検出するサービス
 */
export class ActivityDetector {
  private lastActivityTime: number = Date.now();
  private idleTimeoutMs: number;

  constructor(idleTimeoutMs: number = 300000) {
    this.idleTimeoutMs = idleTimeoutMs;
  }

  /**
   * アクティビティを記録
   */
  public recordActivity(): void {
    this.lastActivityTime = Date.now();
  }

  /**
   * アイドル状態かどうかを判定
   * idleTimeoutMsが0の場合はアイドル判定を無効化（常にfalse）
   */
  public isIdle(): boolean {
    if (this.idleTimeoutMs === 0) {
      return false;
    }
    const idleDuration = Date.now() - this.lastActivityTime;
    return idleDuration > this.idleTimeoutMs;
  }

  /**
   * アイドル時間を取得
   */
  public getIdleDuration(): number {
    return Date.now() - this.lastActivityTime;
  }

  /**
   * 最終アクティビティ時刻を取得
   */
  public getLastActivityTime(): number {
    return this.lastActivityTime;
  }

  /**
   * アイドルタイムアウトを更新
   */
  public setIdleTimeout(ms: number): void {
    this.idleTimeoutMs = ms;
  }

  /**
   * 最終アクティビティからの経過時間（ミリ秒）
   */
  public getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivityTime;
  }
}
