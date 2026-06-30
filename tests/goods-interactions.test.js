const test = require('node:test')
const assert = require('node:assert/strict')

function loadGoodsPage(seed = {}) {
  let page = null
  const data = { ...seed }
  global.Page = (definition) => { page = definition }
  global.wx = {
    getStorageSync(key) { return data[key] },
    setStorageSync(key, value) { data[key] = value },
    removeStorageSync(key) { delete data[key] },
    getStorageInfoSync() { return { keys: Object.keys(data) } }
  }
  delete require.cache[require.resolve('../services/storage.service')]
  delete require.cache[require.resolve('../pages/goods/index')]
  require('../pages/goods/index')
  return page
}

function applySetData(target, patch, callback) {
  Object.entries(patch).forEach(([key, value]) => {
    target.data[key] = value
  })
  if (callback) callback()
}

test('用品页根据刚才的出门建议展示相关用品', () => {
  const page = loadGoodsPage({
    bbc_goods_focus: {
      scene: 'outdoor',
      result: '轻薄内搭，备薄背心或薄外套',
      savedAt: Date.now()
    }
  })
  const context = {
    ...page,
    data: JSON.parse(JSON.stringify(page.data)),
    setData(patch, callback) { applySetData(this, patch, callback) }
  }

  page.refreshFocus.call(context)

  assert.equal(context.data.category, 'clothing')
  assert.equal(context.data.focusTitle, '出门相关用品')
  assert.match(context.data.focusDesc, /轻薄内搭/)
  assert.ok(context.data.focusedGoods.some((item) => item.name.includes('背心')))
  assert.ok(context.data.focusedGoods.some((item) => item.subCategory === 'outer'))
})
