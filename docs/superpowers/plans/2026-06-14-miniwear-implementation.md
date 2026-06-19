# 宝宝今天穿什么 V1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可被微信开发者工具直接导入、符合最终版 PRD 的原生微信小程序。

**Architecture:** 使用原生微信小程序 JavaScript。配置模块保存推荐规则和用品数据，服务模块负责推荐计算、缓存和天气，页面只组织交互与渲染；核心服务保持 Node.js 可测试。

**Tech Stack:** WeChat Mini Program WXML/WXSS/JavaScript、Canvas 2D、Node.js 内置测试运行器

**Constraint:** 用户明确要求暂不使用 Git，因此所有 Git/commit 步骤省略。

---

### Task 1: 项目骨架与应用配置

**Files:**
- Create: `project.config.json`
- Create: `project.private.config.json`
- Create: `sitemap.json`
- Create: `app.js`
- Create: `app.json`
- Create: `app.wxss`

- [ ] 创建微信小程序项目配置，使用测试 AppID，占位项目名和 `miniprogramRoot`。
- [ ] 注册 7 个页面、3 个 Tab 和全局窗口样式。
- [ ] 建立全局颜色、字号、卡片、按钮、状态和无障碍触控样式。
- [ ] 使用 Node 脚本解析 JSON，确认项目配置合法。

### Task 2: 先锁定推荐与缓存行为

**Files:**
- Create: `tests/recommendation.test.js`
- Create: `tests/storage.test.js`
- Create: `tests/age.test.js`

- [ ] 编写温度区间、体质、出汗、天气、临时调整和上下边界测试。
- [ ] 编写出生日期月龄、默认月龄和 3 岁以上兜底测试。
- [ ] 编写缓存版本、损坏字段、最近城市和天气有效期测试。
- [ ] 运行 `node --test tests/*.test.js`，确认测试因模块尚不存在而失败。

### Task 3: 配置、工具和核心服务

**Files:**
- Create: `config/recommend.rules.js`
- Create: `config/goods.config.js`
- Create: `config/cities.config.js`
- Create: `constants/storage.js`
- Create: `utils/age.js`
- Create: `utils/date.js`
- Create: `utils/validators.js`
- Create: `services/recommendation.service.js`
- Create: `services/storage.service.js`
- Create: `services/weather.service.js`

- [ ] 按 PRD 完整录入在家、出门、睡觉温度规则和修正规则。
- [ ] 实现月龄分组、格式化时间和基础数据校验。
- [ ] 实现纯函数推荐引擎，统一输出结果、原因、冷热调整和边界状态。
- [ ] 实现带微信存储适配层的版本化缓存服务。
- [ ] 实现 30 分钟缓存判断、2 秒超时、腾讯天气请求适配和手动天气转换。
- [ ] 运行 `node --test tests/*.test.js`，修复至全部通过。

### Task 4: 通用组件

**Files:**
- Create: `components/weather-bar/*`
- Create: `components/recommendation-card/*`
- Create: `components/empty-state/*`
- Create: `components/temperature-modal/*`
- Create: `components/share-card/*`

- [ ] 实现天气条与刷新、手动输入事件。
- [ ] 实现推荐卡、临时调薄/调厚/刚刚好事件及边界禁用状态。
- [ ] 实现通用空状态和室温修改弹层。
- [ ] 实现 Canvas 分享卡生成、保存、失败提示与免责声明。
- [ ] 静态检查每个组件的 JSON/WXML/JS/WXSS 文件完整且引用合法。

### Task 5: 首次设置、城市和手动天气

**Files:**
- Create: `pages/onboarding/*`
- Create: `pages/city/*`
- Create: `pages/manual-weather/*`

- [ ] 实现首次设置三步流程，所有步骤可跳过并写入默认值。
- [ ] 实现用户点击后定位、拒绝提示、最近城市和本地城市搜索。
- [ ] 实现室内外温度输入、天气多选、校验和手动建议生成。
- [ ] 验证清空状态、拒绝定位和无 API Key 时均可进入今日页。

### Task 6: 今日页

**Files:**
- Create: `pages/today/*`

- [ ] 首屏展示天气、室温、判断标准和三场景摘要。
- [ ] 下方展示三张完整推荐卡及分享入口。
- [ ] 实现天气缓存、请求失败、无城市、无天气和加载状态。
- [ ] 实现修改室温、刷新、切换城市和重新进入时清空临时调整。
- [ ] 确保首页免责声明可见。

### Task 7: 用品、设置和隐私

**Files:**
- Create: `pages/goods/*`
- Create: `pages/settings/*`
- Create: `pages/privacy/*`
- Create: `assets/goods/*.jpg`

- [ ] 实现用品大类、小类筛选、保暖值、温度范围和统一图片回退。
- [ ] 实现宝宝生日、体质、是否易出汗、室温和城市设置。
- [ ] 实现二次确认清除数据并回到首次设置。
- [ ] 实现完整隐私说明和健康免责声明。
- [ ] 创建统一低饱和用品矢量插画和默认占位图。

### Task 8: 应用生命周期与更新提示

**Files:**
- Modify: `app.js`
- Modify: `pages/today/index.js`

- [ ] 启动时初始化或迁移缓存。
- [ ] 未完成初始化时跳转首次设置。
- [ ] 接入 `wx.getUpdateManager`，新版本下载完成后提示重启。
- [ ] 确保页面直接打开时也能恢复合法默认状态。

### Task 9: 全量自动检查与验收说明

**Files:**
- Create: `scripts/validate-project.js`
- Create: `README.md`
- Create: `docs/verification.md`

- [ ] 编写项目校验脚本，检查页面/组件四件套、JSON 语法、路由文件、禁止文案和免责声明。
- [ ] 运行 `node --test tests/*.test.js`。
- [ ] 运行 `node scripts/validate-project.js`。
- [ ] 记录导入方式、腾讯位置服务 Key 配置方式和手动天气兜底。
- [ ] 记录必须在微信开发者工具或真机完成的 Canvas、定位、保存图片和双端验收项。
