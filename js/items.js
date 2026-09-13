/**
 * items.js — All item, weapon, and armor definitions.
 *
 * Each item is a plain object with a stable id key.
 * Systems (inventory, combat, merchant) reference items by id.
 */

export const ITEMS = {

  /* ════════════════════ WEAPONS ════════════════════ */

  rusted_sword: {
    id:      'rusted_sword',
    name:    'Rusted Sword',
    type:    'weapon',
    icon:    '⚔️',
    damage:  [8, 8],       // [min, max]
    speed:   7,
    rarity:  'common',
    effect:  null,
    ability: null,
    sellPrice: 4,
    buyPrice:  12,
    description: 'A blade that has seen better days. The edge still bites, barely.',
  },

  iron_shortsword: {
    id:      'iron_shortsword',
    name:    'Iron Shortsword',
    type:    'weapon',
    icon:    '🗡️',
    damage:  [9, 14],
    speed:   9,
    rarity:  'common',
    effect:  null,
    ability: null,
    sellPrice: 10,
    buyPrice:  30,
    description: 'Reliable and well-balanced. The blade of a working soldier.',
  },

  guard_blade: {
    id:      'guard_blade',
    name:    'Castle Guard Blade',
    type:    'weapon',
    icon:    '⚔️',
    damage:  [13, 19],
    speed:   7,
    rarity:  'uncommon',
    effect:  null,
    ability: 'guard_counter',
    sellPrice: 20,
    buyPrice:  60,
    description: 'The standard issue blade of the Ashen Keep garrison. Heavy and authoritative.',
  },

  shadow_blade: {
    id:      'shadow_blade',
    name:    'Shadow Blade',
    type:    'weapon',
    icon:    '🌑',
    damage:  [11, 18],
    speed:   12,
    rarity:  'rare',
    effect:  'shadow',        // triggers shadow visual on attacks
    ability: 'shadow_strike',
    sellPrice: 45,
    buyPrice:  120,
    description: '"Forged in a place where light refuses to go." Hums faintly with dark energy.',
  },

  ancient_greatsword: {
    id:      'ancient_greatsword',
    name:    'Ancient Greatsword',
    type:    'weapon',
    icon:    '🔱',
    damage:  [22, 34],
    speed:   4,
    rarity:  'rare',
    effect:  null,
    ability: 'ashen_break',
    sellPrice: 60,
    buyPrice:  180,
    description: 'Impossibly heavy. Carved with glyphs no living scholar can read.',
  },

  cursed_blade: {
    id:      'cursed_blade',
    name:    'Cursed Blade',
    type:    'weapon',
    icon:    '💀',
    damage:  [16, 28],
    speed:   8,
    rarity:  'rare',
    effect:  'curse',         // life steal
    ability: 'blood_riposte',
    sellPrice: 50,
    buyPrice:  150,
    description: '"Every wound it inflicts, it also drinks from." Glows faint purple.',
  },

  hunting_knife: {
    id:      'hunting_knife',
    name:    'Hunting Knife',
    type:    'weapon',
    icon:    '🔪',
    damage:  [5, 9],
    speed:   13,
    rarity:  'common',
    effect:  null,
    ability: null,
    sellPrice: 3,
    buyPrice:  8,
    description: 'Small, quick. Good for things that do not stand still.',
  },

  /* ════════════════════ ARMOR ════════════════════ */

  worn_traveling_cloak: {
    id:      'worn_traveling_cloak',
    name:    'Worn Traveling Cloak',
    type:    'armor',
    icon:    '🧥',
    defense: 2,
    rarity:  'common',
    effect:  null,
    sellPrice: 3,
    buyPrice:  8,
    description: 'Dark and well-worn. At least it keeps the cold out.',
  },

  leather_armor: {
    id:      'leather_armor',
    name:    'Leather Armor',
    type:    'armor',
    icon:    '🛡️',
    defense: 5,
    rarity:  'common',
    effect:  null,
    sellPrice: 8,
    buyPrice:  25,
    description: 'Hardened hide. Offers real protection without the noise of plate.',
  },

  guard_armor: {
    id:      'guard_armor',
    name:    'Guard Armor',
    type:    'armor',
    icon:    '⚜️',
    defense: 9,
    rarity:  'uncommon',
    effect:  'disguise_guard', // wearing this makes guards less suspicious
    sellPrice: 18,
    buyPrice:  55,
    description: 'Castle garrison plate. Wearing it, you look like you belong here.',
  },

  servant_clothes: {
    id:      'servant_clothes',
    name:    'Servant Clothes',
    type:    'armor',
    icon:    '👘',
    defense: 0,
    rarity:  'common',
    effect:  'disguise_servant',
    sellPrice: 2,
    buyPrice:  5,
    description: 'Gray linen with the castle crest stitched in faded thread. Unremarkable. Perfect.',
  },

  iron_plate: {
    id:      'iron_plate',
    name:    'Iron Plate',
    type:    'armor',
    icon:    '🛡️',
    defense: 14,
    rarity:  'uncommon',
    effect:  null,
    sellPrice: 30,
    buyPrice:  90,
    description: 'Heavy iron plate. Slows movement but stops most blades.',
  },

  /* ════════════════════ CONSUMABLES ════════════════════ */

  healing_herb: {
    id:      'healing_herb',
    name:    'Healing Herb',
    type:    'consumable',
    icon:    '🌿',
    healAmount: 20,
    rarity:  'common',
    sellPrice: 2,
    buyPrice:  6,
    description: '"Bitter on the tongue, but the wounds close faster." Common in the forest.',
  },

  tonic_of_mending: {
    id:      'tonic_of_mending',
    name:    'Tonic of Mending',
    type:    'consumable',
    icon:    '🧪',
    healAmount: 50,
    rarity:  'uncommon',
    sellPrice: 8,
    buyPrice:  22,
    description: 'A milky solution that smells of copper. Seals wounds with alarming speed.',
  },

  stamina_draught: {
    id:      'stamina_draught',
    name:    'Stamina Draught',
    type:    'consumable',
    icon:    '💧',
    staminaAmount: 50,
    rarity:  'common',
    sellPrice: 4,
    buyPrice:  12,
    description: '"Burns going down, but your legs remember what running felt like."',
  },

  elixir_of_iron: {
    id:      'elixir_of_iron',
    name:    'Elixir of Iron',
    type:    'consumable',
    icon:    '⚗️',
    tempDefense: 5, // +5 defense for the next combat
    rarity:  'uncommon',
    sellPrice: 10,
    buyPrice:  28,
    description: 'Hardens the skin briefly. Old soldier\'s trick.',
  },

  /* ════════════════════ QUEST ITEMS ════════════════════ */

  silver_locket: {
    id:      'silver_locket',
    name:    'Silver Locket',
    type:    'quest',
    icon:    '🔮',
    questId: 'the_missing_child',
    sellPrice: 0,
    buyPrice:  0,
    description: 'A small locket with a painted face inside. A child\'s face. Someone is looking for this.',
  },

  castle_key_west: {
    id:      'castle_key_west',
    name:    'West Gate Key',
    type:    'quest',
    icon:    '🗝️',
    questId: 'castle_infiltration',
    sellPrice: 0,
    buyPrice:  0,
    description: 'A heavy iron key. The teeth are stained. Don\'t ask with what.',
  },

  aldric_note: {
    id:      'aldric_note',
    name:    "Aldric's Note",
    type:    'quest',
    icon:    '📜',
    questId: 'the_wanderer',
    sellPrice: 0,
    buyPrice:  0,
    description: 'A folded piece of parchment. "Do not trust Lord Varek. Do not trust me either."',
  },

  torn_map: {
    id:      'torn_map',
    name:    'Torn Map Fragment',
    type:    'quest',
    icon:    '🗺️',
    questId: 'the_map_pieces',
    sellPrice: 0,
    buyPrice:  0,
    description: 'Half of a map showing tunnels beneath the castle. The other half is missing.',
  },

  /* ════════════════════ MISC ════════════════════ */

  ancient_coin: {
    id:      'ancient_coin',
    name:    'Ancient Coin',
    type:    'misc',
    icon:    '🪙',
    sellPrice: 15,
    buyPrice:  0,
    description: 'Stamped with a dragon on one side, a crown on the other. Old currency.',
  },

  lantern_oil: {
    id:      'lantern_oil',
    name:    'Lantern Oil',
    type:    'misc',
    icon:    '🕯️',
    sellPrice: 1,
    buyPrice:  4,
    description: 'Useful in dark places. The dungeon will be very dark.',
  },

  wolf_pelt: {
    id:      'wolf_pelt',
    name:    'Wolf Pelt',
    type:    'misc',
    icon:    '🐺',
    sellPrice: 8,
    buyPrice:  0,
    description: 'Thick and still warm. Someone in Millhaven will pay for this.',
  },

  bandit_token: {
    id:      'bandit_token',
    name:    "Bandit's Token",
    type:    'misc',
    icon:    '🪬',
    sellPrice: 3,
    buyPrice:  0,
    description: 'A wooden token carved with a serpent. Possibly a faction marker.',
  },
};

/** Quick item lookup by id. */
export function getItem(id) {
  return ITEMS[id] ?? null;
}

/** Get sell price (50% of buy if not set). */
export function getSellPrice(item) {
  return item.sellPrice ?? Math.floor((item.buyPrice ?? 0) * 0.5);
}

