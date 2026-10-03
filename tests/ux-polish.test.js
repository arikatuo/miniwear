const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '../miniprogram')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

function loadPage(modulePath) {
  let page = null
  global.Page = (definition) => { page = definition }
  delete require.cache[require.resolve(modulePath)]
  require(modulePath)
  return page
}
function loadComponent(modulePath) {
  let component = null
  global.Component = (definition) => { component = definition }
  delete require.cache[require.resolve(modulePath)]
  require(modulePath)
  return component
}

test('手动天气 ± 步进器按 -30~45℃ 夹取，并兼容空值', () => {
  const page = loadPage('../miniprogram/pages/manual-weather/index')
  const context = { data: { outdoorTemp: 45, indoorTemp: '' }, setData(patch) { Object.assign(this.data, patch) } }
  page.stepTemp.call(context, { currentTarget: { dataset: { field: 'outdoorTemp', delta: 1 } } })
  assert.equal(context.data.outdoorTemp, 45)
  context.data.outdoorTemp = -30
  page.stepTemp.call(context, { currentTarget: { dataset: { field: 'outdoorTemp', delta: -1 } } })
  assert.equal(context.data.outdoorTemp, -30)
  page.stepTemp.call(context, { currentTarget: { dataset: { field: 'indoorTemp', delta: 1 } } })
  assert.equal(context.data.indoorTemp, 25)
  page.stepTemp.call(context, { currentTarget: { dataset: { field: 'hacked', delta: 1 } } })
  assert.equal(context.data.hacked, undefined)
})

test('室温弹层 ± 步进限制在 5~40℃，确认前仍校验范围', () => {
  global.wx = { showToast(options) { global.__lastToast = options } }
  const component = loadComponent('../miniprogram/components/temperature-modal/index')
  const context = { data: { draft: 40 }, setData(patch) { Object.assign(this.data, patch) } }
  component.methods.step.call(context, { currentTarget: { dataset: { delta: 1 } } })
  assert.equal(context.data.draft, 40)
  context.data.draft = 5
  component.methods.step.call(context, { currentTarget: { dataset: { delta: -1 } } })
  assert.equal(context.data.draft, 5)
})

test('推荐卡把已有档位转成厚薄指示与衣物缩略图，且不改变推荐结果', () => {
  const component = loadComponent('../miniprogram/components/recommendation-card/index')
  const { buildRecommendation } = require('../miniprogram/services/recommendation.service')
  const item = buildRecommendation({ scene: 'indoor', temperature: 23, profile: { ageGroup: 'baby_6_12m' } })
  const context = { data: {}, setData(patch) { Object.assign(this.data, patch) } }
  component.observers.item.call(context, item)
  assert.equal(context.data.dots.length, 6)
  assert.equal(context.data.dots.filter((dot) => dot.on).length, item.level)
  assert.ok(context.data.pieces.length >= 1)
  assert.ok(context.data.pieces.every((piece) => piece.illustration.endsWith('.jpg')))
  assert.equal(item.result, '长袖包屁衣 + 薄裤')
})

test('所有组件样式都显式引入共享样式，避免样式隔离导致按钮/弹层失效', () => {
  ;['empty-state', 'recommendation-card', 'temperature-modal', 'weather-bar', 'share-card'].forEach((name) => {
    assert.match(read(`components/${name}/index.wxss`), /@import "\.\.\/\.\.\/styles\/shared\.wxss";/, name)
  })
  assert.match(read('app.wxss'), /@import "styles\/shared\.wxss";/)
})

test('触控目标不小于 44px（88rpx）：主要按钮与文字按钮', () => {
  const shared = read('styles/shared.wxss')
  assert.match(shared, /\.primary-button[\s\S]*?min-height:\s*96rpx/)
  assert.match(shared, /\.text-button\s*\{[^}]*min-height:\s*80rpx/)
})

test('今日页保留免责声明，且分享卡/海报文案不被删减', () => {
  assert.match(read('pages/today/index.wxml'), /不构成医疗建议/)
  assert.match(read('components/share-card/index.js'), /如宝宝出现明显不适，请及时咨询医生/)
})

test('城市页提供热门城市与当前城市标记，选择行为不变', () => {
  const wxml = read('pages/city/index.wxml')
  assert.match(wxml, /热门城市/)
  assert.match(wxml, /currentCity/)
  const page = loadPage('../miniprogram/pages/city/index')
  assert.equal(page.data.hotCities.length, 8)
})

test('今日页开启下拉刷新并在分享只读态下直接结束刷新', async () => {
  const json = JSON.parse(read('pages/today/index.json'))
  assert.equal(json.enablePullDownRefresh, true)
  let stopped = 0
  global.wx = { stopPullDownRefresh() { stopped += 1 } }
  const page = loadPage('../miniprogram/pages/today/index')
  await page.onPullDownRefresh.call({ data: { sharedSnapshot: { scene: 'indoor' }, sharedError: '' } })
  assert.equal(stopped, 1)
})

test('室温弹层输入清空后点 ± 回到默认 24℃ 起步，而不是从 0 起步', () => {
  const component = loadComponent('../miniprogram/components/temperature-modal/index')
  const context = { data: { draft: '' }, setData(patch) { Object.assign(this.data, patch) } }
  component.methods.step.call(context, { currentTarget: { dataset: { delta: 1 } } })
  assert.equal(context.data.draft, 25)
})
