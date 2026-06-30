const { goods, subCategories } = require('../../config/goods.config')
const storage = require('../../services/storage.service')

const SCENE_META = {
  indoor: { label: '在家', category: 'clothing' },
  outdoor: { label: '出门', category: 'clothing' },
  sleep: { label: '睡觉', category: 'sleep' }
}

function decorateGoods(item) {
  return {
    ...item,
    sceneText: item.scenes.join(' / '),
    warmText: item.warmValue > 0 ? `保暖值 +${item.warmValue}℃` : `保暖值 ${item.warmValue}℃`
  }
}

function matchesRecommendation(item, result) {
  const text = result || ''
  const name = item.name
  return [
    text.includes('包屁衣') && name.includes('包屁衣'),
    text.includes('连体衣') && name.includes('连体衣'),
    text.includes('睡袋') && name.includes('睡袋'),
    text.includes('纱布') && name.includes('纱布'),
    text.includes('盖') && (name.includes('毯') || name.includes('被') || name.includes('毛巾')),
    text.includes('外套') && item.subCategory === 'outer',
    text.includes('背心') && name.includes('背心'),
    text.includes('内搭') && item.subCategory === 'inner',
    text.includes('长袖') && (name.includes('长袖') || name.includes('秋衣')),
    text.includes('短袖') && name.includes('短袖'),
    text.includes('裤') && item.subCategory === 'pants'
  ].some(Boolean)
}

function prioritizeMatches(items, result) {
  const rules = [
    (item) => result.includes('背心') && nameIncludes(item, '背心'),
    (item) => result.includes('外套') && item.subCategory === 'outer',
    (item) => result.includes('裤') && item.subCategory === 'pants',
    (item) => result.includes('睡袋') && nameIncludes(item, '睡袋'),
    (item) => result.includes('纱布') && nameIncludes(item, '纱布'),
    (item) => result.includes('内搭') && item.subCategory === 'inner'
  ]
  const ordered = []
  rules.forEach((rule) => {
    items.filter(rule).forEach((item) => {
      if (!ordered.some((existing) => existing.id === item.id)) ordered.push(item)
    })
  })
  items.forEach((item) => {
    if (!ordered.some((existing) => existing.id === item.id)) ordered.push(item)
  })
  return ordered
}

function nameIncludes(item, keyword) {
  return item.name.includes(keyword)
}

function buildFocusedGoods(focus) {
  if (!focus) return []
  const sceneMeta = SCENE_META[focus.scene] || SCENE_META.indoor
  const categoryGoods = goods.filter((item) => item.category === sceneMeta.category)
  const matched = prioritizeMatches(
    categoryGoods.filter((item) => matchesRecommendation(item, focus.result)),
    focus.result || ''
  )
  const fallback = categoryGoods
    .filter((item) => focus.scene === 'sleep' || item.scenes.includes(sceneMeta.label))
    .slice(0, 6)
  return (matched.length ? matched : fallback).slice(0, 6).map(decorateGoods)
}

Page({
  data: {
    category: 'clothing',
    currentFloor: '',
    groupedGoods: [],
    focusedGoods: [],
    focusTitle: '',
    focusDesc: '',
    categoryMeta: {
      clothing: { title: '穿衣用品', desc: '按贴身层、下装、外套和配件整理，搭配时更容易看清层次。' },
      sleep: { title: '睡觉用品', desc: '按睡袋和盖毯床品整理，方便根据夜间室温选择。' }
    }
  },

  onLoad() { this.refreshFocus() },
  onShow() { this.refreshFocus() },

  chooseCategory(event) {
    const category = event.currentTarget.dataset.value
    this.setData({ category }, () => this.filterGoods())
  },

  refreshFocus() {
    const focus = storage.getGoodsFocus && storage.getGoodsFocus()
    const sceneMeta = focus ? (SCENE_META[focus.scene] || SCENE_META.indoor) : null
    const focusedGoods = buildFocusedGoods(focus)
    const patch = {
      focusedGoods,
      focusTitle: sceneMeta ? `${sceneMeta.label}相关用品` : '',
      focusDesc: focus && focus.result ? `刚才建议：${focus.result}` : ''
    }
    if (sceneMeta && focusedGoods.length) patch.category = sceneMeta.category
    this.setData(patch, () => this.filterGoods())
  },

  filterGoods() {
    const decoratedGoods = goods
      .filter((item) => item.category === this.data.category)
      .map(decorateGoods)
    const groupedGoods = subCategories[this.data.category]
      .filter((item) => item.key !== 'all')
      .map((group) => ({
        ...group,
        count: decoratedGoods.filter((item) => item.subCategory === group.key).length,
        goods: decoratedGoods.filter((item) => item.subCategory === group.key)
      }))
      .filter((group) => group.goods.length)
    this.setData({
      groupedGoods,
      currentFloor: groupedGoods.length ? groupedGoods[0].key : ''
    })
  },

  jumpToFloor(event) {
    const key = event.currentTarget.dataset.key
    this.setData({ currentFloor: key })
    const query = wx.createSelectorQuery()
    query.select(`#floor-${key}`).boundingClientRect()
    query.selectViewport().scrollOffset()
    query.exec((res) => {
      if (!res || !res[0] || !res[1]) return
      const target = res[1].scrollTop + res[0].top - 20
      wx.pageScrollTo({ scrollTop: target, duration: 260 })
    })
  },

  imageError(event) {
    const key = event.currentTarget.dataset.key
    const index = event.currentTarget.dataset.index
    if (key === 'focus') {
      this.setData({ [`focusedGoods[${index}].illustration`]: '/assets/goods/default.jpg' })
      return
    }
    const group = this.data.groupedGoods.find((item) => item.key === key)
    if (!group) return
    const groupIndex = this.data.groupedGoods.indexOf(group)
    this.setData({ [`groupedGoods[${groupIndex}].goods[${index}].illustration`]: '/assets/goods/default.jpg' })
  }
})
