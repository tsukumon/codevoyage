/**
 * コーディングセッション
 */
export interface CodingSession {
  id: string;
  startTime: number;
  endTime: number | null;
  workspaceName: string;
  workspacePath: string;
  languageId: string;
  fileName: string;
  isActive: boolean;
  charactersEdited: number;
}

/**
 * 日別統計
 */
export interface DailyStats {
  date: string;
  totalTimeMs: number;
  activeTimeMs: number;
  projectTime: Record<string, number>;
  languageTime: Record<string, number>;
  hourlyDistribution: number[];
  fileAccessCount: Record<string, number>;
  fileWorkspaces: Record<string, string>; // ファイルパス → ワークスペース名のマッピング
  editedFileCount: number;
  totalCharactersEdited: number;
  nightOwlTimeMs: number;
  longestSessionMs: number;
}

/**
 * プロジェクト統計
 */
export interface ProjectStat {
  name: string;
  path: string;
  totalTimeMs: number;
  percentage: number;
  topLanguage: string;
}

/**
 * 言語統計
 */
export interface LanguageStat {
  languageId: string;
  displayName: string;
  totalTimeMs: number;
  percentage: number;
}

/**
 * ファイル統計
 */
export interface FileStat {
  fileName: string;
  filePath: string;
  projectName: string;
  accessCount: number;
  percentage: number;
}

/**
 * レビュー期間タイプ
 */
export type ReviewPeriodType = 'week' | 'month' | 'year';

/**
 * 週の内訳
 */
export interface WeekBreakdown {
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  totalTimeMs: number;
  topLanguage: string;
}

/**
 * 月の内訳
 */
export interface MonthBreakdown {
  month: number;
  monthName: string;
  totalTimeMs: number;
  activeDays: number;
  topLanguage: string;
  topProject: string;
}

/**
 * 言語成長データ
 */
export interface LanguageGrowthData {
  languageId: string;
  displayName: string;
  monthlyUsage: number[];
  trend: 'increasing' | 'decreasing' | 'stable';
  totalTimeMs: number;
}

/**
 * 週間サマリー
 */
export interface WeeklySummary {
  periodType?: ReviewPeriodType;
  weekStartDate: string;
  weekEndDate: string;
  totalCodingTimeMs: number;
  dailyBreakdown: DailyStats[];
  topProjects: ProjectStat[];
  topLanguages: LanguageStat[];
  topFiles: FileStat[];
  peakDay: string;
  peakHour: number;
  longestSessionMs: number;
  longestSessionDate: string;
  dayOfWeekDistribution: number[];
  hourlyDistribution: number[];
  streakDays: number;
  nightOwlTimeMs: number;
  nightOwlPercentage: number;
  totalFilesEdited: number;
  totalCharactersEdited: number;
  comparisonToPreviousWeek: number;
}

/**
 * 月間サマリー
 */
export interface MonthlySummary extends WeeklySummary {
  periodType: 'month';
  monthName: string;
  weeklyBreakdown: WeekBreakdown[];
  bestWeek: WeekBreakdown | null;
  bestDay: DailyStats | null;
  activeDaysCount: number;
  comparisonToPreviousMonth: number;
  codingStyles: CodingStyle[];  // 観察されたコーディングスタイル
}

/**
 * 年間サマリー
 */
export interface YearlySummary extends WeeklySummary {
  periodType: 'year';
  year: number;
  monthlyBreakdown: MonthBreakdown[];
  bestMonth: MonthBreakdown | null;
  bestWeek: WeekBreakdown | null;
  bestDay: DailyStats | null;
  totalDaysActive: number;
  longestStreakInYear: number;
  totalLinesEstimate: number;
  languageGrowth: LanguageGrowthData[];
  comparisonToPreviousYear: number;
  codingStyles: CodingStyle[];  // 観察されたコーディングスタイル
}

/**
 * ストレージスキーマ
 */
export interface StorageSchema {
  version: number;
  currentSession: CodingSession | null;
  dailyStats: Record<string, DailyStats>;
  settings: ExtensionSettings;
}

/**
 * 拡張機能設定
 */
export interface ExtensionSettings {
  idleTimeoutMs: number;
  showStatusBar: boolean;
}

/**
 * コーディングスタイルのカテゴリ
 * ※「アチーブメント」ではなく「観察されたスタイル」として表現
 */
export type CodingStyleCategory = 'time' | 'rhythm' | 'focus' | 'exploration';

/**
 * コーディングスタイルID
 */
export type CodingStyleId =
  // 時間系
  | 'steady_coder'      // コンスタントにコーディング
  | 'marathon_runner'   // 長時間セッション
  | 'sprinter'          // 短い集中セッション
  // リズム系
  | 'night_owl'         // 夜型
  | 'early_bird'        // 朝型
  | 'weekday_coder'     // 平日中心
  | 'weekend_warrior'   // 週末も活動
  // 集中系
  | 'deep_focus'        // 1つのプロジェクトに集中
  | 'multi_tasker'      // 複数プロジェクト並行
  | 'file_explorer'     // 多くのファイルを触る
  // 探索系
  | 'language_explorer' // 複数言語を使用
  | 'specialist'        // 1言語に特化
  | 'consistent'        // 連続してコーディング
  ;

/**
 * コーディングスタイル（観察された特徴）
 * ※これは「達成」ではなく「あなたのスタイル」として表示される
 */
export interface CodingStyle {
  id: CodingStyleId;
  category: CodingStyleCategory;
  emoji: string;
  title: string;
  description: string;  // ニュートラルな説明（評価ではない）
  observation: string;  // 実際に観察されたデータ
}
