const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createStorageService,
  CURRENT_STORAGE_VERSION,
  isWeatherCacheFresh,
  isManualWeatherFresh
} = require('../services/storage.service')

function memoryAdapter(seed = {}) {
  const data = { ...seed }
  return {
    get(key) { return data[key] },
    set(key, value) { data[key] = value },
    remove(key) { delete data[key] },
    keys() { return Object.keys(data) },
    snapshot() { return data }
  }
}

test('首次初始化写入版本和默认环境', () => {
  const adapter = memoryAdapter()
  const service = createStorageService(adapter)
  const state = service.initialize()
  assert.equal(state.storageVersion, CURRENT_STORAGE_VERSION)
  assert.equal(state.environment.indoorTemp, 24)
})

test('损坏字段使用单字段默认值兜底', () => {
  const adapter = memoryAdapter({
    bbc_app_state: { storageVersion: CURRENT_STORAGE_VERSION, appInit: true },
    bbc_environment: { indoorTemp: '很热' }
  })
  const service = createStorageService(adapter)
  service.initialize()
  assert.equal(service.getEnvironment().indoorTemp, 24)
})

test('旧版本缓存迁移后保留可识别数据并更新版本', () => {
  const adapter = memoryAdapter({
    bbc_app_state: { storageVersion: '0.9.0', appInit: true },
    bbc_environment: { indoorTemp: 26 },
    bbc_baby_profile: { birthday: '', bodyType: 'hot', easySweat: 'yes' }
  })
  const service = createStorageService(adapter)
  const state = service.initialize()
  assert.equal(state.storageVersion, CURRENT_STORAGE_VERSION)
  assert.equal(state.appInit, true)
  assert.equal(service.getEnvironment().indoorTemp, 26)
  assert.equal(service.getBabyProfile().bodyType, 'hot')
})

test('无版本的旧缓存按已知字段迁移', () => {
  const adapter = memoryAdapter({
    bbc_environment: { indoorTemp: 22 },
    bbc_city: { name: '杭州', code: '330100' }
  })
  const service = createStorageService(adapter)
  service.initialize()
  assert.equal(service.getEnvironment().indoorTemp, 22)
  assert.equal(service.getCity().name, '杭州')
  assert.equal(service.getAppState().storageVersion, CURRENT_STORAGE_VERSION)
})

test('迁移读取异常时清空重建默认状态', () => {
  const data = {
    bbc_app_state: { storageVersion: '0.1.0', appInit: true },
    bbc_environment: { indoorTemp: 26 }
  }
  let failed = false
  const adapter = {
    get(key) {
      if (key === 'bbc_environment' && !failed) {
        failed = true
        throw new Error('corrupt')
      }
      return data[key]
    },
    set(key, value) { data[key] = value },
    remove(key) { delete data[key] },
    keys() { return Object.keys(data) }
  }
  const service = createStorageService(adapter)
  const state = service.initialize()
  assert.equal(state.appInit, false)
  assert.equal(service.getEnvironment().indoorTemp, 24)
})

test('最近城市去重并最多保留三个', () => {
  const service = createStorageService(memoryAdapter())
  service.initialize()
  ;['杭州', '上海', '北京', '杭州'].forEach((name, index) => {
    service.saveCity({ name, code: String(index) })
  })
  assert.deepEqual(service.getRecentCities().map((item) => item.name), ['杭州', '北京', '上海'])
})

test('天气缓存 30 分钟内有效', () => {
  const now = 1_800_000
  assert.equal(isWeatherCacheFresh({ updateTime: now - 29 * 60 * 1000 }, now), true)
  assert.equal(isWeatherCacheFresh({ updateTime: now - 31 * 60 * 1000 }, now), false)
})

test('手动天气在有效期内保持为明确的用户选择，过期后标为较早记录', () => {
  const now = 1_800_000
  assert.equal(isManualWeatherFresh({ updateTime: now - 11 * 60 * 60 * 1000 }, now), true)
  assert.equal(isManualWeatherFresh({ updateTime: now - 13 * 60 * 60 * 1000 }, now), false)
})

test('手动来源只能由显式恢复操作移除，且保留原始填写时间', () => {
  const service = createStorageService(memoryAdapter())
  service.initialize()
  service.saveManualWeather({ outdoorTemp: 30, updateTime: 123 })
  assert.equal(service.getManualWeather().updateTime, 123)
  assert.equal(service.getManualWeather().outdoorTemp, 30)
  service.removeManualWeather()
  assert.equal(service.getManualWeather(), null)
})

test('首次确认的年龄段会保存，生日存在时生日优先', () => {
  const service = createStorageService(memoryAdapter())
  service.initialize()
  service.saveBabyProfile({ ageGroup: 'baby_1_3y' })
  assert.equal(service.getBabyProfile().ageGroup, 'baby_1_3y')
  service.saveBabyProfile({ birthday: '2026-08-01', ageGroup: 'baby_1_3y' })
  assert.equal(service.getBabyProfile().ageGroup, 'baby_0_6m')
})

test('本地存储不保留已移除的推荐用品焦点 API', () => {
  const service = createStorageService(memoryAdapter())
  service.initialize()

  assert.equal(service.getGoodsFocus, undefined)
  assert.equal(service.saveGoodsFocus, undefined)
})

test('清除数据后只保留新版本初始化状态', () => {
  const adapter = memoryAdapter()
  const service = createStorageService(adapter)
  service.initialize()
  service.saveCity({ name: '杭州', code: '330100' })
  service.clearAll()
  assert.equal(service.getCity(), null)
  assert.equal(service.getAppState().storageVersion, CURRENT_STORAGE_VERSION)
  assert.equal(service.getAppState().appInit, false)
})
