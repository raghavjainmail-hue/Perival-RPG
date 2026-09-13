/**
 * inventory.js — Inventory UI rendering and interactions.
 * Handles item display, selection, equipping, using, and deletion (with confirmation).
 */

import { STATE, removeItem, hasItem } from './state.js';
import { getItem } from './items.js';
import { updateHUD, showToast, showConfirm, openModal, closeModal } from './ui.js';

/* ════════════════════════════════════════════════════════════════════════════
   RENDER INVENTORY
   ════════════════════════════════════════════════════════════════════════════ */

let _selectedItemId = null;
let _merchantMode   = false; // set by merchant.js when open in merchant context

export function renderInventory() {
  const grid = document.getElementById('inv-grid');
  if (!grid) return;

  grid.innerHTML = '';
  _selectedItemId = null;
  clearDetail();

  // Update gold display in inventory header
  const goldEl = document.getElementById('inv-gold-display');
  if (goldEl) goldEl.textContent = `◈ ${STATE.player.gold} Gold`;

  if (STATE.inventory.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--col-text-faint);font-style:italic;">
      Your pack is empty.</div>`;
    return;
  }

  STATE.inventory.forEach(slot => {
    const item = getItem(slot.id);
    if (!item) return;

    const cell = document.createElement('div');
    cell.className = 'inv-cell';
    cell.dataset.id = slot.id;

    // Mark as equipped
    const isEquippedW = STATE.equippedWeapon === slot.id;
    const isEquippedA = STATE.equippedArmor  === slot.id;
    if (isEquippedW || isEquippedA) cell.classList.add('equipped');

    cell.innerHTML = `
      <span class="inv-cell-icon">${item.icon}</span>
      <span class="inv-cell-label">${item.name}</span>
      ${slot.qty > 1 ? `<span class="inv-cell-qty">×${slot.qty}</span>` : ''}`;

    cell.addEventListener('click', () => selectItem(slot.id));
    grid.appendChild(cell);
  });
}

function selectItem(itemId) {
  _selectedItemId = itemId;

  // Visual selection
  document.querySelectorAll('.inv-cell').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === itemId);
  });

  renderDetail(itemId);
}

/* ════════════════════════════════════════════════════════════════════════════
   ITEM DETAIL PANE
   ════════════════════════════════════════════════════════════════════════════ */

function renderDetail(itemId) {
  const item = getItem(itemId);
  const slot = STATE.inventory.find(s => s.id === itemId);
  if (!item || !slot) return;

  document.getElementById('inv-detail-name').textContent = item.name;
  document.getElementById('inv-detail-type').textContent = (item.type || '').toUpperCase() +
    (item.rarity ? ` · ${item.rarity.toUpperCase()}` : '');

  // Build stats block
  let statsHTML = '';
  if (item.type === 'weapon' && item.damage) {
    const [min, max] = item.damage;
    statsHTML += `<div class="stat-row"><span>DAMAGE</span><span class="val">${min}–${max}</span></div>`;
    statsHTML += `<div class="stat-row"><span>SPEED</span><span class="val">${item.speed}</span></div>`;
    if (item.ability) {
      statsHTML += `<div class="stat-row"><span>ABILITY</span><span class="val">${item.ability.replace(/_/g,' ').toUpperCase()}</span></div>`;
    }
  }
  if (item.type === 'armor') {
    statsHTML += `<div class="stat-row"><span>DEFENSE</span><span class="val">${item.defense}</span></div>`;
    if (item.effect) {
      statsHTML += `<div class="stat-row"><span>EFFECT</span><span class="val">${item.effect.replace(/_/g,' ').toUpperCase()}</span></div>`;
    }
  }
  if (item.type === 'consumable') {
    if (item.healAmount)    statsHTML += `<div class="stat-row"><span>HEAL</span><span class="val">+${item.healAmount} HP</span></div>`;
    if (item.staminaAmount) statsHTML += `<div class="stat-row"><span>STAMINA</span><span class="val">+${item.staminaAmount}</span></div>`;
    if (item.tempDefense)   statsHTML += `<div class="stat-row"><span>DEFENSE BUFF</span><span class="val">+${item.tempDefense}</span></div>`;
  }
  if (item.sellPrice > 0) {
    statsHTML += `<div class="stat-row"><span>SELL VALUE</span><span class="val">${item.sellPrice} gold</span></div>`;
  }
  if (slot.qty > 1) {
    statsHTML += `<div class="stat-row"><span>QUANTITY</span><span class="val">×${slot.qty}</span></div>`;
  }

  document.getElementById('inv-detail-stats').innerHTML = statsHTML;
  document.getElementById('inv-detail-desc').textContent  = `"${item.description}"`;

  // Action buttons
  renderDetailActions(item, slot);
}

function renderDetailActions(item, slot) {
  const actionsEl = document.getElementById('inv-detail-actions');
  if (!actionsEl) return;
  actionsEl.innerHTML = '';

  // EQUIP / UNEQUIP
  if (item.type === 'weapon') {
    const isEquipped = STATE.equippedWeapon === item.id;
    const btn = document.createElement('button');
    btn.className = 'inv-action-btn equip-btn';
    btn.textContent = isEquipped ? 'UNEQUIP' : 'EQUIP WEAPON';
    btn.addEventListener('click', () => {
      STATE.equippedWeapon = isEquipped ? null : item.id;
      updateHUD();
      renderInventory();
      showToast(isEquipped ? `${item.name} unequipped.` : `${item.name} equipped.`, 'success');
    });
    actionsEl.appendChild(btn);
  }

  if (item.type === 'armor') {
    const isEquipped = STATE.equippedArmor === item.id;
    const btn = document.createElement('button');
    btn.className = 'inv-action-btn equip-btn';
    btn.textContent = isEquipped ? 'UNEQUIP' : 'EQUIP ARMOR';
    btn.addEventListener('click', () => {
      STATE.equippedArmor = isEquipped ? null : item.id;
      updateHUD();
      renderInventory();
      showToast(isEquipped ? `${item.name} unequipped.` : `${item.name} equipped.`, 'success');
    });
    actionsEl.appendChild(btn);
  }

  // USE (consumables only, not in combat via inventory modal)
  if (item.type === 'consumable' && !STATE.inCombat) {
    const btn = document.createElement('button');
    btn.className = 'inv-action-btn use-btn';
    btn.textContent = 'USE';
    btn.addEventListener('click', () => useItem(item));
    actionsEl.appendChild(btn);
  }

  // DISCARD button (leads to confirmation)
  if (item.type !== 'quest') {
    const discardBtn = document.createElement('button');
    discardBtn.className = 'inv-action-btn';
    discardBtn.style.borderColor = 'var(--col-danger)';
    discardBtn.textContent = 'DISCARD';
    discardBtn.addEventListener('click', () => discardItem(item));
    actionsEl.appendChild(discardBtn);
  }
}

function clearDetail() {
  document.getElementById('inv-detail-name').textContent = '';
  document.getElementById('inv-detail-type').textContent = '';
  document.getElementById('inv-detail-stats').innerHTML  = '';
  document.getElementById('inv-detail-desc').textContent = '';
  document.getElementById('inv-detail-actions').innerHTML = '';
}

/* ════════════════════════════════════════════════════════════════════════════
   ITEM ACTIONS
   ════════════════════════════════════════════════════════════════════════════ */

function useItem(item) {
  if (item.type !== 'consumable') return;

  import('./state.js').then(({ modifyHP, modifyStamina }) => {
    if (item.healAmount) {
      modifyHP(item.healAmount);
      showToast(`Used ${item.name}. +${item.healAmount} HP.`, 'success');
    }
    if (item.staminaAmount) {
      modifyStamina(item.staminaAmount);
      showToast(`Used ${item.name}. +${item.staminaAmount} Stamina.`, 'success');
    }
    removeItem(item.id, 1);
    updateHUD();
    renderInventory();
  });
}

/**
 * Discard an item — always shows confirmation dialog first.
 */
async function discardItem(item) {
  const confirmed = await showConfirm(
    'DISCARD ITEM',
    `Are you sure you want to discard "${item.name}"?`
  );

  if (!confirmed) return;

  // Unequip if active
  if (STATE.equippedWeapon === item.id) STATE.equippedWeapon = null;
  if (STATE.equippedArmor  === item.id) STATE.equippedArmor  = null;

  removeItem(item.id);
  updateHUD();
  renderInventory();
  showToast(`${item.name} discarded.`, '');
}

/* ════════════════════════════════════════════════════════════════════════════
   TRASH BIN AREA (drag-to-delete)
   ════════════════════════════════════════════════════════════════════════════ */

export function initTrashArea() {
  const trashEl = document.getElementById('trash-drop');
  if (!trashEl) return;

  trashEl.addEventListener('click', async () => {
    if (!_selectedItemId) {
      showToast('Select an item first.', '');
      return;
    }
    const item = getItem(_selectedItemId);
    if (!item) return;
    if (item.type === 'quest') {
      showToast('Quest items cannot be discarded.', 'danger');
      return;
    }
    await discardItem(item);
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   MERCHANT INTEGRATION
   ════════════════════════════════════════════════════════════════════════════ */

export function renderMerchantPlayerInv(merchantId) {
  const listEl = document.getElementById('merchant-player-inv');
  if (!listEl) return;
  listEl.innerHTML = '';

  const sellable = STATE.inventory.filter(slot => {
    const item = getItem(slot.id);
    return item && item.type !== 'quest' && item.sellPrice > 0;
  });

  if (sellable.length === 0) {
    listEl.innerHTML = `<div style="padding:8px;color:var(--col-text-faint);font-style:italic;">Nothing to sell.</div>`;
    return;
  }

  sellable.forEach(slot => {
    const item = getItem(slot.id);
    const row = document.createElement('div');
    row.className = 'merchant-item';
    row.innerHTML = `
      <span class="merchant-item-icon">${item.icon}</span>
      <span class="merchant-item-name">${item.name} ${slot.qty > 1 ? `×${slot.qty}` : ''}</span>
      <span class="merchant-item-price">${item.sellPrice}g</span>`;
    row.addEventListener('click', (e) => selectMerchantSellItem(e, item, slot));
    listEl.appendChild(row);
  });
}

function selectMerchantSellItem(e, item, slot) {
  const detailEl  = document.getElementById('merchant-detail');
  if (!detailEl) return;

  document.querySelectorAll('#merchant-player-inv .merchant-item')
    .forEach(r => r.classList.remove('selected'));
  e.currentTarget?.classList.add('selected');

  detailEl.innerHTML = `
    <div class="merchant-detail-name">${item.icon} ${item.name}</div>
    <div class="merchant-detail-desc">"${item.description}"</div>
    <div class="merchant-detail-actions">
      <button class="merchant-btn sell" id="sell-btn">SELL for ${item.sellPrice}g</button>
    </div>`;

  document.getElementById('sell-btn')?.addEventListener('click', () => {
    import('./state.js').then(({ addGold }) => {
      removeItem(item.id, 1);
      addGold(item.sellPrice);
      updateHUD();
      const goldDisplay = document.getElementById('merchant-gold-display');
      if (goldDisplay) goldDisplay.textContent = STATE.player.gold;
      import('./ui.js').then(ui => {
        ui.showToast(`Sold ${item.name} for ${item.sellPrice} gold.`, 'gold');
        ui.updateHUD();
      });
      detailEl.innerHTML = '<div style="color:var(--col-text-faint);font-style:italic;padding:8px;">Item sold.</div>';
      renderMerchantPlayerInv();
    });
  });
}

