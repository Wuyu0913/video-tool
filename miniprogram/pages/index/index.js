/**
 * 视频助手 - 主页
 */
const app = getApp();

Page({
  data: {
    url: '',
    parsing: false,
    loading: false,
    autoFocus: true,
    errorMsg: '',
    usedCount: 0,
    dailyLimit: 3,
    remaining: 3,
    previewActive: false,
    canDownload: true, // 剩余次数 > 0 时可直接下载
    result: {
      show: false,
      coverUrl: '',
      title: '',
      author: '',
      platform: '',
      platformName: '',
      videoUrl: '',
      duration: 0
    }
  },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  // 加载使用统计
  loadStats() {
    const today = this.getToday();
    const stats = wx.getStorageSync('videoStats') || {};
    
    let usedCount = 0;
    if (stats.date === today) {
      usedCount = stats.count || 0;
    } else {
      wx.setStorageSync('videoStats', { date: today, count: 0 });
    }

    const remaining = Math.max(0, this.data.dailyLimit - usedCount);
    
    this.setData({
      usedCount: usedCount,
      remaining: remaining,
      canDownload: remaining > 0
    });
  },

  getToday() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  },

  incrementCount() {
    const today = this.getToday();
    const stats = wx.getStorageSync('videoStats') || {};
    
    if (stats.date !== today) {
      stats.date = today;
      stats.count = 0;
    }
    
    stats.count = (stats.count || 0) + 1;
    wx.setStorageSync('videoStats', stats);
    
    const remaining = Math.max(0, this.data.dailyLimit - stats.count);
    this.setData({
      usedCount: stats.count,
      remaining: remaining,
      canDownload: remaining > 0
    });
  },

  // 输入框事件
  onUrlInput(e) {
    this.setData({ url: e.detail.value });
  },

  // 解析视频
  async parseVideo() {
    const url = this.data.url.trim();
    if (!url) {
      wx.showToast({ title: '请粘贴视频链接', icon: 'none' });
      return;
    }

    this.setData({
      parsing: true,
      loading: true,
      errorMsg: '',
      'result.show': false
    });

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.apiBaseUrl}/api/parse`,
          method: 'POST',
          data: { url },
          header: { 'Content-Type': 'application/json' },
          success: resolve,
          fail: reject,
          timeout: 30000
        });
      });

      if (res.data && res.data.success) {
        this.showResult(res.data.data);
        this.incrementCount();
      } else {
        this.setData({
          errorMsg: res.data.error || '解析失败，请检查链接是否正确'
        });
      }
    } catch (err) {
      this.setData({
        errorMsg: '网络请求失败，请检查网络连接'
      });
    } finally {
      this.setData({ parsing: false, loading: false });
    }
  },

  // 显示结果
  showResult(data) {
    const platformNames = {
      'douyin': '🎵 抖音',
      'kuaishou': '📱 快手',
      'xiaohongshu': '📕 小红书',
      'bilibili': '📺 B站'
    };

    this.setData({
      'result.show': true,
      'result.coverUrl': data.coverUrl || '',
      'result.title': data.title || '无标题',
      'result.author': data.author || '未知',
      'result.platform': data.platform || '',
      'result.platformName': platformNames[data.platform] || data.platform,
      'result.videoUrl': data.videoUrl || data.videoUrlWatermark || '',
      'result.duration': data.duration || 0
    });
  },

  // 下载视频到相册
  downloadVideo() {
    const videoUrl = this.data.result.videoUrl;
    if (!videoUrl) {
      wx.showToast({ title: '视频地址无效', icon: 'none' });
      return;
    }

    if (!this.data.canDownload) {
      this.watchAd();
      return;
    }

    wx.showLoading({ title: '正在下载...' });

    // 下载视频文件
    const downloadTask = wx.downloadFile({
      url: videoUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存到相册
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '已保存到相册 ✅', icon: 'success' });
            },
            fail: (err) => {
              if (err.errMsg.includes('auth deny')) {
                wx.showModal({
                  title: '需要权限',
                  content: '请在设置中开启相册写入权限',
                  success: (res) => {
                    if (res.confirm) {
                      wx.openSetting();
                    }
                  }
                });
              } else {
                wx.showToast({ title: '保存失败，请重试', icon: 'none' });
              }
            }
          });
        } else {
          wx.showToast({ title: '下载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '下载失败，请重试', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });

    // 显示下载进度
    downloadTask.onProgressUpdate((res) => {
      if (res.progress < 100) {
        wx.showLoading({ title: `下载中 ${res.progress}%` });
      }
    });
  },

  // 看广告解锁（激励视频）
  watchAd() {
    // 先检查是否有激励视频广告
    if (wx.createRewardedVideoAd) {
      const videoAd = wx.createRewardedVideoAd({
        adUnitId: 'your-ad-unit-id' // TODO: 在微信小程序后台创建广告单元
      });

      videoAd.onLoad(() => {
        videoAd.show().catch(() => {
          // 失败则回退到下载
          wx.showToast({ title: '广告加载失败，可直接下载', icon: 'none' });
        });
      });

      videoAd.onError((err) => {
        console.error('激励视频广告错误:', err);
        wx.showToast({ title: '广告加载失败', icon: 'none' });
      });

      videoAd.onClose((res) => {
        if (res && res.isEnded) {
          // 用户看完广告，解锁一次
          this.setData({ canDownload: true });
          wx.showToast({ title: '已解锁，可免费下载 🎉', icon: 'success' });
        } else {
          wx.showToast({ title: '看完广告即可免费下载', icon: 'none' });
        }
      });
    } else {
      // 无广告组件，直接允许下载
      this.setData({ canDownload: true });
      this.downloadVideo();
    }
  },

  // 预览视频
  previewVideo() {
    if (this.data.result.videoUrl) {
      this.setData({ previewActive: true });
    }
  },

  // 关闭预览
  closePreview() {
    this.setData({ previewActive: false });
  },

  preventClose() {
    // 阻止关闭冒泡
  },

  onVideoError(e) {
    console.error('视频播放错误:', e.detail);
    wx.showToast({ title: '视频加载失败', icon: 'none' });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '🎬 视频助手 - 一键下载无水印视频',
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    return {
      title: '🎬 视频助手 - 一键下载无水印视频'
    };
  }
});