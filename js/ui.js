// Small DOM helpers shared by screens.
import { setLanguage } from "./progress.js";

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

export function screen(...children) {
  return h("section", { class: "screen" }, ...children);
}

export function starsText(n, max = 3) {
  return "⭐".repeat(n) + "☆".repeat(Math.max(0, max - n));
}

// Bruno with a speech bubble. Tap Bruno to hear the line again.
export function bruno(ctx, text, { speakNow = true } = {}) {
  const bubble = h("p", { class: "bubble", "aria-live": "polite" }, text);
  const face = h(
    "button",
    { class: "bruno-face", "aria-label": ctx.t("brunoRepeat"), onclick: () => ctx.audio.speak(bubble.textContent) },
    "🧑‍🌾",
  );
  const el = h("div", { class: "bruno" }, face, bubble);
  el.say = (line) => {
    bubble.textContent = line;
    return ctx.audio.speak(line);
  };
  if (speakNow && !ctx.quiet) ctx.audio.speak(text);
  return el;
}

export function backButton(ctx, to, params = {}) {
  return h("button", { "aria-label": ctx.t("back"), onclick: () => ctx.navigate(to, params) }, "⬅️");
}

export function languageToggle(ctx) {
  const option = (lang, label) =>
    h(
      "button",
      {
        lang,
        "data-focus": `lang-${lang}`,
        "aria-pressed": String(ctx.lang === lang),
        onclick: () => {
          ctx.update((s) => setLanguage(s, lang));
          ctx.rerender();
        },
      },
      label,
    );
  return h("div", { class: "row", role: "group", "aria-label": ctx.t("language") },
    option("en", "🇺🇸 English"), option("es", "🇪🇸 Español"));
}

export function stickerCard(ctx, animal, earned) {
  const name = ctx.localized(animal.name);
  return h(
    "div",
    { class: earned ? "sticker" : "sticker unknown", role: "img", "aria-label": earned ? name : ctx.t("unknownSticker") },
    h("span", { class: "emoji", "aria-hidden": "true" }, animal.emoji),
    h("span", { class: "label", "aria-hidden": "true" }, earned ? name : "?"),
  );
}
