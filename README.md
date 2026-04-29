# 一键网页截图助手 | One-Click Web Screenshot Helper

一个基于 Manifest V3 和 html2canvas 的极简 Chrome 浏览器截图插件。
A minimal Chrome screenshot extension built with Manifest V3 and html2canvas.



## 仓库 | Repository

```
git clone https://github.com/moduwusuowei/screenshot-extension
```



---

## 功能特点 | Features

- ✅ 一键截图 | One-click screenshot
- ✅ 自动下载 PNG 截图 | Auto-download PNG
- ✅ 支持跨域图片处理 | Cross-origin image support
- ✅ 高清截图（适配设备像素比） | High-DPI screenshot support
- ✅ 简洁现代 UI | Clean & modern UI
- ✅ 不截取公司屏幕水印（实测） | Does NOT capture company screen watermarks (tested)
- ✅ 仅截取当前网页，无冗余功能 | Only captures current webpage, no extra features

---

## 文件结构 | File Structure

```
screenshot\-extension/
├── manifest.json    \# 扩展配置文件
├── popup.html       \# 弹出页面
├── popup.js         \# 弹出逻辑
├── background.js    \# 后台下载处理
├── content.js       \# 页面截图脚本
├── icons/           \# 图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── \[README.md\]\(README.md\)        \# 说明文档
```



## 文件作用 | File Description

### manifest.json

扩展核心配置，包含权限、图标、脚本入口。
Core extension configuration including permissions, icons, scripts.

### popup.html / popup.js

点击图标弹出的界面与交互逻辑。
Popup UI and interaction logic.

### background.js

负责截图文件的下载与保存。
Handles screenshot download and saving.

### content.js

注入网页，执行截图逻辑。
Injected into webpage to capture screen.

---

## 安装说明 | Installation

1.git clone 本项目到本地：

```
git clone https://github.com/moduwusuowei/screenshot-extension
```



### 开发模式安装 | Developer Mode

1. 打开 Chrome → `chrome://extensions/ `   | Open Chrome → `chrome://extensions/`
2. 开启右上角「开发者模式」| Enable "Developer mode"
3. 点击「加载已解压的扩展程序」 | Click "Load unpacked"
4. 选择插件文件夹  | Select the extension folder


---

## 使用方法 | Usage

1. 点击浏览器工具栏图标   |  Click the extension icon
2. 点击「截图」按钮      |   Click "Screenshot"
3. 自动下载 PNG 截图到本地   |  Auto-download as PNG file

---

## 技术栈 | Tech Stack

- Manifest V3
- html2canvas (CDN)
- JavaScript (ES6+)
- CSS3

---

## 跨域图片处理 | Cross-Origin Images

插件自动处理跨域图片，保证截图正常显示。
This extension automatically handles cross-origin images for proper rendering.

**现存不足：**

在截图过程中，无法捕获嵌入的图片。

During the screenshot process, embedded images cannot be captured.




---

## 注意事项 | Notes

- 部分网站 CSP 策略可能影响截图  | Some websites may block screenshots via CSP

- 跨域图片受浏览器安全策略限制 |Cross-origin images limited by browser security

- 页面完全加载后截图效果最佳 | Best results when page is fully loaded

  

---

## 隐私政策 | Privacy Policy

[privacy.html](privacy.html)

---

## 许可证 | License

MIT License

本插件采用 MIT 开源许可证。
你可以自由使用、复制、修改、分发，但必须保留版权声明。
本软件按“现状”提供，不提供任何担保，开发者不承担任何责任。

This project is licensed under the MIT License.
You may freely use, copy, modify, and distribute, but copyright notice must be retained.
This software is provided "as is" without warranty of any kind.

"# screenshot-extension" 
