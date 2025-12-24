/**
 * Language type
 */
export type Language = 'ja' | 'en';

/**
 * Translation definitions
 * Japanese: Uses existing mixed Japanese/English (current state)
 * English: English only
 */
export const translations = {
  ja: {
    // Page titles
    pageTitle: '振り返りを選択',
    noDataTitle: '航海の始まり',
    weeklyReviewTitle: 'Weekly Review',

    // Period selection screen
    chooseYourJourney: 'あなたのコーディングを振り返る',
    weekly: 'WEEKLY',
    monthly: 'MONTHLY',
    yearly: 'YEARLY',
    weeklyDesc: '1週間を振り返る',
    monthlyDesc: '1ヶ月の成長を振り返る',
    yearlyDesc: '1年間のコーディング航海記録',
    days: 'days',
    start: 'START',
    daysUntilUnlock: 'days until unlock',
    yearlyLocked: '12月になったら1年間の振り返りが解放されます',
    journeyPreparing: 'Journey を準備中...',

    // Navigation
    backToPeriodSelection: '← 期間選択に戻る',
    thisWeek: '今週',
    thisMonth: '今月',
    thisYear: '今年',
    reviewAnotherPeriod: '別の期間を振り返る',

    // Period labels
    periodWeek: '週間',
    periodMonth: '月間',
    periodYear: '年間',

    // No data screen
    voyageAwaits: 'Voyage Awaits',
    voyageJustBegun: '航海記録は<br>まだ始まったばかり',
    voyageMessage: 'コードを書くたびに、あなたの航海記録が刻まれます。<br><strong>VS Code</strong>で開発を続けて、データを蓄積しましょう。',
    demoMode: 'Demo Mode',
    demoHint: 'コマンドパレットから <code>Show Demo Review</code> でサンプルを確認できます',

    // Slide titles
    totalCodingTime: '総コーディング時間',
    totalCodingTimeThisWeek: '今週の総コーディング時間',
    totalCodingTimeThisMonth: '今月の総コーディング時間',
    totalCodingTimeThisYear: '今年の総コーディング時間',
    projectRanking: 'プロジェクトランキング',
    frequentFiles: 'よく開いたファイル',
    languagesUsed: '使用した言語',
    codingStyle: 'コーディングスタイル',
    nightOwlCoding: '夜ふかしコーディング',
    yourRecords: 'あなたの記録',
    calendarHeatmapYear: '1年間のコーディング活動',
    calendarHeatmapMonth: 'この月のコーディング活動',
    yourCodingStyle: 'あなたのコーディングスタイル',

    // Coding styles intro
    codingStylesIntroLine1: 'あなたの',
    codingStylesIntroLine2: 'コーディングスタイルを',
    codingStylesIntroLine3: '見てみましょう',

    // Style badges
    yearlyExclusiveBadge: '✨ 年間限定',
    masterBadge: '🏆 マスター',

    // Coding styles message
    codingStylesNote: 'どんなスタイルも、あなたの努力の証です。',

    // Coding style titles and descriptions
    // Time styles
    styleSteadyCoderTitle: 'コツコツ亀さん',
    styleSteadyCoderDesc: 'コンスタントにコーディングする時間を持っていました',
    styleSteadyCoderObs: '{days}日間コーディング',
    styleMarathonRunnerTitle: '耐久レースの覇者',
    styleMarathonRunnerDesc: '長めのセッションでじっくり取り組む時間がありました',
    styleMarathonRunnerObs: '最長{duration}',
    styleSprinterTitle: '電光石火くん',
    styleSprinterDesc: '短い時間で集中してコーディングするスタイル',
    styleSprinterObs: '平均{minutes}分のセッション',

    // Rhythm styles
    styleNightOwlTitle: '夜更かしフクロウさん',
    styleNightOwlDesc: '夜の静かな時間にコーディングすることが多かったようです',
    styleNightOwlObs: '{percent}%が22時以降',
    styleEarlyBirdTitle: '早起きニワトリさん',
    styleEarlyBirdDesc: '朝の時間を活用してコーディングしていました',
    styleEarlyBirdObs: '{percent}%が朝の時間帯',
    styleWeekdayCoderTitle: 'お仕事モード全開',
    styleWeekdayCoderDesc: '平日を中心にコーディングしていました',
    styleWeekdayCoderObs: '{percent}%が平日',
    styleWeekendWarriorTitle: '週末コード戦士',
    styleWeekendWarriorDesc: '週末もコーディングの時間を取っていました',
    styleWeekendWarriorObs: '{percent}%が週末',

    // Focus styles
    styleDeepFocusTitle: '没頭の職人さん',
    styleDeepFocusDesc: '1つのプロジェクトに集中して取り組んでいました',
    styleDeepFocusObs: '{project}に{percent}%',
    styleMultiTaskerTitle: '八面六臂の使い手',
    styleMultiTaskerDesc: '複数のプロジェクトを並行して進めていました',
    styleMultiTaskerObs: '{count}つのプロジェクト',
    styleFileExplorerTitle: 'ファイル探検隊長',
    styleFileExplorerDesc: '多くのファイルに触れていました',
    styleFileExplorerObs: '{count}ファイル編集',

    // Exploration styles
    styleLanguageExplorerTitle: '言語の旅人さん',
    styleLanguageExplorerDesc: '複数の言語を使ってコーディングしていました',
    styleLanguageExplorerObs: '{count}言語を使用',
    styleSpecialistTitle: '一筋の求道者',
    styleSpecialistDesc: '特定の言語に集中して取り組んでいました',
    styleSpecialistObs: '{lang}が{percent}%',
    styleConsistentTitle: '継続の鬼',
    styleConsistentDesc: '連続してコーディングを続けていました',
    styleConsistentObs: '{days}日連続',

    // Yearly exclusive styles
    styleAnnualChampionTitle: '年間チャンピオン',
    styleAnnualChampionDesc: '1年間で500時間以上コーディングしました',
    styleAnnualChampionObs: '{hours}時間の記録',
    styleGrowthStarTitle: '超新星',
    styleGrowthStarDesc: '新しい言語の世界へ飛び込みました',
    styleGrowthStarObs: '{count}言語を新たに習得',
    styleSeasonalMasterTitle: '四季の覇者',
    styleSeasonalMasterDesc: '1年を通じてコンスタントに活動しました',
    styleSeasonalMasterObs: '春夏秋冬すべてで活動',
    styleProjectArchitectTitle: 'プロジェクト建築家',
    styleProjectArchitectDesc: '多くのプロジェクトに貢献しました',
    styleProjectArchitectObs: '{count}プロジェクト',
    styleCodeExplorerTitle: 'コードの海の主',
    styleCodeExplorerDesc: '広大なコードの海を泳ぎ尽くしました',
    styleCodeExplorerObs: '{count}ファイル編集',

    // Master styles
    styleSteadyCoderMasterTitle: '昇龍の歩み',
    styleSteadyCoderMasterDesc: '1年を通じて着実にコーディングを続け、龍のごとく昇りつめました',
    styleMarathonRunnerMasterTitle: '超人ランナー',
    styleMarathonRunnerMasterDesc: '人間離れした集中力を発揮しました',
    styleNightOwlMasterTitle: '闇夜の支配者',
    styleNightOwlMasterDesc: '夜の世界を完全に支配しています',
    styleConsistentMasterTitle: '不滅の炎',
    styleConsistentMasterDesc: '火山のように絶えることなく燃え続けました',
    styleEarlyBirdMasterTitle: '黎明の覇者',
    styleEarlyBirdMasterDesc: '朝の光とともに目覚め、一日を制しました',
    styleDeepFocusMasterTitle: '一途の極み',
    styleDeepFocusMasterDesc: 'ダイヤモンドのように一点に輝きを集中させました',
    styleLanguageExplorerMasterTitle: '銀河の開拓者',
    styleLanguageExplorerMasterDesc: '宇宙を旅するように多くの言語を開拓しました',
    styleSpecialistMasterTitle: '言語の魔術師',
    styleSpecialistMasterDesc: '一つの言語を極め、魔法のように操ります',
    styleMultiTaskerMasterTitle: '阿修羅',
    styleMultiTaskerMasterDesc: '無数の腕で多くのプロジェクトを同時に操ります',
    styleMultiTaskerMasterObs: '{count}つのプロジェクトを並行',

    // Chart titles
    monthlyBreakdown: '月ごとの推移',
    weeklyBreakdown: '週ごとの推移',
    dailyBreakdown: '日ごとの推移',

    // Night owl
    nightOwlRate: '夜ふかし率',
    nightOwlTimeRange: '22:00〜4:00のコーディング時間',

    // Records labels
    daysActive: 'コードを書いた日数',
    maxStreak: '連続でコードを書いた最大日数',
    estimatedLines: '推定コード行数',
    longestSession: '最長連続コーディング時間',
    charactersEdited: '編集した文字数',
    longestCoding: '最長コーディング',
    streakDays: '連続コーディング',

    // Image export
    downloadImage: '画像をダウンロード',
    copyImage: '画像をコピー',
    downloadComplete: 'ダウンロード完了',
    copying: 'コピー中...',
    copyComplete: 'コピー完了',
    copyFailed: 'コピー失敗',

    // Pause indicator
    paused: '一時停止中',
    pressSpaceToResume: 'スペースキーで再開',
    pressSpaceToPause: 'スペースキーで一時停止',

    // Day names
    sunday: '日曜日',
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',

    // Short day names
    sun: '日',
    mon: '月',
    tue: '火',
    wed: '水',
    thu: '木',
    fri: '金',
    sat: '土',

    // Month names
    january: '1月',
    february: '2月',
    march: '3月',
    april: '4月',
    may: '5月',
    june: '6月',
    july: '7月',
    august: '8月',
    september: '9月',
    october: '10月',
    november: '11月',
    december: '12月',

    // Week labels
    weekN: '{n}週目',
    weekNShort: '{n}週',

    // Heatmap labels
    hour0: '0時',
    hour6: '6時',
    hour12: '12時',
    hour18: '18時',
    hour23: '23時',

    // Comparison labels
    comparedToLastWeek: '先週',
    comparedToLastMonth: '先月',
    comparedToLastYear: '昨年',
    comparedTo: '{label}比',

    // Distribution labels
    mostActiveMonth: '最もコードを書いた月',
    mostActiveWeek: '最もコードを書いた週',
    mostActiveHour: '最もコードを書いた時間帯',
    mostActiveDay: '最もコードを書いた曜日',

    // No data
    noData: 'データがありません',

    // Night owl messages
    nightOwl100: '🦉 完全に夜型ですね！健康に気をつけて！',
    nightOwl50: '🌙 夜更かし多めですね。たまには早めに休みましょう',
    nightOwl20: '⭐ 時々夜更かしする程度。バランス良いですね',
    nightOwl0: '☀️ 健康的な時間帯にコーディングしていますね！',

    // Breakdown messages - Yearly
    bestMonthMessage: '🏆 {month}が最も頑張った月！{days}日間アクティブでした',
    yearlyJourneyMessage: '✨ 1年間のコーディングジャーニーを振り返ろう',

    // Breakdown messages - Monthly
    bestWeekMessage: '🏆 {week}週目が最も頑張った週でした！',
    monthlyJourneyMessage: '✨ 今月のコーディングを振り返ろう',

    // Daily breakdown messages
    dailyAllDays: '🔥 毎日コーディング！{day}が最も頑張った日でした',
    dailyMostDays: '💪 {days}日間コーディング！{day}が最も集中できた日',
    dailyHalfDays: '✨ {day}を中心に{days}日間コードを書きました',
    dailyFewDays: '🌱 {days}日間のコーディング。少しずつでも継続が大切！',
    dailyNoDays: '💡 来週はコーディングの時間を作ってみましょう！',

    // Calendar heatmap messages - Yearly
    calendarYearly: '🗓️ {days}日間コーディング！{month}が最も活発な月でした',
    calendarYearlyNoMonth: '🗓️ {days}日間、コードと向き合いました',

    // Calendar heatmap messages - Monthly
    calendarMonthly: '📅 {days}日間コーディング！{day}日が最も集中した日',
    calendarMonthlyNoDay: '📅 {days}日間、コードを書きました',
    calendarDefault: '📅 コーディング活動の記録',

    // Total time messages - Increase from previous period
    totalTimeIncrease50: '🚀 {prev}から大幅アップ！成長が止まらない！',
    totalTimeIncrease20: '📈 {prev}よりしっかり時間を取れましたね！素晴らしい！',
    totalTimeIncrease0: '⬆️ {prev}より増えてます！その調子！',

    // Total time messages - Yearly
    yearlyTotal1500: '🏆 年間1500時間超え！プロフェッショナルの証！',
    yearlyTotal1000: '🔥 年間1000時間達成！情熱的な1年でした！',
    yearlyTotal500: '💪 500時間以上！着実にスキルアップした1年！',
    yearlyTotal100: '✨ コツコツ積み重ねた1年。来年も頑張ろう！',
    yearlyTotal0: '🌱 来年はもっとコードを書く時間を作ろう！',

    // Total time messages - Monthly
    monthlyTotal160: '🔥 フルタイム以上！情熱がすごい月でした！',
    monthlyTotal100: '💪 100時間超え！充実した月でしたね！',
    monthlyTotal40: '👍 安定したペースで開発できました！',
    monthlyTotal20: '✨ 着実に進歩しています。この調子で！',
    monthlyTotal0: '🌟 コツコツ積み重ねが大事。{period}もお疲れさま！',

    // Total time messages - Weekly
    weeklyTotal40: '🔥 フルタイム以上！情熱がすごい！',
    weeklyTotal20: '💪 しっかりコードと向き合った一週間でしたね',
    weeklyTotal10: '👍 安定したペースで開発を進められています',
    weeklyTotal5: '✨ 着実に進歩しています。この調子で！',
    weeklyTotal1: '🌟 コツコツ積み重ねが大事。{period}もお疲れさま！',
    weeklyTotal0_5: '👏 忙しい中でも時間を作れたこと、それ自体がすごい！',
    weeklyTotal0_1: '🎯 少しでもコードに触れた、その一歩が大切です！',
    weeklyTotal0: '💡 また来週、一緒にコードを書きましょう！',

    // Project messages
    projectMulti5: '🎯 マルチタスクの達人！複数プロジェクトを並行してますね',
    projectMulti3: '📚 バランス良く複数のプロジェクトに取り組んでいます',
    projectMulti2: '🎪 複数プロジェクトを上手く切り替えていますね',
    projectSingle: '🎯 1つのプロジェクトに集中できた{period}でした',

    // Language messages
    langMulti5: '🌍 ポリグロットプログラマー！多言語を操っていますね',
    langMulti2: '💡 {lang}をメインに、幅広く活躍中',
    langSingle: '🎯 {lang}に集中した{period}でしたね',

    // Pattern messages - Time of day
    patternMorning: '🌅 朝型プログラマー！静かな時間に集中できていますね',
    patternLateMorning: '☀️ 午前中が最も生産的な時間帯のようです',
    patternLunch: '🍽️ ランチタイムもコーディング！熱心ですね',
    patternAfternoon: '🏢 午後の集中タイムを上手く活用していますね',
    patternEvening: '🌆 夕方から夜にかけてエンジン全開ですね',
    patternNight: '🌙 深夜の静けさの中で集中していますね',

    // Pattern messages - Best period
    patternBestMonth: '📅 {month}が最も熱中した月でした。{time}',
    patternBestWeek: '📅 {week}週目が最も集中した週でした。{time}',

    // Records messages - Yearly
    recordsYearly300: '🔥 年間300日以上コーディング！驚異的な継続力です',
    recordsYearly200: '💪 年間200日以上アクティブ！素晴らしい1年でした',
    recordsYearlyStreak: '🏆 {days}日連続の記録は立派です！',
    recordsYearlyDefault: '🌟 1年間お疲れさまでした。来年も頑張りましょう！',

    // Records messages - Monthly
    recordsMonthly25: '🔥 ほぼ毎日コーディング！素晴らしい継続力です',
    recordsMonthly15: '💪 月の大半をコーディングに費やしましたね',
    recordsMonthlyLong: '🎯 長時間集中できるのは才能です。深い没入を楽しんで！',
    recordsMonthlyDefault: '🌟 今月もお疲れさまでした。来月も頑張りましょう！',

    // Records messages - Weekly
    recordsWeekly7: '🔥 毎日コードを書いている！素晴らしい継続力です',
    recordsWeekly5: '💪 平日は毎日コーディング！良いリズムですね',
    recordsWeeklyLong3: '🎯 長時間集中できるのは才能です。深い没入を楽しんで！',
    recordsWeeklyLong1: '⚡ 適度な集中時間を維持できていますね',
    recordsWeeklyDefault: '🌟 コツコツと積み重ねることが大切です',

    // File messages
    fileMulti10: '📂 多くのファイルを行き来して作業しましたね',
    fileMulti5: '📝 いくつかのファイルに集中して作業しました',
    fileFew: '🎯 少数のファイルに集中して取り組みました',
    fileNone: '📄 ファイルアクセスデータがありません',

    // Final slide messages
    finalYearlyHoursHigh: '今年は{hours}時間もコードと向き合いました！',
    finalYearlyHoursLow: '今年は{hours}時間のコーディング、お疲れさまでした。',
    finalYearlyDays: '{days}日もアクティブに活動した1年でした！',
    finalYearlyEnd: '来年も素敵なコーディングライフを！🎆',

    finalMonthlyHoursHigh: '今月は{hours}時間もコードと向き合いました！',
    finalMonthlyHoursLow: '今月も{hours}時間のコーディング、お疲れさまでした。',
    finalMonthlyStreak: '{days}日連続でコードを書いた継続力は素晴らしいです！',
    finalMonthlyEnd: '来月も素敵なコーディングライフを！',

    finalWeeklyHoursHigh: '今週は{hours}時間もコードと向き合いました。',
    finalWeeklyHoursLow: '今週も{hours}時間のコーディング、お疲れさまでした。',
    finalWeeklyStreak: '{days}日連続でコードを書いた継続力は素晴らしいです！',
    finalWeeklyEnd: '来週も素敵なコーディングライフを！',
    finalTopLang: '{lang}を中心に、着実にスキルを磨いています。',

    // Period hints
    periodHintWeek: '✨ 今週のあなたの頑張りを振り返ろう',
    periodHintMonth: '✨ 今月のあなたの頑張りを振り返ろう',
    periodHintYear: '🎊 今年のコーディングジャーニーを振り返ろう',

    // Final subtitles
    finalSubtitleWeek: '今週もお疲れさまでした',
    finalSubtitleMonth: '今月もお疲れさまでした',
    finalSubtitleYear: '今年もお疲れさまでした',

    // Date formats
    dateFormatYearMonth: '{year}年{month}月',
    dateFormatYear: '{year}年',
    dateFormatWeekOf: '{month}/{day}週',

    // Summary card
    summaryWeeklyTotalTime: 'WEEKLY TOTAL TIME',
    summaryMonthlyTotalTime: 'MONTHLY TOTAL TIME',
    summaryYearlyTotalTime: 'YEARLY TOTAL TIME',
    summaryTopProject: 'TOP PROJECT',
    summaryTopLanguage: 'TOP LANGUAGE',
    summaryActiveDays: 'ACTIVE DAYS',
    summaryTagline: 'Track your coding journey',
  },
  en: {
    // Page titles
    pageTitle: 'Choose Review',
    noDataTitle: 'Voyage Awaits',
    weeklyReviewTitle: 'Weekly Review',

    // Period selection screen
    chooseYourJourney: 'Review your coding journey',
    weekly: 'WEEKLY',
    monthly: 'MONTHLY',
    yearly: 'YEARLY',
    weeklyDesc: 'Review your week',
    monthlyDesc: 'Review your month of growth',
    yearlyDesc: 'Your year in code',
    days: 'days',
    start: 'START',
    daysUntilUnlock: 'days until unlock',
    yearlyLocked: 'Yearly review unlocks in December',
    journeyPreparing: 'Preparing your journey...',

    // Navigation
    backToPeriodSelection: '← Back to selection',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    reviewAnotherPeriod: 'Review another period',

    // Period labels
    periodWeek: 'Weekly',
    periodMonth: 'Monthly',
    periodYear: 'Yearly',

    // No data screen
    voyageAwaits: 'Voyage Awaits',
    voyageJustBegun: 'Your voyage has<br>just begun',
    voyageMessage: 'Every line of code adds to your journey.<br>Keep coding in <strong>VS Code</strong> to build your data.',
    demoMode: 'Demo Mode',
    demoHint: 'Try <code>Show Demo Review</code> from the command palette to see a sample',

    // Slide titles
    totalCodingTime: 'Total Coding Time',
    totalCodingTimeThisWeek: 'This Week\'s Total Coding Time',
    totalCodingTimeThisMonth: 'This Month\'s Total Coding Time',
    totalCodingTimeThisYear: 'This Year\'s Total Coding Time',
    projectRanking: 'Project Ranking',
    frequentFiles: 'Frequently Opened Files',
    languagesUsed: 'Languages Used',
    codingStyle: 'Coding Style',
    nightOwlCoding: 'Night Owl Coding',
    yourRecords: 'Your Records',
    calendarHeatmapYear: 'Your Year in Code',
    calendarHeatmapMonth: 'This Month\'s Activity',
    yourCodingStyle: 'Your Coding Style',

    // Coding styles intro
    codingStylesIntroLine1: 'Let\'s explore',
    codingStylesIntroLine2: 'your coding',
    codingStylesIntroLine3: 'style',

    // Style badges
    yearlyExclusiveBadge: '✨ Yearly Exclusive',
    masterBadge: '🏆 Master',

    // Coding styles message
    codingStylesNote: 'Every style is proof of your effort.',

    // Coding style titles and descriptions
    // Time styles
    styleSteadyCoderTitle: 'Steady Turtle',
    styleSteadyCoderDesc: 'You maintained consistent coding habits',
    styleSteadyCoderObs: '{days} days of coding',
    styleMarathonRunnerTitle: 'Marathon Champion',
    styleMarathonRunnerDesc: 'You had long, focused coding sessions',
    styleMarathonRunnerObs: 'Longest: {duration}',
    styleSprinterTitle: 'Lightning Sprinter',
    styleSprinterDesc: 'Quick, focused coding bursts',
    styleSprinterObs: 'Avg {minutes}min sessions',

    // Rhythm styles
    styleNightOwlTitle: 'Night Owl',
    styleNightOwlDesc: 'You often code in the quiet hours of the night',
    styleNightOwlObs: '{percent}% after 10PM',
    styleEarlyBirdTitle: 'Early Bird',
    styleEarlyBirdDesc: 'You make great use of morning hours',
    styleEarlyBirdObs: '{percent}% in the morning',
    styleWeekdayCoderTitle: 'Weekday Warrior',
    styleWeekdayCoderDesc: 'You code primarily on weekdays',
    styleWeekdayCoderObs: '{percent}% on weekdays',
    styleWeekendWarriorTitle: 'Weekend Warrior',
    styleWeekendWarriorDesc: 'You make time for coding on weekends too',
    styleWeekendWarriorObs: '{percent}% on weekends',

    // Focus styles
    styleDeepFocusTitle: 'Deep Focus Master',
    styleDeepFocusDesc: 'You focused deeply on a single project',
    styleDeepFocusObs: '{percent}% on {project}',
    styleMultiTaskerTitle: 'Multi-Tasking Pro',
    styleMultiTaskerDesc: 'You juggled multiple projects effectively',
    styleMultiTaskerObs: '{count} projects',
    styleFileExplorerTitle: 'File Explorer',
    styleFileExplorerDesc: 'You worked across many files',
    styleFileExplorerObs: '{count} files edited',

    // Exploration styles
    styleLanguageExplorerTitle: 'Language Traveler',
    styleLanguageExplorerDesc: 'You coded in multiple languages',
    styleLanguageExplorerObs: '{count} languages used',
    styleSpecialistTitle: 'Language Specialist',
    styleSpecialistDesc: 'You focused on mastering a single language',
    styleSpecialistObs: '{percent}% {lang}',
    styleConsistentTitle: 'Streak Master',
    styleConsistentDesc: 'You maintained a consistent coding streak',
    styleConsistentObs: '{days} day streak',

    // Yearly exclusive styles
    styleAnnualChampionTitle: 'Annual Champion',
    styleAnnualChampionDesc: 'Over 500 hours of coding this year',
    styleAnnualChampionObs: '{hours} hours recorded',
    styleGrowthStarTitle: 'Rising Star',
    styleGrowthStarDesc: 'You explored new language territories',
    styleGrowthStarObs: '{count} new languages learned',
    styleSeasonalMasterTitle: 'All-Season Coder',
    styleSeasonalMasterDesc: 'You coded consistently throughout the year',
    styleSeasonalMasterObs: 'Active in all seasons',
    styleProjectArchitectTitle: 'Project Architect',
    styleProjectArchitectDesc: 'You contributed to many projects',
    styleProjectArchitectObs: '{count} projects',
    styleCodeExplorerTitle: 'Code Ocean Master',
    styleCodeExplorerDesc: 'You navigated a vast sea of code',
    styleCodeExplorerObs: '{count} files edited',

    // Master styles
    styleSteadyCoderMasterTitle: 'Rising Dragon',
    styleSteadyCoderMasterDesc: 'You coded steadily throughout the year, rising like a dragon',
    styleMarathonRunnerMasterTitle: 'Super Runner',
    styleMarathonRunnerMasterDesc: 'You showed superhuman focus and endurance',
    styleNightOwlMasterTitle: 'Night Lord',
    styleNightOwlMasterDesc: 'You completely dominated the night hours',
    styleConsistentMasterTitle: 'Eternal Flame',
    styleConsistentMasterDesc: 'You burned bright like an eternal volcano',
    styleEarlyBirdMasterTitle: 'Dawn Master',
    styleEarlyBirdMasterDesc: 'You conquered each day from sunrise',
    styleDeepFocusMasterTitle: 'Diamond Focus',
    styleDeepFocusMasterDesc: 'You concentrated your brilliance like a diamond',
    styleLanguageExplorerMasterTitle: 'Galaxy Pioneer',
    styleLanguageExplorerMasterDesc: 'You explored languages like traveling through galaxies',
    styleSpecialistMasterTitle: 'Language Wizard',
    styleSpecialistMasterDesc: 'You mastered a language like wielding magic',
    styleMultiTaskerMasterTitle: 'Asura',
    styleMultiTaskerMasterDesc: 'You managed many projects with countless arms',
    styleMultiTaskerMasterObs: '{count} projects in parallel',

    // Chart titles
    monthlyBreakdown: 'Monthly Breakdown',
    weeklyBreakdown: 'Weekly Breakdown',
    dailyBreakdown: 'Daily Breakdown',

    // Night owl
    nightOwlRate: 'Night Owl Rate',
    nightOwlTimeRange: 'Coding time between 10PM - 4AM',

    // Records labels
    daysActive: 'Days Active',
    maxStreak: 'Max Streak Days',
    estimatedLines: 'Estimated Lines',
    longestSession: 'Longest Session',
    charactersEdited: 'Characters Edited',
    longestCoding: 'Longest Coding',
    streakDays: 'Streak Days',

    // Image export
    downloadImage: 'Download Image',
    copyImage: 'Copy Image',
    downloadComplete: 'Downloaded',
    copying: 'Copying...',
    copyComplete: 'Copied',
    copyFailed: 'Copy Failed',

    // Pause indicator
    paused: 'Paused',
    pressSpaceToResume: 'Press space to resume',
    pressSpaceToPause: 'Press space to pause',

    // Day names
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',

    // Short day names
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',

    // Month names
    january: 'Jan',
    february: 'Feb',
    march: 'Mar',
    april: 'Apr',
    may: 'May',
    june: 'Jun',
    july: 'Jul',
    august: 'Aug',
    september: 'Sep',
    october: 'Oct',
    november: 'Nov',
    december: 'Dec',

    // Week labels
    weekN: 'Week {n}',
    weekNShort: 'W{n}',

    // Heatmap labels
    hour0: '12AM',
    hour6: '6AM',
    hour12: '12PM',
    hour18: '6PM',
    hour23: '11PM',

    // Comparison labels
    comparedToLastWeek: 'last week',
    comparedToLastMonth: 'last month',
    comparedToLastYear: 'last year',
    comparedTo: 'vs {label}',

    // Distribution labels
    mostActiveMonth: 'Most active month',
    mostActiveWeek: 'Most active week',
    mostActiveHour: 'Most active hour',
    mostActiveDay: 'Most active day',

    // No data
    noData: 'No data available',

    // Night owl messages
    nightOwl100: '🦉 You\'re a true night owl! Take care of your health!',
    nightOwl50: '🌙 Quite a few late nights. Try to rest early sometimes!',
    nightOwl20: '⭐ Occasional late nights. Good balance!',
    nightOwl0: '☀️ Healthy coding hours! Great work!',

    // Breakdown messages - Yearly
    bestMonthMessage: '🏆 {month} was your best month! {days} active days',
    yearlyJourneyMessage: '✨ Let\'s review your year of coding',

    // Breakdown messages - Monthly
    bestWeekMessage: '🏆 Week {week} was your most productive!',
    monthlyJourneyMessage: '✨ Let\'s review this month\'s coding',

    // Daily breakdown messages
    dailyAllDays: '🔥 Coding every day! {day} was your best day',
    dailyMostDays: '💪 {days} days of coding! {day} was most focused',
    dailyHalfDays: '✨ {days} days of coding, centered around {day}',
    dailyFewDays: '🌱 {days} days of coding. Every bit counts!',
    dailyNoDays: '💡 Let\'s make some coding time next week!',

    // Calendar heatmap messages - Yearly
    calendarYearly: '🗓️ {days} days of coding! {month} was your most active month',
    calendarYearlyNoMonth: '🗓️ {days} days spent with code',

    // Calendar heatmap messages - Monthly
    calendarMonthly: '📅 {days} days of coding! Day {day} was most focused',
    calendarMonthlyNoDay: '📅 {days} days of coding this month',
    calendarDefault: '📅 Your coding activity record',

    // Total time messages - Increase from previous period
    totalTimeIncrease50: '🚀 Huge increase from {prev}! Unstoppable growth!',
    totalTimeIncrease20: '📈 More time than {prev}! Excellent work!',
    totalTimeIncrease0: '⬆️ Up from {prev}! Keep it going!',

    // Total time messages - Yearly
    yearlyTotal1500: '🏆 Over 1500 hours this year! True professional!',
    yearlyTotal1000: '🔥 1000 hours achieved! A passionate year!',
    yearlyTotal500: '💪 Over 500 hours! Steady skill growth!',
    yearlyTotal100: '✨ A year of steady progress. Keep it up!',
    yearlyTotal0: '🌱 Let\'s make more time for code next year!',

    // Total time messages - Monthly
    monthlyTotal160: '🔥 Full-time+ hours! What a passionate month!',
    monthlyTotal100: '💪 Over 100 hours! A fulfilling month!',
    monthlyTotal40: '👍 Steady development pace!',
    monthlyTotal20: '✨ Steady progress. Keep it up!',
    monthlyTotal0: '🌟 Every bit counts. Great work {period}!',

    // Total time messages - Weekly
    weeklyTotal40: '🔥 Full-time+ hours! Incredible passion!',
    weeklyTotal20: '💪 A week of dedicated coding',
    weeklyTotal10: '👍 Steady development pace',
    weeklyTotal5: '✨ Steady progress. Keep it up!',
    weeklyTotal1: '🌟 Every bit counts. Great work {period}!',
    weeklyTotal0_5: '👏 Making time despite being busy is amazing!',
    weeklyTotal0_1: '🎯 Every bit of code matters!',
    weeklyTotal0: '💡 Let\'s code together next week!',

    // Project messages
    projectMulti5: '🎯 Multi-tasking master! Handling multiple projects',
    projectMulti3: '📚 Balanced work across multiple projects',
    projectMulti2: '🎪 Great project switching skills',
    projectSingle: '🎯 Focused on one project {period}',

    // Language messages
    langMulti5: '🌍 Polyglot programmer! Working with many languages',
    langMulti2: '💡 {lang} focused, with broad coverage',
    langSingle: '🎯 Focused on {lang} {period}',

    // Pattern messages - Time of day
    patternMorning: '🌅 Early bird! Focused in the quiet morning hours',
    patternLateMorning: '☀️ Late morning is your most productive time',
    patternLunch: '🍽️ Coding through lunch! Dedicated!',
    patternAfternoon: '🏢 Making the most of afternoon focus time',
    patternEvening: '🌆 Evening to night is your prime time',
    patternNight: '🌙 Finding focus in the quiet of night',

    // Pattern messages - Best period
    patternBestMonth: '📅 {month} was your most focused month. {time}',
    patternBestWeek: '📅 Week {week} was your most focused. {time}',

    // Records messages - Yearly
    recordsYearly300: '🔥 Over 300 days of coding! Incredible consistency!',
    recordsYearly200: '💪 Over 200 active days! Amazing year!',
    recordsYearlyStreak: '🏆 A {days}-day streak is impressive!',
    recordsYearlyDefault: '🌟 Great year! Let\'s do it again!',

    // Records messages - Monthly
    recordsMonthly25: '🔥 Almost daily coding! Excellent consistency!',
    recordsMonthly15: '💪 Most of the month spent coding!',
    recordsMonthlyLong: '🎯 Deep focus ability is a gift. Enjoy the flow!',
    recordsMonthlyDefault: '🌟 Great month! On to the next!',

    // Records messages - Weekly
    recordsWeekly7: '🔥 Coding every day! Amazing consistency!',
    recordsWeekly5: '💪 Weekday warrior! Great rhythm!',
    recordsWeeklyLong3: '🎯 Deep focus ability is a gift. Enjoy the flow!',
    recordsWeeklyLong1: '⚡ Maintaining good focus time',
    recordsWeeklyDefault: '🌟 Every bit of progress matters',

    // File messages
    fileMulti10: '📂 Working across many files',
    fileMulti5: '📝 Focused work on several files',
    fileFew: '🎯 Deep focus on select files',
    fileNone: '📄 No file access data available',

    // Final slide messages
    finalYearlyHoursHigh: 'You spent {hours} hours coding this year!',
    finalYearlyHoursLow: '{hours} hours of coding this year. Great work!',
    finalYearlyDays: '{days} active days this year!',
    finalYearlyEnd: 'Here\'s to another great year! 🎆',

    finalMonthlyHoursHigh: 'You spent {hours} hours coding this month!',
    finalMonthlyHoursLow: '{hours} hours of coding this month. Great work!',
    finalMonthlyStreak: 'A {days}-day streak is impressive!',
    finalMonthlyEnd: 'Here\'s to next month!',

    finalWeeklyHoursHigh: 'You spent {hours} hours coding this week!',
    finalWeeklyHoursLow: '{hours} hours of coding this week. Great work!',
    finalWeeklyStreak: 'A {days}-day streak is impressive!',
    finalWeeklyEnd: 'Here\'s to next week!',
    finalTopLang: 'Steadily improving your {lang} skills.',

    // Period hints
    periodHintWeek: '✨ Let\'s review your week of coding',
    periodHintMonth: '✨ Let\'s review your month of coding',
    periodHintYear: '🎊 Let\'s review your year of coding',

    // Final subtitles
    finalSubtitleWeek: 'Great week of coding!',
    finalSubtitleMonth: 'Great month of coding!',
    finalSubtitleYear: 'What an amazing year!',

    // Date formats
    dateFormatYearMonth: '{month} {year}',
    dateFormatYear: '{year}',
    dateFormatWeekOf: 'Week of {month}/{day}',

    // Summary card
    summaryWeeklyTotalTime: 'WEEKLY TOTAL TIME',
    summaryMonthlyTotalTime: 'MONTHLY TOTAL TIME',
    summaryYearlyTotalTime: 'YEARLY TOTAL TIME',
    summaryTopProject: 'TOP PROJECT',
    summaryTopLanguage: 'TOP LANGUAGE',
    summaryActiveDays: 'ACTIVE DAYS',
    summaryTagline: 'Track your coding journey',
  }
} as const;

/**
 * Translation key type
 */
export type TranslationKey = keyof typeof translations.ja;

/**
 * Get translated text
 * @param key Translation key
 * @param lang Language
 * @param params Optional parameters for template strings
 */
export function t(key: TranslationKey, lang: Language, params?: Record<string, string | number>): string {
  const text: string = translations[lang][key] || translations.ja[key] || key;

  if (!params) {
    return text;
  }

  // Replace {param} placeholders with actual values
  return Object.entries(params).reduce((result: string, [paramKey, value]) => {
    return result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
  }, text);
}

/**
 * Get day name in the current language
 */
export function getDayName(dayIndex: number, lang: Language): string {
  const days: TranslationKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return t(days[dayIndex], lang);
}

/**
 * Get short day name in the current language
 */
export function getShortDayName(dayIndex: number, lang: Language): string {
  const days: TranslationKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return t(days[dayIndex], lang);
}

/**
 * Get month name in the current language
 */
export function getMonthName(monthIndex: number, lang: Language): string {
  const months: TranslationKey[] = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  return t(months[monthIndex], lang);
}

/**
 * Day name mapping for English to translation key
 */
export const dayNameMap: Record<string, TranslationKey> = {
  'Sunday': 'sunday',
  'Monday': 'monday',
  'Tuesday': 'tuesday',
  'Wednesday': 'wednesday',
  'Thursday': 'thursday',
  'Friday': 'friday',
  'Saturday': 'saturday'
};
