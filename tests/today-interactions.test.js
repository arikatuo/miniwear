const test = require('node:test')
const assert = require('node:assert/strict')
const { buildAllRecommendations } = require('../services/recommendation.service')

const profile = {
  ageGroup: 'baby_6_12m',
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

test('刚刚好会重置当前场景的临时调薄调厚状态', () => {
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

  assert.equal(context.data.adjustments.indoor, 0)
  assert.equal(context.data.adjustments.outdoor, 1)
  assert.equal(context.data.adjustmentLabels.indoor, '')
  assert.equal(context.data.recommendations.indoor.adjustment, 0)
  assert.equal(context.data.recommendations.outdoor.adjustment, 1)
  assert.match(global.__lastToast.title, /后颈温热/)
})
