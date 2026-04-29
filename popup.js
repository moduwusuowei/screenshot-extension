/**
 * popup.js - 弹出页面脚本
 */

const screenshotBtn = document.getElementById('screenshotBtn');
const statusElement = document.getElementById('status');

function showStatus(message, isLoading = false) {
  statusElement.innerHTML = isLoading 
    ? `<span class="loading"></span> ${message}` 
    : message;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function injectContentScript(tabId) {
  try {
    // 先注入html2canvas
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['html2canvas.min.js']
    });
    console.log('html2canvas注入成功');
    
    // 再注入content.js
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    console.log('content.js注入成功');
  } catch (error) {
    console.log('脚本注入失败:', error.message);
  }
}

function sendMessageWithTimeout(tabId, message, timeoutMs = 65000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('截图超时'));
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

async function handleScreenshotClick() {
  try {
    screenshotBtn.disabled = true;
    showStatus('正在截取页面...', true);

    const tab = await getActiveTab();
    if (!tab) {
      throw new Error('无法获取当前标签页');
    }

    await injectContentScript(tab.id);
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await sendMessageWithTimeout(tab.id, {
      action: 'captureFullPage'
    }, 30000);

    if (response && response.success) {
      showStatus('✅ 截图已保存');
    } else {
      throw new Error(response?.error || '截图失败');
    }

  } catch (error) {
    console.error('截图失败:', error);
    showStatus('❌ ' + error.message);
  } finally {
    screenshotBtn.disabled = false;
    setTimeout(() => showStatus(''), 3000);
  }
}

screenshotBtn.addEventListener('click', handleScreenshotClick);
document.addEventListener('DOMContentLoaded', () => {});
