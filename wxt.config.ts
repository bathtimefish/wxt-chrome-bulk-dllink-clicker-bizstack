import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // ポップアップを無効化
  manifest: {
    name: 'BizStack Download Link Clicker',
    description: 'Automatically clicks download links on BizStack console',
    permissions: ['activeTab'],
    host_permissions: ['https://console.bizstack.cloud/*'],
    icons: {
      16: 'icon/icon16.png',
      32: 'icon/icon32.png',
      48: 'icon/icon48.png',
      128: 'icon/icon128.png'
    },
    action: {
      default_icon: {
        16: 'icon/icon16.png',
        32: 'icon/icon32.png',
        48: 'icon/icon48.png',
        128: 'icon/icon128.png'
      }
      // popup プロパティを指定しないことでポップアップを無効化
    }
  }
});
