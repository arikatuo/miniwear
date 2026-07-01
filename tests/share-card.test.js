const test = require('node:test')
const assert = require('node:assert/strict')

function loadShareCardComponent() {
  let component = null
  global.Component = (definition) => { component = definition }
  delete require.cache[require.resolve('../components/share-card/index')]
  require('../components/share-card/index')
  return component
}

function createFakeCtx(charWidth = 25) {
  const calls = []
  return {
    calls,
    measureText: (text) => ({ width: text.length * charWidth }),
    fillText: (text, x, y) => calls.push({ text, x, y })
  }
}

test('分享卡推荐文案按实际行数拆分', () => {
  const component = loadShareCardComponent()
  const ctx = createFakeCtx(25)

  const oneLine = component.methods.wrapLines(ctx, '轻薄透气，注意散热', 370, 2)
  assert.deepEqual(oneLine, ['轻薄透气，注意散热'])

  const twoLines = component.methods.wrapLines(ctx, '长袖包屁衣 + 薄裤 + 袜子加一层马甲外套', 370, 2)
  assert.deepEqual(twoLines, ['长袖包屁衣 + 薄裤 + 袜', '子加一层马甲外套'])
})

test('分享卡一行和两行推荐文案围绕同一个中心绘制', () => {
  const component = loadShareCardComponent()
  const ctx = createFakeCtx(25)
  const boxCenterY = 291
  const fontSize = 25
  const lineHeight = 30

  component.methods.drawCenteredWrappedText(ctx, '轻薄透气，注意散热', 156, boxCenterY, 370, lineHeight, fontSize, 2)
  const oneLineCalls = ctx.calls.slice()
  assert.equal(oneLineCalls.length, 1)

  ctx.calls.length = 0
  component.methods.drawCenteredWrappedText(ctx, '长袖包屁衣 + 薄裤 + 袜子加一层马甲外套', 156, boxCenterY, 370, lineHeight, fontSize, 2)
  const twoLineCalls = ctx.calls.slice()
  assert.equal(twoLineCalls.length, 2)

  const meanOffset = (calls) => {
    const meanBaseline = calls.reduce((sum, call) => sum + call.y, 0) / calls.length
    return meanBaseline - boxCenterY
  }
  assert.ok(Math.abs(meanOffset(oneLineCalls) - meanOffset(twoLineCalls)) < 0.01)
  assert.ok(Math.abs(meanOffset(oneLineCalls) - fontSize * 0.35) < 0.01)
})

test('分享卡场景结果使用居中文案绘制方法', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '../components/share-card/index.js'),
    'utf8'
  )
  assert.doesNotMatch(source, /drawWrappedText\(ctx, result,/)
  assert.match(source, /drawCenteredWrappedText\(ctx, result,/)
})
