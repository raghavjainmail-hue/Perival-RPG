/**
 * combat.js — Turn-based combat engine.
 *
 * Handles the full combat loop: player actions, enemy AI,
 * status effects, abilities, victory/defeat.
 */

import { STATE, modifyHP, modifyStamina, grantXP, addGold, addItem } from './state.js';
import { ENEMY_ABILITIES, rollDrops, rollGold } from './enemies.js';
import { ABILITIES, executeAbility } from './abilities.js';
import { getItem } from './items.js';
import {
  showCombatUI, hideCombatUI, updateHUD, updateEnemyHP,
  appendCombatLog, setEnemyStatus, setCombatButtonsEnabled,
  showDamageNumber, showToast, openModal, spawnMagicBurst,
  showLevelUp, showTextImmediate, showNarration, showChoices,
} from './ui.js';

/* ── State ──────────────────────────────────────────────────────────────── */
let _enemy       = null;
let _playerTurn  = true;
let _onVictory   = null;    // callback
let _onDefeat    = null;    // callback
let _pendingAbilitySelect = false;
let _playerEffects = [];   // { type, amount, duration }
let _enemyEffects  = [];   // mirrors enemy.activeEffects

/* ══════════════════════════════════════════════════════════════════════════
   START COMBAT
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Begin a combat encounter.
 * @param {object} enemy  - Spawned enemy instance (from spawnEnemy())
 * @param {function} onVictory - Called with (enemy, drops, gold) on win
 * @param {function} onDefeat  - Called on player death
 */
export function startCombat(enemy, onVictory, onDefeat) {
  _enemy       = enemy;
  _onVictory   = onVictory;
  _onDefeat    = onDefeat;
  _playerTurn  = true;
  _playerEffects = [];
  _enemyEffects  = enemy.activeEffects || [];
  _pendingAbilitySelect = false;

  STATE.inCombat    = true;
  STATE.currentEnemy = enemy;
  STATE.mode        = 'combat';

  showCombatUI(enemy);
  setCombatButtonsEnabled(true);

  appendCombatLog(`— Combat begins. ${enemy.name} appears! —`, 'combat-log-system');
  appendCombatLog(enemy.description, 'combat-log-system');
}

/* ══════════════════════════════════════════════════════════════════════════
   PLAYER ACTIONS
   ══════════════════════════════════════════════════════════════════════════ */

export function handleCombatAction(action) {
  if (!STATE.inCombat || !_playerTurn) return;

  switch (action) {
    case 'attack':  playerAttack();   break;
    case 'defend':  playerDefend();   break;
    case 'ability': openAbilityPick(); break;
    case 'item':    openItemPick();    break;
    case 'run':     playerRun();       break;
  }
}

/** Standard weapon attack. */
function playerAttack() {
  setCombatButtonsEnabled(false);
  _playerTurn = false;

  const result = rollPlayerAttack();
  const isCrit = result.isCrit;

  applyDamageToEnemy(result.damage, isCrit);
  appendCombatLog(
    isCrit
      ? `★ CRITICAL! You strike for ${result.damage} damage!`
      : `You attack for ${result.damage} damage.`,
    'combat-log-player'
  );
  showDamageNumber(result.damage, isCrit ? 'crit' : 'enemy-dmg', 48, 30);

  checkEnemyPhase();
  updateEnemyHP(_enemy);
  updateHUD();

  if (_enemy.hp <= 0) { endCombat('victory'); return; }

  // Brief pause then enemy turn
  setTimeout(enemyTurn, 900);
}

/** Defend: halve incoming damage this turn, slight stamina regen. */
function playerDefend() {
  setCombatButtonsEnabled(false);
  _playerTurn = false;

  modifyStamina(15);
  appendCombatLog('You raise your guard. Incoming damage reduced.', 'combat-log-player');
  updateHUD();

  // Tag that player is defending
  _playerEffects.push({ type: 'defending', duration: 1 });

  setTimeout(enemyTurn, 700);
}

/** Opens ability selection UI inside combat. */
function openAbilityPick() {
  // Show 3 equipped ability buttons overlaying combat actions
  const actionsEl = document.getElementById('combat-actions');
  if (!actionsEl) return;

  // Replace buttons temporarily
  actionsEl.innerHTML = '';

  const slots = STATE.equippedAbilities;
  slots.forEach((abilityId, i) => {
    const ability = abilityId ? ABILITIES[abilityId] : null;
    const btn = document.createElement('button');
    btn.className = 'combat-btn';
    if (ability) {
      btn.textContent = `${ability.icon} ${ability.shortName} (${ability.staminaCost} STA)`;
      btn.disabled = STATE.player.stamina < ability.staminaCost;
      btn.addEventListener('click', () => {
        restoreCombatButtons();
        useAbilityInCombat(abilityId);
      });
    } else {
      btn.textContent = `— Slot ${i + 1} Empty —`;
      btn.disabled = true;
    }
    actionsEl.appendChild(btn);
  });

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'combat-btn';
  cancelBtn.textContent = '↩ BACK';
  cancelBtn.addEventListener('click', restoreCombatButtons);
  actionsEl.appendChild(cancelBtn);
}

function restoreCombatButtons() {
  const actionsEl = document.getElementById('combat-actions');
  if (!actionsEl) return;
  actionsEl.innerHTML = `
    <button class="combat-btn" data-action="attack">⚔ ATTACK</button>
    <button class="combat-btn" data-action="defend">🛡 DEFEND</button>
    <button class="combat-btn" data-action="ability">✦ ABILITY</button>
    <button class="combat-btn" data-action="item">⚗ ITEM</button>
    <button class="combat-btn" data-action="run">↩ RUN</button>`;
  // Re-attach listeners
  actionsEl.querySelectorAll('.combat-btn').forEach(btn => {
    btn.addEventListener('click', () => handleCombatAction(btn.dataset.action));
  });
}

/** Use an ability during combat. */
function useAbilityInCombat(abilityId) {
  setCombatButtonsEnabled(false);
  _playerTurn = false;

  const result = executeAbility(abilityId, _enemy);
  if (!result) { _playerTurn = true; setCombatButtonsEnabled(true); return; }

  if (result.error) {
    appendCombatLog(result.error, 'combat-log-system');
    _playerTurn = true;
    setCombatButtonsEnabled(true);
    return;
  }

  appendCombatLog(result.message, 'combat-log-ability');

  if (result.damage > 0) {
    applyDamageToEnemy(result.damage, result.isCrit);
    showDamageNumber(result.damage, result.isCrit ? 'crit' : 'enemy-dmg', 48, 30);
    appendCombatLog(`Deals ${result.damage} damage.`, 'combat-log-ability');
  }

  if (result.heal > 0) {
    showDamageNumber(result.heal, 'heal-num', 30, 55);
    appendCombatLog(`You recover ${result.heal} HP.`, 'combat-log-heal');
  }

  if (result.effect === 'magic' || result.effect === 'shadow') {
    spawnMagicBurst();
  }

  checkEnemyPhase();
  updateEnemyHP(_enemy);
  updateHUD();

  if (_enemy.hp <= 0) { endCombat('victory'); return; }

  setTimeout(enemyTurn, 1000);
}

/** Use an item from inventory during combat. */
function openItemPick() {
  const consumables = STATE.inventory.filter(slot => {
    const item = getItem(slot.id);
    return item && item.type === 'consumable';
  });

  if (consumables.length === 0) {
    appendCombatLog('You have no usable items.', 'combat-log-system');
    return;
  }

  const actionsEl = document.getElementById('combat-actions');
  if (!actionsEl) return;
  actionsEl.innerHTML = '';

  consumables.slice(0, 4).forEach(slot => {
    const item = getItem(slot.id);
    const btn = document.createElement('button');
    btn.className = 'combat-btn';
    btn.textContent = `${item.icon} ${item.name} (×${slot.qty})`;
    btn.addEventListener('click', () => {
      restoreCombatButtons();
      useCombatItem(slot.id);
    });
    actionsEl.appendChild(btn);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'combat-btn';
  cancelBtn.textContent = '↩ BACK';
  cancelBtn.addEventListener('click', restoreCombatButtons);
  actionsEl.appendChild(cancelBtn);
}

function useCombatItem(itemId) {
  setCombatButtonsEnabled(false);
  _playerTurn = false;

  const item = getItem(itemId);
  if (!item) { _playerTurn = true; setCombatButtonsEnabled(true); return; }

  import('./state.js').then(({ removeItem, modifyHP: mHP, modifyStamina: mSTA }) => {
    removeItem(itemId, 1);

    if (item.healAmount) {
      mHP(item.healAmount);
      appendCombatLog(`You use ${item.name} and recover ${item.healAmount} HP.`, 'combat-log-heal');
      showDamageNumber(item.healAmount, 'heal-num', 25, 55);
    }
    if (item.staminaAmount) {
      mSTA(item.staminaAmount);
      appendCombatLog(`You use ${item.name} and recover ${item.staminaAmount} stamina.`, 'combat-log-heal');
    }
    if (item.tempDefense) {
      _playerEffects.push({ type: 'defense_boost', amount: item.tempDefense, duration: 1 });
      appendCombatLog(`You use ${item.name}. Defense temporarily boosted.`, 'combat-log-player');
    }

    updateHUD();
    setTimeout(enemyTurn, 800);
  });
}

/** Attempt to run. */
function playerRun() {
  // 50% chance to escape, modified by speed
  const escapeChance = 0.4 + (STATE.player.speed - _enemy.speed) * 0.03;
  const clampedChance = Math.max(0.1, Math.min(0.9, escapeChance));

  if (Math.random() < clampedChance) {
    appendCombatLog('You retreat into the darkness. The enemy does not pursue.', 'combat-log-system');
    endCombat('fled');
  } else {
    setCombatButtonsEnabled(false);
    _playerTurn = false;
    appendCombatLog('You try to run, but the enemy cuts off your escape!', 'combat-log-system');
    setTimeout(enemyTurn, 700);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   ENEMY AI TURN
   ══════════════════════════════════════════════════════════════════════════ */

function enemyTurn() {
  if (!STATE.inCombat || _enemy.hp <= 0) return;

  // Apply enemy status effects at start of their turn
  processStatusEffects();

  if (_enemy.hp <= 0) { endCombat('victory'); return; }

  // Pick an action
  const action = pickEnemyAction();
  const abilityDef = ENEMY_ABILITIES[action];

  if (!abilityDef) {
    // Fallback: basic attack
    doEnemyBasicAttack();
    return;
  }

  appendCombatLog(abilityDef.message(_enemy.name), 'combat-log-enemy');

  if (abilityDef.damageMult === 0) {
    // Non-damaging ability (buff, debuff, etc.)
    applyEnemyEffect(abilityDef.effect);
    setEnemyStatus(abilityDef.name);
    setTimeout(() => { setEnemyStatus(''); }, 2000);
  } else {
    let hits = abilityDef.hits ?? 1;
    let totalDmg = 0;

    for (let i = 0; i < hits; i++) {
      const dmg = calcEnemyDamage(abilityDef.damageMult);
      totalDmg += dmg;
      applyDamageToPlayer(dmg);
      showDamageNumber(dmg, 'player-dmg', 20, 50);
    }

    appendCombatLog(`You take ${totalDmg} damage!`, 'combat-log-enemy');

    // Apply secondary effect
    if (abilityDef.effect) applyEnemyEffect(abilityDef.effect);
  }

  updateHUD();

  if (STATE.player.hp <= 0) {
    endCombat('defeat');
    return;
  }

  // Return control to player
  setTimeout(() => {
    _playerTurn = true;
    setCombatButtonsEnabled(true);
  }, 400);
}

function pickEnemyAction() {
  const abilities = _enemy.abilities || ['bite'];
  // Weighted pick: prefer damaging abilities in phase 2+
  const filtered = _enemy.currentPhase >= 2
    ? abilities                          // all abilities in later phases
    : abilities.filter(a => a !== 'call_alarm'); // guards only call alarm once

  return filtered[Math.floor(Math.random() * filtered.length)];
}

function doEnemyBasicAttack() {
  const dmg = calcEnemyDamage(1.0);
  applyDamageToPlayer(dmg);
  appendCombatLog(`${_enemy.name} attacks for ${dmg} damage!`, 'combat-log-enemy');
  showDamageNumber(dmg, 'player-dmg', 20, 50);
  updateHUD();

  if (STATE.player.hp <= 0) { endCombat('defeat'); return; }
  setTimeout(() => { _playerTurn = true; setCombatButtonsEnabled(true); }, 400);
}

/* ══════════════════════════════════════════════════════════════════════════
   DAMAGE CALCULATIONS
   ══════════════════════════════════════════════════════════════════════════ */

function rollPlayerAttack() {
  const weapon = getItem(STATE.equippedWeapon);
  let baseDmg;

  if (weapon && weapon.damage) {
    const [min, max] = weapon.damage;
    baseDmg = min + Math.floor(Math.random() * (max - min + 1));
  } else {
    baseDmg = STATE.player.attack;
  }

  baseDmg += Math.floor(STATE.player.attack * 0.3);

  // Critical hit (10% base chance)
  const isCrit = Math.random() < 0.1;
  if (isCrit) baseDmg = Math.floor(baseDmg * 1.8);

  // Defense reduction
  const effectiveDef = Math.max(0, (_enemy.defense + _enemy.tempDefense));
  const damage = Math.max(1, baseDmg - effectiveDef);

  return { damage, isCrit };
}

function calcEnemyDamage(mult) {
  const [min, max] = _enemy.attack;
  let rawDmg = (min + Math.floor(Math.random() * (max - min + 1))) * mult;

  // Apply phase bonus
  if (_enemy.currentPhase >= 2) rawDmg *= 1.15;
  if (_enemy.currentPhase >= 3) rawDmg *= 1.2;

  rawDmg = Math.floor(rawDmg);

  // Temp enemy attack buff
  rawDmg += _enemy.tempAttack || 0;

  // Player defense
  let playerDef = STATE.player.defense;
  const armorItem = getItem(STATE.equippedArmor);
  if (armorItem && armorItem.defense) playerDef += armorItem.defense;

  // Defense boost effect
  const defEffect = _playerEffects.find(e => e.type === 'defense_boost');
  if (defEffect) playerDef += defEffect.amount;

  // Defending halves damage
  const isDefending = _playerEffects.some(e => e.type === 'defending');
  if (isDefending) rawDmg = Math.floor(rawDmg * 0.5);

  return Math.max(1, Math.floor(rawDmg - playerDef * 0.6));
}

function applyDamageToEnemy(damage, isCrit = false) {
  _enemy.hp = Math.max(0, _enemy.hp - damage);
}

function applyDamageToPlayer(damage) {
  // Remove defending effect after use
  _playerEffects = _playerEffects.filter(e => e.type !== 'defending');
  modifyHP(-damage);
}

/* ══════════════════════════════════════════════════════════════════════════
   STATUS EFFECTS
   ══════════════════════════════════════════════════════════════════════════ */

function processStatusEffects() {
  // Player status effects (poison, burn, etc.)
  _playerEffects = _playerEffects.filter(effect => {
    if (effect.type === 'poison' || effect.type === 'burn') {
      modifyHP(-effect.amount);
      appendCombatLog(
        `${effect.type === 'burn' ? '🔥 Burning' : '☠ Poison'} deals ${effect.amount} damage.`,
        'combat-log-enemy'
      );
      showDamageNumber(effect.amount, 'player-dmg', 25, 60);
    }
    effect.duration--;
    return effect.duration > 0;
  });

  // Arena fire
  const arenaFire = _playerEffects.find(e => e.type === 'arena_fire');
  if (arenaFire) {
    // already handled above in a generic loop
  }

  // Enemy's temp buffs wear off
  _enemy.tempDefense = Math.max(0, (_enemy.tempDefense || 0) - 1);
  _enemy.tempAttack  = Math.max(0, (_enemy.tempAttack  || 0) - 1);
}

function applyEnemyEffect(effect) {
  if (!effect) return;
  switch (effect.type) {
    case 'stagger':
      if (Math.random() < effect.chance) {
        appendCombatLog('You are staggered! (next action delayed)', 'combat-log-enemy');
      }
      break;
    case 'debuff':
      // Apply to player effects
      _playerEffects.push({ type: 'debuff_' + effect.stat, amount: effect.amount, duration: effect.duration });
      appendCombatLog(`Your ${effect.stat} is reduced!`, 'combat-log-enemy');
      break;
    case 'buff_self':
      if (effect.stat === 'defense') _enemy.tempDefense = (_enemy.tempDefense || 0) + effect.amount;
      if (effect.stat === 'attack')  _enemy.tempAttack  = (_enemy.tempAttack  || 0) + effect.amount;
      setEnemyStatus(`+${effect.amount} ${effect.stat}`);
      break;
    case 'drain':
      modifyHP(-effect.amount);
      _enemy.hp = Math.min(_enemy.maxHp, _enemy.hp + effect.amount);
      appendCombatLog(`${_enemy.name} drains ${effect.amount} HP from you!`, 'combat-log-enemy');
      updateEnemyHP(_enemy);
      break;
    case 'evade_next':
      _enemy.isEvading = true;
      setEnemyStatus('Evading');
      break;
    case 'poison':
    case 'burn':
    case 'arena_fire':
      _playerEffects.push({ ...effect });
      appendCombatLog(
        `You are ${effect.type === 'poison' ? 'poisoned' : 'on fire'}! (${effect.amount} dmg/turn)`,
        'combat-log-enemy'
      );
      break;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE TRANSITIONS
   ══════════════════════════════════════════════════════════════════════════ */

function checkEnemyPhase() {
  const pct = _enemy.hp / _enemy.maxHp;

  if (_enemy.currentPhase === 1 && _enemy.phase2Trigger && pct <= _enemy.phase2Trigger) {
    _enemy.currentPhase = 2;
    appendCombatLog('— ' + _enemy.phase2Message + ' —', 'combat-log-system');
    setEnemyStatus('⚠ ENRAGED');
    setTimeout(() => setEnemyStatus(''), 3000);
  }

  if (_enemy.currentPhase === 2 && _enemy.phase3Trigger && pct <= _enemy.phase3Trigger) {
    _enemy.currentPhase = 3;
    appendCombatLog('— ' + _enemy.phase3Message + ' —', 'combat-log-system');
    setEnemyStatus('💀 FINAL PHASE');
    spawnMagicBurst();
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   VICTORY / DEFEAT
   ══════════════════════════════════════════════════════════════════════════ */

function endCombat(result) {
  STATE.inCombat    = false;
  STATE.currentEnemy = null;
  STATE.mode        = 'explore';

  setCombatButtonsEnabled(false);

  setTimeout(() => {
    hideCombatUI();

    if (result === 'victory') {
      const drops = rollDrops(_enemy);
      const gold  = rollGold(_enemy);
      const xp    = _enemy.xpReward;

      // Apply rewards
      addGold(gold);
      const leveled = grantXP(xp);
      drops.forEach(d => addItem(d.itemId, d.qty));

      updateHUD();

      // Record enemy defeat
      if (_enemy.id) STATE.defeatedEnemies.push(_enemy.id);

      appendCombatLog(`— Victory! —`, 'combat-log-system');
      appendCombatLog(`Gained ${xp} XP, ${gold} gold.`, 'combat-log-system');
      if (drops.length) {
        appendCombatLog(
          `Drops: ${drops.map(d => { const it = getItem(d.itemId); return it ? it.name : d.itemId; }).join(', ')}`,
          'combat-log-system'
        );
      }

      if (leveled) showLevelUp(STATE.player.level);

      if (_onVictory) setTimeout(() => _onVictory(_enemy, drops, gold), 1000);

    } else if (result === 'defeat') {
      appendCombatLog('— You have fallen. —', 'combat-log-system');
      if (_onDefeat) setTimeout(_onDefeat, 1000);

    } else if (result === 'fled') {
      // onVictory not called; world.js handles returning to explore
      if (_onVictory) _onVictory(null, [], 0);
    }
  }, 500);
}

