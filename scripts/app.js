import {
  ATTRS, PHYSICAL, MENTAL, ATTR_LABEL, ATTR_SHORT, LEVELS, COLUMNS, COLUMN_LABEL, PRIORITY, GAME_LEVELS, METHODS, METATYPES,
  MAGIC_PRIORITY, AWAKENED_TYPES, MAGIC_GROUPS, TRADITIONS, DRAIN_ATTRIBUTES, LIFESTYLES, GRADES, SUM_TO_TEN_COST, MAX_CARRY_NUYEN
} from "./data/rules.js";
import { LIFE_MODULES, LIFE_MODULE_STAGES, findModule } from "./data/life-modules.js";
import { SKILLS, SKILL_GROUPS, MAGICAL_SKILLS, RESONANCE_SKILLS, KNOWLEDGE_TYPES } from "./data/skills.js";
import { defaultState, migrateState, compute, instanceGrants, instanceChoiceSlots, arr } from "./engine.js";
import { loadCatalog, searchCatalog, GEAR_TYPES, MAGIC_TYPES } from "./catalog.js";
import { createActor, requestCreate, MODULE_ID } from "./apply.js";
import { qualityStatus } from "./eligibility.js";
import { loadDraft, saveDraft, clearDraft, adoptBuild, postSave } from "./storage.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const STEP_DEFS = {
  concept: { label: "Concept & Method", icon: "fa-solid fa-lightbulb" },
  metatype: { label: "Priorities & Metatype", icon: "fa-solid fa-people-group" },
  lifeModules: { label: "Life Modules", icon: "fa-solid fa-timeline" },
  magic: { label: "Magic or Resonance", icon: "fa-solid fa-hat-wizard" },
  attributes: { label: "Attributes", icon: "fa-solid fa-dumbbell" },
  qualities: { label: "Qualities", icon: "fa-solid fa-star-half-stroke" },
  skills: { label: "Active Skills", icon: "fa-solid fa-person-running" },
  knowledge: { label: "Knowledge & Languages", icon: "fa-solid fa-book" },
  resources: { label: "Resources & Gear", icon: "fa-solid fa-sack-dollar" },
  contacts: { label: "Contacts", icon: "fa-solid fa-address-book" },
  review: { label: "Final Review", icon: "fa-solid fa-flag-checkered" }
};

function stepsFor(method) {
  const s = ["concept", "metatype"];
  if (method === "lifeModules") s.push("lifeModules");
  s.push("magic", "attributes", "qualities", "skills", "knowledge", "resources", "contacts", "review");
  return s;
}

const fmtSigned = (n) => (n > 0 ? `+${n}` : `${n}`);
const nuyen = (n) => `${Math.round(Number(n) || 0).toLocaleString()}¥`;

export class Charactermancer extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "sr5-charactermancer",
    classes: ["sr5cm"],
    tag: "div",
    window: { title: "Shadowrun 5e Charactermancer", icon: "fa-solid fa-user-plus", resizable: true },
    position: { width: 1180, height: 820 },
    actions: {
      goStep: Charactermancer.#onGoStep,
      nextStep: Charactermancer.#onNextStep,
      prevStep: Charactermancer.#onPrevStep,
      addRow: Charactermancer.#onAddRow,
      removeRow: Charactermancer.#onRemoveRow,
      addModule: Charactermancer.#onAddModule,
      addCatalog: Charactermancer.#onAddCatalog,
      openItem: Charactermancer.#onOpenItem,
      rollNuyen: Charactermancer.#onRollNuyen,
      pickImage: Charactermancer.#onPickImage,
      resetBuild: Charactermancer.#onReset,
      saveToChat: Charactermancer.#onSaveToChat,
      createActor: Charactermancer.#onCreate,
      setPriority: Charactermancer.#onSetPriority,
      bump: Charactermancer.#onBump
    }
  };

  static PARTS = {
    main: { template: `modules/${MODULE_ID}/templates/charactermancer.hbs`, scrollable: [".sr5cm-main", ".sr5cm-side"] }
  };

  constructor(options = {}) {
    super(options);
    // Each user only ever loads their own draft; a save opened from chat becomes this user's draft.
    this.build = options.state ? adoptBuild(options.state) : loadDraft();
    if (options.state) this.save();
    this.ui = {
      qualitySearch: "", qualitySource: "", qualityShowAll: false,
      magicSearch: "", magicType: "", magicSource: "", magicCategory: "", magicSpellType: "", magicRange: "", magicDuration: "",
      magicCombat: "", magicDrain: "", magicPP: "", magicActivation: "",
      gearSearch: "", gearType: ""
    };
    this.catalog = null;
    loadCatalog().then(c => { this.catalog = c; if (this.rendered) this.render(); });
  }

  /* ---------------------------------------------------------------- persistence */

  #saveTimer = null;
  save() {
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => saveDraft(this.build).catch(err => console.warn(`${MODULE_ID} | draft not saved`, err)), 600);
  }
  commit() { this.save(); this.render(); }

  /* ---------------------------------------------------------------- context */

  async _prepareContext(options) {
    const st = this.build;
    const c = compute(st);
    const steps = stepsFor(st.method);
    if (!steps.includes(st.step)) st.step = "concept";
    const idx = steps.indexOf(st.step);
    const ctx = {
      st, c, step: st.step,
      steps: steps.map((k, i) => ({ key: k, ...STEP_DEFS[k], active: k === st.step, n: i + 1 })),
      isFirst: idx === 0, isLast: idx === steps.length - 1,
      isPriority: c.isPriority, isLM: st.method === "lifeModules", isKarmaBuild: !c.isPriority,
      errors: c.errors, warnings: c.warnings,
      budgets: this.#budgets(c),
      catalogLoading: !this.catalog
    };
    ctx[`step_${st.step}`] = true;
    switch (st.step) {
      case "concept": Object.assign(ctx, this.#ctxConcept(c)); break;
      case "metatype": Object.assign(ctx, this.#ctxMetatype(c)); break;
      case "lifeModules": Object.assign(ctx, this.#ctxLifeModules(c)); break;
      case "magic": Object.assign(ctx, this.#ctxMagic(c)); break;
      case "attributes": Object.assign(ctx, this.#ctxAttributes(c)); break;
      case "qualities": Object.assign(ctx, this.#ctxQualities(c)); break;
      case "skills": Object.assign(ctx, this.#ctxSkills(c)); break;
      case "knowledge": Object.assign(ctx, this.#ctxKnowledge(c)); break;
      case "resources": Object.assign(ctx, this.#ctxResources(c)); break;
      case "contacts": Object.assign(ctx, this.#ctxContacts(c)); break;
      case "review": Object.assign(ctx, this.#ctxReview(c)); break;
    }
    return ctx;
  }

  #budgets(c) {
    const b = [];
    const k = c.karma;
    b.push({ label: "Karma", value: `${k.left} / ${k.start}`, bad: k.left < 0, ok: k.left >= 0 && k.left <= 7 });
    if (c.isPriority) {
      b.push({ label: "Attribute points", value: `${c.attrPts - c.attrPtsUsed} left`, bad: c.attrPtsUsed > c.attrPts, ok: c.attrPtsUsed === c.attrPts });
      b.push({ label: "Special points", value: `${c.specialPts - c.specialUsed} left`, bad: c.specialUsed > c.specialPts, ok: c.specialUsed === c.specialPts });
      b.push({ label: "Skill points", value: `${c.skillPts - c.skillPtsUsed} left`, bad: c.skillPtsUsed > c.skillPts, ok: c.skillPtsUsed === c.skillPts });
      b.push({ label: "Group points", value: `${c.groupPts - c.groupPtsUsed} left`, bad: c.groupPtsUsed > c.groupPts, ok: c.groupPtsUsed === c.groupPts });
    }
    b.push({ label: "Knowledge points", value: `${c.freeKnow - c.knowPts} left`, bad: c.knowPts > c.freeKnow, ok: c.knowPts === c.freeKnow });
    b.push({ label: "Nuyen", value: nuyen(c.nuyenLeft), bad: c.nuyenLeft < 0, ok: c.nuyenLeft >= 0 && c.nuyenLeft <= MAX_CARRY_NUYEN });
    b.push({ label: "Essence", value: c.essence, bad: c.essence <= 0 });
    b.push({ label: "Qualities +/−", value: `${c.posQ} / ${c.negQ}`, bad: c.posQ > 25 || c.negQ > 25 });
    if (c.magic.ppAvail || c.magic.ppUsed) b.push({ label: "Power points", value: `${c.magic.ppAvail - c.magic.ppUsed} left`, bad: c.magic.ppUsed > c.magic.ppAvail });
    b.push({ label: "Contact Karma", value: `${Math.max(0, c.freeContact - c.contactCost)} free left`, ok: c.contactCost <= c.freeContact });
    const TIPS = {
      "Karma": "Karma left to spend. At most 7 carries over into play.",
      "Attribute points": "Points from the Attributes priority. All of them must be spent on physical and mental attributes.",
      "Special points": "Points from the Metatype priority for Edge, Magic or Resonance. Unspent points are lost.",
      "Skill points": "Points from the Skills priority for active skills and specializations (1 point each).",
      "Group points": "Points from the Skills priority for skill groups.",
      "Knowledge points": "Free knowledge and language points: (Intuition + Logic) × 2.",
      "Nuyen": "Nuyen left. At most 5,000¥ carries over into play.",
      "Essence": "6 minus the Essence cost of cyberware and bioware.",
      "Qualities +/−": "Karma in positive / negative qualities you chose. Each is limited to 25. Life Module qualities don't count.",
      "Power points": "Adept power points left: Magic for adepts, bought points for mystic adepts.",
      "Contact Karma": "Free contact Karma left: Charisma × 3 (× 6 for Prime Runners). Each contact costs Connection + Loyalty."
    };
    for (const x of b) x.tip = TIPS[x.label] ?? "";
    return b;
  }

  #ctxConcept(c) {
    const st = this.build;
    return {
      methods: Object.entries(METHODS).map(([k, v]) => ({ key: k, ...v, selected: st.method === k })),
      levels: Object.entries(GAME_LEVELS).map(([k, v]) => ({ key: k, label: v.label, selected: st.level === k,
        detail: `${v.karma} Karma, ${v.nuyenKarma} Karma→nuyen max, Availability ≤ ${v.avail}, Device rating ≤ ${v.deviceRating}, contacts Charisma × ${v.contactMult}` })),
      img: st.img || "icons/svg/mystery-man.svg"
    };
  }

  #ctxMetatype(c) {
    const st = this.build;
    const pri = st.priorities;
    const used = COLUMNS.map(k => pri[k]).filter(Boolean);
    const grid = LEVELS.map(lv => ({
      level: lv,
      cost: SUM_TO_TEN_COST[lv],
      cells: COLUMNS.map(col => {
        const selected = pri[col] === lv;
        const taken = st.method === "priority" && !selected && used.includes(lv);
        const text = this.#priorityText(col, lv);
        const tip = `${COLUMN_LABEL[col]} at priority ${lv}: ${text}${st.method === "sumToTen" ? ` (costs ${SUM_TO_TEN_COST[lv]} of your 10 points)` : ""}${taken ? ". Already used by another column." : ""}`;
        return { col, level: lv, selected, taken, text, tip };
      })
    }));
    const groups = {};
    for (const [k, m] of Object.entries(METATYPES)) {
      const row = m.priority[pri.metatype];
      const available = c.isPriority ? !!row || !pri.metatype : true;
      (groups[m.group] ??= []).push({
        key: k, label: m.label, selected: st.metatype === k, available,
        detail: c.isPriority ? (row ? `${row[0]} special pts${row[1] ? `, +${row[1]} Karma` : ""}` : (pri.metatype ? "not at this priority" : "")) : `${m.cost} Karma`,
        attrs: [...ATTRS, "edge"].map(a => `${ATTR_SHORT[a]} ${m.attrs[a].min}/${m.attrs[a].max}`).join(" · "),
        traits: m.traits.join(", "),
        tipHtml: `<strong>${m.label}</strong><br>${[...ATTRS, "edge"].map(a => `${ATTR_SHORT[a]} ${m.attrs[a].min}/${m.attrs[a].max}`).join(" · ")}${m.traits.length ? `<br>${m.traits.join(", ")}` : ""}<br>Point Buy/Life Modules: ${m.cost} Karma${m.lifestyle !== 1 ? `<br>Lifestyle cost × ${m.lifestyle}` : ""}`
      });
    }
    return {
      columns: COLUMNS.map(k => ({ key: k, label: COLUMN_LABEL[k] })),
      grid, sumToTen: st.method === "sumToTen",
      metaGroups: Object.entries(groups).map(([g, list]) => ({ group: g, list })),
      meta: c.meta,
      metaAttrs: [...ATTRS, "edge"].map(a => ({ label: ATTR_SHORT[a], min: c.meta.attrs[a].min, max: c.meta.attrs[a].max }))
    };
  }

  #priorityText(col, lv) {
    const st = this.build;
    const level = GAME_LEVELS[st.level];
    switch (col) {
      case "metatype": return Object.values(METATYPES).filter(m => m.group === "Core" && m.priority[lv]).map(m => `${m.label} (${m.priority[lv][0]})`).join(", ") || "—";
      case "attributes": return `${PRIORITY.attributes[lv]}`;
      case "magic": {
        const row = MAGIC_PRIORITY[lv];
        const parts = Object.entries(row).map(([t, r]) => `${AWAKENED_TYPES[t].label} ${r.rating}`);
        return parts.join(", ") || "Mundane";
      }
      case "skills": return PRIORITY.skills[lv].join("/");
      case "resources": return nuyen(level.resources[lv]);
    }
    return "";
  }

  #ctxLifeModules(c) {
    const st = this.build;
    const stages = LIFE_MODULE_STAGES.map(stage => {
      const list = arr(st.lifeModules[stage.key]);
      const instances = list.map((inst, i) => this.#lmInstanceView(stage, inst, i));
      const available = LIFE_MODULES[stage.key].map(m => ({ id: m.id, name: `${m.name} (${m.karma})`, taken: list.some(x => x.id === m.id) }));
      return { ...stage, instances, available, canAdd: list.length < stage.max };
    });
    return { stages, lm: c.lm };
  }

  #lmInstanceView(stage, inst, i) {
    const def = findModule(stage.key, inst.id);
    const base = `lifeModules.${stage.key}.${i}`;
    if (!def) return { stage: stage.key, index: i, name: "Unknown module", base };
    const opt = def.options?.list.find(o => o.id === inst.option);
    const grants = instanceGrants(stage.key, inst);
    const placeholders = grants.filter(g => (g.op === "knowledge" || g.op === "language") && g.name.includes("["))
      .map(g => ({ index: g.index, label: `${g.op === "language" ? "Language" : `${KNOWLEDGE_TYPES[g.type]?.label ?? ""} Knowledge`} ${g.name} +${g.n}`, value: inst.fills?.[g.index] ?? "", path: `${base}.fills.${g.index}` }));
    const describe = (g) => {
      switch (g.op) {
        case "attr": return `${ATTR_LABEL[g.attr]} +${g.n}`;
        case "skill": return `${g.name} +${g.n}`;
        case "group": return `${g.name} group +${g.n}`;
        case "spec": return `${g.skill} (${g.name}) specialization`;
        case "knowledge": return `${KNOWLEDGE_TYPES[g.type]?.label ?? ""} Knowledge: ${g.name} +${g.n}`;
        case "language": return g.native ? `${g.name} (Native)` : `Language: ${g.name} +${g.n}`;
        case "quality": return `${g.name} (${g.karma})`;
        default: return g.text;
      }
    };
    const choices = instanceChoiceSlots(stage.key, inst).map(slot => this.#choiceView(slot, inst, base));
    const view = {
      stage: stage.key, index: i, base, def, name: def.name, karma: def.karma, page: def.page, note: def.note,
      optionLabel: def.options?.label, options: def.options?.list.map(o => ({ id: o.id, name: o.name, selected: o.id === inst.option })),
      grants: grants.map(describe), placeholders, choices
    };
    if (def.regionLanguages && opt) {
      view.regionLanguages = true;
      view.nativeOptions = (opt.languages ?? []).map(l => ({ value: l, selected: inst.native === l }));
      view.secondaryOptions = [...new Set([...(opt.languages ?? []), "English"])].filter(l => l !== inst.native).map(l => ({ value: l, selected: inst.secondary === l }));
      view.nativeLabel = inst.native ?? "";
    }
    return view;
  }

  #choiceView(slot, inst, base) {
    const d = slot.def;
    const path = `${base}.choices.${slot.key}`;
    const v = inst.choices?.[slot.key];
    const out = { key: slot.key, type: d.type, label: d.label, path, [`is_${d.type}`]: true };
    switch (d.type) {
      case "attrPick": {
        const vals = arr(v);
        out.selects = Array.from({ length: d.count }, (_, j) => ({ path: `${path}.${j}`, options: ATTRS.filter(a => !(d.exclude ?? []).includes(a)).map(a => ({ value: a, label: ATTR_LABEL[a], selected: vals[j] === a })) }));
        out.label = `${d.label} (+${d.bonus})`;
        break;
      }
      case "skillPick": case "groupPick": {
        const vals = arr(v);
        out.selects = Array.from({ length: d.count }, (_, j) => ({ path: `${path}.${j}`, options: d.options.map(o => ({ value: o, label: o, selected: vals[j] === o })) }));
        out.label = `${d.label} (+${d.bonus})`;
        break;
      }
      case "languagePick":
        out.selects = [{ path, options: d.options.map(o => ({ value: o, label: o, selected: v === o })) }];
        break;
      case "skillPoints": {
        const rows = arr(v);
        out.rows = rows.map((r, j) => ({ j, path: `${path}.${j}`, n: r?.n ?? 0, options: SKILLS.map(s => ({ value: s.name, label: s.name, selected: r?.skill === s.name })) }));
        out.used = rows.reduce((s, r) => s + (Number(r?.n) || 0), 0); out.points = d.points; out.maxEach = d.maxEach;
        break;
      }
      case "knowledgePoints": {
        const rows = arr(v);
        out.rows = rows.map((r, j) => ({ j, path: `${path}.${j}`, n: r?.n ?? 0, name: r?.name ?? "" }));
        out.used = rows.reduce((s, r) => s + (Number(r?.n) || 0), 0); out.points = d.points; out.maxEach = d.maxEach;
        break;
      }
      case "variant":
        out.selects = [{ path, options: d.options.map(o => ({ value: o.label, label: o.label, selected: v === o.label })) }];
        break;
    }
    return out;
  }

  #ctxMagic(c) {
    const st = this.build;
    const pri = st.priorities.magic;
    const types = Object.entries(AWAKENED_TYPES).map(([k, t]) => {
      let available = true, detail = "";
      if (c.isPriority) {
        if (k === "mundane") detail = "No Magic or Resonance";
        else {
          const row = MAGIC_PRIORITY[pri]?.[k];
          available = !!row || !pri;
          detail = row ? [`${t.special === "magic" ? "Magic" : "Resonance"} ${row.rating}`,
            row.skills ? `${row.skills.count} ${row.skills.kind} skill(s) at ${row.skills.rating}` : "",
            row.group ? `one magical group at ${row.group.rating}` : "",
            row.spells ? `${row.spells} spells` : "", row.forms ? `${row.forms} complex forms` : ""].filter(Boolean).join(", ")
            : (pri ? `not available at priority ${pri}` : "");
        }
      } else detail = k === "mundane" ? "No quality" : `${t.karma} Karma — starts at ${t.special === "magic" ? "Magic" : "Resonance"} 1`;
      return { key: k, label: t.label, selected: st.awakened === k, available, detail };
    });
    const row = c.magicRow;
    let freeSkillSlots = [];
    if (row?.skills) {
      const pool = row.skills.kind === "magical" ? MAGICAL_SKILLS : row.skills.kind === "resonance" ? RESONANCE_SKILLS
        : SKILLS.filter(s => s.requirement === "mundane").map(s => s.name);
      const chosen = arr(st.magicFree.skills);
      freeSkillSlots = Array.from({ length: row.skills.count }, (_, j) => ({
        path: `magicFree.skills.${j}`, options: pool.map(s => ({ value: s, label: s, selected: chosen[j] === s }))
      }));
    }
    const groupOptions = row?.group ? MAGIC_GROUPS.map(g => ({ value: g, label: g, selected: st.magicFree.group === g })) : null;
    const isMagic = c.awakened.special === "magic";
    const isTechno = c.awakened.special === "resonance";
    const allowedTypes = isTechno ? ["complex_form"] : st.awakened === "adept" ? ["adept_power"] : st.awakened === "mysticAdept" ? ["spell", "ritual", "adept_power"] : isMagic ? ["spell", "ritual"] : [];
    const u = this.ui;
    const types2 = u.magicType ? [u.magicType] : allowedTypes;
    const pool = this.catalog ? this.catalog.filter(e => types2.includes(e.type)) : [];
    const takenUuids = new Set(arr(st.magicItems).map(m => m.uuid));
    const drainMax = u.magicDrain === "" ? null : Number(u.magicDrain);
    const ppMax = u.magicPP === "" ? null : Number(u.magicPP);
    const filter = (e) => {
      if (takenUuids.has(e.uuid)) return false;
      if (u.magicSource && e.source !== u.magicSource) return false;
      if (["spell", "ritual"].includes(e.type)) {
        if (u.magicCategory && e.category !== u.magicCategory) return false;
        if (u.magicSpellType && e.qtype !== u.magicSpellType) return false;
        if (u.magicRange && e.range !== u.magicRange) return false;
        if (u.magicDuration && e.duration !== u.magicDuration) return false;
        if (u.magicCombat && e.combatType !== u.magicCombat) return false;
        if (drainMax !== null && e.drain !== null && e.drain > drainMax) return false;
      } else if (u.magicCategory || u.magicSpellType || u.magicRange || u.magicDuration || u.magicCombat) return false;
      if (e.type === "adept_power") {
        if (ppMax !== null && e.pp > ppMax) return false;
        if (u.magicActivation && e.qtype !== u.magicActivation) return false;
      }
      return true;
    };
    const results = this.catalog && allowedTypes.length ? searchCatalog(pool, { text: u.magicSearch, filter, limit: 150 }) : [];
    const uniq = (key) => [...new Set(pool.map(e => e[key]).filter(v => v !== "" && v != null))].sort();
    const opts = (vals, sel, labeler = (v) => v) => vals.map(v => ({ value: v, label: labeler(v), selected: String(sel) === String(v) }));
    const RANGE = { los: "LOS", los_a: "LOS (Area)", touch: "Touch", self: "Self", self_a: "Self (Area)" };
    const cap = (v) => String(v).charAt(0).toUpperCase() + String(v).slice(1);
    const drainTxt = (d) => (d === null || d === undefined ? "" : `Drain F${d >= 0 ? "+" : "−"}${Math.abs(d)}`);
    const hasSpells = allowedTypes.includes("spell");
    const hasPowers = allowedTypes.includes("adept_power");
    const tradGroups = {};
    for (const [k, t] of Object.entries(TRADITIONS)) (tradGroups[t.group] ??= []).push({ key: k, label: `${t.label}${t.drain ? ` (WIL + ${ATTR_SHORT[t.drain] ?? t.drain})` : ""} — ${t.source}`, selected: st.tradition === k });
    const spellsTaken = c.magic.spellsTaken;
    return {
      awTypes: types, freeSkillSlots, groupOptions, row,
      traditionGroups: Object.entries(tradGroups).map(([group, list]) => ({ group, list })),
      isCustomTradition: st.tradition === "custom",
      drainOptions: DRAIN_ATTRIBUTES.map(a => ({ value: a, label: ATTR_LABEL[a], selected: st.customDrain === a })),
      isMagic, isTechno, isAdept: st.awakened === "adept", isMystic: st.awakened === "mysticAdept",
      magicTypeOptions: allowedTypes.map(t => ({ value: t, label: t.replace("_", " "), selected: u.magicType === t })),
      magicSourceOptions: opts(uniq("source"), u.magicSource),
      magicCategoryOptions: hasSpells ? opts(uniq("category"), u.magicCategory, cap) : [],
      magicSpellTypeOptions: hasSpells ? opts(["mana", "physical"], u.magicSpellType, cap) : [],
      magicRangeOptions: hasSpells ? opts(uniq("range"), u.magicRange, (v) => RANGE[v] ?? v) : [],
      magicDurationOptions: hasSpells ? opts(uniq("duration"), u.magicDuration, cap) : [],
      magicCombatOptions: hasSpells ? opts(["direct", "indirect"], u.magicCombat, cap) : [],
      magicDrainOptions: hasSpells ? opts([-6, -5, -4, -3, -2, -1, 0, 1, 2, 3], u.magicDrain, (v) => `F${v >= 0 ? "+" : "−"}${Math.abs(v)} or less`) : [],
      magicPPOptions: hasPowers ? opts([0.25, 0.5, 0.75, 1, 1.5, 2, 3], u.magicPP, (v) => `${v} PP or less`) : [],
      magicActivationOptions: hasPowers ? opts(["active", "passive"], u.magicActivation, cap) : [],
      hasSpells, hasPowers, resultCount: results.length,
      magicResults: results.map(r => ({ ...r, list: "magicItems",
        extra: r.type === "adept_power" ? `${r.pp} PP · ${r.qtype ?? ""}` : r.type === "complex_form" ? (r.fade !== null ? `Fade L${r.fade >= 0 ? "+" : "−"}${Math.abs(r.fade)}` : "") :
          [cap(r.category), cap(r.qtype), RANGE[r.range] ?? r.range, cap(r.duration), drainTxt(r.drain)].filter(Boolean).join(" · ") })),
      magicItems: arr(st.magicItems).map((m, i) => ({ ...m, index: i, isPower: m.type === "adept_power" })),
      spellNote: c.isPriority
        ? `${c.magic.freeSpells} free from your priority; each extra spell, ritual or preparation costs 5 Karma`
        : `Point Buy and Life Modules give no free spells (Run Faster p.64): every spell, ritual or preparation costs 5 Karma`,
      spellKarmaTxt: `${spellsTaken} known · ${c.magic.spellKarma} Karma spent · limit Magic × 2 = ${c.magic.formulaMax}`,
      formKarmaTxt: `${c.magic.formsTaken} known · ${c.magic.freeForms} free · ${c.magic.formKarma} Karma spent`,
      ui: u, hasSpellbook: allowedTypes.length > 0
    };
  }

  #ctxAttributes(c) {
    const st = this.build;
    const row = (a) => ({ ...c.attrs[a], short: ATTR_SHORT[a], ptsPath: `attrs.${a}.pts`, karmaPath: `attrs.${a}.karma`, atMax: c.attrs[a].value >= c.meta.attrs[a].max,
      tip: `${ATTR_LABEL[a]}: ${c.meta.label} minimum ${c.attrs[a].min}, maximum ${c.attrs[a].max}. Raising it with Karma costs the new rating × 5.${c.attrs[a].value >= c.meta.attrs[a].max ? " At its natural maximum: only one physical or mental attribute may be." : ""}` });
    const special = ["edge", "magic", "resonance"].filter(k => c.special[k].active).map(k => ({ ...c.special[k], short: ATTR_SHORT[k], ptsPath: `special.${k}`, karmaPath: `attrs.${k}.karma` }));
    const exOptions = [...ATTRS, "magic", "resonance"].map(a => ({ value: a, label: ATTR_LABEL[a], selected: st.exceptional === a }));
    return { physical: PHYSICAL.map(row), mental: MENTAL.map(row), special, exOptions, derived: c.derived };
  }

  #ctxQualities(c) {
    const st = this.build;
    const u = this.ui;
    const all = this.catalog ? this.catalog.filter(e => e.type === "quality") : [];
    // De-duplicate qualities that appear in several books: keep the first source.
    const seen = new Set();
    const pool = all.filter(e => { const k = `${e.name.toLowerCase()}|${e.karma}`; if (seen.has(k)) return false; seen.add(k); return true; });
    const ctx = { c, state: st };
    let hiddenPos = 0, hiddenNeg = 0;
    const filter = (e) => {
      if (u.qualitySource && e.source !== u.qualitySource) return false;
      const status = qualityStatus(e, ctx);
      e._status = status;
      if (!status.ok && !u.qualityShowAll) { if (e.karma < 0) hiddenNeg++; else hiddenPos++; return false; }
      return true;
    };
    const pos = searchCatalog(pool.filter(e => e.karma >= 0), { text: u.qualitySearch, filter, limit: 400 });
    const neg = searchCatalog(pool.filter(e => e.karma < 0), { text: u.qualitySearch, filter, limit: 400 });
    const view = (r) => ({ ...r, list: "qualities", extra: `${r.karma} Karma`, unavailable: !r._status?.ok, reason: r._status?.reason ?? "" });
    const mine = arr(st.qualities).map((q, i) => ({ ...q, index: i, negative: Number(q.karma) < 0 }));
    return {
      posQualities: mine.filter(q => !q.negative), negQualities: mine.filter(q => q.negative),
      lmQualities: c.lm.qualities,
      posResults: pos.slice(0, 150).map(view), negResults: neg.slice(0, 150).map(view),
      posCount: pos.length, negCount: neg.length, hiddenPos, hiddenNeg,
      qualitySourceOptions: [...new Set(pool.map(e => e.source))].sort().map(v => ({ value: v, label: v, selected: u.qualitySource === v })),
      posRoom: 25 - c.posQ, negRoom: 25 - c.negQ,
      metaTraits: c.meta.traits, ui: u
    };
  }

  #ctxSkills(c) {
    const groups = Object.values(c.groups).map(g => ({ ...g, ptsPath: `groups.${g.name}.pts`, karmaPath: `groups.${g.name}.karma`,
      tip: `${g.name} group: ${g.skills.join(", ")}. Karma costs the new rating × 5.${g.broken ? " Broken: a member skill was raised on its own." : ""}` }));
    const skills = Object.values(c.skills).map(s => ({
      ...s, ptsPath: `skills.${s.name}.pts`, karmaPath: `skills.${s.name}.karma`, specPath: `skills.${s.name}.spec`, specViaPath: `skills.${s.name}.specVia`,
      attrShort: ATTR_SHORT[s.attribute], pool: s.value > 0 ? s.value + (c.attrs[s.attribute]?.value ?? c.special[s.attribute]?.value ?? 0) : "",
      hidden: (s.requirement === "magic" && c.awakened.special !== "magic") || (s.requirement === "resonance" && c.awakened.special !== "resonance"),
      specPoints: s.specVia === "points", lmSpec: s.spec?.via === "module" ? s.spec.name : "",
      tip: `${s.name}: ${ATTR_LABEL[s.attribute] ?? s.attribute}${s.group ? `, ${s.group} group` : ""}${s.requirement === "magic" ? ", Awakened only" : s.requirement === "resonance" ? ", technomancers only" : ""}. Karma costs the new rating × 2; a specialization costs 7 Karma${c.isPriority ? " or 1 skill point" : ""}.`
    }));
    return { groups, skillRows: skills.filter(s => !s.hidden) };
  }

  #ctxKnowledge(c) {
    const typeOpts = (sel) => Object.entries(KNOWLEDGE_TYPES).map(([k, t]) => ({ value: k, label: t.label, selected: sel === k }));
    return {
      knowledgeRows: c.knowledge.map(k => ({ ...k, typeOptions: typeOpts(k.type), path: k.index >= 0 ? `knowledge.${k.index}` : null })),
      languageRows: c.languages.map(l => ({ ...l, path: l.index >= 0 ? `languages.${l.index}` : null }))
    };
  }

  #ctxResources(c) {
    const st = this.build;
    const results = this.catalog ? searchCatalog(this.catalog, { types: this.ui.gearType ? [this.ui.gearType] : GEAR_TYPES, text: this.ui.gearSearch }) : [];
    return {
      gearRows: c.gear.map(g => ({ ...g, gradeOptions: Object.entries(GRADES).map(([k, v]) => ({ value: k, label: v.label, selected: (g.grade || "standard") === k })) })),
      gearResults: results.map(r => ({ ...r, list: "gear", extra: [r.cost ? nuyen(r.cost) : "", r.avail ? `Avail ${r.avail}` : "", r.essence ? `Ess ${r.essence}` : ""].filter(Boolean).join(" · ") })),
      gearTypeOptions: [{ value: "", label: "All gear" }, ...GEAR_TYPES.map(t => ({ value: t, label: t }))].map(o => ({ ...o, selected: this.ui.gearType === o.value })),
      lifestyleOptions: Object.entries(LIFESTYLES).map(([k, l]) => ({ value: k, label: `${l.label} (${nuyen(Math.round(l.cost * c.meta.lifestyle))}/month)`, selected: st.lifestyle.type === k })),
      nuyenStartTxt: nuyen(c.nuyenStart), gearCostTxt: nuyen(c.gearCost), lifestyleCostTxt: nuyen(c.lifestyleCost), nuyenLeftTxt: nuyen(c.nuyenLeft),
      startingDice: `${c.lifestyleDef.dice}d6 × ${c.lifestyleDef.mult}`, startingNuyenTxt: st.startingNuyen != null ? nuyen(st.startingNuyen) : "not rolled",
      ui: this.ui
    };
  }

  #ctxContacts(c) {
    return { contactRows: c.contacts };
  }

  #ctxReview(c) {
    const st = this.build;
    return {
      reviewAttrs: [...ATTRS.map(a => c.attrs[a]), ...["edge", "magic", "resonance"].filter(k => c.special[k].active).map(k => c.special[k])],
      reviewSkills: Object.values(c.skills).filter(s => s.value > 0).map(s => `${s.name} ${s.value}${s.spec ? ` (${s.spec.name})` : ""}`).join(", ") || "—",
      reviewGroups: Object.values(c.groups).filter(g => g.value > 0).map(g => `${g.name} ${g.value}${g.broken ? " (broken)" : ""}`).join(", ") || "—",
      reviewKnow: c.knowledge.filter(k => k.value > 0).map(k => `${k.name} ${k.value}`).join(", ") || "—",
      reviewLang: c.languages.map(l => `${l.name} ${l.native ? "N" : l.value}`).join(", ") || "—",
      reviewQualities: [...c.lm.qualities.map(q => `${q.name} (${q.karma})`), ...arr(st.qualities).map(q => `${q.name} (${q.karma})`)].join(", ") || "—",
      karmaLines: c.karma.lines.map(l => ({ ...l, txt: fmtSigned(-l.value) })),
      derived: c.derived, canCreate: c.errors.length === 0,
      nuyenCarryTxt: nuyen(c.nuyenCarry)
    };
  }

  /* ---------------------------------------------------------------- render hooks */

  _onRender(context, options) {
    super._onRender?.(context, options);
    const html = this.element;
    html.querySelectorAll("[data-path]").forEach(el => el.addEventListener("change", ev => this.#onFieldChange(ev)));
    html.querySelectorAll("[data-ui]").forEach(el => {
      const isBox = el.type === "checkbox";
      const handler = foundry.utils.debounce(() => { this.ui[el.dataset.ui] = isBox ? el.checked : el.value; this._focusUi = (el.tagName === "SELECT" || isBox) ? null : el.dataset.ui; this.render(); }, isBox ? 0 : 300);
      el.addEventListener(el.tagName === "SELECT" || isBox ? "change" : "input", handler);
    });
    html.querySelectorAll("[data-drop]").forEach(el => {
      el.addEventListener("dragover", ev => ev.preventDefault());
      el.addEventListener("drop", ev => this.#onDrop(ev, el.dataset.drop));
    });
    // Item descriptions as tooltips, fetched on first hover.
    html.querySelectorAll("[data-desc-uuid]").forEach(el => el.addEventListener("mouseenter", () => this.#descTooltip(el)));
    // restore focus for live search boxes
    if (this._focusUi) {
      const el = html.querySelector(`[data-ui="${this._focusUi}"]`);
      if (el) { el.focus(); const v = el.value; el.value = ""; el.value = v; }
      this._focusUi = null;
    }
  }

  static #descCache = new Map();
  async #descTooltip(el) {
    const uuid = el.dataset.descUuid;
    if (!uuid || el.dataset.tooltipHtml) return;
    let html = Charactermancer.#descCache.get(uuid);
    if (html === undefined) {
      const doc = await fromUuid(uuid).catch(() => null);
      const d = doc?.system?.description;
      const body = typeof d === "object" ? (d?.value ?? "") : "";
      const src = typeof d === "object" ? (d?.source ?? "") : "";
      const name = foundry.utils.escapeHTML ? foundry.utils.escapeHTML(doc?.name ?? "") : (doc?.name ?? "");
      html = body ? `<strong>${name}</strong>${src ? ` <em>(${src})</em>` : ""}${body}` : "";
      Charactermancer.#descCache.set(uuid, html);
    }
    if (!html) return;
    el.dataset.tooltipHtml = html;
    el.dataset.tooltipClass = "sr5cm-tooltip";
    if (el.matches(":hover")) game.tooltip.activate(el, { html, cssClass: "sr5cm-tooltip" });
  }

  #onFieldChange(ev) {
    const el = ev.currentTarget;
    const path = el.dataset.path;
    let value;
    if (el.type === "checkbox") value = el.checked;
    else if (el.dataset.dtype === "Number" || el.type === "number") value = el.value === "" ? 0 : Number(el.value);
    else value = el.value;
    foundry.utils.setProperty(this.build, path, value);
    // Changing a life module option resets its choices/fills
    if (/^lifeModules\.\w+\.\d+\.option$/.test(path)) {
      const inst = foundry.utils.getProperty(this.build, path.replace(/\.option$/, ""));
      inst.choices = {}; inst.native = ""; inst.secondary = "";
    }
    if (path === "awakened") { this.build.magicFree = { skills: ["", ""], group: "" }; }
    this.commit();
  }

  async #onDrop(ev, list) {
    ev.preventDefault();
    const TE = foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor;
    const data = TE.getDragEventData(ev);
    if (data?.type !== "Item" || !data.uuid) return;
    const doc = await fromUuid(data.uuid);
    if (!doc) return;
    this.#addItemDoc(doc, list);
  }

  #addItemDoc(doc, list) {
    const sys = doc.system ?? {};
    const st = this.build;
    if (list === "qualities") {
      if (doc.type !== "quality") return ui.notifications.warn("Only qualities can be added here.");
      st.qualities = arr(st.qualities);
      st.qualities.push({ uuid: doc.uuid, name: doc.name, img: doc.img, karma: Number(sys.karma ?? 0), rating: Number(sys.rating ?? 0) });
    } else if (list === "magicItems") {
      if (!MAGIC_TYPES.includes(doc.type)) return ui.notifications.warn("Only spells, rituals, complex forms and adept powers can be added here.");
      st.magicItems = arr(st.magicItems);
      st.magicItems.push({ uuid: doc.uuid, name: doc.name, img: doc.img, type: doc.type, pp: Number(sys.pp ?? 0), level: Number(sys.level ?? 0) || 1 });
    } else if (list === "gear") {
      if (["quality", "spell", "ritual", "complex_form", "adept_power", "skill", "contact", "lifestyle", "critter_power", "sprite_power", "echo", "metamagic"].includes(doc.type))
        return ui.notifications.warn("That item type is not bought with nuyen.");
      st.gear = arr(st.gear);
      st.gear.push({ uuid: doc.uuid, name: doc.name, img: doc.img, type: doc.type, qty: 1, rating: Number(sys.technology?.rating ?? 0),
        cost: Number(sys.technology?.cost ?? 0), avail: sys.technology?.availability ?? "", essence: Number(sys.essence ?? 0), grade: sys.grade ?? "standard" });
    }
    this.commit();
  }

  /* ---------------------------------------------------------------- actions */

  static #onGoStep(ev, target) { this.build.step = target.dataset.step; this.commit(); }
  static #onNextStep() { const s = stepsFor(this.build.method); const i = s.indexOf(this.build.step); this.build.step = s[Math.min(s.length - 1, i + 1)]; this.commit(); }
  static #onPrevStep() { const s = stepsFor(this.build.method); const i = s.indexOf(this.build.step); this.build.step = s[Math.max(0, i - 1)]; this.commit(); }

  static #onSetPriority(ev, target) {
    const { col, level } = target.dataset;
    const pri = this.build.priorities;
    if (pri[col] === level) pri[col] = "";
    else {
      if (this.build.method === "priority") for (const k of COLUMNS) if (pri[k] === level) pri[k] = "";
      pri[col] = level;
    }
    this.commit();
  }

  static #onBump(ev, target) {
    const path = target.dataset.target;
    const delta = Number(target.dataset.delta) || 0;
    const cur = Number(foundry.utils.getProperty(this.build, path)) || 0;
    foundry.utils.setProperty(this.build, path, Math.max(0, cur + delta));
    this.commit();
  }

  static #onAddRow(ev, target) {
    const path = target.dataset.list;
    const list = arr(foundry.utils.getProperty(this.build, path));
    const kind = target.dataset.kind;
    const blank = {
      knowledge: { name: "", type: "street", pts: 0, karma: 0, spec: "" },
      language: { name: "", native: false, pts: 0, karma: 0 },
      contact: { name: "", type: "", connection: 1, loyalty: 1, notes: "" },
      quality: { uuid: "", name: "Custom quality", karma: 0, rating: 0 },
      gear: { uuid: "", name: "Custom item", type: "equipment", qty: 1, rating: 0, cost: 0, avail: "", essence: 0, grade: "standard" },
      skillPoints: { skill: "", n: 1 },
      knowledgePoints: { name: "", n: 1 }
    }[kind] ?? {};
    list.push(foundry.utils.deepClone(blank));
    foundry.utils.setProperty(this.build, path, list);
    this.commit();
  }

  static #onRemoveRow(ev, target) {
    const path = target.dataset.list;
    const list = arr(foundry.utils.getProperty(this.build, path));
    list.splice(Number(target.dataset.index), 1);
    foundry.utils.setProperty(this.build, path, list);
    this.commit();
  }

  static #onAddModule(ev, target) {
    const stage = target.dataset.stage;
    const sel = this.element.querySelector(`select[data-add-module="${stage}"]`);
    const id = sel?.value;
    if (!id) return;
    const list = arr(this.build.lifeModules[stage]);
    const def = findModule(stage, id);
    const st = LIFE_MODULE_STAGES.find(s => s.key === stage);
    if (list.some(i => i.id === id)) return ui.notifications.warn(`${def.name} is already taken.`);
    if (list.length >= st.max) list.length = 0; // single-choice stages are replaced
    list.push({ id, option: "", fills: {}, choices: {} });
    this.build.lifeModules[stage] = list;
    this.commit();
  }

  static async #onAddCatalog(ev, target) {
    const doc = await fromUuid(target.dataset.uuid);
    if (doc) this.#addItemDoc(doc, target.dataset.list);
  }

  static async #onOpenItem(ev, target) {
    const doc = await fromUuid(target.dataset.uuid);
    doc?.sheet?.render(true);
  }

  static async #onRollNuyen() {
    const ls = LIFESTYLES[this.build.lifestyle.type] ?? LIFESTYLES.low;
    const roll = await new Roll(`${ls.dice}d6 * ${ls.mult}`).evaluate();
    await roll.toMessage({ flavor: `Starting nuyen (${ls.label} lifestyle) — ${this.build.name || "new runner"}`, speaker: ChatMessage.getSpeaker() });
    this.build.startingNuyen = roll.total;
    this.commit();
  }

  static async #onPickImage() {
    const FP = foundry.applications?.apps?.FilePicker?.implementation ?? FilePicker;
    new FP({ type: "image", current: this.build.img, callback: (path) => { this.build.img = path; this.commit(); } }).render(true);
  }

  static async #onReset() {
    const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "Start over?" }, content: "<p>Discard this build and start a new character?</p>" });
    if (!ok) return;
    clearTimeout(this.#saveTimer);
    this.build = defaultState();
    this.build.owner = game.user.id;
    await clearDraft();
    this.render();
  }

  static async #onSaveToChat() {
    clearTimeout(this.#saveTimer);
    await saveDraft(this.build).catch(() => {});
    await postSave(this.build);
    ui.notifications.info("Build saved to chat. Anyone can open a copy of it from the chat card.");
  }

  static async #onCreate() {
    const c = compute(this.build);
    if (c.errors.length) return ui.notifications.error("Fix the errors listed in the summary before creating the character.");
    if (!game.user.can("ACTOR_CREATE") && !game.users.activeGM) return ui.notifications.error("A Gamemaster must be connected to create your character (you do not have permission to create actors).");
    try {
      ui.notifications.info("Creating character…");
      const actor = game.user.can("ACTOR_CREATE") ? await createActor(this.build, { ownerId: game.user.isGM ? null : game.user.id }) : await requestCreate(this.build);
      ui.notifications.info(`${actor.name} created.`);
      actor.sheet?.render(true);
      clearTimeout(this.#saveTimer);
      await clearDraft();
      this.build = defaultState();
      this.build.owner = game.user.id;
      this.close();
    } catch (err) {
      console.error(`${MODULE_ID} | create failed`, err);
      ui.notifications.error(`Character creation failed: ${err.message}`);
    }
  }
}
