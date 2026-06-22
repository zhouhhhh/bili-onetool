// ==UserScript==
// @name         Bili OneTool
// @namespace    https://github.com/bili-onetool
// @version      0.1.0
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
        margin: 0 0 8px;
        font-size: 16px;
      }

      #${PANEL_ID} p {
        margin: 0;
        color: #61666d;
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
      <h2>Bili OneTool</h2>
      <p>脚本已加载。下一步会在这里展示当前视频信息。</p>
    `;

    document.body.appendChild(panel);
    return panel;
  }

  init();
})();
