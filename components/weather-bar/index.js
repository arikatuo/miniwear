const ICONS = {
  rain: '/assets/icons/weather-rain.svg',
  wind: '/assets/icons/weather-wind.svg',
  hot: '/assets/icons/weather-hot.svg',
  cold: '/assets/icons/weather-cold.svg',
  sunny: '/assets/icons/weather-sun.svg',
  cloudy: '/assets/icons/weather-cloud-sun.svg'
}
const PRIORITY = ['rain', 'wind', 'hot', 'cold', 'sunny', 'cloudy']

function pickIcon(types) {
  const list = Array.isArray(types) ? types : []
  const matched = PRIORITY.find((key) => list.includes(key))
  return ICONS[matched] || ICONS.cloudy
}

Component({
  properties: {
    weather: { type: Object, value: null },
    city: { type: Object, value: null },
    staleText: { type: String, value: '' },
    loading: { type: Boolean, value: false }
  },
  data: {
    weatherIcon: ICONS.cloudy
  },
  observers: {
    weather(weather) {
      this.setData({ weatherIcon: weather ? pickIcon(weather.weatherType) : ICONS.cloudy })
    }
  },
  methods: {
    refresh() { this.triggerEvent('refresh') },
    chooseCity() { this.triggerEvent('choosecity') },
    manual() { this.triggerEvent('manual') }
  }
})
