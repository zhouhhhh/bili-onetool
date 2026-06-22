# Bili OneTool

Bili OneTool 是一个面向哔哩哔哩视频页面的浏览器增强工具。

当前阶段优先开发 Tampermonkey userscript 原型版，用于验证页面信息提取、封面下载、字幕检测等能力。后续会迁移为 Chrome Extension Manifest V3 插件版。

## 当前阶段

V0.1 userscript 原型：

- 页面右侧浮动按钮
- 读取视频标题、BV号、URL、封面
- 下载封面
- 复制视频信息 Markdown

## 目录结构

- `userscript/`：油猴脚本原型
- `extension/`：浏览器插件版本
- `docs/`：路线图和设计文档
- `AGENTS.md`：给 Codex / AI 的项目上下文