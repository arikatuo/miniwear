const test = require('node:test')
const assert = require('node:assert/strict')
const { buildAllRecommendations } = require('../services/recommendation.service')

const profile = {
  ageGroup: 'baby_6_12m',
  ageConfirmed: true,
  bodyType: 'unknown',
  easySweat: 'unknown'
}

function loadTodayPage() {
  let page = null
  const data = {}
  global.Page = (definition) => { page = definition }
  global.wx = {
    getStorageSync(key) { return data[key] },
    setStorageSync(key, value) { data[key] = value },
    removeStorageSync(key) { delete data[key] },
    getStorageInfoSync() { return { keys: Object.keys(data) } },
    switchTab(options) {
      global.__lastSwitchTab = options
    },
    reLaunch(options) {
      global.__lastReLaunch = options
    },
    showToast(options) {
      global.__lastToast = options
    }
  }
  delete require.cache[require.resolve('../services/storage.service')]
  delete require.cache[require.resolve('../pages/today/index')]
  require('../pages/today/index')
  return page
}

function applySetData(target, patch) {
  Object.entries(patch).forEach(([path, value]) => {
    const parts = path.split('.')
    let cursor = target.data
    parts.slice(0, -1).forEach((part) => {
      cursor = cursor[part]
    })
    cursor[parts[parts.length - 1]] = value
  })
}

test('记下当前搭配会保留当前场景的调整状态', () => {
  const todayPage = loadTodayPage()
  const adjustments = { indoor: -2, outdoor: 1, sleep: 0 }
  const context = {
    data: {
      indoorTemp: 24,
      weather: { currentTemp: 21, weatherType: ['rain'] },
      profile,
      adjustments,
      adjustmentLabels: { indoor: '已临时调薄', outdoor: '已临时调厚', sleep: '' },
      recommendations: buildAllRecommendations({
        indoorTemp: 24,
        outdoorTemp: 21,
        profile,
        weatherTypes: ['rain'],
        adjustments
      })
    },
    setData(patch, callback) {
      applySetData(this, patch)
      if (callback) callback()
    }
  }

  todayPage.confirmGood.call(context, { detail: { scene: 'indoor' } })

  assert.equal(context.data.adjustments.indoor, -2)
  assert.equal(context.data.adjustments.outdoor, 1)
  assert.equal(context.data.adjustmentLabels.indoor, '已记下这套搭配')
  assert.equal(context.data.recommendations.indoor.adjustment, -2)
  assert.equal(context.data.recommendations.outdoor.adjustment, 1)
  assert.match(global.__lastToast.title, /已记下/)
})

test('室外未知时不能确认出门搭配，但在家搭配仍可确认', () => {
  const todayPage = loadTodayPage()
  const context = {
    data: { activeScene: 'outdoor', profile, weather: { source: 'example' }, adoptedScenes: {}, adjustmentLabels: {} },
    setData(patch, callback) { applySetData(this, patch); if (callback) callback() }
  }
  todayPage.confirmGood.call(context, { detail: { scene: 'outdoor' } })
  assert.equal(context.data.adoptedScenes.outdoor, undefined)
  assert.match(global.__lastToast.title, /填写室外温度/)
  todayPage.confirmGood.call(context, { detail: { scene: 'indoor' } })
  assert.equal(context.data.adoptedScenes.indoor, true)
})

test('回访条件只把当前场景需要的环境纳入有效性判断', () => {
  const todayPage = loadTodayPage()
  const context = {
    data: { indoorTemp: 24, profile, weather: { currentTemp: 30, source: 'api' } },
    conditionsFor: todayPage.conditionsFor
  }
  assert.equal(todayPage.conditionsMatch.call(context, { scene: 'indoor', conditions: { indoorTemp: 24, outdoorTemp: 21, source: 'manual', ageGroup: profile.ageGroup } }, context.data.weather), true)
  assert.equal(todayPage.conditionsMatch.call(context, { scene: 'outdoor', conditions: { indoorTemp: 24, outdoorTemp: 21, source: 'manual', ageGroup: profile.ageGroup } }, context.data.weather), false)
  assert.equal(todayPage.conditionsMatch.call(context, { scene: 'sleep', conditions: { indoorTemp: 25, ageGroup: profile.ageGroup } }, context.data.weather), false)
  assert.equal(todayPage.conditionsMatch.call(context, { scene: 'indoor', savedAt: Date.now() - 25 * 60 * 60 * 1000, conditions: { indoorTemp: 24, ageGroup: profile.ageGroup } }, context.data.weather), false)
})

test('冷启动接收分享后按我家情况生成会退出只读状态并进入个人首流程', () => {
  const todayPage = loadTodayPage()
  const context = {
    data: { sharedSnapshot: { scene: 'indoor' }, sharedError: '' },
    setData(patch) { applySetData(this, patch) }
  }
  todayPage.exitShared.call(context)
  assert.equal(context.data.sharedSnapshot, null)
  assert.equal(context.data.sharedError, '')
  assert.equal(global.__lastReLaunch.url, '/pages/onboarding/index')
})
