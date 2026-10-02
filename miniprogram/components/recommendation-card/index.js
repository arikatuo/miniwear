const SCENE_ICONS = {
  indoor: '/assets/icons/scene-home.svg',
  outdoor: '/assets/icons/scene-outdoor.svg',
  sleep: '/assets/icons/scene-sleep.svg'
}
const SCENE_LABELS = { indoor: '在家', outdoor: '出门', sleep: '睡觉' }

Component({
  properties: {
    item: { type: Object, value: null },
    adjustmentLabel: { type: String, value: '' },
    adopted: { type: Boolean, value: false }
  },
  data: { sceneIcon: '', sceneLabel: '在家' },
  observers: {
    item(item) {
      if (!item) return
      this.setData({
        sceneIcon: SCENE_ICONS[item.scene] || '',
        sceneLabel: SCENE_LABELS[item.scene] || '在家'
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
