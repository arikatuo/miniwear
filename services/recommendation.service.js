const { recommendRules, iconByLevel } = require('../config/recommend.rules')

const SCENE_NAMES = {
  indoor: '在家',
  outdoor: '出门',
  sleep: '睡觉'
}

function clampLevel(level) {
  return Math.max(1, Math.min(6, level))
}

function findBaseRule(scene, temperature) {
  const rules = recommendRules[scene]
  if (!rules) throw new Error(`Unknown scene: ${scene}`)
  const temp = Number.isFinite(Number(temperature)) ? Number(temperature) : 24
  return rules.find((rule) => {
    const aboveMin = rule.min === undefined || temp >= rule.min
    const belowMax = rule.max === undefined || temp <= rule.max
    return aboveMin && belowMax
  }) || rules[rules.length - 1]
}

function getWeatherModifier(scene, weatherTypes) {
  if (scene !== 'outdoor') return 0
  const types = Array.isArray(weatherTypes) ? weatherTypes : []
  if (types.includes('hot')) return -1
  if (types.some((type) => ['rain', 'wind', 'cold'].includes(type))) return 1
  return 0
}

function getProfileModifier(scene, profile = {}) {
  let modifier = 0
  const ageModifiers = recommendRules.ageModifiers[profile.ageGroup] || recommendRules.ageModifiers.baby_6_12m
  modifier += ageModifiers[scene] || 0
  if (profile.bodyType === 'hot') modifier -= 1
  if (profile.bodyType === 'cold') modifier += 1
  if (scene === 'sleep' && profile.easySweat === 'yes') modifier -= 1
  return modifier
}

function buildReason(baseRule, scene, weatherTypes, profile) {
  const additions = []
  if (scene === 'outdoor' && weatherTypes.includes('rain')) additions.push('有雨时注意防淋')
  if (scene === 'outdoor' && weatherTypes.includes('wind')) additions.push('有风时注意挡风')
  if (scene === 'outdoor' && weatherTypes.includes('hot')) additions.push('天气偏热时注意透气和防晒')
  if (profile.easySweat === 'yes') additions.push('宝宝容易出汗，请避免盖穿过厚')
  return [baseRule.reason, ...additions].join('；')
}

function resultFor(scene, level) {
  return recommendRules.resultByLevel[scene][level]
}

function iconFor(scene, level) {
  const group = scene === 'sleep' ? 'sleep' : 'wear'
  return iconByLevel[group][level]
}

function buildRecommendation({ scene, temperature, profile = {}, weatherTypes = [], adjustment = 0 }) {
  const baseRule = findBaseRule(scene, temperature)
  const rawLevel = baseRule.level
    + getProfileModifier(scene, profile)
    + getWeatherModifier(scene, weatherTypes)
    + adjustment
  const level = clampLevel(rawLevel)
  return {
    scene,
    sceneName: SCENE_NAMES[scene],
    temperature: Number(temperature),
    level,
    baseLevel: baseRule.level,
    adjustment,
    result: resultFor(scene, level),
    icon: iconFor(scene, level),
    reason: buildReason(baseRule, scene, weatherTypes, profile),
    hotAction: level === 1 ? '保持轻薄并改善通风，及时擦干汗液。' : '换薄款或少穿一层，并观察后颈和出汗。',
    coldAction: level === 6 ? '优先改善环境温度，并持续观察宝宝状态。' : '加薄背心、袜子或轻便外层，再观察体感。',
    ageText: recommendRules.ageText[profile.ageGroup || 'baby_6_12m'],
    atBoundary: rawLevel !== level,
    boundaryMessage: rawLevel < 1
      ? '已经是当前温度下较轻薄的建议。'
      : rawLevel > 6
        ? '已经是当前温度下较保暖的建议。'
        : ''
  }
}

function adjustRecommendation(recommendation, delta) {
  return buildRecommendation({
    scene: recommendation.scene,
    temperature: recommendation.temperature,
    profile: {
      ageGroup: 'baby_6_12m',
      bodyType: 'unknown',
      easySweat: 'unknown'
    },
    weatherTypes: [],
    adjustment: recommendation.level - recommendation.baseLevel + delta
  })
}

function buildAllRecommendations({ indoorTemp, outdoorTemp, profile, weatherTypes = [], adjustments = {} }) {
  return {
    indoor: buildRecommendation({ scene: 'indoor', temperature: indoorTemp, profile, weatherTypes, adjustment: adjustments.indoor || 0 }),
    outdoor: buildRecommendation({ scene: 'outdoor', temperature: outdoorTemp, profile, weatherTypes, adjustment: adjustments.outdoor || 0 }),
    sleep: buildRecommendation({ scene: 'sleep', temperature: indoorTemp, profile, weatherTypes, adjustment: adjustments.sleep || 0 })
  }
}

module.exports = {
  SCENE_NAMES,
  buildRecommendation,
  buildAllRecommendations,
  adjustRecommendation
}
