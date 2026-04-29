/**
 * background.js - 后台脚本
 * 处理文件名生成和消息转发
 */

/**
 * 生成带日期和时间的文件名
 * 格式: snap_年月日时分秒.png (例如: snap_20260429100911.png)
 * @returns {string} - 文件名
 */
function generateFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `snap_${year}${month}${day}${hours}${minutes}${seconds}.png`;
}

/**
 * 使用Chrome原生API截取可见区域
 * @returns {Promise<string>} - 图片的data URL
 */
function captureVisibleTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (dataUrl) {
        resolve(dataUrl);
      } else {
        reject(new Error('截图失败'));
      }
    });
  });
}

/**
 * 监听来自popup/content的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 处理可见区域截图请求（来自content script）
  if (request.action === 'captureVisibleTab') {
    captureVisibleTab()
      .then(dataUrl => sendResponse({ success: true, dataUrl: dataUrl }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // 处理获取文件名请求
  if (request.action === 'getFileName') {
    sendResponse({ success: true, fileName: generateFileName() });
    return true;
  }
});

/**
 * 扩展安装时的初始化
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('📸 Web Capture已安装');
});

/**
 * 扩展启动时
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('📸 Web Capture已启动');
});
