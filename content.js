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
function replaceColorFunctions() {
  const elements = document.querySelectorAll('*');
  const colorProps = ['color', 'background', 'background-color', 'border-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'text-shadow', 'box-shadow'];
  
  elements.forEach(el => {
    const style = el.style;
    colorProps.forEach(prop => {
      try {
        const value = style.getPropertyValue(prop);
        if (value && value.includes('color(')) {
          const computedStyle = window.getComputedStyle(el);
          const computedValue = computedStyle.getPropertyValue(prop);
          if (computedValue && !computedValue.includes('color(')) {
            style.setProperty(prop, computedValue, style.getPropertyPriority(prop));
          } else {
            style.setProperty(prop, '#333333', style.getPropertyPriority(prop));
          }
        }
      } catch (e) {
        return;
      }
    });
  });
}

function convertSVGsToCanvas() {
  const svgs = document.querySelectorAll('svg');
  svgs.forEach(svg => {
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.style.width = svg.style.width || svg.getAttribute('width') || '100%';
        canvas.style.height = svg.style.height || svg.getAttribute('height') || 'auto';
        canvas.style.display = svg.style.display || 'inline-block';
        
        svg.parentNode.replaceChild(canvas, svg);
      };
      
      img.onerror = () => {
        console.log('SVG转换失败，保持原始SVG');
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.log('SVG转换异常:', e);
    }
  });
}

async function captureFullPage() {
  return new Promise((resolve, reject) => {
    if (!window.html2canvas) {
      reject(new Error('html2canvas未加载'));
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('截图超时'));
    }, 60000);

    const body = document.body;
    const html = document.documentElement;
    
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

    replaceColorFunctions();
    convertSVGsToCanvas();

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
        useParseSVG: false,
        preserveDrawingBuffer: true,
        foreignObjectRendering: false,
        letterRendering: false,
        useWorker: false,
        width: pageWidth,
        height: pageHeight,
        windowWidth: pageWidth,
        windowHeight: pageHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false
      }).then(canvas => {
        clearTimeout(timeout);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      }).catch(error => {
        clearTimeout(timeout);
        console.error('html2canvas截图失败:', error);
        reject(error);
      });
    }, 800);
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
