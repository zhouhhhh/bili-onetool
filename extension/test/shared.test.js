const assert = require('node:assert/strict');
const test = require('node:test');

const videoInfo = require('../src/shared/video-info.js');
const markdown = require('../src/shared/markdown.js');

test('extracts BV id from bilibili video urls', () => {
  assert.equal(
    videoInfo.getBvIdFromUrl('https://www.bilibili.com/video/BV1xx411c7mD/?spm_id_from=333.999'),
    'BV1xx411c7mD',
  );
  assert.equal(videoInfo.getBvIdFromUrl('https://www.bilibili.com/bangumi/play/ep1'), '');
});

test('normalizes public video info from the view api payload', () => {
  const normalized = videoInfo.normalizeVideoInfo({
    title: '测试标题',
    bvid: 'BV1xx411c7mD',
    pic: '//i0.hdslb.com/bfs/archive/test.jpg@672w_378h_1c.webp',
    owner: { name: '测试UP' },
    cid: 123456,
  });

  assert.deepEqual(normalized, {
    title: '测试标题',
    bvid: 'BV1xx411c7mD',
    pageUrl: 'https://www.bilibili.com/video/BV1xx411c7mD',
    coverUrl: 'https://i0.hdslb.com/bfs/archive/test.jpg@672w_378h_1c.webp',
    upName: '测试UP',
    cid: '123456',
  });
});

test('normalizes resource urls to https', () => {
  assert.equal(videoInfo.normalizeResourceUrl('//i0.hdslb.com/bfs/archive/a.jpg'), 'https://i0.hdslb.com/bfs/archive/a.jpg');
  assert.equal(videoInfo.normalizeResourceUrl('http://i0.hdslb.com/bfs/archive/a.jpg'), 'https://i0.hdslb.com/bfs/archive/a.jpg');
  assert.equal(videoInfo.normalizeResourceUrl('https://i0.hdslb.com/bfs/archive/a.jpg'), 'https://i0.hdslb.com/bfs/archive/a.jpg');
  assert.equal(videoInfo.normalizeResourceUrl(''), '');
});

test('formats markdown with fallback values', () => {
  assert.equal(
    markdown.formatMarkdown({
      title: '测试标题',
      upName: '测试UP',
      bvid: 'BV1xx411c7mD',
      cid: '',
      pageUrl: 'https://www.bilibili.com/video/BV1xx411c7mD',
      coverUrl: 'https://i0.hdslb.com/bfs/archive/test.jpg',
    }),
    `# 测试标题

UP主：测试UP  
BV号：BV1xx411c7mD  
CID：未获取到  
链接：https://www.bilibili.com/video/BV1xx411c7mD  
封面：https://i0.hdslb.com/bfs/archive/test.jpg

## 备注`,
  );
});

test('builds safe cover filenames from title, bvid, and cover url', () => {
  assert.equal(
    videoInfo.getCoverFileName({
      title: '标题/含:非法*字符?',
      bvid: 'BV1xx411c7mD',
      coverUrl: 'https://i0.hdslb.com/bfs/archive/test.png@672w_378h_1c.webp',
    }),
    '标题_含_非法_字符_-BV1xx411c7mD.png',
  );
});
