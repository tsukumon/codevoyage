/**
 * VSCode言語IDから表示名へのマッピング
 */
const LANGUAGE_NAMES: Record<string, string> = {
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'typescriptreact': 'TypeScript React',
  'javascriptreact': 'JavaScript React',
  'python': 'Python',
  'java': 'Java',
  'csharp': 'C#',
  'cpp': 'C++',
  'c': 'C',
  'go': 'Go',
  'rust': 'Rust',
  'ruby': 'Ruby',
  'php': 'PHP',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'html': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'less': 'Less',
  'json': 'JSON',
  'yaml': 'YAML',
  'xml': 'XML',
  'markdown': 'Markdown',
  'sql': 'SQL',
  'shellscript': 'Shell Script',
  'powershell': 'PowerShell',
  'dockerfile': 'Dockerfile',
  'plaintext': 'Plain Text',
  'vue': 'Vue',
  'svelte': 'Svelte',
  'dart': 'Dart',
  'lua': 'Lua',
  'perl': 'Perl',
  'r': 'R',
  'scala': 'Scala',
  'haskell': 'Haskell',
  'elixir': 'Elixir',
  'clojure': 'Clojure',
  'fsharp': 'F#',
  'objective-c': 'Objective-C',
  'groovy': 'Groovy'
};

/**
 * 言語IDからアイコン/略称を取得
 */
const LANGUAGE_ICONS: Record<string, string> = {
  'javascript': 'JS',
  'typescript': 'TS',
  'typescriptreact': 'TSX',
  'javascriptreact': 'JSX',
  'python': 'PY',
  'java': 'JV',
  'csharp': 'C#',
  'cpp': 'C++',
  'c': 'C',
  'go': 'GO',
  'rust': 'RS',
  'ruby': 'RB',
  'php': 'PHP',
  'swift': 'SW',
  'kotlin': 'KT',
  'html': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'json': 'JSON',
  'yaml': 'YAML',
  'xml': 'XML',
  'markdown': 'MD',
  'sql': 'SQL',
  'shellscript': 'SH',
  'vue': 'VUE',
  'svelte': 'SVLT',
  'dart': 'DART'
};

/**
 * 言語の表示名を取得
 */
export function getLanguageDisplayName(languageId: string): string {
  return LANGUAGE_NAMES[languageId] ||
    languageId.charAt(0).toUpperCase() + languageId.slice(1);
}

/**
 * 言語のアイコン/略称を取得
 */
export function getLanguageIcon(languageId: string): string {
  return LANGUAGE_ICONS[languageId] ||
    languageId.substring(0, 2).toUpperCase();
}

/**
 * 言語IDの色を取得（Webview用）
 */
export function getLanguageColor(languageId: string): string {
  const colors: Record<string, string> = {
    'javascript': '#f7df1e',
    'typescript': '#3178c6',
    'typescriptreact': '#61dafb',
    'javascriptreact': '#61dafb',
    'python': '#3776ab',
    'java': '#007396',
    'csharp': '#239120',
    'cpp': '#00599c',
    'c': '#a8b9cc',
    'go': '#00add8',
    'rust': '#dea584',
    'ruby': '#cc342d',
    'php': '#777bb4',
    'swift': '#fa7343',
    'kotlin': '#7f52ff',
    'html': '#e34f26',
    'css': '#1572b6',
    'scss': '#cf649a',
    'vue': '#4fc08d',
    'svelte': '#ff3e00',
    'dart': '#0175c2'
  };
  return colors[languageId] || '#6b7280';
}
