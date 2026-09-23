/**
 * 抖音视频解析器
 * 支持: 抖音、抖音火山版
 */
const axios = require('axios');

const name = '抖音';
const domains = ['douyin.com', 'iesdouyin.com', 'dy.com'];

function match(url) {
  return domains.some(d => url.includes(d));
}

async function parse(url) {
  // Step 1: 跟随短链接重定向，获取真实URL
  let realUrl = url;
  if (url.includes('v.douyin.com')) {
    try {
      const resp = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        }
      });
      realUrl = resp.headers.location || url;
    } catch (err) {
      if (err.response && err.response.headers && err.response.headers.location) {
        realUrl = err.response.headers.location;
      }
    }
  }

  // Step 2: 从URL提取视频ID (aweme_id)
  let awemeId = '';
  const idMatch = realUrl.match(/video\/(\d+)/);
  if (idMatch) {
    awemeId = idMatch[1];
  }

  if (!awemeId) {
    throw new Error('无法识别视频ID，请检查链接格式');
  }

  // Step 3: 调用抖音API获取视频详情
  const apiUrl = `https://www.iesdouyin.com/aweme/v1/web/aweme/detail/`;
  const response = await axios.get(apiUrl, {
    params: { aweme_id: awemeId, aid: 1128 },
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.douyin.com/',
      'Cookie': 'msToken=; ttwid='
    }
  });

  const awemeDetail = response.data.aweme_detail;
  if (!awemeDetail) {
    throw new Error('获取视频信息失败，可能链接已失效');
  }

  // Step 4: 提取无水印视频地址
  const videoData = awemeDetail.video || {};
  const playAddr = videoData.play_addr || {};
  const urlList = playAddr.url_list || [];

  // 无水印视频地址（通常最后一个或特定格式）
  let noWatermarkUrl = '';
  for (const addr of urlList) {
    // 取第一个可用的高清地址
    if (addr && addr.startsWith('http')) {
      noWatermarkUrl = addr;
      break;
    }
  }

  // 备选: 从其他字段获取
  if (!noWatermarkUrl) {
    const bitRateList = videoData.bit_rate || [];
    for (const bit of bitRateList) {
      const playAddrBit = bit.play_addr || {};
      const urls = playAddrBit.url_list || [];
      if (urls.length > 0) {
        noWatermarkUrl = urls[0];
        break;
      }
    }
  }

  // 如果有水印版本作为备选
  const watermarkUrl = (videoData.download_addr || {}).url_list || [];

  // Step 5: 提取封面和作者信息
  const author = awemeDetail.author || {};
  const music = awemeDetail.music || {};

  return {
    title: awemeDetail.desc || '抖音视频',
    author: author.nickname || '未知作者',
    authorAvatar: author.avatar_thumb?.url_list?.[0] || '',
    coverUrl: (awemeDetail.video?.cover?.url_list?.[0]) || (awemeDetail.video?.origin_cover?.url_list?.[0]) || '',
    videoUrl: noWatermarkUrl,
    videoUrlWatermark: watermarkUrl[0] || '',
    musicUrl: music.play_url?.url_list?.[0] || '',
    duration: awemeDetail.duration || 0,
    width: videoData.width || 0,
    height: videoData.height || 0,
    likeCount: awemeDetail.statistics?.digg_count || 0,
    shareCount: awemeDetail.statistics?.share_count || 0,
    originalUrl: `https://www.douyin.com/video/${awemeId}`,
    platform: 'douyin'
  };
}

module.exports = { name, domains, match, parse, description: '抖音短视频去水印下载' };