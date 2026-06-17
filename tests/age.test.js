const test = require('node:test')
const assert = require('node:assert/strict')
const { getAgeInMonths, getAgeGroup } = require('../utils/age')

test('未设置生日时默认按 6-12 个月处理', () => {
  assert.equal(getAgeGroup(null), 'baby_6_12m')
})

test('按完整月计算月龄', () => {
  assert.equal(getAgeInMonths('2025-08-14', new Date('2026-06-14T12:00:00+08:00')), 10)
  assert.equal(getAgeInMonths('2025-08-15', new Date('2026-06-14T12:00:00+08:00')), 9)
})

test('3 岁以上使用兜底组', () => {
  assert.equal(getAgeGroup('2022-01-01', new Date('2026-06-14T12:00:00+08:00')), 'fallback_3y_plus')
})
