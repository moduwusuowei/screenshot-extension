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
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);
  return `snap_${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}.png`;
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

async function injectScripts(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['html2canvas.min.js']
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  } catch (error) {
    console.error('脚本注入失败:', error);
    return false;
  }
}

function sendMessageToTab(tabId, message, timeoutMs = 65000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('消息超时'));
    }, timeoutMs);

    chrome.tabs.sendMessage(tabId, message, (response) => {
      clearTimeout(timeout);
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * 监听来自popup/content的消息
 */
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'captureFullPage') {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab) {
        sendResponse({ success: false, error: '无法获取当前标签页' });
        return;
      }

      const injected = await injectScripts(tab.id);
      if (!injected) {
        sendResponse({ success: false, error: '脚本注入失败' });
        return;
      }

      const response = await sendMessageToTab(tab.id, { action: 'captureFullPage' }, 65000);
      if (response && response.success) {
        sendResponse({ success: true, fileName: generateFileName() });
      } else {
        sendResponse({ success: false, error: response?.error || '截图失败' });
      }
    } catch (error) {
      console.error('长图截取失败:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }

  if (request.action === 'captureVisibleTab') {
    captureVisibleTab()
      .then(dataUrl => sendResponse({ success: true, dataUrl: dataUrl, fileName: generateFileName() }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
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
