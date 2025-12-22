import * as vscode from 'vscode';
import { StorageService } from './services/StorageService';
import { TimeTracker } from './services/TimeTracker';
import { StatisticsService } from './services/StatisticsService';
import { WebviewProvider } from './webview/WebviewProvider';

let storageService: StorageService | undefined;
let timeTracker: TimeTracker | undefined;
let statsService: StatisticsService | undefined;
let webviewProvider: WebviewProvider | undefined;

export async function activate(context: vscode.ExtensionContext) {
  console.log('CodeVoyage extension activating...');

  // サービスを初期化
  storageService = new StorageService(context.globalState);
  await storageService.initialize();

  statsService = new StatisticsService(storageService);
  timeTracker = new TimeTracker(context, storageService);
  webviewProvider = new WebviewProvider(context, statsService);

  // コマンドを登録
  const commands = [
    vscode.commands.registerCommand('codevoyage.openDashboard', () => {
      webviewProvider?.showWeeklyReview();
    }),

    vscode.commands.registerCommand('codevoyage.showDemoReview', () => {
      statsService?.setUseMockData(true);
      webviewProvider?.showWeeklyReview();
    }),

    vscode.commands.registerCommand('codevoyage.exportData', async () => {
      await exportData();
    }),

    vscode.commands.registerCommand('codevoyage.importData', async () => {
      await importData();
    })
  ];

  context.subscriptions.push(...commands);
  context.subscriptions.push(timeTracker);

  // 設定変更を監視
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('codevoyage')) {
        updateSettings();
      }
    })
  );

  // 常に自動開始
  timeTracker.startTracking();

  console.log('CodeVoyage extension activated');
}

/**
 * 設定を更新
 */
function updateSettings(): void {
  const config = vscode.workspace.getConfiguration('codevoyage');
  const idleTimeoutMs = (config.get<number>('idleTimeout') || 300) * 1000;

  storageService?.updateSettings({
    idleTimeoutMs,
    showStatusBar: config.get<boolean>('showStatusBar') ?? true
  });

  // ActivityDetectorのタイムアウトも更新
  timeTracker?.updateIdleTimeout(idleTimeoutMs);
}

export async function deactivate() {
  // 非同期版を使用してデータを確実に保存
  await timeTracker?.disposeAsync();
}

/**
 * データをエクスポート
 */
async function exportData(): Promise<void> {
  if (!storageService) {
    vscode.window.showErrorMessage('CodeVoyage: Storage service not initialized');
    return;
  }

  const data = storageService.exportData();
  if (!data) {
    vscode.window.showErrorMessage('CodeVoyage: No data to export');
    return;
  }

  const stats = storageService.getDataStats();
  const defaultFileName = `codevoyage-backup-${new Date().toISOString().split('T')[0]}.json`;

  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(defaultFileName),
    filters: {
      'JSON': ['json']
    },
    saveLabel: 'Export'
  });

  if (!uri) {
    return; // ユーザーがキャンセル
  }

  try {
    const content = JSON.stringify(data, null, 2);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));

    const message = stats.dateRange
      ? `Exported ${stats.totalDays} days of data (${stats.dateRange.start} to ${stats.dateRange.end})`
      : 'Data exported successfully';

    vscode.window.showInformationMessage(`CodeVoyage: ${message}`);
  } catch (error) {
    vscode.window.showErrorMessage(
      `CodeVoyage: Export failed - ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * データをインポート
 */
async function importData(): Promise<void> {
  if (!storageService) {
    vscode.window.showErrorMessage('CodeVoyage: Storage service not initialized');
    return;
  }

  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: {
      'JSON': ['json']
    },
    openLabel: 'Import'
  });

  if (!uris || uris.length === 0) {
    return; // ユーザーがキャンセル
  }

  try {
    const content = await vscode.workspace.fs.readFile(uris[0]);
    const data = JSON.parse(Buffer.from(content).toString('utf8'));

    const result = await storageService.importData(data);

    if (result.success) {
      vscode.window.showInformationMessage(`CodeVoyage: ${result.message}`);
    } else {
      vscode.window.showErrorMessage(`CodeVoyage: ${result.message}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `CodeVoyage: Import failed - ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
