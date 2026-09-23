/**
 * 视频助手 - 微信小程序
 * 支持: 抖音、快手、小红书、B站 视频解析下载
 */
App({
  globalData: {
    userInfo: null,
    apiBaseUrl: 'https://your-api-domain.com', // TODO: 部署后替换为实际后端地址
    dailyLimit: 3
  },

  onLaunch() {
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
            }
          })
        }
      }
    })
  }
})