// 対象ドメインの定数
const TARGET_DOMAIN = 'console.bizstack.cloud';

export default defineBackground(() => {
  console.log('Background script initialized');
  
  // バッジの初期化
  browser.action.setBadgeBackgroundColor({ color: '#4688F1' });
  
  // タブの更新を監視して、アクティブ/非アクティブを切り替える
  browser.tabs.onUpdated.addListener((tabId: number, changeInfo, tab) => {
    console.log('Tab updated:', tabId, tab.url);
    updateIconState(tabId, tab.url);
  });
  
  // タブの切り替えを監視
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    console.log('Tab activated:', activeInfo.tabId);
    const tab = await browser.tabs.get(activeInfo.tabId);
    updateIconState(activeInfo.tabId, tab.url);
  });
  
  // アイコンの状態を更新する関数
  function updateIconState(tabId: number, url: string | undefined) {
    const isActive = url && url.includes(TARGET_DOMAIN);
    console.log('Updating icon state:', { tabId, url, isActive });
    
    if (isActive) {
      // アクティブな状態：通常のアイコンを表示
      browser.action.enable(tabId);
      
      // バッジの背景色を青色に初期化
      browser.action.setBadgeBackgroundColor({ 
        tabId: tabId,
        color: '#4688F1' 
      });
    } else {
      // 非アクティブな状態：アイコンを無効化（グレーアウト表示）
      browser.action.disable(tabId);
      
      // バッジテキストをクリア
      browser.action.setBadgeText({ tabId: tabId, text: '' });
    }
  }
  
  // コンテンツスクリプトからのメッセージリスナー
  browser.runtime.onMessage.addListener((message, sender) => {
    console.log('Received message:', message, 'from:', sender);
    
    if (!sender.tab?.id) {
      console.error('No tab ID in sender:', sender);
      return;
    }
    
    if (message.type === 'UPDATE_BADGE') {
      const count = message.count;
      console.log('Updating badge with count:', count);
      browser.action.setBadgeText({ 
        tabId: sender.tab.id,
        text: count > 0 ? count.toString() : '' 
      });
    }
    else if (message.type === 'UPDATE_PROGRESS') {
      // 進捗状況をバッジに表示
      const { processed, total } = message;
      console.log('Updating progress badge:', processed, '/', total);
      browser.action.setBadgeText({ 
        tabId: sender.tab.id,
        text: `${processed}/${total}` 
      });
      browser.action.setBadgeBackgroundColor({ color: '#FF9800' });
    }
    else if (message.type === 'RESET_BADGE') {
      console.log('Resetting badge to default state');
      
      // バッジの背景色を青色に戻す
      browser.action.setBadgeBackgroundColor({ 
        tabId: sender.tab.id,
        color: '#4688F1' 
      });
      
      // 必要に応じて他のバッジ属性もリセット可能
      // 例: バッジテキストのスタイルなど
    }
  });
  
  // アイコンクリック時の処理
  browser.action.onClicked.addListener(async (tab) => {
    console.log('Icon clicked:', tab);
    
    if (tab.url?.includes(TARGET_DOMAIN) && tab.id) {
      console.log('Sending CLICK_ALL_BUTTONS message to tab:', tab.id);
      
      try {
        const response = await browser.tabs.sendMessage(tab.id, { 
          type: 'CLICK_ALL_BUTTONS' 
        });
        console.log('Response from content script:', response);
        console.log(`Queued ${response?.queued || 0} download buttons`);
      } catch (error) {
        console.error('Error sending message to content script:', error);
        
        // コンテンツスクリプトが読み込まれていない可能性がある
        // タブをリロードして再試行
        try {
          console.log('Attempting to reload tab and retry...');
          await browser.tabs.reload(tab.id);
          
          // リロード後に少し待機
          setTimeout(async () => {
            try {
              console.log('Retrying after reload...');
              const retryResponse = await browser.tabs.sendMessage(tab.id!, { 
                type: 'CLICK_ALL_BUTTONS' 
              });
              console.log('Retry response:', retryResponse);
            } catch (retryError) {
              console.error('Retry also failed:', retryError);
            }
          }, 1000);
        } catch (reloadError) {
          console.error('Error reloading tab:', reloadError);
        }
      }
    } else {
      console.log('Tab is not on target domain or has no ID');
    }
  });
  
  // 拡張機能のインストール/更新時の処理
  browser.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed or updated:', details);
  });
});
