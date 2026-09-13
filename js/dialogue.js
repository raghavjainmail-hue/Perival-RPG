/**
 * dialogue.js — NPC dialogue engine.
 *
 * Manages multi-step dialogue trees with branching choices.
 * All NPC conversations are defined in npcs.js.
 */

import { STATE, setFlag, getFlag } from './state.js';
import { showTextImmediate, showChoices, appendText, hideChoices, showToast } from './ui.js';

/* ── Active dialogue state ──────────────────────────────────────────────── */
let _currentNode  = null;
let _onComplete   = null;

/* ══════════════════════════════════════════════════════════════════════════
   DIALOGUE TREE RUNNER
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Start a dialogue with an NPC.
 * @param {object} dialogueTree - Dialogue object from npcs.js
 * @param {function} onComplete - Called when dialogue ends
 */
export function startDialogue(dialogueTree, onComplete) {
  STATE.mode  = 'dialogue';
  _onComplete = onComplete;

  // Clear text panel and show NPC introduction
  showNode(dialogueTree, 'start');
}

/**
 * Navigate to and render a specific dialogue node.
 */
function showNode(tree, nodeId) {
  const node = tree[nodeId];
  if (!node) { endDialogue(); return; }

  _currentNode = { tree, nodeId, node };

  // Build display lines
  const lines = [];

  // Speaker name
  if (node.speaker) {
    lines.push({ text: node.speaker.toUpperCase(), cls: 'text-speaker' });
  }

  // Dialogue text (can be array of lines)
  const texts = Array.isArray(node.text) ? node.text : [node.text];
  texts.forEach(t => {
    lines.push({ text: `"${t}"`, cls: 'text-dialogue' });
  });

  showTextImmediate(lines);

  // Execute any side effects
  if (node.onShow) {
    node.onShow();
  }

  // Determine choices
  const choices = buildChoices(tree, node);

  if (choices.length === 0) {
    // Auto-advance or end
    setTimeout(endDialogue, 1200);
  } else {
    showChoices(choices);
  }
}

function buildChoices(tree, node) {
  if (!node.choices) return [];

  return node.choices
    .filter(choice => {
      // Condition check
      if (choice.condition && !choice.condition()) return false;
      return true;
    })
    .map(choice => ({
      label: choice.label,
      action: () => {
        hideChoices();

        // Perival response line
        if (choice.playerLine) {
          appendText(choice.playerLine, 'text-player');
        }

        // Side effects
        if (choice.onSelect) choice.onSelect();

        // Navigate
        if (choice.next === 'end' || !choice.next) {
          endDialogue();
        } else {
          showNode(tree, choice.next);
        }
      },
    }));
}

function endDialogue() {
  _currentNode = null;
  hideChoices();
  STATE.mode = 'explore';
  if (_onComplete) {
    const cb = _onComplete;
    _onComplete = null;
    cb();
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   BUILT-IN SIMPLE DIALOGUE HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

/** One-shot narration passage (no NPC, just text + continue). */
export function showPassage(paragraphs, choices, onComplete) {
  STATE.mode = 'dialogue';
  _onComplete = onComplete;

  const lines = paragraphs.map(p =>
    typeof p === 'string' ? { text: p, cls: 'text-narration' } : p
  );

  showTextImmediate(lines);

  if (choices && choices.length > 0) {
    showChoices(choices.map(c => ({
      label: c.label,
      action: () => {
        hideChoices();
        if (c.onSelect) c.onSelect();
        if (c.next === 'end' || !c.next) {
          endDialogue();
        }
      },
    })));
  } else {
    // Auto-end after reading
    showChoices([{
      label: '[ Continue ]',
      action: () => {
        hideChoices();
        endDialogue();
      },
    }]);
  }
}

