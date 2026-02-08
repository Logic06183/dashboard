/**
 * Platform-to-Pizza Mapping
 *
 * Maps item names from delivery platforms to your internal pizza types.
 * This ensures orders from Uber Eats and Mr. D Food are correctly
 * identified and matched to your PIZZA_INGREDIENTS database.
 */

const PLATFORM_PIZZA_MAPPING = {
  // ========================
  // UBER EATS MAPPING
  // ========================
  'Uber Eats': {
    // Pizza mappings (various name formats they might use)
    'The Champ': 'THE CHAMP',
    'The Champ Pizza': 'THE CHAMP',
    'Champ': 'THE CHAMP',

    'Pig in Paradise': 'PIG IN PARADISE',
    'Pig in Paradise Pizza': 'PIG IN PARADISE',

    'Margie': 'MARGIE',
    'Margie Pizza': 'MARGIE',
    'Margherita': 'MARGIE',

    'Mushroom Cloud': 'MUSHROOM CLOUD',
    'Mushroom Cloud Pizza': 'MUSHROOM CLOUD',

    'Spud': 'SPUD',
    'Spud Pizza': 'SPUD',
    'Potato Pizza': 'SPUD',

    'Mish-Mash': 'MISH-MASH',
    'Mish-Mash Pizza': 'MISH-MASH',
    'Mish Mash': 'MISH-MASH',

    "Lekker'izza": "LEKKER'IZZA",
    "Lekker'izza Pizza": "LEKKER'IZZA",
    'Lekkerizza': "LEKKER'IZZA",

    'Vegan Harvest': 'VEGAN HARVEST',
    'Vegan Harvest Pizza': 'VEGAN HARVEST',

    "Poppa's": "POPPA'S",
    "Poppa's Pizza": "POPPA'S",
    'Poppa': "POPPA'S",

    'Chick Tick Boom': 'CHICK TICK BOOM',
    'Chick Tick Boom!': 'CHICK TICK BOOM',
    'Chick Tick Boom! Pizza': 'CHICK TICK BOOM',

    'Artichoke & Ham': 'ARTICHOKE & HAM',
    'Artichoke and Ham': 'ARTICHOKE & HAM',
    'Artichoke & Ham Pizza': 'ARTICHOKE & HAM',

    'Glaze of Glory': 'GLAZE OF GLORY',
    'Glaze of Glory Pizza': 'GLAZE OF GLORY',

    'Mediterranean': 'MEDITERRANEAN',
    'Mediterranean Pizza': 'MEDITERRANEAN',

    'Quattro Formaggi': 'QUATTRO FORMAGGI',
    'Quattro Formaggi Pizza': 'QUATTRO FORMAGGI',
    'Four Cheese': 'QUATTRO FORMAGGI',

    'Caprese': 'CAPRESE',
    'Caprese Pizza': 'CAPRESE',

    'Owen': 'OWEN',
    'Owen!': 'OWEN',
    'Owen Pizza': 'OWEN',
    'Owen! Pizza': 'OWEN',

    'Build Your Own': 'BUILD YOUR OWN',
    'Build Your Own Pizza': 'BUILD YOUR OWN',
    'Custom Pizza': 'BUILD YOUR OWN',

    'Dough Balls': 'DOUGH BALLS',
    'Garlic Dough Balls': 'DOUGH BALLS',

    'Stretched Base with Sauce': 'STRETCHED BASE WITH SAUCE',
    'Pizza Base': 'STRETCHED BASE WITH SAUCE',
    'Base with Sauce': 'STRETCHED BASE WITH SAUCE'
  },

  // ========================
  // MR. D FOOD MAPPING
  // ========================
  'Mr D Food': {
    // Usually Mr. D adds "Pizza" suffix
    'The Champ Pizza': 'THE CHAMP',
    'The Champ': 'THE CHAMP',

    'Pig in Paradise Pizza': 'PIG IN PARADISE',
    'Pig in Paradise': 'PIG IN PARADISE',

    'Margie Pizza': 'MARGIE',
    'Margie': 'MARGIE',
    'Margherita Pizza': 'MARGIE',

    'Mushroom Cloud Pizza': 'MUSHROOM CLOUD',
    'Mushroom Cloud': 'MUSHROOM CLOUD',

    'Spud Pizza': 'SPUD',
    'Spud': 'SPUD',

    'Mish-Mash Pizza': 'MISH-MASH',
    'Mish-Mash': 'MISH-MASH',

    "Lekker'izza Pizza": "LEKKER'IZZA",
    "Lekker'izza": "LEKKER'IZZA",

    'Vegan Harvest Pizza': 'VEGAN HARVEST',
    'Vegan Harvest': 'VEGAN HARVEST',

    "Poppa's Pizza": "POPPA'S",
    "Poppa's": "POPPA'S",

    'Chick Tick Boom! Pizza': 'CHICK TICK BOOM',
    'Chick Tick Boom Pizza': 'CHICK TICK BOOM',
    'Chick Tick Boom': 'CHICK TICK BOOM',

    'Artichoke & Ham Pizza': 'ARTICHOKE & HAM',
    'Artichoke & Ham': 'ARTICHOKE & HAM',

    'Glaze of Glory Pizza': 'GLAZE OF GLORY',
    'Glaze of Glory': 'GLAZE OF GLORY',

    'Mediterranean Pizza': 'MEDITERRANEAN',
    'Mediterranean': 'MEDITERRANEAN',

    'Quattro Formaggi Pizza': 'QUATTRO FORMAGGI',
    'Quattro Formaggi': 'QUATTRO FORMAGGI',

    'Caprese Pizza': 'CAPRESE',
    'Caprese': 'CAPRESE',

    'Owen! Pizza': 'OWEN',
    'Owen Pizza': 'OWEN',
    'Owen': 'OWEN',

    'Build Your Own Pizza': 'BUILD YOUR OWN',
    'Build Your Own': 'BUILD YOUR OWN',

    'Dough Balls': 'DOUGH BALLS',

    'Stretched Base With Sauce': 'STRETCHED BASE WITH SAUCE',
    'Stretched Base with Sauce': 'STRETCHED BASE WITH SAUCE'
  }
};

/**
 * Maps a platform item name to your internal pizza type
 * @param {string} platformName - The delivery platform name ('Uber Eats' or 'Mr D Food')
 * @param {string} itemName - The item name from the platform
 * @returns {string|null} - Your internal pizza type or null if not found
 */
function mapPizzaName(platformName, itemName) {
  const mapping = PLATFORM_PIZZA_MAPPING[platformName];
  if (!mapping) {
    console.warn(`Unknown platform: ${platformName}`);
    return null;
  }

  // Try exact match first
  if (mapping[itemName]) {
    return mapping[itemName];
  }

  // Try case-insensitive match
  const lowerItemName = itemName.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (key.toLowerCase() === lowerItemName) {
      return value;
    }
  }

  // Try partial match (contains)
  for (const [key, value] of Object.entries(mapping)) {
    if (itemName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  console.warn(`No mapping found for item: ${itemName} on platform: ${platformName}`);
  return null;
}

/**
 * Parse beverage orders
 */
const BEVERAGE_MAPPING = {
  'Coca-Cola 330ml': 'Coca-Cola 330ml',
  'Coke 330ml': 'Coca-Cola 330ml',
  'Coca Cola': 'Coca-Cola 330ml',

  'Coke Zero 330ml': 'Coke Zero 330ml',
  'Coca-Cola Zero': 'Coke Zero 330ml',

  'Sprite 330ml': 'Sprite 330ml',
  'Sprite': 'Sprite 330ml',

  'Fanta Orange 330ml': 'Fanta Orange 330ml',
  'Fanta Orange': 'Fanta Orange 330ml',
  'Fanta': 'Fanta Orange 330ml',

  'Appletizer 330ml': 'Appletizer 330ml',
  'Appletizer': 'Appletizer 330ml',

  'Grapetizer 330ml': 'Grapetizer 330ml',
  'Grapetizer': 'Grapetizer 330ml',

  'Still Water 500ml': 'Still Water 500ml',
  'Water': 'Still Water 500ml',
  'Still Water': 'Still Water 500ml',

  'Sparkling Water 500ml': 'Sparkling Water 500ml',
  'Sparkling Water': 'Sparkling Water 500ml',

  'Ice Tea 500ml': 'Ice Tea 500ml',
  'Iced Tea': 'Ice Tea 500ml',
  'Ice Tea': 'Ice Tea 500ml',

  'Red Bull 250ml': 'Red Bull 250ml',
  'Red Bull': 'Red Bull 250ml'
};

function mapBeverageName(itemName) {
  // Try exact match
  if (BEVERAGE_MAPPING[itemName]) {
    return BEVERAGE_MAPPING[itemName];
  }

  // Try case-insensitive
  const lowerItemName = itemName.toLowerCase();
  for (const [key, value] of Object.entries(BEVERAGE_MAPPING)) {
    if (key.toLowerCase() === lowerItemName) {
      return value;
    }
  }

  return null;
}

module.exports = {
  PLATFORM_PIZZA_MAPPING,
  mapPizzaName,
  BEVERAGE_MAPPING,
  mapBeverageName
};
