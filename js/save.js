/**
 * save.js — localStorage save / load / new game.
 */

import { STATE } from './state.js';

const SAVE_KEY = 'perival_ashen_keep_save';

/* ══════════════════════════════════════════════════════════════════════════
   SAVE
   ══════════════════════════════════════════════════════════════════════════ */

export function saveGame() {
  const saveData = {
    version:  1,
    savedAt:  new Date().toISOString(),
    player:   { ...STATE.player },
    equippedWeapon:   STATE.equippedWeapon,
    equippedArmor:    STATE.equippedArmor,
    disguise:         STATE.disguise,
    inventory:        STATE.inventory.map(s => ({ ...s })),
    unlockedAbilities: [...STATE.unlockedAbilities],
    equippedAbilities: [...STATE.equippedAbilities],
    activeQuests:      [...STATE.activeQuests],
    completedQuests:   [...STATE.completedQuests],
    flags:             JSON.parse(JSON.stringify(STATE.flags)),
    location:          STATE.location,
    defeatedEnemies:   [...STATE.defeatedEnemies],
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return { success: true, savedAt: saveData.savedAt };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   LOAD
   ══════════════════════════════════════════════════════════════════════════ */

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return { success: false, error: 'No save file found.' };

  try {
    const data = JSON.parse(raw);

    // Restore state
    Object.assign(STATE.player, data.player);
    STATE.equippedWeapon   = data.equippedWeapon   ?? null;
    STATE.equippedArmor    = data.equippedArmor    ?? null;
    STATE.disguise         = data.disguise         ?? null;
    STATE.inventory        = data.inventory        ?? [];
    STATE.unlockedAbilities= data.unlockedAbilities ?? [];
    STATE.equippedAbilities= data.equippedAbilities ?? [null, null, null];
    STATE.activeQuests     = data.activeQuests     ?? [];
    STATE.completedQuests  = data.completedQuests  ?? [];
    STATE.flags            = data.flags            ?? { npcRelations: {} };
    STATE.location         = data.location         ?? 'forest_entrance';
    STATE.defeatedEnemies  = data.defeatedEnemies  ?? [];

    return { success: true, location: STATE.location };
  } catch (e) {
    return { success: false, error: `Save file corrupted: ${e.message}` };
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   NEW GAME
   ══════════════════════════════════════════════════════════════════════════ */

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

