// ==UserScript==
// @name         Bili OneTool
// @namespace    https://github.com/bili-onetool
// @version      0.1.3
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
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const APP_ID = 'bili-onetool';
  const APP_NAME = 'Bili OneTool';
  const BUTTON_ID = `${APP_ID}-button`;
  const PANEL_ID = `${APP_ID}-panel`;
  const API_VIEW_URL = 'https://api.bilibili.com/x/web-interface/view';
  const STATUS_AUTO_CLEAR_DELAY = 3000;

  // 先缓存最近一次读取结果，后续下载封面和复制 Markdown 会复用它。
  let currentVideoInfo = null;
  let statusClearTimer = null;

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
        padding: 14px;
        border: 1px solid #e3e5e7;
        border-radius: 8px;
        color: #18191c;
        background: #fff;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
        font-size: 14px;
        line-height: 1.5;
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
        margin-top: 12px;
      }

      #${PANEL_ID} .${APP_ID}-actions button {
        flex: 1;
        padding: 7px 8px;
        border: 1px solid #e3e5e7;
        border-radius: 6px;
        color: #18191c;
        background: #fff;
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

      #${PANEL_ID} .${APP_ID}-status {
        min-height: 18px;
        margin-top: 10px;
        color: #61666d;
        font-size: 12px;
      }

      #${PANEL_ID} .${APP_ID}-error {
        color: #d03050;
        background: #fff2f3;
      }

      #${PANEL_ID} .${APP_ID}-status.${APP_ID}-error {
        background: transparent;
      }
    `;

    document.head.appendChild(style);
  }

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

  function togglePanel() {
    const panel = getOrCreatePanel();
    panel.hidden = !panel.hidden;

    // B 站视频页可能是单页跳转，面板每次打开时都重新读取当前 URL。
    if (!panel.hidden) {
      refreshVideoInfo();
    }
  }

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
      <div class="${APP_ID}-content">
        <p class="${APP_ID}-message">脚本已加载。点击刷新后读取当前视频信息。</p>
      </div>
      <p class="${APP_ID}-status" aria-live="polite"></p>
      <div class="${APP_ID}-actions">
        <button type="button" data-action="refresh">刷新信息</button>
        <button type="button" data-action="copy-markdown">复制 Markdown</button>
      </div>
    `;
    // 面板按钮统一用 data-action 分发，后续新增按钮时不用重复绑定事件。
    panel.addEventListener('click', handlePanelClick);

    document.body.appendChild(panel);
    return panel;
  }

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

    if (action === 'copy-markdown') {
      copyMarkdown();
    }
  }

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

  function getBvIdFromUrl(url = window.location.href) {
    const { pathname } = new URL(url);
    const match = pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);

    return match ? match[1] : '';
  }

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

  function normalizeVideoInfo(data) {
    const bvid = data.bvid || getBvIdFromUrl();

    return {
      title: data.title || document.title,
      bvid,
      pageUrl: getCleanVideoUrl(bvid),
      coverUrl: data.pic || '',
      upName: data.owner && data.owner.name ? data.owner.name : '',
      cid: data.cid ? String(data.cid) : '',
    };
  }

  function getCleanVideoUrl(bvId) {
    return bvId ? `https://www.bilibili.com/video/${bvId}` : '';
  }

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

  function renderInfoItem(label, value) {
    return `
      <div>
        <dt>${escapeHtml(label)}</dt>
        <dd>${escapeHtml(value || '未获取到')}</dd>
      </div>
    `;
  }

  function renderPanelMessage(panel, message, isError = false) {
    const content = panel.querySelector(`.${APP_ID}-content`);
    const className = isError ? `${APP_ID}-message ${APP_ID}-error` : `${APP_ID}-message`;

    content.innerHTML = `<p class="${className}">${escapeHtml(message)}</p>`;
  }

  function renderPanelStatus(panel, message, isError = false, autoClear = false) {
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

  function clearStatusTimer() {
    if (!statusClearTimer) {
      return;
    }

    window.clearTimeout(statusClearTimer);
    statusClearTimer = null;
  }

  function formatMarkdown(videoInfo) {
    return `# ${formatMarkdownValue(videoInfo.title)}

UP主：${formatMarkdownValue(videoInfo.upName)}  
BV号：${formatMarkdownValue(videoInfo.bvid)}  
CID：${formatMarkdownValue(videoInfo.cid)}  
链接：${formatMarkdownValue(videoInfo.pageUrl)}  
封面：${formatMarkdownValue(videoInfo.coverUrl)}

## 备注`;
  }

  function formatMarkdownValue(value) {
    return value ? String(value) : '未获取到';
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
