const storage = require('../../services/storage.service')
const { formatAge } = require('../../utils/age')

Page({
  data: {
    profile: null,
    city: null,
    indoorTemp: 24,
    ageText: '',
    bodyOptions: [
      { value: 'unknown', label: '不确定' },
      { value: 'hot', label: '偏怕热' },
      { value: 'cold', label: '偏怕冷' }
    ],
    sweatOptions: [
      { value: 'unknown', label: '不确定' },
      { value: 'yes', label: '容易出汗' },
      { value: 'no', label: '不太容易出汗' }
    ],
    bodyIndex: 0,
    sweatIndex: 0,
    tempValues: [20, 22, 24, 26, 28],
    tempIndex: 2,
    maxDate: ''
  },

  onLoad() {
    const now = new Date()
    this.setData({ maxDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` })
  },

  onShow() { this.load() },

  load() {
    const profile = storage.getBabyProfile()
    const city = storage.getCity()
    const indoorTemp = storage.getEnvironment().indoorTemp
    this.setData({
      profile,
      city,
      indoorTemp,
      ageText: formatAge(profile.birthday),
      bodyIndex: this.data.bodyOptions.findIndex((item) => item.value === profile.bodyType),
      sweatIndex: this.data.sweatOptions.findIndex((item) => item.value === profile.easySweat),
      tempIndex: this.data.tempValues.reduce((best, value, index, values) => (
        Math.abs(value - indoorTemp) < Math.abs(values[best] - indoorTemp) ? index : best
      ), 0)
    })
  },

  birthdayChange(event) {
    const profile = { ...this.data.profile, birthday: event.detail.value }
    storage.saveBabyProfile(profile)
    this.load()
  },

  bodyChange(event) {
    const bodyType = this.data.bodyOptions[Number(event.detail.value)].value
    storage.saveBabyProfile({ ...this.data.profile, bodyType })
    this.load()
  },

  sweatChange(event) {
    const easySweat = this.data.sweatOptions[Number(event.detail.value)].value
    storage.saveBabyProfile({ ...this.data.profile, easySweat })
    this.load()
  },

  indoorChange(event) {
    const indoorTemp = this.data.tempValues[Number(event.detail.value)]
    storage.saveEnvironment({ indoorTemp })
    this.setData({ indoorTemp })
  },

  chooseCity() { wx.navigateTo({ url: '/pages/city/index' }) },
  openPrivacy() { wx.navigateTo({ url: '/pages/privacy/index' }) },

  clearData() {
    wx.showModal({
      title: '清除本地数据？',
      content: '宝宝信息、城市、室温和天气缓存都会被清除，之后将重新进入首次设置。',
      confirmText: '确认清除',
      confirmColor: '#C65353',
      success: ({ confirm }) => {
        if (!confirm) return
        storage.clearAll()
        wx.reLaunch({ url: '/pages/onboarding/index' })
      }
    })
  }
})
