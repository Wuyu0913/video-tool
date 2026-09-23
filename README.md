# 🎬 视频去水印工具 - 完整部署指南

> 支持平台：抖音、快手、小红书、B站
> 变现方式：每日免费3次 → 赞助会员无限次 / 激励视频广告

---

## 📦 项目结构

```
video-tool/
├── backend/          # 后端 API 服务 (Node.js + Express)
│   ├── parsers/      # 各平台解析器
│   ├── server.js     # 主入口
│   └── package.json
├── frontend/         # H5 网页前端
│   ├── index.html
│   ├── style.css
│   └── app.js
├── miniprogram/      # 微信小程序代码
│   └── pages/index/
└── README.md
```

---

## 🚀 第一步：部署后端（H5网页版，今天上线）

### 方案 A：Railway（最简单，推荐）

1. 注册 https://railway.app （GitHub登录）
2. 安装 Railway CLI 或直接用 GitHub 关联
3. 在 Dashboard 点击 `New Project` → `Deploy from GitHub repo`
4. 选择包含 `video-tool/backend` 的仓库
5. 设置启动命令：`node server.js`
6. 部署完成后，Railway 会给你一个 `https://xxx.up.railway.app` 域名

### 方案 B：Render（免费）

1. 注册 https://render.com
2. 点击 `New +` → `Web Service`
3. 连接你的 GitHub 仓库
4. 设置：
   - Root Directory: `video-tool/backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. 部署得到 `https://xxx.onrender.com`

### 方案 C：腾讯云函数（国内速度最快）

1. 注册 https://cloud.tencent.com
2. 搜索「云函数」→ 新建函数
3. 选择「Node.js」运行环境
4. 上传 `video-tool/backend` 文件夹
5. 设置入口文件为 `server.js`
6. 触发方式：API网关触发
7. 得到一个 `https://xxx.ap-guangzhou.apigateway.myqcloud.com` 地址

---

## 🔧 第二步：配置后端地址

### H5 前端
`frontend/app.js` 中 `fetch('/api/parse')` 使用相对路径，**不需要修改**，后端已配置静态文件服务。

### 小程序
修改 `miniprogram/app.js` 中的 `apiBaseUrl` 为你部署后的域名

---

## 💰 第三步：配置支付/变现

### 方式一：个人微信收款码（最快）
1. 用微信打开「微信收款码」小程序
2. 生成你的个人收款码
3. 保存图片到 `frontend/` 目录
4. 修改 `index.html` 中 `#payQr` 区域的显示

### 方式二：激励视频广告（小程序专用）
1. 在微信小程序后台 → 流量主 → 新建广告位
2. 获取 `adUnitId`
3. 填入 `miniprogram/pages/index/index.js` 中的 `adUnitId`

---

## 📱 第四步：提交微信小程序

1. 注册 https://mp.weixin.qq.com （个人主体即可）
2. 获取 AppID，填入 `project.config.json`
3. 下载微信开发者工具
4. 打开 `video-tool/miniprogram` 文件夹
5. 测试 → 上传 → 提交审核

### ⚠️ 审核注意事项
- 小程序名称**不要包含**「去水印」「下载」「解析」等敏感词
- 推荐名称：「视频助手」「视频工具箱」「视频处理工具」
- 审核截图只展示输入链接的画面，不展示解析结果
- 第一次审核通过后，后续更新会更容易

---

## 📣 第五步：推广（获取用户）

### 免费渠道
| 渠道 | 方法 |
|------|------|
| **小红书** | 发笔记「XX平台视频怎么保存到相册」引流 |
| **知乎** | 回答「如何下载无水印视频」相关问题 |
| **微信群/QQ群** | 发到自媒体、短视频交流群 |
| **抖音评论区** | 评论「想要原视频用xxx」 |
| **闲鱼** | 挂商品「视频代下载 1元/次」 |

### 付费推广（见效后）
- 微信朋友圈广告
- 抖音DOU+推广
- 公众号文章推广

---

## 💵 预期收入

| 阶段 | 日活 | 收入估算 |
|:---:|:---:|:---:|
| 起步期 | 50人/天 | 免费→转化3%→赞助9.9 ≈ 15元/天 |
| 增长期 | 500人/天 | +广告收入 ≈ 100-200元/天 |
| 稳定期 | 2000人/天 | ≈ 300-500元/天 |

---

## ❓ 常见问题

**Q: 为什么解析失败？**
A: 各平台API会变化，如果某个平台失效，我会为你更新解析器

**Q: 需要什么前置条件？**
A: 需要一个 GitHub 账号 + 一个 Railway/Render 账号（都免费）

**Q: 小程序审核不通过怎么办？**
A: 先用H5网页版赚钱，同时修改小程序名称和UI再试

---

## 🆘 需要帮助？

直接对我说：
- 「帮我更新抖音解析器」
- 「小程序被拒了，帮我改UI」
- 「帮我优化前端样式」
- 「帮我查一下为什么解析不了」

我会立刻帮你处理！