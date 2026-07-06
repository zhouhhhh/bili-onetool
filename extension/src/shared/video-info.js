(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.BiliOneToolVideoInfo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function getBvIdFromUrl(url) {
    if (!url) {
      return '';
    }

    try {
      const { pathname } = new URL(url);
      const match = pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);

      return match ? match[1] : '';
    } catch (error) {
      return '';
    }
  }

  function normalizeVideoInfo(data, options) {
    const source = data || {};
    const settings = options || {};
    const bvid = source.bvid || settings.bvid || getBvIdFromUrl(settings.url || '');

    return {
      title: source.title || settings.fallbackTitle || '',
      bvid,
      pageUrl: getCleanVideoUrl(bvid),
      coverUrl: normalizeResourceUrl(source.pic),
      upName: source.owner && source.owner.name ? source.owner.name : '',
      cid: source.cid ? String(source.cid) : '',
    };
  }

  function getCleanVideoUrl(bvId) {
    return bvId ? `https://www.bilibili.com/video/${bvId}` : '';
  }

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

  function getCoverFileName(videoInfo) {
    const source = videoInfo || {};
    const title = sanitizeFileName(source.title || 'bili-cover');
    const bvid = sanitizeFileName(source.bvid || 'unknown');
    const extension = getFileExtensionFromUrl(source.coverUrl) || 'jpg';

    return `${title}-${bvid}.${extension}`;
  }

  function sanitizeFileName(fileName) {
    return String(fileName)
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/[\u0000-\u001f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'bili-cover';
  }

  function getFileExtensionFromUrl(url) {
    try {
      const { pathname } = new URL(url);
      const match = pathname.match(/\.([a-z0-9]+)(?:@.*)?$/i);

      return match ? match[1].toLowerCase() : '';
    } catch (error) {
      return '';
    }
  }

  return {
    getBvIdFromUrl,
    normalizeVideoInfo,
    getCleanVideoUrl,
    normalizeResourceUrl,
    getCoverFileName,
    sanitizeFileName,
    getFileExtensionFromUrl,
  };
});
