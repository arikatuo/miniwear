const storage = require('../../services/storage.service')
const weatherService = require('../../services/weather.service')
const { buildAllRecommendations } = require('../../services/recommendation.service')
const { minutesAgo } = require('../../utils/date')
const { SCENES, signature, restoreScenes } = require('../../utils/outfit-memory')
const { outfitGoods } = require('../../utils/outfit-goods')
const { formatAge } = require('../../utils/age')
const { createSnapshot, encodeSnapshot, decodeSnapshot } = require('../../utils/share-snapshot')

function contextText(weather, indoorTemp, source, ageText) { return `室温 ${indoorTemp}℃ · ${weather.source === 'example' ? '室外未知（示例不可确认）' : `室外 ${weather.currentTemp}℃`} · ${source} · ${ageText}` }
function sceneNeedsOutdoor(scene) { return scene === 'outdoor' }
const OUTCOME_TTL_MS = 24 * 60 * 60 * 1000

Page({
  data: {
    environmentConfirmed: false, environmentTime: '', weatherTime: '', showGoods: false, currentGoods: [], city: null, weather: null, indoorTemp: 24, profile: null, ageText: '未确认年龄，以下为示例（默认按 6 个月）', ageCompactText: '年龄待确认', recommendations: null,
    adjustmentLabels: { indoor: '', outdoor: '', sleep: '' }, adjustments: { indoor: 0, outdoor: 0, sleep: 0 }, adoptedScenes: {}, loading: false,
    staleText: '', contextText: '', noWeather: false, showTemperature: false, showWeatherDetails: false, showAdjust: false, showAfterWear: false, afterWearTip: '', showSafetyDetails: false, activeScene: 'indoor', lastOutcomeText: '', sharedSnapshot: null, sharedError: '',
    sceneList: [{ value: 'indoor', label: '在家', icon: '/assets/icons/scene-home.svg' }, { value: 'outdoor', label: '出门', icon: '/assets/icons/scene-outdoor.svg' }, { value: 'sleep', label: '睡觉', icon: '/assets/icons/scene-sleep.svg' }]
  },
  onLoad(options = {}) { if (options.snapshot) { const sharedSnapshot = decodeSnapshot(options.snapshot); this.setData(sharedSnapshot ? { sharedSnapshot } : { sharedError: '这份分享已失效或内容不完整，请让家人重新发送当前建议。' }) } },
  onShow() { if (this.data.sharedSnapshot || this.data.sharedError) return; storage.initialize(); if (!storage.getAppState().appInit) { wx.reLaunch({ url: '/pages/onboarding/index' }); return } this.loadData() },
  async loadData(forceRefresh = false) {
    const requestId = (this.weatherRequestId || 0) + 1; this.weatherRequestId = requestId;
    const city = storage.getCity(); const profile = storage.getBabyProfile(); const indoorTemp = storage.getEnvironment().indoorTemp; const manual = storage.getManualWeather(); const manualFresh = storage.isManualWeatherFresh(manual)
    const ageCompactText = profile.birthday ? formatAge(profile.birthday) : profile.ageConfirmed ? (profile.ageGroup === 'baby_0_6m' ? '0–6 个月' : profile.ageGroup === 'baby_1_3y' ? '1–3 岁' : '6–12 个月') : '年龄待确认'
    const ageText = profile.ageConfirmed ? `年龄已确认：${ageCompactText}` : '年龄未确认：以下为示例（默认按 6–12 个月）'
    const environment = storage.getEnvironment(); const environmentTime = environment.confirmedAt ? this.formatTime(environment.confirmedAt) : '默认值，待确认';
    this.setData({ environmentConfirmed: Boolean(environment.confirmedAt), environmentTime, city, profile, indoorTemp, ageText, ageCompactText, loading: true, staleText: '', noWeather: false, showAdjust: false, showAfterWear: false, afterWearTip: '' })
    // Manual remains the chosen source until the user explicitly restores automatic weather.
    if (manual) { this.useWeather(weatherService.fromManualWeather(manual, city), !manualFresh, manualFresh ? '' : '这份手动温度较早填写；仍按此值展示，请按现在情况更新或恢复实时天气。', manualFresh ? '手动填写 · 已确认' : '手动填写 · 较早记录'); return }
    if (!city) { this.useWeather({ cityName: '未设置城市', currentTemp: null, minTemp: null, maxTemp: null, weatherText: '室外未知', weatherType: [], updateTime: Date.now(), source: 'example' }, false, '未设置城市：在家和睡觉已按室温生成；出门需要填写室外温度。', '室外未知'); return }
    const cache = storage.getWeatherCache()
    if (weatherService.isCacheForCity(cache, city)) this.useWeather(cache, true, forceRefresh ? '正在刷新自动天气…' : `正在更新 ${minutesAgo(cache.updateTime)} 分钟前的天气…`, '自动天气（缓存）')
    try { const result = await weatherService.getWeather(city, { forceRefresh }); if (requestId !== this.weatherRequestId || storage.getManualWeather()) return; this.useWeather(result.weather, result.stale, result.stale ? `天气更新失败，正在使用 ${minutesAgo(result.weather.updateTime)} 分钟前的自动天气。` : '', result.stale ? '自动天气（较早）' : '自动天气 · 已确认') } catch (error) { if (requestId !== this.weatherRequestId || storage.getManualWeather()) return; this.useWeather({ cityName: city.name, currentTemp: null, minTemp: null, maxTemp: null, weatherText: '室外未知', weatherType: [], updateTime: Date.now(), source: 'example' }, true, '暂时获取不到自动天气：出门需要填写室外温度；在家和睡觉仍可使用室温。', '室外未知') }
  },
  formatTime(time) { const date = new Date(time); return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0') },
  useWeather(weather, stale, staleText = '', source = '') { this.setData({ weatherTime: weather.source === 'example' ? '' : this.formatTime(weather.updateTime), weather, loading: false, staleText, noWeather: weather.source === 'example', contextText: contextText(weather, this.data.indoorTemp, source, this.data.ageText) }); this.rebuildRecommendations(weather); this.restoreSavedState(weather) },
  conditionsFor(weather = this.data.weather) { return { indoorTemp: this.data.indoorTemp, outdoorTemp: weather.currentTemp, source: weather.source, ageGroup: this.data.profile && this.data.profile.ageGroup } },
  conditionsMatch(last, weather) {
    if (!last || !last.conditions) return false
    if (Number.isFinite(last.savedAt) && Date.now() - last.savedAt > OUTCOME_TTL_MS) return false
    const current = this.conditionsFor(weather); const saved = last.conditions
    if (saved.indoorTemp !== current.indoorTemp || saved.ageGroup !== current.ageGroup) return false
    return !sceneNeedsOutdoor(last.scene) || (saved.outdoorTemp === current.outdoorTemp && saved.source === current.source)
  },
  sceneSignatures(weather = this.data.weather) { return SCENES.reduce((all, scene) => ({ ...all, [scene]: signature(scene, this.data.indoorTemp, weather, this.data.profile) }), {}) },
  restoreSavedState(weather) {
    const last = storage.getLastOutcome()
    const restored = restoreScenes(last, this.sceneSignatures(weather))
    this.savedScenes = restored.scenes
    const activeScene = last && SCENES.includes(last.scene) ? last.scene : this.data.activeScene
    const lastOutcomeText = restored.changed ? '相关条件或日期已变化，请重新确认搭配。' : ''
    this.setData({ activeScene, adjustments: restored.adjustments, adoptedScenes: restored.adoptedScenes, adjustmentLabels: restored.adjustmentLabels, lastOutcomeText }, () => this.rebuildRecommendations(weather))
  },
  rebuildRecommendations(weather = this.data.weather, adjustments = this.data.adjustments) { if (!weather || !this.data.profile) return; const outdoorTemp = Number.isFinite(weather.currentTemp) ? weather.currentTemp : this.data.indoorTemp; this.setData({ recommendations: buildAllRecommendations({ indoorTemp: this.data.indoorTemp, outdoorTemp, profile: this.data.profile, weatherTypes: weather.weatherType, adjustments }), adjustments }) },
  async onPullDownRefresh() {
    if (this.data.sharedSnapshot || this.data.sharedError) { wx.stopPullDownRefresh(); return }
    try { await this.loadData(true) } finally { wx.stopPullDownRefresh() }
  },
  openSettings() { wx.switchTab({ url: '/pages/settings/index' }) },
  refresh() { this.loadData(true) },
  restoreAutomatic() { storage.removeManualWeather(); this.loadData(true) },
  chooseCity() { wx.navigateTo({ url: '/pages/city/index' }) }, openManual() { wx.navigateTo({ url: '/pages/manual-weather/index' }) }, openTemperature() { this.setData({ showTemperature: true }) }, closeTemperature() { this.setData({ showTemperature: false }) },
  persistState(scene = this.data.activeScene) {
    if (!this.data.weather || !this.data.profile) return
    this.savedScenes = { ...(this.savedScenes || {}), [scene]: { signature: this.sceneSignatures()[scene], adjustment: this.data.adjustments[scene], adopted: Boolean(this.data.adoptedScenes[scene]), result: this.data.recommendations[scene].result, savedAt: Date.now() } }
    storage.saveLastOutcome({ scene, scenes: this.savedScenes })
  },
  setScene(event) {
    const activeScene = event.currentTarget.dataset.scene
    if (!SCENES.includes(activeScene)) return
    this.setData({ activeScene, showAdjust: false, showAfterWear: false, afterWearTip: '', showWeatherDetails: false })
    storage.saveLastOutcome({ ...(storage.getLastOutcome() || {}), scene: activeScene })
  },
  saveTemperature(event) { const indoorTemp = event.detail.value; storage.saveEnvironment({ indoorTemp }); this.setData({ environmentConfirmed: true, environmentTime: this.formatTime(Date.now()), indoorTemp, showTemperature: false }, () => { this.rebuildRecommendations(); this.setData({ contextText: contextText(this.data.weather, indoorTemp, this.data.weather.source === 'manual' ? '手动填写 · 已确认' : this.data.weather.source === 'example' ? '室外未知' : '自动天气', this.data.ageText) }); this.restoreSavedState(this.data.weather) }) },
  toggleWeatherDetails() { this.setData({ showWeatherDetails: !this.data.showWeatherDetails }) },
  toggleSafety() { this.setData({ showSafetyDetails: !this.data.showSafetyDetails }) },
  openAdjust() { this.setData({ showAdjust: true }) },
  closeAdjust() { this.setData({ showAdjust: false }) },
  adjustFromSheet(event) { this.adjust({ detail: { scene: this.data.activeScene, delta: Number(event.currentTarget.dataset.delta) } }); this.closeAdjust() },
  resetFromSheet() { this.resetScene(); this.closeAdjust() },
  openAfterWear() { this.setData({ showAfterWear: true, afterWearTip: '' }) },
  closeAfterWear() { this.setData({ showAfterWear: false, afterWearTip: '' }) },
  selectAfterWearTip(event) { this.setData({ afterWearTip: event.currentTarget.dataset.tip }) },
  adjust(event) { const { scene, delta } = event.detail; const candidate = { ...this.data.adjustments, [scene]: this.data.adjustments[scene] + delta }; const recommendations = buildAllRecommendations({ indoorTemp: this.data.indoorTemp, outdoorTemp: Number.isFinite(this.data.weather.currentTemp) ? this.data.weather.currentTemp : this.data.indoorTemp, profile: this.data.profile, weatherTypes: this.data.weather.weatherType, adjustments: candidate }); if (recommendations[scene].atBoundary) { wx.showToast({ title: recommendations[scene].boundaryMessage, icon: 'none' }); return } this.setData({ adjustments: candidate, recommendations, [`adoptedScenes.${scene}`]: false, [`adjustmentLabels.${scene}`]: candidate[scene] < 0 ? '已调薄，尚未记下' : candidate[scene] > 0 ? '已调厚，尚未记下' : '' }, () => this.persistState(scene)) },
  canConfirmScene(scene) { return Boolean(this.data.profile && this.data.profile.ageConfirmed) && (scene === 'outdoor' || this.data.environmentConfirmed !== false) && !(sceneNeedsOutdoor(scene) && this.data.weather.source === 'example') },
  confirmGood(event) { const scene = event.detail && event.detail.scene || this.data.activeScene; if (!this.data.profile || !this.data.profile.ageConfirmed) { wx.showToast({ title: '请先确认宝宝年龄段，再记下搭配', icon: 'none' }); return } if (sceneNeedsOutdoor(scene) && this.data.weather.source === 'example') { if (this.openManual) this.openManual(); else wx.showToast({ title: '请先填写室外温度，再确认出门搭配', icon: 'none' }); return } if (scene !== 'outdoor' && this.data.environmentConfirmed === false) { this.openTemperature(); return } const adoptedScenes = { ...(this.data.adoptedScenes || {}), [scene]: true }; this.setData({ adoptedScenes, [`adjustmentLabels.${scene}`]: '已记下这套搭配' }, () => { if (this.persistState) this.persistState(scene); wx.showToast({ title: '已记下，之后可按现在条件更新。', icon: 'none' }) }) },
  resetScene() { const scene = this.data.activeScene; const adjustments = { ...this.data.adjustments, [scene]: 0 }; this.setData({ adjustments, [`adjustmentLabels.${scene}`]: '', [`adoptedScenes.${scene}`]: false }, () => { this.rebuildRecommendations(); this.persistState(scene) }) },
  viewGoods() { const current = this.data.recommendations[this.data.activeScene]; this.setData({ showGoods: true, currentGoods: outfitGoods(this.data.activeScene, current.level) }) },
  closeGoods() { this.setData({ showGoods: false }) },
  stop() {},
  confirmAge() { wx.navigateTo({ url: '/pages/onboarding/index?scene=' + this.data.activeScene }) },
  share() { if (!this.data.recommendations || !this.canConfirmScene(this.data.activeScene)) { wx.showToast({ title: this.data.profile && this.data.profile.ageConfirmed ? '示例室外温度不能生成海报' : '请先确认宝宝年龄段，再生成海报', icon: 'none' }); return } const scene = this.data.activeScene; const snapshot = createSnapshot({ scene, ageGroup: this.data.profile.ageGroup, weather: this.data.weather, indoorTemp: this.data.indoorTemp, recommendation: this.data.recommendations[scene], adjustment: this.data.adjustments[scene] }); this.selectComponent('#shareCard').open({ cityName: this.data.weather.cityName, weatherText: this.data.weather.weatherText, outdoorTemp: this.data.weather.currentTemp, indoorTemp: this.data.indoorTemp, recommendations: this.data.recommendations, reason: this.data.recommendations[scene].reason, pieces: outfitGoods(scene, this.data.recommendations[scene].level).map((piece) => ({ name: piece.name, illustration: piece.illustration })), scene, source: snapshot.source, ageGroup: snapshot.ageGroup, date: snapshot.date }) },
  exitShared() { this.setData({ sharedSnapshot: null, sharedError: '' }); storage.initialize(); if (storage.getAppState().appInit) this.loadData(); else wx.reLaunch({ url: '/pages/onboarding/index' }) },
  onShareAppMessage() { if (!this.data.recommendations || !this.canConfirmScene(this.data.activeScene)) return { title: '宝宝今天怎么穿？', path: '/pages/today/index' }; const scene = this.data.activeScene; const snapshot = createSnapshot({ scene, ageGroup: this.data.profile.ageGroup, weather: this.data.weather, indoorTemp: this.data.indoorTemp, recommendation: this.data.recommendations[scene], adjustment: this.data.adjustments[scene] }); return { title: `给家人的${this.data.sceneList.find((item) => item.value === scene).label}穿搭：${this.data.recommendations[scene].result}`, path: `/pages/today/index?snapshot=${encodeSnapshot(snapshot)}` } }
})
