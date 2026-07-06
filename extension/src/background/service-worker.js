const MESSAGE_DOWNLOAD_COVER = 'BILI_ONETOOL_DOWNLOAD_COVER';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== MESSAGE_DOWNLOAD_COVER) {
    return false;
  }

  const payload = message.payload || {};
  const url = payload.url || '';
  const filename = sanitizeDownloadFilename(payload.filename || 'bili-cover.jpg');

  if (!url) {
    sendResponse({ ok: false, error: '未提供封面下载 URL' });
    return false;
  }

  chrome.downloads.download(
    {
      url,
      filename,
      saveAs: false,
    },
    (downloadId) => {
      const lastError = chrome.runtime.lastError;

      if (lastError) {
        sendResponse({ ok: false, error: lastError.message || '下载封面失败' });
        return;
      }

      sendResponse({ ok: true, downloadId });
    },
  );

  return true;
});

function sanitizeDownloadFilename(filename) {
  return String(filename)
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'bili-cover.jpg';
}
