const storage = require('../../services/storage.service')
const weatherService = require('../../services/weather.service')
const { buildAllRecommendations } = require('../../services/recommendation.service')
const { minutesAgo } = require('../../utils/date')
const { formatAge } = require('../../utils/age')

Page({
  data: {
    city: null,
    weather: null,
    indoorTemp: 24,
    profile: null,
    ageText: '默认按 6 个月处理',
    recommendations: null,
    adjustmentLabels: { indoor: '', outdoor: '', sleep: '' },
    adjustments: { indoor: 0, outdoor: 0, sleep: 0 },
    loading: false,
    staleText: '',
    showTemperature: false,
    noWeather: false,
    activeScene: 'indoor',
    sceneList: [
      { value: 'indoor', label: '在家', icon: '/assets/icons/scene-home.svg' },
      { value: 'outdoor', label: '出门', icon: '/assets/icons/scene-outdoor.svg' },
      { value: 'sleep', label: '睡觉', icon: '/assets/icons/scene-sleep.svg' }
    ]
  },

  onShow() {
    storage.initialize()
    const state = storage.getAppState()
    if (!state.appInit) {
      wx.reLaunch({ url: '/pages/onboarding/index' })
      return
    }
    this.resetAdjustments()
    this.loadData()
  },

  resetAdjustments() {
    this.setData({
      adjustments: { indoor: 0, outdoor: 0, sleep: 0 },
      adjustmentLabels: { indoor: '', outdoor: '', sleep: '' }
    })
  },

  async loadData(forceRefresh = false) {
    const city = storage.getCity()
    const profile = storage.getBabyProfile()
    const indoorTemp = storage.getEnvironment().indoorTemp
    const manual = storage.getManualWeather()
    this.setData({
      city,
      profile,
      indoorTemp,
      ageText: formatAge(profile.birthday),
      loading: true,
      staleText: '',
      noWeather: false
    })

    if (!city) {
      if (manual) {
        this.useWeather(weatherService.fromManualWeather(manual, null), false)
      } else {
        this.setData({ loading: false, noWeather: true })
      }
      return
    }

    const existingCache = storage.getWeatherCache()
    if (weatherService.isCacheForCity(existingCache, city)) {
      this.useWeather(existingCache, true, forceRefresh ? '正在刷新天气…' : `正在更新 ${minutesAgo(existingCache.updateTime)} 分钟前的天气…`)
    }

    try {
      const result = await weatherService.getWeather(city, { forceRefresh })
      const staleText = result.stale
        ? `天气更新失败，已使用 ${minutesAgo(result.weather.updateTime)} 分钟前的天气。`
        : ''
      this.useWeather(result.weather, result.stale, staleText)
    } catch (error) {
      if (manual) {
        this.useWeather(weatherService.fromManualWeather(manual, city), false, '实时天气暂不可用，正在使用手动填写的数据。')
      } else {
        this.setData({ loading: false, noWeather: true })
        wx.showModal({
          title: '暂时获取不到天气',
          content: '可以手动填写温度后立即生成建议。',
          confirmText: '手动填写',
          success: ({ confirm }) => {
            if (confirm) wx.navigateTo({ url: '/pages/manual-weather/index' })
          }
        })
      }
    }
  },

  useWeather(weather, stale, staleText = '') {
    this.setData({ weather, loading: false, staleText, noWeather: false })
    this.rebuildRecommendations(weather)
  },

  rebuildRecommendations(weather = this.data.weather, adjustments = this.data.adjustments) {
    if (!weather) return
    const recommendations = buildAllRecommendations({
      indoorTemp: this.data.indoorTemp,
      outdoorTemp: weather.currentTemp,
      profile: this.data.profile,
      weatherTypes: weather.weatherType,
      adjustments
    })
    this.setData({ recommendations, adjustments })
  },

  refresh() {
    this.resetAdjustments()
    this.loadData(true)
  },

  chooseCity() { wx.navigateTo({ url: '/pages/city/index' }) },
  openManual() { wx.navigateTo({ url: '/pages/manual-weather/index' }) },
  openTemperature() { this.setData({ showTemperature: true }) },
  closeTemperature() { this.setData({ showTemperature: false }) },

  setScene(event) {
    this.setData({ activeScene: event.currentTarget.dataset.scene })
  },

  saveTemperature(event) {
    const indoorTemp = event.detail.value
    storage.saveEnvironment({ indoorTemp })
    this.setData({
      indoorTemp,
      showTemperature: false,
      adjustments: { indoor: 0, outdoor: 0, sleep: 0 },
      adjustmentLabels: { indoor: '', outdoor: '', sleep: '' }
    }, () => this.rebuildRecommendations())
  },

  adjust(event) {
    const { scene, delta } = event.detail
    const candidate = {
      ...this.data.adjustments,
      [scene]: this.data.adjustments[scene] + delta
    }
    const recommendations = buildAllRecommendations({
      indoorTemp: this.data.indoorTemp,
      outdoorTemp: this.data.weather.currentTemp,
      profile: this.data.profile,
      weatherTypes: this.data.weather.weatherType,
      adjustments: candidate
    })
    if (recommendations[scene].atBoundary) {
      wx.showToast({ title: recommendations[scene].boundaryMessage, icon: 'none' })
      return
    }
    this.setData({
      adjustments: candidate,
      recommendations,
      [`adjustmentLabels.${scene}`]: candidate[scene] < 0 ? '已临时调薄' : candidate[scene] > 0 ? '已临时调厚' : ''
    })
  },

  confirmGood(event) {
    const scene = event.detail && event.detail.scene
    if (scene && this.data.adjustments[scene] !== 0) {
      const adjustments = {
        ...this.data.adjustments,
        [scene]: 0
      }
      const recommendations = buildAllRecommendations({
        indoorTemp: this.data.indoorTemp,
        outdoorTemp: this.data.weather.currentTemp,
        profile: this.data.profile,
        weatherTypes: this.data.weather.weatherType,
        adjustments
      })
      this.setData({
        adjustments,
        recommendations,
        [`adjustmentLabels.${scene}`]: ''
      })
    }
    wx.showToast({ title: '好的，请继续以后颈温热、不出汗为准。', icon: 'none', duration: 2500 })
  },

  viewGoods(event) {
    const detail = event.detail || {}
    const scene = detail.scene || this.data.activeScene
    const recommendation = typeof detail.result === 'object'
      ? detail.result
      : this.data.recommendations && this.data.recommendations[scene]
    const result = typeof detail.result === 'string'
      ? detail.result
      : recommendation && recommendation.result
    storage.saveGoodsFocus({ scene, result: result || '', savedAt: Date.now() })
    wx.switchTab({ url: '/pages/goods/index' })
  },

  share() {
    if (!this.data.recommendations) return
    this.selectComponent('#shareCard').open({
      cityName: this.data.weather.cityName,
      weatherText: this.data.weather.weatherText,
      outdoorTemp: this.data.weather.currentTemp,
      indoorTemp: this.data.indoorTemp,
      recommendations: this.data.recommendations
    })
  },

  onShareAppMessage() {
    return {
      title: '宝宝今天怎么穿？看看三种场景建议',
      path: '/pages/today/index'
    }
  }
})
