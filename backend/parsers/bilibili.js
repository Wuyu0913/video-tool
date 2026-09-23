/**
 * B站视频解析器
 */
const axios = require('axios');

const name = 'B站';
const domains = ['bilibili.com', 'b23.tv'];

function match(url) {
  return domains.some(d => url.includes(d));
}

async function parse(url) {
  // Step 1: 展开短链接
  let realUrl = url;
  if (url.includes('b23.tv')) {
    try {
      const resp = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400,
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' }
      });
      realUrl = resp.headers.location || url;
    } catch (err) {
      if (err.response?.headers?.location) {
        realUrl = err.response.headers.location;
      }
    }
  }

  // Step 2: 提取BV号或AV号
  let bvId = '';
  const bvMatch = realUrl.match(/\/video\/(BV\w+)/);
  if (bvMatch) {
    bvId = bvMatch[1];
  }

  if (!bvId) {
    const avMatch = realUrl.match(/av(\d+)/i);
    if (avMatch) {
      // AV号转BV号需要额外计算，直接使用B站API的aid参数
      bvId = `av${avMatch[1]}`;
    }
  }

  if (!bvId) {
    throw new Error('无法识别B站视频ID，请检查链接格式');
  }

  // Step 3: 调用B站API
  const apiUrl = `https://api.bilibili.com/x/web-interface/view`;
  const params = bvId.startsWith('av') 
    ? { aid: bvId.replace('av', '') } 
    : { bvid: bvId };

  const response = await axios.get(apiUrl, {
    params,
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.bilibili.com/'
    }
  });

  const data = response.data.data;
  if (!data) {
    throw new Error('获取视频信息失败，请检查链接是否有效');
  }

  // Step 4: 获取视频流地址（需要另一个API获取真实播放地址）
  let videoUrl = '';
  try {
    const cid = data.cid;
    const aid = data.aid;
    const playUrlApi = `https://api.bilibili.com/x/player/playurl`;
    const playResp = await axios.get(playUrlApi, {
      params: {
        avid: aid,
        cid: cid,
        qn: 80, // 1080P
        type: '',
        fnval: 0
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com/'
      }
    });
    
    const playData = playResp.data.data;
    if (playData && playData.durl && playData.durl.length > 0) {
      videoUrl = playData.durl[0].url || '';
    }
  } catch (err) {
    // 非致命错误，有基本信息也够用
    console.error('B站获取播放地址失败:', err.message);
  }

  return {
    title: data.title || 'B站视频',
    author: data.owner?.name || '未知作者',
    authorAvatar: data.owner?.face || '',
    coverUrl: data.pic || '',
    videoUrl: videoUrl,
    videoUrlWatermark: '', // B站无特殊水印，直接返回原片
    duration: data.duration || 0,
    width: data.dimension?.width || 0,
    height: data.dimension?.height || 0,
    likeCount: data.stat?.like || 0,
    shareCount: data.stat?.share || 0,
    originalUrl: `https://www.bilibili.com/video/${bvId}`,
    platform: 'bilibili',
    desc: data.desc || ''
  };
}

module.exports = { name, domains, match, parse, description: 'B站视频在线下载' };