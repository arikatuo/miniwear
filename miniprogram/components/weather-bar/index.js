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
    loading: { type: Boolean, value: false },
    indoorTemp: { type: Number, value: 24 }
  },
  data: {
    weatherIcon: ICONS.cloudy,
    showRange: false,
    sourceLabel: '',
    isManual: false
  },
  observers: {
    weather(weather) {
      if (!weather) {
        this.setData({ weatherIcon: ICONS.cloudy, showRange: false, sourceLabel: '', isManual: false })
        return
      }
      this.setData({
        weatherIcon: pickIcon(weather.weatherType),
        showRange: weather.minTemp !== weather.maxTemp,
        sourceLabel: weather.source === 'manual' ? '手动填写' : weather.source === 'example' ? '室外未知' : '',
        isManual: weather.source === 'manual'
      })
    }
  },
  methods: {
    refresh() { this.triggerEvent('refresh') },
    restoreAutomatic() { this.triggerEvent('restoreautomatic') },
    chooseCity() { this.triggerEvent('choosecity') },
    manual() { this.triggerEvent('manual') },
    openTemperature() { this.triggerEvent('opentemp') }
  }
})
