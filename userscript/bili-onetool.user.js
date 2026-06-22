// ==UserScript==
// @name         Bili OneTool
// @namespace    https://github.com/bili-onetool
// @version      0.1.0
// @description  在哔哩哔哩视频页注入轻量工具面板，整理当前视频公开信息。
// @author       Bili OneTool Contributors
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

  function init() {
    if (!isVideoPage()) {
      return;
    }

    // V0.1 TODO:
    // 1. 注入右侧浮动按钮：Bili Tools
    // 2. 点击按钮后打开/关闭面板
    // 3. 读取标题、BV 号、URL、封面、UP 主、CID
    // 4. 支持下载封面和复制 Markdown
    console.info(`[${APP_NAME}] userscript loaded`, {
      appId: APP_ID,
      url: window.location.href,
    });
  }

  function isVideoPage() {
    return /^\/video\/BV[a-zA-Z0-9]+/.test(window.location.pathname);
  }

  init();
})();
