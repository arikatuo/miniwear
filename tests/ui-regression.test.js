const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

function loadPage(modulePath) {
  let page = null
  global.Page = (definition) => { page = definition }
  delete require.cache[require.resolve(modulePath)]
  require(modulePath)
  return page
}

function withWxStorage(run) {
  const data = {}
  global.wx = {
    getStorageSync(key) { return data[key] },
    setStorageSync(key, value) { data[key] = value },
    removeStorageSync(key) { delete data[key] },
    getStorageInfoSync() { return { keys: Object.keys(data) } },
    navigateTo(options) { global.__lastNavigateTo = options },
    switchTab(options) { global.__lastSwitchTab = options },
    showToast(options) { global.__lastToast = options }
  }
  return run(data)
}

function applySetData(target, patch, callback) {
  Object.entries(patch).forEach(([key, value]) => {
    const parts = key.replace(/\[(\d+)\]/g, '.$1').split('.')
    let cursor = target.data
    parts.slice(0, -1).forEach((part) => { cursor = cursor[part] })
    cursor[parts[parts.length - 1]] = value
  })
  if (callback) callback()
}

test('首次设置温度滚轮用草稿温度实时驱动读数', () => withWxStorage(() => {
  const page = loadPage('../pages/onboarding/index')
  const context = {
    data: JSON.parse(JSON.stringify(page.data)),
    setData(patch, callback) { applySetData(this, patch, callback) }
  }

  page.temperatureChange.call(context, { detail: { value: [16] } })

  assert.equal(context.data.draftIndoorTemp, 28)
  assert.deepEqual(context.data.temperaturePickerValue, [16])
}))

test('宝宝设置温度滚轮用草稿温度实时驱动读数并同步保存', () => withWxStorage(() => {
  const storage = require('../services/storage.service')
  storage.initialize()
  const page = loadPage('../pages/settings/index')
  const context = {
    data: JSON.parse(JSON.stringify(page.data)),
    setData(patch, callback) { applySetData(this, patch, callback) }
  }

  page.indoorChange.call(context, { detail: { value: [10] } })

  assert.equal(context.data.draftIndoorTemp, 22)
  assert.equal(context.data.indoorTemp, 22)
  assert.deepEqual(context.data.tempPickerValue, [10])
  assert.equal(storage.getEnvironment().indoorTemp, 22)
}))

test('今日天气卡提供明确的改城市和改天气入口', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../components/weather-bar/index.wxml'), 'utf8')

  assert.match(wxml, /改城市/)
  assert.match(wxml, /改天气/)
})

test('首次设置偏好选项使用 Flexbox 等宽三列以避开小程序 Grid 兼容风险', () => {
  const wxss = fs.readFileSync(path.join(__dirname, '../pages/onboarding/index.wxss'), 'utf8')

  assert.doesNotMatch(wxss, /\.option-grid\s*\{[^}]*display:\s*grid/)
  assert.match(wxss, /\.option-grid\s*\{[^}]*display:\s*flex/)
  assert.match(wxss, /\.option\s*\{[^}]*flex:\s*1\s+1\s+0/)
  assert.match(wxss, /box-sizing:\s*border-box/)
  assert.match(wxss, /white-space:\s*normal/)
})

test('手动天气和用品分类入口也使用 Flexbox 避开真机 Grid 兼容风险', () => {
  const manualWeather = fs.readFileSync(path.join(__dirname, '../pages/manual-weather/index.wxss'), 'utf8')
  const goods = fs.readFileSync(path.join(__dirname, '../pages/goods/index.wxss'), 'utf8')

  assert.doesNotMatch(manualWeather, /\.weather-options\s*\{[^}]*display:\s*grid/)
  assert.match(manualWeather, /\.weather-options\s*\{[^}]*display:\s*flex/)
  assert.match(manualWeather, /\.weather-options button\s*\{[^}]*flex:\s*1\s+1\s+0/)
  assert.doesNotMatch(goods, /\.category-tabs\s*\{[^}]*display:\s*grid/)
  assert.match(goods, /\.category-tabs\s*\{[^}]*display:\s*flex/)
  assert.match(goods, /\.category-tabs button\s*\{[^}]*flex:\s*1\s+1\s+0/)
})

test('两处温度滚轮启用微信 picker-view 实时 change 事件', () => {
  const onboarding = fs.readFileSync(path.join(__dirname, '../pages/onboarding/index.wxml'), 'utf8')
  const settings = fs.readFileSync(path.join(__dirname, '../pages/settings/index.wxml'), 'utf8')

  assert.match(onboarding, /<picker-view[^>]+immediate-change="\{\{true\}\}"/)
  assert.match(settings, /<picker-view[^>]+immediate-change="\{\{true\}\}"/)
})

test('用品清单不混入插画占位条目', () => {
  const { goods } = require('../config/goods.config')
  const placeholderIds = ['leggings', 'fleece_pants', 'sun_hat', 'warm_hat', 'belly_band']

  placeholderIds.forEach((id) => {
    assert.equal(goods.some((entry) => entry.id === id), false, `placeholder goods item should be removed: ${id}`)
  })
  assert.equal(goods.length, 50)
  assert.equal(goods.some((entry) => entry.desc.includes('插画示意')), false)
  assert.equal(goods.some((entry) => entry.illustration.endsWith('.svg')), false)
})

test('分享弹层预览完整缩放长图而不是裁切底部', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../components/share-card/index.wxml'), 'utf8')
  const wxss = fs.readFileSync(path.join(__dirname, '../components/share-card/index.wxss'), 'utf8')
  const previewRule = wxss.match(/\.preview\s*\{[^}]+\}/)[0]

  assert.match(wxml, /<image[^>]+mode="aspectFit"[^>]+class="image"/)
  assert.match(wxss, /\.image\s*\{[^}]*height:\s*100%/)
  assert.doesNotMatch(previewRule, /overflow:\s*hidden/)
})

test('推荐卡主文案不再被装饰图或长句年龄提示挤占', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../components/recommendation-card/index.wxml'), 'utf8')

  assert.doesNotMatch(wxml, /illustration-thumb/)
  assert.doesNotMatch(wxml, /src="\{\{item\.icon\}\}"/)
  assert.doesNotMatch(wxml, /class="tag age-tag"/)
  assert.doesNotMatch(wxml, /class="warmth-meter"/)
  assert.match(wxml, /class="age-note"/)
})

test('推荐卡提供低干扰的相关用品入口并由今日页承接', () => {
  const cardWxml = fs.readFileSync(path.join(__dirname, '../components/recommendation-card/index.wxml'), 'utf8')
  const cardJs = fs.readFileSync(path.join(__dirname, '../components/recommendation-card/index.js'), 'utf8')
  const todayWxml = fs.readFileSync(path.join(__dirname, '../pages/today/index.wxml'), 'utf8')

  assert.match(cardWxml, /bindtap="viewGoods"/)
  assert.match(cardWxml, /相关用品/)
  assert.match(cardJs, /triggerEvent\('goods'/)
  assert.match(todayWxml, /bind:goods="viewGoods"/)
})

test('用品页能展示从穿衣建议带来的相关用品区', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../pages/goods/index.wxml'), 'utf8')
  const wxss = fs.readFileSync(path.join(__dirname, '../pages/goods/index.wxss'), 'utf8')

  assert.match(wxml, /focusedGoods\.length/)
  assert.match(wxml, /focus-panel/)
  assert.match(wxml, /来自刚才的穿衣建议/)
  assert.match(wxss, /\.focus-panel\s*\{/)
})

test('设置页不展示容易误解的定位状态行', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../pages/settings/index.wxml'), 'utf8')

  assert.doesNotMatch(wxml, /定位状态/)
})

test('定位命中内置城市时仍保存为定位来源', () => {
  const data = {}
  global.wx = {
    getStorageSync(key) { return data[key] },
    setStorageSync(key, value) { data[key] = value },
    removeStorageSync(key) { delete data[key] },
    getStorageInfoSync() { return { keys: Object.keys(data) } },
    request(options) {
      options.success({
        data: {
          result: {
            address_component: { city: '杭州市' },
            ad_info: { adcode: '330100' }
          }
        }
      })
      options.complete()
    },
    showToast(options) { global.__lastToast = options },
    navigateBack() {}
  }
  delete require.cache[require.resolve('../services/storage.service')]
  delete require.cache[require.resolve('../pages/city/index')]
  const storage = require('../services/storage.service')
  storage.initialize()
  const page = loadPage('../pages/city/index')
  const context = {
    data: JSON.parse(JSON.stringify(page.data)),
    setData(patch) { applySetData(this, patch) }
  }

  page.reverseGeocode.call(context, 30.25, 120.16)

  assert.equal(storage.getCity().name, '杭州')
  assert.equal(storage.getCity().source, 'location')
})
