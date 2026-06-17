const storage = require('./storage.service')
const { TENCENT_MAP_KEY, REQUEST_TIMEOUT_MS } = require('../config/weather.config')
const { clampTemperature } = require('../utils/validators')

function mapWeatherType(text = '') {
  const types = []
  if (/雨|雪/.test(text)) types.push('rain')
  if (/风/.test(text)) types.push('wind')
  if (/热|高温/.test(text)) types.push('hot')
  if (/冷|低温|寒/.test(text)) types.push('cold')
  if (!types.length) {
    if (/晴/.test(text)) types.push('sunny')
    else types.push('cloudy')
  }
  return types
}

function request(options) {
  return new Promise((resolve, reject) => {
    let settled = false
    const task = wx.request({
      ...options,
      success: (value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(value)
      },
      fail: (error) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(error)
      }
    })
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      if (task && task.abort) task.abort()
      reject(new Error('WEATHER_TIMEOUT'))
    }, REQUEST_TIMEOUT_MS)
  })
}

function normalizeTencentWeather(nowData, futureData, city, updateTime = Date.now()) {
  const realtimeGroup = nowData && nowData.result && nowData.result.realtime
  const realtime = Array.isArray(realtimeGroup) && realtimeGroup[0] && realtimeGroup[0].infos
  const forecastGroup = futureData && futureData.result && futureData.result.forecast
  const forecastInfos = Array.isArray(forecastGroup) && forecastGroup[0] && forecastGroup[0].infos
  const forecast = Array.isArray(forecastInfos) ? forecastInfos[0] : null
  if (!realtime || realtime.temperature === undefined) throw new Error('WEATHER_DATA_INVALID')
  const weatherText = realtime.weather || '天气'
  const currentTemp = clampTemperature(realtime.temperature, 24)
  const dayTemp = forecast && forecast.day ? Number(forecast.day.temperature) : currentTemp
  const nightTemp = forecast && forecast.night ? Number(forecast.night.temperature) : currentTemp
  return {
    cityName: city.name,
    currentTemp,
    minTemp: clampTemperature(Math.min(dayTemp, nightTemp), currentTemp),
    maxTemp: clampTemperature(Math.max(dayTemp, nightTemp), currentTemp),
    weatherText,
    weatherType: mapWeatherType(weatherText),
    updateTime,
    source: 'api'
  }
}

async function fetchWeather(city) {
  if (!TENCENT_MAP_KEY) throw new Error('WEATHER_KEY_MISSING')
  const baseOptions = {
    url: 'https://apis.map.qq.com/ws/weather/v1/',
    method: 'GET'
  }
  const [nowResponse, futureResponse] = await Promise.all([
    request({ ...baseOptions, data: { key: TENCENT_MAP_KEY, adcode: city.code, type: 'now' } }),
    request({ ...baseOptions, data: { key: TENCENT_MAP_KEY, adcode: city.code, type: 'future' } })
  ])
  const responses = [nowResponse, futureResponse]
  if (responses.some((response) => response.statusCode !== 200 || !response.data || response.data.status !== 0)) {
    throw new Error('WEATHER_REQUEST_FAILED')
  }
  return normalizeTencentWeather(nowResponse.data, futureResponse.data, city)
}

function fromManualWeather(manual, city) {
  return {
    cityName: city ? city.name : '手动模式',
    currentTemp: clampTemperature(manual.outdoorTemp, 24),
    minTemp: clampTemperature(manual.outdoorTemp, 24),
    maxTemp: clampTemperature(manual.outdoorTemp, 24),
    weatherText: '手动填写',
    weatherType: Array.isArray(manual.weatherType) ? manual.weatherType : [],
    updateTime: Date.now(),
    source: 'manual'
  }
}

function isCacheForCity(cache, city) {
  return Boolean(cache && city && cache.cityName === city.name)
}

function canUseWeatherCache(cache, city, now = Date.now()) {
  return isCacheForCity(cache, city) && storage.isWeatherCacheFresh(cache, now)
}

async function getWeather(city, { forceRefresh = false } = {}) {
  const cache = storage.getWeatherCache()
  if (!forceRefresh && canUseWeatherCache(cache, city)) {
    return { weather: cache, stale: false }
  }
  try {
    const weather = await fetchWeather(city)
    storage.saveWeatherCache(weather)
    return { weather, stale: false }
  } catch (error) {
    if (isCacheForCity(cache, city)) return { weather: cache, stale: true, error }
    throw error
  }
}

module.exports = {
  mapWeatherType,
  normalizeTencentWeather,
  fetchWeather,
  fromManualWeather,
  isCacheForCity,
  canUseWeatherCache,
  getWeather
}
