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
