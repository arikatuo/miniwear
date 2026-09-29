const test = require('node:test')
const assert = require('node:assert/strict')
const { signature, restoreScenes } = require('../miniprogram/utils/outfit-memory')
const { createSnapshot, encodeSnapshot, decodeSnapshot } = require('../miniprogram/utils/share-snapshot')
const { outfitGoods } = require('../miniprogram/utils/outfit-goods')
const profile = { ageGroup: 'baby_6_12m', ageConfirmed: true, bodyType: 'unknown', easySweat: 'unknown' }
const weather = { currentTemp: 22, source: 'manual', weatherType: [] }
const now = new Date(2026, 8, 21, 10).getTime()
function signatures(temp = 24, outside = weather, baby = profile, time = now) {
  return Object.fromEntries(['indoor', 'outdoor', 'sleep'].map(scene => [scene, signature(scene, temp, outside, baby, time)]))
}
function saved() {
  const keys = signatures()
  return { scenes: Object.fromEntries(Object.keys(keys).map(scene => [scene, { signature: keys[scene], adjustment: -1, adopted: true, savedAt: now }])) }
}

test('室外变化只使出门记录失效，室内调整与采纳仍保留', () => {
  const result = restoreScenes(saved(), signatures(24, { ...weather, currentTemp: 30 }), now)
  assert.deepEqual(result.adjustments, { indoor: -1, outdoor: 0, sleep: -1 })
  assert.equal(result.adoptedScenes.outdoor, undefined)
  assert.equal(result.adoptedScenes.sleep, true)
})
test('室温变化不影响出门；跨日和体质变化使相关旧建议失效', () => {
  assert.equal(restoreScenes(saved(), signatures(26), now).adoptedScenes.outdoor, true)
  assert.deepEqual(restoreScenes(saved(), signatures(24, weather, profile, now + 86400000), now + 86400000).adoptedScenes, {})
  assert.deepEqual(restoreScenes(saved(), signatures(24, weather, { ...profile, bodyType: 'hot' }), now).adoptedScenes, {})
})
test('室内分享不依赖城市或室外温度，并保留年龄段和实际结果', () => {
  const snapshot = createSnapshot({ scene: 'sleep', weather: { currentTemp: null, source: 'example' }, indoorTemp: 24, recommendation: { result: '薄睡袋 / 4 层纱布睡袋' }, ageGroup: 'baby_1_3y', now })
  assert.deepEqual(decodeSnapshot(encodeSnapshot(snapshot), now), snapshot)
  assert.equal(snapshot.source, 'indoor')
  assert.equal(snapshot.outdoorTemp, null)
})
test('衣物图例覆盖三个场景全部档位，睡觉标准档对应现有纱布睡袋', () => {
  for (const scene of ['indoor', 'outdoor', 'sleep']) for (let level = 1; level <= 6; level++) assert.ok(outfitGoods(scene, level).length > 0)
  assert.equal(outfitGoods('sleep', 3)[0].id, 'four_layer_gauze_sleeping_bag')
})

test('冷天出门图例对应完整上下装，且不把历史夹棉规格重复展示', () => {
  const coldOutdoor = outfitGoods('outdoor', 6).map((item) => item.id)
  assert.deepEqual(coldOutdoor, ['long_sleeve_tshirt', 'padded_jacket', 'fleece_long_pants'])
  assert.equal(outfitGoods('indoor', 6)[0].id, 'padded_romper')
  assert.deepEqual(outfitGoods('sleep', 6).map((item) => item.id), ['padded_romper', 'medium_padded_sleeping_bag'])
})

function pageHarness(path) {
  const values = {}
  global.wx = { getStorageSync: k => values[k], setStorageSync: (k,v) => { values[k] = v }, removeStorageSync: k => { delete values[k] }, getStorageInfoSync: () => ({ keys: Object.keys(values) }), showToast: () => {}, switchTab: () => {} }
  let page
  global.Page = p => { page = p }
  delete require.cache[require.resolve(path)]
  require(path)
  const context = { ...page, data: structuredClone(page.data), setData(patch, callback) {
    for (const [key, value] of Object.entries(patch)) {
      const keys = key.split('.'); let target = this.data
      for (const part of keys.slice(0, -1)) target = target[part] || (target[part] = {})
      target[keys.at(-1)] = value
    }
    if (callback) callback()
  } }
  return { context, storage: require('../miniprogram/services/storage.service') }
}
test('首次选睡觉会持久化所选场景，出门留空不能变成零度', () => {
  const { context, storage } = pageHarness('../miniprogram/pages/onboarding/index')
  context.onLoad()
  context.selectAgeGroup({ currentTarget: { dataset: { value: 'baby_1_3y' } } })
  context.selectScene({ currentTarget: { dataset: { value: 'outdoor' } } })
  context.finish()
  assert.equal(storage.getAppState().appInit, false)
  context.selectScene({ currentTarget: { dataset: { value: 'sleep' } } })
  context.finish()
  assert.equal(storage.getLastOutcome().scene, 'sleep')
  assert.equal(storage.getBabyProfile().ageGroup, 'baby_1_3y')
  assert.ok(storage.getEnvironment().confirmedAt)
})
test('调整后取消旧采纳；恢复推荐会持久化且回访不恢复旧调整', () => {
  const { context, storage } = pageHarness('../miniprogram/pages/today/index')
  context.data.profile = profile; context.data.weather = weather; context.data.environmentConfirmed = true
  context.rebuildRecommendations()
  context.adjust({ detail: { scene: 'indoor', delta: -1 } })
  context.confirmGood({ detail: { scene: 'indoor' } })
  assert.equal(storage.getLastOutcome().scenes.indoor.adopted, true)
  context.adjust({ detail: { scene: 'indoor', delta: 1 } })
  assert.equal(storage.getLastOutcome().scenes.indoor.adopted, false)
  context.adjust({ detail: { scene: 'indoor', delta: -1 } })
  context.resetScene()
  context.restoreSavedState(weather)
  assert.equal(context.data.adjustments.indoor, 0)
  assert.equal(context.data.adoptedScenes.indoor, false)
})
