const { STORAGE_KEYS } = require('../constants/storage')
const { getAgeGroup } = require('../utils/age')
const { clampTemperature, oneOf } = require('../utils/validators')

const CURRENT_STORAGE_VERSION = '1.0.0'
const CACHE_TTL_MS = 30 * 60 * 1000

const defaults = {
  appState: { storageVersion: CURRENT_STORAGE_VERSION, appInit: false },
  babyProfile: { birthday: '', ageGroup: 'baby_6_12m', bodyType: 'unknown', easySweat: 'unknown' },
  environment: { indoorTemp: 24 }
}

function wxAdapter() {
  return {
    get(key) {
      try { return wx.getStorageSync(key) } catch (error) { return undefined }
    },
    set(key, value) { wx.setStorageSync(key, value) },
    remove(key) { wx.removeStorageSync(key) },
    keys() {
      try { return wx.getStorageInfoSync().keys || [] } catch (error) { return [] }
    }
  }
}

function validCity(city) {
  return city && typeof city.name === 'string' && city.name.trim()
    ? { ...city, name: city.name.trim() }
    : null
}

function normalizeProfile(profile = {}) {
  const birthday = typeof profile.birthday === 'string' ? profile.birthday : ''
  return {
    birthday,
    ageGroup: getAgeGroup(birthday),
    bodyType: oneOf(profile.bodyType, ['hot', 'cold', 'unknown'], 'unknown'),
    easySweat: oneOf(profile.easySweat, ['yes', 'no', 'unknown'], 'unknown')
  }
}

function createStorageService(adapter) {
  const read = (key) => adapter.get(key)
  const write = (key, value) => {
    adapter.set(key, value)
    return value
  }

  const service = {
    initialize() {
      try {
        const rawState = read(STORAGE_KEYS.APP_STATE)
        const appState = {
          storageVersion: CURRENT_STORAGE_VERSION,
          appInit: Boolean(rawState && rawState.appInit)
        }
        write(STORAGE_KEYS.APP_STATE, appState)
        write(STORAGE_KEYS.BABY_PROFILE, normalizeProfile(read(STORAGE_KEYS.BABY_PROFILE)))
        const environment = read(STORAGE_KEYS.ENVIRONMENT) || {}
        write(STORAGE_KEYS.ENVIRONMENT, { indoorTemp: clampTemperature(environment.indoorTemp, 24) })
        if (!Array.isArray(read(STORAGE_KEYS.RECENT_CITIES))) write(STORAGE_KEYS.RECENT_CITIES, [])
        return {
          ...appState,
          babyProfile: service.getBabyProfile(),
          environment: service.getEnvironment()
        }
      } catch (error) {
        service.clearAll()
        return {
          ...defaults.appState,
          babyProfile: { ...defaults.babyProfile },
          environment: { ...defaults.environment }
        }
      }
    },

    getAppState() {
      return read(STORAGE_KEYS.APP_STATE) || { ...defaults.appState }
    },

    setInitialized(value = true) {
      return write(STORAGE_KEYS.APP_STATE, {
        storageVersion: CURRENT_STORAGE_VERSION,
        appInit: Boolean(value)
      })
    },

    getCity() {
      return validCity(read(STORAGE_KEYS.CITY))
    },

    saveCity(city) {
      const normalized = validCity(city)
      if (!normalized) return null
      write(STORAGE_KEYS.CITY, normalized)
      const recent = [normalized, ...service.getRecentCities().filter((item) => item.name !== normalized.name)].slice(0, 3)
      write(STORAGE_KEYS.RECENT_CITIES, recent)
      return normalized
    },

    getRecentCities() {
      const value = read(STORAGE_KEYS.RECENT_CITIES)
      return Array.isArray(value) ? value.map(validCity).filter(Boolean).slice(0, 3) : []
    },

    getBabyProfile() {
      return normalizeProfile(read(STORAGE_KEYS.BABY_PROFILE))
    },

    saveBabyProfile(profile) {
      return write(STORAGE_KEYS.BABY_PROFILE, normalizeProfile(profile))
    },

    getEnvironment() {
      const value = read(STORAGE_KEYS.ENVIRONMENT) || {}
      return { indoorTemp: clampTemperature(value.indoorTemp, 24) }
    },

    saveEnvironment(environment) {
      return write(STORAGE_KEYS.ENVIRONMENT, {
        indoorTemp: clampTemperature(environment && environment.indoorTemp, 24)
      })
    },

    getWeatherCache() {
      const value = read(STORAGE_KEYS.WEATHER_CACHE)
      return value && Number.isFinite(value.updateTime) ? value : null
    },

    saveWeatherCache(weather) {
      return write(STORAGE_KEYS.WEATHER_CACHE, { ...weather, updateTime: weather.updateTime || Date.now() })
    },

    getManualWeather() {
      return read(STORAGE_KEYS.MANUAL_WEATHER) || null
    },

    saveManualWeather(weather) {
      return write(STORAGE_KEYS.MANUAL_WEATHER, weather)
    },

    clearAll() {
      adapter.keys().filter((key) => key.startsWith('bbc_')).forEach((key) => adapter.remove(key))
      write(STORAGE_KEYS.APP_STATE, { ...defaults.appState })
      write(STORAGE_KEYS.BABY_PROFILE, { ...defaults.babyProfile })
      write(STORAGE_KEYS.ENVIRONMENT, { ...defaults.environment })
      write(STORAGE_KEYS.RECENT_CITIES, [])
    }
  }
  return service
}

function isWeatherCacheFresh(cache, now = Date.now()) {
  return Boolean(cache && Number.isFinite(cache.updateTime) && now - cache.updateTime <= CACHE_TTL_MS)
}

const storage = typeof wx !== 'undefined' ? createStorageService(wxAdapter()) : null

module.exports = {
  CURRENT_STORAGE_VERSION,
  CACHE_TTL_MS,
  createStorageService,
  isWeatherCacheFresh,
  initialize: (...args) => storage && storage.initialize(...args),
  getAppState: (...args) => storage && storage.getAppState(...args),
  setInitialized: (...args) => storage && storage.setInitialized(...args),
  getCity: (...args) => storage && storage.getCity(...args),
  saveCity: (...args) => storage && storage.saveCity(...args),
  getRecentCities: (...args) => storage && storage.getRecentCities(...args),
  getBabyProfile: (...args) => storage && storage.getBabyProfile(...args),
  saveBabyProfile: (...args) => storage && storage.saveBabyProfile(...args),
  getEnvironment: (...args) => storage && storage.getEnvironment(...args),
  saveEnvironment: (...args) => storage && storage.saveEnvironment(...args),
  getWeatherCache: (...args) => storage && storage.getWeatherCache(...args),
  saveWeatherCache: (...args) => storage && storage.saveWeatherCache(...args),
  getManualWeather: (...args) => storage && storage.getManualWeather(...args),
  saveManualWeather: (...args) => storage && storage.saveManualWeather(...args),
  clearAll: (...args) => storage && storage.clearAll(...args)
}
