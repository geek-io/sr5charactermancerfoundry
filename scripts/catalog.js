/**
 * Item catalog built from every Item compendium that targets the shadowrun5e system
 * (the system's own packs, the Shadowrun 5e Compendium module, and any others), plus world items.
 */
const FIELDS = [
  "type", "img", "system.karma", "system.type", "system.pp", "system.level", "system.essence", "system.grade",
  "system.technology.cost", "system.technology.availability", "system.technology.rating", "system.category",
  "system.range", "system.duration", "system.drain", "system.combat.type", "system.fade"
];

let cache = null;
let loading = null;

export const GEAR_TYPES = ["weapon", "armor", "ammo", "equipment", "device", "cyberware", "bioware", "program", "modification", "sin"];
export const MAGIC_TYPES = ["spell", "ritual", "complex_form", "adept_power"];

function entryFrom(doc, packLabel) {
  const sys = doc.system ?? {};
  return {
    uuid: doc.uuid,
    name: doc.name,
    type: doc.type,
    img: doc.img,
    source: packLabel,
    book: typeof sys.description === "object" ? (sys.description?.source ?? "") : "",
    karma: Number(sys.karma ?? 0),
    qtype: sys.type,
    pp: Number(sys.pp ?? 0),
    essence: Number(sys.essence ?? 0),
    cost: Number(sys.technology?.cost ?? 0),
    avail: sys.technology?.availability ?? "",
    rating: Number(sys.technology?.rating ?? 0),
    category: typeof sys.category === "string" ? sys.category : "",
    range: typeof sys.range === "string" ? sys.range : "",
    duration: typeof sys.duration === "string" ? sys.duration : "",
    drain: Number.isFinite(Number(sys.drain)) && typeof sys.drain !== "object" ? Number(sys.drain) : null,
    fade: Number.isFinite(Number(sys.fade)) && typeof sys.fade !== "object" ? Number(sys.fade) : null,
    combatType: typeof sys.combat === "object" ? (sys.combat?.type ?? "") : ""
  };
}

export async function loadCatalog(force = false) {
  if (cache && !force) return cache;
  if (loading && !force) return loading;
  loading = (async () => {
    const list = [];
    for (const pack of game.packs) {
      if (pack.documentName !== "Item") continue;
      if (pack.metadata.system && pack.metadata.system !== "shadowrun5e") continue;
      if (["sr5e-skills", "sr5e-skill-groups", "sr5e-skill-sets"].includes(pack.metadata.name)) continue;
      if (!pack.visible) continue;
      try {
        const index = await pack.getIndex({ fields: FIELDS });
        for (const e of index) {
          const doc = { ...e, uuid: e.uuid ?? `Compendium.${pack.collection}.Item.${e._id}` };
          list.push(entryFrom(doc, pack.metadata.label));
        }
      } catch (err) {
        console.warn(`sr5charactermancerfoundry | could not index ${pack.collection}`, err);
      }
    }
    for (const it of game.items ?? []) list.push(entryFrom(it, "World"));
    list.sort((a, b) => a.name.localeCompare(b.name));
    cache = list;
    loading = null;
    return list;
  })();
  return loading;
}

export function searchCatalog(list, { types = [], text = "", qtype = "", limit = 60, filter = null } = {}) {
  const t = text.trim().toLowerCase();
  const out = [];
  for (const e of list) {
    if (types.length && !types.includes(e.type)) continue;
    if (qtype && e.qtype !== qtype) continue;
    if (filter && !filter(e)) continue;
    if (t && !e.name.toLowerCase().includes(t) && !e.source.toLowerCase().includes(t) && !String(e.book).toLowerCase().includes(t)) continue;
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

/** Find a quality by name, tolerating the small naming differences between Run Faster text and the compendiums. */
export async function findQualityByName(name) {
  const list = await loadCatalog();
  const q = list.filter(e => e.type === "quality");
  const n = name.toLowerCase().trim();
  return q.find(e => e.name.toLowerCase() === n)
    ?? q.find(e => e.name.toLowerCase().replace(/[()]/g, "") === n.replace(/[()]/g, ""))
    ?? q.find(e => e.name.toLowerCase().startsWith(n.split(" (")[0]) && n.includes("(") === e.name.includes("("))
    ?? q.find(e => e.name.toLowerCase().startsWith(n.split(" (")[0]))
    ?? null;
}
