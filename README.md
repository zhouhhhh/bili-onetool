# Bili OneTool

Bili OneTool 是一个面向哔哩哔哩视频播放页的浏览器增强工具。项目目标是在页面中注入一个轻量工具按钮和面板，帮助用户快速获取、整理当前视频的公开页面信息，例如标题、BV 号、链接、封面、UP 主和 CID。

这是一个学习型项目，重点放在浏览器脚本、页面注入、页面数据解析、下载能力、字幕格式处理，以及后续迁移到浏览器插件的工程结构上。

## 当前阶段

V0.1 Tampermonkey userscript 原型版已经完成：

- 在 B 站视频页右侧注入 `Bili Tools` 浮动按钮。
- 点击按钮后显示一个简单信息面板。
- 展示当前视频基础信息：标题、BV 号、当前 URL、封面 URL、UP 主名称和 CID。
- 当前 URL 会去掉 `spm_id_from`、`vd_source` 等参数，只保留干净视频链接。
- 支持下载封面。
- 支持复制视频信息为 Markdown。
- 支持单行字段复制。
- 支持操作结果 toast 提示。

当前不做完整下载器、音视频合并、转码、AI 总结、风控规避或平台限制绕过。

## 安装使用

1. 安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/)。
2. 在 Tampermonkey 中新建脚本。
3. 复制 `userscript/bili-onetool.user.js` 的全部内容并保存。
4. 打开任意 B 站视频页，例如 `https://www.bilibili.com/video/BVxxxx`。
5. 点击页面右侧的 `Bili Tools` 按钮。

## V0.1 功能

- 读取视频标题、BV 号、当前页面 URL、封面 URL、UP 主名称和 CID。
- 展示封面预览。
- 下载封面图片。
- 复制完整 Markdown 信息。
- 复制单行字段值。
- 使用 toast 展示复制、下载和错误提示。
- 仅处理公开页面基础信息，不处理播放流、签名、DRM 或平台限制绕过。

## 目录说明

```text
bili-onetool/
├── AGENTS.md
├── README.md
├── .gitignore
├── userscript/
│   └── bili-onetool.user.js
├── extension/
│   └── README.md
└── docs/
    └── roadmap.md
```

- `AGENTS.md`：项目上下文、阶段目标、功能边界和开发约束，供 Codex / AI 协作时读取。
- `README.md`：项目简介、当前阶段和目录说明。
- `.gitignore`：忽略系统文件、编辑器配置、依赖目录、构建产物和本地环境变量。
- `userscript/`：Tampermonkey / 油猴脚本原型线，当前第一优先级。
- `extension/`：Chrome Extension Manifest V3 正式插件线，后续迁移使用。
- `docs/`：路线图、设计记录和后续功能规划。

## 开发路线

V0.1 已经用 userscript 跑通页面注入、信息提取、封面下载和复制能力。后续可以继续做 V0.2 的信息解析增强，或者开始整理可迁移到 Chrome Extension Manifest V3 的模块结构。
