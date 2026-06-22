# Bili OneTool Extension

这里预留给后续 Chrome Extension Manifest V3 正式插件版。

当前阶段优先完成 `userscript/` 下的 Tampermonkey 原型，不提前搭建复杂插件架构。等 V0.1 的页面注入、信息提取、封面下载和 Markdown 复制流程稳定后，再把可复用逻辑迁移到插件版。

## 后续结构设想

```text
extension/
├── manifest.json
├── src/
│   ├── content/
│   ├── background/
│   ├── popup/
│   └── shared/
└── README.md
```

- `manifest.json`：Manifest V3 插件清单。
- `src/content/`：注入 B 站页面，负责工具按钮、面板和页面数据读取。
- `src/background/`：service worker，后续处理下载、跨域请求和任务调度。
- `src/popup/`：插件弹窗，后续显示设置和任务状态。
- `src/shared/`：userscript 和 extension 可复用的数据解析、格式化和下载辅助逻辑。

## 迁移原则

- 先保持功能轻量，只处理公开页面可见信息。
- 不实现绕过平台限制、破解签名、绕过 DRM 或自动化规避风控。
- userscript 中稳定的解析逻辑再抽取到插件共享模块。
- 下载、跨域请求和长期配置能力优先放到插件权限模型中处理。
