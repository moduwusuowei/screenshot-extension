/**
 * popup.js - 弹出页面脚本
 */

const fullPageBtn = document.getElementById('fullPageBtn');
const visibleBtn = document.getElementById('visibleBtn');
const statusElement = document.getElementById('status');

function showStatus(message, isLoading = false) {
  statusElement.innerHTML = isLoading 
    ? `<span class="loading"></span> ${message}` 
    : message;
}

function disableButtons(disabled) {
  fullPageBtn.disabled = disabled;
  visibleBtn.disabled = disabled;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['html2canvas.min.js']
    });
    console.log('html2canvas注入成功');
    
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

async function handleFullPageClick() {
  try {
    disableButtons(true);
    showStatus('正在截取长图...', true);

    const tab = await getActiveTab();
    if (!tab) {
      throw new Error('无法获取当前标签页');
    }

    await injectContentScript(tab.id);
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await sendMessageWithTimeout(tab.id, {
      action: 'captureFullPage'
    }, 65000);

    if (response && response.success) {
      showStatus('✅ 长图已保存');
    } else {
      throw new Error(response?.error || '长图截取失败');
    }

  } catch (error) {
    console.error('长图截取失败:', error);
    showStatus('❌ ' + error.message);
  } finally {
    disableButtons(false);
    setTimeout(() => showStatus(''), 3000);
  }
}

async function handleVisibleClick() {
  try {
    disableButtons(true);
    showStatus('正在截取当前屏幕...', true);

    chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, (response) => {
      if (response && response.success) {
        const link = document.createElement('a');
        link.download = `snap_${Date.now()}.png`;
        link.href = response.dataUrl;
        link.click();
        showStatus('✅ 当前屏幕已保存');
      } else {
        showStatus('❌ ' + (response?.error || '截取失败'));
      }
      disableButtons(false);
      setTimeout(() => showStatus(''), 3000);
    });

  } catch (error) {
    console.error('截取失败:', error);
    showStatus('❌ ' + error.message);
    disableButtons(false);
    setTimeout(() => showStatus(''), 3000);
  }
}

fullPageBtn.addEventListener('click', handleFullPageClick);
visibleBtn.addEventListener('click', handleVisibleClick);
document.addEventListener('DOMContentLoaded', () => {});
