# Roadmap

## V0.1：Tampermonkey 原型（已完成）

目标是跑通最小可用闭环：

- [x] 在 B 站视频页注入右侧 `Bili Tools` 浮动按钮。
- [x] 点击按钮显示或隐藏基础面板。
- [x] 展示标题、BV 号、当前 URL、封面预览、封面 URL、UP 主名称和 CID。
- [x] 当前 URL 去掉追踪参数，只保留干净视频链接。
- [x] 支持下载封面。
- [x] 支持复制视频信息为 Markdown。
- [x] 支持单行字段复制。
- [x] 支持操作结果 toast 提示。
- [x] 保持代码结构简单，并预留信息解析、下载动作和 UI 渲染的模块边界。

## V0.2：信息解析增强

目标是提高页面数据获取的稳定性：

- 梳理 B 站页面中可用的数据来源，例如 DOM、`window.__INITIAL_STATE__` 和公开接口。
- 增强 UP 主、CID、封面、分 P 信息的获取逻辑。
- 增加基础错误提示和刷新能力。
- 补充 Markdown 输出字段和格式选项。

## V0.3：字幕能力

目标是探索字幕检测和下载：

- 检测当前视频是否存在字幕。
- 展示字幕语言、字幕名称和可下载状态。
- 支持下载公开可访问字幕。
- 探索字幕格式转换，例如 JSON 转 SRT / VTT。

## V0.4：插件迁移准备

目标是整理可迁移到 Chrome Extension 的模块结构：

- 抽取信息解析、Markdown 格式化、文件命名等共享逻辑。
- 明确 userscript 与 extension 的差异点。
- 设计 Manifest V3 插件目录结构。
- 准备 content script、background service worker、popup 和 storage 的边界。

## V0.5：Chrome Extension MVP

目标是实现正式插件版最小可用版本：

- 创建 Manifest V3 插件基础结构。
- 使用 content script 注入按钮和面板。
- 使用 extension API 处理下载和配置存储。
- 提供基础 popup 页面展示设置或任务状态。
- 功能对齐 userscript V0.1 到 V0.3 的稳定能力。
