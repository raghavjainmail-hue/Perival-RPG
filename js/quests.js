/**
 * quests.js — Quest system: definitions, activation, and completion.
 */

import { STATE, setFlag } from './state.js';
import { showToast } from './ui.js';

/* ════════════════════════════════════════════════════════════════════════════
   QUEST DEFINITIONS
   ════════════════════════════════════════════════════════════════════════════ */

export const QUEST_DEFS = {

  /* ── MAIN QUESTS ─────────────────────────────────────────────────────── */

  enter_the_keep: {
    id:          'enter_the_keep',
    name:        'Enter the Ashen Keep',
    type:        'main',
    description: 'Find a way into the Ashen Keep. There are several approaches — choose wisely.',
    objectives: [
      { id: 'reach_castle', text: 'Reach the castle approach', done: false },
      { id: 'find_entry',   text: 'Discover an entry point', done: false },
      { id: 'enter_castle', text: 'Enter the castle',         done: false },
    ],
    xpReward:   100,
    goldReward: 0,
    itemReward: null,
    onComplete: () => setFlag('castleEntered', true),
  },

  reach_the_dungeon: {
    id:          'reach_the_dungeon',
    name:        'Beneath the Keep',
    type:        'main',
    description: 'Something is beneath the castle. Find a way into the lower dungeon.',
    objectives: [
      { id: 'find_dungeon_entrance', text: 'Locate the dungeon entrance', done: false },
      { id: 'descend',              text: 'Descend into the dungeon',    done: false },
    ],
    xpReward:   150,
    goldReward: 0,
    itemReward: null,
    onComplete: () => setFlag('dungeon_discovered', true),
  },

  face_leviora: {
    id:          'face_leviora',
    name:        'The Dragon Beneath',
    type:        'main',
    description: 'The dragon Leviora stirs beneath the castle. Face it before it escapes.',
    objectives: [
      { id: 'discover_leviora', text: 'Discover the source of the corruption', done: false },
      { id: 'fight_leviora',   text: 'Face Leviora',                           done: false },
      { id: 'end',             text: 'Survive',                                 done: false },
    ],
    xpReward:   500,
    goldReward: 100,
    itemReward: null,
    onComplete: () => setFlag('leviora_fought', true),
  },

  /* ── OPTIONAL QUESTS ─────────────────────────────────────────────────── */

  the_wanderer: {
    id:          'the_wanderer',
    name:        "The Wanderer's Note",
    type:        'optional',
    description: 'Aldric gave you a note to deliver to a prisoner named Edran in the deep dungeon. He wouldn\'t say what it contains.',
    objectives: [
      { id: 'find_edran',   text: 'Find Edran in the dungeon',  done: false },
      { id: 'deliver_note', text: 'Deliver the note',           done: false },
    ],
    xpReward:   80,
    goldReward: 25,
    itemReward: 'torn_map',
    onComplete: () => setFlag('edranFound', true),
  },

  harlin_crate: {
    id:          'harlin_crate',
    name:        "Harlin's Lost Cargo",
    type:        'optional',
    description: 'Harlin the merchant lost a crate near the forest ruins. Retrieve it — or confirm it\'s gone. In return, he may help you enter the castle.',
    objectives: [
      { id: 'find_ruins',  text: 'Find the forest ruins',        done: false },
      { id: 'find_crate',  text: 'Locate Harlin\'s crate',       done: false },
      { id: 'report_back', text: 'Report back to Harlin',        done: false },
    ],
    xpReward:   60,
    goldReward: 20,
    itemReward: null,
    onComplete: () => setFlag('harlinQuestDone', true),
  },

  the_missing_child: {
    id:          'the_missing_child',
    name:        'The Missing Child',
    type:        'optional',
    description: 'Seven children have vanished from Millhaven. A mother named Miren is still searching. Find what happened to her child.',
    objectives: [
      { id: 'talk_miren',      text: 'Speak to Miren',                           done: false },
      { id: 'check_mill',      text: 'Investigate the abandoned mill',            done: false },
      { id: 'find_child',      text: 'Find the child (or what happened to them)', done: false },
    ],
    xpReward:   90,
    goldReward: 30,
    itemReward: 'silver_locket',
    onComplete: () => setFlag('childQuestDone', true),
  },

  the_mordis_job: {
    id:          'the_mordis_job',
    name:        'The Mordis Job',
    type:        'optional',
    description: 'A hooded stranger wants Mordis, Varek\'s chief advisor, eliminated. He claims Mordis is responsible for the growing corruption. Verify this before acting — or ignore it entirely.',
    objectives: [
      { id: 'find_mordis',  text: 'Locate Mordis inside the castle',   done: false },
      { id: 'investigate',  text: 'Discover what Mordis is doing',     done: false },
      { id: 'decide',       text: 'Decide his fate',                   done: false },
    ],
    xpReward:   120,
    goldReward: 70,
    itemReward: 'castle_key_west',
    onComplete: () => setFlag('mordisDealt', true),
  },

  harlin_job: {
    id:          'harlin_job',
    name:        'Harlin\'s Assistant',
    type:        'optional',
    description: 'Travel with Harlin as his "assistant" to gain entry to the castle trade yard.',
    objectives: [
      { id: 'travel_with_harlin', text: 'Travel with Harlin to the castle', done: false },
      { id: 'enter_trade_gate',   text: 'Enter through the trade gate',     done: false },
    ],
    xpReward:   50,
    goldReward: 0,
    itemReward: null,
    onComplete: () => setFlag('castleEntered', true),
  },
};

/* ════════════════════════════════════════════════════════════════════════════
   QUEST MANAGEMENT
   ════════════════════════════════════════════════════════════════════════════ */

export function activateQuest(questId) {
  if (STATE.activeQuests.includes(questId)) return;
  if (STATE.completedQuests.includes(questId)) return;
  const def = QUEST_DEFS[questId];
  if (!def) return;
  STATE.activeQuests.push(questId);
  // Reset objectives
  def.objectives.forEach(o => o.done = false);
}

export function completeObjective(questId, objectiveId) {
  const def = QUEST_DEFS[questId];
  if (!def) return;
  const obj = def.objectives.find(o => o.id === objectiveId);
  if (!obj || obj.done) return;
  obj.done = true;
  showToast(`✓ ${def.name}: ${obj.text}`, 'success');

  // Check if all objectives done
  if (def.objectives.every(o => o.done)) {
    completeQuest(questId);
  }
}

export function completeQuest(questId) {
  if (STATE.completedQuests.includes(questId)) return;
  STATE.activeQuests = STATE.activeQuests.filter(id => id !== questId);
  STATE.completedQuests.push(questId);

  const def = QUEST_DEFS[questId];
  if (!def) return;

  // Apply rewards
  import('./state.js').then(({ grantXP, addGold: aG, addItem }) => {
    if (def.xpReward)   grantXP(def.xpReward);
    if (def.goldReward) aG(def.goldReward);
    if (def.itemReward) addItem(def.itemReward, 1);
  });

  if (def.onComplete) def.onComplete();

  showToast(`Quest complete: "${def.name}"`, 'gold');
  import('./ui.js').then(ui => ui.updateHUD());
}

export function isQuestActive(questId)    { return STATE.activeQuests.includes(questId); }
export function isQuestComplete(questId)  { return STATE.completedQuests.includes(questId); }

/* ════════════════════════════════════════════════════════════════════════════
   QUEST LOG RENDERING
   ════════════════════════════════════════════════════════════════════════════ */

export function renderQuestLog(tab = 'active') {
  const listEl   = document.getElementById('quest-list');
  const detailEl = document.getElementById('quest-detail');
  if (!listEl || !detailEl) return;

  listEl.innerHTML   = '';
  detailEl.innerHTML = '<p style="color:var(--col-text-faint);font-style:italic">Select a quest for details.</p>';

  const quests = tab === 'active' ? STATE.activeQuests : STATE.completedQuests;
  const defs   = quests.map(id => QUEST_DEFS[id]).filter(Boolean);

  if (defs.length === 0) {
    listEl.innerHTML = `<p style="color:var(--col-text-faint);font-style:italic;padding:8px">
      ${tab === 'active' ? 'No active quests.' : 'No completed quests yet.'}
    </p>`;
    return;
  }

  defs.forEach(def => {
    const item = document.createElement('div');
    item.className = 'quest-item';
    item.innerHTML = `
      <div class="quest-item-name">${def.name}</div>
      <div class="quest-item-type ${def.type}">${def.type === 'main' ? '◈ MAIN QUEST' : '✦ OPTIONAL'}</div>`;

    item.addEventListener('click', () => {
      document.querySelectorAll('.quest-item').forEach(q => q.classList.remove('selected'));
      item.classList.add('selected');
      renderQuestDetail(def);
    });

    listEl.appendChild(item);
  });
}

function renderQuestDetail(def) {
  const el = document.getElementById('quest-detail');
  if (!el) return;

  const objHTML = def.objectives.map(o =>
    `<div class="quest-objective ${o.done ? 'done' : ''}">
      <span>${o.done ? '✓' : '○'}</span>
      <span>${o.text}</span>
    </div>`
  ).join('');

  const rewardHTML = [
    def.xpReward   ? `${def.xpReward} XP` : '',
    def.goldReward ? `${def.goldReward} Gold` : '',
    def.itemReward ? `Item reward` : '',
  ].filter(Boolean).join(' · ');

  el.innerHTML = `
    <div class="quest-detail-name">${def.name}</div>
    <div class="quest-detail-desc">${def.description}</div>
    ${objHTML}
    ${rewardHTML ? `<div style="margin-top:8px;font-family:var(--font-ui);font-size:0.6rem;color:var(--col-gold)">REWARD: ${rewardHTML}</div>` : ''}
  `;
}

