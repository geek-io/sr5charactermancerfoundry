/**
 * Draft and save handling.
 *
 * Drafts: each user's work in progress is stored on that user's own User document as a JSON string,
 * tagged with the owner's id. A draft that belongs to another user is never loaded.
 * Saves: "Save to chat" posts a chat card carrying a copy of the build; anyone can open it in
 * their own Charactermancer, which loads it as their own draft.
 */
import { MODULE_ID } from "./apply.js";
import { migrateState, compute } from "./engine.js";
import { METHODS } from "./data/rules.js";

const KEY = "draftJson";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Load the current user's draft (never another user's). */
export function loadDraft() {
  const user = game.user;
  let data = null;
  const raw = user.getFlag(MODULE_ID, KEY);
  if (typeof raw === "string") { try { data = JSON.parse(raw); } catch { data = null; } }
  if (!data) {
    // v0.1.0–0.1.3 stored the draft as an object under "draft".
    const legacy = user.getFlag(MODULE_ID, "draft");
    if (legacy && typeof legacy === "object") data = foundry.utils.deepClone(legacy);
  }
  if (data?.owner && data.owner !== user.id) data = null;
  const state = migrateState(data);
  state.owner = user.id;
  return state;
}

/** Store the draft on the current user, replacing the previous one entirely. */
export async function saveDraft(state) {
  const data = { ...foundry.utils.deepClone(state), owner: game.user.id };
  await game.user.setFlag(MODULE_ID, KEY, JSON.stringify(data));
  if (game.user.getFlag(MODULE_ID, "draft") !== undefined) await game.user.unsetFlag(MODULE_ID, "draft");
}

export async function clearDraft() {
  if (game.user.getFlag(MODULE_ID, KEY) !== undefined) await game.user.unsetFlag(MODULE_ID, KEY);
  if (game.user.getFlag(MODULE_ID, "draft") !== undefined) await game.user.unsetFlag(MODULE_ID, "draft");
}

/** A copy of a saved build, made the current user's own. */
export function adoptBuild(build) {
  const state = migrateState(foundry.utils.deepClone(build));
  state.owner = game.user.id;
  state.startingNuyen = state.startingNuyen ?? null;
  return state;
}

/** Post the build to chat as a save card. */
export async function postSave(state) {
  const c = compute(state);
  const data = { ...foundry.utils.deepClone(state), owner: game.user.id };
  const name = state.name?.trim() || "Unnamed runner";
  const when = new Date().toLocaleString();
  const lines = [
    `${esc(METHODS[state.method]?.label ?? state.method)} · ${esc(c.level.label)}`,
    `${esc(c.meta.label)} · ${esc(c.awakened.label)}`,
    `Karma left ${c.karma.left} · ${c.errors.length ? `${c.errors.length} issue${c.errors.length === 1 ? "" : "s"} to fix` : "ready to create"}`
  ];
  const content = `<div class="sr5cm-chat">
    <header><i class="fa-solid fa-floppy-disk"></i> Charactermancer save</header>
    <h3>${esc(name)}</h3>
    ${lines.map(l => `<p>${l}</p>`).join("")}
    <p class="sr5cm-chat-meta">Saved by ${esc(game.user.name)}, ${esc(when)}</p>
    <button type="button" data-sr5cm-open data-tooltip="Open a copy of this build in your Charactermancer"><i class="fa-solid fa-user-plus"></i> Open in Charactermancer</button>
  </div>`;
  return ChatMessage.implementation.create({
    content,
    speaker: ChatMessage.implementation.getSpeaker({ user: game.user }),
    flags: { [MODULE_ID]: { build: data, savedBy: game.user.id } }
  });
}
