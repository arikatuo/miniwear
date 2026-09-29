const test = require('node:test')
const assert = require('node:assert/strict')
const { createSnapshot, encodeSnapshot, decodeSnapshot, validateSnapshot, MAX_AGE_MS, MAX_ENCODED_LENGTH } = require('../miniprogram/utils/share-snapshot')

const now = 1_800_000_000_000
const snapshot = createSnapshot({ scene: 'outdoor', weather: { currentTemp: 30, source: 'manual', weatherText: '晴' }, indoorTemp: 25, recommendation: { result: '短袖包屁衣 + 薄裤' }, adjustment: -1, now })

test('分享快照可安全编码解码，保留当前场景和已选搭配', () => {
  assert.deepEqual(decodeSnapshot(encodeSnapshot(snapshot), now), snapshot)
})

test('分享快照拒绝未知版本、场景、非有限温度、过期和超长内容', () => {
  assert.equal(validateSnapshot({ ...snapshot, v: 99 }, now), null)
  assert.equal(validateSnapshot({ ...snapshot, scene: 'unknown' }, now), null)
  assert.equal(validateSnapshot({ ...snapshot, outdoorTemp: Infinity }, now), null)
  assert.equal(validateSnapshot({ ...snapshot, createdAt: now - MAX_AGE_MS - 1 }, now), null)
  assert.equal(validateSnapshot({ ...snapshot, result: 'x'.repeat(81) }, now), null)
  assert.equal(decodeSnapshot('%E0%A4%A', now), null)
  assert.equal(decodeSnapshot('x'.repeat(MAX_ENCODED_LENGTH + 1), now), null)
  assert.equal(validateSnapshot({ ...snapshot, date: '2026-02-30' }, now), null)
  assert.equal(validateSnapshot({ ...snapshot, date: '2027-01-01' }, now), null)
})
