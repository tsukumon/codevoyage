import {
  WeeklySummary,
  MonthlySummary,
  YearlySummary,
  CodingStyle,
  CodingStyleId,
  DailyStats
} from '../types';
import { formatDuration } from '../utils/dateUtils';

/**
 * コーディングスタイル検出サービス
 *
 * 重要な設計思想:
 * - これらは「達成」ではなく「観察されたパターン」
 * - どのスタイルも優劣はない
 * - 頑張り方は人それぞれ、どのスタイルも尊重される
 * - 表示されないスタイルがあっても、それは「失敗」ではない
 */
export class CodingStyleService {

  /**
   * サマリーからコーディングスタイルを検出
   */
  public detectStyles(summary: WeeklySummary | MonthlySummary | YearlySummary): CodingStyle[] {
    const styles: CodingStyle[] = [];

    // 時間系スタイル
    this.detectTimeStyles(summary, styles);

    // リズム系スタイル
    this.detectRhythmStyles(summary, styles);

    // 集中系スタイル
    this.detectFocusStyles(summary, styles);

    // 探索系スタイル
    this.detectExplorationStyles(summary, styles);

    // 最大5つまでに制限（多すぎると意味が薄れる）
    return styles.slice(0, 5);
  }

  /**
   * 時間系スタイルを検出
   */
  private detectTimeStyles(summary: WeeklySummary, styles: CodingStyle[]): void {
    const totalHours = summary.totalCodingTimeMs / (1000 * 60 * 60);
    const longestSessionHours = summary.longestSessionMs / (1000 * 60 * 60);
    const avgSessionMs = this.calculateAverageSession(summary.dailyBreakdown);
    const avgSessionMinutes = avgSessionMs / (1000 * 60);

    // Steady Coder: 多くの日にコーディングしている
    const activeDays = summary.dailyBreakdown.filter(d => d.totalTimeMs > 0).length;
    const totalDays = summary.dailyBreakdown.length;
    if (totalDays > 0 && activeDays / totalDays >= 0.7) {
      styles.push({
        id: 'steady_coder',
        category: 'time',
        emoji: '🐢',
        title: 'コツコツ亀さん',
        description: 'コンスタントにコーディングする時間を持っていました',
        observation: `${activeDays}日間コーディング`
      });
    }

    // Marathon Runner: 長時間セッションがある
    if (longestSessionHours >= 3) {
      styles.push({
        id: 'marathon_runner',
        category: 'time',
        emoji: '🏃',
        title: '耐久レースの覇者',
        description: '長めのセッションでじっくり取り組む時間がありました',
        observation: `最長${formatDuration(summary.longestSessionMs)}`
      });
    }

    // Sprinter: 平均セッションが短め（30分以下）だが頻繁
    if (avgSessionMinutes > 0 && avgSessionMinutes <= 30 && activeDays >= 3) {
      styles.push({
        id: 'sprinter',
        category: 'time',
        emoji: '⚡',
        title: '電光石火くん',
        description: '短い時間で集中してコーディングするスタイル',
        observation: `平均${Math.round(avgSessionMinutes)}分のセッション`
      });
    }
  }

  /**
   * リズム系スタイルを検出
   */
  private detectRhythmStyles(summary: WeeklySummary, styles: CodingStyle[]): void {
    // Night Owl: 夜ふかし率が高い
    if (summary.nightOwlPercentage >= 30) {
      styles.push({
        id: 'night_owl',
        category: 'rhythm',
        emoji: '🦉',
        title: '夜更かしフクロウさん',
        description: '夜の静かな時間にコーディングすることが多かったようです',
        observation: `${Math.round(summary.nightOwlPercentage)}%が22時以降`
      });
    }

    // Early Bird: 朝型（6-9時の活動が多い）
    const morningTime = this.calculateTimeRange(summary.hourlyDistribution, 6, 9);
    const totalTime = summary.hourlyDistribution.reduce((a, b) => a + b, 0);
    if (totalTime > 0 && morningTime / totalTime >= 0.2) {
      styles.push({
        id: 'early_bird',
        category: 'rhythm',
        emoji: '🐓',
        title: '早起きニワトリさん',
        description: '朝の時間を活用してコーディングしていました',
        observation: `${Math.round(morningTime / totalTime * 100)}%が朝の時間帯`
      });
    }

    // Weekday Coder: 平日中心
    const weekdayTime = this.calculateWeekdayTime(summary.dayOfWeekDistribution);
    const weekendTime = this.calculateWeekendTime(summary.dayOfWeekDistribution);
    const totalWeekTime = weekdayTime + weekendTime;
    if (totalWeekTime > 0 && weekdayTime / totalWeekTime >= 0.85) {
      styles.push({
        id: 'weekday_coder',
        category: 'rhythm',
        emoji: '💼',
        title: 'お仕事モード全開',
        description: '平日を中心にコーディングしていました',
        observation: `${Math.round(weekdayTime / totalWeekTime * 100)}%が平日`
      });
    }

    // Weekend Warrior: 週末も活動
    if (totalWeekTime > 0 && weekendTime / totalWeekTime >= 0.25) {
      styles.push({
        id: 'weekend_warrior',
        category: 'rhythm',
        emoji: '🎮',
        title: '週末コード戦士',
        description: '週末もコーディングの時間を取っていました',
        observation: `${Math.round(weekendTime / totalWeekTime * 100)}%が週末`
      });
    }
  }

  /**
   * 集中系スタイルを検出
   */
  private detectFocusStyles(summary: WeeklySummary, styles: CodingStyle[]): void {
    // Deep Focus: 1つのプロジェクトに集中
    if (summary.topProjects.length > 0 && summary.topProjects[0].percentage >= 70) {
      styles.push({
        id: 'deep_focus',
        category: 'focus',
        emoji: '🎯',
        title: '没頭の職人さん',
        description: '1つのプロジェクトに集中して取り組んでいました',
        observation: `${summary.topProjects[0].name}に${Math.round(summary.topProjects[0].percentage)}%`
      });
    }

    // Multi-tasker: 複数プロジェクト並行
    const activeProjects = summary.topProjects.filter(p => p.percentage >= 15);
    if (activeProjects.length >= 3) {
      styles.push({
        id: 'multi_tasker',
        category: 'focus',
        emoji: '🎪',
        title: '八面六臂の使い手',
        description: '複数のプロジェクトを並行して進めていました',
        observation: `${activeProjects.length}つのプロジェクト`
      });
    }

    // File Explorer: 多くのファイルを触る
    if (summary.totalFilesEdited >= 50) {
      styles.push({
        id: 'file_explorer',
        category: 'focus',
        emoji: '🗺️',
        title: 'ファイル探検隊長',
        description: '多くのファイルに触れていました',
        observation: `${summary.totalFilesEdited}ファイル編集`
      });
    }
  }

  /**
   * 探索系スタイルを検出
   */
  private detectExplorationStyles(summary: WeeklySummary, styles: CodingStyle[]): void {
    // Language Explorer: 複数言語を使用
    const usedLanguages = summary.topLanguages.filter(l => l.percentage >= 5);
    if (usedLanguages.length >= 4) {
      styles.push({
        id: 'language_explorer',
        category: 'exploration',
        emoji: '🌍',
        title: '言語の旅人さん',
        description: '複数の言語を使ってコーディングしていました',
        observation: `${usedLanguages.length}言語を使用`
      });
    }

    // Specialist: 1言語に特化
    if (summary.topLanguages.length > 0 && summary.topLanguages[0].percentage >= 80) {
      styles.push({
        id: 'specialist',
        category: 'exploration',
        emoji: '🔬',
        title: '一筋の求道者',
        description: '特定の言語に集中して取り組んでいました',
        observation: `${summary.topLanguages[0].displayName}が${Math.round(summary.topLanguages[0].percentage)}%`
      });
    }

    // Consistent: 連続してコーディング（ストリーク）
    if (summary.streakDays >= 5) {
      styles.push({
        id: 'consistent',
        category: 'exploration',
        emoji: '🔥',
        title: '継続の鬼',
        description: '連続してコーディングを続けていました',
        observation: `${summary.streakDays}日連続`
      });
    }
  }

  /**
   * 平均セッション時間を計算
   */
  private calculateAverageSession(dailyStats: DailyStats[]): number {
    const sessions = dailyStats.filter(d => d.longestSessionMs > 0);
    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, d) => sum + d.longestSessionMs, 0) / sessions.length;
  }

  /**
   * 特定時間帯の合計時間を計算
   */
  private calculateTimeRange(hourlyDistribution: number[], startHour: number, endHour: number): number {
    let total = 0;
    for (let h = startHour; h <= endHour; h++) {
      total += hourlyDistribution[h] || 0;
    }
    return total;
  }

  /**
   * 平日の合計時間を計算
   */
  private calculateWeekdayTime(dayOfWeekDistribution: number[]): number {
    // 月〜金（インデックス1-5）
    return (dayOfWeekDistribution[1] || 0) +
           (dayOfWeekDistribution[2] || 0) +
           (dayOfWeekDistribution[3] || 0) +
           (dayOfWeekDistribution[4] || 0) +
           (dayOfWeekDistribution[5] || 0);
  }

  /**
   * 週末の合計時間を計算
   */
  private calculateWeekendTime(dayOfWeekDistribution: number[]): number {
    // 土日（インデックス0と6）
    return (dayOfWeekDistribution[0] || 0) + (dayOfWeekDistribution[6] || 0);
  }
}
