const SCENE_ICONS = {
  indoor: '/assets/icons/scene-home.svg',
  outdoor: '/assets/icons/scene-outdoor.svg',
  sleep: '/assets/icons/scene-sleep.svg'
}
const TEMP_LABELS = {
  indoor: '室温',
  outdoor: '室外',
  sleep: '室温'
}

Component({
  properties: {
    item: { type: Object, value: null },
    adjustmentLabel: { type: String, value: '' }
  },
  data: {
    sceneIcon: '',
    tempLabel: '室温',
    expandedTip: '',
    gaugeSteps: [1, 2, 3, 4, 5, 6]
  },
  observers: {
    item(item) {
      if (!item) return
      this.setData({
        sceneIcon: SCENE_ICONS[item.scene] || '',
        tempLabel: TEMP_LABELS[item.scene] || '室温',
        expandedTip: ''
      })
    }
  },
  methods: {
    toggleTip(event) {
      const key = event.currentTarget.dataset.tip
      this.setData({ expandedTip: this.data.expandedTip === key ? '' : key })
    },
    adjust(event) {
      this.triggerEvent('adjust', {
        scene: this.data.item.scene,
        delta: Number(event.currentTarget.dataset.delta)
      })
    },
    confirmGood() {
      this.triggerEvent('good', { scene: this.data.item.scene })
    }
  }
})
