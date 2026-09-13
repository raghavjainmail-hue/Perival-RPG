/**
 * state.js — Central game state singleton.
 *
 * All game systems read from and write to this object.
 * Never hold partial copies; always reference STATE directly.
 */

export const STATE = {
  /* ── Player ─────────────────────────────────────────── */
  player: {
    name:      'Perival',
    hp:        100,
    maxHp:     100,
    stamina:   100,
    maxStamina:100,
    level:     1,
    xp:        0,
    xpToNext:  100,
    gold:      15,
    attack:    10,
    defense:   4,
    speed:     8,
  },

  /* ── Equipment ───────────────────────────────────────── */
  equippedWeapon: null,   // item id string
  equippedArmor:  null,   // item id string
  disguise:       null,   // item id or null

  /* ── Inventory ───────────────────────────────────────── */
  // [{ id, qty }]
  inventory: [
    { id: 'rusted_sword',    qty: 1 },
    { id: 'healing_herb',    qty: 3 },
  ],

  /* ── Abilities ───────────────────────────────────────── */
  // All abilities Perival has unlocked
  unlockedAbilities: ['shadow_strike', 'heavy_blow', 'desperate_heal'],

  // The three equipped slots (ability id or null)
  equippedAbilities: ['shadow_strike', 'heavy_blow', 'desperate_heal'],

  /* ── Quests ──────────────────────────────────────────── */
  activeQuests:    [],   // quest ids
  completedQuests: [],   // quest ids

  /* ── NPC / World State flags ─────────────────────────── */
  flags: {
    // Progression
    metAldric:           false,
    aldricQuestGiven:    false,
    millhavenVisited:    false,
    boughtFromMerchant:  false,
    ruinsExplored:       false,
    wolfDefeated:        false,
    castlePathReached:   false,
    // Castle
    hasDisguise:         false,
    castleEntered:       false,
    dungeon_discovered:  false,
    leviora_fought:      false,
    // NPCs
    npcRelations: {},     // { npcId: 'friendly'|'hostile'|'neutral' }
  },

  /* ── Location ────────────────────────────────────────── */
  location:     'forest_entrance',
  previousLocation: null,

  /* ── Enemy states ────────────────────────────────────── */
  defeatedEnemies: [],   // enemy instance ids (for respawn control)

  /* ── Combat ──────────────────────────────────────────── */
  inCombat:     false,
  currentEnemy: null,    // live combat enemy object

  /* ── UI mode ─────────────────────────────────────────── */
  mode: 'explore',       // 'explore' | 'dialogue' | 'combat' | 'menu'
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Add an item to the player's inventory (or increment qty). */
export function addItem(itemId, qty = 1) {
  const existing = STATE.inventory.find(s => s.id === itemId);
  if (existing) {
    existing.qty += qty;
  } else {
    STATE.inventory.push({ id: itemId, qty });
  }
}

/** Remove qty of an item. Returns true if successful. */
export function removeItem(itemId, qty = 1) {
  const slot = STATE.inventory.find(s => s.id === itemId);
  if (!slot || slot.qty < qty) return false;
  slot.qty -= qty;
  if (slot.qty <= 0) {
    STATE.inventory = STATE.inventory.filter(s => s.id !== itemId);
    // Unequip if needed
    if (STATE.equippedWeapon === itemId) STATE.equippedWeapon = null;
    if (STATE.equippedArmor  === itemId) STATE.equippedArmor  = null;
  }
  return true;
}

/** Check if inventory has qty of item. */
export function hasItem(itemId, qty = 1) {
  const slot = STATE.inventory.find(s => s.id === itemId);
  return slot && slot.qty >= qty;
}

/** Modify player HP (negative = damage, positive = heal). */
export function modifyHP(amount) {
  STATE.player.hp = Math.max(0, Math.min(STATE.player.maxHp, STATE.player.hp + amount));
}

/** Modify stamina. */
export function modifyStamina(amount) {
  STATE.player.stamina = Math.max(0, Math.min(STATE.player.maxStamina, STATE.player.stamina + amount));
}

/** Grant XP, trigger level-up if threshold reached. Returns true if leveled up. */
export function grantXP(amount) {
  STATE.player.xp += amount;
  if (STATE.player.xp >= STATE.player.xpToNext) {
    STATE.player.xp -= STATE.player.xpToNext;
    STATE.player.level += 1;
    STATE.player.xpToNext = Math.floor(STATE.player.xpToNext * 1.5);
    // Stat increases on level up
    STATE.player.maxHp      += 12;
    STATE.player.maxStamina += 8;
    STATE.player.attack     += 3;
    STATE.player.defense    += 1;
    STATE.player.hp = STATE.player.maxHp; // restore on level up
    return true;
  }
  return false;
}

/** Add gold. */
export function addGold(amount) {
  STATE.player.gold += amount;
}

/** Spend gold. Returns false if insufficient. */
export function spendGold(amount) {
  if (STATE.player.gold < amount) return false;
  STATE.player.gold -= amount;
  return true;
}

/** Set a story flag. */
export function setFlag(key, value = true) {
  STATE.flags[key] = value;
}

/** Get a story flag. */
export function getFlag(key) {
  return STATE.flags[key] ?? false;
}

