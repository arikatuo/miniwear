const VERSION = 1
const SCENES = ['indoor', 'outdoor', 'sleep']
const MAX_AGE_MS = 48 * 60 * 60 * 1000
const MAX_ENCODED_LENGTH = 1200

function todayDate(now = Date.now()) {
  const date = new Date(now)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isText(value, max) { return typeof value === 'string' && value.length > 0 && value.length <= max }

function createSnapshot({ scene, weather, indoorTemp, recommendation, adjustment = 0, ageGroup = 'baby_6_12m', now = Date.now() }) {
  return {
    v: VERSION,
    ageGroup,
    scene,
    date: todayDate(now),
    createdAt: now,
    outdoorTemp: scene === 'outdoor' ? weather.currentTemp : null,
    indoorTemp,
    source: scene !== 'outdoor' ? 'indoor' : weather.source === 'manual' ? 'manual' : 'api',
    weatherText: scene === 'outdoor' ? String(weather.weatherText || '手动温度').slice(0, 20) : '室温填写',
    result: String(recommendation.result || '').slice(0, 80),
    adjustment: Number.isFinite(adjustment) ? adjustment : 0
  }
}

function validateSnapshot(snapshot, now = Date.now()) {
  if (!snapshot || snapshot.v !== VERSION || !SCENES.includes(snapshot.scene)) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.date) || !Number.isFinite(snapshot.createdAt) || todayDate(snapshot.createdAt) !== snapshot.date || now - snapshot.createdAt > MAX_AGE_MS || snapshot.createdAt > now + 5 * 60 * 1000) return null
  if ((snapshot.scene === 'outdoor' ? !Number.isFinite(snapshot.outdoorTemp) || snapshot.outdoorTemp < -30 || snapshot.outdoorTemp > 45 : snapshot.outdoorTemp !== null) || ![snapshot.indoorTemp, snapshot.adjustment].every(Number.isFinite) || snapshot.indoorTemp < 5 || snapshot.indoorTemp > 40 || Math.abs(snapshot.adjustment) > 3) return null
  if (!['baby_0_6m', 'baby_6_12m', 'baby_1_3y', 'fallback_3y_plus'].includes(snapshot.ageGroup)) return null
  if (!(snapshot.scene === 'outdoor' ? ['api', 'manual'].includes(snapshot.source) : snapshot.source === 'indoor') || !isText(snapshot.weatherText, 20) || !isText(snapshot.result, 80)) return null
  return { v: snapshot.v, ageGroup: snapshot.ageGroup, scene: snapshot.scene, date: snapshot.date, createdAt: snapshot.createdAt, outdoorTemp: snapshot.outdoorTemp, indoorTemp: snapshot.indoorTemp, source: snapshot.source, weatherText: snapshot.weatherText, result: snapshot.result, adjustment: snapshot.adjustment }
}

function encodeSnapshot(snapshot) { return encodeURIComponent(JSON.stringify(snapshot)) }
function decodeSnapshot(value, now) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_ENCODED_LENGTH) return null
  try { return validateSnapshot(JSON.parse(decodeURIComponent(value)), now) } catch (error) { return null }
}

module.exports = { VERSION, MAX_AGE_MS, MAX_ENCODED_LENGTH, createSnapshot, validateSnapshot, encodeSnapshot, decodeSnapshot, todayDate }
