Component({
  properties: {
    visible: { type: Boolean, value: false },
    value: { type: Number, value: 24 }
  },
  data: {
    draft: 24,
    choices: [20, 22, 24, 26, 28]
  },
  observers: {
    value(value) { this.setData({ draft: value }) }
  },
  methods: {
    stop() {},
    close() { this.triggerEvent('close') },
    input(event) { this.setData({ draft: event.detail.value }) },
    choose(event) { this.setData({ draft: Number(event.currentTarget.dataset.value) }) },
    confirm() {
      const value = Number(this.data.draft)
      if (!Number.isFinite(value) || value < 5 || value > 40) {
        wx.showToast({ title: '请输入 5-40℃', icon: 'none' })
        return
      }
      this.triggerEvent('confirm', { value: Math.round(value) })
    }
  }
})
