// Product-state replay, not a WeChat renderer or a real-user usability test.
// Uses isolated memory storage and simulated network failure; makes no network requests.
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const memory = new Map()
const calls = []
const copy = value => value === undefined ? undefined : structuredClone(value)
global.wx = {
  getStorageSync: key => copy(memory.get(key)),
  setStorageSync: (key, value) => memory.set(key, copy(value)),
  removeStorageSync: key => memory.delete(key),
  getStorageInfoSync: () => ({ keys: [...memory.keys()] }),
  reLaunch: value => calls.push({ action: 'reLaunch', ...value }),
  switchTab: value => calls.push({ action: 'switchTab', ...value }),
  navigateTo: value => calls.push({ action: 'navigateTo', ...value }),
  showToast: value => calls.push({ action: 'toast', title: value.title }),
  showModal: value => calls.push({ action: 'modal', title: value.title, content: value.content }),
  request: options => {
    setTimeout(() => options.fail({ errMsg: 'audit simulated offline' }), 0)
    return { abort() {} }
  }
}
function page(name) {
  let definition
  global.Page = value => { definition = value }
  const file = path.join(root, 'pages', name, 'index.js')
  delete require.cache[require.resolve(file)]
  require(file)
  definition.data = copy(definition.data)
  definition.setData = function (patch, callback) {
    for (const [key, value] of Object.entries(patch)) {
      const parts = key.split('.')
      let cursor = this.data
      for (const part of parts.slice(0, -1)) cursor = cursor[part]
      cursor[parts.at(-1)] = value
    }
    if (callback) callback()
  }
  return definition
}
const storage = require(path.join(root, 'services/storage.service'))
const records = []
function record(name, observed) { records.push({ name, observed: copy(observed) }) }
async function main() {
  const first = page('today')
  first.onShow()
  record('fresh-entry', { navigation: calls.at(-1), recommendations: first.data.recommendations })
  const onboarding = page('onboarding')
  onboarding.onLoad()
  const steps = [onboarding.data.step]
  for (let i = 0; i < 3; i++) { onboarding.skip(); steps.push(onboarding.data.step) }
  const today = page('today')
  await today.loadData()
  record('skip-all-three-steps', {
    steps, initialized: storage.getAppState().appInit,
    indoorTemp: today.data.indoorTemp, city: today.data.city,
    recommendations: today.data.recommendations, noWeather: today.data.noWeather
  })
  today.saveTemperature({ detail: { value: 23 } })
  record('change-indoor-temperature-without-weather', {
    indoorTemp: today.data.indoorTemp, recommendations: today.data.recommendations
  })
  const manual = page('manual-weather')
  manual.onLoad()
  manual.submit()
  await today.loadData()
  record('manual-defaults-produce-results', {
    enteredByUser: false, indoorTemp: today.data.indoorTemp,
    outdoorTemp: today.data.weather.currentTemp, source: today.data.weather.source,
    results: Object.fromEntries(Object.entries(today.data.recommendations).map(([key, value]) => [key, value.result]))
  })
  today.adjust({ detail: { scene: 'indoor', delta: -1 } })
  const adjusted = today.data.recommendations.indoor.result
  today.confirmGood({ detail: { scene: 'indoor' } })
  record('confirm-good-after-adjustment', {
    beforeConfirm: adjusted, afterConfirm: today.data.recommendations.indoor.result,
    adjustment: today.data.adjustments.indoor, feedback: calls.at(-1)
  })
  today.adjust({ detail: { scene: 'indoor', delta: -1 } })
  const beforeReturn = today.data.recommendations.indoor.result
  today.onShow()
  record('return-to-today-after-adjustment', {
    beforeReturn, afterReturn: today.data.recommendations.indoor.result,
    adjustment: today.data.adjustments.indoor
  })
  record('manual-weather-persistence', {
    storedFields: Object.keys(storage.getManualWeather()),
    storedData: storage.getManualWeather()
  })
  storage.clearAll()
  storage.setInitialized(true)
  storage.saveCity({ name: '杭州', code: '330100' })
  const offline = page('today')
  await offline.loadData()
  record('offline-selected-city-no-cache', {
    recommendations: offline.data.recommendations,
    indoorTemp: offline.data.indoorTemp, feedback: calls.at(-1)
  })
  storage.saveWeatherCache({ cityName: '杭州', currentTemp: 21, weatherType: ['cloudy'], source: 'api', updateTime: Date.now() - 86400000 })
  const stale = page('today')
  await stale.loadData()
  record('offline-one-day-old-cache', {
    recommendationsAvailable: !!stale.data.recommendations, staleText: stale.data.staleText
  })
  const goods = page('goods')
  goods.onLoad()
  const clothingCount = goods.data.groupedGoods.reduce((sum, group) => sum + group.count, 0)
  goods.chooseCategory({ currentTarget: { dataset: { value: 'sleep' } } })
  record('goods-navigation', {
    clothingCount, sleepCount: goods.data.groupedGoods.reduce((sum, group) => sum + group.count, 0),
    sleepGroups: goods.data.groupedGoods.map(group => group.label)
  })
  record('share-entry', { today: today.onShareAppMessage(), goods: goods.onShareAppMessage() })
  const report = {
    method: 'Execute existing page handlers with isolated in-memory wx storage and simulated network failure. No real WeChat UI, no real latency, no real sharing, no external requests.',
    createdAt: new Date().toISOString(), records
  }
  fs.writeFileSync(path.join(__dirname, 'evidence.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
