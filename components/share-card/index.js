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
      ctx.setFillStyle('#FFE5D8')
      this.fillRoundRect(ctx, 32, 30, 536, 142, 28)
      ctx.setFillStyle('#FF8A65')
      this.fillRoundRect(ctx, 48, 52, 78, 78, 22)
      ctx.setFillStyle('#FFFFFF')
      ctx.setFontSize(38)
      ctx.fillText('衣', 72, 102)
      ctx.setFillStyle('#4A3B30')
      ctx.setFontSize(32)
      ctx.fillText('宝宝今天穿什么', 150, 78)
      ctx.setFillStyle('#8A7868')
      ctx.setFontSize(20)
      ctx.fillText(`${data.cityName} · ${data.weatherText} · ${data.outdoorTemp}℃`, 150, 112)
      ctx.fillText(`家里 ${data.indoorTemp}℃ · 给家人的穿衣参考`, 150, 144)

      ctx.setFillStyle('#4A3B30')
      ctx.setFontSize(27)
      ctx.fillText('今天这样照看', 42, 220)
      ctx.setFillStyle('#B7A99B')
      ctx.setFontSize(18)
      ctx.fillText('三种场景分别看，按宝宝状态再微调', 234, 220)

      SCENES.forEach((scene, index) => {
        const result = data.recommendations[scene.key].result
        const y = 248 + index * 112
        ctx.setFillStyle('#FFFFFF')
        this.fillRoundRect(ctx, 38, y, 524, 86, 22)
        ctx.setFillStyle(scene.soft)
        this.fillRoundRect(ctx, 56, y + 18, 78, 50, 22)
        ctx.setFillStyle(scene.deep)
        ctx.setFontSize(20)
        ctx.fillText(scene.label, 76, y + 52)
        ctx.setFillStyle('#4A3B30')
        ctx.setFontSize(25)
        this.drawWrappedText(ctx, result, 156, y + 40, 370, 30, 2)
      })

      ctx.setFillStyle('#FFF0C7')
      this.fillRoundRect(ctx, 38, 604, 524, 82, 24)
      ctx.setFillStyle('#E8643A')
      ctx.setFontSize(21)
      ctx.fillText('判断小窍门', 64, 642)
      ctx.setFillStyle('#8A6234')
      ctx.setFontSize(19)
      this.drawWrappedText(ctx, '摸宝宝后颈，温热、不出汗，通常比较合适。', 180, 642, 336, 26, 2)

      ctx.setFillStyle('#8A7868')
      ctx.setFontSize(17)
      this.drawWrappedText(ctx, '本建议仅供日常穿衣参考，不构成医疗建议。请结合宝宝实际状态判断；如宝宝出现明显不适，请及时咨询医生。', 44, 746, 340, 25, 4)

      if (codeImagePath) {
        ctx.drawImage(codeImagePath, 424, 734, 124, 124)
      } else {
        ctx.setStrokeStyle('#E8D9C8')
        ctx.strokeRect(424, 734, 124, 124)
        ctx.setFillStyle('#8A7868')
        ctx.setFontSize(16)
        ctx.fillText('小程序码', 458, 790)
        ctx.fillText('上线前配置', 450, 816)
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
