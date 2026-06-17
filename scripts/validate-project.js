const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const errors = []

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

const ignoredWalkDirectories = new Set(['.git', '.omx', 'node_modules', '衣柜床品图案'])

function walk(directory, extension) {
  const absolute = path.join(root, directory)
  if (!fs.existsSync(absolute)) return []
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredWalkDirectories.has(entry.name)) return []
    const relative = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(relative, extension) : entry.name.endsWith(extension) ? [relative] : []
  })
}

function normalizeRelativePath(relativePath) {
  return relativePath.replace(/\\/g, '/')
}

function validateJson(relativePath) {
  try {
    JSON.parse(read(relativePath))
  } catch (error) {
    errors.push(`${relativePath}: JSON 无效 - ${error.message}`)
  }
}

walk('.', '.json')
  .forEach(validateJson)

const appConfig = JSON.parse(read('app.json'))
const projectConfig = JSON.parse(read('project.config.json'))
for (const page of appConfig.pages) {
  for (const extension of ['.js', '.json', '.wxml', '.wxss']) {
    const file = `${page}${extension}`
    if (!exists(file)) errors.push(`${file}: 页面文件缺失`)
  }
}

const componentRoots = fs.readdirSync(path.join(root, 'components'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `components/${entry.name}/index`)

for (const component of componentRoots) {
  for (const extension of ['.js', '.json', '.wxml', '.wxss']) {
    const file = `${component}${extension}`
    if (!exists(file)) errors.push(`${file}: 组件文件缺失`)
  }
}

for (const jsonFile of walk('pages', '.json')) {
  const config = JSON.parse(read(jsonFile))
  Object.values(config.usingComponents || {}).forEach((componentPath) => {
    const base = componentPath.replace(/^\//, '')
    if (!exists(`${base}.json`)) errors.push(`${jsonFile}: 组件 ${componentPath} 不存在`)
  })
}

for (const jsFile of walk('.', '.js')) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, jsFile)], { encoding: 'utf8' })
  if (result.status !== 0) errors.push(`${jsFile}: JavaScript 语法错误\n${result.stderr.trim()}`)
}

const unsupportedWxml = [/\.includes\s*\(/, /\.map\s*\(/, /\?\./]
for (const wxmlFile of walk('.', '.wxml')) {
  const content = read(wxmlFile)
  if (/wx:for="\{\{\s*\[/.test(content)) errors.push(`${wxmlFile}: wx:for 请绑定 data 字段，不要直接使用数组字面量`)
  unsupportedWxml.forEach((pattern) => {
    if (pattern.test(content)) errors.push(`${wxmlFile}: 含不兼容的 WXML 表达式 ${pattern}`)
  })
}

const bannedHealthPhrases = ['保证不冷', '保证不热', '医学建议', '专业诊断']
for (const file of [...walk('pages', '.wxml'), ...walk('components', '.wxml')]) {
  const content = read(file)
  bannedHealthPhrases.forEach((phrase) => {
    if (content.includes(phrase)) errors.push(`${file}: 出现禁止健康文案“${phrase}”`)
  })
}

const today = read('pages/today/index.wxml')
const privacy = read('pages/privacy/index.wxml')
const share = read('components/share-card/index.js')
const shareStyle = read('components/share-card/index.wxss')
const shareConfig = require(path.join(root, 'config/share.config'))
if (!today.includes('不构成医疗建议')) errors.push('今日页缺少健康免责声明')
if (!privacy.includes('不构成医疗建议')) errors.push('隐私页缺少健康免责声明')
if (!share.includes('不构成医疗建议')) errors.push('分享卡缺少健康免责声明')
if (!share.includes('如宝宝出现明显不适，请及时咨询医生')) errors.push('分享卡免责声明不完整')
if (!share.includes('MINI_PROGRAM_CODE_PATH') || !share.includes('drawImage')) errors.push('分享卡未实现固定小程序码绘制')
if (!share.includes('CARD_HEIGHT = 900') || !share.includes('destHeight: 1800') || !shareStyle.includes('height: 900px')) {
  errors.push('分享卡画布尺寸未同步到高清输出高度')
}
if (shareConfig.MINI_PROGRAM_CODE_PATH && !exists(shareConfig.MINI_PROGRAM_CODE_PATH.replace(/^\//, ''))) {
  errors.push(`分享卡小程序码资源不存在: ${shareConfig.MINI_PROGRAM_CODE_PATH}`)
}

const { goods } = require(path.join(root, 'config/goods.config'))
const goodsPage = read('pages/goods/index.js')
if (!goodsPage.includes('warmText')) errors.push('用品页未使用格式化后的保暖值文案')
if (goods.length < 50) errors.push(`用品配置至少应包含 50 个完整截图商品条目，当前 ${goods.length} 个`)
const referencedGoodsAssets = new Set(['assets/goods/default.png'])
for (const item of goods) {
  const asset = normalizeRelativePath(item.illustration.replace(/^\//, ''))
  referencedGoodsAssets.add(asset)
  if (!exists(asset)) errors.push(`用品 ${item.id} 的插画不存在: ${asset}`)
  if (!Number.isFinite(item.warmValue)) errors.push(`用品 ${item.id} 的保暖值必须为数字`)
}
if (!exists('assets/goods/default.png')) errors.push('缺少用品默认占位图')
for (const pngFile of walk('assets/goods', '.png')) {
  const normalizedPngFile = normalizeRelativePath(pngFile)
  if (!referencedGoodsAssets.has(normalizedPngFile)) errors.push(`${normalizedPngFile}: 用品图片未被配置引用`)
  const buffer = fs.readFileSync(path.join(root, pngFile))
  if (buffer.readUInt32BE(16) !== 400 || buffer.readUInt32BE(20) !== 400) {
    errors.push(`${pngFile}: 插画尺寸必须为 400x400`)
  }
}

if (!appConfig.permission || !appConfig.permission['scope.userLocation']) {
  errors.push('app.json 缺少定位用途说明')
}

const ignoredPackageFiles = (projectConfig.packOptions && projectConfig.packOptions.ignore || [])
  .map((item) => `${item.type}:${item.value}`)
for (const expected of [
  'folder:docs',
  'folder:tests',
  'folder:scripts',
  'folder:衣柜床品图案',
  'file:宝宝今天穿什么_V1.0_最终版PRD.pdf'
]) {
  if (!ignoredPackageFiles.includes(expected)) errors.push(`project.config.json 上传忽略配置缺少 ${expected}`)
}

if (errors.length) {
  console.error(`项目校验失败，共 ${errors.length} 项：`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`项目校验通过：${appConfig.pages.length} 个页面，${componentRoots.length} 个组件。`)
if (!shareConfig.MINI_PROGRAM_CODE_PATH) {
  console.warn('发布提醒：尚未配置固定小程序码，分享卡会显示“上线前配置”占位。')
}
