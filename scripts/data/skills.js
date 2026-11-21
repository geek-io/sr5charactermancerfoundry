/**
 * SR5 active skills and skill groups (SR5 p.90), matching the names in the shadowrun5e system's
 * "sr5e-skills" and "sr5e-skill-groups" compendiums so ratings can be written onto the actor's skill items.
 */
export const SKILLS = [
  ["Aeronautics Mechanic", "logic", "Engineering", "mundane"],
  ["Alchemy", "magic", "Enchanting", "magic"],
  ["Animal Handling", "charisma", "", "mundane"],
  ["Arcana", "logic", "", "magic"],
  ["Archery", "agility", "", "mundane"],
  ["Armorer", "logic", "", "mundane"],
  ["Artificing", "magic", "Enchanting", "magic"],
  ["Artisan", "intuition", "", "mundane"],
  ["Assensing", "intuition", "", "magic"],
  ["Astral Combat", "willpower", "", "magic"],
  ["Automatics", "agility", "Firearms", "mundane"],
  ["Automotive Mechanic", "logic", "Engineering", "mundane"],
  ["Banishing", "magic", "Conjuring", "magic"],
  ["Binding", "magic", "Conjuring", "magic"],
  ["Biotechnology", "logic", "Biotech", "mundane"],
  ["Blades", "agility", "Close Combat", "mundane"],
  ["Chemistry", "logic", "", "mundane"],
  ["Clubs", "agility", "Close Combat", "mundane"],
  ["Compiling", "resonance", "Tasking", "resonance"],
  ["Computer", "logic", "Electronics", "mundane"],
  ["Con", "charisma", "Acting", "mundane"],
  ["Counterspelling", "magic", "Sorcery", "magic"],
  ["Cybercombat", "logic", "Cracking", "mundane"],
  ["Cybertechnology", "logic", "Biotech", "mundane"],
  ["Decompiling", "resonance", "Tasking", "resonance"],
  ["Demolitions", "logic", "", "mundane"],
  ["Disenchanting", "magic", "Enchanting", "magic"],
  ["Disguise", "intuition", "Stealth", "mundane"],
  ["Diving", "body", "", "mundane"],
  ["Electronic Warfare", "logic", "Cracking", "mundane"],
  ["Escape Artist", "agility", "", "mundane"],
  ["Etiquette", "charisma", "Influence", "mundane"],
  ["Exotic Melee Weapon", "agility", "", "mundane"],
  ["Exotic Ranged Weapon", "agility", "", "mundane"],
  ["First Aid", "logic", "Biotech", "mundane"],
  ["Flight", "agility", "", "mundane"],
  ["Forgery", "logic", "", "mundane"],
  ["Free-Fall", "body", "", "mundane"],
  ["Gunnery", "agility", "", "mundane"],
  ["Gymnastics", "agility", "Athletics", "mundane"],
  ["Hacking", "logic", "Cracking", "mundane"],
  ["Hardware", "logic", "Electronics", "mundane"],
  ["Heavy Weapons", "agility", "", "mundane"],
  ["Impersonation", "charisma", "Acting", "mundane"],
  ["Industrial Mechanic", "logic", "Engineering", "mundane"],
  ["Instruction", "charisma", "", "mundane"],
  ["Intimidation", "charisma", "", "mundane"],
  ["Leadership", "charisma", "Influence", "mundane"],
  ["Locksmith", "agility", "", "mundane"],
  ["Longarms", "agility", "Firearms", "mundane"],
  ["Medicine", "logic", "Biotech", "mundane"],
  ["Nautical Mechanic", "logic", "Engineering", "mundane"],
  ["Navigation", "intuition", "Outdoors", "mundane"],
  ["Negotiation", "charisma", "Influence", "mundane"],
  ["Palming", "agility", "Stealth", "mundane"],
  ["Perception", "intuition", "", "mundane"],
  ["Performance", "charisma", "Acting", "mundane"],
  ["Pilot Aerospace", "reaction", "", "mundane"],
  ["Pilot Aircraft", "reaction", "", "mundane"],
  ["Pilot Exotic Vehicle", "reaction", "", "mundane"],
  ["Pilot Ground Craft", "reaction", "", "mundane"],
  ["Pilot Walker", "reaction", "", "mundane"],
  ["Pilot Watercraft", "reaction", "", "mundane"],
  ["Pistols", "agility", "Firearms", "mundane"],
  ["Registering", "resonance", "Tasking", "resonance"],
  ["Ritual Spellcasting", "magic", "Sorcery", "magic"],
  ["Running", "strength", "Athletics", "mundane"],
  ["Sneaking", "agility", "Stealth", "mundane"],
  ["Software", "logic", "Electronics", "mundane"],
  ["Spellcasting", "magic", "Sorcery", "magic"],
  ["Summoning", "magic", "Conjuring", "magic"],
  ["Survival", "willpower", "Outdoors", "mundane"],
  ["Swimming", "strength", "Athletics", "mundane"],
  ["Throwing Weapons", "agility", "", "mundane"],
  ["Tracking", "intuition", "Outdoors", "mundane"],
  ["Unarmed Combat", "agility", "Close Combat", "mundane"]
].map(([name, attribute, group, requirement]) => ({ name, attribute, group, requirement }));

export const SKILL_GROUPS = {};
for (const s of SKILLS) {
  if (!s.group) continue;
  (SKILL_GROUPS[s.group] ??= []).push(s.name);
}

export const SKILL_BY_NAME = Object.fromEntries(SKILLS.map(s => [s.name.toLowerCase(), s]));

/** Aliases used by Run Faster text. */
const ALIASES = {
  "computers": "Computer",
  "industrial mechanics": "Industrial Mechanic",
  "piloting ground craft": "Pilot Ground Craft",
  "pilot anthroform": "Pilot Walker",
  "demolition": "Demolitions",
  "free fall": "Free-Fall"
};
const GROUP_ALIASES = { "outdoor": "Outdoors", "engineer": "Engineering", "alchemy": "Enchanting", "spellcasting": "Sorcery" };

export function normalizeSkill(name) {
  const key = String(name).trim().toLowerCase();
  if (ALIASES[key]) return ALIASES[key];
  return SKILL_BY_NAME[key]?.name ?? String(name).trim();
}
export function normalizeGroup(name) {
  const key = String(name).trim().toLowerCase();
  if (GROUP_ALIASES[key]) return GROUP_ALIASES[key];
  return Object.keys(SKILL_GROUPS).find(g => g.toLowerCase() === key) ?? String(name).trim();
}

export const MAGICAL_SKILLS = SKILLS.filter(s => s.requirement === "magic").map(s => s.name);
export const RESONANCE_SKILLS = SKILLS.filter(s => s.requirement === "resonance").map(s => s.name);

export const KNOWLEDGE_TYPES = {
  street: { label: "Street", attribute: "intuition" },
  academic: { label: "Academic", attribute: "logic" },
  professional: { label: "Professional", attribute: "logic" },
  interests: { label: "Interests", attribute: "intuition" }
};
