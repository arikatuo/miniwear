const { MINI_PROGRAM_CODE_PATH } = require('../../config/share.config')

const CARD_WIDTH = 600
const CARD_HEIGHT = 900

Component({
  data: {
    visible: false,
    generating: false,
    imagePath: '',
    cardData: null
  },
  methods: {
    open(cardData) {
      this.setData({ visible: true, cardData, imagePath: '' }, () => this.draw())
    },
    close() { this.setData({ visible: false }) },
    stop() {},
    draw() {
      const data = this.data.cardData
      if (!data) return
      this.setData({ generating: true })
      if (MINI_PROGRAM_CODE_PATH) {
        wx.getImageInfo({
          src: MINI_PROGRAM_CODE_PATH,
          success: ({ path }) => this.drawCanvas(path),
          fail: () => this.drawCanvas('')
        })
        return
      }
      this.drawCanvas('')
    },
    drawCanvas(codeImagePath) {
      const data = this.data.cardData
      const ctx = wx.createCanvasContext('shareCanvas', this)
      const SCENES = [
        { key: 'indoor', label: '在家', color: '#FF8A65', soft: '#FFE0D1', deep: '#E8643A' },
        { key: 'outdoor', label: '出门', color: '#4FB8D6', soft: '#DFF4F8', deep: '#2E86A8' },
        { key: 'sleep', label: '睡觉', color: '#8B8FE0', soft: '#ECECFB', deep: '#5A5EC9' }
      ]
      ctx.setFillStyle('#FFF8EF')
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
      ctx.setFillStyle('#FFE0D1')
      this.fillRoundRect(ctx, 30, 28, 540, 156, 28)
      ctx.setFillStyle('#FF8A65')
      this.fillRoundRect(ctx, 44, 46, 90, 90, 24)
      ctx.setFillStyle('#FFFFFF')
      ctx.setFontSize(42)
      ctx.fillText('衣', 70, 105)
      ctx.setFillStyle('#4A3B30')
      ctx.setFontSize(36)
      ctx.fillText('宝宝今天穿什么', 154, 78)
      ctx.setFillStyle('#8A7868')
      ctx.setFontSize(21)
      ctx.fillText(`${data.cityName} · ${data.weatherText} · ${data.outdoorTemp}℃`, 154, 114)
      ctx.fillText(`家里 ${data.indoorTemp}℃ · 给家人的穿衣参考`, 154, 148)

      ctx.setFillStyle('#4A3B30')
      ctx.setFontSize(28)
      ctx.fillText('今天这样照看', 42, 224)
      ctx.setFillStyle('#B7A99B')
      ctx.setFontSize(18)
      ctx.fillText('三种场景分别看，按宝宝状态再微调', 238, 224)

      SCENES.forEach((scene, index) => {
        const result = data.recommendations[scene.key].result
        const y = 252 + index * 122
        ctx.setFillStyle('#FFFFFF')
        this.fillRoundRect(ctx, 38, y, 524, 96, 22)
        ctx.setFillStyle(scene.soft)
        this.fillRoundRect(ctx, 56, y + 22, 82, 52, 22)
        ctx.setFillStyle(scene.deep)
        ctx.setFontSize(21)
        ctx.fillText(scene.label, 78, y + 56)
        ctx.setFillStyle('#4A3B30')
        ctx.setFontSize(27)
        this.drawWrappedText(ctx, result, 158, y + 44, 362, 32, 2)
      })

      ctx.setFillStyle('#FFF0C7')
      this.fillRoundRect(ctx, 38, 636, 524, 78, 24)
      ctx.setFillStyle('#E8643A')
      ctx.setFontSize(22)
      ctx.fillText('判断小窍门', 64, 674)
      ctx.setFillStyle('#8A6234')
      ctx.setFontSize(20)
      this.drawWrappedText(ctx, '摸宝宝后颈，温热、不出汗，通常比较合适。', 184, 674, 330, 26, 2)

      ctx.setFillStyle('#8A7868')
      ctx.setFontSize(16)
      this.drawWrappedText(ctx, '本建议仅供日常穿衣参考，不构成医疗建议。请结合宝宝实际状态判断；如宝宝出现明显不适，请及时咨询医生。', 44, 764, 346, 24, 4)

      if (codeImagePath) {
        ctx.drawImage(codeImagePath, 424, 738, 124, 124)
      } else {
        ctx.setStrokeStyle('#E8D9C8')
        ctx.strokeRect(424, 738, 124, 124)
        ctx.setFillStyle('#8A7868')
        ctx.setFontSize(16)
        ctx.fillText('小程序码', 458, 794)
        ctx.fillText('上线前配置', 450, 820)
      }
      ctx.setFillStyle('#B7A99B')
      ctx.setFontSize(15)
      ctx.fillText('宝宝今天穿什么', 44, 862)
      ctx.draw(false, () => {
        wx.canvasToTempFilePath({
          canvasId: 'shareCanvas',
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          destWidth: 1200,
          destHeight: 1800,
          success: ({ tempFilePath }) => this.setData({ imagePath: tempFilePath, generating: false }),
          fail: () => {
            this.setData({ generating: false })
            wx.showToast({ title: '生成失败，请稍后重试', icon: 'none' })
          }
        }, this)
      })
    },
    fillRoundRect(ctx, x, y, width, height, radius) {
      if (!ctx.beginPath || !ctx.quadraticCurveTo) {
        ctx.fillRect(x, y, width, height)
        return
      }
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      ctx.lineTo(x + radius, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()
    },
    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
      let line = ''
      let currentY = y
      let lines = 1
      String(text).split('').some((char) => {
        const next = line + char
        if (ctx.measureText(next).width > maxWidth && line) {
          ctx.fillText(line, x, currentY)
          line = char
          currentY += lineHeight
          lines += 1
          return lines > maxLines
        } else {
          line = next
        }
        return false
      })
      if (line && lines <= maxLines) ctx.fillText(line, x, currentY)
    },
    save() {
      if (!this.data.imagePath) return
      wx.saveImageToPhotosAlbum({
        filePath: this.data.imagePath,
        success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
        fail: () => wx.showToast({ title: '保存失败，请检查相册权限', icon: 'none' })
      })
    }
  }
})
