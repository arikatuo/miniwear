const storage = require('../../services/storage.service')

Page({
  data: {
    outdoorTemp: 21,
    indoorTemp: 24,
    weatherOptions: [
      { value: 'sunny', label: '晴' },
      { value: 'cloudy', label: '阴' },
      { value: 'rain', label: '雨' },
      { value: 'wind', label: '风' },
      { value: 'cold', label: '冷' },
      { value: 'hot', label: '热' }
    ],
    selectedWeather: []
  },

  onLoad() {
    const manual = storage.getManualWeather()
    const environment = storage.getEnvironment()
    if (manual) {
      this.setData({
        outdoorTemp: manual.outdoorTemp,
        indoorTemp: manual.indoorTemp,
        selectedWeather: manual.weatherType || [],
        weatherOptions: this.data.weatherOptions.map((item) => ({
          ...item,
          selected: (manual.weatherType || []).includes(item.value)
        }))
      })
    } else {
      this.setData({ indoorTemp: environment.indoorTemp })
    }
  },

  inputOutdoor(event) { this.setData({ outdoorTemp: event.detail.value }) },
  inputIndoor(event) { this.setData({ indoorTemp: event.detail.value }) },
  toggleWeather(event) {
    const value = event.currentTarget.dataset.value
    const selected = this.data.selectedWeather.includes(value)
      ? this.data.selectedWeather.filter((item) => item !== value)
      : [...this.data.selectedWeather, value]
    this.setData({
      selectedWeather: selected,
      weatherOptions: this.data.weatherOptions.map((item) => ({
        ...item,
        selected: selected.includes(item.value)
      }))
    })
  },

  submit() {
    const outdoorTemp = Number(this.data.outdoorTemp)
    const indoorTemp = Number(this.data.indoorTemp)
    if (![outdoorTemp, indoorTemp].every((value) => Number.isFinite(value) && value >= -30 && value <= 45)) {
      wx.showToast({ title: '请输入 -30 至 45℃', icon: 'none' })
      return
    }
    storage.saveEnvironment({ indoorTemp })
    storage.saveManualWeather({
      outdoorTemp: Math.round(outdoorTemp),
      indoorTemp: Math.round(indoorTemp),
      weatherType: this.data.selectedWeather
    })
    storage.setInitialized(true)
    wx.switchTab({ url: '/pages/today/index' })
  },

  onShareAppMessage() {
    return {
      title: '宝宝今天怎么穿？看看三种场景建议',
      path: '/pages/today/index'
    }
  }
})
