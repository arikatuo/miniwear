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
      ctx.setFillStyle('#F7FBFF')
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
      ctx.setFillStyle('#3478B9')
      ctx.fillRect(0, 0, CARD_WIDTH, 18)
      ctx.setFillStyle('#253342')
      ctx.setFontSize(34)
      ctx.fillText('宝宝今天穿什么', 44, 76)
      ctx.setFillStyle('#607487')
      ctx.setFontSize(22)
      ctx.fillText(`${data.cityName} · ${data.weatherText} · ${data.outdoorTemp}℃`, 44, 116)
      ctx.fillText(`家里 ${data.indoorTemp}℃`, 44, 150)
      ctx.setFillStyle('#253342')
      ctx.setFontSize(28)
      ctx.fillText('今天宝宝这样穿', 44, 208)
      const scenes = [
        ['在家', data.recommendations.indoor.result],
        ['出门', data.recommendations.outdoor.result],
        ['睡觉', data.recommendations.sleep.result]
      ]
      scenes.forEach((scene, index) => {
        const y = 245 + index * 130
        ctx.setFillStyle('#FFFFFF')
        ctx.fillRect(38, y, 524, 104)
        ctx.setFillStyle('#3478B9')
        ctx.setFontSize(21)
        ctx.fillText(scene[0], 62, y + 34)
        ctx.setFillStyle('#253342')
        ctx.setFontSize(24)
        this.drawWrappedText(ctx, scene[1], 62, y + 72, 460, 30)
      })
      ctx.setFillStyle('#E9F3FC')
      ctx.fillRect(38, 650, 524, 62)
      ctx.setFillStyle('#3478B9')
      ctx.setFontSize(20)
      ctx.fillText('后颈温热、不出汗，通常比较合适', 62, 688)
      if (codeImagePath) {
        ctx.drawImage(codeImagePath, 438, 736, 112, 112)
      } else {
        ctx.setStrokeStyle('#B9C9D6')
        ctx.strokeRect(438, 736, 112, 112)
        ctx.setFillStyle('#718096')
        ctx.setFontSize(14)
        ctx.fillText('小程序码', 465, 792)
        ctx.fillText('上线前配置', 456, 814)
      }
      ctx.setFillStyle('#718096')
      ctx.setFontSize(15)
      this.drawWrappedText(ctx, '本建议仅供日常穿衣参考，不构成医疗建议。请结合宝宝实际状态判断；如宝宝出现明显不适，请及时咨询医生。', 44, 748, 360, 24)
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
    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
      let line = ''
      let currentY = y
      String(text).split('').forEach((char) => {
        const next = line + char
        if (ctx.measureText(next).width > maxWidth && line) {
          ctx.fillText(line, x, currentY)
          line = char
          currentY += lineHeight
        } else {
          line = next
        }
      })
      if (line) ctx.fillText(line, x, currentY)
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
