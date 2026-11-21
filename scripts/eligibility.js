/**
 * Which qualities a character can take right now: prerequisites (Awakened, Emerged, metatype, Changeling/Infected)
 * and what the character can still afford (25 Karma positive / 25 Karma negative limits and remaining Karma).
 * Rules come from the quality texts in SR5, Run Faster, Street Grimoire, Data Trails and Chrome Flesh.
 */
import { arr } from "./engine.js";

const AWAKENING = /^(Adept|Magician|Mystic Adept|Aspected Magician|Technomancer)$/i;

// Qualities that need a Magic attribute (any Awakened character).
const NEEDS_MAGIC = [
  /^Spirit Bane/i, /^Spirit Affinity/i, /^Spirit Whisperer/i, /^Spirit Champion/i, /^Spiritual Lodge/i, /^Spiritual Pilgrim/i,
  /^Mentor Spirit/i, /^Mentor's Mask/i, /^Paragon/i, /^Astral Chameleon/i, /^Astral Beacon/i, /^Astral Hazing/i, /^Dark Ally/i,
  /^Way of Unified Mana/i, /^Planar Entity/i, /^The Burnout's Way/i, /^Witness My Hate/i, /^Arcane Improviser/i,
  /^Arcane Bodyguard/i, /^Conjuring Geas/i, /^Dedicated Conjurer/i, /^Enchanter/i, /^Mystic Foreman/i, /^Mystic Pitcher/i
];
// Qualities only for adepts and mystic adepts.
const NEEDS_ADEPT = [/^Way of the /i, /^Adept Healer/i];
// Spellcasters: magicians, mystic adepts, aspected magicians (and technomancers for Focused Concentration).
const NEEDS_CASTER = [/^Focused Concentration/i, /^Dedicated Spellslinger/i];
// Technomancer-only (Data Trails).
const NEEDS_RESONANCE = [/^Resonant Stream/i, /^Resonant Burnout/i, /^Sprite Affinity/i, /^Sprite Combustion/i, /^Echo Chamber/i];
// Only for characters without Magic / Resonance.
const NEEDS_MUNDANE = [/^Magic Resistance/i];
const NEEDS_NOT_EMERGED = [/^Reverberant/i];
// Changeling (SURGE) qualities need a Changeling quality; Infected powers need an Infected quality.
const NEEDS_CHANGELING = [/\(SURGE\)/i, /^Metagenic/i, /^Metagenetic/i];
const NEEDS_INFECTED = [/^Infected (Advanced )?Optional Power/i];

const METATYPE_LIMITS = [
  [/^Ork Poser/i, ["human", "elf"]],
  [/^Elf Poser/i, ["human"]],
  [/^Human-Looking/i, ["elf", "dwarf", "ork"]],
  [/^Metahuman Traits/i, ["human"]],
  [/^Carromeleg/i, ["elf"]],
  [/^Infected: (Gnawer|Goblin)/i, ["dwarf"]],
  [/^Infected: (Wendigo|Grendel)/i, ["ork"]],
  [/^Infected: (Loup-Garou|Vampire \(Human\))/i, ["human"]],
  [/^Infected: (Harvester|Banshee)/i, ["elf"]],
  [/^Infected: (Dzoo-Noo-Qua|Fomoraig|Mutaqua)/i, ["troll"]],
  [/^Infected: Bandersnatch/i, ["sasquatch"]]
];

/**
 * @param entry catalog entry { name, karma, ... }
 * @param ctx { c: computed build, state }
 * @returns { ok: boolean, reason: string }
 */
export function qualityStatus(entry, { c, state }) {
  const name = entry.name;
  const taken = [...arr(state.qualities).map(q => q.name), ...c.lm.qualities.map(q => q.name)];
  const takenRe = (re) => taken.some(n => re.test(n));
  if (AWAKENING.test(name)) return { ok: false, reason: "Chosen on the Magic step" };
  if (taken.some(n => n.toLowerCase() === name.toLowerCase())) return { ok: false, reason: "Already taken" };

  const aw = state.awakened;
  const special = c.awakened.special;
  if (NEEDS_ADEPT.some(re => re.test(name)) && !["adept", "mysticAdept"].includes(aw)) return { ok: false, reason: "Adepts and mystic adepts only" };
  if (NEEDS_CASTER.some(re => re.test(name)) && !["magician", "mysticAdept", "aspected", "technomancer"].includes(aw)) return { ok: false, reason: "Spellcasters and technomancers only" };
  if (NEEDS_MAGIC.some(re => re.test(name)) && special !== "magic") return { ok: false, reason: "Awakened characters only" };
  if (NEEDS_RESONANCE.some(re => re.test(name)) && special !== "resonance") return { ok: false, reason: "Technomancers only" };
  if (NEEDS_MUNDANE.some(re => re.test(name)) && special !== "mundane") return { ok: false, reason: "Not for Awakened or Emerged characters" };
  if (NEEDS_NOT_EMERGED.some(re => re.test(name)) && special === "resonance") return { ok: false, reason: "Not for technomancers" };
  if (NEEDS_CHANGELING.some(re => re.test(name)) && !takenRe(/^Changeling/i)) return { ok: false, reason: "Needs the Changeling (SURGE) quality" };
  if (NEEDS_INFECTED.some(re => re.test(name)) && !takenRe(/^Infected:/i)) return { ok: false, reason: "Needs an Infected quality" };
  if (/^Infected: Vampire \(Non-Human\)/i.test(name) && c.meta.base === "human") return { ok: false, reason: "Non-human characters only" };
  const meta = state.metatype;
  for (const [re, allowed] of METATYPE_LIMITS) {
    if (re.test(name) && !allowed.includes(c.meta.base) && !allowed.includes(meta)) return { ok: false, reason: `${allowed.map(a => a[0].toUpperCase() + a.slice(1)).join("/")} only` };
  }

  // Affordability
  const k = Number(entry.karma) || 0;
  if (k > 0) {
    const roomPos = 25 - c.posQ;
    if (k > roomPos) return { ok: false, reason: `Over the 25 Karma positive limit (${roomPos} left)` };
    if (k > c.karma.left) return { ok: false, reason: `Costs ${k} Karma, ${c.karma.left} left` };
  } else if (k < 0) {
    const roomNeg = 25 - c.negQ;
    if (-k > roomNeg) return { ok: false, reason: `Over the 25 Karma negative limit (${Math.max(0, roomNeg)} left)` };
  }
  return { ok: true, reason: "" };
}
