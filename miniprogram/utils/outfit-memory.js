const SCENES = ['indoor', 'outdoor', 'sleep']

function signature(scene, indoorTemp, weather, profile, now = Date.now()) {
  const date = new Date(now)
  return JSON.stringify({
    day: [date.getFullYear(), date.getMonth(), date.getDate()],
    temperature: scene === 'outdoor' ? weather.currentTemp : indoorTemp,
    source: scene === 'outdoor' ? weather.source : 'indoor',
    weather: scene === 'outdoor' ? [...(weather.weatherType || [])].sort() : [],
    age: profile.ageGroup, confirmed: profile.ageConfirmed,
    body: profile.bodyType, sweat: profile.easySweat
  })
}

function restoreScenes(saved, signatures, now = Date.now()) {
  const adjustments = { indoor: 0, outdoor: 0, sleep: 0 }
  const adoptedScenes = {}
  const adjustmentLabels = { indoor: '', outdoor: '', sleep: '' }
  const scenes = {}
  let changed = false
  SCENES.forEach((scene) => {
    const entry = saved && saved.scenes && saved.scenes[scene]
    if (!entry) return
    if (entry.signature !== signatures[scene] || !Number.isFinite(entry.savedAt) || now < entry.savedAt || now - entry.savedAt > 86400000) { changed = true; return }
    scenes[scene] = entry
    adjustments[scene] = Number.isInteger(entry.adjustment) && Math.abs(entry.adjustment) <= 5 ? entry.adjustment : 0
    adoptedScenes[scene] = Boolean(entry.adopted)
    adjustmentLabels[scene] = entry.adopted ? '已记下这套搭配' : adjustments[scene] ? '已调整，尚未记下' : ''
  })
  return { adjustments, adoptedScenes, adjustmentLabels, scenes, changed }
}

module.exports = { SCENES, signature, restoreScenes }
