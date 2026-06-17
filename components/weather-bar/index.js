Component({
  properties: {
    weather: { type: Object, value: null },
    city: { type: Object, value: null },
    staleText: { type: String, value: '' },
    loading: { type: Boolean, value: false }
  },
  methods: {
    refresh() { this.triggerEvent('refresh') },
    chooseCity() { this.triggerEvent('choosecity') },
    manual() { this.triggerEvent('manual') }
  }
})
