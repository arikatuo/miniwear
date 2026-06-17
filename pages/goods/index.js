const { goods, subCategories } = require('../../config/goods.config')

Page({
  data: {
    category: 'clothing',
    subCategory: 'all',
    subCategories: subCategories.clothing,
    visibleGoods: []
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
    const visibleGoods = goods
      .filter((item) => item.category === this.data.category)
      .filter((item) => this.data.subCategory === 'all' || item.subCategory === this.data.subCategory)
      .map((item) => ({
        ...item,
        sceneText: item.scenes.join(' / '),
        warmText: item.warmValue > 0 ? `保暖值 +${item.warmValue}℃` : `保暖值 ${item.warmValue}℃`
      }))
    this.setData({ visibleGoods })
  },

  imageError(event) {
    const index = event.currentTarget.dataset.index
    this.setData({ [`visibleGoods[${index}].illustration`]: '/assets/goods/default.png' })
  }
})
