function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function clampTemperature(value, fallback = 24) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < -50 || number > 60) return fallback
  return Math.round(number)
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

module.exports = { isFiniteNumber, clampTemperature, oneOf }
