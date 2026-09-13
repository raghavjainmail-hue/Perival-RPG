/**
 * ui.js — All rendering, animation, and DOM manipulation helpers.
 *
 * No game logic here — only presentation.
 */

import { STATE } from './state.js';
import { getItem } from './items.js';

/* ── DOM refs (cached on init) ──────────────────────────────────────────── */
let _refs = {};

export function initUI() {
  _refs = {
    hpFill:        document.getElementById('hp-bar-fill'),
    hpCurrent:     document.getElementById('hp-current'),
    hpMax:         document.getElementById('hp-max'),
    staminaFill:   document.getElementById('stamina-bar-fill'),
    staminaCurrent:document.getElementById('stamina-current'),
    staminaMax:    document.getElementById('stamina-max'),
    hpGlow:        document.getElementById('hp-bar-glow'),
    goldDisplay:   document.getElementById('hud-gold'),
    levelDisplay:  document.getElementById('hud-level'),
    weaponDisplay: document.getElementById('hud-weapon-name'),
    actText:       document.getElementById('act-text'),
    textContent:   document.getElementById('text-content'),
    typingCursor:  document.getElementById('typing-cursor'),
    choicesPanel:  document.getElementById('choices-panel'),
    combatPanel:   document.getElementById('combat-panel'),
    sceneBg:       document.getElementById('scene-bg'),
    locationText:  document.getElementById('location-text'),
    damageOverlay: document.getElementById('damage-overlay'),
    toastContainer:document.getElementById('toast-container'),
    invGoldDisplay:document.getElementById('inv-gold-display'),
    merchantGoldDisplay: document.getElementById('merchant-gold-display'),
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   HUD UPDATES
   ══════════════════════════════════════════════════════════════════════════ */

export function updateHUD() {
  const p = STATE.player;

  // HP bar
  const hpPct = (p.hp / p.maxHp) * 100;
  if (_refs.hpFill) {
    _refs.hpFill.style.width = `${hpPct}%`;
    _refs.hpFill.className   = 'hp-bar-fill' +
      (hpPct <= 20 ? ' critical' : hpPct <= 40 ? ' low' : '');
  }
  if (_refs.hpCurrent) _refs.hpCurrent.textContent = p.hp;
  if (_refs.hpMax)     _refs.hpMax.textContent     = p.maxHp;

  // Stamina bar
  const staPct = (p.stamina / p.maxStamina) * 100;
  if (_refs.staminaFill) _refs.staminaFill.style.width = `${staPct}%`;
  if (_refs.staminaCurrent) _refs.staminaCurrent.textContent = p.stamina;
  if (_refs.staminaMax)     _refs.staminaMax.textContent     = p.maxStamina;

  // Gold / Level
  if (_refs.goldDisplay)  _refs.goldDisplay.textContent  = p.gold;
  if (_refs.levelDisplay) _refs.levelDisplay.textContent = p.level;

  // Equipped weapon
  if (_refs.weaponDisplay) {
    const item = STATE.equippedWeapon ? getItem(STATE.equippedWeapon) : null;
    _refs.weaponDisplay.textContent = item ? item.name : '— None —';
  }

  // Merchant / inventory gold mirrors
  if (_refs.invGoldDisplay)      _refs.invGoldDisplay.textContent     = `◈ ${p.gold} Gold`;
  if (_refs.merchantGoldDisplay) _refs.merchantGoldDisplay.textContent = p.gold;
}

export function updateActLabel(text) {
  if (_refs.actText) _refs.actText.textContent = text;
}

/* ══════════════════════════════════════════════════════════════════════════
   SCENE / LOCATION
   ══════════════════════════════════════════════════════════════════════════ */

const SCENE_CLASSES = {
  forest_entrance:   'scene-forest',
  deep_forest:       'scene-forest',
  forest_ruins:      'scene-forest',
  forest_stream:     'scene-stream',
  millhaven:         'scene-settlement',
  settlement_road:   'scene-settlement',
  castle_road:       'scene-castle-road',
  castle_exterior:   'scene-castle-exterior',
  castle_courtyard:  'scene-castle-exterior',
  castle_interior:   'scene-dungeon',
  dungeon_entrance:  'scene-dungeon',
  dungeon_deep:      'scene-dungeon',
  leviora_arena:     'scene-dungeon',
};

export function setScene(locationId, label) {
  const bg = _refs.sceneBg;
  if (!bg) return;

  // Fade out → change → fade in
  bg.style.opacity = '0';
  bg.style.transition = 'opacity 0.6s ease';

  setTimeout(() => {
    // Remove all scene classes
    Object.values(SCENE_CLASSES).forEach(c => bg.classList.remove(c));
    const cls = SCENE_CLASSES[locationId] || 'scene-forest';
    bg.classList.add(cls);
    bg.style.opacity = '1';
  }, 300);

  if (label && _refs.locationText) {
    _refs.locationText.textContent = label;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   TEXT / NARRATION DISPLAY
   ══════════════════════════════════════════════════════════════════════════ */

let _typewriterTimer = null;

/** Clear the text panel and show cursor while typing. */
export function clearText() {
  if (_refs.textContent) _refs.textContent.innerHTML = '';
  if (_refs.typingCursor) _refs.typingCursor.classList.remove('hidden');
}

/**
 * Append text to the text panel as an HTML paragraph.
 * @param {string} html - HTML content
 * @param {string} className - CSS class to apply to paragraph
 */
export function appendText(html, className = '') {
  if (!_refs.textContent) return;
  const p = document.createElement('p');
  if (className) p.className = className;
  p.innerHTML = html;
  _refs.textContent.appendChild(p);
  // Scroll to bottom
  const panel = document.getElementById('text-panel');
  if (panel) panel.scrollTop = panel.scrollHeight;
}

/**
 * Show narration text (typewriter effect).
 * paragraphs: array of { text, cls } or plain strings
 */
export function showNarration(paragraphs, onComplete) {
  clearText();
  hideCursor();

  const items = paragraphs.map(p =>
    typeof p === 'string' ? { text: p, cls: 'text-narration' } : p
  );

  let index = 0;

  function showNext() {
    if (index >= items.length) {
      if (onComplete) onComplete();
      return;
    }
    const { text, cls } = items[index];
    appendText(text, cls);
    index++;
    // Small delay between paragraphs for pacing
    _typewriterTimer = setTimeout(showNext, 60);
  }

  showNext();
}

/** Immediately print all text without delay. */
export function showTextImmediate(paragraphs) {
  clearText();
  hideCursor();
  const items = paragraphs.map(p =>
    typeof p === 'string' ? { text: p, cls: 'text-narration' } : p
  );
  items.forEach(({ text, cls }) => appendText(text, cls));
}

function hideCursor() {
  if (_refs.typingCursor) _refs.typingCursor.classList.add('hidden');
}

/* ══════════════════════════════════════════════════════════════════════════
   CHOICES
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Show choice buttons.
 * choices: [{ label, action }]
 *   action: (choiceObj) => void
 */
export function showChoices(choices) {
  const panel = _refs.choicesPanel;
  if (!panel) return;
  panel.innerHTML = '';
  panel.classList.remove('hidden');

  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className   = 'choice-btn';
    btn.textContent = choice.label;
    btn.addEventListener('click', () => {
      hideChoices();
      choice.action(choice);
    });
    panel.appendChild(btn);
  });
}

export function hideChoices() {
  if (_refs.choicesPanel) {
    _refs.choicesPanel.innerHTML = '';
    _refs.choicesPanel.classList.add('hidden');
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   COMBAT UI
   ══════════════════════════════════════════════════════════════════════════ */

export function showCombatUI(enemy) {
  hideChoices();
  const panel = _refs.combatPanel;
  if (!panel) return;
  panel.classList.remove('hidden');

  document.getElementById('combat-enemy-name').textContent = enemy.name;
  document.getElementById('combat-enemy-sprite').textContent = enemy.icon;
  document.getElementById('combat-enemy-status').textContent = '';
  updateEnemyHP(enemy);
  clearCombatLog();
}

export function hideCombatUI() {
  if (_refs.combatPanel) _refs.combatPanel.classList.add('hidden');
}

export function updateEnemyHP(enemy) {
  const pct  = (enemy.hp / enemy.maxHp) * 100;
  const fill = document.getElementById('enemy-hp-fill');
  const text = document.getElementById('enemy-hp-text');
  if (fill) fill.style.width = `${pct}%`;
  if (text) text.textContent = `${enemy.hp} / ${enemy.maxHp}`;
}

export function appendCombatLog(message, cls = '') {
  const log = document.getElementById('combat-log');
  if (!log) return;
  const line = document.createElement('div');
  line.className = `combat-log-line ${cls}`;
  line.textContent = message;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

export function clearCombatLog() {
  const log = document.getElementById('combat-log');
  if (log) log.innerHTML = '';
}

export function setEnemyStatus(text) {
  const el = document.getElementById('combat-enemy-status');
  if (el) el.textContent = text;
}

export function setCombatButtonsEnabled(enabled) {
  document.querySelectorAll('.combat-btn').forEach(btn => {
    btn.disabled = !enabled;
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   DAMAGE NUMBERS
   ══════════════════════════════════════════════════════════════════════════ */

export function showDamageNumber(amount, type = 'enemy-dmg', x, y) {
  const overlay = _refs.damageOverlay;
  if (!overlay) return;

  // Default position: random within the combat/scene area
  const px = x ?? (30 + Math.random() * 40);
  const py = y ?? (20 + Math.random() * 30);

  const el = document.createElement('div');
  el.className   = `dmg-number ${type}`;
  el.textContent = type === 'heal-num' ? `+${amount}` : `-${amount}`;
  el.style.left  = `${px}%`;
  el.style.top   = `${py}%`;
  overlay.appendChild(el);

  // Flash the scene on player damage
  if (type === 'player-dmg') {
    flashScene('damage-flash');
  }

  setTimeout(() => el.remove(), 1400);
}

function flashScene(cls) {
  const viewport = document.getElementById('scene-viewport');
  if (!viewport) return;
  viewport.classList.add(cls);
  setTimeout(() => viewport.classList.remove(cls), 350);
}

/* ══════════════════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════════════════════════════════════════ */

export function showToast(message, type = '') {
  const container = _refs.toastContainer;
  if (!container) return;

  const toast = document.createElement('div');
  toast.className   = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3200);
}

/* ══════════════════════════════════════════════════════════════════════════
   MODAL HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    STATE.mode = 'menu';
  }
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
  // Only reset mode if no other modal is open
  const anyOpen = document.querySelectorAll('.modal:not(.hidden)').length > 0;
  if (!anyOpen) STATE.mode = 'explore';
}

export function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  STATE.mode = 'explore';
}

/** Show a confirmation dialog. Returns a promise resolving to true/false. */
export function showConfirm(title, message) {
  return new Promise(resolve => {
    document.getElementById('confirm-title').textContent   = title;
    document.getElementById('confirm-message').textContent = message;
    openModal('modal-confirm');

    const yesBtn = document.getElementById('confirm-yes');
    const noBtn  = document.getElementById('confirm-no');

    function cleanup() {
      closeModal('modal-confirm');
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener ('click', onNo);
    }
    function onYes() { cleanup(); resolve(true);  }
    function onNo()  { cleanup(); resolve(false); }

    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener ('click', onNo);
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   LEVEL UP DISPLAY
   ══════════════════════════════════════════════════════════════════════════ */

export function showLevelUp(newLevel) {
  showToast(`⬆ LEVEL UP! You are now Level ${newLevel}. HP restored.`, 'gold');
  showTextImmediate([{
    text: `<strong>You feel stronger.</strong> Level ${newLevel}. The world feels slightly less capable of killing you.`,
    cls: 'text-system'
  }]);
}

/* ══════════════════════════════════════════════════════════════════════════
   TITLE SCREEN
   ══════════════════════════════════════════════════════════════════════════ */

export function hideTitleScreen() {
  const ts = document.getElementById('title-screen');
  if (!ts) return;
  ts.style.transition = 'opacity 1.2s ease';
  ts.style.opacity = '0';
  setTimeout(() => {
    ts.style.display = 'none';
  }, 1200);
}

/* ══════════════════════════════════════════════════════════════════════════
   PARTICLE SYSTEM (subtle lantern sparks / magic dust)
   ══════════════════════════════════════════════════════════════════════════ */

let _particleCtx  = null;
let _particleList = [];
let _particleRAF  = null;

export function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  _particleCtx = canvas.getContext('2d');
  spawnParticleBatch('lantern');
  animateParticles();
}

function spawnParticleBatch(type) {
  const count = type === 'magic' ? 20 : 12;
  for (let i = 0; i < count; i++) {
    _particleList.push(createParticle(type));
  }
}

function createParticle(type) {
  const canvas = document.getElementById('particle-canvas');
  return {
    x: Math.random() * (canvas?.width  ?? 800),
    y: Math.random() * (canvas?.height ?? 500),
    vx: (Math.random() - 0.5) * 0.3,
    vy: -(0.2 + Math.random() * 0.5),
    life: Math.random(),
    maxLife: 0.6 + Math.random() * 0.4,
    size: type === 'magic' ? (1.5 + Math.random() * 2) : (0.8 + Math.random() * 1.5),
    type,
    color: type === 'magic'
      ? `hsl(${270 + Math.random() * 40}, 70%, ${50 + Math.random() * 30}%)`
      : `hsl(${35 + Math.random() * 25}, 80%, ${50 + Math.random() * 25}%)`,
  };
}

function animateParticles() {
  const ctx    = _particleCtx;
  const canvas = document.getElementById('particle-canvas');
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  _particleList = _particleList.filter(p => {
    p.x   += p.vx;
    p.y   += p.vy;
    p.life = Math.max(0, p.life - 0.004);

    const alpha = (p.life / p.maxLife) * 0.7;
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    return p.life > 0;
  });

  // Keep a steady count
  while (_particleList.length < 12) {
    _particleList.push(createParticle('lantern'));
  }

  ctx.globalAlpha = 1;
  _particleRAF = requestAnimationFrame(animateParticles);
}

/** Burst of magic particles (used for ability effects). */
export function spawnMagicBurst() {
  spawnParticleBatch('magic');
}

