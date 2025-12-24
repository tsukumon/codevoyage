import {
  WeeklySummary,
  MonthlySummary,
  YearlySummary,
  CodingStyle,
  CodingStyleId,
  DailyStats,
  MonthBreakdown
} from '../types';
import { formatDuration } from '../utils/dateUtils';
import { Language, t } from '../i18n/translations';

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
  public detectStyles(summary: WeeklySummary | MonthlySummary | YearlySummary, lang: Language = 'ja'): CodingStyle[] {
    const styles: CodingStyle[] = [];

    // 時間系スタイル
    this.detectTimeStyles(summary, styles, lang);

    // リズム系スタイル
    this.detectRhythmStyles(summary, styles, lang);

    // 集中系スタイル
    this.detectFocusStyles(summary, styles, lang);

    // 探索系スタイル
    this.detectExplorationStyles(summary, styles, lang);

    // 最大5つまでに制限（多すぎると意味が薄れる）
    return styles.slice(0, 5);
  }

  /**
   * 時間系スタイルを検出
   */
  private detectTimeStyles(summary: WeeklySummary, styles: CodingStyle[], lang: Language): void {
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
        title: t('styleSteadyCoderTitle', lang),
        description: t('styleSteadyCoderDesc', lang),
        observation: t('styleSteadyCoderObs', lang, { days: activeDays })
      });
    }

    // Marathon Runner: 長時間セッションがある
    if (longestSessionHours >= 3) {
      styles.push({
        id: 'marathon_runner',
        category: 'time',
        emoji: '🏃',
        title: t('styleMarathonRunnerTitle', lang),
        description: t('styleMarathonRunnerDesc', lang),
        observation: t('styleMarathonRunnerObs', lang, { duration: formatDuration(summary.longestSessionMs) })
      });
    }

    // Sprinter: 平均セッションが短め（30分以下）だが頻繁
    if (avgSessionMinutes > 0 && avgSessionMinutes <= 30 && activeDays >= 3) {
      styles.push({
        id: 'sprinter',
        category: 'time',
        emoji: '⚡',
        title: t('styleSprinterTitle', lang),
        description: t('styleSprinterDesc', lang),
        observation: t('styleSprinterObs', lang, { minutes: Math.round(avgSessionMinutes) })
      });
    }
  }

  /**
   * リズム系スタイルを検出
   */
  private detectRhythmStyles(summary: WeeklySummary, styles: CodingStyle[], lang: Language): void {
    // Night Owl: 夜ふかし率が高い
    if (summary.nightOwlPercentage >= 30) {
      styles.push({
        id: 'night_owl',
        category: 'rhythm',
        emoji: '🦉',
        title: t('styleNightOwlTitle', lang),
        description: t('styleNightOwlDesc', lang),
        observation: t('styleNightOwlObs', lang, { percent: Math.round(summary.nightOwlPercentage) })
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
        title: t('styleEarlyBirdTitle', lang),
        description: t('styleEarlyBirdDesc', lang),
        observation: t('styleEarlyBirdObs', lang, { percent: Math.round(morningTime / totalTime * 100) })
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
        title: t('styleWeekdayCoderTitle', lang),
        description: t('styleWeekdayCoderDesc', lang),
        observation: t('styleWeekdayCoderObs', lang, { percent: Math.round(weekdayTime / totalWeekTime * 100) })
      });
    }

    // Weekend Warrior: 週末も活動
    if (totalWeekTime > 0 && weekendTime / totalWeekTime >= 0.25) {
      styles.push({
        id: 'weekend_warrior',
        category: 'rhythm',
        emoji: '🎮',
        title: t('styleWeekendWarriorTitle', lang),
        description: t('styleWeekendWarriorDesc', lang),
        observation: t('styleWeekendWarriorObs', lang, { percent: Math.round(weekendTime / totalWeekTime * 100) })
      });
    }
  }

  /**
   * 集中系スタイルを検出
   */
  private detectFocusStyles(summary: WeeklySummary, styles: CodingStyle[], lang: Language): void {
    // Deep Focus: 1つのプロジェクトに集中
    if (summary.topProjects.length > 0 && summary.topProjects[0].percentage >= 70) {
      styles.push({
        id: 'deep_focus',
        category: 'focus',
        emoji: '🎯',
        title: t('styleDeepFocusTitle', lang),
        description: t('styleDeepFocusDesc', lang),
        observation: t('styleDeepFocusObs', lang, { project: summary.topProjects[0].name, percent: Math.round(summary.topProjects[0].percentage) })
      });
    }

    // Multi-tasker: 複数プロジェクト並行
    const activeProjects = summary.topProjects.filter(p => p.percentage >= 15);
    if (activeProjects.length >= 3) {
      styles.push({
        id: 'multi_tasker',
        category: 'focus',
        emoji: '🎪',
        title: t('styleMultiTaskerTitle', lang),
        description: t('styleMultiTaskerDesc', lang),
        observation: t('styleMultiTaskerObs', lang, { count: activeProjects.length })
      });
    }

    // File Explorer: 多くのファイルを触る
    if (summary.totalFilesEdited >= 50) {
      styles.push({
        id: 'file_explorer',
        category: 'focus',
        emoji: '🗺️',
        title: t('styleFileExplorerTitle', lang),
        description: t('styleFileExplorerDesc', lang),
        observation: t('styleFileExplorerObs', lang, { count: summary.totalFilesEdited })
      });
    }
  }

  /**
   * 探索系スタイルを検出
   */
  private detectExplorationStyles(summary: WeeklySummary, styles: CodingStyle[], lang: Language): void {
    // Language Explorer: 複数言語を使用
    const usedLanguages = summary.topLanguages.filter(l => l.percentage >= 5);
    if (usedLanguages.length >= 4) {
      styles.push({
        id: 'language_explorer',
        category: 'exploration',
        emoji: '🌍',
        title: t('styleLanguageExplorerTitle', lang),
        description: t('styleLanguageExplorerDesc', lang),
        observation: t('styleLanguageExplorerObs', lang, { count: usedLanguages.length })
      });
    }

    // Specialist: 1言語に特化
    if (summary.topLanguages.length > 0 && summary.topLanguages[0].percentage >= 80) {
      styles.push({
        id: 'specialist',
        category: 'exploration',
        emoji: '🔬',
        title: t('styleSpecialistTitle', lang),
        description: t('styleSpecialistDesc', lang),
        observation: t('styleSpecialistObs', lang, { lang: summary.topLanguages[0].displayName, percent: Math.round(summary.topLanguages[0].percentage) })
      });
    }

    // Consistent: 連続してコーディング（ストリーク）
    if (summary.streakDays >= 5) {
      styles.push({
        id: 'consistent',
        category: 'exploration',
        emoji: '🔥',
        title: t('styleConsistentTitle', lang),
        description: t('styleConsistentDesc', lang),
        observation: t('styleConsistentObs', lang, { days: summary.streakDays })
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

  // ========================================
  // 年間専用スタイル検出
  // ========================================

  /**
   * 年間サマリー専用のスタイル検出
   * ※通常スタイルは使用しない、表示数の上限なし
   */
  public detectYearlyStyles(summary: YearlySummary, lang: Language = 'ja'): CodingStyle[] {
    const styles: CodingStyle[] = [];

    // 1. 年間専用スタイルを検出
    this.detectYearlyExclusiveStyles(summary, styles, lang);

    // 2. マスター版スタイルを検出（厳しい閾値、進化した絵文字）
    this.detectMasterStyles(summary, styles, lang);

    // ※通常スタイルは年間では使用しない
    // ※表示数の上限なし（すべて表示）
    return styles;
  }

  /**
   * 年間専用スタイルを検出（年間レビューでのみ表示）
   */
  private detectYearlyExclusiveStyles(summary: YearlySummary, styles: CodingStyle[], lang: Language): void {
    const totalHours = summary.totalCodingTimeMs / (1000 * 60 * 60);

    // 年間チャンピオン: 500時間以上
    if (totalHours >= 500) {
      styles.push({
        id: 'annual_champion',
        category: 'time',
        emoji: '🏆',
        title: t('styleAnnualChampionTitle', lang),
        description: t('styleAnnualChampionDesc', lang),
        observation: t('styleAnnualChampionObs', lang, { hours: Math.round(totalHours) }),
        isYearlyExclusive: true
      });
    }

    // 成長の星: 新言語3つ以上（languageGrowthのisNewフラグで判定）
    const newLanguages = summary.languageGrowth?.filter(l => {
      // 月別使用量の最初の方が0で後の方が使われている = 新言語
      const monthlyUsage = l.monthlyUsage || [];
      const firstHalf = monthlyUsage.slice(0, 6).reduce((a, b) => a + b, 0);
      const secondHalf = monthlyUsage.slice(6).reduce((a, b) => a + b, 0);
      return firstHalf === 0 && secondHalf > 0;
    }) || [];
    if (newLanguages.length >= 3) {
      styles.push({
        id: 'growth_star',
        category: 'exploration',
        emoji: '💫',
        title: t('styleGrowthStarTitle', lang),
        description: t('styleGrowthStarDesc', lang),
        observation: t('styleGrowthStarObs', lang, { count: newLanguages.length }),
        isYearlyExclusive: true
      });
    }

    // 四季の覇者: 全四半期で活動
    const quarterlyActivity = this.checkQuarterlyActivity(summary.monthlyBreakdown);
    if (quarterlyActivity.allActive) {
      styles.push({
        id: 'seasonal_master',
        category: 'rhythm',
        emoji: '🌸',
        title: t('styleSeasonalMasterTitle', lang),
        description: t('styleSeasonalMasterDesc', lang),
        observation: t('styleSeasonalMasterObs', lang),
        isYearlyExclusive: true
      });
    }

    // プロジェクト建築家: 10プロジェクト以上
    if (summary.topProjects.length >= 10) {
      styles.push({
        id: 'project_architect',
        category: 'focus',
        emoji: '🏗️',
        title: t('styleProjectArchitectTitle', lang),
        description: t('styleProjectArchitectDesc', lang),
        observation: t('styleProjectArchitectObs', lang, { count: summary.topProjects.length }),
        isYearlyExclusive: true
      });
    }

    // コードの海の主: 1000ファイル以上
    if (summary.totalFilesEdited >= 1000) {
      styles.push({
        id: 'code_explorer',
        category: 'focus',
        emoji: '🦈',
        title: t('styleCodeExplorerTitle', lang),
        description: t('styleCodeExplorerDesc', lang),
        observation: t('styleCodeExplorerObs', lang, { count: summary.totalFilesEdited }),
        isYearlyExclusive: true
      });
    }
  }

  /**
   * マスター版スタイルを検出（通常スタイルの進化版、より厳しい閾値）
   */
  private detectMasterStyles(summary: YearlySummary, styles: CodingStyle[], lang: Language): void {
    const activeDays = summary.dailyBreakdown.filter(d => d.totalTimeMs > 0).length;
    const longestSessionHours = summary.longestSessionMs / (1000 * 60 * 60);

    // マスター版: 昇龍の歩み（200日以上）🐢→🐉
    if (activeDays >= 200) {
      styles.push({
        id: 'steady_coder',
        category: 'time',
        emoji: '🐉',
        title: t('styleSteadyCoderMasterTitle', lang),
        description: t('styleSteadyCoderMasterDesc', lang),
        observation: t('styleSteadyCoderObs', lang, { days: activeDays }),
        isMaster: true
      });
    }

    // マスター版: 超人ランナー（6時間以上）🏃→🦸
    if (longestSessionHours >= 6) {
      styles.push({
        id: 'marathon_runner',
        category: 'time',
        emoji: '🦸',
        title: t('styleMarathonRunnerMasterTitle', lang),
        description: t('styleMarathonRunnerMasterDesc', lang),
        observation: t('styleMarathonRunnerObs', lang, { duration: formatDuration(summary.longestSessionMs) }),
        isMaster: true
      });
    }

    // マスター版: 闘夜の支配者（40%以上）🦉→🧛
    if (summary.nightOwlPercentage >= 40) {
      styles.push({
        id: 'night_owl',
        category: 'rhythm',
        emoji: '🧛',
        title: t('styleNightOwlMasterTitle', lang),
        description: t('styleNightOwlMasterDesc', lang),
        observation: t('styleNightOwlObs', lang, { percent: Math.round(summary.nightOwlPercentage) }),
        isMaster: true
      });
    }

    // マスター版: 不滅の炎（30日連続以上）🔥→🌋
    if (summary.streakDays >= 30) {
      styles.push({
        id: 'consistent',
        category: 'exploration',
        emoji: '🌋',
        title: t('styleConsistentMasterTitle', lang),
        description: t('styleConsistentMasterDesc', lang),
        observation: t('styleConsistentObs', lang, { days: summary.streakDays }),
        isMaster: true
      });
    }

    // マスター版: 黎明の覇者（30%以上）🐓→🌅
    const morningTime = this.calculateTimeRange(summary.hourlyDistribution, 6, 9);
    const totalTime = summary.hourlyDistribution.reduce((a, b) => a + b, 0);
    if (totalTime > 0 && morningTime / totalTime >= 0.3) {
      styles.push({
        id: 'early_bird',
        category: 'rhythm',
        emoji: '🌅',
        title: t('styleEarlyBirdMasterTitle', lang),
        description: t('styleEarlyBirdMasterDesc', lang),
        observation: t('styleEarlyBirdObs', lang, { percent: Math.round(morningTime / totalTime * 100) }),
        isMaster: true
      });
    }

    // マスター版: 一途の極み（80%以上）🎯→💎
    if (summary.topProjects.length > 0 && summary.topProjects[0].percentage >= 80) {
      styles.push({
        id: 'deep_focus',
        category: 'focus',
        emoji: '💎',
        title: t('styleDeepFocusMasterTitle', lang),
        description: t('styleDeepFocusMasterDesc', lang),
        observation: t('styleDeepFocusObs', lang, { project: summary.topProjects[0].name, percent: Math.round(summary.topProjects[0].percentage) }),
        isMaster: true
      });
    }

    // マスター版: 銀河の開拓者（6言語以上）🌍→🚀
    const usedLanguages = summary.topLanguages.filter(l => l.percentage >= 5);
    if (usedLanguages.length >= 6) {
      styles.push({
        id: 'language_explorer',
        category: 'exploration',
        emoji: '🚀',
        title: t('styleLanguageExplorerMasterTitle', lang),
        description: t('styleLanguageExplorerMasterDesc', lang),
        observation: t('styleLanguageExplorerObs', lang, { count: usedLanguages.length }),
        isMaster: true
      });
    }

    // マスター版: 言語の魔術師（90%以上）🔬→🧙
    if (summary.topLanguages.length > 0 && summary.topLanguages[0].percentage >= 90) {
      styles.push({
        id: 'specialist',
        category: 'exploration',
        emoji: '🧙',
        title: t('styleSpecialistMasterTitle', lang),
        description: t('styleSpecialistMasterDesc', lang),
        observation: t('styleSpecialistObs', lang, { lang: summary.topLanguages[0].displayName, percent: Math.round(summary.topLanguages[0].percentage) }),
        isMaster: true
      });
    }

    // マスター版: 阿修羅（5プロジェクト以上で各15%以上）🎪→🔱
    const activeProjects = summary.topProjects.filter(p => p.percentage >= 15);
    if (activeProjects.length >= 5) {
      styles.push({
        id: 'multi_tasker',
        category: 'focus',
        emoji: '🔱',
        title: t('styleMultiTaskerMasterTitle', lang),
        description: t('styleMultiTaskerMasterDesc', lang),
        observation: t('styleMultiTaskerMasterObs', lang, { count: activeProjects.length }),
        isMaster: true
      });
    }
  }

  /**
   * 四半期ごとの活動をチェック
   */
  private checkQuarterlyActivity(monthlyBreakdown: MonthBreakdown[]): { allActive: boolean; quarters: boolean[] } {
    // Q1: 1-3月, Q2: 4-6月, Q3: 7-9月, Q4: 10-12月
    const quarters = [false, false, false, false];

    for (const month of monthlyBreakdown) {
      const monthNum = month.month;
      if (monthNum >= 1 && monthNum <= 3 && month.totalTimeMs > 0) quarters[0] = true;
      if (monthNum >= 4 && monthNum <= 6 && month.totalTimeMs > 0) quarters[1] = true;
      if (monthNum >= 7 && monthNum <= 9 && month.totalTimeMs > 0) quarters[2] = true;
      if (monthNum >= 10 && monthNum <= 12 && month.totalTimeMs > 0) quarters[3] = true;
    }

    return {
      allActive: quarters.every(q => q),
      quarters
    };
  }
}
