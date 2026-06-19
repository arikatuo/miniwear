const storage = require('../../services/storage.service')

Page({
  data: {
    step: 0,
    progressSteps: [0, 1, 2],
    city: null,
    indoorTemp: 24,
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
    this.setData({ indoorTemp, temperaturePickerValue: [index] })
  },

  validIndoorTemp() {
    const temp = Number(this.data.indoorTemp)
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
      storage.saveEnvironment({ indoorTemp: Number(this.data.indoorTemp) })
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
      this.setData({ indoorTemp: 24 })
    }
    if (this.data.step < 2) this.setData({ step: this.data.step + 1 })
    else this.finish()
  },

  finish() {
    storage.saveEnvironment({ indoorTemp: this.validIndoorTemp() ? Number(this.data.indoorTemp) : 24 })
    storage.saveBabyProfile({
      birthday: this.data.birthday,
      bodyType: this.data.bodyType,
      easySweat: this.data.easySweat
    })
    storage.setInitialized(true)
    wx.switchTab({ url: '/pages/today/index' })
  }
})
