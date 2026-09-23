/**
 * 视频去水印工具 - 后端服务
 * 支持平台: 抖音、快手、小红书、B站
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const { parseUrl, getSupportedPlatforms } = require('./parsers');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ==================== 页面路由 ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ==================== API 路由 ====================

/**
 * 解析视频链接
 * POST /api/parse
 * Body: { url: string }
 */
app.post('/api/parse', async (req, res) => {
  const { url } = req.body;
  
  if (!url || !url.trim()) {
    return res.json({ 
      success: false, 
      error: '请粘贴视频分享链接' 
    });
  }

  console.log(`[解析请求] ${url}`);
  const result = await parseUrl(url.trim());
  
  if (result.success) {
    console.log(`[解析成功] ${result.platform}: ${result.data.title}`);
  } else {
    console.log(`[解析失败] ${result.error}`);
  }

  res.json(result);
});

/**
 * 获取支持的平台列表
 */
app.get('/api/platforms', (req, res) => {
  res.json({ platforms: getSupportedPlatforms() });
});

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================`);
  console.log(`  视频去水印服务已启动`);
  console.log(`  地址: http://localhost:${PORT}`);
  console.log(`  支持平台: 抖音、快手、小红书、B站`);
  console.log(`======================================\n`);
});