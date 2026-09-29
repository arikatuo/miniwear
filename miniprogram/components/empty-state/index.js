Component({
  properties: {
    title: { type: String, value: '暂时没有内容' },
    description: { type: String, value: '' },
    actionText: { type: String, value: '' }
  },
  methods: {
    action() { this.triggerEvent('action') }
  }
})
