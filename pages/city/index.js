const storage = require('../../services/storage.service')
const { cities } = require('../../config/cities.config')
const { TENCENT_MAP_KEY } = require('../../config/weather.config')

Page({
  data: {
    keyword: '',
    results: cities,
    recentCities: [],
    locating: false
  },

  onShow() {
    this.setData({ recentCities: storage.getRecentCities() })
  },

  inputKeyword(event) {
    const keyword = event.detail.value.trim()
    const results = keyword ? cities.filter((city) => city.name.includes(keyword)) : cities
    this.setData({ keyword, results })
  },

  choose(event) {
    const city = event.currentTarget.dataset.city
    storage.saveCity(city)
    wx.showToast({ title: `已选择${city.name}`, icon: 'success' })
    setTimeout(() => wx.navigateBack(), 300)
  },

  chooseCustomCity() {
    const name = this.data.keyword.trim().replace(/市$/, '')
    if (!name) return
    if (!TENCENT_MAP_KEY) {
      storage.saveCity({ name, code: '', source: 'manual' })
      wx.showModal({
        title: `已选择${name}`,
        content: '当前未配置天气服务 Key，可以继续使用手动温度模式。',
        showCancel: false,
        success: () => wx.navigateBack()
      })
      return
    }
    this.setData({ locating: true })
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: { address: name, key: TENCENT_MAP_KEY },
      success: ({ data }) => {
        const result = data && data.result
        const adcode = result && result.ad_info && result.ad_info.adcode
        if (!result || !adcode) {
          wx.showToast({ title: '未找到城市，请换关键词', icon: 'none' })
          return
        }
        const component = result.address_components || result.address_component || {}
        const resolvedName = (component.city || component.province || name).replace(/市$/, '')
        storage.saveCity({ name: resolvedName, code: String(adcode), source: 'manual' })
        wx.showToast({ title: `已选择${resolvedName}`, icon: 'success' })
        setTimeout(() => wx.navigateBack(), 300)
      },
      fail: () => wx.showToast({ title: '城市查询失败，请稍后重试', icon: 'none' }),
      complete: () => this.setData({ locating: false })
    })
  },

  locate() {
    if (this.data.locating) return
    this.setData({ locating: true })
    wx.getLocation({
      type: 'gcj02',
      success: ({ latitude, longitude }) => this.reverseGeocode(latitude, longitude),
      fail: () => {
        this.setData({ locating: false })
        wx.showModal({
          title: '没有获取到位置',
          content: '没关系，也可以手动选择城市，不影响使用。',
          showCancel: false
        })
      }
    })
  },

  reverseGeocode(latitude, longitude) {
    if (!TENCENT_MAP_KEY) {
      this.setData({ locating: false })
      wx.showModal({
        title: '定位天气尚未配置',
        content: '当前版本可直接手动选择城市，功能不受影响。',
        showCancel: false
      })
      return
    }
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: { location: `${latitude},${longitude}`, key: TENCENT_MAP_KEY },
      success: ({ data }) => {
        const component = data && data.result && data.result.address_component
        if (!component) {
          wx.showToast({ title: '定位失败，请手动选择', icon: 'none' })
          return
        }
        const name = component.city || component.province
        const adcode = data.result.ad_info && data.result.ad_info.adcode
        const matched = cities.find((item) => name.includes(item.name))
        const city = matched
          ? { ...matched, lat: latitude, lng: longitude, source: 'location' }
          : { name: name.replace(/市$/, ''), code: String(adcode || ''), lat: latitude, lng: longitude, source: 'location' }
        storage.saveCity(city)
        wx.showToast({ title: `已定位到${city.name}`, icon: 'success' })
        setTimeout(() => wx.navigateBack(), 300)
      },
      fail: () => wx.showToast({ title: '定位失败，请手动选择', icon: 'none' }),
      complete: () => this.setData({ locating: false })
    })
  }
})
