/**
 * Shadowrun 5e character creation rules data.
 * Sources: SR5 Core Rulebook pp.62–107 (Priority Table, Metatype Attribute Table, Advancement costs)
 *          Run Faster pp.62–66 (Sum to Ten, Point Buy, Life Modules) and pp.104–107 (metavariants, metasapients, shapeshifters).
 */

export const ATTRS = ["body", "agility", "reaction", "strength", "willpower", "logic", "intuition", "charisma"];
export const PHYSICAL = ["body", "agility", "reaction", "strength"];
export const MENTAL = ["willpower", "logic", "intuition", "charisma"];
export const SPECIAL = ["edge", "magic", "resonance"];
export const ATTR_LABEL = {
  body: "Body", agility: "Agility", reaction: "Reaction", strength: "Strength",
  willpower: "Willpower", logic: "Logic", intuition: "Intuition", charisma: "Charisma",
  edge: "Edge", magic: "Magic", resonance: "Resonance", essence: "Essence"
};
export const ATTR_SHORT = { body: "BOD", agility: "AGI", reaction: "REA", strength: "STR", willpower: "WIL", logic: "LOG", intuition: "INT", charisma: "CHA", edge: "EDG", magic: "MAG", resonance: "RES" };

export const LEVELS = ["A", "B", "C", "D", "E"];
export const SUM_TO_TEN_COST = { A: 4, B: 3, C: 2, D: 1, E: 0 };
export const COLUMNS = ["metatype", "attributes", "magic", "skills", "resources"];
export const COLUMN_LABEL = { metatype: "Metatype", attributes: "Attributes", magic: "Magic or Resonance", skills: "Skills", resources: "Resources" };

export const PRIORITY = {
  attributes: { A: 24, B: 20, C: 16, D: 14, E: 12 },
  skills: { A: [46, 10], B: [36, 5], C: [28, 2], D: [22, 0], E: [18, 0] }
};

/** Gameplay levels (SR5 p.64 sidebar "Alternate Gameplay"). */
export const GAME_LEVELS = {
  street: {
    label: "Street-Level", karma: 13, maxKarma: 26, nuyenKarma: 5, avail: 10, deviceRating: 4, contactMult: 3,
    resources: { A: 75000, B: 50000, C: 25000, D: 15000, E: 6000 }
  },
  standard: {
    label: "Experienced Runner (standard)", karma: 25, maxKarma: 50, nuyenKarma: 10, avail: 12, deviceRating: 6, contactMult: 3,
    resources: { A: 450000, B: 275000, C: 140000, D: 50000, E: 6000 }
  },
  prime: {
    label: "Prime Runner", karma: 35, maxKarma: 70, nuyenKarma: 25, avail: 15, deviceRating: 6, contactMult: 6,
    resources: { A: 500000, B: 325000, C: 210000, D: 150000, E: 100000 }
  }
};

export const METHODS = {
  priority: { label: "Priority (SR5 core)", desc: "Assign A–E once each across Metatype, Attributes, Magic/Resonance, Skills and Resources. SR5 p.62." },
  sumToTen: { label: "Sum to Ten (Run Faster)", desc: "Spend 10 points on priorities (A=4, B=3, C=2, D=1, E=0); levels may repeat but each column is chosen once. Run Faster p.62." },
  pointBuy: { label: "Point Buy (Run Faster)", desc: "Start with 800 Karma, buy metatype, attributes, skills, qualities and gear with Karma. Run Faster p.64." },
  lifeModules: { label: "Life Modules (Run Faster)", desc: "Start with 750 Karma and build your history: nationality, formative years, teen years, further education and real life. Run Faster p.65." }
};

export const KARMA_START = { pointBuy: 800, lifeModules: 750 };
export const NUYEN_PER_KARMA = 2000;
export const POINT_BUY_MAX_GEAR_KARMA = 235;
export const MAX_CARRY_KARMA = 7;
export const MAX_CARRY_NUYEN = 5000;
export const QUALITY_LIMIT = 25;

/** Magic/Resonance qualities for Point Buy and Life Modules (Run Faster p.64–65). */
export const AWAKENED_TYPES = {
  mundane: { label: "Mundane", karma: 0, special: "mundane" },
  magician: { label: "Magician", karma: 30, special: "magic", quality: "Magician" },
  mysticAdept: { label: "Mystic Adept", karma: 35, special: "magic", quality: "Mystic Adept" },
  adept: { label: "Adept", karma: 20, special: "magic", quality: "Adept" },
  aspected: { label: "Aspected Magician", karma: 15, special: "magic", quality: "Aspected Magician" },
  technomancer: { label: "Technomancer", karma: 15, special: "resonance", quality: "Technomancer" }
};

/** Magic or Resonance column of the Priority Table (SR5 p.65). */
export const MAGIC_PRIORITY = {
  A: {
    magician: { rating: 6, skills: { count: 2, rating: 5, kind: "magical" }, spells: 10 },
    mysticAdept: { rating: 6, skills: { count: 2, rating: 5, kind: "magical" }, spells: 10 },
    technomancer: { rating: 6, skills: { count: 2, rating: 5, kind: "resonance" }, forms: 5 }
  },
  B: {
    magician: { rating: 4, skills: { count: 2, rating: 4, kind: "magical" }, spells: 7 },
    mysticAdept: { rating: 4, skills: { count: 2, rating: 4, kind: "magical" }, spells: 7 },
    technomancer: { rating: 4, skills: { count: 2, rating: 4, kind: "resonance" }, forms: 2 },
    adept: { rating: 6, skills: { count: 1, rating: 4, kind: "active" } },
    aspected: { rating: 5, group: { count: 1, rating: 4 } }
  },
  C: {
    magician: { rating: 3, spells: 5 },
    mysticAdept: { rating: 3, spells: 5 },
    technomancer: { rating: 3, forms: 1 },
    adept: { rating: 4, skills: { count: 1, rating: 2, kind: "active" } },
    aspected: { rating: 3, group: { count: 1, rating: 2 } }
  },
  D: {
    adept: { rating: 2 },
    aspected: { rating: 2 }
  },
  E: {}
};

export const MAGIC_GROUPS = ["Sorcery", "Conjuring", "Enchanting"];
export const RESONANCE_GROUPS = ["Tasking"];

/**
 * Magical traditions and their Drain attributes (Willpower + the listed attribute).
 * Sources: SR5 p.279, Street Grimoire pp.41–52 and 84–94, Forbidden Arcana pp.61–91, and other supplements.
 */
const T = (label, drain, source, group) => ({ label, drain, source, group });
export const TRADITIONS = {
  hermetic: T("Hermetic", "logic", "SR5 279", "Core Rulebook"),
  shamanic: T("Shamanic", "charisma", "SR5 279", "Core Rulebook"),
  aztec: T("Aztec", "charisma", "SG 41", "Street Grimoire"),
  blackMagic: T("Black Magic", "charisma", "SG 41", "Street Grimoire"),
  buddhism: T("Buddhism", "intuition", "SG 43", "Street Grimoire"),
  chaosMagic: T("Chaos Magic", "intuition", "SG 44", "Street Grimoire"),
  christianTheurgy: T("Christian Theurgy", "charisma", "SG 44", "Street Grimoire"),
  druid: T("Druid", "intuition", "SG 45", "Street Grimoire"),
  hinduism: T("Hinduism", "logic", "SG 46", "Street Grimoire"),
  islam: T("Islam", "logic", "SG 46", "Street Grimoire"),
  pathOfTheWheel: T("Path of the Wheel", "charisma", "SG 47", "Street Grimoire"),
  qabbalism: T("Qabbalism", "logic", "SG 48", "Street Grimoire"),
  shinto: T("Shinto", "charisma", "SG 48", "Street Grimoire"),
  sioux: T("Sioux", "intuition", "SG 49", "Street Grimoire"),
  vodou: T("Vodou", "charisma", "SG 50", "Street Grimoire"),
  wiccaGardnerian: T("Wicca, Gardnerian", "logic", "SG 50", "Street Grimoire"),
  wiccaGoddess: T("Wicca, Goddess", "intuition", "SG 50", "Street Grimoire"),
  wuxing: T("Wuxing", "logic", "SG 51", "Street Grimoire"),
  zoroastrianism: T("Zoroastrianism", "logic", "SG 52", "Street Grimoire"),
  insectShaman: T("Insect Shaman", "intuition", "SG 94", "Street Grimoire"),
  aboriginal: T("Aboriginal", "charisma", "SSP 3", "Shadow Spells"),
  egyptian: T("Egyptian", "intuition", "SSP 3", "Shadow Spells"),
  norse: T("Norse", "logic", "SSP 4", "Shadow Spells"),
  psionic: T("Psionic", "intuition", "SSP 5", "Shadow Spells"),
  blackMagicAlt: T("Black Magic [Alt]", "charisma", "FA 61", "Forbidden Arcana"),
  buddhismTraditionalist: T("Buddhism [Traditionalist]", "intuition", "FA 62", "Forbidden Arcana"),
  christianTraditional: T("Christian Theurgy [Traditional]", "charisma", "FA 64", "Forbidden Arcana"),
  christianVigila: T("Christian Theurgy [Vigila Evangelica]", "charisma", "FA 64", "Forbidden Arcana"),
  christianWestphalian: T("Christian Theurgy [Westphalian]", "charisma", "FA 64", "Forbidden Arcana"),
  druidAlt: T("Druid [Alt]", "charisma", "FA 65", "Forbidden Arcana"),
  druidTraditional: T("Druid [Traditional]", "charisma", "FA 65", "Forbidden Arcana"),
  islamAlchemist: T("Islam [Islamic Alchemist]", "logic", "FA 69", "Forbidden Arcana"),
  islamQuranic: T("Islam [Licit Qur'anic]", "logic", "FA 69", "Forbidden Arcana"),
  norseAlt: T("Norse [Alt]", "charisma", "FA 68", "Forbidden Arcana"),
  norseGodi: T("Norse [Godi/Runemaster]", "charisma", "FA 68", "Forbidden Arcana"),
  norseCunning: T("Norse [Cunning Woman]", "charisma", "FA 68", "Forbidden Arcana"),
  norseBerserker: T("Norse [Berserker]", "charisma", "FA 68", "Forbidden Arcana"),
  norseSeidman: T("Norse [Seidman]", "charisma", "FA 68", "Forbidden Arcana"),
  traditionalistShaman: T("Traditionalist Shaman", "charisma", "FA 74", "Forbidden Arcana"),
  ancestorShaman: T("Ancestor Shaman", "charisma", "FA 74", "Forbidden Arcana"),
  cosmic: T("Cosmic", "logic", "FA 75", "Forbidden Arcana"),
  draconic: T("Draconic", "magic", "FA 76", "Forbidden Arcana"),
  elderGod: T("Elder God", "intuition", "FA 78", "Forbidden Arcana"),
  greenMagic: T("Green Magic", "charisma", "FA 80", "Forbidden Arcana"),
  missionist: T("Missionist", "charisma", "FA 81", "Forbidden Arcana"),
  necroMagic: T("Necro Magic", "logic", "FA 82", "Forbidden Arcana"),
  olympianism: T("Olympianism", "logic", "FA 84", "Forbidden Arcana"),
  pariah: T("Pariah", "logic", "FA 85", "Forbidden Arcana"),
  planarMagic: T("Planar Magic", "logic", "FA 87", "Forbidden Arcana"),
  redMagic: T("Red Magic", "intuition", "FA 88", "Forbidden Arcana"),
  romani: T("Romani", "willpower", "FA 90", "Forbidden Arcana"),
  tarot: T("Tarot", "logic", "FA 91", "Forbidden Arcana"),
  obeah: T("Obeah", "charisma", "HT 130", "Hard Targets"),
  santeria: T("Santeria", "intuition", "HT 130", "Hard Targets"),
  darkMagic: T("Dark Magic", "charisma", "DTR 165", "Dark Terrors"),
  quimbanda: T("Quimbanda", "charisma", "SFME 13", "Other supplements"),
  armanentradition: T("Armanentradition", "logic", "SAG 111", "Other supplements"),
  dianism: T("Dianism", "intuition", "SAG 112", "Other supplements"),
  frisianMagic: T("Frisian Magic", "logic", "SAG 113", "Other supplements"),
  romaStreetNomads: T("Magic of Roma and Street Nomads", "charisma", "SAG 114", "Other supplements"),
  svetovid: T("Svetovid", "charisma", "SAG 115", "Other supplements"),
  trollShamanism: T("Troll Shamanism", "charisma", "SAG 115", "Other supplements"),
  drSinger: T("Dr. Singer School", "charisma", "DATG 40", "Other supplements"),
  stormChildren: T("Storm Children", "intuition", "DATG 41", "Other supplements"),
  faustianAlt: T("Faustian [Alt]", "logic", "SOTG 25", "Other supplements"),
  brockenCauldron: T("Brocken Witches [Alt], Cauldron", "intuition", "SOTG 25", "Other supplements"),
  brockenHelsmagde: T("Brocken Witches [Alt], Helsmägde", "intuition", "SOTG 25", "Other supplements"),
  frisianFrijskwart: T("Frisian Magic [Alt], Frijskwart", "logic", "SOTG 26", "Other supplements"),
  frisianSeaMonk: T("Frisian Magic [Alt], Sea Monk", "logic", "SOTG 26", "Other supplements"),
  freudian: T("Freudian Tradition", "logic", "SOTG 27", "Other supplements"),
  guardianOrder: T("Guardian Order", "charisma", "SOTG 28", "Other supplements"),
  storyteller: T("Storyteller", "charisma", "GE 68", "Other supplements"),
  custom: T("Custom (choose Drain attribute)", "", "SR5 279", "Custom")
};
export const DRAIN_ATTRIBUTES = ["logic", "intuition", "charisma", "willpower", "magic"];

/** Starting nuyen (SR5 p.95) by lifestyle. */
export const LIFESTYLES = {
  street: { label: "Street", cost: 0, dice: 1, mult: 20 },
  squatter: { label: "Squatter", cost: 500, dice: 2, mult: 40 },
  low: { label: "Low", cost: 2000, dice: 3, mult: 60 },
  medium: { label: "Middle", cost: 5000, dice: 4, mult: 100 },
  high: { label: "High", cost: 10000, dice: 5, mult: 500 },
  luxury: { label: "Luxury", cost: 100000, dice: 6, mult: 1000 }
};

/** Cyberware/bioware grades (SR5 p.451). */
export const GRADES = {
  standard: { label: "Standard", essence: 1, cost: 1, avail: 0 },
  used: { label: "Used", essence: 1.25, cost: 0.75, avail: -4 },
  alpha: { label: "Alphaware", essence: 0.8, cost: 1.2, avail: 2 },
  beta: { label: "Betaware", essence: 0.7, cost: 1.5, avail: 4 },
  delta: { label: "Deltaware", essence: 0.5, cost: 2.5, avail: 8 }
};

const A = (s) => {
  // "1/6 2/7 ..." in order BOD AGI REA STR WIL LOG INT CHA EDG
  const parts = s.trim().split(/\s+/).map(p => p.split("/").map(Number));
  const keys = [...ATTRS, "edge"];
  const out = {};
  keys.forEach((k, i) => { out[k] = { min: parts[i][0], max: parts[i][1] }; });
  return out;
};

/**
 * Metatypes. `base` is the SR5 system metatype value (system only knows the five core types).
 * `priority` maps level -> [special attribute points, additional karma cost].
 * `cost` is the Point Buy / Life Module metatype Karma cost (Run Faster p.64).
 */
export const METATYPES = {
  human: { label: "Human", group: "Core", base: "human", cost: 0, lifestyle: 1, attrs: A("1/6 1/6 1/6 1/6 1/6 1/6 1/6 1/6 2/7"),
    priority: { A: [9, 0], B: [7, 0], C: [5, 0], D: [3, 0], E: [1, 0] }, traits: [] },
  elf: { label: "Elf", group: "Core", base: "elf", cost: 40, lifestyle: 1, attrs: A("1/6 2/7 1/6 1/6 1/6 1/6 1/6 3/8 1/6"),
    priority: { A: [8, 0], B: [6, 0], C: [3, 0], D: [0, 0] }, traits: ["Low-Light Vision"] },
  dwarf: { label: "Dwarf", group: "Core", base: "dwarf", cost: 50, lifestyle: 1.2, attrs: A("3/8 1/6 1/5 3/8 2/7 1/6 1/6 1/6 1/6"),
    priority: { A: [7, 0], B: [4, 0], C: [1, 0] }, traits: ["Resistance to Pathogens/Toxins", "Thermographic Vision", "+20% Lifestyle cost"] },
  ork: { label: "Ork", group: "Core", base: "ork", cost: 50, lifestyle: 1, attrs: A("4/9 1/6 1/6 3/8 1/6 1/5 1/6 1/5 1/6"),
    priority: { A: [7, 0], B: [4, 0], C: [0, 0] }, traits: ["Low-Light Vision"] },
  troll: { label: "Troll", group: "Core", base: "troll", cost: 90, lifestyle: 2, attrs: A("5/10 1/5 1/6 5/10 1/6 1/5 1/5 1/4 1/6"),
    priority: { A: [5, 0], B: [0, 0] }, traits: ["Thermographic Vision", "+1 Reach", "+1 Dermal Armor", "+100% Lifestyle cost"] },

  // Metavariants (Run Faster p.104)
  gnome: { label: "Gnome (Dwarf)", group: "Metavariant", base: "dwarf", cost: 50, lifestyle: 1.2, attrs: A("1/4 2/7 1/6 1/4 2/7 2/7 1/6 1/6 1/6"),
    priority: { A: [7, 7], B: [4, 7], C: [1, 7] }, traits: ["+20% Lifestyle cost", "Arcane Arrester (2)", "Neoteny", "Thermographic Vision"] },
  hanuman: { label: "Hanuman (Dwarf)", group: "Metavariant", base: "dwarf", cost: 100, lifestyle: 1.2, attrs: A("1/6 2/7 1/6 2/7 1/6 1/5 2/7 1/5 1/6"),
    priority: { A: [7, 5], B: [4, 5], C: [1, 5] }, traits: ["+20% Lifestyle cost", "Monkey Paws", "Prehensile Tail", "Thermographic Vision", "Unusual Hair (Body)"] },
  koborokuru: { label: "Koborokuru (Dwarf)", group: "Metavariant", base: "dwarf", cost: 70, lifestyle: 1.2, attrs: A("2/7 1/6 1/6 2/7 2/7 1/6 1/6 1/6 1/6"),
    priority: { A: [7, 0], B: [4, 0], C: [1, 0] }, traits: ["+20% Lifestyle cost", "Celerity", "Resistance to Pathogens/Toxins", "Thermographic Vision", "Unusual Hair"] },
  menehune: { label: "Menehune (Dwarf)", group: "Metavariant", base: "dwarf", cost: 50, lifestyle: 1.2, attrs: A("2/7 2/7 1/5 2/7 1/6 1/6 1/6 1/6 1/6"),
    priority: { A: [7, 2], B: [4, 2], C: [1, 2] }, traits: ["+20% Lifestyle cost", "Resistance to Pathogens", "Thermographic Vision", "Underwater Vision", "Webbed Digits"] },
  dryad: { label: "Dryad (Elf)", group: "Metavariant", base: "elf", cost: 90, lifestyle: 1, attrs: A("1/6 2/7 1/6 1/5 1/6 1/6 1/6 3/8 1/6"),
    priority: { A: [8, 0], B: [6, 0], C: [3, 0], D: [0, 0] }, traits: ["Glamour", "Low-Light Vision", "Symbiosis"] },
  nocturna: { label: "Nocturna (Elf)", group: "Metavariant", base: "elf", cost: 60, lifestyle: 1, attrs: A("1/5 3/8 1/6 1/6 1/6 1/6 1/6 2/7 1/6"),
    priority: { A: [8, 0], B: [6, 0], C: [3, 0], D: [0, 0] }, traits: ["Allergy (Sunlight, Mild)", "Low-Light Vision", "Keen-Eared", "Nocturnal", "Unusual Hair (Colored Fur)"] },
  wakyambi: { label: "Wakyambi (Elf)", group: "Metavariant", base: "elf", cost: 70, lifestyle: 1, attrs: A("1/6 2/7 1/6 1/6 1/6 1/5 2/7 1/6 1/6"),
    priority: { A: [8, 12], B: [6, 12], C: [3, 12], D: [0, 12] }, traits: ["Celerity", "Elongated Limbs", "Low-Light Vision"] },
  xapiri: { label: "Xapiri Thëpë (Elf)", group: "Metavariant", base: "elf", cost: 80, lifestyle: 1, attrs: A("1/6 2/7 1/6 1/6 1/6 1/5 1/6 2/7 1/6"),
    priority: { A: [8, 0], B: [6, 0], C: [3, 0], D: [0, 0] }, traits: ["Allergy (Pollutants, Mild)", "Low-Light Vision", "Photometabolism"] },
  nartaki: { label: "Nartaki (Human)", group: "Metavariant", base: "human", cost: 40, lifestyle: 1, attrs: A("1/6 1/6 1/6 1/6 1/6 1/6 1/6 1/6 2/7"),
    priority: { A: [8, 0], B: [6, 0], C: [4, 0], D: [2, 0], E: [1, 0] }, traits: ["Shiva Arms", "Striking Skin Pigmentation"] },
  hobgoblin: { label: "Hobgoblin (Ork)", group: "Metavariant", base: "ork", cost: 40, lifestyle: 1, attrs: A("3/8 1/6 1/6 2/7 1/6 1/5 1/6 1/5 1/6"),
    priority: { A: [7, 5], B: [4, 5], C: [0, 5] }, traits: ["Fangs", "Keen-Eared", "Low-Light Vision", "Poor Self Control (Vindictive)"] },
  ogre: { label: "Ogre (Ork)", group: "Metavariant", base: "ork", cost: 40, lifestyle: 1, attrs: A("4/9 1/6 1/5 3/8 2/7 1/5 1/6 1/4 1/6"),
    priority: { A: [7, 8], B: [4, 8], C: [0, 8] }, traits: ["Low-Light Vision", "Ogre Stomach"] },
  oni: { label: "Oni (Ork)", group: "Metavariant", base: "ork", cost: 50, lifestyle: 1, attrs: A("3/8 2/7 1/6 2/7 1/6 1/5 1/6 2/7 1/6"),
    priority: { A: [7, 4], B: [4, 4], C: [0, 4] }, traits: ["Low-Light Vision", "Striking Skin Pigmentation"] },
  satyr: { label: "Satyr (Ork)", group: "Metavariant", base: "ork", cost: 50, lifestyle: 1, attrs: A("2/7 1/6 2/7 2/7 1/6 1/6 1/6 1/5 1/6"),
    priority: { A: [7, 10], B: [4, 10], C: [0, 10] }, traits: ["Low-Light Vision", "Satyr Legs"] },
  cyclops: { label: "Cyclops (Troll)", group: "Metavariant", base: "troll", cost: 100, lifestyle: 2, attrs: A("5/10 1/5 1/6 6/11 1/6 1/4 1/5 1/4 1/6"),
    priority: { A: [5, 2], B: [0, 2] }, traits: ["+100% Lifestyle cost", "Cyclopean Eye", "+1 Reach", "Thermographic Vision"] },
  fomorian: { label: "Fomorian (Troll)", group: "Metavariant", base: "troll", cost: 100, lifestyle: 2, attrs: A("4/9 1/5 1/6 5/10 1/5 1/4 1/4 1/5 1/6"),
    priority: { A: [5, 12], B: [0, 12] }, traits: ["+100% Lifestyle cost", "Arcane Arrester (1)", "Thermographic Vision", "+1 Reach"] },
  giant: { label: "Giant (Troll)", group: "Metavariant", base: "troll", cost: 90, lifestyle: 2, attrs: A("5/10 1/5 1/5 5/10 1/6 1/5 1/5 1/5 1/6"),
    priority: { A: [5, 2], B: [0, 2] }, traits: ["+100% Lifestyle cost", "Dermal Alteration (Bark)", "Thermographic Vision", "+1 Reach"] },
  minotaur: { label: "Minotaur (Troll)", group: "Metavariant", base: "troll", cost: 100, lifestyle: 2, attrs: A("6/11 1/5 1/6 5/10 1/6 1/5 1/6 1/4 1/6"),
    priority: { A: [5, 2], B: [0, 2] }, traits: ["+100% Lifestyle cost", "Goring Horns", "Thermographic Vision", "+1 Reach"] },

  // Metasapients (Run Faster p.105) – the SR5 system has no metatype for these; they are stored as human with a note.
  centaur: { label: "Centaur", group: "Metasapient", base: "human", cost: 60, lifestyle: 2.5, minMagic: 1, attrs: A("3/8 1/6 1/6 3/8 1/6 1/6 1/5 1/5 1/5"),
    priority: { A: [6, 25], B: [3, 25], C: [0, 25] }, traits: ["+150% Lifestyle cost", "Low-Light Vision", "Thermographic Vision", "Magic Sense", "Natural Weapon (Kick: DV (STR+2)P, AP +1, +1 Reach)", "Search", "Movement (x1/x4/+4)"] },
  naga: { label: "Naga", group: "Metasapient", base: "human", cost: 95, lifestyle: 2.5, minMagic: 1, attrs: A("3/8 1/4 2/7 4/9 2/7 1/6 1/6 2/7 1/5"),
    priority: { A: [4, 25], B: [2, 25], C: [0, 25] }, traits: ["+150% Lifestyle cost", "Armor 8", "Cold-Blooded", "Dual Natured", "Guard", "Movement (x1/x4/+1; x2/x6/+2 swimming)", "Natural Weapon (Bite: DV (STR+1)P, AP -2, Reach -1)", "Venom"] },
  pixie: { label: "Pixie", group: "Metasapient", base: "human", cost: 70, lifestyle: 2, minMagic: 1, attrs: A("1/2 3/8 3/8 1/2 3/8 2/7 2/7 3/8 2/7"),
    priority: { A: [6, 15], B: [3, 15], C: [0, 15] }, traits: ["+100% Lifestyle cost", "Astral Perception", "Concealment (Self Only)", "Uneducated", "Movement (x1/x2/+1; x2/x6/+2 flight)", "Vanishing (Only Upon Death)"] },
  sasquatch: { label: "Sasquatch", group: "Metasapient", base: "human", cost: 90, lifestyle: 2, minMagic: 1, attrs: A("6/11 1/6 1/6 5/10 1/6 1/6 1/6 1/6 1/6"),
    priority: { A: [5, 20], B: [2, 20], C: [0, 20] }, traits: ["+100% Lifestyle cost", "Dual Natured", "Mimicry", "Movement (x2/x4/+2)", "Natural Weapon (Claws: DV (STR+1)P, AP —, +1 Reach)", "Uneducated"] },

  // Shapeshifters (Run Faster p.105)
  ssBovine: { label: "Shapeshifter (Bovine)", group: "Shapeshifter", base: "human", cost: 100, lifestyle: 1, minMagic: 1, attrs: A("3/8 1/4 1/4 4/9 1/6 1/5 1/6 1/6 1/5"),
    priority: { A: [8, 5], B: [6, 5], C: [4, 5] }, traits: ["Goring Horns", "Shift (Metahuman Form)", "Uneducated", "Movement (x1/x4/+1m)", "Initiative +1D6"] },
  ssVulpine: { label: "Shapeshifter (Vulpine)", group: "Shapeshifter", base: "human", cost: 100, lifestyle: 1, minMagic: 1, attrs: A("1/4 2/7 1/6 1/4 1/6 1/5 2/7 2/7 1/5"),
    priority: { A: [8, 5], B: [6, 5], C: [4, 5] }, traits: ["Broadened Auditory Spectrum (Ultrasonic)", "Keen-Eared", "Low-Light Vision", "Natural Weapon (Bite: DV (STR+1)P, AP —)", "Shift (Metahuman Form)", "Uneducated", "Vomeronasal Organ", "Movement (x1/x3/+2)", "Initiative +2D6"] },
  ssCanine: { label: "Shapeshifter (Canine)", group: "Shapeshifter", base: "human", cost: 110, lifestyle: 1, minMagic: 1, attrs: A("1/5 1/6 2/7 1/5 2/7 1/5 2/7 2/7 1/5"),
    priority: { A: [7, 10], B: [5, 10], C: [3, 10] }, traits: ["Broadened Auditory Spectrum (Ultrasonic)", "Low-Light Vision", "Natural Weapon (Bite: DV (STR+1)P, AP -1)", "Shift (Metahuman Form)", "Vomeronasal Organ", "Movement (x2/x6/+3)", "Initiative +1D6"] },
  ssFalconine: { label: "Shapeshifter (Falconine)", group: "Shapeshifter", base: "human", cost: 110, lifestyle: 1, minMagic: 1, attrs: A("1/4 2/7 3/8 1/4 1/6 1/5 2/7 2/7 1/5"),
    priority: { A: [7, 10], B: [5, 10], C: [3, 10] }, traits: ["Hawk Eye", "Natural Weapon (Bite: DV (STR+2)P, AP -1, Reach -1; Talons: DV (STR)P)", "Shift (Metahuman Form)", "Uneducated", "Movement (x1/x2/+0.5m; x2/x6/+2 flight)", "Initiative +2D6"] },
  ssLupine: { label: "Shapeshifter (Lupine)", group: "Shapeshifter", base: "human", cost: 120, lifestyle: 1, minMagic: 1, attrs: A("1/6 2/7 1/6 1/6 1/6 1/5 2/7 2/7 1/5"),
    priority: { A: [6, 15], B: [4, 15], C: [2, 15] }, traits: ["Broadened Auditory Spectrum (Ultrasonic)", "Low-Light Vision", "Natural Weapon (Bite: DV (STR+1)P, AP -1)", "Shift (Metahuman Form)", "Uneducated", "Vomeronasal Organ", "Movement (x1/x5/+3)", "Initiative +2D6"] },
  ssEquine: { label: "Shapeshifter (Equine)", group: "Shapeshifter", base: "human", cost: 120, lifestyle: 1, minMagic: 1, attrs: A("4/9 1/4 1/6 5/10 1/6 1/6 1/6 1/6 1/5"),
    priority: { A: [6, 15], B: [4, 15], C: [2, 15] }, traits: ["Keen-Eared", "Shift (Metahuman Form)", "Uneducated", "Movement (x1/x4/+4)", "Initiative +1D6"] },
  ssUrsine: { label: "Shapeshifter (Ursine)", group: "Shapeshifter", base: "human", cost: 160, lifestyle: 1, minMagic: 1, attrs: A("6/11 1/5 1/5 7/12 1/5 1/5 1/6 1/6 1/5"),
    priority: { A: [4, 20], B: [2, 20], C: [0, 20] }, traits: ["Broadened Auditory Spectrum (Ultrasonic)", "Keen-Eared", "Low-Light Vision", "Natural Weapon (Bite: DV (STR+2)P, AP -2; Claws: DV (STR+3)P, AP -1, Reach +1)", "Shift (Metahuman Form)", "Uneducated", "Vomeronasal Organ", "Movement (x1/x3/+2)", "Initiative +1D6"] },
  ssLeonine: { label: "Shapeshifter (Leonine)", group: "Shapeshifter", base: "human", cost: 160, lifestyle: 1, minMagic: 1, attrs: A("3/8 1/6 2/7 4/9 1/5 1/4 2/7 2/7 1/5"),
    priority: { A: [4, 20], B: [2, 20], C: [0, 20] }, traits: ["Balance Receptor", "Broadened Auditory Spectrum (Ultrasonic)", "Low-Light Vision", "Natural Weapon (Bite: DV (STR+1)P, AP -1; Claws: DV (STR+1)P, AP -1, Reach +1)", "Shift (Metahuman Form)", "Uneducated", "Movement (x2/x5/+2)", "Initiative +2D6"] },
  ssPantherine: { label: "Shapeshifter (Pantherine)", group: "Shapeshifter", base: "human", cost: 150, lifestyle: 1, minMagic: 1, attrs: A("2/7 2/7 2/7 1/6 1/6 1/5 3/8 3/8 1/5"),
    priority: { A: [4, 25], B: [2, 25], C: [0, 25] }, traits: ["Balance Receptor", "Broadened Auditory Spectrum (Ultrasonic)", "Low-Light Vision", "Natural Weapon (Bite: DV (STR+2)P, AP -3; Claws: DV (STR+1)P, AP —)", "Shift (Metahuman Form)", "Uneducated", "Movement (x1/x5/+2)", "Initiative +2D6"] },
  ssTigrine: { label: "Shapeshifter (Tigrine)", group: "Shapeshifter", base: "human", cost: 150, lifestyle: 1, minMagic: 1, attrs: A("3/8 2/7 2/7 3/8 1/5 1/4 3/8 2/7 1/5"),
    priority: { A: [4, 25], B: [2, 25], C: [0, 25] }, traits: ["Balance Receptor", "Broadened Auditory Spectrum (Ultrasonic)", "Low-Light Vision", "Natural Weapon (Bite: DV (STR+2)P, AP -2; Claws: DV (STR+1)P, AP -1, Reach +1)", "Shift (Metahuman Form)", "Uneducated", "Movement (x1/x5/+2)", "Initiative +2D6"] }
};

/** Karma cost of raising a rating from `from` to `to` with a per-rank multiplier (SR5 p.107). */
export function advanceCost(from, to, mult) {
  let c = 0;
  for (let r = from + 1; r <= to; r++) c += r * mult;
  return c;
}

export const KARMA_COSTS = {
  attribute: 5, skill: 2, group: 5, knowledge: 1, specialization: 7,
  spell: 5, complexForm: 4, powerPoint: 5, contactPoint: 1
};
