const storage = require('../../services/storage.service')

Page({
  data: {
    step: 0,
    progressSteps: [0, 1, 2],
    city: null,
    indoorTemp: 24,
    draftIndoorTemp: 24,
    temperatureValues: Array.from({ length: 25 }, (_, index) => index + 12),
    temperaturePickerValue: [12],
    birthday: '',
    bodyTypes: [
      { value: 'unknown', label: '正常' },
      { value: 'hot', label: '偏怕热' },
      { value: 'cold', label: '偏怕冷' }
    ],
    sweatTypes: [
      { value: 'unknown', label: '正常' },
      { value: 'yes', label: '容易出汗' },
      { value: 'no', label: '不太出汗' }
    ],
    bodyType: 'unknown',
    easySweat: 'unknown',
    maxDate: ''
  },

  onLoad() {
    storage.initialize()
    const profile = storage.getBabyProfile()
    const indoorTemp = storage.getEnvironment().indoorTemp
    this.setData({
      city: storage.getCity(),
      indoorTemp,
      draftIndoorTemp: indoorTemp,
      temperaturePickerValue: [this.getTemperatureIndex(indoorTemp)],
      birthday: profile.birthday,
      bodyType: profile.bodyType,
      easySweat: profile.easySweat,
      maxDate: (() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      })()
    })
  },

  onShow() {
    const city = storage.getCity()
    if (city) this.setData({ city })
  },

  chooseCity() {
    wx.navigateTo({ url: '/pages/city/index?source=onboarding' })
  },

  getTemperatureIndex(value) {
    const temp = Number(value)
    const index = this.data.temperatureValues.findIndex((item) => item === temp)
    return index >= 0 ? index : this.data.temperatureValues.findIndex((item) => item === 24)
  },

  temperatureChange(event) {
    const index = Number(event.detail.value[0])
    const indoorTemp = this.data.temperatureValues[index]
    if (!Number.isFinite(indoorTemp)) return
    this.setData({ draftIndoorTemp: indoorTemp, temperaturePickerValue: [index] })
  },

  validIndoorTemp() {
    const temp = Number(this.data.draftIndoorTemp)
    return Number.isFinite(temp) && temp >= 5 && temp <= 40
  },

  selectBirthday(event) { this.setData({ birthday: event.detail.value }) },
  selectBodyType(event) { this.setData({ bodyType: event.currentTarget.dataset.value }) },
  selectSweat(event) { this.setData({ easySweat: event.currentTarget.dataset.value }) },

  next() {
    if (this.data.step === 1) {
      if (!this.validIndoorTemp()) {
        wx.showToast({ title: '请输入 5-40℃', icon: 'none' })
        return
      }
      storage.saveEnvironment({ indoorTemp: Number(this.data.draftIndoorTemp) })
      this.setData({ indoorTemp: Number(this.data.draftIndoorTemp) })
    }
    if (this.data.step < 2) {
      this.setData({ step: this.data.step + 1 })
    } else {
      this.finish()
    }
  },

  previous() {
    if (this.data.step > 0) this.setData({ step: this.data.step - 1 })
  },

  skip() {
    if (this.data.step === 1 && !this.validIndoorTemp()) {
      this.setData({ indoorTemp: 24, draftIndoorTemp: 24, temperaturePickerValue: [this.getTemperatureIndex(24)] })
    }
    if (this.data.step < 2) this.setData({ step: this.data.step + 1 })
    else this.finish()
  },

  finish() {
    const indoorTemp = this.validIndoorTemp() ? Number(this.data.draftIndoorTemp) : 24
    storage.saveEnvironment({ indoorTemp })
    storage.saveBabyProfile({
      birthday: this.data.birthday,
      bodyType: this.data.bodyType,
      easySweat: this.data.easySweat
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
