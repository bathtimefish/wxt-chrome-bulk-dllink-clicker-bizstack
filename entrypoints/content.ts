// 対象ドメインの定数
const TARGET_DOMAIN = 'console.bizstack.cloud';
// ダウンロードボタンのセレクタ
const DOWNLOAD_BUTTON_SELECTOR = 'button.downloadLinkButton';
// ボタンクリック間の遅延（ミリ秒）
const CLICK_DELAY_MS = 500;
// ボタンチェックの間隔（ミリ秒）
const CHECK_INTERVAL_MS = 1000;

export default defineContentScript({
  matches: [`*://*.${TARGET_DOMAIN}/*`],
  main() {
    let downloadQueue: HTMLElement[] = []; // ダウンロードキュー
    let isProcessingQueue = false; // キュー処理中フラグ
    
    // ダウンロードボタンの検出とカウント
    function checkDownloadButtons(): number {
      const buttons = document.querySelectorAll(DOWNLOAD_BUTTON_SELECTOR);
      const count = buttons.length;
      
      // バックグラウンドスクリプトにボタン数を通知
      browser.runtime.sendMessage({ type: 'UPDATE_BADGE', count });
      return count;
    }
    
    // 定期的にボタンをチェック（DOMの動的変更に対応）
    setInterval(checkDownloadButtons, CHECK_INTERVAL_MS);
    
    // 初回チェック
    checkDownloadButtons();
    
    // キューを処理する関数
    async function processDownloadQueue(): Promise<void> {
      if (isProcessingQueue || downloadQueue.length === 0) return;
      
      isProcessingQueue = true;
      
      // 進捗状況をバッジに表示
      const totalButtons = downloadQueue.length;
      let processed = 0;
      
      try {
        // 各ボタンを順番にクリック
        while (downloadQueue.length > 0) {
          const button = downloadQueue.shift();
          if (button) {
            console.log(`Processing button ${processed + 1}/${totalButtons}`);
            
            // 単純なクリックを実行
            button.click();
            console.log('Button clicked:', button);
            
            // 進捗を更新
            processed++;
            browser.runtime.sendMessage({ 
              type: 'UPDATE_PROGRESS', 
              processed, 
              total: totalButtons 
            });
            
            // ダウンロード開始のための遅延
            await new Promise(resolve => setTimeout(resolve, CLICK_DELAY_MS));
          }
        }
      } finally {
        isProcessingQueue = false;
        
        // 完了したらバッジを通常表示に戻す
        setTimeout(() => {
          // バッジテキストを更新
          checkDownloadButtons();
          
          // バッジをリセットするメッセージを送信
          browser.runtime.sendMessage({ 
            type: 'RESET_BADGE'
          });
          console.log('Sent RESET_BADGE message');
        }, CHECK_INTERVAL_MS);
      }
    }
    
    // バックグラウンドからのメッセージリスナー
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'CLICK_ALL_BUTTONS') {
        const buttons = document.querySelectorAll(DOWNLOAD_BUTTON_SELECTOR);
        console.log('Found download buttons:', buttons.length);
        
        // キューをリセットして新しいボタンを追加
        downloadQueue = Array.from(buttons) as HTMLElement[];
        
        // キュー処理を開始
        processDownloadQueue();
        
        return Promise.resolve({ queued: buttons.length });
      }
    });
  },
});
