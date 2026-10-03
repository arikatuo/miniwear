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

test('首次设置温度输入保留草稿直到确认', () => withWxStorage(() => {
  const page = loadPage('../miniprogram/pages/onboarding/index')
  const context = {
    data: JSON.parse(JSON.stringify(page.data)),
    setData(patch, callback) { applySetData(this, patch, callback) }
  }

  page.inputIndoor.call(context, { detail: { value: '28' } })

  assert.equal(context.data.draftIndoorTemp, '28')

}))

test('宝宝设置温度滚轮用草稿温度实时驱动读数并同步保存', () => withWxStorage(() => {
  const storage = require('../miniprogram/services/storage.service')
  storage.initialize()
  const page = loadPage('../miniprogram/pages/settings/index')
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
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/weather-bar/index.wxml'), 'utf8')

  assert.match(wxml, /改城市/)
  assert.match(wxml, /改天气/)
})

test('今日天气卡主温度和温度范围分层展示避免挤压', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/weather-bar/index.wxml'), 'utf8')
  const wxss = fs.readFileSync(path.join(__dirname, '../miniprogram/components/weather-bar/index.wxss'), 'utf8')

  assert.match(wxml, /class="combo-body"/)
  assert.match(wxml, /class="combo-topline"/)
  assert.match(wxml, /class="combo-mainline"/)
  assert.match(wxml, /class="combo-range"/)
  assert.doesNotMatch(wxml, /class="combo-value"[^>]*>[^<]*<text[^>]+class="combo-range"/)
  assert.match(wxss, /\.combo-topline\s*\{[^}]*display:\s*flex/)
  assert.match(wxss, /\.combo-mainline\s*\{[^}]*display:\s*flex/)
  assert.match(wxss, /\.combo-range\s*\{[^}]*display:\s*block/)
})

test('用品页不展示顶部说明长文', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/goods/index.wxml'), 'utf8')

  assert.doesNotMatch(wxml, /穿衣和睡觉用品参考清单，不代表必须全部准备，请按家里实际情况选择。/)
  assert.doesNotMatch(wxml, /page-subtitle/)
})

test('首次设置偏好选项使用 Flexbox 等宽三列以避开小程序 Grid 兼容风险', () => {
  const wxss = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/onboarding/index.wxss'), 'utf8')

  assert.doesNotMatch(wxss, /\.option-grid\s*\{[^}]*display:\s*grid/)
  assert.match(wxss, /\.option-grid[^}]*display:\s*flex/)
  assert.match(wxss, /\.option,[^}]*flex:\s*1/)
  assert.match(wxss, /min-width:\s*0/)
})

test('手动天气和用品分类入口也使用 Flexbox 避开真机 Grid 兼容风险', () => {
  const manualWeather = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/manual-weather/index.wxss'), 'utf8')
  const goods = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/goods/index.wxss'), 'utf8')

  assert.doesNotMatch(manualWeather, /\.weather-options\s*\{[^}]*display:\s*grid/)
  assert.match(manualWeather, /\.weather-options\s*\{[^}]*display:\s*flex/)
  assert.match(manualWeather, /\.weather-options button\s*\{[^}]*flex:\s*1\s+1\s+0/)
  assert.doesNotMatch(goods, /\.category-tabs\s*\{[^}]*display:\s*grid/)
  assert.match(goods, /\.category-tabs\s*\{[^}]*display:\s*flex/)
  assert.match(goods, /\.category-tabs button\s*\{[^}]*flex:\s*1\s+1\s+0/)
})

test('首次温度可直接输入，设置页滚轮保留实时 change', () => {
  const onboarding = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/onboarding/index.wxml'), 'utf8')
  const settings = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/settings/index.wxml'), 'utf8')

  assert.match(onboarding, /bindinput="inputIndoor"/)
  assert.match(settings, /<picker-view[^>]+immediate-change="\{\{true\}\}"/)
})

test('用品清单不混入插画占位条目', () => {
  const { goods } = require('../miniprogram/config/goods.config')
  const placeholderIds = ['leggings', 'fleece_pants', 'sun_hat', 'warm_hat', 'belly_band']

  placeholderIds.forEach((id) => {
    assert.equal(goods.some((entry) => entry.id === id), false, `placeholder goods item should be removed: ${id}`)
  })
  assert.equal(goods.length, 54)
  assert.equal(goods.some((entry) => entry.desc.includes('插画示意')), false)
  assert.equal(goods.some((entry) => entry.illustration.endsWith('.svg')), false)
  assert.equal(goods.filter((entry) => entry.catalogParent === 'padded_romper').length, 9, '夹棉连体衣历史克重仅保留兼容数据')
  assert.deepEqual(goods.find((entry) => entry.id === 'padded_romper').variants.map((item) => item.label), ['轻薄 40～60g', '中等 80～120g', '厚 160～180g', '极厚 200～240g'])
  ;['thin_long_pants', 'regular_long_pants', 'fleece_long_pants'].forEach((id) => assert.ok(goods.some((entry) => entry.id === id), `缺少${id}`))
  assert.equal(goods.find((entry) => entry.id === 'thin_padded_sleeping_bag').name, '薄夹棉分腿睡袋')
  assert.equal(goods.find((entry) => entry.id === 'small_towel').category, 'care')
  assert.equal(goods.find((entry) => entry.id === 'small_towel').catalogHidden, true)
  assert.equal(goods.find((entry) => entry.id === 'adult_quilt').referenceOnly, true)
})

test('分享弹层预览完整缩放长图而不是裁切底部', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/share-card/index.wxml'), 'utf8')
  const wxss = fs.readFileSync(path.join(__dirname, '../miniprogram/components/share-card/index.wxss'), 'utf8')
  const previewRule = wxss.match(/\.preview\s*\{[^}]+\}/)[0]

  assert.match(wxml, /<image[^>]+mode="aspectFit"[^>]+class="image"/)
  assert.match(wxss, /\.image\s*\{[^}]*height:\s*100%/)
  assert.doesNotMatch(previewRule, /overflow:\s*hidden/)
})

test('分享卡使用稳定的小程序码资源路径', () => {
  const shareConfig = require('../miniprogram/config/share.config')
  const qrcodePath = path.join(__dirname, '../miniprogram', shareConfig.MINI_PROGRAM_CODE_PATH.replace(/^\//, ''))

  assert.equal(shareConfig.MINI_PROGRAM_CODE_PATH, '/assets/qrcode.png')
  assert.equal(fs.existsSync(qrcodePath), true)
})

test('分享卡使用 Canvas 2D 节点并预加载小程序码后再绘制', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/share-card/index.wxml'), 'utf8')
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/components/share-card/index.js'), 'utf8')

  assert.match(wxml, /<canvas[^>]+id="posterCanvas"[^>]+type="2d"/)
  assert.doesNotMatch(wxml, /canvas-id="shareCanvas"/)
  assert.doesNotMatch(js, /wx\.createCanvasContext/)
  assert.doesNotMatch(js, /canvasId:\s*['"]shareCanvas['"]/)
  assert.match(js, /createSelectorQuery\(\)[\s\S]+select\('#posterCanvas'\)[\s\S]+fields\(\{\s*node:\s*true,\s*size:\s*true\s*\}\)/)
  assert.match(js, /canvas\.createImage\(\)/)
  assert.match(js, /image\.onload\s*=\s*\(\)\s*=>\s*resolve\(image\)/)
  assert.match(js, /await this\.loadPosterImages\(canvas\)/)
  assert.match(js, /this\.drawPoster\(\{\s*ctx,\s*images,\s*data\s*\}\)/)
  assert.match(js, /wx\.canvasToTempFilePath\(\{\s*canvas,/)
})

test('分享卡绘制函数只使用已加载的小程序码 image 对象', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/components/share-card/index.js'), 'utf8')

  assert.match(js, /ctx\.drawImage\(images\.qrcode,\s*424,\s*734,\s*124,\s*124\)/)
  assert.doesNotMatch(js, /ctx\.drawImage\(\s*MINI_PROGRAM_CODE_PATH/)
  assert.doesNotMatch(js, /ctx\.drawImage\(\s*['"]\/assets\//)
  assert.doesNotMatch(js, /ctx\.drawImage\(\s*codeImagePath/)
  assert.doesNotMatch(js, /wx\.getImageInfo\(/)
})

test('app.json 中每个页面都提供微信好友分享入口', () => {
  const appConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../miniprogram/app.json'), 'utf8'))

  appConfig.pages.forEach((pagePath) => {
    const js = fs.readFileSync(path.join(__dirname, '../miniprogram', `${pagePath}.js`), 'utf8')
    assert.match(js, /onShareAppMessage\s*\(/, `${pagePath}.js should define onShareAppMessage`)
  })
})

test('推荐卡只突出穿搭结果和一个记录动作', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/recommendation-card/index.wxml'), 'utf8')

  assert.doesNotMatch(wxml, /illustration-thumb/)
  assert.doesNotMatch(wxml, /src="\{\{item\.icon\}\}"/)
  assert.doesNotMatch(wxml, /class="tag age-tag"/)
  assert.doesNotMatch(wxml, /class="warmth-meter"/)
  assert.doesNotMatch(wxml, /class="age-note"/)
  assert.doesNotMatch(wxml, /热了怎么办|冷了怎么办|想薄一点|想厚一点/)
  assert.match(wxml, /class="result"/)
  assert.match(wxml, /class="adopt-button [^"]*"[^>]*bindtap="confirm"/)
})

test('首页将调整收起，记录后才提供观察与分享', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/today/index.wxml'), 'utf8')
  const card = fs.readFileSync(path.join(__dirname, '../miniprogram/components/recommendation-card/index.wxml'), 'utf8')

  assert.match(wxml, /class="context-summary"/)
  assert.match(card, /bindtap="openAdjust"/)
  assert.match(wxml, /wx:if="\{\{adoptedScenes\[activeScene\]\}\}" class="recorded-actions"/)
  assert.match(wxml, /class="global-tip" bindtap="toggleSafety"/)
  assert.match(wxml, /wx:if="\{\{showSafetyDetails\}\}" class="safety-details"/)
})

test('推荐卡提供就地用品图例入口，返回不需重置当前搭配', () => {
  const cardWxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/recommendation-card/index.wxml'), 'utf8')
  const cardJs = fs.readFileSync(path.join(__dirname, '../miniprogram/components/recommendation-card/index.js'), 'utf8')
  const todayWxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/today/index.wxml'), 'utf8')
  const todayJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/today/index.js'), 'utf8')

  assert.match(cardWxml, /goods-link/)
  assert.match(cardWxml, /看衣物图例与替代项/)
  assert.match(cardJs, /triggerEvent\('goods'/)
  assert.match(todayWxml, /bind:goods="viewGoods"/)
  assert.match(todayJs, /viewGoods/)
})

test('用品页不保留无入口触发的推荐焦点区', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/goods/index.wxml'), 'utf8')
  const wxss = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/goods/index.wxss'), 'utf8')
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/goods/index.js'), 'utf8')

  assert.doesNotMatch(wxml, /focusedGoods/)
  assert.doesNotMatch(wxml, /focus-panel/)
  assert.doesNotMatch(wxml, /来自刚才的穿衣建议/)
  assert.doesNotMatch(wxss, /\.focus-panel\s*\{/)
  assert.doesNotMatch(js, /getGoodsFocus/)
  assert.doesNotMatch(js, /buildFocusedGoods/)
})

test('设置页不展示容易误解的定位状态行', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/settings/index.wxml'), 'utf8')

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
  delete require.cache[require.resolve('../miniprogram/services/storage.service')]
  delete require.cache[require.resolve('../miniprogram/pages/city/index')]
  const storage = require('../miniprogram/services/storage.service')
  storage.initialize()
  const page = loadPage('../miniprogram/pages/city/index')
  const context = {
    data: JSON.parse(JSON.stringify(page.data)),
    setData(patch) { applySetData(this, patch) }
  }

  page.reverseGeocode.call(context, 30.25, 120.16)

  assert.equal(storage.getCity().name, '杭州')
  assert.equal(storage.getCity().source, 'location')
})

test('配件分类里厚袜子保暖值高于普通袜子', () => {
  const { goods } = require('../miniprogram/config/goods.config')
  const socks = goods.find((item) => item.id === 'socks')
  const thickSocks = goods.find((item) => item.id === 'thick_socks')

  assert.ok(socks && thickSocks, '袜子/厚袜子条目应该都存在')
  assert.ok(thickSocks.warmValue > socks.warmValue)
  assert.match(thickSocks.tempRange, new RegExp(`\\+${thickSocks.warmValue}℃`))
})
