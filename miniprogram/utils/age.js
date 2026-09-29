function normalizeDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function getAgeInMonths(birthday, now = new Date()) {
  const birth = normalizeDate(birthday)
  if (!birth || birth > now) return null
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) months -= 1
  return Math.max(0, months)
}

function getAgeGroup(birthday, now = new Date()) {
  const months = getAgeInMonths(birthday, now)
  if (months === null) return 'baby_6_12m'
  if (months <= 6) return 'baby_0_6m'
  if (months <= 12) return 'baby_6_12m'
  if (months < 36) return 'baby_1_3y'
  return 'fallback_3y_plus'
}

function formatAge(birthday, now = new Date()) {
  const months = getAgeInMonths(birthday, now)
  if (months === null) return '默认按 6 个月处理'
  if (months < 12) return `${months} 个月`
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest ? `${years} 岁 ${rest} 个月` : `${years} 岁`
}

module.exports = { getAgeInMonths, getAgeGroup, formatAge }
