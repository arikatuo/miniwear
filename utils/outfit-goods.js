const { goods } = require('../config/goods.config')

// Illustrations explain the existing recommendation; they do not calculate new outfits.
const illustrations = {
  indoor: { 1: ['short_sleeve_bodysuit'], 2: ['short_sleeve_bodysuit', 'short_sleeve_romper'], 3: ['wrap_bodysuit', 'cotton_autumn_pants'], 4: ['wrap_bodysuit', 'cotton_autumn_pants', 'socks'], 5: ['romper', 'cotton_vest', 'jacket'], 6: ['air_cotton_romper', 'jacket'] },
  outdoor: { 1: ['short_sleeve_tshirt'], 2: ['short_sleeve_bodysuit', 'short_sleeve_tshirt', 'shorts'], 3: ['wrap_bodysuit', 'cotton_vest', 'jacket'], 4: ['long_sleeve_tshirt', 'jacket'], 5: ['long_sleeve_tshirt', 'jacket', 'cotton_autumn_pants'], 6: ['padded_jacket', 'down_suit'] },
  sleep: { 1: ['wrap_bodysuit'], 2: ['four_layer_gauze_sleeping_bag', 'four_layer_gauze_blanket'], 3: ['four_layer_gauze_sleeping_bag'], 4: ['six_layer_gauze_sleeping_bag', 'thin_padded_sleeping_bag'], 5: ['cotton_padded_sleeping_bag', 'medium_padded_sleeping_bag'], 6: ['romper', 'medium_padded_sleeping_bag'] }
}

function outfitGoods(scene, level) {
  return ((illustrations[scene] || {})[level] || []).map((id) => goods.find((item) => item.id === id)).filter(Boolean)
}

module.exports = { outfitGoods }
