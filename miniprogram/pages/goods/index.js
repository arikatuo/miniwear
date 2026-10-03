const { goods, subCategories } = require('../../config/goods.config')

function decorateGoods(item) {
  return {
    ...item,
    sceneText: item.scenes.join(' / '),
    warmText: item.warmValue > 0 ? `保暖值 +${item.warmValue}℃` : `保暖值 ${item.warmValue}℃`
  }
}

Page({
  data: {
    category: 'clothing',
    currentFloor: '',
    groupedGoods: [], selectedGoods: null,
    categoryMeta: {
      clothing: { title: '穿衣用品', desc: '按贴身层、下装、外套和配件整理，搭配时更容易看清层次。' },
      sleep: { title: '睡觉用品', desc: '按睡袋和盖毯床品整理，方便根据夜间室温选择。' }
    }
  },

  onLoad() { this.filterGoods() },
  onReady() { this.measureFloors() },
  onUnload() { clearTimeout(this.measureTimer) },

  chooseCategory(event) {
    const category = event.currentTarget.dataset.value
    this.setData({ category }, () => this.filterGoods())
  },

  filterGoods() {
    const decoratedGoods = goods
      .filter((item) => item.category === this.data.category && !item.catalogHidden)
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
    }, () => this.measureFloors())
    if (wx.pageScrollTo) wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  },

  // 吸顶导航高度（rpx → px），用于锚点跳转和滚动联动
  stickyOffset() {
    if (!this.ratio) {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this.ratio = info.windowWidth / 750
    }
    return 232 * this.ratio
  },

  // 记录每个分组距页面顶部的位置，供滚动时高亮当前楼层
  measureFloors() {
    clearTimeout(this.measureTimer)
    this.measureTimer = setTimeout(() => {
      const groups = this.data.groupedGoods
      if (!groups.length) { this.floorOffsets = []; return }
      const query = wx.createSelectorQuery()
      groups.forEach((group) => query.select(`#floor-${group.key}`).boundingClientRect())
      query.selectViewport().scrollOffset()
      query.exec((res) => {
        if (!res || !res.length) return
        const viewport = res[res.length - 1]
        const scrollTop = viewport ? viewport.scrollTop : 0
        this.floorOffsets = groups.map((group, index) => ({ key: group.key, top: res[index] ? res[index].top + scrollTop : 0 }))
      })
    }, 80)
  },

  onPageScroll(event) {
    if (!this.floorOffsets || !this.floorOffsets.length) return
    if (this.lockUntil && Date.now() < this.lockUntil) return
    const line = event.scrollTop + this.stickyOffset() + 8
    let current = this.floorOffsets[0].key
    this.floorOffsets.forEach((floor) => { if (floor.top <= line) current = floor.key })
    if (current !== this.data.currentFloor) this.setData({ currentFloor: current })
  },

  jumpToFloor(event) {
    const key = event.currentTarget.dataset.key
    this.setData({ currentFloor: key })
    const query = wx.createSelectorQuery()
    query.select(`#floor-${key}`).boundingClientRect()
    query.selectViewport().scrollOffset()
    query.exec((res) => {
      if (!res || !res[0] || !res[1]) return
      const target = res[1].scrollTop + res[0].top - this.stickyOffset()
      this.lockUntil = Date.now() + 420
      wx.pageScrollTo({ scrollTop: Math.max(0, target), duration: 260 })
    })
  },

  imageError(event) {
    const key = event.currentTarget.dataset.key
    const index = event.currentTarget.dataset.index
    const group = this.data.groupedGoods.find((item) => item.key === key)
    if (!group) return
    const groupIndex = this.data.groupedGoods.indexOf(group)
    this.setData({ [`groupedGoods[${groupIndex}].goods[${index}].imageMissing`]: true })
  },

  showGoodsDetail(event) {
    const group = this.data.groupedGoods.find((item) => item.key === event.currentTarget.dataset.key)
    const item = group && group.goods[Number(event.currentTarget.dataset.index)]
    if (item) this.setData({ selectedGoods: item })
  },

  closeGoodsDetail() { this.setData({ selectedGoods: null }) },
  noop() {},

  onShareAppMessage() {
    return {
      title: '宝宝用品怎么选？看看穿衣和睡觉参考清单',
      path: '/pages/goods/index'
    }
  }
})
