/**
 * 週の開始日と終了日を取得
 * @param offset - 現在週からのオフセット（0 = 今週, -1 = 先週）
 */
export function getWeekBounds(offset: number = 0): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // 月曜日を週の開始とする
  const monday = new Date(now);
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  monday.setDate(now.getDate() - daysToMonday + (offset * 7));
  monday.setHours(0, 0, 0, 0);

  // 日曜日を週の終了とする
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: formatDate(monday),
    end: formatDate(sunday)
  };
}

/**
 * 日付をYYYY-MM-DD形式にフォーマット
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 今日の日付をYYYY-MM-DD形式で取得
 */
export function getTodayDate(): string {
  return formatDate(new Date());
}

/**
 * ミリ秒を人間が読める形式にフォーマット
 */
export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * 短い時間表示（ステータスバー用）
 */
export function formatDurationShort(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * 時間（0-23）を読みやすい形式にフォーマット
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '0:00';
  if (hour < 12) return `${hour}:00`;
  if (hour === 12) return '12:00';
  return `${hour}:00`;
}

/**
 * 曜日インデックスから日本語の曜日名を取得
 */
export function getDayName(dayIndex: number): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[dayIndex];
}

/**
 * 曜日インデックスから英語の曜日名を取得
 */
export function getDayNameEn(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}

/**
 * 夜ふかし時間帯かどうかを判定（22:00-3:59）
 */
export function isNightOwlHour(hour: number): boolean {
  return hour >= 22 || hour < 4;
}

/**
 * UUIDを生成
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 日付文字列から曜日インデックスを取得
 */
export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay();
}

/**
 * 2つの日付の差（日数）を計算
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 月の開始日と終了日を取得
 * @param offset - 現在月からのオフセット（0 = 今月, -1 = 先月）
 */
export function getMonthBounds(offset: number = 0): { start: string; end: string; monthName: string } {
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1);

  // 月の最初の日
  const start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  // 月の最後の日
  const end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  const monthName = targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    start: formatDate(start),
    end: formatDate(end),
    monthName
  };
}

/**
 * 年の開始日と終了日を取得
 * @param offset - 現在年からのオフセット（0 = 今年, -1 = 去年）
 */
export function getYearBounds(offset: number = 0): { start: string; end: string; year: number } {
  const now = new Date();
  const targetYear = now.getFullYear() + offset;

  const start = new Date(targetYear, 0, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(targetYear, 11, 31);
  end.setHours(23, 59, 59, 999);

  return {
    start: formatDate(start),
    end: formatDate(end),
    year: targetYear
  };
}

/**
 * 現在が12月かどうかを判定
 */
export function isDecember(): boolean {
  return new Date().getMonth() === 11;
}

/**
 * 12月までの日数を取得
 */
export function getDaysUntilDecember(): number {
  const now = new Date();
  const currentMonth = now.getMonth();

  if (currentMonth === 11) return 0;

  // 12月1日までの日数を計算
  const december1 = new Date(now.getFullYear(), 11, 1);
  const diffMs = december1.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 日付文字列からISO週番号を取得
 */
export function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

/**
 * 月番号（1-12）から月名を取得
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

/**
 * 月番号（1-12）から短い月名を取得
 */
export function getMonthNameShort(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}
