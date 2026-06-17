const goods = [
  { id: 'wrap_bodysuit', name: '包屁衣', category: 'clothing', subCategory: 'inner', warmValue: 2, tempRange: '加温参考 +2℃', scenes: ['在家', '睡觉'], desc: '贴身基础层，适合日常打底。', illustration: '/assets/goods/wrap-bodysuit.png' },
  { id: 'romper', name: '连体衣', category: 'clothing', subCategory: 'inner', warmValue: 2, tempRange: '加温参考 +2℃', scenes: ['在家', '睡觉'], desc: '一体式穿着，减少腰腹受凉。', illustration: '/assets/goods/romper.png' },
  { id: 'cotton_vest', name: '纯棉背心', category: 'clothing', subCategory: 'inner', warmValue: 2, tempRange: '加温参考 +2℃', scenes: ['在家', '出门'], desc: '适合在基础层上轻量叠穿。', illustration: '/assets/goods/cotton-vest.png' },
  { id: 'air_cotton_romper', name: '空气棉连体衣', category: 'clothing', subCategory: 'inner', warmValue: 3, tempRange: '加温参考 +3℃', scenes: ['在家', '睡觉'], desc: '比普通连体衣略厚，适合室温稍凉时。', illustration: '/assets/goods/air-cotton-romper.png' },
  { id: 'fleece_romper', name: '加绒连体衣', category: 'clothing', subCategory: 'inner', warmValue: 5, tempRange: '加温参考 +5℃', scenes: ['在家', '睡觉'], desc: '偏保暖的一体衣，注意观察出汗。', illustration: '/assets/goods/fleece-romper.png' },
  { id: 'padded_romper_40g', name: '40克夹棉连体衣', category: 'clothing', subCategory: 'inner', warmValue: 4, tempRange: '加温参考 +4℃', scenes: ['在家', '睡觉'], desc: '轻量夹棉款，适合偏凉环境。', illustration: '/assets/goods/padded-romper-40g.png' },
  { id: 'padded_romper_60g', name: '60克夹棉连体衣', category: 'clothing', subCategory: 'inner', warmValue: 5, tempRange: '加温参考 +5℃', scenes: ['在家', '睡觉'], desc: '中等保暖夹棉款，适合室温较低时。', illustration: '/assets/goods/padded-romper-60g.png' },
  { id: 'padded_romper_80g', name: '80克夹棉连体衣', category: 'clothing', subCategory: 'inner', warmValue: 6, tempRange: '加温参考 +6℃', scenes: ['在家', '睡觉'], desc: '保暖性更强，需避免捂热。', illustration: '/assets/goods/padded-romper-80g.png' },
  { id: 'padded_romper_120g', name: '120克夹棉连体衣', category: 'clothing', subCategory: 'inner', warmValue: 7, tempRange: '加温参考 +7℃', scenes: ['在家', '睡觉'], desc: '厚夹棉款，适合低温时短时参考。', illustration: '/assets/goods/padded-romper-120g.png' },
  { id: 'padded_romper_160g', name: '160克夹棉连体衣', category: 'clothing', subCategory: 'inner', warmValue: 9, tempRange: '加温参考 +9℃', scenes: ['在家', '睡觉'], desc: '偏厚连体衣，使用时重点观察后颈和出汗。', illustration: '/assets/goods/padded-romper-160g.png' },
  { id: 'padded_romper_180g', name: '180克夹棉连体衣', category: 'clothing', subCategory: 'inner', warmValue: 10, tempRange: '加温参考 +10℃', scenes: ['在家', '睡觉'], desc: '厚保暖款，建议低温环境谨慎使用。', illustration: '/assets/goods/padded-romper-180g.png' },
  { id: 'fleece_padded_romper_180g', name: '180克夹棉加绒连体衣', category: 'clothing', subCategory: 'inner', warmValue: 22, tempRange: '加温参考 +22℃', scenes: ['在家', '睡觉'], desc: '非常厚的保暖款，优先用于极低温短时参考。', illustration: '/assets/goods/fleece-padded-romper-180g.png' },
  { id: 'padded_romper_200g', name: '200克夹棉连体衣', category: 'clothing', subCategory: 'inner', warmValue: 11, tempRange: '加温参考 +11℃', scenes: ['在家', '睡觉'], desc: '厚夹棉款，注意避免长时间过热。', illustration: '/assets/goods/padded-romper-200g.png' },
  { id: 'padded_romper_240g', name: '240克夹棉连体衣', category: 'clothing', subCategory: 'inner', warmValue: 12, tempRange: '加温参考 +12℃', scenes: ['在家', '睡觉'], desc: '厚保暖款，适合低温时作为参考。', illustration: '/assets/goods/padded-romper-240g.png' },
  { id: 'light_down_jacket', name: '轻薄羽绒服', category: 'clothing', subCategory: 'outer', warmValue: 5, tempRange: '加温参考 +5℃', scenes: ['出门'], desc: '低温外出时增加保暖，进室内及时调整。', illustration: '/assets/goods/light-down-jacket.png' },
  { id: 'down_suit', name: '羽绒服', category: 'clothing', subCategory: 'outer', warmValue: 12, tempRange: '加温参考 +12℃', scenes: ['出门'], desc: '强保暖外层，适合冷天外出。', illustration: '/assets/goods/down-suit.png' },
  { id: 'air_cotton_vest', name: '空气棉马甲', category: 'clothing', subCategory: 'outer', warmValue: 3, tempRange: '加温参考 +3℃', scenes: ['在家', '出门'], desc: '方便增减的一层，适合护住前胸后背。', illustration: '/assets/goods/air-cotton-vest.png' },
  { id: 'padded_vest', name: '夹棉马甲', category: 'clothing', subCategory: 'outer', warmValue: 4, tempRange: '加温参考 +4℃', scenes: ['在家', '出门'], desc: '比普通马甲更保暖，便于活动。', illustration: '/assets/goods/padded-vest.png' },
  { id: 'cotton_autumn_top', name: '纯棉秋衣', category: 'clothing', subCategory: 'inner', warmValue: 1, tempRange: '加温参考 +1℃', scenes: ['在家', '睡觉'], desc: '长袖棉质上衣，作为贴身基础层。', illustration: '/assets/goods/cotton-autumn-top.png' },
  { id: 'cotton_autumn_pants', name: '纯棉秋裤', category: 'clothing', subCategory: 'pants', warmValue: 1, tempRange: '加温参考 +1℃', scenes: ['在家', '出门'], desc: '柔软长裤，方便宝宝活动。', illustration: '/assets/goods/cotton-autumn-pants.png' },
  { id: 'sweatshirt', name: '卫衣', category: 'clothing', subCategory: 'outer', warmValue: 3, tempRange: '加温参考 +3℃', scenes: ['在家', '出门'], desc: '日常外层，适合温和偏凉环境。', illustration: '/assets/goods/sweatshirt.png' },
  { id: 'fleece_sweatshirt', name: '加绒卫衣', category: 'clothing', subCategory: 'outer', warmValue: 4, tempRange: '加温参考 +4℃', scenes: ['在家', '出门'], desc: '比普通卫衣更保暖，活动后注意出汗。', illustration: '/assets/goods/fleece-sweatshirt.png' },
  { id: 'cardigan', name: '毛衣', category: 'clothing', subCategory: 'outer', warmValue: 3, tempRange: '加温参考 +3℃', scenes: ['在家', '出门'], desc: '适合叠穿的柔软外层。', illustration: '/assets/goods/cardigan.png' },
  { id: 'thick_cardigan', name: '加厚毛衣', category: 'clothing', subCategory: 'outer', warmValue: 4, tempRange: '加温参考 +4℃', scenes: ['在家', '出门'], desc: '较厚外层，低温时辅助保暖。', illustration: '/assets/goods/thick-cardigan.png' },
  { id: 'jacket', name: '外套', category: 'clothing', subCategory: 'outer', warmValue: 3, tempRange: '加温参考 +3℃', scenes: ['出门'], desc: '常规外出外层，可按天气增减。', illustration: '/assets/goods/jacket.png' },
  { id: 'fleece_jacket', name: '加绒外套', category: 'clothing', subCategory: 'outer', warmValue: 4, tempRange: '加温参考 +4℃', scenes: ['出门'], desc: '偏保暖外套，适合冷风天气。', illustration: '/assets/goods/fleece-jacket.png' },
  { id: 'padded_jacket', name: '夹棉外套', category: 'clothing', subCategory: 'outer', warmValue: 5, tempRange: '加温参考 +5℃', scenes: ['出门'], desc: '夹棉外层，冷天外出参考。', illustration: '/assets/goods/padded-jacket.png' },
  { id: 'socks', name: '袜子', category: 'clothing', subCategory: 'accessory', warmValue: 0, tempRange: '加温参考 +0℃', scenes: ['在家', '出门'], desc: '脚部偏凉时作为轻量补充。', illustration: '/assets/goods/socks.png' },
  { id: 'thick_socks', name: '厚袜子', category: 'clothing', subCategory: 'accessory', warmValue: 0, tempRange: '加温参考 +0℃', scenes: ['在家', '出门'], desc: '脚部保暖补充，请避免过厚出汗。', illustration: '/assets/goods/thick-socks.png' },
  { id: 'short_sleeve_tshirt', name: '短袖T恤', category: 'clothing', subCategory: 'inner', warmValue: 1, tempRange: '加温参考 +1℃', scenes: ['在家', '出门'], desc: '轻薄上衣，适合偏暖环境。', illustration: '/assets/goods/short-sleeve-tshirt.png' },
  { id: 'shorts', name: '短裤', category: 'clothing', subCategory: 'pants', warmValue: 0, tempRange: '加温参考 +0℃', scenes: ['在家', '出门'], desc: '高温天气下的轻薄下装。', illustration: '/assets/goods/shorts.png' },
  { id: 'short_sleeve_dress', name: '短袖连衣裙', category: 'clothing', subCategory: 'inner', warmValue: 1, tempRange: '加温参考 +1℃', scenes: ['在家', '出门'], desc: '偏暖天气的轻薄穿搭。', illustration: '/assets/goods/short-sleeve-dress.png' },
  { id: 'dress', name: '连衣裙', category: 'clothing', subCategory: 'inner', warmValue: 2, tempRange: '加温参考 +2℃', scenes: ['在家', '出门'], desc: '长袖连衣裙款，适合温和天气。', illustration: '/assets/goods/dress.png' },
  { id: 'long_sleeve_tshirt', name: '长袖T恤', category: 'clothing', subCategory: 'inner', warmValue: 2, tempRange: '加温参考 +2℃', scenes: ['在家', '出门'], desc: '常规长袖基础层。', illustration: '/assets/goods/long-sleeve-tshirt.png' },
  { id: 'sleeveless_top', name: '无袖', category: 'clothing', subCategory: 'inner', warmValue: 0, tempRange: '加温参考 +0℃', scenes: ['在家'], desc: '炎热环境下的轻薄选择。', illustration: '/assets/goods/sleeveless-top.png' },
  { id: 'short_sleeve_bodysuit', name: '短袖包屁衣', category: 'clothing', subCategory: 'inner', warmValue: 1, tempRange: '加温参考 +1℃', scenes: ['在家', '睡觉'], desc: '轻薄贴身，适合偏暖环境。', illustration: '/assets/goods/short-sleeve-bodysuit.png' },
  { id: 'short_sleeve_romper', name: '短袖连体衣', category: 'clothing', subCategory: 'inner', warmValue: 1, tempRange: '加温参考 +1℃', scenes: ['在家', '睡觉'], desc: '短袖一体款，适合偏暖室温。', illustration: '/assets/goods/short-sleeve-romper.png' },
  { id: 'thick_padded_sleeping_bag', name: '厚夹棉睡袋', category: 'sleep', subCategory: 'sleeping_bag', warmValue: 6, tempRange: '适合 0-10℃', scenes: ['睡觉'], desc: '克数 220-260，低温睡眠环境参考。', illustration: '/assets/goods/thick-padded-sleeping-bag.png' },
  { id: 'medium_padded_sleeping_bag', name: '偏厚夹棉睡袋', category: 'sleep', subCategory: 'sleeping_bag', warmValue: 5, tempRange: '适合 5-15℃', scenes: ['睡觉'], desc: '克数 160-200，偏冷睡眠环境参考。', illustration: '/assets/goods/medium-padded-sleeping-bag.png' },
  { id: 'cotton_padded_sleeping_bag', name: '夹棉睡袋', category: 'sleep', subCategory: 'sleeping_bag', warmValue: 4, tempRange: '适合 10-18℃', scenes: ['睡觉'], desc: '克数 120-160，适合较凉室温。', illustration: '/assets/goods/cotton-padded-sleeping-bag.png' },
  { id: 'thin_padded_sleeping_bag', name: '薄夹棉睡袋', category: 'sleep', subCategory: 'sleeping_bag', warmValue: 3, tempRange: '适合 15-20℃', scenes: ['睡觉'], desc: '克数 60-100，适合室温稍凉时。', illustration: '/assets/goods/thin-padded-sleeping-bag.png' },
  { id: 'six_layer_gauze_sleeping_bag', name: '6层纱布睡袋', category: 'sleep', subCategory: 'sleeping_bag', warmValue: 2, tempRange: '适合 19-23℃', scenes: ['睡觉'], desc: '透气纱布睡袋，适合舒适室温。', illustration: '/assets/goods/six-layer-gauze-sleeping-bag.png' },
  { id: 'four_layer_gauze_sleeping_bag', name: '4层纱布睡袋', category: 'sleep', subCategory: 'sleeping_bag', warmValue: 2, tempRange: '适合 21-26℃', scenes: ['睡觉'], desc: '更轻薄的纱布睡袋，适合偏暖室温。', illustration: '/assets/goods/four-layer-gauze-sleeping-bag.png' },
  { id: 'six_layer_gauze_blanket', name: '6层纱布', category: 'sleep', subCategory: 'blanket', warmValue: 1, tempRange: '适合 22-26℃', scenes: ['睡觉'], desc: '纱布盖毯类用品，按宝宝状态轻盖。', illustration: '/assets/goods/six-layer-gauze-blanket.png' },
  { id: 'four_layer_gauze_blanket', name: '4层纱布', category: 'sleep', subCategory: 'blanket', warmValue: 1, tempRange: '适合 25-27℃', scenes: ['睡觉'], desc: '偏薄纱布盖毯，适合偏暖环境。', illustration: '/assets/goods/four-layer-gauze-blanket.png' },
  { id: 'padded_small_quilt', name: '夹棉小被子', category: 'sleep', subCategory: 'blanket', warmValue: 4, tempRange: '适合 10-15℃', scenes: ['睡觉'], desc: '小被子类用品，使用时避免遮盖口鼻。', illustration: '/assets/goods/padded-small-quilt.png' },
  { id: 'fleece_blanket', name: '绒毯', category: 'sleep', subCategory: 'blanket', warmValue: 3, tempRange: '适合 18-20℃', scenes: ['睡觉'], desc: '绒面盖毯，按室温和宝宝状态使用。', illustration: '/assets/goods/fleece-blanket.png' },
  { id: 'swaddle', name: '包巾', category: 'sleep', subCategory: 'blanket', warmValue: 1, tempRange: '适合 26-30℃', scenes: ['睡觉'], desc: '包裹类用品，注意松紧和安全。', illustration: '/assets/goods/swaddle.png' },
  { id: 'small_towel', name: '小毛巾', category: 'sleep', subCategory: 'blanket', warmValue: 0, tempRange: '适合 30-37℃', scenes: ['睡觉'], desc: '高温环境下轻量遮盖参考。', illustration: '/assets/goods/small-towel.png' },
  { id: 'adult_quilt', name: '大人被子', category: 'sleep', subCategory: 'blanket', warmValue: 5, tempRange: '适合 6-20℃', scenes: ['睡觉'], desc: '仅作温度对照参考，宝宝睡眠请优先使用安全合适的婴幼儿用品。', illustration: '/assets/goods/adult-quilt.png' }
]

const subCategories = {
  clothing: [
    { key: 'all', label: '全部' },
    { key: 'inner', label: '内搭' },
    { key: 'pants', label: '裤子' },
    { key: 'outer', label: '外套' },
    { key: 'accessory', label: '配件' }
  ],
  sleep: [
    { key: 'all', label: '全部' },
    { key: 'sleeping_bag', label: '睡袋' },
    { key: 'blanket', label: '床品' }
  ]
}

module.exports = { goods, subCategories }
