# Bili OneTool 项目上下文

## 项目目标

做一个面向哔哩哔哩视频页面的浏览器增强工具，暂定名为 Bili OneTool。

目标是在 B 站视频播放页中注入一个小型工具按钮/面板，帮助用户快速获取和整理视频资源信息。项目初期优先实现轻量、稳定、合法边界较清晰的功能，例如封面、视频元信息、字幕检测与下载。后续再探索音频、视频流、不同清晰度下载、音视频合并、音频转文字、AI 总结等能力。

本项目是学习型项目，重点是学习浏览器插件、油猴脚本、网页注入、页面数据解析、下载能力、字幕格式转换和后续的音视频处理流程。

## 当前阶段定位

当前不要一上来做完整下载器，也不要一开始处理 ffmpeg.wasm、音视频合并、MP3 转码、AI 转写。

当前阶段只做 V0.1：

1. 在 bilibili 视频页面注入一个右侧浮动按钮。
2. 点击按钮后显示一个简单面板。
3. 面板展示当前视频的基础信息：
   - 标题
   - BV 号
   - 当前 URL
   - 封面 URL
   - UP 主名称，如果能稳定获取
   - CID，如果能稳定获取
4. 支持下载封面。
5. 支持复制视频信息为 Markdown。
6. 代码结构要为后续扩展字幕、音频、视频流下载预留空间。

## 技术路线

项目分两条线：

### 1. userscript 原型线

目录名建议：

bili-onetool-userscript

使用 Tampermonkey / 油猴脚本快速验证 B 站页面数据获取和页面注入能力。

Tampermonkey 可用能力包括：
- DOM 注入
- 页面选择器读取
- GM_download 下载文件
- GM_xmlhttpRequest 请求接口
- GM_setValue / GM_getValue 保存配置

### 2. browser extension 正式线

目录名建议：

bili-onetool-extension

后续使用 Chrome Extension Manifest V3 做正式版本。

插件结构大致包括：
- manifest.json
- content script：注入 B 站页面、显示工具按钮和面板
- service worker/background：后续处理下载、跨域请求、任务调度
- popup 页面：后续显示设置和任务状态
- storage：保存默认下载选项和用户设置

当前优先做 userscript 原型线，不要过早写复杂插件架构。

## 当前优先级

第一优先级：跑通 Tampermonkey 版本 V0.1。

第二优先级：整理出可迁移到 Chrome 插件的模块结构。

第三优先级：再迁移到 Manifest V3 插件。

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

## V0.1 功能清单

### 浮动按钮

在 bilibili 视频页面右侧注入一个固定按钮。

按钮文字：

Bili Tools

点击后打开/关闭面板。

### 面板内容

面板显示：

- 标题
- BV 号
- 当前页面 URL
- 封面预览
- 封面 URL
- UP 主名称，如果可获取
- CID，如果可获取

### 按钮功能

1. 下载封面
2. 复制 Markdown 信息
3. 刷新当前视频信息
4. 关闭面板

### Markdown 复制格式

示例：

# 视频标题

UP主：xxx  
BV号：BVxxxx  
CID：xxxx  
链接：https://www.bilibili.com/video/BVxxxx  
封面：封面URL

## 备注