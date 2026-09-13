/**
 * enemies.js — All enemy definitions and factory.
 *
 * Each enemy template describes a type of foe.
 * Combat spawns live instances (copies) from these templates.
 */

export const ENEMY_TEMPLATES = {

  forest_wolf: {
    id:       'forest_wolf',
    name:     'Forest Wolf',
    icon:     '🐺',
    hp:       35,
    maxHp:    35,
    attack:   [7, 12],
    defense:  2,
    speed:    10,
    xpReward: 25,
    goldReward:[2, 6],
    dropTable: [
      { itemId: 'wolf_pelt',    chance: 0.7 },
      { itemId: 'healing_herb', chance: 0.3 },
    ],
    abilities: ['bite', 'lunge'],
    description: 'A gaunt wolf with glowing amber eyes. The forest has made it savage.',
    phase2Trigger: 0.4,   // becomes aggressive below 40% HP
    phase2Message: 'The wolf snarls, blood on its muzzle. It lunges!',
  },

  dire_wolf: {
    id:       'dire_wolf',
    name:     'Dire Wolf',
    icon:     '🐺',
    hp:       60,
    maxHp:    60,
    attack:   [12, 18],
    defense:  4,
    speed:    11,
    xpReward: 55,
    goldReward:[5, 12],
    dropTable: [
      { itemId: 'wolf_pelt',     chance: 0.9 },
      { itemId: 'tonic_of_mending', chance: 0.25 },
    ],
    abilities: ['bite', 'lunge', 'howl'],
    description: 'Twice the size of an ordinary wolf. The alpha of its pack.',
    phase2Trigger: 0.5,
    phase2Message: 'The dire wolf howls. Its wounds seem to drive it into a frenzy.',
  },

  bandit_scout: {
    id:       'bandit_scout',
    name:     'Bandit Scout',
    icon:     '🗡️',
    hp:       45,
    maxHp:    45,
    attack:   [9, 15],
    defense:  3,
    speed:    9,
    xpReward: 35,
    goldReward:[8, 18],
    dropTable: [
      { itemId: 'bandit_token', chance: 0.8 },
      { itemId: 'hunting_knife', chance: 0.3 },
      { itemId: 'healing_herb',  chance: 0.4 },
    ],
    abilities: ['quick_stab', 'disengage'],
    description: 'A lean man in dark leathers. He watches Perival with calculating eyes.',
    phase2Trigger: 0.3,
    phase2Message: 'The bandit whistles sharply. "Fine. No more games."',
  },

  bandit_enforcer: {
    id:       'bandit_enforcer',
    name:     'Bandit Enforcer',
    icon:     '⚔️',
    hp:       75,
    maxHp:    75,
    attack:   [13, 20],
    defense:  6,
    speed:    6,
    xpReward: 65,
    goldReward:[15, 30],
    dropTable: [
      { itemId: 'iron_shortsword', chance: 0.3 },
      { itemId: 'tonic_of_mending', chance: 0.4 },
      { itemId: 'bandit_token', chance: 1.0 },
    ],
    abilities: ['heavy_strike', 'shield_bash'],
    description: 'A hulking brute who serves as muscle for the forest brigands.',
    phase2Trigger: 0.35,
    phase2Message: 'The enforcer spits blood and raises his weapon with two hands.',
  },

  corrupted_hound: {
    id:       'corrupted_hound',
    name:     'Corrupted Hound',
    icon:     '👹',
    hp:       55,
    maxHp:    55,
    attack:   [11, 17],
    defense:  3,
    speed:    14,
    xpReward: 50,
    goldReward:[4, 10],
    dropTable: [
      { itemId: 'lantern_oil', chance: 0.5 },
      { itemId: 'ancient_coin', chance: 0.2 },
    ],
    abilities: ['bite', 'lunge', 'corruption_bite'],
    description: 'A hound warped by dark magic. Its eyes burn violet. Its shadow doesn\'t match its body.',
    phase2Trigger: 0.45,
    phase2Message: 'The hound shudders. Dark energy crackles across its body.',
  },

  castle_guard: {
    id:       'castle_guard',
    name:     'Castle Guard',
    icon:     '⚜️',
    hp:       90,
    maxHp:    90,
    attack:   [15, 22],
    defense:  10,
    speed:    6,
    xpReward: 80,
    goldReward:[20, 40],
    dropTable: [
      { itemId: 'guard_blade', chance: 0.25 },
      { itemId: 'tonic_of_mending', chance: 0.5 },
      { itemId: 'elixir_of_iron', chance: 0.3 },
    ],
    abilities: ['heavy_strike', 'guard_counter', 'call_alarm'],
    description: 'A garrison soldier of the Ashen Keep. Well-trained. Loyal to Lord Varek.',
    phase2Trigger: 0.3,
    phase2Message: 'The guard\'s stance drops. "I\'ll kill you myself."',
  },

  dungeon_wraith: {
    id:       'dungeon_wraith',
    name:     'Dungeon Wraith',
    icon:     '👻',
    hp:       70,
    maxHp:    70,
    attack:   [16, 24],
    defense:  0,
    speed:    16,
    xpReward: 90,
    goldReward:[10, 20],
    dropTable: [
      { itemId: 'ancient_coin', chance: 0.6 },
      { itemId: 'lantern_oil', chance: 0.4 },
    ],
    abilities: ['drain_touch', 'phase_shift', 'wail'],
    description: 'A remnant of a soul that refused to leave the dungeon. It has no body to harm, only presence.',
    phase2Trigger: 0.4,
    phase2Message: 'The wraith screams — a sound felt in the chest, not heard by the ears.',
  },

  leviora: {
    id:       'leviora',
    name:     'LEVIORA',
    icon:     '🐉',
    hp:       300,
    maxHp:    300,
    attack:   [30, 50],
    defense:  15,
    speed:    8,
    xpReward: 500,
    goldReward:[100, 200],
    dropTable: [],
    abilities: ['fire_breath', 'claw_attack', 'tail_sweep', 'roar', 'wing_strike', 'burning_ground'],
    description: 'Ancient. Vast. Chained for a century, its rage has calcified into something colder than hatred.',
    phase2Trigger: 0.65,   // Phase 2 at 65% HP
    phase2Message: 'Leviora\'s eyes ignite. The chains shatter. The arena becomes fire.',
    phase3Trigger: 0.35,   // Phase 3 at 35% HP
    phase3Message: 'Leviora rises fully. The ceiling cracks. Burning stone falls.',
  },
};

/* ── Enemy ability definitions ─────────────────────────────────────────────
   These are the enemy-side actions. Player abilities live in abilities.js.
*/
export const ENEMY_ABILITIES = {
  bite: {
    name: 'Bite',
    damageMult: 1.0,
    message: (eName) => `${eName} lunges with snapping jaws!`,
    effect: null,
  },
  lunge: {
    name: 'Lunge',
    damageMult: 1.4,
    message: (eName) => `${eName} leaps forward in a savage lunge!`,
    effect: null,
  },
  howl: {
    name: 'Howl',
    damageMult: 0,
    message: (eName) => `${eName} lets out a bone-chilling howl. You feel your resolve waver.`,
    effect: { type: 'debuff', stat: 'attack', amount: -3, duration: 2 },
  },
  quick_stab: {
    name: 'Quick Stab',
    damageMult: 0.85,
    hits: 2,
    message: (eName) => `${eName} strikes twice in rapid succession!`,
    effect: null,
  },
  disengage: {
    name: 'Disengage',
    damageMult: 0,
    message: (eName) => `${eName} rolls away, creating distance.`,
    effect: { type: 'buff_self', stat: 'defense', amount: 4, duration: 1 },
  },
  heavy_strike: {
    name: 'Heavy Strike',
    damageMult: 1.6,
    message: (eName) => `${eName} winds up and delivers a crushing blow!`,
    effect: { type: 'stagger', chance: 0.3 }, // 30% chance to stagger (skip player turn)
  },
  shield_bash: {
    name: 'Shield Bash',
    damageMult: 0.7,
    message: (eName) => `${eName} smashes with a shield, rattling your senses!`,
    effect: { type: 'stagger', chance: 0.4 },
  },
  guard_counter: {
    name: 'Counter Strike',
    damageMult: 1.3,
    message: (eName) => `${eName} deflects and counters!`,
    effect: null,
    triggerOnDefend: true,
  },
  call_alarm: {
    name: 'Call Alarm',
    damageMult: 0,
    message: (eName) => `${eName} shouts for backup! (No help arrives in time.)`,
    effect: { type: 'buff_self', stat: 'attack', amount: 5, duration: 3 },
  },
  drain_touch: {
    name: 'Drain Touch',
    damageMult: 1.1,
    message: (eName) => `${eName} reaches through your chest — you feel cold.`,
    effect: { type: 'drain', amount: 10 }, // steals 10 HP
  },
  phase_shift: {
    name: 'Phase Shift',
    damageMult: 0,
    message: (eName) => `${eName} becomes translucent — your next attack misses!`,
    effect: { type: 'evade_next', duration: 1 },
  },
  wail: {
    name: 'Soul Wail',
    damageMult: 1.5,
    message: (eName) => `${eName} unleashes a spiritual scream that tears at your mind!`,
    effect: null,
  },
  corruption_bite: {
    name: 'Corruption Bite',
    damageMult: 1.0,
    message: (eName) => `${eName} bites with jaws crackling with dark energy!`,
    effect: { type: 'poison', amount: 5, duration: 3 }, // 5 dmg/turn for 3 turns
  },
  fire_breath: {
    name: 'Fire Breath',
    damageMult: 1.8,
    message: () => 'Leviora inhales — then the world becomes fire!',
    effect: { type: 'burn', amount: 8, duration: 3 },
  },
  claw_attack: {
    name: 'Claw Attack',
    damageMult: 1.4,
    message: () => 'A massive claw slams down!',
    effect: null,
  },
  tail_sweep: {
    name: 'Tail Sweep',
    damageMult: 1.2,
    message: () => 'The massive tail sweeps the arena!',
    effect: { type: 'stagger', chance: 0.5 },
  },
  roar: {
    name: 'Dragon Roar',
    damageMult: 0,
    message: () => 'Leviora roars — the dungeon shakes, stalactites fall, and your vision blurs.',
    effect: { type: 'debuff', stat: 'attack', amount: -6, duration: 2 },
  },
  wing_strike: {
    name: 'Wing Strike',
    damageMult: 1.3,
    message: () => 'Leviora\'s wing crashes into you with the force of a siege weapon!',
    effect: null,
  },
  burning_ground: {
    name: 'Burning Ground',
    damageMult: 0,
    message: () => 'Leviora breathes across the floor — flames pool everywhere!',
    effect: { type: 'arena_fire', amount: 10, duration: 4 },
  },
};

/** Create a live combat instance (copy) from a template. */
export function spawnEnemy(templateId) {
  const template = ENEMY_TEMPLATES[templateId];
  if (!template) throw new Error(`Unknown enemy: ${templateId}`);
  return {
    ...template,
    hp: template.hp,       // mutable hp
    currentPhase: 1,
    activeEffects: [],     // { type, amount, duration }
    isEvading: false,
    tempDefense: 0,
    tempAttack: 0,
    lastAction: null,
  };
}

/** Roll drops from an enemy's drop table. Returns array of { itemId, qty }. */
export function rollDrops(enemy) {
  const drops = [];
  for (const entry of (enemy.dropTable || [])) {
    if (Math.random() < entry.chance) {
      drops.push({ itemId: entry.itemId, qty: 1 });
    }
  }
  return drops;
}

/** Roll gold reward. */
export function rollGold(enemy) {
  const [min, max] = enemy.goldReward;
  return Math.floor(min + Math.random() * (max - min + 1));
}

