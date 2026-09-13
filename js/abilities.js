/**
 * abilities.js — Player ability definitions and ability slot management.
 *
 * The player has exactly THREE equipped slots.
 * Additional abilities can be unlocked and swapped in.
 */

import { STATE, modifyStamina, modifyHP } from './state.js';

/* ════════════════════════════════════════════════════════════════════════════
   ABILITY DEFINITIONS
   ════════════════════════════════════════════════════════════════════════════ */

export const ABILITIES = {

  shadow_strike: {
    id:          'shadow_strike',
    name:        'Shadow Strike',
    shortName:   'SHADOW STRIKE',
    icon:        '🌑',
    description: 'Slip through shadow and strike a vital point. High damage, ignores some defense.',
    staminaCost: 20,
    type:        'attack',
    damageMult:  1.6,
    defenseIgnore: 4,   // bypasses 4 points of enemy defense
    effect:      'shadow',
    unlock:      'default',
    execute(player, enemy) {
      // Returns { damage, message, effect }
      const weaponDmg = getWeaponDamage(player);
      const rawDmg    = Math.floor(weaponDmg * 1.6);
      const reduction = Math.max(0, (enemy.defense + enemy.tempDefense) - 4);
      const damage    = Math.max(1, rawDmg - reduction);
      return {
        damage,
        message: 'You melt into shadow and strike from an impossible angle.',
        effect: 'shadow',
        isCrit: false,
      };
    },
  },

  heavy_blow: {
    id:          'heavy_blow',
    name:        'Heavy Blow',
    shortName:   'HEAVY BLOW',
    icon:        '💥',
    description: 'A powerful two-handed strike. Deals massive damage but costs stamina.',
    staminaCost: 25,
    type:        'attack',
    damageMult:  1.9,
    effect:      null,
    unlock:      'default',
    execute(player, enemy) {
      const weaponDmg = getWeaponDamage(player);
      const rawDmg    = Math.floor(weaponDmg * 1.9);
      const reduction = Math.max(0, enemy.defense + enemy.tempDefense);
      const damage    = Math.max(1, rawDmg - reduction);
      return {
        damage,
        message: 'You bring your weapon down with both hands. The impact cracks the air.',
        effect: null,
        isCrit: false,
      };
    },
  },

  desperate_heal: {
    id:          'desperate_heal',
    name:        'Desperate Heal',
    shortName:   'DESPERATE HEAL',
    icon:        '💉',
    description: 'Channel focus into rapid recovery. Restores 30 HP.',
    staminaCost: 30,
    type:        'heal',
    healAmount:  30,
    effect:      null,
    unlock:      'default',
    execute(player) {
      modifyHP(30);
      return {
        damage: 0,
        heal:   30,
        message: 'You press your hand to your wounds and breathe through the pain. The bleeding slows.',
        effect: 'heal',
        isCrit: false,
      };
    },
  },

  blood_riposte: {
    id:          'blood_riposte',
    name:        'Blood Riposte',
    shortName:   'BLOOD RIPOSTE',
    icon:        '🩸',
    description: 'Counter the last attack. Deals damage and steals 10 HP.',
    staminaCost: 22,
    type:        'attack',
    damageMult:  1.3,
    effect:      'drain',
    unlock:      'cursed_blade',   // unlocked when cursed_blade is obtained
    execute(player, enemy) {
      const weaponDmg = getWeaponDamage(player);
      const rawDmg    = Math.floor(weaponDmg * 1.3);
      const reduction = Math.max(0, enemy.defense + enemy.tempDefense);
      const damage    = Math.max(1, rawDmg - reduction);
      const stolen    = Math.min(10, damage);
      modifyHP(stolen);
      return {
        damage,
        heal:    stolen,
        message: `The blade drinks. You take back ${stolen} HP.`,
        effect: 'drain',
        isCrit: false,
      };
    },
  },

  ashen_break: {
    id:          'ashen_break',
    name:        'Ashen Break',
    shortName:   'ASHEN BREAK',
    icon:        '💠',
    description: 'Invoke the sigil on the greatsword. A heavy magical strike that deals massive damage.',
    staminaCost: 35,
    type:        'magic_attack',
    damageMult:  2.2,
    effect:      'magic',
    unlock:      'ancient_greatsword',
    execute(player, enemy) {
      const weaponDmg = getWeaponDamage(player);
      const rawDmg    = Math.floor(weaponDmg * 2.2);
      const damage    = Math.max(1, rawDmg - 2);  // minimal defense reduction
      return {
        damage,
        message: 'The ancient sigil ignites. Dark energy erupts from the blade.',
        effect: 'magic',
        isCrit: false,
      };
    },
  },

  guard_counter: {
    id:          'guard_counter',
    name:        'Guard Counter',
    shortName:   'GUARD COUNTER',
    icon:        '⚔️',
    description: 'Deflect the incoming strike and retaliate with your weapon.',
    staminaCost: 15,
    type:        'counter',
    damageMult:  1.2,
    effect:      null,
    unlock:      'guard_blade',
    execute(player, enemy) {
      const weaponDmg = getWeaponDamage(player);
      const rawDmg    = Math.floor(weaponDmg * 1.2);
      const reduction = Math.max(0, enemy.defense + enemy.tempDefense);
      const damage    = Math.max(1, rawDmg - reduction);
      return {
        damage,
        message: 'You catch the blow on your blade and redirect it into a counter-strike.',
        effect: null,
        isCrit: false,
        reduceDamageTaken: 0.5, // incoming damage reduced by 50% this turn
      };
    },
  },

  focused_strike: {
    id:          'focused_strike',
    name:        'Focused Strike',
    shortName:   'FOCUSED STRIKE',
    icon:        '🎯',
    description: 'A precise, calculated attack. High chance to critically hit.',
    staminaCost: 18,
    type:        'attack',
    damageMult:  1.1,
    critChance:  0.7,   // 70% crit chance
    effect:      null,
    unlock:      'iron_shortsword',
    execute(player, enemy) {
      const isCrit    = Math.random() < 0.7;
      const weaponDmg = getWeaponDamage(player);
      const rawDmg    = Math.floor(weaponDmg * (isCrit ? 2.0 : 1.1));
      const reduction = Math.max(0, enemy.defense + enemy.tempDefense);
      const damage    = Math.max(1, rawDmg - reduction);
      return {
        damage,
        message: isCrit
          ? 'You wait for the perfect opening. The strike lands exactly where it needs to.'
          : 'You aim carefully and strike true.',
        effect: null,
        isCrit,
      };
    },
  },
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Get weapon base damage (midpoint of range, plus player attack bonus). */
function getWeaponDamage(player) {
  const { getItem } = window._items; // set by game.js bootstrap
  const weaponId = STATE.equippedWeapon;
  if (!weaponId) return player.attack;
  const weapon = getItem(weaponId);
  if (!weapon || !weapon.damage) return player.attack;
  const [min, max] = weapon.damage;
  return Math.floor((min + max) / 2) + Math.floor(player.attack / 2);
}

/** Execute an ability by id. Returns result object. */
export function executeAbility(abilityId, enemy) {
  const ability = ABILITIES[abilityId];
  if (!ability) return null;

  // Stamina check
  if (STATE.player.stamina < ability.staminaCost) {
    return { error: 'Not enough stamina.' };
  }

  modifyStamina(-ability.staminaCost);
  return ability.execute(STATE.player, enemy);
}

/** Render the ability menu UI into #modal-abilities. */
export function renderAbilityMenu() {
  const slotsEl = document.getElementById('ability-slots');
  const poolEl  = document.getElementById('ability-pool');
  if (!slotsEl || !poolEl) return;

  // ── Equipped slots ──
  slotsEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const abilityId = STATE.equippedAbilities[i];
    const ability   = abilityId ? ABILITIES[abilityId] : null;
    const slot = document.createElement('div');
    slot.className = `ability-slot ${ability ? '' : 'empty'}`;
    slot.dataset.slot = i;

    if (ability) {
      slot.innerHTML = `
        <div class="ability-slot-num">${i + 1}</div>
        <div class="ability-slot-content">
          <div class="ability-slot-name">${ability.icon} ${ability.shortName}</div>
          <div class="ability-slot-desc">${ability.description}</div>
          <div class="ability-slot-cost">STAMINA · ${ability.staminaCost}</div>
        </div>`;
    } else {
      slot.innerHTML = `
        <div class="ability-slot-num">${i + 1}</div>
        <div class="ability-slot-content">
          <div class="ability-slot-name">— Empty Slot —</div>
          <div class="ability-slot-desc">Select an ability below to equip.</div>
        </div>`;
    }

    // Click slot to select it for re-assignment
    slot.addEventListener('click', () => {
      document.querySelectorAll('.ability-slot').forEach(s => s.classList.remove('active'));
      slot.classList.add('active');
      poolEl.dataset.targetSlot = i;
    });

    slotsEl.appendChild(slot);
  }

  // ── Ability pool ──
  poolEl.innerHTML = `<div class="ability-pool-title">UNLOCKED ABILITIES</div>`;
  for (const abilityId of STATE.unlockedAbilities) {
    const ability  = ABILITIES[abilityId];
    if (!ability) continue;
    const equipped = STATE.equippedAbilities.includes(abilityId);

    const row = document.createElement('div');
    row.className = `pool-ability ${equipped ? 'equipped-in-slot' : ''}`;
    row.innerHTML = `
      <span class="pool-ability-name">${ability.icon} ${ability.shortName}</span>
      <span class="pool-ability-desc">${ability.description}</span>
      <span class="ability-slot-cost">${ability.staminaCost} STA</span>`;

    row.addEventListener('click', () => {
      if (equipped) return;
      const targetSlot = parseInt(poolEl.dataset.targetSlot ?? '0');
      STATE.equippedAbilities[targetSlot] = abilityId;
      renderAbilityMenu();
      import('./ui.js').then(ui => ui.showToast(`${ability.name} equipped to slot ${targetSlot + 1}.`, 'magic'));
    });

    poolEl.appendChild(row);
  }
}

/** Unlock an ability by id (adds to pool if not already there). */
export function unlockAbility(abilityId) {
  if (!ABILITIES[abilityId]) return;
  if (!STATE.unlockedAbilities.includes(abilityId)) {
    STATE.unlockedAbilities.push(abilityId);
  }
}

/** Get the ability assigned to a combat slot (1-indexed). */
export function getSlotAbility(slotIndex) {
  return STATE.equippedAbilities[slotIndex] ?? null;
}

