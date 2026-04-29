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
    if (!window.html2canvas) {
      reject(new Error('html2canvas未加载'));
      return;
    }

    const timeout = setTimeout(() => {
      restoreState();
      reject(new Error('截图超时'));
    }, 120000);

    const body = document.body;
    const html = document.documentElement;
    const originalBodyHeight = body.style.height;
    const originalBodyOverflow = body.style.overflow;
    const originalHtmlHeight = html.style.height;
    const originalHtmlOverflow = html.style.overflow;
    const originalHtmlPosition = html.style.position;
    const originalImages = [];

    function restoreState() {
      body.style.height = originalBodyHeight;
      body.style.overflow = originalBodyOverflow;
      html.style.height = originalHtmlHeight;
      html.style.overflow = originalHtmlOverflow;
      html.style.position = originalHtmlPosition;
      
      originalImages.forEach(item => {
        if (item.canvas && item.canvas.parentNode) {
          item.canvas.parentNode.replaceChild(item.img, item.canvas);
        }
      });
    }

    const pageHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.scrollHeight,
      html.offsetHeight
    );
    const pageWidth = Math.max(
      body.scrollWidth,
      body.offsetWidth,
      html.scrollWidth,
      html.offsetWidth
    );

    const images = document.querySelectorAll('img');
    let processed = 0;

    function convertNextImage() {
      if (processed >= images.length) {
        startCapture();
        return;
      }

      const img = images[processed];
      if (!img.src || img.src.startsWith('data:')) {
        processed++;
        convertNextImage();
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';

      tempImg.onload = () => {
        canvas.width = tempImg.width;
        canvas.height = tempImg.height;
        ctx.drawImage(tempImg, 0, 0);
        
        canvas.style.width = img.style.width || img.width + 'px';
        canvas.style.height = img.style.height || img.height + 'px';
        canvas.style.objectFit = img.style.objectFit || 'cover';
        canvas.style.maxWidth = '100%';
        
        originalImages.push({ img, canvas });
        img.parentNode.replaceChild(canvas, img);
        
        processed++;
        convertNextImage();
      };

      tempImg.onerror = () => {
        processed++;
        convertNextImage();
      };

      tempImg.src = img.src;
    }

    function startCapture() {
      body.style.height = pageHeight + 'px';
      body.style.overflow = 'visible';
      html.style.height = pageHeight + 'px';
      html.style.overflow = 'visible';
      html.style.position = 'relative';

      setTimeout(() => {
        html2canvas(html, {
          useCORS: true,
          allowTaint: true,
          scale: window.devicePixelRatio || 1,
          backgroundColor: '#ffffff',
          removeContainer: true,
          useParseSVG: true,
          preserveDrawingBuffer: true,
          foreignObjectRendering: false,
          letterRendering: false,
          useWorker: false,
          width: pageWidth,
          height: pageHeight,
          windowWidth: pageWidth,
          windowHeight: pageHeight,
          scrollX: 0,
          scrollY: 0
        }).then(canvas => {
          restoreState();
          clearTimeout(timeout);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        }).catch(error => {
          restoreState();
          clearTimeout(timeout);
          console.error('html2canvas截图失败:', error);
          reject(error);
        });
      }, 1000);
    }

    if (images.length === 0) {
      startCapture();
    } else {
      convertNextImage();
    }
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
