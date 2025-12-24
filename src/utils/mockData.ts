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
  LanguageGrowthData,
  CodingStyle
} from '../types';
import { getWeekBounds, getMonthBounds, getYearBounds, formatDate, getMonthName } from './dateUtils';

/**
 * モックの週間サマリーを生成
 */
export function generateMockWeeklySummary(weekOffset: number = 0): WeeklySummary {
  const { start, end } = getWeekBounds(weekOffset);

  // 7日分の日別統計を生成
  const dailyBreakdown = generateMockDailyStats(start);

  // 総時間を計算
  const totalCodingTimeMs = dailyBreakdown.reduce((sum, d) => sum + d.totalTimeMs, 0);

  // 時間帯分布を集計
  const hourlyDistribution = new Array(24).fill(0);
  dailyBreakdown.forEach(day => {
    day.hourlyDistribution.forEach((time, hour) => {
      hourlyDistribution[hour] += time;
    });
  });

  // 曜日分布を集計
  const dayOfWeekDistribution = dailyBreakdown.map(d => d.totalTimeMs);

  return {
    weekStartDate: start,
    weekEndDate: end,
    totalCodingTimeMs,
    dailyBreakdown,
    topProjects: generateMockProjects(),
    topLanguages: generateMockLanguages(),
    topFiles: generateMockFiles(),
    peakDay: 'Wednesday',
    peakHour: 14,
    longestSessionMs: 3 * 60 * 60 * 1000 + 42 * 60 * 1000, // 3h 42m
    longestSessionDate: start,
    dayOfWeekDistribution,
    hourlyDistribution,
    streakDays: 5,
    nightOwlTimeMs: 2 * 60 * 60 * 1000, // 2時間
    nightOwlPercentage: 12.5,
    totalFilesEdited: 47,
    totalCharactersEdited: 28472,
    comparisonToPreviousWeek: 15.3
  };
}

/**
 * モックの日別統計を生成
 */
function generateMockDailyStats(startDate: string): DailyStats[] {
  const stats: DailyStats[] = [];
  const start = new Date(startDate);

  // 各曜日の典型的なコーディング時間（時間）
  const typicalHours = [1.5, 6.5, 7.2, 8.1, 6.8, 5.2, 2.0]; // 日〜土

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay();

    const baseHours = typicalHours[dayOfWeek];
    const variation = (Math.random() - 0.5) * 2; // ±1時間のランダム変動
    const totalHours = Math.max(0, baseHours + variation);
    const totalTimeMs = totalHours * 60 * 60 * 1000;

    // 時間帯分布を生成（9時〜23時がメイン、ピークは14時頃）
    const hourlyDistribution = new Array(24).fill(0);
    if (totalTimeMs > 0) {
      const peakHour = 14 + Math.floor(Math.random() * 4) - 2;
      for (let h = 0; h < 24; h++) {
        const distance = Math.abs(h - peakHour);
        const weight = Math.max(0, 1 - distance * 0.1);
        const hourTime = totalTimeMs * weight * 0.15;
        hourlyDistribution[h] = h >= 9 && h <= 23 ? hourTime : hourTime * 0.1;
      }
    }

    // 夜ふかし時間（22時〜3時）
    let nightOwlTimeMs = 0;
    for (let h = 22; h < 24; h++) {
      nightOwlTimeMs += hourlyDistribution[h];
    }
    for (let h = 0; h < 4; h++) {
      nightOwlTimeMs += hourlyDistribution[h];
    }

    stats.push({
      date: dateStr,
      totalTimeMs,
      activeTimeMs: totalTimeMs * 0.85,
      projectTime: {
        '/home/user/projects/my-awesome-app': totalTimeMs * 0.45,
        '/home/user/projects/api-server': totalTimeMs * 0.30,
        '/home/user/projects/design-system': totalTimeMs * 0.15,
        '/home/user/projects/scripts': totalTimeMs * 0.10
      },
      languageTime: {
        'typescript': totalTimeMs * 0.40,
        'typescriptreact': totalTimeMs * 0.25,
        'css': totalTimeMs * 0.15,
        'json': totalTimeMs * 0.10,
        'markdown': totalTimeMs * 0.10
      },
      hourlyDistribution,
      fileTimeMs: {
        '/home/user/projects/my-awesome-app/src/App.tsx': totalTimeMs * 0.30,
        '/home/user/projects/api-server/src/index.ts': totalTimeMs * 0.25,
        '/home/user/projects/design-system/src/styles.css': totalTimeMs * 0.20,
        '/home/user/projects/my-awesome-app/package.json': totalTimeMs * 0.15,
        '/home/user/projects/my-awesome-app/README.md': totalTimeMs * 0.10
      },
      fileWorkspaces: {
        '/home/user/projects/my-awesome-app/src/App.tsx': 'my-awesome-app',
        '/home/user/projects/api-server/src/index.ts': 'api-server',
        '/home/user/projects/design-system/src/styles.css': 'design-system',
        '/home/user/projects/my-awesome-app/package.json': 'my-awesome-app',
        '/home/user/projects/my-awesome-app/README.md': 'my-awesome-app'
      },
      editedFileCount: Math.floor(Math.random() * 10) + 5,
      totalCharactersEdited: Math.floor(Math.random() * 5000) + 2000,
      nightOwlTimeMs,
      longestSessionMs: totalTimeMs * (0.3 + Math.random() * 0.3)
    });
  }

  return stats;
}

/**
 * モックのプロジェクト統計を生成
 */
function generateMockProjects(): ProjectStat[] {
  return [
    {
      name: 'my-awesome-app',
      path: '/home/user/projects/my-awesome-app',
      totalTimeMs: 12 * 60 * 60 * 1000, // 12時間
      percentage: 45,
      topLanguage: 'TypeScript'
    },
    {
      name: 'api-server',
      path: '/home/user/projects/api-server',
      totalTimeMs: 8 * 60 * 60 * 1000, // 8時間
      percentage: 30,
      topLanguage: 'TypeScript'
    },
    {
      name: 'design-system',
      path: '/home/user/projects/design-system',
      totalTimeMs: 4 * 60 * 60 * 1000, // 4時間
      percentage: 15,
      topLanguage: 'CSS'
    },
    {
      name: 'scripts',
      path: '/home/user/projects/scripts',
      totalTimeMs: 2.5 * 60 * 60 * 1000, // 2.5時間
      percentage: 10,
      topLanguage: 'Python'
    }
  ];
}

/**
 * モックの言語統計を生成
 */
function generateMockLanguages(): LanguageStat[] {
  return [
    {
      languageId: 'typescript',
      displayName: 'TypeScript',
      totalTimeMs: 10 * 60 * 60 * 1000,
      percentage: 40
    },
    {
      languageId: 'typescriptreact',
      displayName: 'TypeScript React',
      totalTimeMs: 6.5 * 60 * 60 * 1000,
      percentage: 25
    },
    {
      languageId: 'css',
      displayName: 'CSS',
      totalTimeMs: 4 * 60 * 60 * 1000,
      percentage: 15
    },
    {
      languageId: 'json',
      displayName: 'JSON',
      totalTimeMs: 2.5 * 60 * 60 * 1000,
      percentage: 10
    },
    {
      languageId: 'markdown',
      displayName: 'Markdown',
      totalTimeMs: 2.5 * 60 * 60 * 1000,
      percentage: 10
    }
  ];
}

/**
 * モックのファイル統計を生成
 */
function generateMockFiles(): FileStat[] {
  return [
    {
      fileName: 'App.tsx',
      filePath: '/home/user/projects/my-awesome-app/src/App.tsx',
      projectName: 'my-awesome-app',
      timeMs: 2 * 60 * 60 * 1000 + 30 * 60 * 1000, // 2h 30m
      percentage: 25
    },
    {
      fileName: 'index.ts',
      filePath: '/home/user/projects/api-server/src/index.ts',
      projectName: 'api-server',
      timeMs: 1 * 60 * 60 * 1000 + 48 * 60 * 1000, // 1h 48m
      percentage: 18
    },
    {
      fileName: 'styles.css',
      filePath: '/home/user/projects/design-system/src/styles.css',
      projectName: 'design-system',
      timeMs: 1 * 60 * 60 * 1000 + 30 * 60 * 1000, // 1h 30m
      percentage: 15
    },
    {
      fileName: 'UserService.ts',
      filePath: '/home/user/projects/api-server/src/services/UserService.ts',
      projectName: 'api-server',
      timeMs: 1 * 60 * 60 * 1000 + 12 * 60 * 1000, // 1h 12m
      percentage: 12
    },
    {
      fileName: 'Button.tsx',
      filePath: '/home/user/projects/design-system/src/components/Button.tsx',
      projectName: 'design-system',
      timeMs: 1 * 60 * 60 * 1000 + 6 * 60 * 1000, // 1h 6m
      percentage: 11
    }
  ];
}

/**
 * モックの月間サマリーを生成
 */
export function generateMockMonthlySummary(monthOffset: number = 0): MonthlySummary {
  const { start, end, monthName } = getMonthBounds(monthOffset);

  // 月の日数分の日別統計を生成
  const dailyBreakdown = generateMockMonthlyDailyStats(start, end);

  // 総時間を計算
  const totalCodingTimeMs = dailyBreakdown.reduce((sum, d) => sum + d.totalTimeMs, 0);

  // 時間帯分布を集計
  const hourlyDistribution = new Array(24).fill(0);
  dailyBreakdown.forEach(day => {
    day.hourlyDistribution.forEach((time, hour) => {
      hourlyDistribution[hour] += time;
    });
  });

  // 曜日分布を集計
  const dayOfWeekDistribution = new Array(7).fill(0);
  dailyBreakdown.forEach(day => {
    const dayIndex = new Date(day.date).getDay();
    dayOfWeekDistribution[dayIndex] += day.totalTimeMs;
  });

  // 週別内訳を生成
  const weeklyBreakdown = generateMockWeeklyBreakdown(dailyBreakdown);

  // ベストウィーク
  const bestWeek = weeklyBreakdown.reduce((best, week) =>
    week.totalTimeMs > best.totalTimeMs ? week : best
  );

  // ベストデイ
  const bestDay = dailyBreakdown.reduce((best, day) =>
    day.totalTimeMs > best.totalTimeMs ? day : best
  );

  // アクティブ日数
  const activeDaysCount = dailyBreakdown.filter(d => d.totalTimeMs > 0).length;

  // 夜ふかし時間
  const nightOwlTimeMs = dailyBreakdown.reduce((sum, d) => sum + d.nightOwlTimeMs, 0);

  return {
    periodType: 'month',
    monthName,
    weekStartDate: start,
    weekEndDate: end,
    totalCodingTimeMs,
    dailyBreakdown,
    topProjects: generateMockProjects(),
    topLanguages: generateMockLanguages(),
    topFiles: generateMockFiles(),
    peakDay: 'Wednesday',
    peakHour: 14,
    longestSessionMs: 4 * 60 * 60 * 1000 + 15 * 60 * 1000, // 4h 15m
    longestSessionDate: start,
    dayOfWeekDistribution,
    hourlyDistribution,
    streakDays: 12,
    nightOwlTimeMs,
    nightOwlPercentage: totalCodingTimeMs > 0 ? (nightOwlTimeMs / totalCodingTimeMs) * 100 : 0,
    totalFilesEdited: 156,
    totalCharactersEdited: 89472,
    comparisonToPreviousWeek: 0,
    weeklyBreakdown,
    bestWeek,
    bestDay,
    activeDaysCount,
    comparisonToPreviousMonth: 22.5,
    codingStyles: generateMockCodingStyles('month')
  };
}

/**
 * モックの年間サマリーを生成
 */
export function generateMockYearlySummary(yearOffset: number = 0): YearlySummary {
  const { start, end, year } = getYearBounds(yearOffset);

  // 年間の日別統計を生成（簡略化）
  const dailyBreakdown = generateMockYearlyDailyStats(year);

  // 総時間を計算
  const totalCodingTimeMs = dailyBreakdown.reduce((sum, d) => sum + d.totalTimeMs, 0);

  // 時間帯分布を集計
  const hourlyDistribution = new Array(24).fill(0);
  dailyBreakdown.forEach(day => {
    day.hourlyDistribution.forEach((time, hour) => {
      hourlyDistribution[hour] += time;
    });
  });

  // 曜日分布を集計
  const dayOfWeekDistribution = new Array(7).fill(0);
  dailyBreakdown.forEach(day => {
    const dayIndex = new Date(day.date).getDay();
    dayOfWeekDistribution[dayIndex] += day.totalTimeMs;
  });

  // 月別内訳を生成
  const monthlyBreakdown = generateMockMonthlyBreakdown(dailyBreakdown);

  // ベストマンス
  const bestMonth = monthlyBreakdown.reduce((best, month) =>
    month.totalTimeMs > best.totalTimeMs ? month : best
  );

  // 週別内訳を生成
  const weeklyBreakdown = generateMockWeeklyBreakdown(dailyBreakdown);

  // ベストウィーク
  const bestWeek = weeklyBreakdown.length > 0
    ? weeklyBreakdown.reduce((best, week) =>
        week.totalTimeMs > best.totalTimeMs ? week : best
      )
    : null;

  // ベストデイ
  const bestDay = dailyBreakdown.reduce((best, day) =>
    day.totalTimeMs > best.totalTimeMs ? day : best
  );

  // アクティブ日数
  const totalDaysActive = dailyBreakdown.filter(d => d.totalTimeMs > 0).length;

  // 夜ふかし時間
  const nightOwlTimeMs = dailyBreakdown.reduce((sum, d) => sum + d.nightOwlTimeMs, 0);

  // 総編集文字数
  const totalCharactersEdited = dailyBreakdown.reduce((sum, d) => sum + d.totalCharactersEdited, 0);

  // 言語成長データ
  const languageGrowth = generateMockLanguageGrowth();

  return {
    periodType: 'year',
    year,
    weekStartDate: start,
    weekEndDate: end,
    totalCodingTimeMs,
    dailyBreakdown,
    topProjects: generateMockProjects(),
    topLanguages: generateMockLanguages(),
    topFiles: generateMockFiles(),
    peakDay: 'Tuesday',
    peakHour: 15,
    longestSessionMs: 6 * 60 * 60 * 1000 + 30 * 60 * 1000, // 6h 30m
    longestSessionDate: `${year}-09-15`,
    dayOfWeekDistribution,
    hourlyDistribution,
    streakDays: 45,
    nightOwlTimeMs,
    nightOwlPercentage: totalCodingTimeMs > 0 ? (nightOwlTimeMs / totalCodingTimeMs) * 100 : 0,
    totalFilesEdited: 1247,
    totalCharactersEdited,
    comparisonToPreviousWeek: 0,
    monthlyBreakdown,
    bestMonth,
    bestWeek,
    bestDay,
    totalDaysActive,
    longestStreakInYear: 45,
    totalLinesEstimate: Math.floor(totalCharactersEdited / 40),
    languageGrowth,
    comparisonToPreviousYear: 35.2,
    codingStyles: generateMockCodingStyles('year')
  };
}

/**
 * モックのコーディングスタイルを生成
 * ※これらは「達成」ではなく「観察されたパターン」として表現
 * 月間: 通常スタイル（最大4つ）
 * 年間: 年間専用スタイル + マスター版スタイルのみ（上限なし）
 */
function generateMockCodingStyles(period: 'month' | 'year'): CodingStyle[] {
  // 月間: 通常スタイルのみ
  if (period === 'month') {
    return [
      {
        id: 'steady_coder',
        category: 'time',
        emoji: '🐢',
        title: 'コツコツ亀さん',
        description: 'コンスタントにコーディングする時間を持っていました',
        observation: '22日間コーディング'
      },
      {
        id: 'night_owl',
        category: 'rhythm',
        emoji: '🦉',
        title: '夜更かしフクロウさん',
        description: '夜の静かな時間にコーディングすることが多かったようです',
        observation: '28%が22時以降'
      },
      {
        id: 'specialist',
        category: 'exploration',
        emoji: '🔬',
        title: '一筋の求道者',
        description: '特定の言語に集中して取り組んでいました',
        observation: 'TypeScriptが65%'
      }
    ];
  } else {
    // 年間: 年間専用スタイル + マスター版スタイルのみ
    return [
      // 年間専用スタイル
      {
        id: 'annual_champion',
        category: 'time',
        emoji: '🏆',
        title: '年間チャンピオン',
        description: '1年間で膨大な時間をコーディングに捧げました',
        observation: '523時間の記録',
        isYearlyExclusive: true
      },
      {
        id: 'seasonal_master',
        category: 'rhythm',
        emoji: '🌸',
        title: '四季の覇者',
        description: '1年を通じてコンスタントに活動しました',
        observation: '春夏秋冬すべてで活動',
        isYearlyExclusive: true
      },
      {
        id: 'code_explorer',
        category: 'focus',
        emoji: '🦈',
        title: 'コードの海の主',
        description: '広大なコードの海を泳ぎ尽くしました',
        observation: '1,247ファイル編集',
        isYearlyExclusive: true
      },
      // マスター版スタイル
      {
        id: 'marathon_runner',
        category: 'time',
        emoji: '🦸',
        title: '超人ランナー',
        description: '人間離れした集中力を発揮しました',
        observation: '最長6h 30m',
        isMaster: true
      },
      {
        id: 'consistent',
        category: 'exploration',
        emoji: '🌋',
        title: '不滅の炎',
        description: '火山のように絶えることなく燃え続けました',
        observation: '45日連続',
        isMaster: true
      },
      {
        id: 'steady_coder',
        category: 'time',
        emoji: '🐉',
        title: '昇龍の歩み',
        description: '1年を通じて着実にコーディングを続け、龍のごとく昇りつめました',
        observation: '248日間コーディング',
        isMaster: true
      },
      {
        id: 'language_explorer',
        category: 'exploration',
        emoji: '🚀',
        title: '銀河の開拓者',
        description: '宇宙を旅するように多くの言語を開拓しました',
        observation: '6言語を使用',
        isMaster: true
      }
    ];
  }
}

/**
 * モックの月別日別統計を生成
 */
function generateMockMonthlyDailyStats(startDate: string, endDate: string): DailyStats[] {
  const stats: DailyStats[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const typicalHours = [1.5, 6.5, 7.2, 8.1, 6.8, 5.2, 2.0]; // 日〜土

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const dayOfWeek = d.getDay();

    const baseHours = typicalHours[dayOfWeek];
    const variation = (Math.random() - 0.5) * 2;
    const totalHours = Math.max(0, baseHours + variation);
    const totalTimeMs = totalHours * 60 * 60 * 1000;

    const hourlyDistribution = new Array(24).fill(0);
    if (totalTimeMs > 0) {
      const peakHour = 14 + Math.floor(Math.random() * 4) - 2;
      for (let h = 0; h < 24; h++) {
        const distance = Math.abs(h - peakHour);
        const weight = Math.max(0, 1 - distance * 0.1);
        const hourTime = totalTimeMs * weight * 0.15;
        hourlyDistribution[h] = h >= 9 && h <= 23 ? hourTime : hourTime * 0.1;
      }
    }

    let nightOwlTimeMs = 0;
    for (let h = 22; h < 24; h++) {
      nightOwlTimeMs += hourlyDistribution[h];
    }
    for (let h = 0; h < 4; h++) {
      nightOwlTimeMs += hourlyDistribution[h];
    }

    stats.push({
      date: dateStr,
      totalTimeMs,
      activeTimeMs: totalTimeMs * 0.85,
      projectTime: {
        '/home/user/projects/my-awesome-app': totalTimeMs * 0.45,
        '/home/user/projects/api-server': totalTimeMs * 0.30,
        '/home/user/projects/design-system': totalTimeMs * 0.15,
        '/home/user/projects/scripts': totalTimeMs * 0.10
      },
      languageTime: {
        'typescript': totalTimeMs * 0.40,
        'typescriptreact': totalTimeMs * 0.25,
        'css': totalTimeMs * 0.15,
        'json': totalTimeMs * 0.10,
        'markdown': totalTimeMs * 0.10
      },
      hourlyDistribution,
      fileTimeMs: {
        '/home/user/projects/my-awesome-app/src/App.tsx': totalTimeMs * 0.40,
        '/home/user/projects/api-server/src/index.ts': totalTimeMs * 0.30
      },
      fileWorkspaces: {
        '/home/user/projects/my-awesome-app/src/App.tsx': 'my-awesome-app',
        '/home/user/projects/api-server/src/index.ts': 'api-server'
      },
      editedFileCount: Math.floor(Math.random() * 10) + 5,
      totalCharactersEdited: Math.floor(Math.random() * 5000) + 2000,
      nightOwlTimeMs,
      longestSessionMs: totalTimeMs * (0.3 + Math.random() * 0.3)
    });
  }

  return stats;
}

/**
 * モックの年間日別統計を生成（毎月中旬のデータで簡略化）
 */
function generateMockYearlyDailyStats(year: number): DailyStats[] {
  const stats: DailyStats[] = [];
  const typicalHours = [1.5, 6.5, 7.2, 8.1, 6.8, 5.2, 2.0];

  for (let month = 0; month < 12; month++) {
    // 各月から15日分のデータを生成
    for (let day = 1; day <= 28; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      const dayOfWeek = date.getDay();

      const baseHours = typicalHours[dayOfWeek];
      const monthVariation = Math.sin((month / 12) * Math.PI * 2) * 1; // 季節変動
      const variation = (Math.random() - 0.5) * 2 + monthVariation;
      const totalHours = Math.max(0, baseHours + variation);
      const totalTimeMs = totalHours * 60 * 60 * 1000;

      const hourlyDistribution = new Array(24).fill(0);
      if (totalTimeMs > 0) {
        const peakHour = 14 + Math.floor(Math.random() * 4) - 2;
        for (let h = 0; h < 24; h++) {
          const distance = Math.abs(h - peakHour);
          const weight = Math.max(0, 1 - distance * 0.1);
          const hourTime = totalTimeMs * weight * 0.15;
          hourlyDistribution[h] = h >= 9 && h <= 23 ? hourTime : hourTime * 0.1;
        }
      }

      let nightOwlTimeMs = 0;
      for (let h = 22; h < 24; h++) {
        nightOwlTimeMs += hourlyDistribution[h];
      }
      for (let h = 0; h < 4; h++) {
        nightOwlTimeMs += hourlyDistribution[h];
      }

      stats.push({
        date: dateStr,
        totalTimeMs,
        activeTimeMs: totalTimeMs * 0.85,
        projectTime: {
          '/home/user/projects/my-awesome-app': totalTimeMs * 0.45,
          '/home/user/projects/api-server': totalTimeMs * 0.30,
          '/home/user/projects/design-system': totalTimeMs * 0.15,
          '/home/user/projects/scripts': totalTimeMs * 0.10
        },
        languageTime: {
          'typescript': totalTimeMs * (0.35 + month * 0.005), // TypeScriptが徐々に増加
          'typescriptreact': totalTimeMs * 0.25,
          'css': totalTimeMs * (0.15 - month * 0.003), // CSSが徐々に減少
          'python': totalTimeMs * (0.05 + month * 0.008), // Pythonが増加
          'rust': totalTimeMs * Math.max(0, (month - 6) * 0.02) // 後半からRust開始
        },
        hourlyDistribution,
        fileTimeMs: {},
        fileWorkspaces: {},
        editedFileCount: Math.floor(Math.random() * 10) + 5,
        totalCharactersEdited: Math.floor(Math.random() * 5000) + 2000,
        nightOwlTimeMs,
        longestSessionMs: totalTimeMs * (0.3 + Math.random() * 0.3)
      });
    }
  }

  return stats;
}

/**
 * モックの週別内訳を生成
 */
function generateMockWeeklyBreakdown(dailyStats: DailyStats[]): WeekBreakdown[] {
  const weekMap = new Map<number, { stats: DailyStats[]; startDate: string; endDate: string }>();

  for (const day of dailyStats) {
    const date = new Date(day.date);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);

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

    // トップ言語を計算
    const langTimes: Record<string, number> = {};
    for (const stat of data.stats) {
      for (const [lang, time] of Object.entries(stat.languageTime)) {
        langTimes[lang] = (langTimes[lang] || 0) + time;
      }
    }
    const topLang = Object.entries(langTimes).sort((a, b) => b[1] - a[1])[0];

    breakdowns.push({
      weekNumber,
      weekStartDate: data.startDate,
      weekEndDate: data.endDate,
      totalTimeMs,
      topLanguage: topLang ? topLang[0] : ''
    });
  }

  return breakdowns.sort((a, b) => a.weekNumber - b.weekNumber);
}

/**
 * モックの月別内訳を生成
 */
function generateMockMonthlyBreakdown(dailyStats: DailyStats[]): MonthBreakdown[] {
  const monthMap = new Map<number, DailyStats[]>();

  for (const day of dailyStats) {
    const date = new Date(day.date);
    const month = date.getMonth() + 1;
    if (!monthMap.has(month)) {
      monthMap.set(month, []);
    }
    monthMap.get(month)!.push(day);
  }

  const breakdowns: MonthBreakdown[] = [];
  for (const [month, stats] of monthMap) {
    const totalTimeMs = stats.reduce((sum, d) => sum + d.totalTimeMs, 0);
    const activeDays = stats.filter(d => d.totalTimeMs > 0).length;

    // トップ言語・プロジェクトを計算
    const langTimes: Record<string, number> = {};
    const projTimes: Record<string, number> = {};
    for (const stat of stats) {
      for (const [lang, time] of Object.entries(stat.languageTime)) {
        langTimes[lang] = (langTimes[lang] || 0) + time;
      }
      for (const [proj, time] of Object.entries(stat.projectTime)) {
        projTimes[proj] = (projTimes[proj] || 0) + time;
      }
    }

    const topLang = Object.entries(langTimes).sort((a, b) => b[1] - a[1])[0];
    const topProj = Object.entries(projTimes).sort((a, b) => b[1] - a[1])[0];

    breakdowns.push({
      month,
      monthName: getMonthName(month),
      totalTimeMs,
      activeDays,
      topLanguage: topLang ? topLang[0] : '',
      topProject: topProj ? topProj[0].split('/').pop() || '' : ''
    });
  }

  return breakdowns.sort((a, b) => a.month - b.month);
}

/**
 * モックの言語成長データを生成
 */
function generateMockLanguageGrowth(): LanguageGrowthData[] {
  return [
    {
      languageId: 'typescript',
      displayName: 'TypeScript',
      monthlyUsage: [80, 85, 90, 95, 100, 110, 115, 120, 125, 130, 140, 150].map(h => h * 60 * 60 * 1000),
      trend: 'increasing',
      totalTimeMs: 1440 * 60 * 60 * 1000
    },
    {
      languageId: 'typescriptreact',
      displayName: 'TypeScript React',
      monthlyUsage: [40, 45, 50, 55, 60, 55, 50, 55, 60, 65, 70, 75].map(h => h * 60 * 60 * 1000),
      trend: 'stable',
      totalTimeMs: 680 * 60 * 60 * 1000
    },
    {
      languageId: 'python',
      displayName: 'Python',
      monthlyUsage: [5, 8, 12, 15, 20, 25, 30, 35, 40, 45, 55, 65].map(h => h * 60 * 60 * 1000),
      trend: 'increasing',
      totalTimeMs: 355 * 60 * 60 * 1000
    },
    {
      languageId: 'rust',
      displayName: 'Rust',
      monthlyUsage: [0, 0, 0, 0, 0, 5, 10, 15, 20, 25, 30, 40].map(h => h * 60 * 60 * 1000),
      trend: 'increasing',
      totalTimeMs: 145 * 60 * 60 * 1000
    },
    {
      languageId: 'css',
      displayName: 'CSS',
      monthlyUsage: [30, 28, 25, 22, 20, 18, 15, 12, 10, 8, 6, 5].map(h => h * 60 * 60 * 1000),
      trend: 'decreasing',
      totalTimeMs: 199 * 60 * 60 * 1000
    }
  ];
}
