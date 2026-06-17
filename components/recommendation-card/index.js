Component({
  properties: {
    item: { type: Object, value: null },
    adjustmentLabel: { type: String, value: '' }
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
