import { h, screen, bruno, backButton } from "../ui.js";
import { markVisited, isQuizUnlocked, isZoneUnlocked, visitedCount } from "../progress.js";
import { animalsInZone } from "../data/animals.js";

export function render(root, ctx) {
  const { zoneId, quiet = false } = ctx.params;
  const zone = ctx.data.ZONES.find((z) => z.id === zoneId);
  if (!zone || !isZoneUnlocked(ctx.state, zone)) return ctx.navigate("map");

  const animals = animalsInZone(zoneId);
  const quizReady = isQuizUnlocked(ctx.state, zoneId, ctx.data.ANIMALS);

  const openCard = (animal) => {
    const wasReady = isQuizUnlocked(ctx.state, zoneId, ctx.data.ANIMALS);
    ctx.update((s) => markVisited(s, animal.id));
    const justUnlocked = !wasReady && isQuizUnlocked(ctx.state, zoneId, ctx.data.ANIMALS);

    const name = ctx.localized(animal.name);
    const fact = ctx.localized(animal.fact);
    const line = animal.sound ? fact : `${ctx.t("quietAnimal")} ${fact}`;
    const close = () => ctx.navigate("zone", { zoneId, quiet: !justUnlocked });

    const closeBtn = h("button", { "aria-label": ctx.t("close"), onclick: close }, "✖️");
    const overlay = h(
      "div",
      {
        class: "card-overlay",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": name,
        onclick: (e) => { if (e.target === overlay) close(); },
        onkeydown: (e) => { if (e.key === "Escape") close(); },
      },
      h("div", { class: "card" },
        h("div", { class: "big-emoji", "aria-hidden": "true" }, animal.emoji),
        h("p", { class: "name" }, name),
        bruno(ctx, line, { speakNow: false }),
        h("div", { class: "row" },
          animal.sound
            ? h("button", { "aria-label": ctx.t("playSound"), onclick: () => ctx.audio.playSound(animal.sound) }, "🔊")
            : null,
          h("button", { "aria-label": ctx.t("sayName"), onclick: () => ctx.audio.speak(name) }, "🗣️"),
          closeBtn)),
    );
    root.append(overlay);
    closeBtn.focus();
    ctx.audio.playSound(animal.sound).then(() => {
      if (overlay.isConnected) ctx.audio.speak(`${name}. ${line}`);
    });
  };

  const tiles = animals.map((animal) => {
    const seen = Boolean(ctx.state.visited[animal.id]);
    const name = ctx.localized(animal.name);
    return h(
      "button",
      { class: "animal-btn", "aria-label": seen ? `${name}, ${ctx.t("visited")}` : name, onclick: () => openCard(animal) },
      h("span", { "aria-hidden": "true" }, animal.emoji),
      seen ? h("span", { class: "check", "aria-hidden": "true" }, "✓") : null,
    );
  });

  const quizButton = quizReady
    ? h("button", { class: "btn-primary", onclick: () => ctx.navigate("quiz", { zoneId }) }, `❓ ${ctx.t("quiz")}`)
    : h("button", { class: "btn-primary", disabled: true },
        `🔒 ${ctx.t("quizLocked", { n: visitedCount(ctx.state, zoneId, ctx.data.ANIMALS) })}`);

  root.append(
    screen(
      h("div", { class: "topbar" }, backButton(ctx, "map")),
      h("h1", { tabindex: "-1" }, `${zone.emoji} ${ctx.localized(zone.name)}`),
      bruno(ctx, ctx.t(quizReady ? "brunoQuizReady" : "brunoZone"), { speakNow: !quiet }),
      h("div", { class: "grid" }, tiles),
      h("div", { class: "row" }, quizButton),
    ),
  );
}
