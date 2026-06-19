# V1.0 PRD 覆盖矩阵

| PRD 范围 | 实现位置 | 自动证据 | 状态 |
| --- | --- | --- | --- |
| 今日页三场景摘要与详细建议 | `pages/today/`、`components/recommendation-card/` | 项目校验、推荐测试 | 已实现 |
| 首次设置三步均可跳过 | `pages/onboarding/` | 页面结构校验 | 已实现 |
| 定位与手动城市 | `pages/city/` | 页面结构与 JS 语法校验 | 已实现，定位授权需真机 |
| 手动温度模式 | `pages/manual-weather/` | 页面结构校验 | 已实现 |
| 宝宝设置、隐私、清除数据 | `pages/settings/`、`pages/privacy/` | 缓存测试、免责声明校验 | 已实现 |
| 宝宝用品参考与分类 | `pages/goods/`、`config/goods.config.js` | 50 个完整商品条目、400x400 JPG 运行素材引用校验、截图素材裁剪预览 | 已实现 |
| 分享卡生成与保存 | `components/share-card/` | 结构、文案、代码路径与画布尺寸校验 | 已实现，保存相册需真机 |
| 固定小程序码 | `config/share.config.js` | 配置资源存在性校验 | 待真实 AppID 发布后配置 |
| 温度基准规则 | `config/recommend.rules.js` | 推荐测试 | 已实现 |
| 月龄、体质、出汗、天气修正 | `services/recommendation.service.js` | 推荐测试 | 已实现 |
| 想薄/想厚边界与临时状态 | `pages/today/`、推荐服务 | 推荐测试 | 已实现 |
| 刚刚好不长期学习 | `pages/today/index.js` | 静态检查 | 已实现 |
| 版本化本地缓存与迁移 | `services/storage.service.js` | 缓存测试 | 已实现 |
| 最近 3 个城市 | `services/storage.service.js` | 缓存测试 | 已实现 |
| 30 分钟天气缓存 | 天气与缓存服务 | 天气测试 | 已实现 |
| 腾讯位置服务天气 | `services/weather.service.js` | 官方响应结构测试 | 已实现，需配置 Key 与合法域名 |
| 天气失败有缓存/无缓存 | 今日页与天气服务 | 天气测试、静态检查 | 已实现 |
| `wx.getUpdateManager` | `app.js` | 静态检查 | 已实现 |
| 浅色母婴 UI 与触控尺寸 | 全局与页面 WXSS | 静态结构检查、开发者工具编译 | 已实现，真机视觉仍需确认 |
| 健康免责声明与禁止绝对文案 | 今日、隐私、手动天气、分享卡 | 项目校验 | 已实现 |
| 性能目标 | PRD 验收项 | 无本地运行时证据 | 待开发者工具与真机计时 |

## 发布前外部条件

1. 将 `project.config.json` 的测试 AppID 替换为真实 AppID。
2. 配置腾讯位置服务 Key，并在微信公众平台添加 `https://apis.map.qq.com` request 合法域名。
3. 生成真实固定小程序码 PNG，配置 `config/share.config.js`。
4. 使用微信开发者工具执行编译、真机预览和网络失败模拟。
5. 在 iPhone 与 Android 验证定位、Canvas、高 DPR、相册权限和分享卡识别。

## 2026-06-14 开发者工具证据

- 工具版本：`2.02.2606122`
- 测试 AppID：`touristappid`
- CLI 打开项目：成功
- CLI 自动化模式：成功
- 页面与组件编译：成功，未检出项目编译错误
- 云端同步：未登录，`access_token missing`
