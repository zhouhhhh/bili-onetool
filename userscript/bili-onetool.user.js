// ==UserScript==
// @name         Bili OneTool
// @namespace    https://github.com/bili-onetool
// @version      0.1.4
// @description  在哔哩哔哩视频页注入轻量工具面板，整理当前视频公开信息。
// @author       zhouhhhh
// @match        https://www.bilibili.com/video/*
// @match        https://bilibili.com/video/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        GM_download
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      api.bilibili.com
// @connect      *.hdslb.com
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // 基础标识和 DOM id 都集中定义，避免后面拼字符串时写散。
  const APP_ID = 'bili-onetool';
  const APP_NAME = 'Bili OneTool';
  const BUTTON_ID = `${APP_ID}-button`;
  const PANEL_ID = `${APP_ID}-panel`;
  const API_VIEW_URL = 'https://api.bilibili.com/x/web-interface/view';
  const STATUS_AUTO_CLEAR_DELAY = 3000;

  // 先缓存最近一次读取结果，后续下载封面和复制 Markdown 会复用它。
  let currentVideoInfo = null;
  let statusClearTimer = null;

  // 脚本入口：确认当前是 B 站视频页后，再注入样式和浮动按钮。
  function init() {
    if (!isVideoPage()) {
      return;
    }

    injectStyle();
    injectFloatingButton();

    console.info(`[${APP_NAME}] userscript loaded`, {
      appId: APP_ID,
      url: window.location.href,
    });
  }

  function isVideoPage() {
    return /^\/video\/BV[a-zA-Z0-9]+/.test(window.location.pathname);
  }

  // 把工具按钮、面板、封面预览、按钮组等样式动态插入到当前页面。
  function injectStyle() {
    if (document.getElementById(`${APP_ID}-style`)) {
      return;
    }

    const style = document.createElement('style');
    style.id = `${APP_ID}-style`;
    style.textContent = `
      #${BUTTON_ID} {
        position: fixed;
        top: 160px;
        right: 24px;
        z-index: 999999;
        padding: 10px 14px;
        border: 0;
        border-radius: 8px;
        color: #fff;
        background: #00aeec;
        font-size: 14px;
        font-weight: 600;
        line-height: 1;
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
      }

      #${BUTTON_ID}:hover {
        background: #0098d4;
      }

      #${PANEL_ID} {
        position: fixed;
        top: 208px;
        right: 24px;
        z-index: 999999;
        width: 280px;
        max-height: calc(100vh - 232px);
        padding: 14px;
        border: 1px solid #e3e5e7;
        border-radius: 8px;
        color: #18191c;
        background: #fff;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
        font-size: 14px;
        line-height: 1.5;
        overflow: hidden;
      }

      #${PANEL_ID}[hidden] {
        display: none;
      }

      #${PANEL_ID} h2 {
        margin: 0;
        font-size: 16px;
      }

      #${PANEL_ID} p {
        margin: 0;
        color: #61666d;
      }

      #${PANEL_ID} .${APP_ID}-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }

      #${PANEL_ID} .${APP_ID}-icon-button {
        border: 0;
        color: #9499a0;
        background: transparent;
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
      }

      #${PANEL_ID} .${APP_ID}-cover {
        width: 100%;
        margin-bottom: 10px;
        overflow: hidden;
        border-radius: 6px;
        background: #f1f2f3;
      }

      #${PANEL_ID} .${APP_ID}-cover img {
        display: block;
        width: 100%;
        height: auto;
      }

      #${PANEL_ID} .${APP_ID}-info-list {
        display: grid;
        gap: 8px;
        margin: 0;
      }

      #${PANEL_ID} .${APP_ID}-info-list div {
        display: grid;
        gap: 2px;
      }

      #${PANEL_ID} .${APP_ID}-info-item dd {
        display: flex;
        align-items: flex-start;
        gap: 6px;
      }

      #${PANEL_ID} .${APP_ID}-info-value {
        flex: 1;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      #${PANEL_ID} .${APP_ID}-copy-row-button {
        flex: 0 0 auto;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 1px solid #e3e5e7;
        border-radius: 4px;
        color: #61666d;
        background: #fff;
        font-size: 12px;
        line-height: 22px;
        cursor: pointer;
      }

      #${PANEL_ID} .${APP_ID}-copy-row-button:hover {
        color: #00aeec;
        border-color: #00aeec;
      }

      #${PANEL_ID} .${APP_ID}-info-list dt {
        color: #9499a0;
        font-size: 12px;
      }

      #${PANEL_ID} .${APP_ID}-info-list dd {
        margin: 0;
        overflow-wrap: anywhere;
      }

      #${PANEL_ID} .${APP_ID}-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
      }

      #${PANEL_ID} .${APP_ID}-actions button {
        flex: 1 1 0;
        min-width: 0;
        padding: 7px 6px;
        border: 1px solid #e3e5e7;
        border-radius: 6px;
        color: #18191c;
        background: #fff;
        font-size: 12px;
        white-space: nowrap;
        cursor: pointer;
      }

      #${PANEL_ID} .${APP_ID}-actions button:hover {
        color: #00aeec;
        border-color: #00aeec;
      }

      #${PANEL_ID} .${APP_ID}-message {
        padding: 10px;
        border-radius: 6px;
        background: #f6f7f8;
      }

      #${PANEL_ID} .${APP_ID}-content {
        max-height: calc(100vh - 360px);
        overflow: auto;
      }

      #${PANEL_ID} .${APP_ID}-status {
        position: fixed;
        top: 116px;
        right: 24px;
        z-index: 1000000;
        width: 280px;
        box-sizing: border-box;
        padding: 10px 12px;
        border: 1px solid #e3e5e7;
        border-radius: 8px;
        color: #18191c;
        background: #fff;
        font-size: 12px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
        opacity: 0;
        pointer-events: none;
        transform: translateY(-8px);
        transition: opacity 0.18s ease, transform 0.18s ease;
      }

      #${PANEL_ID} .${APP_ID}-status:not(:empty) {
        opacity: 1;
        transform: translateY(0);
      }

      #${PANEL_ID} .${APP_ID}-error {
        color: #d03050;
        background: #fff2f3;
      }

      #${PANEL_ID} .${APP_ID}-status.${APP_ID}-error {
        border-color: #ffd0d7;
        background: #fff2f3;
      }
    `;

    document.head.appendChild(style);
  }

  // 创建右侧浮动入口按钮；点击后由 togglePanel 控制面板开关。
  function injectFloatingButton() {
    if (document.getElementById(BUTTON_ID)) {
      return;
    }

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.textContent = 'Bili Tools';
    button.addEventListener('click', togglePanel);

    document.body.appendChild(button);
  }

  // 面板每次打开时都刷新一次信息，适配 B 站站内切换视频但页面不完全刷新的情况。
  function togglePanel() {
    const panel = getOrCreatePanel();
    panel.hidden = !panel.hidden;

    // B 站视频页可能是单页跳转，面板每次打开时都重新读取当前 URL。
    if (!panel.hidden) {
      refreshVideoInfo();
    }
  }

  // 懒创建面板：第一次点击按钮时创建，之后复用同一个 DOM。
  function getOrCreatePanel() {
    const existingPanel = document.getElementById(PANEL_ID);
    if (existingPanel) {
      return existingPanel;
    }

    const panel = document.createElement('section');
    panel.id = PANEL_ID;
    panel.hidden = true;
    panel.innerHTML = `
      <div class="${APP_ID}-header">
        <h2>Bili OneTool</h2>
        <button class="${APP_ID}-icon-button" type="button" data-action="close" title="关闭面板">×</button>
      </div>
      <div class="${APP_ID}-actions">
        <button type="button" data-action="refresh">刷新信息</button>
        <button type="button" data-action="download-cover">下载封面</button>
        <button type="button" data-action="copy-markdown">复制MD</button>
      </div>
      <div class="${APP_ID}-content">
        <p class="${APP_ID}-message">脚本已加载。点击刷新后读取当前视频信息。</p>
      </div>
      <p class="${APP_ID}-status" aria-live="polite"></p>
    `;
    // 面板按钮统一用 data-action 分发，后续新增按钮时不用重复绑定事件。
    panel.addEventListener('click', handlePanelClick);

    document.body.appendChild(panel);
    return panel;
  }

  // 面板内所有按钮都通过 data-action 分发，新增按钮时只需要加一个 action 分支。
  function handlePanelClick(event) {
    const action = event.target.dataset.action;

    if (action === 'close') {
      document.getElementById(PANEL_ID).hidden = true;
      return;
    }

    if (action === 'refresh') {
      refreshVideoInfo();
      return;
    }

    if (action === 'download-cover') {
      downloadCover();
      return;
    }

    if (action === 'copy-markdown') {
      copyMarkdown();
      return;
    }

    if (action === 'copy-info-row') {
      copyInfoRow(event.target);
    }
  }

  // 读取当前视频信息，并把结果缓存到 currentVideoInfo，供复制和下载复用。
  async function refreshVideoInfo() {
    const panel = getOrCreatePanel();
    currentVideoInfo = null;
    renderPanelMessage(panel, '正在读取当前视频信息...');
    renderPanelStatus(panel, '');

    try {
      const bvId = getBvIdFromUrl();
      const videoInfo = await fetchVideoInfo(bvId);

      currentVideoInfo = videoInfo;
      renderVideoInfo(panel, videoInfo);
    } catch (error) {
      console.warn(`[${APP_NAME}] failed to load video info`, error);
      renderPanelMessage(panel, error.message || '读取视频信息失败', true);
    }
  }

  // 复制 Markdown：没有缓存时先刷新，再把视频信息格式化后写入剪贴板。
  async function copyMarkdown() {
    const panel = getOrCreatePanel();

    try {
      if (!currentVideoInfo) {
        renderPanelStatus(panel, '还没有视频信息，正在先刷新...');
        await refreshVideoInfo();
      }

      if (!currentVideoInfo) {
        throw new Error('没有可复制的视频信息');
      }

      GM_setClipboard(formatMarkdown(currentVideoInfo), 'text');
      renderPanelStatus(panel, '已复制 Markdown 到剪贴板', false, true);
    } catch (error) {
      console.warn(`[${APP_NAME}] failed to copy markdown`, error);
      renderPanelStatus(panel, error.message || '复制 Markdown 失败', true);
    }
  }

  // 下载封面：没有缓存时先刷新，再用 GM_download 保存封面文件。
  async function downloadCover() {
    const panel = getOrCreatePanel();

    try {
      if (!currentVideoInfo) {
        renderPanelStatus(panel, '还没有视频信息，正在先刷新...');
        await refreshVideoInfo();
      }

      if (!currentVideoInfo) {
        throw new Error('没有可下载的封面信息');
      }

      if (!currentVideoInfo.coverUrl) {
        throw new Error('未获取到封面 URL');
      }

      renderPanelStatus(panel, '正在下载封面...');
      await downloadFile(currentVideoInfo.coverUrl, getCoverFileName(currentVideoInfo));
      renderPanelStatus(panel, '封面下载已开始', false, true);
    } catch (error) {
      console.warn(`[${APP_NAME}] failed to download cover`, error);
      renderPanelStatus(panel, error.message || '下载封面失败', true);
    }
  }

  // 复制单行字段的值，例如 BV 号这一行只复制“BVxxxx”。
  function copyInfoRow(button) {
    const panel = getOrCreatePanel();
    const { label, value } = button.dataset;

    GM_setClipboard(`${value}`, 'text');
    renderPanelStatus(panel, `已复制${label}`, false, true);
  }
  
  // 从当前地址中提取 BV 号，例如 /video/BV1xxx -> BV1xxx。
  function getBvIdFromUrl(url = window.location.href) {
    const { pathname } = new URL(url);
    const match = pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);

    return match ? match[1] : '';
  }

  // 调用 B 站公开 view 接口获取标题、封面、UP 主、CID 等基础信息。
  function fetchVideoInfo(bvId) {
    if (!bvId) {
      return Promise.reject(new Error('未在当前页面 URL 中找到 BV 号'));
    }

    // 当前阶段只调用 B 站公开 view 接口，避免触碰播放流、签名等后续范围。
    const requestUrl = `${API_VIEW_URL}?bvid=${encodeURIComponent(bvId)}`;

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: requestUrl,
        responseType: 'json',
        onload(response) {
          try {
            const payload = response.response || JSON.parse(response.responseText);

            if (payload.code !== 0) {
              reject(new Error(payload.message || '接口返回异常'));
              return;
            }

            resolve(normalizeVideoInfo(payload.data));
          } catch (error) {
            reject(new Error('解析视频信息失败'));
          }
        },
        onerror() {
          reject(new Error('请求视频信息失败'));
        },
        ontimeout() {
          reject(new Error('请求视频信息超时'));
        },
      });
    });
  }

  // 把接口返回的大对象整理成面板真正需要的小对象。
  function normalizeVideoInfo(data) {
    const bvid = data.bvid || getBvIdFromUrl();

    return {
      title: data.title || document.title,
      bvid,
      pageUrl: getCleanVideoUrl(bvid),
      coverUrl: normalizeResourceUrl(data.pic),
      upName: data.owner && data.owner.name ? data.owner.name : '',
      cid: data.cid ? String(data.cid) : '',
    };
  }

  // 生成不带 spm_id_from、vd_source 等个人追踪参数的干净视频链接。
  function getCleanVideoUrl(bvId) {
    return bvId ? `https://www.bilibili.com/video/${bvId}` : '';
  }

  // B 站资源可能返回 // 或 http:// 开头，这里统一成可安全展示和下载的 https://。
  function normalizeResourceUrl(url) {
    if (!url) {
      return '';
    }

    if (url.startsWith('//')) {
      return `https:${url}`;
    }

    if (url.startsWith('http://')) {
      return url.replace(/^http:\/\//, 'https://');
    }

    return url;
  }

  // 把当前视频信息渲染成封面预览和字段列表。
  function renderVideoInfo(panel, videoInfo) {
    const content = panel.querySelector(`.${APP_ID}-content`);
    const coverHtml = videoInfo.coverUrl
      ? `<img src="${escapeHtml(videoInfo.coverUrl)}" alt="视频封面">`
      : `<p class="${APP_ID}-message">未获取到封面</p>`;

    content.innerHTML = `
      <div class="${APP_ID}-cover">${coverHtml}</div>
      <dl class="${APP_ID}-info-list">
        ${renderInfoItem('标题', videoInfo.title)}
        ${renderInfoItem('BV号', videoInfo.bvid)}
        ${renderInfoItem('UP主', videoInfo.upName)}
        ${renderInfoItem('CID', videoInfo.cid)}
        ${renderInfoItem('当前URL', videoInfo.pageUrl)}
        ${renderInfoItem('封面URL', videoInfo.coverUrl)}
      </dl>
    `;
  }

  // 渲染单个字段；所有值都先转义，避免外部文本直接进入 HTML。
  function renderInfoItem(label, value) {
    const displayValue = value || '未获取到';

    return `
      <div class="${APP_ID}-info-item">
        <dt>${escapeHtml(label)}</dt>
        <dd>
          <span class="${APP_ID}-info-value">${escapeHtml(displayValue)}</span>
          <button
            class="${APP_ID}-copy-row-button"
            type="button"
            data-action="copy-info-row"
            data-label="${escapeHtml(label)}"
            data-value="${escapeHtml(displayValue)}"
            title="复制${escapeHtml(label)}"
          >⧉</button>
        </dd>
      </div>
    `;
  }

  // 面板主内容区的提示，例如“正在读取”或“读取失败”。
  function renderPanelMessage(panel, message, isError = false) {
    const content = panel.querySelector(`.${APP_ID}-content`);
    const className = isError ? `${APP_ID}-message ${APP_ID}-error` : `${APP_ID}-message`;

    content.innerHTML = `<p class="${className}">${escapeHtml(message)}</p>`;
  }

  // 浮层状态提示；默认 3 秒后自动清空，避免提示藏在面板底部或长期常驻。
  function renderPanelStatus(panel, message, isError = false, autoClear = true) {
    const status = panel.querySelector(`.${APP_ID}-status`);
    if (!status) {
      return;
    }

    clearStatusTimer();

    status.className = isError ? `${APP_ID}-status ${APP_ID}-error` : `${APP_ID}-status`;
    status.textContent = message;

    if (message && autoClear) {
      statusClearTimer = window.setTimeout(() => {
        renderPanelStatus(panel, '');
      }, STATUS_AUTO_CLEAR_DELAY);
    }
  }

  // 清理上一次自动隐藏状态的定时器，避免旧定时器清掉新提示。
  function clearStatusTimer() {
    if (!statusClearTimer) {
      return;
    }

    window.clearTimeout(statusClearTimer);
    statusClearTimer = null;
  }

  // 生成复制到剪贴板的 Markdown 文本。
  function formatMarkdown(videoInfo) {
    return `# ${formatMarkdownValue(videoInfo.title)}

UP主：${formatMarkdownValue(videoInfo.upName)}  
BV号：${formatMarkdownValue(videoInfo.bvid)}  
CID：${formatMarkdownValue(videoInfo.cid)}  
链接：${formatMarkdownValue(videoInfo.pageUrl)}  
封面：${formatMarkdownValue(videoInfo.coverUrl)}

## 备注`;
  }

  // Markdown 里缺失的字段统一显示为“未获取到”。
  function formatMarkdownValue(value) {
    return value ? String(value) : '未获取到';
  }

  // 对 GM_download 做一层 Promise 包装，方便 downloadCover 使用 await。
  function downloadFile(url, fileName) {
    return new Promise((resolve, reject) => {
      GM_download({
        url,
        name: fileName,
        saveAs: false,
        onload() {
          resolve();
        },
        onerror() {
          reject(new Error('下载封面失败'));
        },
        ontimeout() {
          reject(new Error('下载封面超时'));
        },
      });
    });
  }

  // 封面文件名使用“标题-BV号.扩展名”，其中标题和 BV 号都会先做文件名清理。
  function getCoverFileName(videoInfo) {
    const title = sanitizeFileName(videoInfo.title || 'bili-cover');
    const bvid = sanitizeFileName(videoInfo.bvid || 'unknown');
    const extension = getFileExtensionFromUrl(videoInfo.coverUrl) || 'jpg';

    return `${title}-${bvid}.${extension}`;
  }

  // 去掉系统文件名不允许的字符，并限制长度，避免下载保存失败。
  function sanitizeFileName(fileName) {
    return String(fileName)
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/[\u0000-\u001f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'bili-cover';
  }

  // 从封面 URL 中猜测扩展名；猜不到时上层会回退到 jpg。
  function getFileExtensionFromUrl(url) {
    try {
      const { pathname } = new URL(url);
      const match = pathname.match(/\.([a-z0-9]+)(?:@.*)?$/i);

      return match ? match[1].toLowerCase() : '';
    } catch (error) {
      return '';
    }
  }

  function escapeHtml(value) {
    // 接口和页面标题都属于外部输入，写入 innerHTML 前必须转义。
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  init();
})();
