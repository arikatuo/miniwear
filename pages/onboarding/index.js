const storage = require('../../services/storage.service')
Page({
  data: {
    indoorTemp: 24, draftIndoorTemp: 24, draftOutdoorTemp: '', temperatureValues: Array.from({ length: 25 }, (_, index) => index + 12), temperaturePickerValue: [12], birthday: '', maxDate: '',
    selectedScene: 'indoor', showExample: false,
    scenes: [{ value: 'indoor', label: '在家', icon: '/assets/icons/scene-home.svg' }, { value: 'outdoor', label: '出门', icon: '/assets/icons/scene-outdoor.svg' }, { value: 'sleep', label: '睡觉', icon: '/assets/icons/scene-sleep.svg' }],
    ageGroups: [{ value: 'baby_0_6m', label: '0–6 个月' }, { value: 'baby_6_12m', label: '6–12 个月' }, { value: 'baby_1_3y', label: '1–3 岁' }], selectedAgeGroup: 'baby_6_12m'
  },
  onLoad(options = {}) { storage.initialize(); const profile = storage.getBabyProfile(); const indoorTemp = storage.getEnvironment().indoorTemp; this.setData({ indoorTemp, draftIndoorTemp: indoorTemp, temperaturePickerValue: [this.getTemperatureIndex(indoorTemp)], birthday: profile.birthday, selectedAgeGroup: profile.ageConfirmed ? profile.ageGroup : '', selectedScene: options.scene || 'indoor', maxDate: new Date().toISOString().slice(0, 10) }) },
  getTemperatureIndex(value) { const index = this.data.temperatureValues.indexOf(Number(value)); return index >= 0 ? index : 12 },
  temperatureChange(event) { const index = Number(event.detail.value[0]); const indoorTemp = this.data.temperatureValues[index]; if (Number.isFinite(indoorTemp)) this.setData({ draftIndoorTemp: indoorTemp, temperaturePickerValue: [index] }) },
  inputIndoor(event) { this.setData({ draftIndoorTemp: event.detail.value }) },
  inputOutdoor(event) { this.setData({ draftOutdoorTemp: event.detail.value }) },
  validIndoorTemp() { const temp = Number(this.data.draftIndoorTemp); return Number.isFinite(temp) && temp >= 5 && temp <= 40 },
  selectBirthday(event) { this.setData({ birthday: event.detail.value }) },
  selectScene(event) { this.setData({ selectedScene: event.currentTarget.dataset.value }) },
  selectAgeGroup(event) { this.setData({ birthday: '', selectedAgeGroup: event.currentTarget.dataset.value }) },
  toggleExample() { this.setData({ showExample: !this.data.showExample }) },
  finish() {
    if (!this.data.selectedAgeGroup) { wx.showToast({ title: '请选择宝宝年龄段', icon: 'none' }); return }
    if (this.data.selectedScene !== 'outdoor' && !this.validIndoorTemp()) { wx.showToast({ title: '请输入 5-40℃', icon: 'none' }); return }
    const outdoorTemp = Number(this.data.draftOutdoorTemp)
    if (this.data.selectedScene === 'outdoor' && !(String(this.data.draftOutdoorTemp).trim() && Number.isFinite(outdoorTemp) && outdoorTemp >= -30 && outdoorTemp <= 45)) { wx.showToast({ title: '出门请填写室外温度', icon: 'none' }); return }
    if (this.data.selectedScene !== 'outdoor') storage.saveEnvironment({ indoorTemp: Number(this.data.draftIndoorTemp) })
    if (this.data.selectedScene === 'outdoor') storage.saveManualWeather({ outdoorTemp: Math.round(outdoorTemp), indoorTemp: Number(this.data.draftIndoorTemp), weatherType: [] })
    storage.saveBabyProfile({ ...storage.getBabyProfile(), birthday: this.data.birthday, ageGroup: this.data.selectedAgeGroup, ageConfirmed: true })
    storage.saveLastOutcome({ scene: this.data.selectedScene, sceneLabel: this.data.selectedScene === 'indoor' ? '在家' : this.data.selectedScene === 'outdoor' ? '出门' : '睡觉', adjustments: { indoor: 0, outdoor: 0, sleep: 0 }, adoptedScenes: {}, conditions: { indoorTemp: Number(this.data.draftIndoorTemp), outdoorTemp: this.data.selectedScene === 'outdoor' ? Math.round(outdoorTemp) : null, source: this.data.selectedScene === 'outdoor' ? 'manual' : 'example', ageGroup: storage.getBabyProfile().ageGroup }, savedAt: Date.now() })
    storage.setInitialized(true)
    wx.switchTab({ url: '/pages/today/index' })
  },
  onShareAppMessage() { return { title: '宝宝今天怎么穿？看看三种场景建议', path: '/pages/today/index' } }
})
