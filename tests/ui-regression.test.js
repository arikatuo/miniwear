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

test('首次设置偏好选项使用不会横向溢出的两列网格', () => {
  const wxss = fs.readFileSync(path.join(__dirname, '../pages/onboarding/index.wxss'), 'utf8')

  assert.match(wxss, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(wxss, /box-sizing:\s*border-box/)
})
