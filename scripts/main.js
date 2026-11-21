import { Charactermancer } from "./app.js";
import { MODULE_ID, createActor, handleSocket, SOCKET } from "./apply.js";
import { compute, defaultState } from "./engine.js";
import { loadCatalog } from "./catalog.js";
import { adoptBuild } from "./storage.js";

let app = null;

async function open(options = {}) {
  if (game.system.id !== "shadowrun5e") {
    ui.notifications.error("The Shadowrun 5e Charactermancer needs the Shadowrun 5th Edition system.");
    return null;
  }
  if (options.state) {
    const current = app?.build;
    const hasWork = current && (current.name?.trim() || current.priorities && Object.values(current.priorities).some(Boolean) || (current.lifeModules?.nationality ?? []).length);
    if (hasWork) {
      const name = options.state.name?.trim() || "this build";
      const ok = await foundry.applications.api.DialogV2.confirm({
        window: { title: "Open saved build?" },
        content: `<p>Replace your current build${current.name ? ` (<strong>${foundry.utils.escapeHTML(current.name)}</strong>)` : ""} with a copy of <strong>${foundry.utils.escapeHTML(name)}</strong>?</p><p>Save your current build to chat first if you want to keep it.</p>`
      });
      if (!ok) return app;
    }
    if (app?.rendered) await app.close();
    app = new Charactermancer({ state: options.state });
  } else if (!app) app = new Charactermancer(options);
  app.render(true);
  return app;
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "playersCanUse", {
    name: "Players can open the Charactermancer",
    hint: "Show the Charactermancer button to players. Players without the \"Create New Actors\" permission build their character and a connected Gamemaster's client creates it for them, owned by that player.",
    scope: "world", config: true, type: Boolean, default: true,
    onChange: () => ui.actors?.render()
  });
});

Hooks.once("ready", () => {
  const mod = game.modules.get(MODULE_ID);
  mod.api = { open, compute, defaultState, createActor };
  game.socket.on(SOCKET, handleSocket);
  ui.actors?.render();
  if (game.user.isGM) loadCatalog().catch(() => {});
});

function canUse() {
  if (game.system.id !== "shadowrun5e") return false;
  if (game.user.isGM) return true;
  return game.settings.get(MODULE_ID, "playersCanUse");
}

// Chat save cards: "Open in Charactermancer" loads a copy of the saved build for whoever clicks it.
Hooks.on("renderChatMessageHTML", (message, html) => {
  const build = message.getFlag?.(MODULE_ID, "build");
  if (!build) return;
  const btn = html.querySelector?.("[data-sr5cm-open]");
  if (!btn) return;
  if (!canUse()) { btn.disabled = true; btn.dataset.tooltip = "The GM has not enabled the Charactermancer for players."; return; }
  btn.addEventListener("click", (ev) => { ev.preventDefault(); open({ state: build }); });
});

Hooks.on("renderActorDirectory", (directory, html) => {
  if (!canUse()) return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector(".sr5cm-open")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sr5cm-open";
  btn.innerHTML = `<i class="fa-solid fa-user-plus"></i> Charactermancer`;
  btn.addEventListener("click", (ev) => { ev.preventDefault(); open(); });
  const actions = root.querySelector(".header-actions") ?? root.querySelector(".directory-header");
  if (actions) actions.append(btn);
});
