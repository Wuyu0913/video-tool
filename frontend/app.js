/**
 * 视频去水印工具 - 前端交互
 */

// ============ DOM 引用 ============
const urlInput = document.getElementById('urlInput');
const parseBtn = document.getElementById('parseBtn');
const loading = document.getElementById('loading');
const resultCard = document.getElementById('resultCard');
const errorMsg = document.getElementById('errorMsg');
const freeTip = document.getElementById('freeTip');
const payBanner = document.getElementById('payBanner');

const coverImg = document.getElementById('coverImg');
const videoTitle = document.getElementById('videoTitle');
const videoAuthor = document.getElementById('videoAuthor');
const platformBadge = document.getElementById('platformBadge');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const playBtn = document.getElementById('playBtn');

const videoModal = document.getElementById('videoModal');
const previewVideo = document.getElementById('previewVideo');
const closeModal = document.getElementById('closeModal');

const todayCount = document.getElementById('todayCount');
const totalCount = document.getElementById('totalCount');

// ============ 状态 ============
let currentVideoUrl = '';
let dailyLimit = 3;

// ============ 初始化 ============
function init() {
  // 从 localStorage 读取计数
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem('videoToolStats') || '{}');
  
  if (stored.date === today) {
    document.getElementById('todayCount').textContent = stored.today || 0;
    document.getElementById('totalCount').textContent = stored.total || 0;
  } else {
    localStorage.setItem('videoToolStats', JSON.stringify({ date: today, today: 0, total: 0 }));
    document.getElementById('todayCount').textContent = '0';
    document.getElementById('totalCount').textContent = '0';
  }
  
  updateFreeTip();
}

function incrementCount() {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem('videoToolStats') || '{}');
  
  if (stored.date !== today) {
    stored.date = today;
    stored.today = 0;
  }
  
  stored.today = (stored.today || 0) + 1;
  stored.total = (stored.total || 0) + 1;
  
  localStorage.setItem('videoToolStats', JSON.stringify(stored));
  
  document.getElementById('todayCount').textContent = stored.today;
  document.getElementById('totalCount').textContent = stored.total;
  
  updateFreeTip();
  return stored.today;
}

function getUsedCount() {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem('videoToolStats') || '{}');
  if (stored.date !== today) return 0;
  return stored.today || 0;
}

function updateFreeTip() {
  const used = getUsedCount();
  const remaining = Math.max(0, dailyLimit - used);
  
  if (remaining > 0) {
    freeTip.textContent = `✨ 今日剩余 ${remaining} 次免费下载 · 赞助作者享无限次`;
    freeTip.style.display = 'block';
    payBanner.classList.remove('active');
  } else {
    freeTip.textContent = '😅 今日免费次数已用完';
    freeTip.style.display = 'block';
    payBanner.classList.add('active');
  }
}

// ============ 解析视频 ============
async function parseVideo() {
  const url = urlInput.value.trim();
  if (!url) {
    urlInput.focus();
    urlInput.style.borderColor = '#ff6b6b';
    setTimeout(() => urlInput.style.borderColor = '', 2000);
    return;
  }

  // 检查次数
  const used = getUsedCount();
  if (used >= dailyLimit) {
    payBanner.classList.add('active');
    return;
  }

  // UI 状态
  parseBtn.disabled = true;
  parseBtn.textContent = '解析中...';
  loading.classList.add('active');
  resultCard.classList.remove('active');
  errorMsg.classList.remove('active');
  payBanner.classList.remove('active');

  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const result = await response.json();

    if (result.success) {
      showResult(result.data);
      incrementCount();
    } else {
      showError(result.error || '解析失败，请检查链接是否正确');
    }
  } catch (err) {
    showError('网络错误，请稍后重试');
  } finally {
    parseBtn.disabled = false;
    parseBtn.textContent = '解析';
    loading.classList.remove('active');
  }
}

// ============ 显示结果 ============
function showResult(data) {
  // 封面
  if (data.coverUrl) {
    coverImg.src = data.coverUrl;
    coverImg.onerror = () => {
      coverImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225"><rect fill="%231a1a2e" width="400" height="225"/><text x="200" y="120" text-anchor="middle" fill="%23666" font-size="16">暂无封面</text></svg>';
    };
  } else {
    coverImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225"><rect fill="%231a1a2e" width="400" height="225"/><text x="200" y="120" text-anchor="middle" fill="%23666" font-size="16">暂无封面</text></svg>';
  }

  // 标题
  videoTitle.textContent = data.title || '无标题';

  // 作者
  videoAuthor.textContent = data.author || '未知';

  // 平台
  const platformMap = {
    'douyin': '🎵 抖音',
    'kuaishou': '📱 快手',
    'xiaohongshu': '📕 小红书',
    'bilibili': '📺 B站'
  };
  platformBadge.textContent = platformMap[data.platform] || data.platform;

  // 视频地址
  currentVideoUrl = data.videoUrl || data.videoUrlWatermark;

  // 下载按钮
  if (currentVideoUrl) {
    downloadBtn.href = currentVideoUrl;
    downloadBtn.download = `${data.title || 'video'}.mp4`;
    downloadBtn.style.display = 'block';
    playBtn.style.display = 'flex';
    
    // 给下载链接添加目标属性
    downloadBtn.target = '_blank';
    downloadBtn.rel = 'noopener noreferrer';
  } else {
    downloadBtn.style.display = 'none';
    playBtn.style.display = 'none';
  }

  // 显示
  resultCard.classList.add('active');
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============ 显示错误 ============
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('active');
  resultCard.classList.remove('active');
}

// ============ 播放预览 ============
function playPreview() {
  if (currentVideoUrl) {
    previewVideo.src = currentVideoUrl;
    videoModal.classList.add('active');
    previewVideo.play().catch(() => {});
  }
}

// ============ 复制链接 ============
function copyLink() {
  if (currentVideoUrl) {
    navigator.clipboard.writeText(currentVideoUrl).then(() => {
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => copyBtn.textContent = '📋 复制', 2000);
    }).catch(() => {
      // 降级: 选中文字
      const textarea = document.createElement('textarea');
      textarea.value = currentVideoUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => copyBtn.textContent = '📋 复制', 2000);
    });
  }
}

// ============ 事件绑定 ============
parseBtn.addEventListener('click', parseVideo);

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') parseVideo();
});

playBtn.addEventListener('click', playPreview);

copyBtn.addEventListener('click', copyLink);

closeModal.addEventListener('click', () => {
  videoModal.classList.remove('active');
  previewVideo.pause();
  previewVideo.src = '';
});

videoModal.addEventListener('click', (e) => {
  if (e.target === videoModal) {
    videoModal.classList.remove('active');
    previewVideo.pause();
    previewVideo.src = '';
  }
});

// 粘贴时自动触发（让输入框内容变化后自动解析）
let pasteTimer = null;
urlInput.addEventListener('paste', () => {
  clearTimeout(pasteTimer);
  pasteTimer = setTimeout(() => {
    if (urlInput.value.trim()) {
      parseVideo();
    }
  }, 300);
});

// ============ 启动 ============
init();

// 自动聚焦
urlInput.focus();