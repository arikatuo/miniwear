const { goods, subCategories } = require('../../config/goods.config')

Page({
  data: {
    category: 'clothing',
    subCategory: 'all',
    subCategories: subCategories.clothing,
    visibleGoods: [],
    groupedGoods: [],
    categoryMeta: {
      clothing: { title: '穿衣用品', desc: '按贴身层、下装、外套和配件整理，搭配时更容易看清层次。' },
      sleep: { title: '睡觉用品', desc: '按睡袋和盖毯床品整理，方便根据夜间室温选择。' }
    }
  },

  onLoad() { this.filterGoods() },

  chooseCategory(event) {
    const category = event.currentTarget.dataset.value
    this.setData({
      category,
      subCategory: 'all',
      subCategories: subCategories[category]
    }, () => this.filterGoods())
  },

  chooseSubCategory(event) {
    this.setData({ subCategory: event.currentTarget.dataset.value }, () => this.filterGoods())
  },

  filterGoods() {
    const decoratedGoods = goods
      .filter((item) => item.category === this.data.category)
      .map((item) => ({
        ...item,
        sceneText: item.scenes.join(' / '),
        warmText: item.warmValue > 0 ? `保暖值 +${item.warmValue}℃` : `保暖值 ${item.warmValue}℃`
      }))
    const visibleGoods = decoratedGoods.filter((item) => this.data.subCategory === 'all' || item.subCategory === this.data.subCategory)
    const groupedGoods = this.data.subCategories
      .filter((item) => item.key !== 'all')
      .map((group) => ({
        ...group,
        count: decoratedGoods.filter((item) => item.subCategory === group.key).length,
        goods: decoratedGoods.filter((item) => item.subCategory === group.key).slice(0, 4)
      }))
      .filter((group) => group.goods.length)
    const subCategories = this.data.subCategories.map((item) => ({
      ...item,
      count: item.key === 'all' ? decoratedGoods.length : decoratedGoods.filter((goodsItem) => goodsItem.subCategory === item.key).length
    }))
    this.setData({ visibleGoods, groupedGoods, subCategories })
  },

  imageError(event) {
    const index = event.currentTarget.dataset.index
    this.setData({ [`visibleGoods[${index}].illustration`]: '/assets/goods/default.jpg' })
  }
})
