/**
 * 小红书视频/图文解析器
 */
const axios = require('axios');

const name = '小红书';
const domains = ['xiaohongshu.com', 'xhslink.com'];

function match(url) {
  return domains.some(d => url.includes(d));
}

async function parse(url) {
  // Step 1: 展开短链接
  let realUrl = url;
  if (url.includes('xhslink.com')) {
    try {
      const resp = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400,
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' }
      });
      realUrl = resp.headers.location || url;
    } catch (err) {
      if (err.response?.headers?.location) {
        realUrl = err.response.headers.location;
      }
    }
  }

  // Step 2: 获取页面内容
  const response = await axios.get(realUrl, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  const html = response.data;

  // Step 3: 从页面提取视频和图片信息
  let videoUrl = '';
  let images = [];
  let title = '小红书笔记';
  let author = '未知作者';
  let coverUrl = '';
  let desc = '';

  // 方法1: 从window.__INITIAL_STATE__提取
  const initStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});\s*<\/script>/);
  if (initStateMatch) {
    try {
      const initState = JSON.parse(initStateMatch[1]);
      const note = initState.note || initState.noteDetail || {};
      const noteData = note.note || note.noteDetailMap || {};
      
      title = noteData.title || noteData.desc || title;
      desc = noteData.desc || '';
      author = noteData.user?.nickname || noteData.author?.nickname || author;
      coverUrl = noteData.cover?.url || noteData.cover_url || noteData.imageList?.[0]?.url || noteData.cover?.urlDefault || '';

      // 视频地址
      const video = noteData.video || noteData.videoInfo || {};
      videoUrl = video.url || video.videoUrl || video.playUrl || video.media?.video?.url || '';
      
      // 图片
      const imageList = noteData.imageList || noteData.images || [];
      if (imageList.length > 0) {
        images = imageList.map(img => {
          if (typeof img === 'string') return img;
          return img.url || img.originalUrl || img.infoList?.[0]?.url || '';
        }).filter(Boolean);
        if (!coverUrl && images.length > 0) coverUrl = images[0];
      }

      // 如果是图文笔记且没有视频
      if (!videoUrl) {
        videoUrl = ''; // 图文笔记没有视频
      }
    } catch (e) {
      // fallback
    }
  }

  // 方法2: 从og标签提取
  if (!title || title === '小红书笔记') {
    const ogTitle = html.match(/<meta\s+property="og:title"[^>]*content="([^"]+)"/);
    if (ogTitle) title = ogTitle[1];
    
    const ogImage = html.match(/<meta\s+property="og:image"[^>]*content="([^"]+)"/);
    if (ogImage) coverUrl = ogImage[1];
    
    const ogDesc = html.match(/<meta\s+property="og:description"[^>]*content="([^"]+)"/);
    if (ogDesc) desc = ogDesc[1];
  }

  // 方法3: 从页面video标签提取
  if (!videoUrl) {
    const videoMatch = html.match(/<video[^>]*src="([^"]+)"/);
    if (videoMatch) {
      videoUrl = videoMatch[1];
    }
  }

  // 判断是视频笔记还是图文笔记
  const isVideo = !!videoUrl;

  return {
    title: title,
    author: author,
    authorAvatar: '',
    coverUrl: coverUrl,
    videoUrl: videoUrl,
    videoUrlWatermark: videoUrl, // 小红书无水印概念
    images: images,
    isVideo: isVideo,
    duration: 0,
    width: 0,
    height: 0,
    likeCount: 0,
    shareCount: 0,
    originalUrl: realUrl,
    platform: 'xiaohongshu',
    desc: desc
  };
}

module.exports = { name, domains, match, parse, description: '小红书视频/图片下载' };