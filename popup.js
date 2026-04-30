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

function downloadImage(dataUrl, fileName) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

async function handleFullPageClick() {
  try {
    disableButtons(true);
    showStatus('正在截取长图...', true);

    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'captureFullPage' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });

    if (response && response.success) {
      showStatus('✅ 长图已保存');
    } else {
      throw new Error(response?.error || '长图截取失败');
    }

  } catch (error) {
    console.error('长图截取失败:', error);
    const errorMsg = error.message.includes('Receiving end does not exist') 
      ? '连接失败，请刷新页面后重试' 
      : error.message;
    showStatus('❌ ' + errorMsg);
  } finally {
    disableButtons(false);
    setTimeout(() => showStatus(''), 3000);
  }
}

async function handleVisibleClick() {
  try {
    disableButtons(true);
    showStatus('正在截取当前屏幕...', true);

    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });

    if (response && response.success) {
      downloadImage(response.dataUrl, response.fileName);
      showStatus('✅ 当前屏幕已保存');
    } else {
      throw new Error(response?.error || '截取失败');
    }

  } catch (error) {
    console.error('截取失败:', error);
    showStatus('❌ ' + error.message);
  } finally {
    disableButtons(false);
    setTimeout(() => showStatus(''), 3000);
  }
}

fullPageBtn.addEventListener('click', handleFullPageClick);
visibleBtn.addEventListener('click', handleVisibleClick);
document.addEventListener('DOMContentLoaded', () => {});
