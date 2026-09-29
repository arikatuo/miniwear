function minutesAgo(timestamp, now = Date.now()) {
  if (!Number.isFinite(timestamp)) return 0
  return Math.max(0, Math.round((now - timestamp) / 60000))
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

module.exports = { minutesAgo, formatTime }
