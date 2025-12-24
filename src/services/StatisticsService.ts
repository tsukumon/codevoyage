import { StorageService } from './StorageService';
import { CodingStyleService } from './CodingStyleService';
import { Language } from '../i18n/translations';
import {
  WeeklySummary,
  MonthlySummary,
  YearlySummary,
  DailyStats,
  ProjectStat,
  LanguageStat,
  FileStat,
  WeekBreakdown,
  MonthBreakdown,
  LanguageGrowthData
} from '../types';
import {
  getWeekBounds,
  getMonthBounds,
  getYearBounds,
  getDayOfWeek,
  getDayNameEn,
  getWeekNumber,
  getMonthName,
  isDecember
} from '../utils/dateUtils';
import { getLanguageDisplayName } from '../utils/languageUtils';
import { generateMockWeeklySummary, generateMockMonthlySummary, generateMockYearlySummary } from '../utils/mockData';

export class StatisticsService {
  private storageService: StorageService;
  private codingStyleService: CodingStyleService;
  private useMockData: boolean = false;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
    this.codingStyleService = new CodingStyleService();
  }

  /**
   * モックデータモードを設定
   */
  public setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
  }

  /**
   * モックデータモードかどうか
   */
  public isUsingMockData(): boolean {
    return this.useMockData;
  }

  /**
   * 今日の総時間を取得
   */
  public getTodayTotal(): number {
    const stats = this.storageService.getOrCreateTodayStats();
    return stats.totalTimeMs;
  }

  /**
   * 週間サマリーを生成
   */
  public generateWeeklySummary(weekOffset: number = 0): WeeklySummary | null {
    // モックデータモードの場合はモックデータを返す
    if (this.useMockData) {
      return generateMockWeeklySummary(weekOffset);
    }

    const { start, end } = getWeekBounds(weekOffset);
    const dailyStats = this.storageService.getStatsRange(start, end);

    // データがない場合はnullを返す
    const totalTime = dailyStats.reduce((sum, d) => sum + d.totalTimeMs, 0);
    if (totalTime === 0) {
      return null;
    }

    // 総時間を計算
    const totalCodingTimeMs = dailyStats.reduce(
      (sum, day) => sum + day.totalTimeMs,
      0
    );

    // プロジェクト時間を集計
    const projectTimes = this.aggregateProjectTimes(dailyStats);
    const topProjects = this.calculateTopProjects(projectTimes, totalCodingTimeMs);

    // 言語時間を集計
    const languageTimes = this.aggregateLanguageTimes(dailyStats);
    const topLanguages = this.calculateTopLanguages(languageTimes, totalCodingTimeMs);

    // ファイル時間を集計
    const fileData = this.aggregateFileData(dailyStats);
    const topFiles = this.calculateTopFiles(fileData.times, fileData.workspaces);

    // ピーク日を検出
    const peakDay = this.findPeakDay(dailyStats);

    // ピーク時間を検出
    const hourlyDistribution = this.aggregateHourlyDistribution(dailyStats);
    const peakHour = this.findPeakHour(hourlyDistribution);

    // 曜日別分布を計算
    const dayOfWeekDistribution = this.calculateDayOfWeekDistribution(dailyStats);

    // 最長セッションを検出
    const { longestSessionMs, longestSessionDate } = this.findLongestSession(dailyStats);

    // ストリークを計算
    const streakDays = this.calculateStreak(dailyStats);

    // 夜ふかし時間を集計
    const nightOwlTimeMs = dailyStats.reduce(
      (sum, day) => sum + day.nightOwlTimeMs,
      0
    );
    const nightOwlPercentage = totalCodingTimeMs > 0
      ? (nightOwlTimeMs / totalCodingTimeMs) * 100
      : 0;

    // 編集ファイル数と文字数を集計
    const totalFilesEdited = dailyStats.reduce(
      (sum, day) => sum + day.editedFileCount,
      0
    );
    const totalCharactersEdited = dailyStats.reduce(
      (sum, day) => sum + day.totalCharactersEdited,
      0
    );

    // 先週との比較
    const previousWeekBounds = getWeekBounds(weekOffset - 1);
    const previousWeekStats = this.storageService.getStatsRange(
      previousWeekBounds.start,
      previousWeekBounds.end
    );
    const previousTotal = previousWeekStats.reduce(
      (sum, day) => sum + day.totalTimeMs,
      0
    );
    const comparisonToPreviousWeek = previousTotal > 0
      ? ((totalCodingTimeMs - previousTotal) / previousTotal) * 100
      : 0;

    // サマリーを作成
    return {
      weekStartDate: start,
      weekEndDate: end,
      totalCodingTimeMs,
      dailyBreakdown: dailyStats,
      topProjects,
      topLanguages,
      topFiles,
      peakDay,
      peakHour,
      longestSessionMs,
      longestSessionDate,
      dayOfWeekDistribution,
      hourlyDistribution,
      streakDays,
      nightOwlTimeMs,
      nightOwlPercentage,
      totalFilesEdited,
      totalCharactersEdited,
      comparisonToPreviousWeek
    };
  }

  /**
   * 月間サマリーを生成
   */
  public generateMonthlySummary(monthOffset: number = 0, lang: Language = 'ja'): MonthlySummary | null {
    // モックデータモードの場合はモックデータを返す
    if (this.useMockData) {
      return generateMockMonthlySummary(monthOffset);
    }

    const { start, end, monthName } = getMonthBounds(monthOffset);
    const dailyStats = this.storageService.getStatsRange(start, end);

    // データがない場合はnullを返す
    const totalTime = dailyStats.reduce((sum, d) => sum + d.totalTimeMs, 0);
    if (totalTime === 0) {
      return null;
    }

    // 基本の週間サマリーと同じ計算を行う
    const totalCodingTimeMs = dailyStats.reduce(
      (sum, day) => sum + day.totalTimeMs,
      0
    );

    const projectTimes = this.aggregateProjectTimes(dailyStats);
    const topProjects = this.calculateTopProjects(projectTimes, totalCodingTimeMs);

    const languageTimes = this.aggregateLanguageTimes(dailyStats);
    const topLanguages = this.calculateTopLanguages(languageTimes, totalCodingTimeMs);

    const fileData = this.aggregateFileData(dailyStats);
    const topFiles = this.calculateTopFiles(fileData.times, fileData.workspaces);

    const peakDay = this.findPeakDay(dailyStats);
    const hourlyDistribution = this.aggregateHourlyDistribution(dailyStats);
    const peakHour = this.findPeakHour(hourlyDistribution);
    const dayOfWeekDistribution = this.calculateDayOfWeekDistribution(dailyStats);
    const { longestSessionMs, longestSessionDate } = this.findLongestSession(dailyStats);
    const streakDays = this.calculateStreak(dailyStats);

    const nightOwlTimeMs = dailyStats.reduce(
      (sum, day) => sum + day.nightOwlTimeMs,
      0
    );
    const nightOwlPercentage = totalCodingTimeMs > 0
      ? (nightOwlTimeMs / totalCodingTimeMs) * 100
      : 0;

    const totalFilesEdited = dailyStats.reduce(
      (sum, day) => sum + day.editedFileCount,
      0
    );
    const totalCharactersEdited = dailyStats.reduce(
      (sum, day) => sum + day.totalCharactersEdited,
      0
    );

    // 週別内訳を計算
    const weeklyBreakdown = this.calculateWeeklyBreakdown(dailyStats);

    // ベストウィークを検出
    const bestWeek = weeklyBreakdown.length > 0
      ? weeklyBreakdown.reduce((best, week) =>
          week.totalTimeMs > best.totalTimeMs ? week : best
        )
      : null;

    // ベストデイを検出
    const bestDay = dailyStats.length > 0
      ? dailyStats.reduce((best, day) =>
          day.totalTimeMs > best.totalTimeMs ? day : best
        )
      : null;

    // アクティブ日数
    const activeDaysCount = dailyStats.filter(d => d.totalTimeMs > 0).length;

    // 先月との比較
    const previousMonthBounds = getMonthBounds(monthOffset - 1);
    const previousMonthStats = this.storageService.getStatsRange(
      previousMonthBounds.start,
      previousMonthBounds.end
    );
    const previousTotal = previousMonthStats.reduce(
      (sum, day) => sum + day.totalTimeMs,
      0
    );
    const comparisonToPreviousMonth = previousTotal > 0
      ? ((totalCodingTimeMs - previousTotal) / previousTotal) * 100
      : 0;

    // 基本サマリーを作成
    const baseSummary: Omit<MonthlySummary, 'codingStyles'> = {
      periodType: 'month',
      monthName,
      weekStartDate: start,
      weekEndDate: end,
      totalCodingTimeMs,
      dailyBreakdown: dailyStats,
      topProjects,
      topLanguages,
      topFiles,
      peakDay,
      peakHour,
      longestSessionMs,
      longestSessionDate,
      dayOfWeekDistribution,
      hourlyDistribution,
      streakDays,
      nightOwlTimeMs,
      nightOwlPercentage,
      totalFilesEdited,
      totalCharactersEdited,
      comparisonToPreviousWeek: 0,
      weeklyBreakdown,
      bestWeek,
      bestDay,
      activeDaysCount,
      comparisonToPreviousMonth
    };

    // コーディングスタイルを検出
    const codingStyles = this.codingStyleService.detectStyles(baseSummary as WeeklySummary, lang);

    return {
      ...baseSummary,
      codingStyles
    };
  }

  /**
   * 年間サマリーを生成（12月のみ有効）
   */
  public generateYearlySummary(yearOffset: number = 0, lang: Language = 'ja'): YearlySummary | null {
    // モックデータモードの場合はモックデータを返す
    if (this.useMockData) {
      return generateMockYearlySummary(yearOffset);
    }

    // 12月以外は null を返す（呼び出し側でチェック済みの想定だが念のため）
    if (!isDecember() && yearOffset === 0) {
      return null;
    }

    const { start, end, year } = getYearBounds(yearOffset);
    const dailyStats = this.storageService.getStatsRange(start, end);

    // データがない場合はnullを返す
    const totalTime = dailyStats.reduce((sum, d) => sum + d.totalTimeMs, 0);
    if (totalTime === 0) {
      return null;
    }

    // 基本計算
    const totalCodingTimeMs = dailyStats.reduce(
      (sum, day) => sum + day.totalTimeMs,
      0
    );

    const projectTimes = this.aggregateProjectTimes(dailyStats);
    const topProjects = this.calculateTopProjects(projectTimes, totalCodingTimeMs);

    const languageTimes = this.aggregateLanguageTimes(dailyStats);
    const topLanguages = this.calculateTopLanguages(languageTimes, totalCodingTimeMs);

    const fileData = this.aggregateFileData(dailyStats);
    const topFiles = this.calculateTopFiles(fileData.times, fileData.workspaces);

    const peakDay = this.findPeakDay(dailyStats);
    const hourlyDistribution = this.aggregateHourlyDistribution(dailyStats);
    const peakHour = this.findPeakHour(hourlyDistribution);
    const dayOfWeekDistribution = this.calculateDayOfWeekDistribution(dailyStats);
    const { longestSessionMs, longestSessionDate } = this.findLongestSession(dailyStats);
    const streakDays = this.calculateStreak(dailyStats);

    const nightOwlTimeMs = dailyStats.reduce(
      (sum, day) => sum + day.nightOwlTimeMs,
      0
    );
    const nightOwlPercentage = totalCodingTimeMs > 0
      ? (nightOwlTimeMs / totalCodingTimeMs) * 100
      : 0;

    const totalFilesEdited = dailyStats.reduce(
      (sum, day) => sum + day.editedFileCount,
      0
    );
    const totalCharactersEdited = dailyStats.reduce(
      (sum, day) => sum + day.totalCharactersEdited,
      0
    );

    // 月別内訳を計算
    const monthlyBreakdown = this.calculateMonthlyBreakdown(dailyStats, year);

    // ベストマンスを検出
    const bestMonth = monthlyBreakdown.length > 0
      ? monthlyBreakdown.reduce((best, month) =>
          month.totalTimeMs > best.totalTimeMs ? month : best
        )
      : null;

    // 週別内訳を計算
    const weeklyBreakdown = this.calculateWeeklyBreakdown(dailyStats);

    // ベストウィークを検出
    const bestWeek = weeklyBreakdown.length > 0
      ? weeklyBreakdown.reduce((best, week) =>
          week.totalTimeMs > best.totalTimeMs ? week : best
        )
      : null;

    // ベストデイを検出
    const bestDay = dailyStats.length > 0
      ? dailyStats.reduce((best, day) =>
          day.totalTimeMs > best.totalTimeMs ? day : best
        )
      : null;

    // アクティブ日数
    const totalDaysActive = dailyStats.filter(d => d.totalTimeMs > 0).length;

    // 年間最長ストリーク
    const longestStreakInYear = this.calculateLongestStreak(dailyStats);

    // 推定行数（文字数 / 40文字）
    const totalLinesEstimate = Math.floor(totalCharactersEdited / 40);

    // 言語の成長データ
    const languageGrowth = this.calculateLanguageGrowth(dailyStats, year);

    // 前年との比較
    const previousYearBounds = getYearBounds(yearOffset - 1);
    const previousYearStats = this.storageService.getStatsRange(
      previousYearBounds.start,
      previousYearBounds.end
    );
    const previousTotal = previousYearStats.reduce(
      (sum, day) => sum + day.totalTimeMs,
      0
    );
    const comparisonToPreviousYear = previousTotal > 0
      ? ((totalCodingTimeMs - previousTotal) / previousTotal) * 100
      : 0;

    // 基本サマリーを作成
    const baseSummary: Omit<YearlySummary, 'codingStyles'> = {
      periodType: 'year',
      year,
      weekStartDate: start,
      weekEndDate: end,
      totalCodingTimeMs,
      dailyBreakdown: dailyStats,
      topProjects,
      topLanguages,
      topFiles,
      peakDay,
      peakHour,
      longestSessionMs,
      longestSessionDate,
      dayOfWeekDistribution,
      hourlyDistribution,
      streakDays,
      nightOwlTimeMs,
      nightOwlPercentage,
      totalFilesEdited,
      totalCharactersEdited,
      comparisonToPreviousWeek: 0,
      monthlyBreakdown,
      bestMonth,
      bestWeek,
      bestDay,
      totalDaysActive,
      longestStreakInYear,
      totalLinesEstimate,
      languageGrowth,
      comparisonToPreviousYear
    };

    // コーディングスタイルを検出（年間専用メソッドを使用）
    const codingStyles = this.codingStyleService.detectYearlyStyles(baseSummary as YearlySummary, lang);

    return {
      ...baseSummary,
      codingStyles
    };
  }

  /**
   * 週別内訳を計算
   */
  private calculateWeeklyBreakdown(dailyStats: DailyStats[]): WeekBreakdown[] {
    const weekMap = new Map<number, { stats: DailyStats[]; startDate: string; endDate: string }>();

    for (const day of dailyStats) {
      const weekNum = getWeekNumber(day.date);
      if (!weekMap.has(weekNum)) {
        weekMap.set(weekNum, { stats: [], startDate: day.date, endDate: day.date });
      }
      const week = weekMap.get(weekNum)!;
      week.stats.push(day);
      if (day.date < week.startDate) week.startDate = day.date;
      if (day.date > week.endDate) week.endDate = day.date;
    }

    const breakdowns: WeekBreakdown[] = [];
    for (const [weekNumber, data] of weekMap) {
      const totalTimeMs = data.stats.reduce((sum, d) => sum + d.totalTimeMs, 0);
      const languageTimes = this.aggregateLanguageTimes(data.stats);
      const topLang = Object.entries(languageTimes)
        .sort((a, b) => b[1] - a[1])[0];

      breakdowns.push({
        weekNumber,
        weekStartDate: data.startDate,
        weekEndDate: data.endDate,
        totalTimeMs,
        topLanguage: topLang ? getLanguageDisplayName(topLang[0]) : ''
      });
    }

    return breakdowns.sort((a, b) => a.weekNumber - b.weekNumber);
  }

  /**
   * 月別内訳を計算
   */
  private calculateMonthlyBreakdown(dailyStats: DailyStats[], year: number): MonthBreakdown[] {
    const monthMap = new Map<number, DailyStats[]>();

    for (const day of dailyStats) {
      const date = new Date(day.date);
      const month = date.getMonth() + 1; // 1-12
      if (!monthMap.has(month)) {
        monthMap.set(month, []);
      }
      monthMap.get(month)!.push(day);
    }

    const breakdowns: MonthBreakdown[] = [];
    for (const [month, stats] of monthMap) {
      const totalTimeMs = stats.reduce((sum, d) => sum + d.totalTimeMs, 0);
      const activeDays = stats.filter(d => d.totalTimeMs > 0).length;

      const languageTimes = this.aggregateLanguageTimes(stats);
      const topLang = Object.entries(languageTimes)
        .sort((a, b) => b[1] - a[1])[0];

      const projectTimes = this.aggregateProjectTimes(stats);
      const topProj = Object.entries(projectTimes)
        .sort((a, b) => b[1] - a[1])[0];

      breakdowns.push({
        month,
        monthName: getMonthName(month),
        totalTimeMs,
        activeDays,
        topLanguage: topLang ? getLanguageDisplayName(topLang[0]) : '',
        topProject: topProj ? (topProj[0].split('/').pop() || topProj[0]) : ''
      });
    }

    return breakdowns.sort((a, b) => a.month - b.month);
  }

  /**
   * 年間最長ストリークを計算
   */
  private calculateLongestStreak(dailyStats: DailyStats[]): number {
    const sorted = [...dailyStats]
      .filter(d => d.totalTimeMs > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (sorted.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1].date);
      const currDate = new Date(sorted[i].date);
      const diffDays = Math.round(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  }

  /**
   * 言語の成長データを計算
   */
  private calculateLanguageGrowth(dailyStats: DailyStats[], year: number): LanguageGrowthData[] {
    // 月ごとの言語使用時間を集計
    const languageMonthlyData = new Map<string, number[]>();

    for (const day of dailyStats) {
      const date = new Date(day.date);
      const month = date.getMonth(); // 0-11

      for (const [lang, time] of Object.entries(day.languageTime)) {
        if (!languageMonthlyData.has(lang)) {
          languageMonthlyData.set(lang, new Array(12).fill(0));
        }
        languageMonthlyData.get(lang)![month] += time;
      }
    }

    const growthData: LanguageGrowthData[] = [];
    for (const [langId, monthlyUsage] of languageMonthlyData) {
      const totalTimeMs = monthlyUsage.reduce((sum, t) => sum + t, 0);

      // トレンドを計算（前半6ヶ月 vs 後半6ヶ月）
      const firstHalf = monthlyUsage.slice(0, 6).reduce((sum, t) => sum + t, 0);
      const secondHalf = monthlyUsage.slice(6, 12).reduce((sum, t) => sum + t, 0);

      let trend: 'increasing' | 'decreasing' | 'stable';
      if (secondHalf > firstHalf * 1.2) {
        trend = 'increasing';
      } else if (secondHalf < firstHalf * 0.8) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }

      growthData.push({
        languageId: langId,
        displayName: getLanguageDisplayName(langId),
        monthlyUsage,
        trend,
        totalTimeMs
      });
    }

    // 総時間でソート
    return growthData.sort((a, b) => b.totalTimeMs - a.totalTimeMs).slice(0, 10);
  }

  /**
   * プロジェクト時間を集計
   */
  private aggregateProjectTimes(dailyStats: DailyStats[]): Record<string, number> {
    const aggregated: Record<string, number> = {};

    for (const day of dailyStats) {
      for (const [project, time] of Object.entries(day.projectTime)) {
        aggregated[project] = (aggregated[project] || 0) + time;
      }
    }

    return aggregated;
  }

  /**
   * トッププロジェクトを計算
   */
  private calculateTopProjects(
    projectTimes: Record<string, number>,
    totalTime: number
  ): ProjectStat[] {
    return Object.entries(projectTimes)
      .map(([path, time]) => ({
        name: path.split('/').pop() || path.split('\\').pop() || path,
        path,
        totalTimeMs: time,
        percentage: totalTime > 0 ? (time / totalTime) * 100 : 0,
        topLanguage: ''
      }))
      .sort((a, b) => b.totalTimeMs - a.totalTimeMs)
      .slice(0, 5);
  }

  /**
   * 言語時間を集計
   */
  private aggregateLanguageTimes(dailyStats: DailyStats[]): Record<string, number> {
    const aggregated: Record<string, number> = {};

    for (const day of dailyStats) {
      for (const [lang, time] of Object.entries(day.languageTime)) {
        aggregated[lang] = (aggregated[lang] || 0) + time;
      }
    }

    return aggregated;
  }

  /**
   * トップ言語を計算
   */
  private calculateTopLanguages(
    languageTimes: Record<string, number>,
    totalTime: number
  ): LanguageStat[] {
    return Object.entries(languageTimes)
      .map(([langId, time]) => ({
        languageId: langId,
        displayName: getLanguageDisplayName(langId),
        totalTimeMs: time,
        percentage: totalTime > 0 ? (time / totalTime) * 100 : 0
      }))
      .sort((a, b) => b.totalTimeMs - a.totalTimeMs)
      .slice(0, 5);
  }

  /**
   * ファイルアクセスとワークスペースを集計
   */
  private aggregateFileData(dailyStats: DailyStats[]): {
    times: Record<string, number>;
    workspaces: Record<string, string>;
  } {
    const times: Record<string, number> = {};
    const workspaces: Record<string, string> = {};

    for (const day of dailyStats) {
      // 新形式 (fileTimeMs) をサポート
      if (day.fileTimeMs) {
        for (const [file, timeMs] of Object.entries(day.fileTimeMs)) {
          times[file] = (times[file] || 0) + timeMs;
        }
      }
      // 既存データとの互換性のためfileAccessCountもサポート（回数→0として扱う）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((day as any).fileAccessCount && !day.fileTimeMs) {
        // 古いデータは表示しない（時間データがないため）
      }
      // ワークスペースマッピングを集計（既存データとの互換性のため存在チェック）
      if (day.fileWorkspaces) {
        for (const [file, workspace] of Object.entries(day.fileWorkspaces)) {
          workspaces[file] = workspace;
        }
      }
    }

    return { times, workspaces };
  }

  /**
   * トップファイルを計算（時間順にソート）
   */
  private calculateTopFiles(
    fileTimes: Record<string, number>,
    fileWorkspaces: Record<string, string>
  ): FileStat[] {
    const totalTime = Object.values(fileTimes).reduce((a, b) => a + b, 0);

    return Object.entries(fileTimes)
      .map(([path, timeMs]) => {
        // パスからファイル名を抽出
        const parts = path.replace(/\\/g, '/').split('/');
        const fileName = parts.pop() || path;
        // ワークスペース名が保存されていればそれを使用、なければフォールバック
        const projectName = fileWorkspaces[path] || this.extractProjectName(path);

        return {
          fileName,
          filePath: path,
          projectName,
          timeMs,
          percentage: totalTime > 0 ? (timeMs / totalTime) * 100 : 0
        };
      })
      .sort((a, b) => b.timeMs - a.timeMs)
      .slice(0, 5);
  }

  /**
   * パスからプロジェクト名を抽出
   */
  private extractProjectName(filePath: string): string {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/').filter(p => p.length > 0);

    // 一般的なプロジェクトルートを示すディレクトリを探す
    const projectIndicators = ['src', 'lib', 'app', 'packages', 'node_modules', '.git', 'dist', 'build', 'out'];

    for (let i = 0; i < parts.length; i++) {
      if (projectIndicators.includes(parts[i]) && i > 0) {
        return parts[i - 1];
      }
    }

    // プロジェクトの親ディレクトリとして一般的な名前（これらの次のディレクトリがプロジェクト）
    const parentIndicators = ['work_space', 'workspace', 'workspaces', 'projects', 'repos', 'repositories', 'github', 'code', 'dev', 'development'];

    for (let i = 0; i < parts.length; i++) {
      if (parentIndicators.includes(parts[i].toLowerCase()) && i + 1 < parts.length) {
        return parts[i + 1];
      }
    }

    // 見つからない場合は最初の有効なディレクトリ名を返す
    if (parts.length >= 2) {
      // ホームディレクトリなどをスキップ
      const skipDirs = ['home', 'users', 'user', 'c:', 'd:', 'var', 'tmp', 'mnt', 'volumes'];
      for (const part of parts) {
        if (!skipDirs.includes(part.toLowerCase())) {
          return part;
        }
      }
    }

    return parts[0] || 'Unknown';
  }

  /**
   * ピーク日を検出
   */
  private findPeakDay(dailyStats: DailyStats[]): string {
    if (dailyStats.length === 0) return '';

    const peakDay = dailyStats.reduce((peak, current) =>
      current.totalTimeMs > peak.totalTimeMs ? current : peak
    );

    const dayIndex = getDayOfWeek(peakDay.date);
    return getDayNameEn(dayIndex);
  }

  /**
   * 時間帯別分布を集計
   */
  private aggregateHourlyDistribution(dailyStats: DailyStats[]): number[] {
    const hourlyTotals = new Array(24).fill(0);

    for (const day of dailyStats) {
      day.hourlyDistribution.forEach((time, hour) => {
        hourlyTotals[hour] += time;
      });
    }

    return hourlyTotals;
  }

  /**
   * ピーク時間を検出
   */
  private findPeakHour(hourlyDistribution: number[]): number {
    let peakHour = 0;
    let maxTime = 0;

    hourlyDistribution.forEach((time, hour) => {
      if (time > maxTime) {
        maxTime = time;
        peakHour = hour;
      }
    });

    return peakHour;
  }

  /**
   * 曜日別分布を計算
   */
  private calculateDayOfWeekDistribution(dailyStats: DailyStats[]): number[] {
    const distribution = new Array(7).fill(0);

    for (const day of dailyStats) {
      const dayIndex = getDayOfWeek(day.date);
      distribution[dayIndex] += day.totalTimeMs;
    }

    return distribution;
  }

  /**
   * 最長セッションを検出
   */
  private findLongestSession(dailyStats: DailyStats[]): {
    longestSessionMs: number;
    longestSessionDate: string;
  } {
    let longestSessionMs = 0;
    let longestSessionDate = '';

    for (const day of dailyStats) {
      if (day.longestSessionMs > longestSessionMs) {
        longestSessionMs = day.longestSessionMs;
        longestSessionDate = day.date;
      }
    }

    return { longestSessionMs, longestSessionDate };
  }

  /**
   * ストリーク（連続日数）を計算
   */
  private calculateStreak(dailyStats: DailyStats[]): number {
    // 日付でソート（降順）
    const sorted = [...dailyStats]
      .filter(d => d.totalTimeMs > 0)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (sorted.length === 0) return 0;

    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1].date);
      const currDate = new Date(sorted[i].date);
      const diffDays = Math.round(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
