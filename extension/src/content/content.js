(function () {
  'use strict';

  const APP_ID = 'bili-onetool';
  const APP_NAME = 'Bili OneTool';
  const BUTTON_ID = `${APP_ID}-button`;
  const PANEL_ID = `${APP_ID}-panel`;
  const API_VIEW_URL = 'https://api.bilibili.com/x/web-interface/view';
  const MESSAGE_DOWNLOAD_COVER = 'BILI_ONETOOL_DOWNLOAD_COVER';
  const STATUS_AUTO_CLEAR_DELAY = 3000;

  const videoInfoHelpers = globalThis.BiliOneToolVideoInfo;
  const markdownHelpers = globalThis.BiliOneToolMarkdown;

  let currentVideoInfo = null;
  let statusClearTimer = null;

  function init() {
    if (!videoInfoHelpers || !markdownHelpers) {
      console.warn(`[${APP_NAME}] shared helpers are not loaded`);
      return;
    }

    if (!isVideoPage()) {
      return;
    }

    injectFloatingButton();

    console.info(`[${APP_NAME}] extension content script loaded`, {
      appId: APP_ID,
      url: window.location.href,
    });
  }

  function isVideoPage(url) {
    return Boolean(videoInfoHelpers.getBvIdFromUrl(url || window.location.href));
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
      <div class="${APP_ID}-actions">
        <button type="button" data-action="refresh">刷新信息</button>
        <button type="button" data-action="download-cover">下载封面</button>
        <button type="button" data-action="copy-markdown">复制MD</button>
      </div>
      <div class="${APP_ID}-content">
        <p class="${APP_ID}-message">插件已加载。打开面板时会读取当前视频信息。</p>
      </div>
      <p class="${APP_ID}-status" aria-live="polite"></p>
    `;
    panel.addEventListener('click', handlePanelClick);

    document.body.appendChild(panel);
    return panel;
  }

  function handlePanelClick(event) {
    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) {
      return;
    }

    const action = actionTarget.dataset.action;

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
      copyInfoRow(actionTarget);
    }
  }

  async function refreshVideoInfo() {
    const panel = getOrCreatePanel();
    currentVideoInfo = null;
    renderPanelMessage(panel, '正在读取当前视频信息...');
    renderPanelStatus(panel, '');

    try {
      const bvid = videoInfoHelpers.getBvIdFromUrl(window.location.href);
      const videoInfo = await fetchVideoInfo(bvid);

      currentVideoInfo = videoInfo;
      renderVideoInfo(panel, videoInfo);
    } catch (error) {
      console.warn(`[${APP_NAME}] failed to load video info`, error);
      renderPanelMessage(panel, error.message || '读取视频信息失败', true);
    }
  }

  async function fetchVideoInfo(bvid) {
    if (!bvid) {
      throw new Error('未在当前页面 URL 中找到 BV 号');
    }

    const requestUrl = `${API_VIEW_URL}?bvid=${encodeURIComponent(bvid)}`;
    const response = await fetch(requestUrl, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`请求视频信息失败：HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!payload || payload.code !== 0) {
      throw new Error((payload && payload.message) || '接口返回异常');
    }

    return videoInfoHelpers.normalizeVideoInfo(payload.data, {
      bvid,
      fallbackTitle: document.title,
      url: window.location.href,
    });
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

      await copyText(markdownHelpers.formatMarkdown(currentVideoInfo));
      renderPanelStatus(panel, '已复制 Markdown 到剪贴板', false, true);
    } catch (error) {
      console.warn(`[${APP_NAME}] failed to copy markdown`, error);
      renderPanelStatus(panel, error.message || '复制 Markdown 失败', true);
    }
  }

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

      const response = await sendRuntimeMessage({
        type: MESSAGE_DOWNLOAD_COVER,
        payload: {
          url: currentVideoInfo.coverUrl,
          filename: videoInfoHelpers.getCoverFileName(currentVideoInfo),
        },
      });

      if (!response || !response.ok) {
        throw new Error((response && response.error) || '下载封面失败');
      }

      renderPanelStatus(panel, '封面下载已开始', false, true);
    } catch (error) {
      console.warn(`[${APP_NAME}] failed to download cover`, error);
      renderPanelStatus(panel, error.message || '下载封面失败', true);
    }
  }

  async function copyInfoRow(button) {
    const panel = getOrCreatePanel();
    const { label, value } = button.dataset;

    try {
      await copyText(`${value || ''}`);
      renderPanelStatus(panel, `已复制${label || '字段'}`, false, true);
    } catch (error) {
      console.warn(`[${APP_NAME}] failed to copy row`, error);
      renderPanelStatus(panel, error.message || '复制字段失败', true);
    }
  }

  function sendRuntimeMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        const lastError = chrome.runtime.lastError;

        if (lastError) {
          reject(new Error(lastError.message || '扩展消息发送失败'));
          return;
        }

        resolve(response);
      });
    });
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        console.warn(`[${APP_NAME}] navigator.clipboard failed, trying fallback`, error);
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.left = '-1000px';

    document.body.appendChild(textarea);
    textarea.select();

    try {
      const ok = document.execCommand('copy');
      if (!ok) {
        throw new Error('浏览器拒绝写入剪贴板');
      }
    } finally {
      textarea.remove();
    }
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

  function renderPanelMessage(panel, message, isError) {
    const content = panel.querySelector(`.${APP_ID}-content`);
    const className = isError ? `${APP_ID}-message ${APP_ID}-error` : `${APP_ID}-message`;

    content.innerHTML = `<p class="${className}">${escapeHtml(message)}</p>`;
  }

  function renderPanelStatus(panel, message, isError, autoClear) {
    const status = panel.querySelector(`.${APP_ID}-status`);
    if (!status) {
      return;
    }

    clearStatusTimer();

    status.className = isError ? `${APP_ID}-status ${APP_ID}-error` : `${APP_ID}-status`;
    status.textContent = message;

    if (message && autoClear !== false) {
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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  init();
})();
