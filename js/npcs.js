/**
 * npcs.js — All NPC definitions and dialogue trees.
 *
 * Each NPC has an id, name, description, and a dialogue tree.
 * Dialogue trees are plain objects of { nodeId: { speaker, text, choices } }.
 */

import { STATE, setFlag, getFlag, addItem, addGold, hasItem } from './state.js';
import { showToast } from './ui.js';

/* ══════════════════════════════════════════════════════════════════════════
   NPC: ALDRIC THE WANDERER  (intro NPC — forest entrance)
   ══════════════════════════════════════════════════════════════════════════ */

export const ALDRIC = {
  id:   'aldric',
  name: 'Aldric',
  icon: '🧙',
  description: 'A lean, weathered man in a dark cloak. He sits beside a lantern that throws more shadow than light.',

  dialogue: {
    start: {
      speaker: 'ALDRIC',
      text: [
        'You move quietly for a man in armor.',
        'Most people who come through here are either lost, desperate, or both.',
      ],
      choices: [
        {
          label: '"Where am I?"',
          playerLine: 'PERIVAL: "Where exactly am I?"',
          next: 'location',
        },
        {
          label: '"What is that structure beyond the trees?"',
          playerLine: 'PERIVAL: "The thing beyond the trees. What is it?"',
          next: 'castle_intro',
        },
        {
          label: '"Who are you?"',
          playerLine: 'PERIVAL: "Who are you?"',
          next: 'who_are_you',
        },
      ],
    },

    location: {
      speaker: 'ALDRIC',
      text: [
        "You're in the Ashen Wood. Three leagues east of the village of Millhaven.",
        "And about five leagues from the Ashen Keep.",
        "Everything between here and there belongs to something that doesn't want you in it.",
      ],
      choices: [
        { label: '"What kind of things?"', playerLine: 'PERIVAL: "What kind of things are out there?"', next: 'creatures' },
        { label: '"Tell me about the castle."', playerLine: 'PERIVAL: "The castle. Tell me about it."', next: 'castle_intro' },
        { label: '"What happened to this place?"', playerLine: 'PERIVAL: "What happened to this region?"', next: 'lore_history' },
      ],
    },

    creatures: {
      speaker: 'ALDRIC',
      text: [
        "Wolves. Corrupted ones. Touched by something from underground.",
        "Bandits. The lawless kind, not the desperate kind. There's a difference.",
        "Things that used to be soldiers. That's all I'll say about those.",
      ],
      choices: [
        { label: '"Why are they corrupted?"', playerLine: 'PERIVAL: "Corrupted how?"', next: 'corruption' },
        { label: '"Tell me about the castle."', playerLine: 'PERIVAL: "The castle — who controls it?"', next: 'castle_intro' },
        { label: '"I can handle myself."', playerLine: 'PERIVAL: "I can handle myself."', next: 'aldric_doubtful' },
      ],
    },

    corruption: {
      speaker: 'ALDRIC',
      text: [
        "Something beneath the castle has been... leaking.",
        "Not water. Not smoke. Something older.",
        "The animals feel it first. Then the people.",
        "Then the people stop being people.",
      ],
      choices: [
        { label: '"What is beneath the castle?"', playerLine: 'PERIVAL: "What is it? What\'s under there?"', next: 'beneath' },
        { label: '"How do I get into the castle?"', playerLine: 'PERIVAL: "How do I get into the castle?"', next: 'castle_entry' },
      ],
    },

    beneath: {
      speaker: 'ALDRIC',
      text: [
        "I don't know exactly. Nobody living has been down there and come back right.",
        "Whatever it is... it's been there longer than the castle.",
        "The men who built the Keep knew it was there. I think that's why they built here.",
      ],
      choices: [
        { label: '"Why would they build on top of it?"', playerLine: 'PERIVAL: "Why build on top of something like that?"', next: 'why_built' },
        { label: '"How do I get into the castle?"', playerLine: 'PERIVAL: "How do I enter the Keep?"', next: 'castle_entry' },
      ],
    },

    why_built: {
      speaker: 'ALDRIC',
      text: [
        "Power. Control. Or containment.",
        "Maybe all three.",
        "Lord Varek inherited the castle thirty years ago and stopped asking those questions.",
        "Now he just... uses it.",
      ],
      choices: [
        { label: '"Uses it how?"', playerLine: 'PERIVAL: "Uses it how?"', next: 'varek_uses' },
        { label: '"How do I get into the castle?"', playerLine: 'PERIVAL: "How do I enter the Keep?"', next: 'castle_entry' },
      ],
    },

    varek_uses: {
      speaker: 'ALDRIC',
      text: [
        "To rule. To collect taxes from people who have nothing left to give.",
        "To keep certain people imprisoned in the dungeon.",
        "And to conduct... experiments. That's the word the servants who fled used.",
        "I wouldn't repeat it too loudly near the castle walls.",
      ],
      choices: [
        {
          label: '"What kind of experiments?"',
          playerLine: 'PERIVAL: "Experiments with what?"',
          next: 'experiments',
        },
        {
          label: '"I\'ll find out for myself."',
          playerLine: 'PERIVAL: "I\'ll find out myself."',
          next: 'castle_entry',
        },
      ],
    },

    experiments: {
      speaker: 'ALDRIC',
      text: [
        "That I don't know.",
        "But three months ago, the corruption started spreading faster.",
        "And the servants stopped leaving.",
      ],
      choices: [
        { label: '"How do I get inside?"', playerLine: 'PERIVAL: "The castle. How do I get in?"', next: 'castle_entry' },
        { label: '"One last question."', next: 'quest_offer' },
      ],
    },

    castle_intro: {
      speaker: 'ALDRIC',
      text: [
        "The Ashen Keep. Oldest structure in the region.",
        "Lord Varek controls it. He's not a good man, but he's a careful one.",
        "He keeps his walls guarded, his gates watched, and his prisoners well-fed enough to talk.",
      ],
      choices: [
        { label: '"How do I get inside?"', playerLine: 'PERIVAL: "How do I get in?"', next: 'castle_entry' },
        { label: '"What\'s beneath the castle?"', playerLine: 'PERIVAL: "What\'s beneath it?"', next: 'corruption' },
        { label: '"Are there other ways in?"', playerLine: 'PERIVAL: "Multiple entrances?"', next: 'castle_entry' },
      ],
    },

    castle_entry: {
      speaker: 'ALDRIC',
      text: [
        "The front gate is well-guarded. That's the obvious way — if you want to fight every man in the courtyard.",
        "The west wall has a servants' gate. Less guarded, but you'd need to look the part.",
        "There's a merchant who passes through Millhaven. He sometimes gets inside — legitimate business.",
        "And then there's the old drainage tunnel beneath the east foundation.",
        "I don't recommend the tunnel. But it's there.",
      ],
      choices: [
        { label: '"I\'ll go through the front gate."', playerLine: 'PERIVAL: "Front gate. Straightforward."', next: 'aldric_front' },
        { label: '"Servant disguise. Tell me more."', playerLine: 'PERIVAL: "The servants\' gate. What would I need?"', next: 'disguise_hint' },
        { label: '"Who is this merchant?"', playerLine: 'PERIVAL: "The merchant. Where do I find him?"', next: 'merchant_hint' },
        { label: '"I\'ll figure it out. Thanks."', playerLine: 'PERIVAL: "Understood."', next: 'aldric_farewell' },
      ],
    },

    aldric_front: {
      speaker: 'ALDRIC',
      text: [
        "That's one way.",
        "You'd need to get through about eight guards, a portcullis, and a very suspicious captain.",
        "Have you been in worse odds?",
      ],
      onShow: () => setFlag('metAldric', true),
      choices: [
        { label: '"Probably."', playerLine: 'PERIVAL: "Probably."', next: 'aldric_farewell' },
        { label: '"Tell me about the other options."', playerLine: 'PERIVAL: "Tell me the alternatives."', next: 'castle_entry' },
      ],
    },

    disguise_hint: {
      speaker: 'ALDRIC',
      text: [
        "Servant clothes. Gray linen. Castle crest embroidered in the collar.",
        "You could find some in Millhaven — the village east of here.",
        "A woman named Sera used to work in the castle laundry. She left six months ago.",
        "She might still have something.",
      ],
      onShow: () => setFlag('metAldric', true),
      choices: [
        { label: '"I\'ll find her."', playerLine: 'PERIVAL: "I\'ll look for her."', next: 'aldric_farewell' },
        { label: '"One more question."', next: 'quest_offer' },
      ],
    },

    merchant_hint: {
      speaker: 'ALDRIC',
      text: [
        "Harlin. He passes through Millhaven every week or so.",
        "He sells tools and cloth to the castle. They let him in through the trade gate.",
        "Harlin's... practical. He might help you, if you help him first.",
        "He lost a crate of goods somewhere in the ruins to the south. Claims wolves got into it.",
      ],
      onShow: () => setFlag('metAldric', true),
      choices: [
        { label: '"I\'ll find this Harlin."', playerLine: 'PERIVAL: "Harlin. I\'ll remember that."', next: 'aldric_farewell' },
        { label: '"One more question."', next: 'quest_offer' },
      ],
    },

    who_are_you: {
      speaker: 'ALDRIC',
      text: [
        "A traveler. Like you.",
        "I've been through the Keep before. Not recently. Not willingly.",
        "Let's leave it there.",
      ],
      choices: [
        { label: '"Were you a prisoner?"', playerLine: 'PERIVAL: "You were a prisoner?"', next: 'aldric_prisoner' },
        { label: '"Fine. Where am I exactly?"', playerLine: 'PERIVAL: "Forget it. Where am I?"', next: 'location' },
      ],
    },

    aldric_prisoner: {
      speaker: 'ALDRIC',
      text: [
        "For a time.",
        "There are people in that dungeon who've been there longer than you've been alive.",
        "Varek keeps them for reasons I haven't worked out yet.",
        "Some of them know things. Important things.",
      ],
      choices: [
        { label: '"What kind of things?"', playerLine: 'PERIVAL: "What things do they know?"', next: 'prisoner_lore' },
        { label: '"How do I get into the castle?"', playerLine: 'PERIVAL: "How do I get in?"', next: 'castle_entry' },
      ],
    },

    prisoner_lore: {
      speaker: 'ALDRIC',
      text: [
        "About what's beneath the castle. About what it is.",
        "And about why Varek is keeping it alive rather than destroying it.",
        "That last part is what worries me.",
      ],
      choices: [
        { label: '"Do you want me to free them?"', playerLine: 'PERIVAL: "Do you want them freed?"', next: 'quest_offer' },
        { label: '"How do I get in?"', playerLine: 'PERIVAL: "How do I get inside?"', next: 'castle_entry' },
      ],
    },

    quest_offer: {
      speaker: 'ALDRIC',
      text: [
        "...",
        "There's something I'd ask of you, if you're going inside anyway.",
        "A note. I need it delivered to a prisoner named Edran. He's in the lower dungeon.",
        "Don't read it. Don't lose it.",
      ],
      onShow: () => {
        if (!getFlag('aldricQuestGiven')) {
          setFlag('aldricQuestGiven', true);
          addItem('aldric_note', 1);
        }
      },
      choices: [
        {
          label: '"I\'ll deliver it."',
          playerLine: 'PERIVAL: "I\'ll find him."',
          onSelect: () => {
            import('./quests.js').then(q => q.activateQuest('the_wanderer'));
            showToast("Quest: 'The Wanderer's Note' added.", 'magic');
          },
          next: 'aldric_farewell',
        },
        {
          label: '"Why should I?"',
          playerLine: 'PERIVAL: "Why would I risk that for you?"',
          next: 'aldric_why',
        },
        {
          label: '"Not my problem."',
          playerLine: 'PERIVAL: "I\'m not your messenger."',
          next: 'aldric_declined',
        },
      ],
    },

    aldric_why: {
      speaker: 'ALDRIC',
      text: [
        "Because Edran knows what's beneath the castle.",
        "And once you see it yourself, you'll want that knowledge.",
        "Trust me. Or don't. You'll change your mind eventually.",
      ],
      choices: [
        {
          label: '"All right. I\'ll deliver it."',
          playerLine: 'PERIVAL: "Fine. I\'ll take it."',
          onSelect: () => {
            import('./quests.js').then(q => q.activateQuest('the_wanderer'));
            showToast("Quest: 'The Wanderer's Note' added.", 'magic');
          },
          next: 'aldric_farewell',
        },
        { label: '"Still no."', playerLine: 'PERIVAL: "No."', next: 'aldric_declined' },
      ],
    },

    aldric_declined: {
      speaker: 'ALDRIC',
      text: [
        "Your choice.",
        "Just... be careful in the dungeon. If you get down there.",
        "The things in the dark don't care who you are.",
      ],
      choices: [
        { label: '[ Leave ]', next: 'end' },
      ],
    },

    aldric_farewell: {
      speaker: 'ALDRIC',
      text: [
        "One last thing.",
        "Not everything you hear about Varek is true. Some of it is worse.",
        "And some of the people who say they want to help you... have reasons of their own.",
        "Keep that in mind.",
      ],
      choices: [
        { label: '[ Part ways ]', next: 'end' },
      ],
    },

    aldric_doubtful: {
      speaker: 'ALDRIC',
      text: [
        "I believe you.",
        "Most people who say that don't make it back.",
        "Most.",
      ],
      choices: [
        { label: '"Tell me about the castle."', playerLine: 'PERIVAL: "The castle. Tell me."', next: 'castle_intro' },
        { label: '[ Leave ]', next: 'end' },
      ],
    },

    lore_history: {
      speaker: 'ALDRIC',
      text: [
        "This was a prosperous kingdom once. Three generations ago.",
        "Then the old lord discovered something beneath the foundation stone of his keep.",
        "He didn't tell anyone what it was. Just ordered the lower dungeon sealed.",
        "His son unseal it.",
        "Varek's grandfather. Things went wrong quickly after that.",
      ],
      choices: [
        { label: '"What went wrong?"', playerLine: 'PERIVAL: "Wrong how?"', next: 'corruption' },
        { label: '"And now Varek continues this?"', playerLine: 'PERIVAL: "And Varek continues this pattern?"', next: 'varek_uses' },
      ],
    },

    end: null,
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   NPC: HARLIN THE MERCHANT  (settlement — Millhaven)
   ══════════════════════════════════════════════════════════════════════════ */

export const HARLIN = {
  id:   'harlin',
  name: 'Harlin',
  icon: '🧑‍💼',
  description: 'A heavyset man with a merchant\'s practiced smile. His wagon wheels are thick with mud.',

  dialogue: {
    start: {
      speaker: 'HARLIN',
      text: ["Another traveler. Good. Business has been slow since the wolves got bold."],
      choices: [
        { label: '"What do you sell?"', playerLine: 'PERIVAL: "What are you selling?"', next: 'merchant_pitch' },
        {
          label: '"I heard you get into the castle."',
          playerLine: 'PERIVAL: "I heard you have access to the Keep."',
          next: 'castle_access',
          condition: () => getFlag('metAldric'),
        },
        { label: '"Just browsing."', next: 'end' },
      ],
    },

    merchant_pitch: {
      speaker: 'HARLIN',
      text: [
        "Herbs. Tonics. Blades, if you need. Good quality, fair prices.",
        "I also do a trade route to the Keep — tools and cloth, mostly.",
        "Keeps me fed. What can I get you?",
      ],
      choices: [
        { label: '"Open shop."', next: 'end', onSelect: () => setFlag('openShopAfterDialogue', true) },
        {
          label: '"About the castle — can you help me get in?"',
          playerLine: 'PERIVAL: "The Keep. Can you get me inside?"',
          next: 'castle_access',
        },
      ],
    },

    castle_access: {
      speaker: 'HARLIN',
      text: [
        "That's a dangerous question to ask a merchant.",
        "I have a trade license. I get into the trade yard, not the whole castle.",
        "And I'm not in the habit of smuggling strangers past Lord Varek's guards.",
      ],
      choices: [
        {
          label: '"I\'d make it worth your while."',
          playerLine: 'PERIVAL: "I\'d compensate you."',
          next: 'harlin_cost',
        },
        {
          label: '"I heard you lost some goods in the ruins."',
          playerLine: 'PERIVAL: "I heard wolves got into your cargo."',
          next: 'harlin_quest',
          condition: () => getFlag('metAldric'),
        },
      ],
    },

    harlin_cost: {
      speaker: 'HARLIN',
      text: [
        "Worth my while would be... fifty gold. And the risks that come with it.",
        "Or.",
        "You could help me with something first. Then we talk.",
      ],
      choices: [
        { label: '"What do you need?"', playerLine: 'PERIVAL: "What kind of help?"', next: 'harlin_quest' },
        { label: '"Fifty gold. Fine."', playerLine: 'PERIVAL: "Fifty gold. Agreed."',
          condition: () => STATE.player.gold >= 50,
          onSelect: () => {
            import('./state.js').then(({ spendGold }) => spendGold(50));
            import('./quests.js').then(q => q.completeQuest('harlin_job'));
            setFlag('harlinAgreed', true);
          },
          next: 'harlin_agreed',
        },
      ],
    },

    harlin_quest: {
      speaker: 'HARLIN',
      text: [
        "A crate of mine. Fell from the wagon near the old ruins south of the main path.",
        "There are wolves near there now. I haven't been able to go back for it.",
        "It has my merchant seal on it. Bring it back — or at least tell me it's gone — and I'll talk.",
      ],
      onShow: () => {
        import('./quests.js').then(q => q.activateQuest('harlin_crate'));
        showToast("Quest: 'Harlin's Lost Cargo' added.", 'gold');
      },
      choices: [
        {
          label: '"I\'ll find it."',
          playerLine: 'PERIVAL: "I\'ll check the ruins."',
          next: 'harlin_send_off',
        },
        { label: '"Not right now."', next: 'end' },
      ],
    },

    harlin_send_off: {
      speaker: 'HARLIN',
      text: [
        "South of the main path. Past the standing stone.",
        "Be careful. The wolves that attacked my wagon weren't ordinary.",
      ],
      choices: [{ label: '[ Leave ]', next: 'end' }],
    },

    harlin_agreed: {
      speaker: 'HARLIN',
      text: [
        "All right. Next time I go to the trade yard, I'll say you're my assistant.",
        "Dress like a laborer. Don't speak unless spoken to. Don't touch anything.",
        "I'll get you inside the gate. What you do after that is your concern.",
      ],
      choices: [{ label: '[ Nod and leave ]', next: 'end' }],
    },

    end: null,
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   NPC: SERA — EX-CASTLE SERVANT  (Millhaven)
   ══════════════════════════════════════════════════════════════════════════ */

export const SERA = {
  id:   'sera',
  name: 'Sera',
  icon: '👩',
  description: 'A quiet woman who keeps her eyes down. She looks like someone who has seen things she cannot say.',

  dialogue: {
    start: {
      speaker: 'SERA',
      text: ["Can I help you?"],
      choices: [
        {
          label: '"I heard you worked in the castle."',
          playerLine: 'PERIVAL: "I was told you worked in the castle laundry."',
          next: 'castle_work',
        },
        {
          label: '"I need servant clothes."',
          playerLine: 'PERIVAL: "I need servant\'s clothing. Castle issue."',
          next: 'clothes_ask',
        },
        { label: '"Nothing. Sorry."', next: 'end' },
      ],
    },

    castle_work: {
      speaker: 'SERA',
      text: [
        "I did. For seven years.",
        "I left six months ago.",
        "I don't talk about it.",
      ],
      choices: [
        { label: '"Why did you leave?"', playerLine: 'PERIVAL: "Why did you leave?"', next: 'why_left' },
        { label: '"I need servant clothes to get inside."', playerLine: 'PERIVAL: "I need to get inside. I need the clothes."', next: 'clothes_ask' },
      ],
    },

    why_left: {
      speaker: 'SERA',
      text: [
        "...",
        "The sounds changed. Six months ago.",
        "From underground. Something that used to be quiet started... moving.",
        "I packed that night. I didn't tell the other servants. I should have.",
      ],
      choices: [
        { label: '"What sounds?"', playerLine: 'PERIVAL: "What kind of sounds?"', next: 'sounds' },
        { label: '"I need to get inside. Will you help?"', playerLine: 'PERIVAL: "I need your help to get in."', next: 'clothes_ask' },
      ],
    },

    sounds: {
      speaker: 'SERA',
      text: [
        "Chains.",
        "Not rattling. Straining. Like something pulling on them.",
        "And breathing. Very slow. Very deep.",
        "I thought it was the dungeons at first. But the dungeons are shallow.",
        "This was coming from much further down.",
      ],
      choices: [
        { label: '"I need to see this for myself."', playerLine: 'PERIVAL: "I need to get in there."', next: 'clothes_ask' },
      ],
    },

    clothes_ask: {
      speaker: 'SERA',
      text: [
        "...",
        "I kept one set. In case I ever needed to go back.",
        "I won't ask why you need them.",
        "Just... come back out. Whoever you are.",
      ],
      onShow: () => {
        if (!hasItem('servant_clothes')) {
          addItem('servant_clothes', 1);
          showToast('Received: Servant Clothes.', 'success');
        }
      },
      choices: [{ label: '[ Take the clothes ]', next: 'sera_farewell' }],
    },

    sera_farewell: {
      speaker: 'SERA',
      text: [
        "The servants' gate is on the west wall.",
        "The guard changes at midnight.",
        "And there's a man named Edran in the deep dungeon.",
        "He's been there for years. He was kind to me once. If you can...",
      ],
      choices: [{ label: '[ Leave ]', next: 'end' }],
    },

    end: null,
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   NPC: VAREK'S AGENT  (forest — suspicious stranger)
   A morally ambiguous character with hidden motives.
   ══════════════════════════════════════════════════════════════════════════ */

export const RAVENS_AGENT = {
  id:   'ravens_agent',
  name: 'Hooded Stranger',
  icon: '🦅',
  description: 'A figure in black sits at the roadside, watching the road with uncommon intensity.',

  dialogue: {
    start: {
      speaker: 'HOODED STRANGER',
      text: [
        "You're heading for the castle.",
        "Don't bother denying it. Everyone on this road is.",
      ],
      choices: [
        { label: '"Who are you?"', playerLine: 'PERIVAL: "Who are you?"', next: 'who_are_you' },
        { label: '"What do you want?"', playerLine: 'PERIVAL: "What do you want?"', next: 'offer' },
        { label: '"None of your business."', playerLine: 'PERIVAL: "None of your concern."', next: 'stranger_cold' },
      ],
    },

    who_are_you: {
      speaker: 'HOODED STRANGER',
      text: [
        "Someone who wants the same thing you want.",
        "Or close to it.",
        "There's a man inside the castle. Lord Varek's chief advisor. His name is Mordis.",
        "I want him dead.",
      ],
      choices: [
        { label: '"Why?"', playerLine: 'PERIVAL: "Why?"', next: 'motive' },
        { label: '"I\'m not an assassin."', playerLine: 'PERIVAL: "I\'m not a hired killer."', next: 'stranger_pressure' },
      ],
    },

    motive: {
      speaker: 'HOODED STRANGER',
      text: [
        "Mordis is the one who opened the lower dungeon.",
        "Varek is greedy but cautious. Mordis is greedy and reckless.",
        "The corruption spreading through this forest? That's his work.",
        "Kill him and the experiments stop. The corruption slows.",
      ],
      choices: [
        { label: '"How do I know you\'re telling the truth?"', playerLine: 'PERIVAL: "Why should I believe you?"', next: 'trust_question' },
        { label: '"What do I get?"', playerLine: 'PERIVAL: "What\'s in it for me?"', next: 'reward_offer' },
        { label: '"I\'ll think about it."', playerLine: 'PERIVAL: "I\'ll consider it."', next: 'stranger_patience' },
      ],
    },

    trust_question: {
      speaker: 'HOODED STRANGER',
      text: [
        "You don't. That's the honest answer.",
        "What I can tell you is: Mordis has been in the dungeon every night for a month.",
        "Ask any servant who's still sane. They'll confirm it.",
        "Whether you believe the rest... that's your problem.",
      ],
      choices: [
        { label: '"What do I get if I do this?"', playerLine: 'PERIVAL: "If I did this. What\'s my payment?"', next: 'reward_offer' },
        { label: '"I need more than that."', playerLine: 'PERIVAL: "That\'s not enough."', next: 'stranger_partial_truth' },
      ],
    },

    stranger_partial_truth: {
      speaker: 'HOODED STRANGER',
      text: [
        "...",
        "There's a faction in the city that wants the Keep's research stopped.",
        "Not just because of the corruption. Because of what Mordis intends to do with it.",
        "I represent them.",
        "That's all I can say.",
      ],
      choices: [
        { label: '"What faction?"', playerLine: 'PERIVAL: "What faction?"', next: 'faction_mystery' },
        { label: '"Fine. What\'s the payment?"', playerLine: 'PERIVAL: "Payment. Now."', next: 'reward_offer' },
      ],
    },

    faction_mystery: {
      speaker: 'HOODED STRANGER',
      text: [
        "One that has existed longer than this kingdom.",
        "One that has dealt with things like what\'s beneath that castle before.",
        "The name would mean nothing to you. Yet.",
      ],
      choices: [
        { label: '"Fine. Payment."', playerLine: 'PERIVAL: "What do I get?"', next: 'reward_offer' },
        { label: '"I\'m done talking."', playerLine: 'PERIVAL: "I\'ve heard enough."', next: 'stranger_patience' },
      ],
    },

    reward_offer: {
      speaker: 'HOODED STRANGER',
      text: [
        "Gold. Seventy coins. And something useful for the dungeon.",
        "A key to the east passage. It bypasses most of the guard posts.",
      ],
      onShow: () => setFlag('strangerQuestOffered', true),
      choices: [
        {
          label: '"Agreed."',
          playerLine: 'PERIVAL: "Done."',
          onSelect: () => {
            import('./quests.js').then(q => q.activateQuest('the_mordis_job'));
            showToast("Quest: 'The Mordis Job' added.", 'danger');
          },
          next: 'stranger_farewell',
        },
        { label: '"I\'ll decide inside."', playerLine: 'PERIVAL: "I\'ll decide when I\'m in there."', next: 'stranger_patience' },
        { label: '"No."', playerLine: 'PERIVAL: "No."', next: 'stranger_cold' },
      ],
    },

    stranger_patience: {
      speaker: 'HOODED STRANGER',
      text: [
        "Fine. You'll know where to find me if you change your mind.",
        "Or you won't. The road always brings people back here eventually.",
      ],
      choices: [{ label: '[ Leave ]', next: 'end' }],
    },

    stranger_cold: {
      speaker: 'HOODED STRANGER',
      text: [
        "As you like.",
        "Just remember you heard the name Mordis. That's all I ask.",
      ],
      choices: [{ label: '[ Leave ]', next: 'end' }],
    },

    stranger_pressure: {
      speaker: 'HOODED STRANGER',
      text: [
        "I'm not asking you to execute a man in the street.",
        "Mordis is guarded. He's in the castle.",
        "You'll have to fight your way through anyway.",
        "I'm just suggesting a target.",
      ],
      choices: [
        { label: '"Tell me more."', playerLine: 'PERIVAL: "Tell me more about him."', next: 'motive' },
        { label: '"Still no."', playerLine: 'PERIVAL: "No."', next: 'stranger_cold' },
      ],
    },

    stranger_farewell: {
      speaker: 'HOODED STRANGER',
      text: [
        "Good.",
        "One more thing.",
        "Mordis knows someone is coming. He always does.",
        "Don't confront him directly. Find proof of what he's done first.",
        "Evidence. Or the castle itself will protect him.",
      ],
      choices: [{ label: '[ Leave ]', next: 'end' }],
    },

    offer: {
      speaker: 'HOODED STRANGER',
      text: [
        "Work. A specific kind.",
        "There's a man inside the castle who needs to stop doing what he's doing.",
        "Permanently.",
      ],
      choices: [
        { label: '"Go on."', playerLine: 'PERIVAL: "Continue."', next: 'who_are_you' },
        { label: '"Not interested."', playerLine: 'PERIVAL: "Not interested."', next: 'stranger_cold' },
      ],
    },

    end: null,
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   NPC: OLD MILLER  (Millhaven — ambient)
   ══════════════════════════════════════════════════════════════════════════ */

export const OLD_MILLER = {
  id:   'old_miller',
  name: 'Old Miller',
  icon: '👴',
  description: 'A stooped man sitting on a rotting step. He watches you with hollowed eyes.',

  dialogue: {
    start: {
      speaker: 'OLD MILLER',
      text: [
        "You're not from here.",
        "Good.",
        "Leave before you become from here.",
      ],
      choices: [
        { label: '"What happened to this place?"', playerLine: 'PERIVAL: "What happened here?"', next: 'village_state' },
        { label: '"Is there anything worth finding in the ruins?"', playerLine: 'PERIVAL: "The ruins to the south — is there anything there?"', next: 'ruins_info' },
        { label: '"Have you seen a child wandering alone?"', playerLine: 'PERIVAL: "A child. Have you seen one alone?"', next: 'child_info', condition: () => getFlag('childQuestActive') },
        { label: '[ Leave ]', next: 'end' },
      ],
    },

    village_state: {
      speaker: 'OLD MILLER',
      text: [
        "The castle happened. Same as it always does.",
        "Takes the men for guards. Takes the crops for taxes.",
        "Now takes the young ones for... they don't say what.",
        "Seven children gone from Millhaven in three months.",
      ],
      choices: [
        { label: '"Gone how?"', playerLine: 'PERIVAL: "Gone — what do you mean?"', next: 'children_gone' },
        { label: '"I\'ll look into it."', playerLine: 'PERIVAL: "Seven children."', next: 'miller_hope' },
      ],
    },

    children_gone: {
      speaker: 'OLD MILLER',
      text: [
        "Taken in the night. Some say wolves. But wolves leave marks.",
        "These didn't leave marks.",
        "The guards won't investigate. They serve Varek.",
        "One mother still searches. Her name is Miren. You'll find her at the east end of the village.",
      ],
      onShow: () => {
        setFlag('childQuestActive', true);
        import('./quests.js').then(q => q.activateQuest('the_missing_child'));
        showToast("Quest: 'The Missing Child' added.", 'magic');
      },
      choices: [
        { label: '"I\'ll speak to Miren."', playerLine: 'PERIVAL: "I\'ll find Miren."', next: 'miller_hope' },
      ],
    },

    miller_hope: {
      speaker: 'OLD MILLER',
      text: [
        "You'd be the first outsider to try.",
        "That means either you're very good or very stupid.",
        "Either way. Go.",
      ],
      choices: [{ label: '[ Leave ]', next: 'end' }],
    },

    ruins_info: {
      speaker: 'OLD MILLER',
      text: [
        "Old settlement. Before the current village.",
        "Something moved into it last year. Something that doesn't make sounds like an animal.",
        "People who go looking for salvage don't come back the same.",
        "One came back last month. Just... sat by the well and stared at the ground for four days.",
        "Then he left for the castle.",
        "Hasn't been seen since.",
      ],
      choices: [{ label: '[ Leave ]', next: 'end' }],
    },

    child_info: {
      speaker: 'OLD MILLER',
      text: [
        "Miren's child? Last I saw, heading toward the old mill south of town.",
        "At night. I thought I was dreaming.",
        "The mill's been abandoned for two years.",
      ],
      choices: [{ label: '[ Go to the old mill ]', next: 'end' }],
    },

    end: null,
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   EXPORT all NPCs as a map for easy lookup
   ══════════════════════════════════════════════════════════════════════════ */

export const ALL_NPCS = {
  aldric:        ALDRIC,
  harlin:        HARLIN,
  sera:          SERA,
  ravens_agent:  RAVENS_AGENT,
  old_miller:    OLD_MILLER,
};

