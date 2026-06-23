const SCENE_ICONS = {
  indoor: '/assets/icons/scene-home.svg',
  outdoor: '/assets/icons/scene-outdoor.svg',
  sleep: '/assets/icons/scene-sleep.svg'
}

Component({
  properties: {
    item: { type: Object, value: null },
    adjustmentLabel: { type: String, value: '' }
  },
  data: {
    sceneIcon: ''
  },
  observers: {
    item(item) {
      if (!item) return
      this.setData({ sceneIcon: SCENE_ICONS[item.scene] || '' })
    }
  },
  methods: {
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
