const test = require('node:test')
const assert = require('node:assert/strict')
const {
  buildRecommendation,
  buildAllRecommendations,
  adjustRecommendation
} = require('../services/recommendation.service')

const profile = {
  ageGroup: 'baby_6_12m',
  bodyType: 'unknown',
  easySweat: 'unknown'
}

test('在家 24℃ 推荐长袖包屁衣和薄裤', () => {
  const result = buildRecommendation({
    scene: 'indoor',
    temperature: 24,
    profile,
    weatherTypes: []
  })
  assert.equal(result.result, '长袖包屁衣 + 薄裤')
  assert.equal(result.level, 3)
})

test('怕热时建议降低一档', () => {
  const result = buildRecommendation({
    scene: 'indoor',
    temperature: 24,
    profile: { ...profile, bodyType: 'hot' },
    weatherTypes: []
  })
  assert.equal(result.level, 2)
})

test('容易出汗只让睡觉建议偏薄', () => {
  const sleep = buildRecommendation({
    scene: 'sleep',
    temperature: 24,
    profile: { ...profile, easySweat: 'yes' },
    weatherTypes: []
  })
  const indoor = buildRecommendation({
    scene: 'indoor',
    temperature: 24,
    profile: { ...profile, easySweat: 'yes' },
    weatherTypes: []
  })
  assert.equal(sleep.level, 2)
  assert.equal(indoor.level, 3)
})

test('0-6 个月在家和出门轻微偏保守但睡觉不额外加厚', () => {
  const babyProfile = { ...profile, ageGroup: 'baby_0_6m' }
  const indoor = buildRecommendation({
    scene: 'indoor',
    temperature: 24,
    profile: babyProfile,
    weatherTypes: []
  })
  const sleep = buildRecommendation({
    scene: 'sleep',
    temperature: 24,
    profile: babyProfile,
    weatherTypes: []
  })
  assert.equal(indoor.level, 4)
  assert.equal(sleep.level, 3)
})

test('1-3 岁在家和出门可略轻且睡觉保持基准', () => {
  const activeProfile = { ...profile, ageGroup: 'baby_1_3y' }
  const outdoor = buildRecommendation({
    scene: 'outdoor',
    temperature: 22,
    profile: activeProfile,
    weatherTypes: []
  })
  const sleep = buildRecommendation({
    scene: 'sleep',
    temperature: 24,
    profile: activeProfile,
    weatherTypes: []
  })
  assert.equal(outdoor.level, 2)
  assert.equal(sleep.level, 3)
})

test('雨和风仅修正出门建议且最多合并一档', () => {
  const outdoor = buildRecommendation({
    scene: 'outdoor',
    temperature: 22,
    profile,
    weatherTypes: ['rain', 'wind']
  })
  const indoor = buildRecommendation({
    scene: 'indoor',
    temperature: 22,
    profile,
    weatherTypes: ['rain', 'wind']
  })
  assert.equal(outdoor.level, 4)
  assert.equal(indoor.level, 3)
})

test('最薄边界继续调薄时结果不变并返回边界提示', () => {
  const base = buildRecommendation({
    scene: 'indoor',
    temperature: 30,
    profile,
    weatherTypes: []
  })
  const adjusted = adjustRecommendation(base, -1)
  assert.equal(adjusted.level, 1)
  assert.equal(adjusted.atBoundary, true)
  assert.match(adjusted.boundaryMessage, /较轻薄/)
})

test('三场景结果均包含原因和冷热调整', () => {
  const results = buildAllRecommendations({
    indoorTemp: 24,
    outdoorTemp: 21,
    profile,
    weatherTypes: ['rain']
  })
  assert.deepEqual(Object.keys(results), ['indoor', 'outdoor', 'sleep'])
  Object.values(results).forEach((item) => {
    assert.ok(item.result)
    assert.ok(item.reason)
    assert.ok(item.hotAction)
    assert.ok(item.coldAction)
  })
})

test('每条推荐都带有对应厚度等级的配图，室内外共用穿衣组、睡觉用独立组', () => {
  const results = buildAllRecommendations({
    indoorTemp: 24,
    outdoorTemp: 21,
    profile,
    weatherTypes: []
  })
  assert.match(results.indoor.icon, /\/assets\/icons\/recommend\/wear-level-\d\.svg$/)
  assert.match(results.outdoor.icon, /\/assets\/icons\/recommend\/wear-level-\d\.svg$/)
  assert.match(results.sleep.icon, /\/assets\/icons\/recommend\/sleep-level-\d\.svg$/)
  assert.ok(results.indoor.icon.endsWith(`wear-level-${results.indoor.level}.svg`))
  assert.ok(results.sleep.icon.endsWith(`sleep-level-${results.sleep.level}.svg`))
})

test('调薄调厚之后配图会跟随新的等级变化', () => {
  const base = buildRecommendation({ scene: 'indoor', temperature: 24, profile, weatherTypes: [] })
  const thinner = adjustRecommendation(base, -1)
  const thicker = adjustRecommendation(base, 1)
  assert.notEqual(thinner.icon, base.icon)
  assert.notEqual(thicker.icon, base.icon)
  assert.ok(thinner.icon.endsWith(`wear-level-${thinner.level}.svg`))
  assert.ok(thicker.icon.endsWith(`wear-level-${thicker.level}.svg`))
})
