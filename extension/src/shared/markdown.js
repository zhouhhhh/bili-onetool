(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.BiliOneToolMarkdown = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function formatMarkdown(videoInfo) {
    const source = videoInfo || {};

    return `# ${formatMarkdownValue(source.title)}

UP主：${formatMarkdownValue(source.upName)}  
BV号：${formatMarkdownValue(source.bvid)}  
CID：${formatMarkdownValue(source.cid)}  
链接：${formatMarkdownValue(source.pageUrl)}  
封面：${formatMarkdownValue(source.coverUrl)}

## 备注`;
  }

  function formatMarkdownValue(value) {
    return value ? String(value) : '未获取到';
  }

  return {
    formatMarkdown,
    formatMarkdownValue,
  };
});
