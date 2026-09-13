/**
 * world.js — Location definitions and scene transitions.
 *
 * Each location is a node in the game world with:
 * - Description text
 * - Navigation choices
 * - NPCs
 * - Enemy encounters
 * - Items / pickups
 * - Special events
 */

import { STATE, setFlag, getFlag, addItem, removeItem, hasItem, addGold, spendGold } from './state.js';
import { showNarration, showChoices, showTextImmediate, appendText,
         setScene, hideChoices, showToast, openModal, closeModal,
         updateHUD, updateActLabel } from './ui.js';
import { startCombat } from './combat.js';
import { spawnEnemy } from './enemies.js';
import { startDialogue } from './dialogue.js';
import { ALL_NPCS } from './npcs.js';
import { activateQuest, completeObjective, completeQuest, renderQuestLog } from './quests.js';
import { renderInventory, renderMerchantPlayerInv, initTrashArea } from './inventory.js';
import { renderAbilityMenu } from './abilities.js';
import { getItem } from './items.js';

/* ── Merchant stock definitions ─────────────────────────────────────────── */
const MERCHANT_STOCK = {
  harlin: [
    { itemId: 'healing_herb',    qty: 5, buyPrice: 6  },
    { itemId: 'tonic_of_mending',qty: 2, buyPrice: 22 },
    { itemId: 'stamina_draught', qty: 3, buyPrice: 12 },
    { itemId: 'iron_shortsword', qty: 1, buyPrice: 30 },
    { itemId: 'leather_armor',   qty: 1, buyPrice: 25 },
    { itemId: 'lantern_oil',     qty: 3, buyPrice: 4  },
    { itemId: 'elixir_of_iron',  qty: 2, buyPrice: 28 },
  ],
};

/* ══════════════════════════════════════════════════════════════════════════
   NAVIGATE — main entry point. Call to transition to any location.
   ══════════════════════════════════════════════════════════════════════════ */

export function navigate(locationId) {
  if (STATE.mode === 'combat' || STATE.mode === 'menu') return;

  STATE.previousLocation = STATE.location;
  STATE.location         = locationId;

  const handler = LOCATIONS[locationId];
  if (!handler) {
    console.warn(`Unknown location: ${locationId}`);
    navigate('forest_entrance');
    return;
  }

  handler();
}

/* ══════════════════════════════════════════════════════════════════════════
   LOCATION HANDLERS
   ══════════════════════════════════════════════════════════════════════════ */

const LOCATIONS = {

  /* ── ACT I: THE WOODS ──────────────────────────────────────────────── */

  forest_entrance: () => {
    setScene('forest_entrance', 'The Ashen Forest');
    updateActLabel('ACT I · THE WOODS');

    // First time — cinematic opening
    if (!getFlag('openingShown')) {
      setFlag('openingShown', true);
      showNarration([
        { text: 'The trees close behind you like a door.', cls: 'text-narration' },
        { text: 'The Ashen Forest. You\'ve heard the name before, spoken by people who came back from it and couldn\'t quite explain what they\'d seen.', cls: 'text-narration' },
        { text: 'It\'s night. It\'s always night in stories like this.', cls: 'text-narration' },
        { text: 'The path ahead is narrow. The trees are enormous. And somewhere far ahead, above everything, there is a shape against the sky — too massive, too dark, too deliberate to be natural.', cls: 'text-narration' },
        { text: 'The castle.', cls: 'text-important' },
        { text: 'You move forward.', cls: 'text-narration' },
      ], () => showForestEntranceChoices());
    } else {
      showForestEntranceChoices();
    }
  },

  deep_forest: () => {
    setScene('deep_forest', 'Deep Forest');

    const hasWolfFought = getFlag('wolfDefeated');

    showTextImmediate([
      { text: 'The path grows narrower. The light, thinner.', cls: 'text-narration' },
      { text: 'You hear something in the undergrowth. Something that breathes wrong.', cls: 'text-narration' },
    ]);

    const choices = [
      {
        label: '→ Investigate the sound',
        action: () => {
          if (!hasWolfFought) {
            const enemy = spawnEnemy('forest_wolf');
            startCombat(enemy,
              () => { setFlag('wolfDefeated', true); navigate('deep_forest'); },
              () => onPlayerDeath()
            );
          } else {
            showTextImmediate([{ text: 'You find a few wolf tracks and old blood. The wolf is gone.', cls: 'text-narration' }]);
            showChoices([
              { label: '→ Keep moving east (toward the settlement)', action: () => navigate('settlement_road') },
              ...(!getFlag('ruinsExplored') ? [{ label: '→ Detour south (you see a broken wall through the trees)', action: () => navigate('forest_ruins') }] : []),
              { label: '← Head back', action: () => navigate('forest_entrance') },
            ]);
          }
        },
      },
      {
        label: '→ Keep moving east (toward the settlement)',
        action: () => navigate('settlement_road'),
      },
      {
        label: '← Head back',
        action: () => navigate('forest_entrance'),
      },
    ];

    if (!getFlag('ruinsExplored')) {
      choices.splice(1, 0, {
        label: '→ Detour south (you see a broken wall through the trees)',
        action: () => navigate('forest_ruins'),
      });
    }

    showChoices(choices);
  },

  forest_ruins: () => {
    setScene('forest_ruins', 'Overgrown Ruins');
    updateActLabel('ACT I · THE WOODS');

    if (!getFlag('ruinsExplored')) {
      setFlag('ruinsExplored', true);
      showNarration([
        { text: 'The ruins are old enough that the trees have grown through the walls.', cls: 'text-narration' },
        { text: 'Stone arches. Broken columns. A courtyard of cracked tiles, now carpeted in moss.', cls: 'text-narration' },
        { text: 'A lantern is still burning near a collapsed doorway. It shouldn\'t still be burning.', cls: 'text-narration' },
      ], () => showRuinsChoices());
    } else {
      showTextImmediate([{ text: 'The ruins. You\'ve been here before. The lantern still burns.', cls: 'text-narration' }]);
      showRuinsChoices();
    }
  },

  forest_stream: () => {
    setScene('forest_stream', 'The Forest Stream');

    const pickedUpCoin = getFlag('streamCoinFound');

    showTextImmediate([
      { text: 'A shallow stream cuts across the path. The water is dark but clear.', cls: 'text-narration' },
      { text: 'Stepping stones form a rough crossing. On the far side, the road continues east.', cls: 'text-narration' },
      pickedUpCoin
        ? { text: 'Nothing left here now.', cls: 'text-narration' }
        : { text: 'Something glints at the bottom of the stream.', cls: 'text-narration' },
    ]);

    const choices = [
      {
        label: '→ Cross the stream (continue east)',
        action: () => navigate('deep_forest'),
      },
      {
        label: '← Head back west',
        action: () => navigate('forest_entrance'),
      },
    ];

    if (!pickedUpCoin) {
      choices.unshift({
        label: '→ Reach into the water (the glinting thing)',
        action: () => {
          setFlag('streamCoinFound', true);
          addItem('ancient_coin', 2);
          showToast('Found: 2× Ancient Coin.', 'gold');
          showTextImmediate([
            { text: 'Old coins. Stamped with a dragon crest you don\'t recognize.', cls: 'text-narration' },
            { text: 'Someone passed through here before you.', cls: 'text-narration' },
          ]);
          showChoices([
            { label: '→ Cross the stream (continue east)', action: () => navigate('deep_forest') },
            { label: '← Head back west', action: () => navigate('forest_entrance') },
          ]);
        },
      });
    }

    showChoices(choices);
  },

  /* ── ACT I: MEETING ALDRIC ─────────────────────────────────────────── */

  meet_aldric: () => {
    setScene('forest_entrance', 'The Ashen Forest');

    if (getFlag('metAldric')) {
      // Brief revisit
      showTextImmediate([
        { text: 'Aldric\'s lantern still burns at the side of the path.', cls: 'text-narration' },
        { text: 'He nods as you approach.', cls: 'text-narration' },
        { text: 'ALDRIC:', cls: 'text-speaker' },
        { text: '"Still alive. Good."', cls: 'text-dialogue' },
      ]);
      showChoices([
        { label: '"Tell me more about the castle."', action: () => startDialogue(ALL_NPCS.aldric.dialogue, () => navigate('forest_entrance')) },
        { label: '[ Move on ]', action: () => navigate('forest_entrance') },
      ]);
    } else {
      showNarration([
        { text: 'A man sits at the path\'s edge beside a small lantern.', cls: 'text-narration' },
        { text: 'He\'s lean, weathered, dressed in dark cloth. He doesn\'t jump when he sees you — which tells you something about how long he\'s been here, and what he\'s been waiting for.', cls: 'text-narration' },
        { text: 'He raises one hand in a gesture that is neither welcome nor warning.', cls: 'text-narration' },
      ], () => {
        startDialogue(ALL_NPCS.aldric.dialogue, () => {
          setFlag('metAldric', true);
          navigate('forest_entrance');
        });
      });
    }
  },

  /* ── ACT II: SETTLEMENTS ───────────────────────────────────────────── */

  settlement_road: () => {
    setScene('settlement_road', 'The Settlement Road');
    updateActLabel('ACT II · THE SETTLEMENTS');

    const banditFought = getFlag('banditRoadDefeated');

    if (!banditFought && !getFlag('banditRoadSkipped')) {
      showNarration([
        { text: 'The trees thin. The road widens. Civilization, after a fashion.', cls: 'text-narration' },
        { text: 'Three figures step onto the road ahead. They\'re not soldiers — their equipment is too mismatched, their posture too relaxed.', cls: 'text-narration' },
        { text: 'BANDIT SCOUT:', cls: 'text-speaker' },
        { text: '"Toll. Everyone pays the toll."', cls: 'text-dialogue' },
      ], () => {
        showChoices([
          {
            label: '"I don\'t pay tolls."',
            action: () => {
              appendText('PERIVAL: "Step aside."', 'text-player');
              appendText('He doesn\'t.', 'text-narration');
              setTimeout(() => {
                const enemy = spawnEnemy('bandit_scout');
                startCombat(enemy,
                  () => { setFlag('banditRoadDefeated', true); navigate('settlement_road'); },
                  () => onPlayerDeath()
                );
              }, 800);
            },
          },
          {
            label: '"How much?"',
            action: () => {
              if (STATE.player.gold >= 10) {
                appendText('BANDIT: "Ten gold."', 'text-dialogue');
                showChoices([
                  {
                    label: 'Pay 10 gold',
                    action: () => {
                      import('./state.js').then(({ spendGold }) => spendGold(10));
                      setFlag('banditRoadSkipped', true);
                      updateHUD();
                      showToast('Paid 10 gold toll.', '');
                      navigate('millhaven');
                    },
                  },
                  {
                    label: 'Refuse',
                    action: () => {
                      const enemy = spawnEnemy('bandit_scout');
                      startCombat(enemy,
                        () => { setFlag('banditRoadDefeated', true); navigate('settlement_road'); },
                        () => onPlayerDeath()
                      );
                    },
                  },
                ]);
              } else {
                appendText('BANDIT: "Ten gold. Don\'t have it? We\'ll take it out of you another way."', 'text-dialogue');
                setTimeout(() => {
                  const enemy = spawnEnemy('bandit_scout');
                  startCombat(enemy,
                    () => { setFlag('banditRoadDefeated', true); navigate('settlement_road'); },
                    () => onPlayerDeath()
                  );
                }, 1000);
              }
            },
          },
          {
            label: 'Attempt to slip past silently',
            action: () => {
              const success = Math.random() < 0.4;
              if (success) {
                setFlag('banditRoadSkipped', true);
                showToast('You slipped past undetected.', 'success');
                navigate('millhaven');
              } else {
                appendText('One of them spots you.', 'text-narration');
                setTimeout(() => {
                  const enemy = spawnEnemy('bandit_scout');
                  startCombat(enemy,
                    () => { setFlag('banditRoadDefeated', true); navigate('settlement_road'); },
                    () => onPlayerDeath()
                  );
                }, 800);
              }
            },
          },
        ]);
      });
    } else {
      showTextImmediate([{ text: 'The road is clear now. Millhaven is visible ahead.', cls: 'text-narration' }]);
      showChoices([
        { label: '→ Enter Millhaven', action: () => navigate('millhaven') },
        { label: '← Back to the forest', action: () => navigate('deep_forest') },
      ]);
    }
  },

  millhaven: () => {
    setScene('settlement_road', 'Millhaven');
    updateActLabel('ACT II · THE SETTLEMENTS');
    setFlag('millhavenVisited', true);

    showNarration([
      { text: 'Millhaven.', cls: 'text-system' },
      { text: 'Three stone houses. A well. A wagon. And the kind of silence that used to be a village.', cls: 'text-narration' },
      { text: 'Lanterns burn in two of the windows. In the third, nothing. In the fourth — there is no fourth.', cls: 'text-narration' },
      { text: 'Someone is watching you from a doorway. More than one someone, probably.', cls: 'text-narration' },
    ], () => showMillhavenChoices());
  },

  meet_hooded_stranger: () => {
    setScene('castle_road', 'The Castle Road');

    if (getFlag('strangerMet')) {
      showTextImmediate([
        { text: 'The hooded figure is still at the roadside, motionless as stone.', cls: 'text-narration' },
      ]);
    } else {
      setFlag('strangerMet', true);
      showNarration([
        { text: 'Past Millhaven, the road turns toward the castle.', cls: 'text-narration' },
        { text: 'A figure in black sits at the roadside, watching the tree line with the stillness of someone who has been waiting and is comfortable waiting.', cls: 'text-narration' },
        { text: 'They don\'t look at you when they speak.', cls: 'text-narration' },
      ], () => {
        startDialogue(ALL_NPCS.ravens_agent.dialogue, () => navigate('castle_road'));
      });
      return;
    }
    showChoices([
      { label: 'Speak to the hooded stranger', action: () => startDialogue(ALL_NPCS.ravens_agent.dialogue, () => navigate('castle_road')) },
      { label: '→ Continue to the castle', action: () => navigate('castle_road') },
      { label: '← Back to Millhaven', action: () => navigate('millhaven') },
    ]);
  },

  /* ── ACT III: CASTLE ROAD ──────────────────────────────────────────── */

  castle_road: () => {
    setScene('castle_road', 'The Castle Road');
    updateActLabel('ACT III · THE CASTLE ROAD');
    completeObjective('enter_the_keep', 'reach_castle');

    if (!getFlag('castlePathReached')) {
      setFlag('castlePathReached', true);
      showNarration([
        { text: 'The road straightens. The trees fall back. And the castle fills the sky.', cls: 'text-narration' },
        { text: 'The Ashen Keep.', cls: 'text-important' },
        { text: 'Not ruined. Not abandoned. Lit. Garrisoned. Alive with purpose.', cls: 'text-narration' },
        { text: 'You can see three things from here:', cls: 'text-narration' },
        { text: 'A main gate, heavily guarded.', cls: 'text-narration' },
        { text: 'A servants\' gate on the west wall. Two guards. A steady rhythm.', cls: 'text-narration' },
        { text: 'A trade yard on the south side, where a wagon is unloading.', cls: 'text-narration' },
      ], () => showCastleRoadChoices());
    } else {
      showCastleRoadChoices();
    }
  },

  /* ── ACT IV: CASTLE ────────────────────────────────────────────────── */

  castle_exterior: () => {
    setScene('castle_exterior', 'Castle Gates');
    updateActLabel('ACT IV · THE CASTLE');

    showTextImmediate([
      { text: 'Up close, the castle is even larger.', cls: 'text-narration' },
      { text: 'The stonework is old — older than the kingdom itself, if the styles match. But the guards are new. Alert. Armed.', cls: 'text-narration' },
    ]);

    showChoices([
      {
        label: '→ Approach the main gate (direct)',
        action: () => navigate('castle_main_gate'),
      },
      {
        label: '→ Try the servants\' gate (west wall)',
        action: () => navigate('castle_servants_gate'),
        condition: hasItem('servant_clothes'),
      },
      {
        label: '→ Find the trade entrance (south)',
        action: () => navigate('castle_trade_gate'),
        condition: getFlag('harlinAgreed'),
      },
      {
        label: '← Castle road',
        action: () => navigate('castle_road'),
      },
    ].filter(c => c.condition === undefined || c.condition));
  },

  castle_main_gate: () => {
    setScene('castle_exterior', 'Main Gate');

    showNarration([
      { text: 'The main gate is iron-bound oak. Two guards on either side. A third watching from the parapet above.', cls: 'text-narration' },
      { text: 'GATE GUARD:', cls: 'text-speaker' },
      { text: '"State your business."', cls: 'text-dialogue' },
    ], () => {
      showChoices([
        {
          label: '"I have business with Lord Varek."',
          action: () => {
            appendText('PERIVAL: "I have business with Lord Varek."', 'text-player');
            appendText('GUARD: "Lord Varek doesn\'t see travelers. Move along."', 'text-dialogue');
            showChoices([
              { label: 'Force your way through', action: () => {
                const enemy = spawnEnemy('castle_guard');
                startCombat(enemy, () => navigate('castle_courtyard'), () => onPlayerDeath());
              }},
              { label: 'Back away', action: () => navigate('castle_exterior') },
            ]);
          },
        },
        {
          label: 'Attack the gate guards',
          action: () => {
            const enemy = spawnEnemy('castle_guard');
            startCombat(enemy,
              () => {
                setFlag('castleEntered', true);
                completeObjective('enter_the_keep', 'enter_castle');
                navigate('castle_courtyard');
              },
              () => onPlayerDeath()
            );
          },
        },
        { label: '← Castle exterior', action: () => navigate('castle_exterior') },
      ]);
    });
  },

  castle_servants_gate: () => {
    setScene('castle_exterior', "Servants' Gate");

    if (!hasItem('servant_clothes')) {
      showTextImmediate([{ text: 'The servants\' gate is watched. You need to look the part.', cls: 'text-narration' }]);
      showChoices([{ label: '← Back', action: () => navigate('castle_exterior') }]);
      return;
    }

    showNarration([
      { text: 'You\'ve pulled on the servant clothes. Gray linen. Castle crest.', cls: 'text-narration' },
      { text: 'You walk to the servants\' gate. The guard barely looks at you.', cls: 'text-narration' },
      { text: 'WEST GATE GUARD:', cls: 'text-speaker' },
      { text: '"Laundry?"', cls: 'text-dialogue' },
    ], () => {
      showChoices([
        {
          label: '"Yes. Late delivery." [Bluff]',
          action: () => {
            const success = Math.random() < 0.75;
            if (success) {
              appendText('PERIVAL: "Yes. Late delivery."', 'text-player');
              appendText('He waves you through without a second look.', 'text-narration');
              STATE.disguise = 'servant_clothes';
              setFlag('castleEntered', true);
              setFlag('hasDisguise', true);
              completeObjective('enter_the_keep', 'find_entry');
              completeObjective('enter_the_keep', 'enter_castle');
              showToast('You\'re inside. Disguise active.', 'success');
              showChoices([{ label: '→ Enter the courtyard', action: () => navigate('castle_courtyard') }]);
            } else {
              appendText('GUARD: "Hold on. You\'re not from the regular detail."', 'text-dialogue');
              appendText('He reaches for his horn.', 'text-narration');
              setTimeout(() => {
                const enemy = spawnEnemy('castle_guard');
                startCombat(enemy, () => {
                  STATE.disguise = null;
                  navigate('castle_exterior');
                }, () => onPlayerDeath());
              }, 300);
            }
          },
        },
        {
          label: '"Yes." [walk confidently]',
          action: () => {
            appendText('You walk through. He doesn\'t stop you.', 'text-narration');
            STATE.disguise = 'servant_clothes';
            setFlag('castleEntered', true);
            setFlag('hasDisguise', true);
            completeObjective('enter_the_keep', 'find_entry');
            completeObjective('enter_the_keep', 'enter_castle');
            showToast('You\'re inside. Disguise active.', 'success');
            showChoices([{ label: '→ Enter the courtyard', action: () => navigate('castle_courtyard') }]);
          },
        },
        { label: '← Back', action: () => navigate('castle_exterior') },
      ]);
    });
  },

  castle_trade_gate: () => {
    setScene('castle_exterior', 'Trade Yard');

    if (!getFlag('harlinAgreed')) {
      showTextImmediate([{ text: 'The trade gate is open but guarded. You don\'t have a reason to be here.', cls: 'text-narration' }]);
      showChoices([{ label: '← Back', action: () => navigate('castle_exterior') }]);
      return;
    }

    showNarration([
      { text: 'You follow Harlin\'s wagon into the trade yard.', cls: 'text-narration' },
      { text: 'HARLIN:', cls: 'text-speaker' },
      { text: '"My assistant. He\'s carrying the heavy rolls."', cls: 'text-dialogue' },
      { text: 'The trade captain nods. Nobody looks twice at a merchant\'s help.', cls: 'text-narration' },
    ], () => {
      setFlag('castleEntered', true);
      completeObjective('enter_the_keep', 'find_entry');
      completeObjective('enter_the_keep', 'enter_castle');
      completeObjective('harlin_job', 'travel_with_harlin');
      completeObjective('harlin_job', 'enter_trade_gate');
      completeQuest('harlin_job');
      showToast('Entered the castle through the trade yard.', 'success');
      showChoices([{ label: '→ Enter the courtyard', action: () => navigate('castle_courtyard') }]);
    });
  },

  castle_courtyard: () => {
    setScene('castle_interior', 'The Courtyard');
    updateActLabel('ACT IV · THE CASTLE');

    showNarration([
      { text: 'The courtyard is larger than it looked from outside.', cls: 'text-narration' },
      { text: 'Guards at the inner gate. Servants crossing with bundles of linen. A merchant arguing with a steward in the far corner.', cls: 'text-narration' },
      ...(STATE.disguise ? [
        { text: 'In the servant clothes, you move freely. Nobody questions what they expect to see.', cls: 'text-narration' },
      ] : [
        { text: 'You don\'t look like you belong here. Several guards glance your way.', cls: 'text-narration' },
      ]),
    ], () => showCastleCourtyard());
  },

  castle_interior: () => {
    setScene('castle_interior', 'Castle Interior');
    updateActLabel('ACT IV · THE CASTLE');

    showNarration([
      { text: 'The inner keep. Stone corridors lined with portraits of lords who look like they died badly.', cls: 'text-narration' },
      { text: 'The air is colder here. And there\'s a smell — faint, chemical, wrong — that doesn\'t belong in a castle.', cls: 'text-narration' },
    ], () => {
      showChoices([
        { label: '→ Find the dungeon stairs (descend)', action: () => navigate('dungeon_entrance') },
        { label: '→ Search for Mordis', action: () => navigate('castle_mordis'), condition: getFlag('strangerQuestOffered') },
        { label: '← Back to courtyard', action: () => navigate('castle_courtyard') },
      ].filter(c => c.condition === undefined || c.condition));
    });
  },

  castle_mordis: () => {
    setScene('castle_interior', "Mordis's Chamber");

    showNarration([
      { text: 'You find the chamber at the end of the north corridor. The smell is strongest here.', cls: 'text-narration' },
      { text: 'The door is open. The room beyond is not a bedroom. It\'s a laboratory.', cls: 'text-narration' },
      { text: 'Glass tubes. Cages with things in them that you cannot name. A man in black robes bent over a table.', cls: 'text-narration' },
      { text: 'MORDIS:', cls: 'text-speaker' },
      { text: '"I knew someone would come eventually. I just didn\'t expect a sword."', cls: 'text-dialogue' },
    ], () => {
      setFlag('mordisFound', true);
      completeObjective('the_mordis_job', 'find_mordis');
      completeObjective('the_mordis_job', 'investigate');
      showChoices([
        {
          label: '"What are you doing to those animals?"',
          action: () => {
            appendText('PERIVAL: "What is this? What are you doing?"', 'text-player');
            appendText('MORDIS: "Research. Understanding what\'s beneath this castle. Something nobody else has tried."', 'text-dialogue');
            appendText('MORDIS: "The dragon isn\'t a monster. It\'s a source. If I can harvest its essence—"', 'text-dialogue');
            appendText('He stops. Realizes he\'s said too much.', 'text-narration');
            showMordisDecision();
          },
        },
        {
          label: 'Attack immediately',
          action: () => {
            completeObjective('the_mordis_job', 'decide');
            const enemy = spawnEnemy('castle_guard');
            enemy.name = 'Mordis (Corrupted)';
            enemy.hp = 80; enemy.maxHp = 80;
            startCombat(enemy, () => {
              completeQuest('the_mordis_job');
              navigate('castle_interior');
            }, () => onPlayerDeath());
          },
        },
        { label: '← Leave (for now)', action: () => navigate('castle_interior') },
      ]);
    });
  },

  /* ── ACT V: DUNGEON ────────────────────────────────────────────────── */

  dungeon_entrance: () => {
    setScene('dungeon_entrance', 'Dungeon Stairs');
    updateActLabel('ACT V · THE DUNGEON');
    completeObjective('reach_the_dungeon', 'find_dungeon_entrance');

    showNarration([
      { text: 'Stone stairs descend into darkness. A lantern at the top. None at the bottom.', cls: 'text-narration' },
      { text: 'The smell is stronger here. Chemical, ancient, wrong.', cls: 'text-narration' },
      { text: 'From below: the faint sound of chains.', cls: 'text-important' },
    ], () => {
      showChoices([
        {
          label: '→ Descend into the dungeon',
          action: () => navigate('dungeon_deep'),
        },
        {
          label: '← Back to the castle',
          action: () => navigate('castle_interior'),
        },
      ]);
    });
  },

  dungeon_deep: () => {
    setScene('dungeon_entrance', 'Lower Dungeon');
    updateActLabel('ACT V · THE DUNGEON');
    completeObjective('reach_the_dungeon', 'descend');
    setFlag('dungeon_discovered', true);

    const wraith_fought = STATE.defeatedEnemies.includes('dungeon_wraith_1');

    showNarration([
      { text: 'The lower dungeon.', cls: 'text-system' },
      { text: 'Stone cells. Iron bars. Chains on the walls, some old, some recent.', cls: 'text-narration' },
      { text: 'The air is cold in a way that isn\'t about temperature.', cls: 'text-narration' },
      !wraith_fought
        ? { text: 'Something moves in the far corridor. Something that casts no shadow.', cls: 'text-important' }
        : { text: 'The dungeon is quiet now. The cells are empty. Almost.', cls: 'text-narration' },
    ], () => {
      const choices = [];

      if (!wraith_fought) {
        choices.push({
          label: '→ Investigate the moving shape',
          action: () => {
            const w = spawnEnemy('dungeon_wraith');
            w.id = 'dungeon_wraith_1';
            startCombat(w,
              () => navigate('dungeon_deep'),
              () => onPlayerDeath()
            );
          },
        });
      }

      if (!getFlag('edranFound') && getFlag('aldricQuestGiven')) {
        choices.push({
          label: '→ Search for Edran (deep cells)',
          action: () => navigate('dungeon_edran'),
        });
      }

      choices.push({
        label: '→ Continue deeper (toward the sounds)',
        action: () => navigate('leviora_approach'),
      });
      choices.push({
        label: '← Go back up',
        action: () => navigate('dungeon_entrance'),
      });

      showChoices(choices);
    });
  },

  dungeon_edran: () => {
    setScene('dungeon_entrance', 'The Deep Cells');

    showNarration([
      { text: 'At the very bottom, past where the torch brackets end, there is a single occupied cell.', cls: 'text-narration' },
      { text: 'An old man. White-haired. Sitting with the calm of someone who stopped expecting rescue years ago.', cls: 'text-narration' },
      { text: 'EDRAN:', cls: 'text-speaker' },
      { text: '"Aldric sent you."', cls: 'text-dialogue' },
    ], () => {
      showChoices([
        {
          label: '"He did. I have something for you."',
          action: () => {
            if (hasItem('aldric_note')) {
              appendText('PERIVAL: "He asked me to give you this."', 'text-player');
              appendText('Edran reads it. Then reads it again. Then looks up.', 'text-narration');
              appendText('EDRAN: "Varek doesn\'t control the dragon. The dragon controls him. It has been controlling the family for three generations."', 'text-dialogue');
              appendText('EDRAN: "It shows them power. Gives them resources. In exchange for what it needs."', 'text-dialogue');
              appendText('EDRAN: "Freedom."', 'text-important');
              appendText('EDRAN: "The chains won\'t hold much longer. Nothing will, if Mordis continues his work. The dragon grows stronger each day."', 'text-dialogue');
              removeItem('aldric_note');
              setFlag('edranFound', true);
              completeObjective('the_wanderer', 'find_edran');
              completeObjective('the_wanderer', 'deliver_note');
              completeQuest('the_wanderer');
              showChoices([
                { label: '→ Continue deeper', action: () => navigate('leviora_approach') },
                { label: '← Back', action: () => navigate('dungeon_deep') },
              ]);
            } else {
              appendText('PERIVAL: "I... had something. I don\'t have it now."', 'text-player');
              appendText('EDRAN: "Then come back when you do."', 'text-dialogue');
              showChoices([{ label: '[ Leave ]', action: () => navigate('dungeon_deep') }]);
            }
          },
        },
        {
          label: '"How do I stop what\'s happening?"',
          action: () => {
            appendText('EDRAN: "The dragon? You can\'t stop it by fighting it from outside."', 'text-dialogue');
            appendText('EDRAN: "You have to face it. In its place. On its terms."', 'text-dialogue');
            appendText('EDRAN: "And you have to do it before the chains give."', 'text-dialogue');
            showChoices([
              { label: '→ Continue deeper', action: () => navigate('leviora_approach') },
              { label: '← Back', action: () => navigate('dungeon_deep') },
            ]);
          },
        },
      ]);
    });
  },

  /* ── ACT VI: LEVIORA ───────────────────────────────────────────────── */

  leviora_approach: () => {
    setScene('dungeon_deep', 'The Deepest Level');
    updateActLabel('ACT VI · LEVIORA');

    setFlag('leviora_approached', true);
    completeObjective('face_leviora', 'discover_leviora');

    showNarration([
      { text: 'Further down. The walls change from cut stone to raw rock.', cls: 'text-narration' },
      { text: 'And then the chains.', cls: 'text-important' },
      { text: 'Massive iron chains, each link the size of a man, stretching from iron rings in the walls into the darkness ahead.', cls: 'text-narration' },
      { text: 'Two of them are broken.', cls: 'text-narration' },
      { text: 'The remaining chains are taut. Straining.', cls: 'text-narration' },
      { text: 'You see a shadow.', cls: 'text-narration' },
      { text: 'Not cast by light — created by its own presence.', cls: 'text-narration' },
      { text: 'Something breathes. Very slowly. Very deeply.', cls: 'text-narration' },
      { text: 'The breath is warm. Like standing in front of a forge.', cls: 'text-narration' },
    ], () => {
      showChoices([
        {
          label: '→ Move forward',
          action: () => navigate('leviora_arena'),
        },
        {
          label: '← Run back up (the chains will break eventually)',
          action: () => navigate('dungeon_deep'),
        },
      ]);
    });
  },

  leviora_arena: () => {
    setScene('leviora_arena', 'The Dragon\'s Chamber');
    updateActLabel('ACT VI · LEVIORA');

    showNarration([
      { text: 'The chamber is vast. Cathedral-vast. Large enough that the ceiling is lost in shadow.', cls: 'text-narration' },
      { text: 'And then the last chain breaks.', cls: 'text-important' },
      { text: 'The sound is the sound of a kingdom ending.', cls: 'text-narration' },
      { text: 'Something rises in the dark.', cls: 'text-narration' },
      { text: 'Red scales. Eyes like burning coal. Wings that would block out the sun.', cls: 'text-narration' },
      { text: 'LEVIORA.', cls: 'text-important' },
      { text: 'A century of captivity, compressed into the space between one heartbeat and the next.', cls: 'text-narration' },
      { text: 'It looks at you.', cls: 'text-narration' },
      { text: 'It looks at you the way you might look at a single candle in a storm.', cls: 'text-narration' },
      { text: '— FINAL BATTLE —', cls: 'text-system' },
    ], () => {
      showChoices([
        {
          label: '⚔ FIGHT LEVIORA',
          action: () => {
            const boss = spawnEnemy('leviora');
            completeObjective('face_leviora', 'fight_leviora');
            startCombat(boss,
              () => navigate('ending'),
              () => onPlayerDeath()
            );
          },
        },
      ]);
    });
  },

  ending: () => {
    setScene('castle_exterior', 'Dawn');
    updateActLabel('EPILOGUE');
    completeObjective('face_leviora', 'end');
    completeObjective('face_leviora', 'fight_leviora');
    completeQuest('face_leviora');
    setFlag('leviora_fought', true);

    showNarration([
      { text: 'The chamber is still.', cls: 'text-narration' },
      { text: 'Whatever it means for a dragon to fall, Leviora falls.', cls: 'text-narration' },
      { text: 'The corruption in the forest — you feel it change. Not gone. But quieter.', cls: 'text-narration' },
      { text: 'You climb. Through the dungeon, through the castle. Guards who see you either look away or run.', cls: 'text-narration' },
      { text: 'Lord Varek is found in his chambers three days later, entirely catatonic.', cls: 'text-narration' },
      { text: 'Mordis disappears. The hooded stranger disappears too. They always do.', cls: 'text-narration' },
      { text: 'Edran walks out of the dungeon into morning light and doesn\'t say anything for a long time.', cls: 'text-narration' },
      { text: 'The Ashen Forest is still dark. The castle still stands.', cls: 'text-narration' },
      { text: 'Some things don\'t change just because the worst of them is gone.', cls: 'text-narration' },
      { text: 'But the chains are empty now.', cls: 'text-important' },
      { text: '— THE END —', cls: 'text-system' },
      { text: 'PERIVAL: THE ASHEN KEEP', cls: 'text-system' },
    ], () => {
      showChoices([
        {
          label: '[ New Game ]',
          action: () => {
            import('./save.js').then(({ deleteSave }) => {
              deleteSave();
              location.reload();
            });
          },
        },
      ]);
    });
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   HELPER SCENES
   ══════════════════════════════════════════════════════════════════════════ */

function showForestEntranceChoices() {
  showChoices([
    {
      label: '→ Follow the path east',
      action: () => navigate('forest_stream'),
    },
    {
      label: '→ Investigate the figure by the lantern',
      action: () => navigate('meet_aldric'),
      condition: !getFlag('metAldric'),
    },
    {
      label: '→ Speak to Aldric again',
      action: () => navigate('meet_aldric'),
      condition: getFlag('metAldric'),
    },
  ].filter(c => c.condition === undefined || c.condition));
}

function showForestNavChoices() {
  showChoices([
    { label: '→ Continue east', action: () => navigate('settlement_road') },
    { label: '← Back west', action: () => navigate('forest_entrance') },
  ]);
}

function showRuinsChoices() {
  const foundLocket = getFlag('ruinsLocketFound');
  const choices = [
    {
      label: '→ Search the rubble',
      action: () => {
        if (!foundLocket) {
          setFlag('ruinsLocketFound', true);
          addItem('silver_locket', 1);
          completeObjective('the_missing_child', 'check_mill');
          showToast('Found: Silver Locket.', 'gold');
          showTextImmediate([
            { text: 'Under a collapsed arch, wrapped in cloth: a silver locket. A child\'s face painted inside.', cls: 'text-narration' },
            { text: 'It shouldn\'t be here.', cls: 'text-narration' },
          ]);
          showRuinsChoices();
        } else {
          showTextImmediate([{ text: 'You\'ve already searched the rubble. Nothing remains.', cls: 'text-narration' }]);
          showRuinsChoices();
        }
      },
    },
    {
      label: '→ Examine the still-burning lantern',
      action: () => {
        showTextImmediate([
          { text: 'The lantern is clean. The oil should have run out days ago.', cls: 'text-narration' },
          { text: 'There are runes scratched into the base. Old. Very old.', cls: 'text-narration' },
          { text: 'You don\'t recognize the language.', cls: 'text-narration' },
        ]);
        showRuinsChoices();
      },
    },
  ];

  if (!getFlag('ruinsBanditCleared')) {
    choices.push({
      label: '→ Investigate the crashing sound from the east wing',
      action: () => {
        const enemy = spawnEnemy('bandit_enforcer');
        appendText('A bandit enforcer. He\'s been sheltering in the ruins.', 'text-narration');
        setTimeout(() => {
          startCombat(enemy,
            () => {
              setFlag('ruinsBanditCleared', true);
              addItem('healing_herb', 1);
              // Harlin's crate is here
              if (!getFlag('harlinCrateFound')) {
                setFlag('harlinCrateFound', true);
                completeObjective('harlin_crate', 'find_ruins');
                completeObjective('harlin_crate', 'find_crate');
                showToast("Found: Harlin's Cargo Crate. Return to Harlin.", 'gold');
              }
              navigate('forest_ruins');
            },
            () => onPlayerDeath()
          );
        }, 300);
      },
    });
  } else if (!getFlag('harlinCrateFound')) {
    choices.push({
      label: '→ Look through the cleared eastern wing',
      action: () => {
        setFlag('harlinCrateFound', true);
        completeObjective('harlin_crate', 'find_ruins');
        completeObjective('harlin_crate', 'find_crate');
        showToast("Found: Harlin's cargo crate.", 'gold');
        showTextImmediate([{ text: 'A crate with a merchant\'s seal. This must be Harlin\'s.', cls: 'text-narration' }]);
        showRuinsChoices();
      },
    });
  }

  choices.push({ label: '← Back to the forest', action: () => navigate('deep_forest') });
  showChoices(choices);
}

function showMillhavenChoices() {
  const choices = [
    {
      label: '→ Speak to the old man on the step',
      action: () => startDialogue(ALL_NPCS.old_miller.dialogue, () => navigate('millhaven')),
    },
    {
      label: '→ Speak with Harlin the merchant',
      action: () => {
        if (getFlag('harlinCrateFound')) {
          completeObjective('harlin_crate', 'report_back');
          completeQuest('harlin_crate');
        }
        showNarration([
          { text: 'Harlin\'s wagon is parked at the edge of the village square.', cls: 'text-narration' },
        ], () => startDialogue(ALL_NPCS.harlin.dialogue, () => {
          if (getFlag('openShopAfterDialogue')) {
            setFlag('openShopAfterDialogue', false);
            openMerchant('harlin', () => navigate('millhaven'));
          } else {
            navigate('millhaven');
          }
        }));
      },
    },
    {
      label: '→ Trade with Harlin (Open Shop)',
      action: () => {
        openMerchant('harlin', () => navigate('millhaven'));
      },
    },
    {
      label: '→ Find Sera (ex-castle servant)',
      action: () => {
        showNarration([
          { text: 'A woman sits in a doorway at the east end of the village. She sees you coming and doesn\'t run, which is something.', cls: 'text-narration' },
        ], () => startDialogue(ALL_NPCS.sera.dialogue, () => navigate('millhaven')));
      },
    },
    {
      label: '→ Look for Miren (missing child quest)',
      condition: getFlag('childQuestActive'),
      action: () => {
        showNarration([
          { text: 'A woman in the center of the village, calling a name you can\'t quite hear from here.', cls: 'text-narration' },
          { text: 'MIREN:', cls: 'text-speaker' },
          { text: '"Have you seen a boy? About eight years old. Dark hair."', cls: 'text-dialogue' },
          { text: 'PERIVAL: "Tell me where you last saw him."', cls: 'text-player' },
          { text: 'MIREN: "Near the old mill. South of the village. I told him not to go there."', cls: 'text-dialogue' },
        ], () => {
          completeObjective('the_missing_child', 'talk_miren');
          if (getFlag('ruinsLocketFound')) {
            showChoices([{
              label: '"I found this in the ruins—"',
              action: () => {
                removeItem('silver_locket');
                appendText('PERIVAL: "I found this. Near the old ruins."', 'text-player');
                appendText('She breaks when she sees it. Not falls — breaks. Like something inside stops working.', 'text-narration');
                appendText('MIREN: "He always wore this."', 'text-dialogue');
                appendText('She closes her hand around it. Doesn\'t speak for a long time.', 'text-narration');
                completeObjective('the_missing_child', 'find_child');
                completeQuest('the_missing_child');
                addGold(30);
                updateHUD();
                showChoices([{ label: '[ Leave her ]', action: () => navigate('millhaven') }]);
              },
            }]);
          } else {
            showChoices([
              { label: '"I\'ll check the mill."', action: () => navigate('millhaven') },
            ]);
          }
        });
      },
    },
    {
      label: '→ Head toward the castle (continue north)',
      action: () => navigate('meet_hooded_stranger'),
    },
    {
      label: '← Back to the forest',
      action: () => navigate('deep_forest'),
    },
  ].filter(c => c.condition === undefined || c.condition);

  showChoices(choices);
}

function showCastleRoadChoices() {
  showChoices([
    { label: '→ Approach the castle', action: () => navigate('castle_exterior') },
    { label: '← Back to the hooded stranger / Millhaven', action: () => navigate('meet_hooded_stranger') },
  ]);
}

function showCastleCourtyard() {
  showChoices([
    {
      label: '→ Head to the inner keep',
      action: () => navigate('castle_interior'),
    },
    {
      label: '→ Talk to the merchant in the corner',
      action: () => {
        showTextImmediate([
          { text: 'CASTLE MERCHANT:', cls: 'text-speaker' },
          { text: '"Quiet. Not here, not loudly. But I can sell you some things."', cls: 'text-dialogue' },
        ]);
        openMerchant('harlin', () => navigate('castle_courtyard'));
      },
    },
    {
      label: '← Exit the castle',
      action: () => navigate('castle_exterior'),
    },
  ]);
}

function showMordisDecision() {
  showChoices([
    {
      label: 'Kill Mordis',
      action: () => {
        completeObjective('the_mordis_job', 'decide');
        const enemy = spawnEnemy('castle_guard');
        enemy.name = 'Mordis'; enemy.hp = 80; enemy.maxHp = 80;
        startCombat(enemy, () => {
          appendText('MORDIS: "The dragon... will still... wake..."', 'text-dialogue');
          completeQuest('the_mordis_job');
          navigate('castle_interior');
        }, () => onPlayerDeath());
      },
    },
    {
      label: 'Arrest him (hand to castle guards)',
      action: () => {
        appendText('PERIVAL: "You\'re done."', 'text-player');
        appendText('Mordis doesn\'t resist. He knew this moment would come.', 'text-narration');
        completeObjective('the_mordis_job', 'decide');
        completeQuest('the_mordis_job');
        setFlag('mordisArrested', true);
        navigate('castle_interior');
      },
    },
    {
      label: 'Let him go (for information)',
      action: () => {
        appendText('PERIVAL: "Tell me everything. Then go."', 'text-player');
        appendText('MORDIS: "The dragon is already half-free. Nothing I\'ve done will stop it now. Nothing anyone does."', 'text-dialogue');
        appendText('He leaves. You let him.', 'text-narration');
        completeObjective('the_mordis_job', 'decide');
        setFlag('mordisReleased', true);
        navigate('castle_interior');
      },
    },
  ]);
}

/* ══════════════════════════════════════════════════════════════════════════
   MERCHANT SYSTEM
   ══════════════════════════════════════════════════════════════════════════ */

let _onMerchantClose = null;

export function openMerchant(merchantId, onClose) {
  _onMerchantClose = onClose || (() => navigate(STATE.location || 'millhaven'));
  window._onMerchantClose = _onMerchantClose;

  const stock = MERCHANT_STOCK[merchantId] ?? [];
  const nameMap = { harlin: 'HARLIN — Traveling Merchant' };

  const nameEl = document.getElementById('merchant-name');
  if (nameEl) nameEl.textContent = nameMap[merchantId] || 'MERCHANT';

  const introEl = document.getElementById('merchant-intro');
  if (introEl) introEl.textContent = '"See anything you like?" Harlin keeps his voice low.';

  renderMerchantStock(stock, merchantId);
  renderMerchantPlayerInv(merchantId);

  const goldEl = document.getElementById('merchant-gold-display');
  if (goldEl) goldEl.textContent = STATE.player.gold;

  const detailEl = document.getElementById('merchant-detail');
  if (detailEl) detailEl.innerHTML = '<div style="color:var(--col-text-faint);font-style:italic;padding:8px;">Select an item to inspect, buy, or sell. Click LEAVE to return.</div>';

  openModal('modal-merchant');
}

export function closeMerchant() {
  closeModal('modal-merchant');
  if (_onMerchantClose) {
    const cb = _onMerchantClose;
    _onMerchantClose = null;
    window._onMerchantClose = null;
    cb();
  }
}

// Wire leave button
if (typeof document !== 'undefined') {
  document.getElementById('merchant-leave-btn')?.addEventListener('click', () => {
    closeMerchant();
  });
}

function renderMerchantStock(stock, merchantId) {
  const listEl = document.getElementById('merchant-stock');
  if (!listEl) return;
  listEl.innerHTML = '';

  stock.forEach(entry => {
    const it = getItem(entry.itemId);
    if (!it) return;

    const row = document.createElement('div');
    row.className = 'merchant-item';
    row.innerHTML = `
      <span class="merchant-item-icon">${it.icon}</span>
      <span class="merchant-item-name">${it.name}</span>
      <span class="merchant-item-price">${entry.buyPrice}g</span>`;

    row.addEventListener('click', () => {
      document.querySelectorAll('#merchant-stock .merchant-item').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      showMerchantDetail(it, entry.buyPrice, 'buy', merchantId);
    });

    listEl.appendChild(row);
  });
}

function showMerchantDetail(item, price, mode, merchantId) {
  const detailEl = document.getElementById('merchant-detail');
  if (!detailEl) return;

  detailEl.innerHTML = `
    <div class="merchant-detail-name">${item.icon} ${item.name}</div>
    <div class="merchant-detail-desc">"${item.description}"</div>
    <div class="merchant-detail-actions">
      ${mode === 'buy' ? `<button class="merchant-btn buy" id="buy-btn">BUY for ${price}g</button>` : ''}
    </div>`;

  if (mode === 'buy') {
    document.getElementById('buy-btn')?.addEventListener('click', () => {
      const success = spendGold(price);
      if (!success) {
        showToast('Not enough gold.', 'danger');
        return;
      }
      addItem(item.id, 1);
      updateHUD();
      showToast(`Bought ${item.name} for ${price} gold.`, 'gold');
      const goldEl = document.getElementById('merchant-gold-display');
      if (goldEl) goldEl.textContent = STATE.player.gold;
      setFlag('boughtFromMerchant', true);
      renderMerchantPlayerInv(merchantId);
    });
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   PLAYER DEATH
   ══════════════════════════════════════════════════════════════════════════ */

export function onPlayerDeath() {
  STATE.mode = 'explore';
  setScene('dungeon_entrance', 'The Dark');

  showNarration([
    { text: 'You fall.', cls: 'text-narration' },
    { text: 'The darkness is not quiet. It has weight. Temperature. Intention.', cls: 'text-narration' },
    { text: 'You are not dead. Not yet. But you were close enough to see what\'s waiting.', cls: 'text-narration' },
    { text: 'You wake. Different place. Same forest. Same night.', cls: 'text-narration' },
  ], () => {
    // Restore some HP and return to last safe location
    import('./state.js').then(({ modifyHP }) => {
      modifyHP(Math.floor(STATE.player.maxHp * 0.4));
      updateHUD();
    });
    showChoices([{
      label: '[ Continue ]',
      action: () => navigate('forest_entrance'),
    }]);
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   WORLD BOOTSTRAP
   ══════════════════════════════════════════════════════════════════════════ */

/** Call after loading — used by game.js to trigger first scene. */
export function startWorld() {
  // Activate main quest
  activateQuest('enter_the_keep');
  navigate(STATE.location);
}
