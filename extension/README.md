# Bili OneTool Extension

Bili OneTool 的 Chrome Extension Manifest V3 最小可用版。

当前版本不使用 React、Vite、Webpack 或其他构建工具。Chrome 直接加载 `extension/` 目录中的原生 JavaScript、CSS 和 `manifest.json`。

## 功能范围

- 在 B 站视频页注入右侧 `Bili Tools` 浮动按钮。
- 点击按钮打开工具面板。
- 通过 B 站公开 `view` 接口读取标题、BV 号、封面 URL、UP 主和 CID。
- 展示干净视频 URL、封面预览和封面 URL。
- 支持复制完整 Markdown 信息。
- 支持复制单行字段。
- 支持下载封面，下载动作由 background service worker 调用 `chrome.downloads.download`。

当前仍然只处理公开页面基础信息，不处理播放流、签名、DRM、平台限制绕过、音视频合并或转码。

## 目录结构

```text
extension/
├── manifest.json
├── src/
│   ├── background/
│   │   └── service-worker.js
│   ├── content/
│   │   ├── content.css
│   │   └── content.js
│   └── shared/
│       ├── markdown.js
│       └── video-info.js
├── test/
│   └── shared.test.js
└── README.md
```

## 本地加载方式

1. 打开 Chrome。
2. 进入 `chrome://extensions`。
3. 打开右上角「开发者模式」。
4. 点击「加载已解压的扩展程序」。
5. 选择本仓库的 `extension/` 目录。
6. 打开任意 B 站视频页，例如 `https://www.bilibili.com/video/BVxxxx`。
7. 点击页面右侧的 `Bili Tools` 按钮。

修改 `extension/` 下的文件后，在 `chrome://extensions` 中点击该扩展卡片上的刷新按钮，再刷新 B 站视频页。

## userscript 到 extension 的对应关系

- userscript 的 `@match` 对应 `manifest.json` 中的 `content_scripts.matches`。
- userscript 的 `@grant GM_download` 对应 `permissions.downloads` 和 background service worker 中的 `chrome.downloads.download`。
- userscript 的 `GM_xmlhttpRequest` 在插件版中先用 content script 的 `fetch` 请求公开 view 接口。
- userscript 的 `GM_setClipboard` 在插件版中先用 `navigator.clipboard.writeText`，失败时回退到 `document.execCommand('copy')`。
- userscript 中动态插入的样式迁移为 `src/content/content.css`。
- userscript 中可复用的 BV 解析、URL 归一化、Markdown 格式化和封面文件名逻辑迁移到 `src/shared/`。

## 基础测试

当前只对共享纯逻辑做轻量测试：

```bash
node --test extension/test/shared.test.js
```
