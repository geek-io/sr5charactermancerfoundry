import { ATTRS, METATYPES, LIFESTYLES, GRADES, METHODS, GAME_LEVELS, TRADITIONS, AWAKENED_TYPES, ATTR_LABEL } from "./data/rules.js";
import { KNOWLEDGE_TYPES } from "./data/skills.js";
import { compute, arr } from "./engine.js";
import { findQualityByName } from "./catalog.js";

export const MODULE_ID = "sr5charactermancerfoundry";

const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s ?? "")) : String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Copy an item from its uuid, or build a minimal one. */
async function itemFromRef(ref, overrides = {}) {
  let data = null;
  if (ref.uuid) {
    try {
      const doc = await fromUuid(ref.uuid);
      if (doc) data = doc.toObject();
    } catch (e) { console.warn(`${MODULE_ID} | could not load ${ref.uuid}`, e); }
  }
  if (!data) data = { name: ref.name, type: ref.type, img: ref.img || undefined, system: {} };
  delete data._id;
  delete data.folder;
  delete data.sort;
  delete data.ownership;
  data._stats = { compendiumSource: ref.uuid || null };
  return foundry.utils.mergeObject(data, overrides, { inplace: false });
}

export function drainAttribute(state) {
  if (state.tradition === "custom") return state.customDrain || "logic";
  return TRADITIONS[state.tradition]?.drain || "logic";
}
function traditionLabel(state) {
  const t = TRADITIONS[state.tradition];
  if (!t) return "";
  if (state.tradition === "custom") return `Custom tradition, Drain Willpower + ${ATTR_LABEL[drainAttribute(state)]}`;
  return `${t.label} tradition, Drain Willpower + ${ATTR_LABEL[t.drain] ?? t.drain}, ${t.source}`;
}

function buildBiography(state, c) {
  const meta = c.meta;
  const rows = [];
  rows.push(`<h2>Charactermancer build</h2>`);
  rows.push(`<p><strong>Method:</strong> ${esc(METHODS[state.method].label)} — <strong>Level:</strong> ${esc(c.level.label)}</p>`);
  if (c.isPriority) rows.push(`<p><strong>Priorities:</strong> ${["metatype", "attributes", "magic", "skills", "resources"].map(k => `${k} ${state.priorities[k] || "-"}`).join(", ")}</p>`);
  rows.push(`<p><strong>Metatype:</strong> ${esc(meta.label)}${meta.traits.length ? ` — ${esc(meta.traits.join(", "))}` : ""}</p>`);
  if (state.awakened !== "mundane") rows.push(`<p><strong>Awakened/Emerged:</strong> ${esc(c.awakened.label)}${state.awakened !== "technomancer" ? ` (${esc(traditionLabel(state))})` : ""}</p>`);
  if (c.lm.entries.length) rows.push(`<p><strong>Life Modules:</strong></p><ul>${c.lm.entries.map(e => `<li>${esc(e)}</li>`).join("")}</ul>`);
  rows.push(`<p><strong>Karma:</strong> ${c.karma.start} start, ${c.karma.spent} spent, ${c.karma.carry} carried over.</p>`);
  rows.push(`<p><strong>Nuyen:</strong> ${c.nuyenStart.toLocaleString()}¥ available, ${c.nuyenSpent.toLocaleString()}¥ spent, ${c.nuyenCarry.toLocaleString()}¥ carried over${state.startingNuyen != null ? ` + ${state.startingNuyen.toLocaleString()}¥ starting nuyen roll` : ""}.</p>`);
  if (state.concept) rows.push(`<h3>Concept</h3><p>${esc(state.concept)}</p>`);
  if (state.notes) rows.push(`<h3>Notes</h3><p>${esc(state.notes).replace(/\n/g, "<br>")}</p>`);
  return rows.join("\n");
}

/**
 * Create the Shadowrun 5e character actor from a finished build.
 * Attributes, special attributes, karma and nuyen are written to the actor; qualities, spells,
 * powers, gear, contacts and the lifestyle are embedded items; skill ratings are written onto the
 * skill items the system adds from its default "Character" skill set.
 */
export async function createActor(state, { folder = null, ownerId = null } = {}) {
  const c = compute(state);
  const meta = c.meta;

  const attributes = {};
  for (const a of ATTRS) attributes[a] = { base: c.attrs[a].value };
  attributes.edge = { base: c.special.edge.value };
  attributes.magic = { base: c.special.magic.value };
  attributes.resonance = { base: c.special.resonance.value };

  const startNuyen = c.nuyenCarry + (Number(state.startingNuyen) || 0);
  const system = {
    metatype: meta.base,
    special: c.awakened.special,
    attributes,
    karma: { value: c.karma.carry, max: c.karma.carry },
    nuyen: startNuyen,
    description: { value: buildBiography(state, c) }
  };
  if (c.awakened.special === "magic") system.magic = { attribute: drainAttribute(state) };

  /* ---- embedded items */
  const items = [];
  // Qualities: metatype traits are left as notes; awakened quality; chosen qualities; life module qualities.
  const qualityRefs = [];
  if (c.awakened.quality) qualityRefs.push({ name: c.awakened.quality, karma: c.isPriority ? 0 : c.awakened.karma });
  for (const q of c.lm.qualities) qualityRefs.push({ name: q.name, karma: q.karma, note: `Granted by Life Module: ${q.source}` });
  for (const q of qualityRefs) {
    const found = await findQualityByName(q.name);
    const ref = found ?? { name: q.name, type: "quality" };
    items.push(await itemFromRef(ref, {
      name: found ? found.name : q.name,
      type: "quality",
      system: { karma: q.karma, type: q.karma < 0 ? "negative" : "positive", ...(q.note ? {} : {}) }
    }));
  }
  for (const q of arr(state.qualities)) {
    items.push(await itemFromRef({ uuid: q.uuid, name: q.name, type: "quality", img: q.img }, {
      name: q.name,
      type: "quality",
      system: { karma: Number(q.karma) || 0, type: (Number(q.karma) || 0) < 0 ? "negative" : "positive", rating: Number(q.rating) || 0 }
    }));
  }
  // Magic: spells, rituals, preparations, complex forms, adept powers
  for (const m of arr(state.magicItems)) {
    const ov = { name: m.name };
    if (m.type === "adept_power") ov.system = { level: Math.max(0, Number(m.level) || 0) };
    items.push(await itemFromRef({ uuid: m.uuid, name: m.name, type: m.type === "preparation" ? "spell" : m.type, img: m.img }, ov));
  }
  // Gear
  for (const g of arr(state.gear)) {
    const isWare = ["cyberware", "bioware"].includes(g.type);
    const ov = { name: g.name, system: { technology: { quantity: Math.max(1, Number(g.qty) || 1), rating: Number(g.rating) || 0, cost: Number(g.cost) || 0, availability: String(g.avail ?? "") } } };
    if (isWare) { ov.system.grade = g.grade || "standard"; ov.system.essence = Number(g.essence) || 0; }
    items.push(await itemFromRef({ uuid: g.uuid, name: g.name, type: g.type, img: g.img }, ov));
  }
  // Lifestyle
  const ls = LIFESTYLES[state.lifestyle.type] ?? LIFESTYLES.low;
  if (Number(state.lifestyle.months) > 0) {
    items.push({
      name: state.lifestyle.name?.trim() || `${ls.label} Lifestyle`,
      type: "lifestyle",
      system: { type: state.lifestyle.type, cost: Math.round(ls.cost * meta.lifestyle), permanent: false, description: { value: `<p>${Number(state.lifestyle.months)} month(s) prepaid at creation.</p>` } }
    });
  }
  // Contacts
  for (const ct of arr(state.contacts)) {
    items.push({
      name: ct.name?.trim() || "Contact",
      type: "contact",
      system: { type: ct.type ?? "", connection: Math.max(1, Number(ct.connection) || 1), loyalty: Math.max(1, Number(ct.loyalty) || 1), description: { value: ct.notes ? `<p>${esc(ct.notes)}</p>` : "" } }
    });
  }

  const actorData = {
    name: state.name?.trim() || "New Runner",
    type: "character",
    img: state.img || undefined,
    folder,
    system,
    items,
    prototypeToken: { actorLink: true, name: state.name?.trim() || "New Runner" },
    flags: { [MODULE_ID]: { build: foundry.utils.deepClone(state), createdWith: game.modules.get(MODULE_ID)?.version } }
  };
  if (!actorData.img) delete actorData.img;
  if (ownerId) actorData.ownership = { default: 0, [ownerId]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };

  const actor = await Actor.implementation.create(actorData);
  if (!actor) throw new Error("Actor creation failed.");

  await applySkills(actor, c);
  if (ownerId) {
    const user = game.users.get(ownerId);
    if (user && !user.isGM && !user.character) await user.update({ character: actor.id }).catch(() => {});
  }
  return actor;
}

/* ------------------------------------------------------------------ Players without "Create New Actors" permission */

export const SOCKET = `module.${MODULE_ID}`;

/** Ask the active GM's client to create the actor for this player, then wait for it. */
export function requestCreate(state) {
  if (!game.users.activeGM) return Promise.reject(new Error("A Gamemaster must be connected to create your character."));
  const requestId = foundry.utils.randomID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { game.socket.off(SOCKET, handler); reject(new Error("The Gamemaster did not answer in time.")); }, 60000);
    const handler = async (msg) => {
      if (msg?.type !== "created" || msg.requestId !== requestId) return;
      clearTimeout(timer);
      game.socket.off(SOCKET, handler);
      if (msg.error) return reject(new Error(msg.error));
      let actor = null;
      for (let i = 0; i < 20 && !actor; i++) {
        actor = game.actors.get(msg.actorId);
        if (!actor) await new Promise(r => setTimeout(r, 250));
      }
      actor ? resolve(actor) : reject(new Error("The character was created but is not visible yet; check the Actors sidebar."));
    };
    game.socket.on(SOCKET, handler);
    game.socket.emit(SOCKET, { type: "create", requestId, userId: game.user.id, state: foundry.utils.deepClone(state) });
  });
}

/** Runs on the active GM's client: create characters requested by players. */
export async function handleSocket(msg) {
  if (msg?.type !== "create") return;
  if (!game.user.isGM || game.users.activeGM?.id !== game.user.id) return;
  const user = game.users.get(msg.userId);
  try {
    const actor = await createActor(msg.state, { ownerId: msg.userId });
    ui.notifications.info(`Charactermancer: created ${actor.name} for ${user?.name ?? "a player"}.`);
    game.socket.emit(SOCKET, { type: "created", requestId: msg.requestId, actorId: actor.id });
  } catch (err) {
    console.error(`${MODULE_ID} | create for player failed`, err);
    game.socket.emit(SOCKET, { type: "created", requestId: msg.requestId, error: err.message });
  }
}

/** Write active skill / group / knowledge / language ratings onto the actor's skill items. */
async function applySkills(actor, c) {
  const skillItems = actor.items.filter(i => i.type === "skill");
  const byName = new Map(skillItems.filter(i => i.system.type === "skill").map(i => [i.name.toLowerCase(), i]));
  const updates = [];
  const creates = [];

  // Groups that stay intact are written as group items; broken groups are written per skill.
  const intactGroups = Object.values(c.groups).filter(g => g.value > 0 && !g.broken);
  const groupPack = game.packs.find(p => p.metadata.system === "shadowrun5e" && p.metadata.name === "sr5e-skill-groups");
  let groupIndex = null;
  if (groupPack) groupIndex = await groupPack.getIndex();

  for (const s of Object.values(c.skills)) {
    const groupIntact = s.group && intactGroups.some(g => g.name === s.group);
    const rating = groupIntact ? s.groupVal : s.value;
    const specs = s.spec ? [{ name: s.spec.name }] : [];
    const item = byName.get(s.name.toLowerCase());
    if (item) {
      const upd = { _id: item.id };
      if (item.system.skill.rating !== rating) upd["system.skill.rating"] = rating;
      if (specs.length) upd["system.skill.specializations"] = specs;
      upd["system.skill.group"] = groupIntact ? s.group : "";
      if (Object.keys(upd).length > 1) updates.push(upd);
    } else if (rating > 0) {
      creates.push({ name: s.name, type: "skill", system: { type: "skill", skill: { category: "active", attribute: s.attribute, rating, specializations: specs, requirement: s.requirement, defaulting: true, group: groupIntact ? s.group : "" } } });
    }
  }
  for (const g of intactGroups) {
    let data = null;
    const entry = groupIndex?.find(e => e.name.toLowerCase() === g.name.toLowerCase());
    if (entry) data = (await groupPack.getDocument(entry._id))?.toObject();
    if (!data) data = { name: g.name, type: "skill", system: { type: "group", group: { skills: g.skills } } };
    delete data._id;
    foundry.utils.setProperty(data, "system.group.rating", g.value);
    creates.push(data);
  }
  for (const k of c.knowledge) {
    if (!k.name?.trim() || k.value <= 0) continue;
    creates.push({ name: k.name.trim(), type: "skill", system: { type: "skill", skill: { category: "knowledge", knowledgeType: k.type, attribute: KNOWLEDGE_TYPES[k.type]?.attribute ?? "logic", rating: k.value, specializations: k.spec ? [{ name: k.spec }] : [], defaulting: false } } });
  }
  for (const l of c.languages) {
    if (!l.name?.trim()) continue;
    if (!l.native && l.value <= 0) continue;
    creates.push({ name: l.name.trim(), type: "skill", system: { type: "skill", skill: { category: "language", attribute: "intuition", rating: l.native ? 0 : l.value, language: { isNative: !!l.native }, defaulting: false } } });
  }
  if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
  if (creates.length) await actor.createEmbeddedDocuments("Item", creates);
}
