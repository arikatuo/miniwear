const { outfitGoods } = require('../../utils/outfit-goods')

const SCENE_ICONS = {
  indoor: '/assets/icons/scene-home.svg',
  outdoor: '/assets/icons/scene-outdoor.svg',
  sleep: '/assets/icons/scene-sleep.svg'
}
const SCENE_LABELS = { indoor: '在家', outdoor: '出门', sleep: '睡觉' }
// 厚薄档位只是对已有推荐 level(1-6) 的可视化，不参与任何计算。
const LEVEL_TEXT = { 1: '很轻薄', 2: '偏轻薄', 3: '适中', 4: '偏保暖', 5: '较保暖', 6: '很保暖' }
const DOT_NUMBERS = [1, 2, 3, 4, 5, 6]

Component({
  properties: {
    item: { type: Object, value: null },
    adjustmentLabel: { type: String, value: '' },
    adopted: { type: Boolean, value: false }
  },
  data: { sceneIcon: '', sceneLabel: '在家', levelText: '', resultLong: false, dots: [], pieces: [] },
  observers: {
    item(item) {
      if (!item) return
      this.setData({
        sceneIcon: SCENE_ICONS[item.scene] || '',
        sceneLabel: SCENE_LABELS[item.scene] || '在家',
        levelText: LEVEL_TEXT[item.level] || '',
        // 较长的结论降一档字号，避免换行后留下孤字
        resultLong: String(item.result || '').length > 12,
        dots: DOT_NUMBERS.map((n) => ({ n, on: n <= item.level })),
        pieces: outfitGoods(item.scene, item.level).map((piece) => ({ id: piece.id, name: piece.name, illustration: piece.illustration }))
      })
    }
  },
  methods: {
    confirm() { this.triggerEvent('confirm', { scene: this.data.item.scene }) },
    openAdjust() { this.triggerEvent('adjustopen') },
    viewGoods() {
      this.triggerEvent('goods', { scene: this.data.item.scene, result: this.data.item.result })
    }
  }
})
