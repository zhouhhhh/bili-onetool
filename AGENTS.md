# Bili OneTool 项目上下文

## 项目目标

做一个面向哔哩哔哩视频页面的浏览器增强工具，暂定名为 Bili OneTool。

目标是在 B 站视频播放页中注入一个小型工具按钮/面板，帮助用户快速获取和整理视频资源信息。项目初期优先实现轻量、稳定、合法边界较清晰的功能，例如封面、视频元信息、字幕检测与下载。后续再根据实际需求探索音频、视频流、不同清晰度下载、音视频合并、音频转文字、AI 总结等能力。

本项目是学习型项目，重点是学习浏览器插件、油猴脚本、网页注入、页面数据解析、下载能力、字幕格式转换和后续的音视频处理流程。

## 当前项目状态

Tampermonkey userscript V0.1 已经完成，并已打 `v0.1.0` 标签。

V0.1 userscript 已实现：

1. 在 bilibili 视频页面注入右侧 `Bili Tools` 浮动按钮。
2. 点击按钮后显示一个简单面板。
3. 面板展示当前视频基础信息：
   - 标题
   - BV 号
   - 当前 URL，已去掉 `spm_id_from`、`vd_source` 等追踪参数
   - 封面预览
   - 封面 URL
   - UP 主名称
   - CID
4. 支持下载封面。
5. 支持复制视频信息为 Markdown。
6. 支持单行字段复制。
7. 支持 toast 消息提示，并在几秒后自动消失。

用户已经大致理解油猴脚本的基本写法和运行逻辑，包括：

- userscript 头部元信息
- `@match` 页面匹配
- `@grant` 油猴能力声明
- DOM 注入
- 事件监听
- 页面 URL 解析
- `GM_xmlhttpRequest`
- `GM_download`
- `GM_setClipboard`
- 简单 UI 状态提示

## 下一阶段定位

下一阶段直接开始 Chrome Extension Manifest V3 插件版。

V0.2 信息解析增强和 V0.3 字幕能力暂缓，不急着实现。原因是当前学习目标已经从“继续扩展 userscript 功能”切换为“理解浏览器插件具体怎么实现”。后续如果真实使用中出现需求，再回头继续开发字幕、音频、视频流等功能。

插件版当前目标不是做复杂完整下载器，而是把 userscript V0.1 的核心能力迁移到 Chrome Extension MV3 的最小可用结构中，重点学习插件机制。

## 下一阶段优先级

第一优先级：创建 Chrome Extension Manifest V3 最小骨架。

第二优先级：把 userscript V0.1 的核心能力迁移到 extension：

1. content script 注入 `Bili Tools` 按钮和面板。
2. content script 获取当前视频基础信息。
3. content script 显示标题、BV 号、当前 URL、封面 URL、UP 主和 CID。
4. 支持复制 Markdown。
5. 支持单行字段复制。
6. 支持下载封面。

第三优先级：理解 extension 和 userscript 的差异：

- userscript 的 `@match` 对应 extension 的 `content_scripts.matches`。
- userscript 的 `@grant` 对应 extension 的 `permissions` 和 `host_permissions`。
- userscript 的 `GM_download` 对应 extension 的 `chrome.downloads.download`，通常放到 background service worker 里处理。
- userscript 的 `GM_xmlhttpRequest` 可以替换为 `fetch`，必要时配合 `host_permissions`。
- content script 负责页面注入和 DOM 交互。
- background service worker 负责下载、跨域能力、长期任务和插件级能力。
- popup 页面暂时不是重点，可先做 README 或最小占位页面。

## 技术路线

项目分两条线：

### 1. userscript 原型线

目录：

```text
userscript/
└── bili-onetool.user.js
```

当前状态：V0.1 已完成。

这条线主要用于学习和验证：

- DOM 注入
- 页面选择器读取
- B 站公开接口请求
- `GM_download` 下载文件
- `GM_xmlhttpRequest` 请求接口
- `GM_setClipboard` 复制内容
- 面板 UI 和状态提示

后续除非真实需求出现，暂时不继续扩展 V0.2/V0.3。

### 2. browser extension 正式线

目录：

```text
extension/
```

下一阶段优先使用 Chrome Extension Manifest V3 做正式版学习实现。

建议第一版插件结构：

```text
extension/
├── manifest.json
├── src/
│   ├── content/
│   │   ├── content.js
│   │   └── content.css
│   ├── background/
│   │   └── service-worker.js
│   └── shared/
│       ├── video-info.js
│       └── markdown.js
└── README.md
```

可以先不做复杂构建工具，不引入框架，直接使用原生 JavaScript、CSS 和 Manifest V3。

## 功能边界

当前不做：

- 批量下载
- 大会员专属资源处理
- 绕过平台限制
- 破解签名
- 绕过 DRM
- 自动化规避风控
- ffmpeg.wasm 合并
- 音频转 MP3
- Whisper 转文字
- AI 总结

当前只做公开页面可见信息和基础资源整理。

## 插件版 MVP 建议

Chrome Extension MVP 的最小目标：

1. `manifest.json`
   - 使用 Manifest V3。
   - 配置 `content_scripts` 匹配 `https://www.bilibili.com/video/*`。
   - 配置 `permissions`，例如 `downloads`。
   - 配置 `host_permissions`，例如 `https://api.bilibili.com/*` 和 `https://*.hdslb.com/*`。
2. `content.js`
   - 判断当前页面是否是视频页。
   - 注入按钮和面板。
   - 从 URL 获取 BV 号。
   - 请求 B 站公开 view 接口。
   - 渲染视频信息。
   - 处理复制 Markdown 和单行复制。
   - 发送下载封面消息给 background。
3. `service-worker.js`
   - 监听来自 content script 的下载消息。
   - 调用 `chrome.downloads.download` 下载封面。
4. `content.css`
   - 承载按钮、面板、字段列表、toast 的样式。
5. `extension/README.md`
   - 说明如何在 `chrome://extensions` 中加载未打包插件。

## 新对话启动提示词

新对话开始时，可以直接使用下面这段提示词：

```text
请读取 /Users/zhou/Coding/bili-onetool/AGENTS.md 和当前仓库代码。我们已经完成 Tampermonkey userscript V0.1，并决定暂缓 V0.2/V0.3，直接开始 Chrome Extension Manifest V3 插件版制作。

目标不是做完整下载器，而是学习 Chrome Extension 的实现方式，并把 userscript V0.1 的核心能力迁移成一个最小可用插件。

请先不要引入 React/Vite/Webpack，也不要做复杂架构。优先创建 extension/ 下的 MV3 最小骨架：

1. manifest.json
2. src/content/content.js
3. src/content/content.css
4. src/background/service-worker.js
5. 更新 extension/README.md，说明如何在 chrome://extensions 加载未打包插件

第一版插件需要实现或预留：

- 在 B 站视频页注入 Bili Tools 按钮和面板
- 展示标题、BV 号、干净 URL、封面 URL、UP 主和 CID
- 复制 Markdown
- 单行字段复制
- 下载封面，下载动作通过 background service worker 调用 chrome.downloads.download

请先读取 userscript/bili-onetool.user.js，理解现有逻辑，然后给出迁移方案并开始实现最小插件骨架。
```
