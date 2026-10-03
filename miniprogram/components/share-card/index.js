const { MINI_PROGRAM_CODE_PATH } = require('../../config/share.config')

const CARD_WIDTH = 600
const CARD_HEIGHT = 900
const RENDER_SCALE = 2

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
    async draw() {
      const data = this.data.cardData
      if (!data) return
      this.setData({ generating: true })
      try {
        const canvas = await this.getPosterCanvas()
        canvas.width = CARD_WIDTH * RENDER_SCALE
        canvas.height = CARD_HEIGHT * RENDER_SCALE
        const ctx = canvas.getContext('2d')
        ctx.scale(RENDER_SCALE, RENDER_SCALE)
        const images = await this.loadPosterImages(canvas)
        this.drawPoster({ ctx, images, data })
        wx.canvasToTempFilePath({
          canvas,
          width: CARD_WIDTH * RENDER_SCALE,
          height: CARD_HEIGHT * RENDER_SCALE,
          destWidth: CARD_WIDTH * RENDER_SCALE,
          destHeight: CARD_HEIGHT * RENDER_SCALE,
          success: ({ tempFilePath }) => this.setData({ imagePath: tempFilePath, generating: false }),
          fail: () => {
            this.setData({ generating: false })
            wx.showToast({ title: '生成失败，请稍后重试', icon: 'none' })
          }
        }, this)
      } catch (error) {
        this.setData({ generating: false })
        wx.showToast({ title: '生成失败，请稍后重试', icon: 'none' })
      }
    },
    getPosterCanvas() {
      return new Promise((resolve, reject) => {
        wx.createSelectorQuery()
          .in(this)
          .select('#posterCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            const canvas = res && res[0] && res[0].node
            if (canvas) resolve(canvas)
            else reject(new Error('poster canvas not found'))
          })
      })
    },
    loadCanvasImage(canvas, src) {
      return new Promise((resolve, reject) => {
        const image = canvas.createImage()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error(`failed to load canvas image: ${src}`))
        image.src = src
      })
    },
    async loadPosterImages(canvas) {
      const images = {}
      if (MINI_PROGRAM_CODE_PATH) {
        images.qrcode = await this.loadCanvasImage(canvas, MINI_PROGRAM_CODE_PATH)
      }
      // 衣物缩略图只是锦上添花：任何一张加载失败都不影响海报生成
      const pieces = (this.data.cardData && this.data.cardData.pieces) || []
      images.pieces = await Promise.all(pieces.slice(0, 4).map((piece) => (
        this.loadCanvasImage(canvas, piece.illustration).then((image) => ({ name: piece.name, image })).catch(() => null)
      )))
      images.pieces = images.pieces.filter(Boolean)
      return images
    },
    drawPoster({ ctx, images, data }) {
      const THEMES = {
        indoor: { label: '在家', soft: '#FFE7DB', tint: '#FFF4EE', deep: '#E8603A', ink: '#BF4719' },
        outdoor: { label: '出门', soft: '#DFF4F8', tint: '#F0FAFC', deep: '#2F9BBE', ink: '#19708F' },
        sleep: { label: '睡觉', soft: '#ECECFB', tint: '#F6F6FD', deep: '#6B6FC4', ink: '#4F53B0' }
      }
      const theme = THEMES[data.scene] || THEMES.indoor
      const recommendation = data.recommendations[data.scene] || data.recommendations.indoor
      const result = recommendation.result
      const ageText = data.ageGroup === 'baby_0_6m' ? '0–6 个月' : data.ageGroup === 'baby_6_12m' ? '6–12 个月' : '1–3 岁'
      const temp = data.scene === 'outdoor' ? data.outdoorTemp : data.indoorTemp

      // 背景：场景色顶部渐变 + 奶油底
      ctx.fillStyle = '#FFF9F2'
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
      const sky = ctx.createLinearGradient(0, 0, 0, 380)
      sky.addColorStop(0, theme.soft)
      sky.addColorStop(1, '#FFF9F2')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, CARD_WIDTH, 380)

      // 品牌行
      ctx.fillStyle = '#FF8A65'
      this.fillRoundRect(ctx, 36, 34, 60, 60, 18)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 32px sans-serif'
      ctx.fillText('衣', 48, 76)
      ctx.fillStyle = '#3E3128'
      ctx.font = 'bold 28px sans-serif'
      ctx.fillText('宝宝今天穿什么', 110, 62)
      ctx.fillStyle = '#7A6757'
      ctx.font = '20px sans-serif'
      ctx.fillText(`${data.date || '今天'} · ${data.source === 'api' ? '自动天气' : '手动填写'}`, 110, 90)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      this.fillRoundRect(ctx, 460, 42, 104, 44, 22)
      ctx.fillStyle = theme.ink
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(theme.label, 460 + (104 - ctx.measureText(theme.label).width) / 2, 72)

      // 温度主视觉
      ctx.fillStyle = '#7A6757'
      ctx.font = '22px sans-serif'
      ctx.fillText(data.scene === 'outdoor' ? '室外温度' : '室内温度', 44, 148)
      ctx.fillStyle = theme.deep
      ctx.font = 'bold 84px sans-serif'
      ctx.fillText(String(temp), 44, 228)
      const tempWidth = ctx.measureText(String(temp)).width
      ctx.font = 'bold 34px sans-serif'
      ctx.fillText('℃', 44 + tempWidth + 6, 228)
      ctx.fillStyle = '#7A6757'
      ctx.font = '22px sans-serif'
      ctx.fillText(`宝宝年龄段：${ageText}`, 44, 266)

      // 主卡片：结论 + 衣物缩略图
      ctx.save()
      ctx.shadowColor = 'rgba(190,120,70,0.18)'
      ctx.shadowBlur = 24
      ctx.shadowOffsetY = 8
      ctx.fillStyle = '#FFFFFF'
      this.fillRoundRect(ctx, 32, 296, 536, 300, 36)
      ctx.restore()
      ctx.fillStyle = theme.ink
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(`今天${theme.label}这样穿`, 60, 338)
      ctx.fillStyle = '#3E3128'
      ctx.font = 'bold 38px sans-serif'
      this.drawCenteredWrappedText(ctx, result, 60, 396, 480, 50, 38, 2)

      if (images.pieces && images.pieces.length) {
        const count = images.pieces.length
        const tile = 100
        const gap = 16
        const startX = 300 - (count * tile + (count - 1) * gap) / 2
        images.pieces.forEach((piece, index) => {
          const x = startX + index * (tile + gap)
          ctx.fillStyle = theme.tint
          this.fillRoundRect(ctx, x, 462, tile, tile, 22)
          ctx.drawImage(piece.image, x + 8, 470, tile - 16, tile - 16)
          ctx.fillStyle = '#3E3128'
          ctx.font = '18px sans-serif'
          const name = piece.name.length > 6 ? `${piece.name.slice(0, 5)}…` : piece.name
          ctx.fillText(name, x + (tile - ctx.measureText(name).width) / 2, 462 + tile + 22)
        })
      } else {
        ctx.fillStyle = '#7A6757'
        ctx.font = '22px sans-serif'
        this.drawWrappedText(ctx, recommendation.reason || '', 60, 482, 480, 32, 3)
      }

      // 判断小窍门
      ctx.fillStyle = '#FFF0C9'
      this.fillRoundRect(ctx, 32, 620, 536, 80, 26)
      ctx.fillStyle = '#BF4719'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText('判断小窍门', 58, 653)
      ctx.fillStyle = '#8A5A0E'
      ctx.font = '20px sans-serif'
      ctx.fillText('摸宝宝后颈，温热、不出汗，通常比较合适。', 58, 683)

      // 页脚：免责声明 + 小程序码
      ctx.fillStyle = '#7A6757'
      ctx.font = '17px sans-serif'
      this.drawWrappedText(ctx, '本建议仅供日常穿衣参考，不构成医疗建议。请结合宝宝实际状态判断；如宝宝出现明显不适，请及时咨询医生。', 44, 752, 340, 25, 4)

      if (images.qrcode) {
        ctx.drawImage(images.qrcode, 424, 734, 124, 124)
      } else {
        ctx.strokeStyle = '#E6D3C0'
        ctx.strokeRect(424, 734, 124, 124)
        ctx.fillStyle = '#7A6757'
        ctx.font = '16px sans-serif'
        ctx.fillText('小程序码', 458, 790)
        ctx.fillText('上线前配置', 450, 816)
      }
      ctx.fillStyle = '#A7998B'
      ctx.font = '15px sans-serif'
      ctx.fillText('长按识别小程序码，按你家的情况生成', 44, 868)
    },
    fillRoundRect(ctx, x, y, width, height, radius) {
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
    wrapLines(ctx, text, maxWidth, maxLines) {
      const lines = []
      let line = ''
      const chars = String(text).split('')
      for (let i = 0; i < chars.length; i++) {
        const next = line + chars[i]
        if (ctx.measureText(next).width > maxWidth && line) {
          lines.push(line)
          line = chars[i]
          if (lines.length >= maxLines) {
            line = ''
            break
          }
        } else {
          line = next
        }
      }
      if (line) lines.push(line)
      return lines.slice(0, maxLines)
    },
    drawCenteredWrappedText(ctx, text, x, boxCenterY, maxWidth, lineHeight, fontSize, maxLines = 2) {
      const lines = this.wrapLines(ctx, text, maxWidth, maxLines)
      const visualOffset = fontSize * 0.35
      const firstBaseline = boxCenterY + visualOffset - ((lines.length - 1) * lineHeight) / 2
      lines.forEach((line, index) => ctx.fillText(line, x, firstBaseline + index * lineHeight))
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
