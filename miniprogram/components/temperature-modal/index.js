function clampTemp(value) { return Math.max(5, Math.min(40, value)) }

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
    step(event) {
      const raw = String(this.data.draft).trim()
      const current = raw === '' ? NaN : Number(raw)
      const base = Number.isFinite(current) ? Math.round(current) : 24
      this.setData({ draft: clampTemp(base + Number(event.currentTarget.dataset.delta)) })
    },
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
