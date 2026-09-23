/**
 * 平台解析器注册中心
 * 自动加载所有解析器，根据URL自动匹配
 */
const fs = require('fs');
const path = require('path');

const parsers = [];

// 自动加载当前目录下所有解析器（除了本文件）
fs.readdirSync(__dirname).forEach(file => {
  if (file === 'index.js' || !file.endsWith('.js')) return;
  const parser = require(path.join(__dirname, file));
  if (parser && parser.name && parser.match && parser.parse) {
    parsers.push(parser);
    console.log(`[解析器加载] ${parser.name}`);
  }
});

/**
 * 根据URL自动匹配解析器并解析
 * @param {string} url - 视频分享链接
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function parseUrl(url) {
  if (!url || typeof url !== 'string') {
    return { success: false, error: '请输入有效的视频链接' };
  }

  // 尝试每个解析器
  for (const parser of parsers) {
    if (parser.match(url)) {
      try {
        const result = await parser.parse(url);
        return { success: true, data: result, platform: parser.name };
      } catch (err) {
        return { success: false, error: `解析失败: ${err.message}`, platform: parser.name };
      }
    }
  }

  return { success: false, error: '暂不支持该平台的视频链接。目前支持: 抖音、快手、小红书、B站' };
}

/**
 * 获取支持的平台列表
 */
function getSupportedPlatforms() {
  return parsers.map(p => ({
    name: p.name,
    domains: p.domains || [],
    description: p.description || ''
  }));
}

module.exports = { parseUrl, getSupportedPlatforms };