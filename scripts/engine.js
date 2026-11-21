import {
  ATTRS, PHYSICAL, MENTAL, PRIORITY, GAME_LEVELS, METHODS, METATYPES, MAGIC_PRIORITY, AWAKENED_TYPES,
  SUM_TO_TEN_COST, COLUMNS, LEVELS, KARMA_START, NUYEN_PER_KARMA, POINT_BUY_MAX_GEAR_KARMA, MAX_CARRY_KARMA,
  MAX_CARRY_NUYEN, QUALITY_LIMIT, LIFESTYLES, GRADES, advanceCost, KARMA_COSTS, ATTR_LABEL
} from "./data/rules.js";
import { LIFE_MODULES, LIFE_MODULE_STAGES, findModule } from "./data/life-modules.js";
import { SKILLS, SKILL_GROUPS, SKILL_BY_NAME, normalizeSkill, normalizeGroup, MAGICAL_SKILLS, RESONANCE_SKILLS } from "./data/skills.js";

export const STATE_VERSION = 1;

export function defaultState() {
  const attrs = {};
  for (const a of [...ATTRS, "edge", "magic", "resonance"]) attrs[a] = { pts: 0, karma: 0 };
  return {
    version: STATE_VERSION,
    step: "concept",
    name: "", concept: "", img: "", notes: "",
    method: "priority", level: "standard",
    priorities: { metatype: "", attributes: "", magic: "", skills: "", resources: "" },
    metatype: "human",
    awakened: "mundane", tradition: "hermetic", customDrain: "logic",
    magicFree: { skills: ["", ""], group: "" },
    special: { edge: 0, magic: 0, resonance: 0 },
    attrs,
    exceptional: "",
    lifeModules: { nationality: [], formative: [], teen: [], education: [], realLife: [] },
    qualities: [],
    skills: {},
    groups: {},
    knowledge: [],
    languages: [],
    magicItems: [],
    powerPoints: 0,
    nuyenKarma: 0,
    gear: [],
    lifestyle: { type: "street", months: 1, name: "" },
    contacts: [],
    startingNuyen: null
  };
}

/** Merge a saved draft over the defaults so new fields always exist. */
export function migrateState(saved) {
  const base = defaultState();
  if (!saved || typeof saved !== "object") return base;
  const merged = foundry.utils.mergeObject(base, saved, { inplace: false, insertKeys: true, insertValues: true, overwrite: true });
  merged.version = STATE_VERSION;
  return merged;
}

const isPriorityMethod = (m) => m === "priority" || m === "sumToTen";

/** Values written through form paths may arrive as objects keyed "0","1"…; normalize to arrays. */
export function arr(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") return Object.keys(v).sort((a, b) => Number(a) - Number(b)).map(k => v[k]);
  return [];
}

/* ------------------------------------------------------------------ Grants parser (life modules) */

const ATTR_KEYS = new Set(ATTRS);

/** Parse a grant string into operations. */
export function parseGrants(str) {
  if (!str) return [];
  return str.split(";").map(s => s.trim()).filter(Boolean).map(tok => {
    let m;
    if ((m = tok.match(/^Q:(.+?)\s+(-?\d+)$/))) return { op: "quality", name: m[1].trim(), karma: Number(m[2]) };
    if ((m = tok.match(/^S:([^:]+):(.+)$/))) return { op: "spec", skill: normalizeSkill(m[1]), name: m[2].trim() };
    if ((m = tok.match(/^G:(.+?)\s+\+?(\d+)$/))) return { op: "group", name: normalizeGroup(m[1]), n: Number(m[2]) };
    if ((m = tok.match(/^K:(\w+):(.+?)\s+\+?(\d+)$/))) return { op: "knowledge", type: m[1], name: m[2].trim(), n: Number(m[3]) };
    if ((m = tok.match(/^L:(.+?)\s+N$/))) return { op: "language", name: m[1].trim(), native: true, n: 0 };
    if ((m = tok.match(/^L:(.+?)\s+\+?(\d+)$/))) return { op: "language", name: m[1].trim(), n: Number(m[2]) };
    if ((m = tok.match(/^([A-Za-z]+)\s+\+(\d+)$/)) && ATTR_KEYS.has(m[1].toLowerCase())) return { op: "attr", attr: m[1].toLowerCase(), n: Number(m[2]) };
    if ((m = tok.match(/^(.+?)\s+\+?(\d+)$/))) return { op: "skill", name: normalizeSkill(m[1]), n: Number(m[2]) };
    return { op: "note", text: tok };
  });
}

/** All grant operations of a life module instance (universal + chosen option), with stable indexes for placeholder fills. */
export function instanceGrants(stage, inst) {
  const def = findModule(stage, inst.id);
  if (!def) return [];
  const ops = parseGrants(def.grants);
  const opt = def.options?.list.find(o => o.id === inst.option);
  if (opt) ops.push(...parseGrants(opt.grants));
  return ops.map((op, i) => ({ ...op, index: i }));
}

/** Flattened choice slots (module, option, and the selected variant's sub-choices). */
export function instanceChoiceSlots(stage, inst) {
  const def = findModule(stage, inst.id);
  if (!def) return [];
  const slots = [];
  (def.choices ?? []).forEach((c, i) => slots.push({ key: `m${i}`, def: c }));
  const opt = def.options?.list.find(o => o.id === inst.option);
  (opt?.choices ?? []).forEach((c, i) => slots.push({ key: `o${i}`, def: c }));
  for (const s of [...slots]) {
    if (s.def.type !== "variant") continue;
    const sel = typeof inst.choices?.[s.key] === "string" ? inst.choices[s.key] : "";
    const v = s.def.options.find(o => o.label === sel);
    // Sub-choice keys must not contain "." (they are used in form paths).
    (v?.choices ?? []).forEach((c, j) => slots.push({ key: `${s.key}v${j}`, def: c }));
  }
  return slots;
}

/**
 * Apply all chosen life modules in order and return the resulting bonuses.
 * Group/skill interplay follows Run Faster p.65: raising a skill inside an intact group breaks the group;
 * raising a broken group adds one rank to each of its skills. Active skills cap at 7, knowledge at 9.
 */
export function lifeModuleResult(state) {
  const res = { attrs: {}, skills: {}, groups: {}, broken: new Set(), specs: [], knowledge: [], languages: [], qualities: [], karma: 0, entries: [], warnings: [] };
  if (state.method !== "lifeModules") return res;
  const addSkill = (name, n) => {
    const def = SKILL_BY_NAME[name.toLowerCase()];
    const g = def?.group;
    if (g && (res.groups[g] ?? 0) > 0 && !res.broken.has(g)) {
      const gr = res.groups[g];
      for (const s of SKILL_GROUPS[g]) res.skills[s] = (res.skills[s] ?? 0) + gr;
      res.groups[g] = 0;
      res.broken.add(g);
    }
    if (g && res.broken.has(g) === false && (res.groups[g] ?? 0) === 0) {
      // skill raised individually with no group yet: later group raises must go per skill
      res.broken.add(g);
    }
    res.skills[name] = Math.min(7, (res.skills[name] ?? 0) + n);
  };
  const addGroup = (g, n) => {
    if (!SKILL_GROUPS[g]) { res.warnings.push(`Unknown skill group "${g}".`); return; }
    if (res.broken.has(g)) {
      for (const s of SKILL_GROUPS[g]) res.skills[s] = Math.min(7, (res.skills[s] ?? 0) + 1 * n);
    } else {
      res.groups[g] = Math.min(7, (res.groups[g] ?? 0) + n);
    }
  };
  const addKnowledge = (type, name, n) => {
    const key = `${type}|${name.toLowerCase()}`;
    const ex = res.knowledge.find(k => `${k.type}|${k.name.toLowerCase()}` === key);
    if (ex) ex.rating = Math.min(9, ex.rating + n);
    else res.knowledge.push({ type, name, rating: Math.min(9, n) });
  };
  const addLanguage = (name, n, native = false) => {
    const ex = res.languages.find(l => l.name.toLowerCase() === name.toLowerCase());
    if (ex) { ex.rating = Math.min(9, ex.rating + n); ex.native ||= native; }
    else res.languages.push({ name, rating: Math.min(9, n), native });
  };
  const addQuality = (name, karma, source) => {
    if (/^SINner/i.test(name)) {
      const prev = res.qualities.find(q => /^SINner/i.test(q.name));
      if (prev) {
        if (Math.abs(karma) > Math.abs(prev.karma)) { prev.name = name; prev.karma = karma; prev.source = source; }
        return;
      }
    }
    if (res.qualities.some(q => q.name.toLowerCase() === name.toLowerCase())) return;
    res.qualities.push({ name, karma, source });
  };

  for (const stage of LIFE_MODULE_STAGES) {
    for (const inst of arr(state.lifeModules[stage.key])) {
      const def = findModule(stage.key, inst.id);
      if (!def) continue;
      res.karma += def.karma;
      const opt = def.options?.list.find(o => o.id === inst.option);
      res.entries.push(`${stage.label}: ${def.name}${opt ? ` (${opt.name})` : ""}`);
      if (def.options && !opt) res.warnings.push(`${def.name}: choose a ${def.options.label.toLowerCase()}.`);
      const fills = inst.fills ?? {};
      for (const op of instanceGrants(stage.key, inst)) {
        const filled = (nm) => (nm.includes("[") ? (fills[op.index]?.trim() || nm) : nm);
        switch (op.op) {
          case "attr": res.attrs[op.attr] = (res.attrs[op.attr] ?? 0) + op.n; break;
          case "skill": addSkill(op.name, op.n); break;
          case "group": addGroup(op.name, op.n); break;
          case "spec": res.specs.push({ skill: op.skill, name: op.name }); break;
          case "knowledge": addKnowledge(op.type, filled(op.name), op.n); break;
          case "language": addLanguage(filled(op.name), op.n, op.native); break;
          case "quality": addQuality(op.name, op.karma, def.name); break;
        }
      }
      // NAN region languages
      if (def.regionLanguages && opt) {
        if (inst.native) addLanguage(inst.native, 0, true); else res.warnings.push(`${def.name}: choose a native language.`);
        if (inst.secondary) addLanguage(inst.secondary, 1);
      }
      // choices
      for (const slot of instanceChoiceSlots(stage.key, inst)) {
        const c = slot.def; const v = inst.choices?.[slot.key];
        switch (c.type) {
          case "attrPick": {
            const picks = arr(v).filter(Boolean);
            if (new Set(picks).size < c.count) res.warnings.push(`${def.name}: ${c.label} (pick ${c.count} different attributes).`);
            for (const a of new Set(picks)) res.attrs[a] = (res.attrs[a] ?? 0) + c.bonus;
            break;
          }
          case "skillPick": {
            const picks = arr(v).filter(Boolean);
            if (new Set(picks).size < c.count) res.warnings.push(`${def.name}: ${c.label}.`);
            for (const s of new Set(picks)) addSkill(normalizeSkill(s), c.bonus);
            break;
          }
          case "groupPick": {
            const picks = arr(v).filter(Boolean);
            if (new Set(picks).size < c.count) res.warnings.push(`${def.name}: ${c.label}.`);
            for (const g of new Set(picks)) addGroup(normalizeGroup(g), c.bonus);
            break;
          }
          case "languagePick":
            if (v) addLanguage(v, c.rating); else res.warnings.push(`${def.name}: ${c.label}.`);
            break;
          case "skillPoints": {
            const rows = arr(v);
            let total = 0;
            for (const r of rows) {
              const n = Math.min(c.maxEach, Math.max(0, Number(r?.n) || 0));
              if (!r?.skill || !n) continue;
              total += n; addSkill(normalizeSkill(r.skill), n);
            }
            if (total !== c.points) res.warnings.push(`${def.name}: ${c.label} — ${total}/${c.points} points assigned.`);
            break;
          }
          case "knowledgePoints": {
            const rows = arr(v).filter(r => r?.name && Number(r?.n) > 0);
            let total = 0;
            for (const r of rows) { const n = Math.min(c.maxEach, Number(r.n)); total += n; addKnowledge(c.type2 ?? "academic", r.name, n); }
            if (total !== c.points) res.warnings.push(`${def.name}: ${c.label} — ${total}/${c.points} points assigned.`);
            if (rows.length < (c.minCount ?? 1)) res.warnings.push(`${def.name}: spread among at least ${c.minCount} subjects.`);
            if (rows.some(r => Number(r.n) < (c.minEach ?? 1))) res.warnings.push(`${def.name}: each subject needs at least ${c.minEach} ranks.`);
            break;
          }
          case "variant":
            if (!v) res.warnings.push(`${def.name}: choose ${c.label.toLowerCase()}.`);
            break;
        }
      }
    }
  }
  return res;
}

/* ------------------------------------------------------------------ Validation of life-module ordering */

function lifeModuleRuleWarnings(state, out) {
  const lm = state.lifeModules;
  const taken = new Set();
  for (const st of LIFE_MODULE_STAGES) for (const i of arr(lm[st.key])) {
    taken.add(`${st.key}:${i.id}`);
    if (i.option) taken.add(`${st.key}:${i.id}:${i.option}`);
  }
  for (const st of LIFE_MODULE_STAGES) {
    const list = arr(lm[st.key]);
    if (list.length < st.min) out.errors.push(`Life Modules: choose a ${st.label} module.`);
    const ids = list.map(i => i.id);
    if (new Set(ids).size !== ids.length) out.errors.push(`Life Modules: the same ${st.label} module cannot be taken twice.`);
    list.forEach((inst, idx) => {
      const def = findModule(st.key, inst.id);
      if (!def) return;
      for (const ex of def.excludes ?? []) if (taken.has(ex)) out.errors.push(`${def.name} cannot be taken with ${ex.split(":")[1]}.`);
      if (def.requiresStage && !arr(lm[def.requiresStage]).length) out.errors.push(`${def.name} requires a ${def.requiresStage === "education" ? "Further Education" : def.requiresStage} module.`);
      if (def.requiresAny) {
        const earlier = new Set();
        for (const s2 of LIFE_MODULE_STAGES) {
          const l2 = arr(lm[s2.key]);
          const lim = s2.key === st.key ? idx : l2.length;
          for (let k = 0; k < lim; k++) { earlier.add(`${s2.key}:${l2[k].id}`); if (l2[k].option) earlier.add(`${s2.key}:${l2[k].id}:${l2[k].option}`); }
        }
        if (!def.requiresAny.some(r => earlier.has(r))) out.errors.push(`${def.name} requires an earlier qualifying module (see Run Faster p.${def.page}).`);
      }
      const opt = def.options?.list.find(o => o.id === inst.option);
      if (opt?.requiresAny && !opt.requiresAny.some(r => taken.has(r))) out.errors.push(`${def.name} — ${opt.name} requires the Nurse or Medicine education module.`);
      if (def.awakenedOnly && (state.awakened === "mundane" || state.awakened === "technomancer")) out.errors.push(`${def.name} requires an Awakened character (buy Adept, Aspected Magician, Magician or Mystic Adept).`);
    });
  }
  if (arr(lm.education).some(i => i.id === "militaryAcademy") && !arr(lm.realLife).some(i => i.id.startsWith("tour"))) out.warnings.push("Military Academy: you must take a Tour of Duty module next.");
}

/* ------------------------------------------------------------------ Main computation */

export function compute(state) {
  const out = { errors: [], warnings: [], info: [] };
  const method = state.method;
  const level = GAME_LEVELS[state.level] ?? GAME_LEVELS.standard;
  const meta = METATYPES[state.metatype] ?? METATYPES.human;
  const pri = state.priorities;
  const prio = isPriorityMethod(method);
  out.method = method; out.level = level; out.meta = meta; out.isPriority = prio;

  /* ---- priorities */
  if (prio) {
    const used = COLUMNS.map(c => pri[c]).filter(Boolean);
    if (used.length < COLUMNS.length) out.errors.push("Assign a priority to every column.");
    if (method === "priority" && new Set(used).size !== used.length) out.errors.push("Each priority level (A–E) can be used only once.");
    out.sumToTen = used.reduce((s, l) => s + (SUM_TO_TEN_COST[l] ?? 0), 0);
    if (method === "sumToTen") {
      if (out.sumToTen > 10) out.errors.push(`Sum to Ten: ${out.sumToTen}/10 priority points spent.`);
      else if (out.sumToTen < 10) out.warnings.push(`Sum to Ten: only ${out.sumToTen}/10 priority points spent.`);
    }
  }

  /* ---- metatype */
  let specialPts = 0, metaKarma = 0;
  if (prio) {
    const row = meta.priority[pri.metatype];
    if (pri.metatype && !row) out.errors.push(`${meta.label} is not available at Metatype priority ${pri.metatype}.`);
    specialPts = row?.[0] ?? 0;
    metaKarma = row?.[1] ?? 0;
  } else {
    metaKarma = meta.cost;
  }
  out.specialPts = specialPts; out.metaKarma = metaKarma;

  /* ---- life modules */
  const lm = lifeModuleResult(state);
  out.lm = lm;
  if (method === "lifeModules") { lifeModuleRuleWarnings(state, out); out.warnings.push(...lm.warnings); }

  /* ---- qualities */
  const has = (re) => arr(state.qualities).some(q => re.test(q.name)) || lm.qualities.some(q => re.test(q.name));
  out.hasAptitude = has(/^Aptitude/i);
  out.hasLucky = has(/^Lucky/i);
  out.hasExceptional = has(/^Exceptional Attribute/i);

  /* ---- awakened */
  const aw = AWAKENED_TYPES[state.awakened] ?? AWAKENED_TYPES.mundane;
  out.awakened = aw;
  let magicBase = 0, resBase = 0, magicRow = null, awKarma = 0;
  if (prio) {
    magicRow = state.awakened !== "mundane" ? MAGIC_PRIORITY[pri.magic]?.[state.awakened] : null;
    if (state.awakened !== "mundane" && pri.magic && !magicRow) out.errors.push(`${aw.label} is not available at Magic/Resonance priority ${pri.magic}.`);
    if (aw.special === "magic") magicBase = magicRow?.rating ?? 0;
    if (aw.special === "resonance") resBase = magicRow?.rating ?? 0;
  } else if (state.awakened !== "mundane") {
    awKarma = aw.karma;
    if (aw.special === "magic") magicBase = 1;
    if (aw.special === "resonance") resBase = 1;
  }
  out.magicRow = magicRow; out.awKarma = awKarma;
  if (meta.minMagic && aw.special !== "magic") out.warnings.push(`${meta.label} characters are Awakened (Magic ${meta.minMagic}+) per Run Faster p.105; choose a magical type or confirm with your gamemaster.`);

  /* ---- attributes */
  const attrPts = prio ? (PRIORITY.attributes[pri.attributes] ?? 0) : 0;
  const attrs = {};
  let attrPtsUsed = 0, attrKarma = 0, atMax = [];
  for (const a of ATTRS) {
    const lim = meta.attrs[a];
    const max = lim.max + (out.hasExceptional && state.exceptional === a ? 1 : 0);
    const bonus = Math.min(lm.attrs[a] ?? 0, Math.max(0, lim.max - lim.min));
    const s = state.attrs[a] ?? { pts: 0, karma: 0 };
    const pts = prio ? Math.max(0, Number(s.pts) || 0) : 0;
    const before = lim.min + bonus + pts;
    const value = before + Math.max(0, Number(s.karma) || 0);
    const kc = advanceCost(before, value, KARMA_COSTS.attribute);
    attrPtsUsed += pts; attrKarma += kc;
    if (value > max) out.errors.push(`${ATTR_LABEL[a]} ${value} exceeds the ${meta.label} maximum of ${max}.`);
    if (value >= lim.max) atMax.push(a);
    attrs[a] = { key: a, label: ATTR_LABEL[a], min: lim.min, max, bonus, pts, karma: Number(s.karma) || 0, value, karmaCost: kc };
  }
  if (prio && attrPtsUsed !== attrPts) (attrPtsUsed > attrPts ? out.errors : out.warnings).push(`Attribute points: ${attrPtsUsed}/${attrPts} spent (all must be spent).`);
  if (atMax.length > 1) out.errors.push(`Only one physical or mental attribute may be at its natural maximum at creation (${atMax.map(a => ATTR_LABEL[a]).join(", ")}).`);
  if (out.hasExceptional && !state.exceptional) out.warnings.push("Exceptional Attribute: choose which attribute it applies to.");

  /* ---- special attributes */
  const special = {};
  let specialUsed = 0, specialKarma = 0;
  const specDefs = {
    edge: { min: meta.attrs.edge.min, max: meta.attrs.edge.max + (out.hasLucky ? 1 : 0), base: meta.attrs.edge.min, active: true },
    magic: { min: 0, max: 6 + (out.hasExceptional && state.exceptional === "magic" ? 1 : 0), base: magicBase, active: aw.special === "magic" },
    resonance: { min: 0, max: 6 + (out.hasExceptional && state.exceptional === "resonance" ? 1 : 0), base: resBase, active: aw.special === "resonance" }
  };
  for (const [k, d] of Object.entries(specDefs)) {
    const s = state.attrs[k] ?? { pts: 0, karma: 0 };
    const pts = prio && d.active ? Math.max(0, Number(state.special?.[k]) || 0) : 0;
    const karma = d.active ? Math.max(0, Number(s.karma) || 0) : 0;
    const before = d.base + pts;
    const value = d.active ? before + karma : 0;
    const kc = advanceCost(before, value, KARMA_COSTS.attribute);
    specialUsed += pts; specialKarma += kc;
    if (d.active && value > d.max) out.errors.push(`${ATTR_LABEL[k]} ${value} exceeds the maximum of ${d.max}.`);
    special[k] = { key: k, label: ATTR_LABEL[k], min: d.min, max: d.max, base: d.base, pts, karma, value, karmaCost: kc, active: d.active };
  }
  if (prio && specialUsed > specialPts) out.errors.push(`Special attribute points: ${specialUsed}/${specialPts} spent.`);
  else if (prio && specialUsed < specialPts) out.warnings.push(`Special attribute points: ${specialUsed}/${specialPts} spent (unspent points are lost).`);
  out.attrs = attrs; out.special = special; out.attrPts = attrPts; out.attrPtsUsed = attrPtsUsed; out.specialUsed = specialUsed;
  if (out.hasLucky && out.hasExceptional) out.errors.push("You may take Lucky or Exceptional Attribute, but not both (SR5 p.66).");

  /* ---- skills */
  const [skillPts, groupPts] = prio ? (PRIORITY.skills[pri.skills] ?? [0, 0]) : [0, 0];
  const maxSkill = 6 + (out.hasAptitude ? 1 : 0);
  // free skills from Magic priority
  const freeSkills = {}; let freeGroup = null;
  if (magicRow?.skills) {
    for (const nm of arr(state.magicFree.skills).slice(0, magicRow.skills.count)) if (nm) freeSkills[nm] = magicRow.skills.rating;
    const chosen = arr(state.magicFree.skills).slice(0, magicRow.skills.count).filter(Boolean);
    if (chosen.length < magicRow.skills.count) out.warnings.push(`Choose ${magicRow.skills.count} free skill(s) at rating ${magicRow.skills.rating} from your Magic/Resonance priority.`);
    if (new Set(chosen).size !== chosen.length) out.errors.push("Free Magic/Resonance skills must be different skills.");
  }
  if (magicRow?.group) {
    if (state.magicFree.group) freeGroup = { name: state.magicFree.group, rating: magicRow.group.rating };
    else out.warnings.push(`Choose your aspected magical skill group (rating ${magicRow.group.rating}).`);
  }
  let skillPtsUsed = 0, groupPtsUsed = 0, skillKarma = 0, groupKarma = 0, specKarma = 0, specPts = 0;
  const groups = {};
  for (const g of Object.keys(SKILL_GROUPS)) {
    const s = state.groups[g] ?? { pts: 0, karma: 0 };
    const base = (lm.groups[g] ?? 0) + (freeGroup?.name === g ? freeGroup.rating : 0);
    const pts = prio ? Math.max(0, Number(s.pts) || 0) : 0;
    const before = base + pts;
    const value = before + Math.max(0, Number(s.karma) || 0);
    const kc = advanceCost(before, value, KARMA_COSTS.group);
    groupPtsUsed += pts; groupKarma += kc;
    groups[g] = { name: g, base, pts, karma: Number(s.karma) || 0, value, karmaCost: kc, skills: SKILL_GROUPS[g], broken: false };
    if (value > 6) out.errors.push(`Skill group ${g} ${value} exceeds 6.`);
  }
  const skills = {};
  const specMap = new Map();
  for (const sp of lm.specs) specMap.set(sp.skill, { name: sp.name, free: true });
  for (const sk of SKILLS) {
    const s = state.skills[sk.name] ?? { pts: 0, karma: 0, spec: "" };
    const base = (lm.skills[sk.name] ?? 0) + (freeSkills[sk.name] ?? 0);
    const pts = prio ? Math.max(0, Number(s.pts) || 0) : 0;
    const before = base + pts;
    const own = before + Math.max(0, Number(s.karma) || 0);
    const kc = advanceCost(before, own, KARMA_COSTS.skill);
    skillPtsUsed += pts; skillKarma += kc;
    const grp = sk.group ? groups[sk.group] : null;
    const groupVal = grp?.value ?? 0;
    const value = own + groupVal;
    if (grp && groupVal > 0 && own > 0) grp.broken = true;
    let spec = String(s.spec ?? "").trim() ? { name: String(s.spec).trim(), free: false, via: s.specVia ?? (prio ? "points" : "karma") } : null;
    const lmSpec = specMap.get(sk.name);
    if (!spec && lmSpec) spec = { name: lmSpec.name, free: true, via: "module" };
    if (spec && !spec.free) {
      if (spec.via === "points" && prio) specPts += 1; else specKarma += KARMA_COSTS.specialization;
    }
    if (spec && value === 0) out.warnings.push(`${sk.name}: a specialization needs at least rating 1 in the skill.`);
    const cap = method === "lifeModules" ? 7 : maxSkill;
    if (value > cap) out.errors.push(`${sk.name} ${value} exceeds the creation maximum of ${cap}.`);
    if (method !== "lifeModules" && value > 6 && !out.hasAptitude) out.errors.push(`${sk.name}: rating 7 requires the Aptitude quality.`);
    if (sk.requirement === "magic" && value > 0 && aw.special !== "magic") out.errors.push(`${sk.name} requires an Awakened character.`);
    if (sk.requirement === "resonance" && value > 0 && aw.special !== "resonance") out.errors.push(`${sk.name} requires a Technomancer.`);
    skills[sk.name] = { ...sk, base, pts, karma: Number(s.karma) || 0, own, groupVal, value, karmaCost: kc, spec, specText: s.spec ?? "", specVia: s.specVia ?? (prio ? "points" : "karma") };
  }
  for (const g of Object.values(groups)) if (g.broken) out.warnings.push(`Skill group ${g.name} is broken (a member skill was raised individually); its skills will be written individually.`);
  // Aspected restriction
  if (state.awakened === "aspected") {
    const allowed = freeGroup?.name ?? null;
    if (allowed) {
      for (const g of ["Sorcery", "Conjuring", "Enchanting"]) if (g !== allowed && (groups[g].value > 0 || SKILL_GROUPS[g].some(s => skills[s].own > 0)))
        out.errors.push(`Aspected magicians (${allowed}) cannot take skills from the ${g} group.`);
    }
  }
  if (state.awakened === "adept") {
    for (const g of ["Sorcery", "Conjuring", "Enchanting"]) if (groups[g].value > 0 || SKILL_GROUPS[g].some(s => skills[s].value > 0))
      out.errors.push(`Adepts cannot use skills from the ${g} group.`);
  }
  if (prio) {
    if (skillPtsUsed + specPts > skillPts) out.errors.push(`Skill points: ${skillPtsUsed + specPts}/${skillPts} spent.`);
    else if (skillPtsUsed + specPts < skillPts) out.warnings.push(`Skill points: ${skillPtsUsed + specPts}/${skillPts} spent.`);
    if (groupPtsUsed > groupPts) out.errors.push(`Skill group points: ${groupPtsUsed}/${groupPts} spent.`);
    else if (groupPtsUsed < groupPts) out.warnings.push(`Skill group points: ${groupPtsUsed}/${groupPts} spent.`);
  }
  out.skills = skills; out.groups = groups; out.skillPts = skillPts; out.groupPts = groupPts;
  out.skillPtsUsed = skillPtsUsed + specPts; out.groupPtsUsed = groupPtsUsed;

  /* ---- knowledge & languages (free points = (INT + LOG) x 2) */
  const freeKnow = (attrs.intuition.value + attrs.logic.value) * 2;
  let knowPts = 0, knowKarma = 0;
  const knowledge = [];
  const lmKnow = lm.knowledge.map(k => ({ ...k, fromModule: true }));
  const lmLang = lm.languages.map(l => ({ ...l, fromModule: true }));
  const rowCost = (row, base) => {
    const pts = Math.max(0, Number(row.pts) || 0);
    const kar = Math.max(0, Number(row.karma) || 0);
    const before = base + pts;
    const value = before + kar;
    knowPts += pts;
    const kc = advanceCost(before, value, KARMA_COSTS.knowledge);
    knowKarma += kc;
    return { pts, karma: kar, value, karmaCost: kc };
  };
  arr(state.knowledge).forEach((k, i) => {
    const mod = lmKnow.find(m => m.type === k.type && m.name.toLowerCase() === (k.name ?? "").toLowerCase());
    const base = mod?.rating ?? 0;
    knowledge.push({ ...k, index: i, base, ...rowCost(k, base) });
  });
  for (const m of lmKnow) if (!arr(state.knowledge).some(k => k.type === m.type && (k.name ?? "").toLowerCase() === m.name.toLowerCase()))
    knowledge.push({ name: m.name, type: m.type, index: -1, base: m.rating, pts: 0, karma: 0, value: m.rating, karmaCost: 0, fromModule: true });
  const languages = [];
  arr(state.languages).forEach((l, i) => {
    const mod = lmLang.find(m => m.name.toLowerCase() === (l.name ?? "").toLowerCase());
    const base = mod?.rating ?? 0;
    const native = l.native || mod?.native;
    if (native) { languages.push({ ...l, index: i, base, pts: 0, karma: 0, value: 0, native: true, karmaCost: 0 }); return; }
    languages.push({ ...l, index: i, base, native: false, ...rowCost(l, base) });
  });
  for (const m of lmLang) if (!arr(state.languages).some(l => (l.name ?? "").toLowerCase() === m.name.toLowerCase()))
    languages.push({ name: m.name, index: -1, base: m.rating, native: m.native, pts: 0, karma: 0, value: m.native ? 0 : m.rating, karmaCost: 0, fromModule: true });
  const natives = languages.filter(l => l.native);
  if (!natives.length) out.warnings.push("Choose a native language (free).");
  if (natives.length > 1 && !has(/^Bilingual/i)) out.errors.push("Only one native language without the Bilingual quality.");
  if (knowPts > freeKnow) out.errors.push(`Free knowledge points: ${knowPts}/${freeKnow} spent (use Karma for more).`);
  for (const k of [...knowledge, ...languages]) {
    if (!k.native && k.value > (method === "lifeModules" ? 9 : maxSkill)) out.errors.push(`Knowledge/language "${k.name}" ${k.value} exceeds the maximum.`);
    if ((k.name ?? "").includes("[")) out.warnings.push(`Name the knowledge skill "${k.name}".`);
  }
  out.knowledge = knowledge; out.languages = languages; out.freeKnow = freeKnow; out.knowPts = knowPts;

  /* ---- qualities */
  let posQ = 0, negQ = 0;
  for (const q of arr(state.qualities)) {
    const k = Number(q.karma) || 0;
    if (k >= 0) posQ += k; else negQ += -k;
  }
  let lmNeg = 0, lmPos = 0;
  for (const q of lm.qualities) { if (q.karma < 0) lmNeg += -q.karma; else lmPos += q.karma; }
  // Qualities granted by Life Modules are paid for by the module and do not count against the 25 Karma limits.
  if (posQ > QUALITY_LIMIT) out.errors.push(`Positive qualities total ${posQ} Karma (maximum ${QUALITY_LIMIT}).`);
  if (negQ > QUALITY_LIMIT) out.errors.push(`Negative qualities total ${negQ} Karma (maximum ${QUALITY_LIMIT}).`);
  for (const q of arr(state.qualities)) if (/^(Adept|Magician|Mystic Adept|Aspected Magician|Technomancer)$/i.test(q.name)) out.warnings.push(`"${q.name}" is set on the Magic step; remove it from the qualities list to avoid paying twice.`);
  out.posQ = posQ; out.negQ = negQ; out.lmPos = lmPos; out.lmNeg = lmNeg;
  const qualityKarma = posQ - negQ;

  /* ---- magic purchases */
  const magicVal = special.magic.value;
  const freeSpells = magicRow?.spells ?? 0;
  const freeForms = magicRow?.forms ?? 0;
  const spellsTaken = arr(state.magicItems).filter(i => ["spell", "ritual"].includes(i.type) || i.type === "preparation").length;
  const formsTaken = arr(state.magicItems).filter(i => i.type === "complex_form").length;
  const spellKarma = Math.max(0, spellsTaken - freeSpells) * KARMA_COSTS.spell;
  const formKarma = Math.max(0, formsTaken - freeForms) * KARMA_COSTS.complexForm;
  const formulaMax = magicVal * 2;
  for (const t of ["spell", "ritual"]) {
    const n = arr(state.magicItems).filter(i => i.type === t).length;
    if (n && (state.awakened === "adept" || aw.special !== "magic")) out.errors.push(`Only magicians, aspected magicians and mystic adepts can know ${t}s.`);
    else if (n > formulaMax) out.errors.push(`${n} ${t}s exceeds Magic x 2 (${formulaMax}).`);
  }
  if (formsTaken && aw.special !== "resonance") out.errors.push("Only technomancers can learn complex forms.");
  if (formsTaken > special.resonance.value * 2 && aw.special === "resonance") out.warnings.push(`${formsTaken} complex forms exceeds Logic limit guidance; check SR5 p.252.`);
  // power points
  let ppAvail = 0, ppKarma = 0;
  if (state.awakened === "adept") ppAvail = magicVal;
  if (state.awakened === "mysticAdept") {
    const bought = Math.max(0, Number(state.powerPoints) || 0);
    if (bought > magicVal) out.errors.push(`Mystic adepts may buy at most Magic (${magicVal}) power points.`);
    ppAvail = bought; ppKarma = bought * KARMA_COSTS.powerPoint;
  }
  const ppUsed = arr(state.magicItems).filter(i => i.type === "adept_power").reduce((s, i) => s + (Number(i.pp) || 0) * Math.max(1, Number(i.level) || 1), 0);
  if (ppUsed > ppAvail) out.errors.push(`Adept powers cost ${ppUsed} PP but only ${ppAvail} available.`);
  if (ppUsed && !["adept", "mysticAdept"].includes(state.awakened)) out.errors.push("Only adepts and mystic adepts can take adept powers.");
  out.magic = { freeSpells, freeForms, spellsTaken, formsTaken, spellKarma, formKarma, ppAvail, ppUsed, ppKarma, formulaMax };

  /* ---- resources */
  const maxNK = prio ? level.nuyenKarma : POINT_BUY_MAX_GEAR_KARMA;
  const nk = Math.max(0, Number(state.nuyenKarma) || 0);
  if (nk > maxNK) out.errors.push(`At most ${maxNK} Karma can be converted to nuyen.`);
  const nuyenStart = (prio ? (level.resources[pri.resources] ?? 0) : 0) + nk * NUYEN_PER_KARMA;
  let essenceLoss = 0, gearCost = 0;
  const gear = arr(state.gear).map((g, i) => {
    const grade = GRADES[g.grade] ?? GRADES.standard;
    const isWare = ["cyberware", "bioware"].includes(g.type);
    const qty = Math.max(1, Number(g.qty) || 1);
    const cost = (Number(g.cost) || 0) * (isWare ? grade.cost : 1) * qty;
    const ess = isWare ? (Number(g.essence) || 0) * grade.essence * qty : 0;
    const availNum = parseInt(String(g.avail ?? "").replace(/[^\d-]/g, ""), 10);
    const avail = Number.isFinite(availNum) ? availNum + (isWare ? grade.avail : 0) : null;
    gearCost += cost; essenceLoss += ess;
    if (avail !== null && avail > level.avail) out.errors.push(`${g.name}: Availability ${avail} exceeds ${level.avail}.`);
    if ((Number(g.rating) || 0) > level.deviceRating && ["device"].includes(g.type)) out.errors.push(`${g.name}: device rating above ${level.deviceRating}.`);
    if (["delta", "used"].includes(g.grade) && g.grade === "delta") out.warnings.push(`${g.name}: deltaware is normally unavailable at character creation.`);
    return { ...g, index: i, totalCost: cost, totalEssence: Math.round(ess * 1000) / 1000, finalAvail: avail, isWare };
  });
  const ls = LIFESTYLES[state.lifestyle.type] ?? LIFESTYLES.low;
  const months = Math.max(0, Number(state.lifestyle.months) || 0);
  const lifestyleCost = Math.round(ls.cost * meta.lifestyle) * months;
  const nuyenSpent = gearCost + lifestyleCost;
  const nuyenLeft = nuyenStart - nuyenSpent;
  if (nuyenLeft < 0) out.errors.push(`Overspent nuyen by ${(-nuyenLeft).toLocaleString()}¥.`);
  if (nuyenLeft > MAX_CARRY_NUYEN) out.warnings.push(`Only ${MAX_CARRY_NUYEN.toLocaleString()}¥ carries over; ${(nuyenLeft - MAX_CARRY_NUYEN).toLocaleString()}¥ will be lost.`);
  if (months < 1) out.warnings.push("Buy at least one month of lifestyle.");
  const essence = Math.round((6 - essenceLoss) * 1000) / 1000;
  if (essence <= 0) out.errors.push("Essence would drop to 0 or below.");
  const magicLoss = Math.ceil(6 - essence - 1e-9);
  if (magicVal > 0 && magicLoss > 0) out.warnings.push(`Essence ${essence}: Magic is reduced by ${magicLoss} (to ${Math.max(0, magicVal - magicLoss)}).`);
  if (special.resonance.value > 0 && magicLoss > 0) out.warnings.push(`Essence ${essence}: Resonance is reduced by ${magicLoss}.`);
  out.gear = gear; out.nuyenStart = nuyenStart; out.gearCost = gearCost; out.lifestyleCost = lifestyleCost; out.lifestyleDef = ls;
  out.nuyenSpent = nuyenSpent; out.nuyenLeft = nuyenLeft; out.essence = essence; out.maxNuyenKarma = maxNK;
  out.nuyenCarry = Math.max(0, Math.min(MAX_CARRY_NUYEN, nuyenLeft));

  /* ---- contacts */
  const freeContact = attrs.charisma.value * level.contactMult;
  let contactCost = 0;
  const contacts = arr(state.contacts).map((c, i) => {
    const conn = Math.max(1, Number(c.connection) || 1), loy = Math.max(1, Number(c.loyalty) || 1);
    if (conn > 12) out.errors.push(`${c.name || "Contact"}: Connection above 12.`);
    if (loy > 6) out.errors.push(`${c.name || "Contact"}: Loyalty above 6.`);
    if (conn > 7 && prio) out.warnings.push(`${c.name || "Contact"}: Connection above 7 at creation is limited by many tables.`);
    contactCost += conn + loy;
    return { ...c, index: i, cost: conn + loy };
  });
  const contactKarma = Math.max(0, contactCost - freeContact);
  out.contacts = contacts; out.freeContact = freeContact; out.contactCost = contactCost; out.contactKarma = contactKarma;

  /* ---- karma budget */
  const start = prio ? level.karma : KARMA_START[method];
  const lines = [];
  const add = (label, v) => { if (v) lines.push({ label, value: v }); };
  add("Metatype", metaKarma);
  add("Magic/Resonance quality", awKarma);
  add("Life Modules", lm.karma);
  add("Qualities", qualityKarma);
  add("Attributes", attrKarma);
  add("Special attributes", specialKarma);
  add("Active skills", skillKarma);
  add("Skill groups", groupKarma);
  add("Specializations", specKarma);
  add("Knowledge & languages", knowKarma);
  add("Spells/rituals/preparations", spellKarma);
  add("Complex forms", formKarma);
  add("Power points", ppKarma);
  add("Nuyen", nk);
  add("Contacts", contactKarma);
  const spent = lines.reduce((s, l) => s + l.value, 0);
  const karmaLeft = start - spent;
  if (karmaLeft < 0) out.errors.push(`Overspent Karma by ${-karmaLeft}.`);
  if (prio && karmaLeft > MAX_CARRY_KARMA) out.warnings.push(`Only ${MAX_CARRY_KARMA} Karma carries over into play; ${karmaLeft - MAX_CARRY_KARMA} will be lost.`);
  if (!prio && karmaLeft > MAX_CARRY_KARMA) out.warnings.push(`Only ${MAX_CARRY_KARMA} Karma carries over into play; spend the rest.`);
  out.karma = { start, lines, spent, left: karmaLeft, carry: Math.max(0, Math.min(MAX_CARRY_KARMA, karmaLeft)) };

  /* ---- derived values (display only; the system recalculates on the sheet) */
  const A = (k) => attrs[k].value;
  out.derived = {
    initiative: `${A("reaction") + A("intuition")} + 1d6`,
    physicalLimit: Math.ceil((A("strength") * 2 + A("body") + A("reaction")) / 3),
    mentalLimit: Math.ceil((A("logic") * 2 + A("intuition") + A("willpower")) / 3),
    socialLimit: Math.ceil((A("charisma") * 2 + A("willpower") + essence) / 3),
    physicalCM: 8 + Math.ceil(A("body") / 2),
    stunCM: 8 + Math.ceil(A("willpower") / 2),
    composure: A("charisma") + A("willpower"),
    judgeIntentions: A("charisma") + A("intuition"),
    memory: A("logic") + A("willpower"),
    liftCarry: A("body") + A("strength")
  };

  /* ---- concept */
  if (!state.name?.trim()) out.warnings.push("Give your character a name.");
  return out;
}

export { LEVELS, COLUMNS };
