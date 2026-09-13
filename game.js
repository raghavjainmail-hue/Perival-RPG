/**
 * game.js — Main bootstrap and event routing.
 *
 * Initializes all systems, wires keyboard shortcuts,
 * modal buttons, and launches the title screen.
 */

import { STATE } from './js/state.js';
import { initUI, updateHUD, openModal, closeModal, closeAllModals,
         showToast, hideTitleScreen, initParticles } from './js/ui.js';
import { startWorld, navigate } from './js/world.js';
import { renderInventory, initTrashArea } from './js/inventory.js';
import { renderAbilityMenu } from './js/abilities.js';
import { renderQuestLog } from './js/quests.js';
import { saveGame, loadGame, hasSave } from './js/save.js';
import { handleCombatAction } from './js/combat.js';
import { getItem } from './js/items.js';

/* ── Expose items to abilities.js via global bridge ─────────────────────── */
window._items = { getItem };

/* ════════════════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initParticles();
  setupModalButtons();
  setupTitleScreen();
  setupKeyboard();
  setupSaveButtons();
  setupCombatButtons();
  setupModalClose();
  setupQuestTabs();

  // Equip starting weapon
  if (!STATE.equippedWeapon) STATE.equippedWeapon = 'rusted_sword';

  updateHUD();
});

/* ════════════════════════════════════════════════════════════════════════════
   TITLE SCREEN
   ════════════════════════════════════════════════════════════════════════════ */

function setupTitleScreen() {
  const newBtn  = document.getElementById('title-new');
  const loadBtn = document.getElementById('title-load');

  // Disable load if no save
  if (!hasSave()) {
    loadBtn.style.opacity = '0.3';
    loadBtn.disabled = true;
    loadBtn.title = 'No save file found.';
  }

  newBtn?.addEventListener('click', () => {
    hideTitleScreen();
    setTimeout(() => {
      startWorld();
    }, 1200);
  });

  loadBtn?.addEventListener('click', () => {
    const result = loadGame();
    if (result.success) {
      hideTitleScreen();
      updateHUD();
      setTimeout(() => startWorld(), 1200);
    } else {
      showToast(`Load failed: ${result.error}`, 'danger');
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   KEYBOARD CONTROLS
   ════════════════════════════════════════════════════════════════════════════ */

function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Don't intercept if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    const mode = STATE.mode;

    switch (key) {
      /* ── ESC: close any open modal ── */
      case 'escape':
        closeAllModals();
        break;

      /* ── SPACE: interact / advance ── */
      case ' ':
        e.preventDefault();
        if (mode === 'explore' || mode === 'dialogue') {
          // Advance: try to click the first choice
          const firstChoice = document.querySelector('.choice-btn');
          if (firstChoice) firstChoice.click();
        }
        break;

      /* ── I: inventory ── */
      case 'i':
        if (mode === 'combat') break;
        toggleModal('modal-inventory', () => {
          renderInventory();
          initTrashArea();
          updateHUD();
        });
        break;

      /* ── E: abilities ── */
      case 'e':
        if (mode === 'combat') break;
        toggleModal('modal-abilities', () => {
          renderAbilityMenu();
        });
        break;

      /* ── Q: quests ── */
      case 'q':
        if (mode === 'combat') break;
        toggleModal('modal-quests', () => {
          renderQuestLog('active');
        });
        break;

      /* ── Number keys 1–9: select choices ── */
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9': {
        const idx = parseInt(key) - 1;
        const choices = [...document.querySelectorAll('.choice-btn')];
        if (choices[idx]) choices[idx].click();
        break;
      }
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   MODAL TOGGLE
   ════════════════════════════════════════════════════════════════════════════ */

function toggleModal(modalId, onOpen) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  if (modal.classList.contains('hidden')) {
    closeAllModals();
    if (onOpen) onOpen();
    openModal(modalId);
  } else {
    closeModal(modalId);
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   MODAL CLOSE BUTTONS
   ════════════════════════════════════════════════════════════════════════════ */

function setupModalClose() {
  document.querySelectorAll('.modal-close[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.dataset.close);
    });
  });

  // Click backdrop to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   COMBAT BUTTONS
   ════════════════════════════════════════════════════════════════════════════ */

function setupCombatButtons() {
  document.getElementById('combat-actions')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.combat-btn');
    if (!btn || btn.disabled) return;
    const action = btn.dataset.action;
    if (action) handleCombatAction(action);
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   SAVE / LOAD / NEW buttons in HUD
   ════════════════════════════════════════════════════════════════════════════ */

function setupSaveButtons() {
  document.getElementById('btn-save')?.addEventListener('click', () => {
    const result = saveGame();
    if (result.success) {
      showToast('Game saved.', 'gold');
    } else {
      showToast(`Save failed: ${result.error}`, 'danger');
    }
  });

  document.getElementById('btn-load')?.addEventListener('click', async () => {
    if (!hasSave()) {
      showToast('No save file found.', 'danger');
      return;
    }
    const { showConfirm } = await import('./js/ui.js');
    const confirmed = await showConfirm('LOAD GAME', 'Load your last save? Current progress will be lost.');
    if (!confirmed) return;

    const result = loadGame();
    if (result.success) {
      updateHUD();
      navigate(STATE.location);
      showToast('Game loaded.', 'success');
    } else {
      showToast(`Load failed: ${result.error}`, 'danger');
    }
  });

  document.getElementById('btn-new')?.addEventListener('click', async () => {
    const { showConfirm } = await import('./js/ui.js');
    const confirmed = await showConfirm('NEW GAME', 'Start a new game? All current progress will be lost.');
    if (!confirmed) return;

    import('./js/save.js').then(({ deleteSave }) => {
      deleteSave();
      location.reload();
    });
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   MODAL BUTTON SETUP
   ════════════════════════════════════════════════════════════════════════════ */

function setupModalButtons() {
  // Inventory open via button would go here (keyboard already handled)

  // Quest tab switching
  // (handled in setupQuestTabs below)
}

/* ════════════════════════════════════════════════════════════════════════════
   QUEST TABS
   ════════════════════════════════════════════════════════════════════════════ */

function setupQuestTabs() {
  document.querySelectorAll('.quest-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.quest-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderQuestLog(tab.dataset.tab);
    });
  });
}

