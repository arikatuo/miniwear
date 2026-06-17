const test = require('node:test')
const assert = require('node:assert/strict')
const { canUseWeatherCache, normalizeTencentWeather } = require('../services/weather.service')

test('天气缓存只能用于同一个城市', () => {
  const cache = { cityName: '杭州', updateTime: 1_000_000 }
  assert.equal(canUseWeatherCache(cache, { name: '上海' }, 1_000_000), false)
  assert.equal(canUseWeatherCache(cache, { name: '杭州' }, 1_000_000), true)
})

test('过期天气缓存不能作为新鲜缓存直接返回', () => {
  const cache = { cityName: '杭州', updateTime: 1_000_000 }
  assert.equal(canUseWeatherCache(cache, { name: '杭州' }, 1_000_000 + 31 * 60 * 1000), false)
})

test('按腾讯位置服务官方响应结构解析实时和当日高低温', () => {
  const nowData = {
    result: {
      realtime: [{
        infos: {
          weather: '小雨',
          temperature: 21
        }
      }]
    }
  }
  const futureData = {
    result: {
      forecast: [{
        infos: [{
          day: { temperature: 25 },
          night: { temperature: 20 }
        }]
      }]
    }
  }
  const weather = normalizeTencentWeather(nowData, futureData, { name: '杭州' }, 1234)
  assert.deepEqual(weather, {
    cityName: '杭州',
    currentTemp: 21,
    minTemp: 20,
    maxTemp: 25,
    weatherText: '小雨',
    weatherType: ['rain'],
    updateTime: 1234,
    source: 'api'
  })
})
