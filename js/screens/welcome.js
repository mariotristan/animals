import { h, screen, bruno, languageToggle } from "../ui.js";

export function render(root, ctx) {
  root.append(
    screen(
      h("h1", { tabindex: "-1" }, `🦁 ${ctx.t("appTitle")} 🐘`),
      bruno(ctx, ctx.t("brunoWelcome")),
      languageToggle(ctx, { onChange: () => ctx.audio.speak(ctx.t("brunoWelcome")) }),
      h("div", { class: "row" },
        h("button", { class: "btn-primary", onclick: () => ctx.navigate("map") }, `▶️ ${ctx.t("play")}`)),
    ),
  );
}
