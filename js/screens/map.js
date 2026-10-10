import { h, screen, bruno, starsText } from "../ui.js";
import { isZoneUnlocked, totalStars } from "../progress.js";

export function render(root, ctx) {
  const { state } = ctx;
  const brunoEl = bruno(ctx, ctx.t("brunoMap"));

  const tiles = ctx.data.ZONES.map((zone) => {
    const name = ctx.localized(zone.name);
    const unlocked = isZoneUnlocked(state, zone);
    const best = state.bestStars[zone.id] ?? 0;
    const lockedLine = ctx.t("lockedZone", { zone: name, n: zone.threshold });
    return h(
      "button",
      {
        class: unlocked ? "zone-tile" : "zone-tile locked",
        style: `--zone-color: ${zone.color}`,
        "aria-label": unlocked ? `${name}, ${ctx.t("bestStarsLabel", { n: best })}` : lockedLine,
        onclick: () => (unlocked ? ctx.navigate("zone", { zoneId: zone.id }) : brunoEl.say(lockedLine)),
      },
      h("span", { class: "emoji", "aria-hidden": "true" }, unlocked ? zone.emoji : "🔒"),
      h("span", { "aria-hidden": "true" }, name),
      h("span", { class: "sub", "aria-hidden": "true" },
        unlocked ? starsText(best) : ctx.t("starsNeeded", { n: zone.threshold })),
    );
  });

  root.append(
    screen(
      h("div", { class: "topbar" },
        h("button", { "aria-label": ctx.t("back"), onclick: () => ctx.navigate("welcome") }, "⬅️"),
        h("span", { class: "pill" }, `⭐ ${ctx.t("totalStars", { n: totalStars(state) })}`),
        h("div", { class: "row" },
          h("button", { "aria-label": ctx.t("stickerBook"), onclick: () => ctx.navigate("stickers") }, "📒"),
          h("button", { "aria-label": ctx.t("settings"), onclick: () => ctx.navigate("settings") }, "⚙️"))),
      h("h1", { tabindex: "-1" }, ctx.t("mapTitle")),
      brunoEl,
      h("div", { class: "grid" }, tiles),
    ),
  );
}
