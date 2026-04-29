/**
 * content.js - 内容脚本
 * 使用html2canvas截取整个页面
 */

/**
 * 下载图片
 * @param {string} dataUrl - 图片的data URL
 * @param {string} fileName - 文件名
 */
function downloadImage(dataUrl, fileName) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * 截取整个页面
 * @returns {Promise<string>} - 图片的data URL
 */
async function captureFullPage() {
  return new Promise((resolve, reject) => {
    // 先尝试使用 background 的 captureVisibleTab 截取可见区域
    chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, (response) => {
      if (response && response.success) {
        resolve(response.dataUrl);
        return;
      }
      
      // 如果失败，回退到 html2canvas
      if (!window.html2canvas) {
        reject(new Error('html2canvas未加载'));
        return;
      }

      html2canvas(document.documentElement, {
        useCORS: true,
        allowTaint: true,
        scale: window.devicePixelRatio || 1,
        logging: false,
        backgroundColor: null,
        removeContainer: true,
        useParseSVG: true,
        preserveDrawingBuffer: true,
        foreignObjectRendering: false,
        letterRendering: true,
        useWorker: false
      }).then(canvas => {
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      }).catch(error => {
        reject(error);
      });
    });
  });
}

/**
 * 监听来自popup的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 处理全页面截图请求
  if (request.action === 'captureFullPage') {
    captureFullPage()
      .then(dataUrl => {
        // 获取文件名并下载
        chrome.runtime.sendMessage({ action: 'getFileName' }, (response) => {
          if (response && response.success) {
            downloadImage(dataUrl, response.fileName);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: '获取文件名失败' });
          }
        });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});
