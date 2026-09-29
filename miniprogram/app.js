const storage = require('./services/storage.service')

App({
  onLaunch() {
    storage.initialize()
    this.setupUpdateManager()
  },

  setupUpdateManager() {
    if (!wx.canIUse || !wx.canIUse('getUpdateManager')) return
    const manager = wx.getUpdateManager()
    manager.onUpdateReady(() => {
      wx.showModal({
        title: '发现新版本',
        content: '新的穿搭规则已经准备好，是否立即重启更新？',
        success: ({ confirm }) => {
          if (confirm) manager.applyUpdate()
        }
      })
    })
  }
})
