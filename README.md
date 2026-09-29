# 宝宝今天穿什么

一个根据天气、室温和宝宝情况，提供在家、出门、睡觉三场景穿搭参考的原生微信小程序。

## 导入项目

1. 打开微信开发者工具。
2. 选择“导入项目”，目录选择本项目根目录。
3. 在 `project.config.json` 中将测试 AppID 替换为实际小程序 AppID。
4. 首次运行可以不配置天气 Key，使用“手动填写温度”完成全部核心流程。

## 配置天气

在 `miniprogram/config/weather.config.js` 填写腾讯位置服务 WebService Key：

```js
module.exports = {
  TENCENT_MAP_KEY: '你的 Key',
  REQUEST_TIMEOUT_MS: 2000,
  CACHE_TTL_MS: 30 * 60 * 1000
}
```

上线前应在腾讯位置服务控制台限制 Key 的额度和可调用接口。若无法接受前端 Key 暴露风险，应按 PRD 的技术预案改为只转发天气查询的云函数轻代理。

同时需要在微信公众平台将 `https://apis.map.qq.com` 添加为 request 合法域名。

## 配置分享卡小程序码

小程序发布并取得固定小程序码后，将 PNG 放入 `miniprogram/assets`，并在 `miniprogram/config/share.config.js` 配置：

```js
module.exports = {
  MINI_PROGRAM_CODE_PATH: '/assets/share/miniprogram-code.png'
}
```

未配置时分享卡会明确显示“上线前配置”占位，避免把无效二维码误当作可识别小程序码。

## 本地检查

```powershell
npm test
npm run validate
```

项目无运行时依赖，不需要执行 `npm install`。

`miniprogram/` 是开发者工具扫描的小程序运行目录。用品图片使用 WebP，所有图片和音频的合计大小需低于 200 KiB；`npm run validate` 会检查这项总量。

## 数据与隐私

- 不要求登录，不收集手机号。
- 宝宝资料、室温、城市和天气缓存只写入微信小程序本地缓存。
- 定位仅在用户点击“一键定位”后申请。
- 设置页可二次确认后清除全部 `bbc_` 前缀业务数据。

## 健康边界

本建议仅供日常穿衣参考，不构成医疗建议。请结合宝宝实际状态判断；如宝宝出现明显不适，请及时咨询医生。
