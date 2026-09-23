/**
 * 快手视频解析器
 */
const axios = require('axios');

const name = '快手';
const domains = ['kuaishou.com', 'kwai.com', 'v.kuaishou.com'];

function match(url) {
  return domains.some(d => url.includes(d));
}

async function parse(url) {
  // Step 1: 获取页面内容，提取视频ID
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  const html = response.data;

  // Step 2: 从页面中提取视频信息（多种方法）
  
  // 方法1: 从页面JSON数据中提取
  let videoUrl = '';
  let coverUrl = '';
  let title = '快手视频';
  let author = '未知作者';

  // 尝试从 script 标签中的 __NEXT_SSR_DATA__ 提取
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const props = nextData.props?.pageProps || {};
      const videoInfo = props.videoInfo || props.photoInfo || props.video || {};
      
      if (videoInfo.photo || videoInfo.video) {
        const photo = videoInfo.photo || videoInfo.video;
        title = photo.caption || photo.title || title;
        author = photo.user?.username || photo.author?.name || author;
        coverUrl = photo.coverUrl || photo.cover_url || '';
        const src = photo.mainMvUrl || photo.videoUrl || photo.playUrl || photo.play_url || '';
        // 无水印的视频流
        videoUrl = src;
      }
    } catch (e) {
      // fallback
    }
  }

  // 方法2: 正则从页面抓取视频URL
  if (!videoUrl) {
    const urlMatches = html.match(/https?:\/\/[^"'\s]*?\.(mp4|m3u8)[^"'\s]*/gi);
    if (urlMatches && urlMatches.length > 0) {
      videoUrl = urlMatches[0];
    }
  }

  // 方法3: 从og:video提取
  if (!videoUrl) {
    const ogVideo = html.match(/<meta\s+property="og:video"[^>]*content="([^"]+)"/);
    if (ogVideo) {
      videoUrl = ogVideo[1];
    }
    
    const ogTitle = html.match(/<meta\s+property="og:title"[^>]*content="([^"]+)"/);
    if (ogTitle) title = ogTitle[1];
    
    const ogImage = html.match(/<meta\s+property="og:image"[^>]*content="([^"]+)"/);
    if (ogImage) coverUrl = ogImage[1];
  }

  if (!videoUrl) {
    throw new Error('无法提取视频地址，链接可能已失效');
  }

  // 无水印处理：快手的水印一般在视频URL上，移除特定参数
  const cleanUrl = videoUrl.replace(/\/watermark\//, '/').replace(/\?.*/, '');

  return {
    title: title,
    author: author,
    authorAvatar: '',
    coverUrl: coverUrl,
    videoUrl: cleanUrl || videoUrl,
    videoUrlWatermark: videoUrl,
    duration: 0,
    width: 0,
    height: 0,
    likeCount: 0,
    shareCount: 0,
    originalUrl: url,
    platform: 'kuaishou'
  };
}

module.exports = { name, domains, match, parse, description: '快手短视频去水印下载' };