const LEVELS = {
  VERY_THIN: 1,
  THIN: 2,
  STANDARD: 3,
  WARM: 4,
  THICK: 5,
  VERY_THICK: 6
}

const recommendRules = {
  indoor: [
    { max: 15, level: 6, result: '保暖连体衣 + 薄外套', reason: '室温偏低，建议优先改善室温并注意保暖。' },
    { min: 16, max: 18, level: 5, result: '连体衣 + 薄背心 / 薄外套', reason: '室温较凉，适合用轻便外层保暖。' },
    { min: 19, max: 21, level: 4, result: '长袖包屁衣 + 薄裤 + 袜子', reason: '室温稍凉，长袖和薄裤更容易保持舒适。' },
    { min: 22, max: 24, level: 3, result: '长袖包屁衣 + 薄裤', reason: '室温较舒适，适合轻薄穿着，避免捂热。' },
    { min: 25, max: 27, level: 2, result: '短袖包屁衣 / 薄连体衣', reason: '室温偏暖，轻薄透气更合适。' },
    { min: 28, level: 1, result: '轻薄透气，注意散热', reason: '室温较高，应减少层数并留意出汗。' }
  ],
  outdoor: [
    { max: 10, level: 6, result: '长袖内搭 + 棉服 + 加绒长裤', reason: '室外较冷，建议缩短户外停留时间并注意保暖。' },
    { min: 11, max: 15, level: 5, result: '长袖内搭 + 外套 + 常规长裤', reason: '室外偏冷，需要完整的内外层搭配。' },
    { min: 16, max: 20, level: 4, result: '长袖内搭 + 薄外套 + 薄长裤', reason: '室外较凉，可比室内多一层并注意防风。' },
    { min: 21, max: 24, level: 3, result: '轻薄内搭，备薄背心或薄外套', reason: '室外温和，薄外层备用即可。' },
    { min: 25, max: 28, level: 2, result: '短袖包屁衣 / 轻薄套装', reason: '室外偏暖，选择轻薄透气的衣物。' },
    { min: 29, level: 1, result: '轻薄透气，减少层数', reason: '室外较热，应注意散热、防晒和补水。' }
  ],
  sleep: [
    { max: 16, level: 6, result: '保暖睡衣 + 偏厚睡袋', reason: '睡眠环境偏冷，建议优先改善室温并谨慎使用偏厚睡袋。' },
    { min: 17, max: 19, level: 5, result: '夹棉睡袋 / 厚棉睡袋', reason: '室温较凉，夹棉睡袋有助于保持稳定体感。' },
    { min: 20, max: 22, level: 4, result: '6 层纱布睡袋 / 薄夹棉睡袋', reason: '室温稍凉，可选择中等保暖的睡袋。' },
    { min: 23, max: 25, level: 3, result: '薄睡袋 / 4 层纱布睡袋', reason: '室温舒适，薄睡袋通常更合适。' },
    { min: 26, max: 28, level: 2, result: '很薄睡袋 / 纱布盖毯', reason: '室温偏暖，睡觉时尤其要避免盖太厚。' },
    { min: 29, level: 1, result: '贴身衣物，注意降温通风', reason: '室温较高，建议先改善通风和降温。' }
  ],
  ageText: {
    baby_0_6m: '小月龄宝宝建议更谨慎，避免过冷也避免捂热。',
    baby_6_12m: '请重点观察后颈和出汗情况。',
    baby_1_3y: '活动量较大，活动后注意观察出汗并及时增减。',
    fallback_3y_plus: '本产品主要面向 0-3 岁宝宝，当前按 1-3 岁规则提供参考。'
  },
  ageModifiers: {
    baby_0_6m: { indoor: 1, outdoor: 1, sleep: 0 },
    baby_6_12m: { indoor: 0, outdoor: 0, sleep: 0 },
    baby_1_3y: { indoor: -1, outdoor: -1, sleep: 0 },
    fallback_3y_plus: { indoor: -1, outdoor: -1, sleep: 0 }
  },
  resultByLevel: {
    indoor: {
      1: '轻薄透气，注意散热',
      2: '短袖包屁衣 / 薄连体衣',
      3: '长袖包屁衣 + 薄裤',
      4: '长袖包屁衣 + 薄裤 + 袜子',
      5: '连体衣 + 薄背心 / 薄外套',
      6: '保暖连体衣 + 薄外套'
    },
    outdoor: {
      1: '轻薄透气，减少层数',
      2: '短袖包屁衣 / 轻薄套装',
      3: '轻薄内搭，备薄背心或薄外套',
      4: '长袖内搭 + 薄外套 + 薄长裤',
      5: '长袖内搭 + 外套 + 常规长裤',
      6: '长袖内搭 + 棉服 + 加绒长裤'
    },
    sleep: {
      1: '贴身衣物，注意降温通风',
      2: '很薄睡袋 / 纱布盖毯',
      3: '薄睡袋 / 4 层纱布睡袋',
      4: '6 层纱布睡袋 / 薄夹棉睡袋',
      5: '夹棉睡袋 / 厚棉睡袋',
      6: '保暖睡衣 + 偏厚睡袋'
    }
  }
}

const iconByLevel = {
  wear: {
    1: '/assets/icons/recommend/wear-level-1.svg',
    2: '/assets/icons/recommend/wear-level-2.svg',
    3: '/assets/icons/recommend/wear-level-3.svg',
    4: '/assets/icons/recommend/wear-level-4.svg',
    5: '/assets/icons/recommend/wear-level-5.svg',
    6: '/assets/icons/recommend/wear-level-6.svg'
  },
  sleep: {
    1: '/assets/icons/recommend/sleep-level-1.svg',
    2: '/assets/icons/recommend/sleep-level-2.svg',
    3: '/assets/icons/recommend/sleep-level-3.svg',
    4: '/assets/icons/recommend/sleep-level-4.svg',
    5: '/assets/icons/recommend/sleep-level-5.svg',
    6: '/assets/icons/recommend/sleep-level-6.svg'
  }
}

module.exports = { LEVELS, recommendRules, iconByLevel }
