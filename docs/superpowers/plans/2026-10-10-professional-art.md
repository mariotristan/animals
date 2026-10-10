# Professional Art and Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace device emoji in Bruno's Zoo with bundled Fluent 3D artwork (animals, zones, app icon) and flat Phosphor icons (buttons), so the game looks professional and identical on every device.

**Architecture:** Dev-only scripts download and convert the artwork once (`scripts/fetch-art.sh` → `art/**.webp`; `scripts/build-icons.js` → `js/icons-data.js`). Runtime helpers in `js/ui.js` (`art`, `animalArt`, `zoneArt`, `starsRow`) and `js/icons.js` (`icon`, `flag`) build DOM; screens call them instead of embedding emoji. Everything stays static files, precached by the service worker.

**Tech Stack:** Plain ES modules, CSS, `node --test` (Node 23), `cwebp` (Homebrew, dev-only), headless Chrome + `sips` (macOS, dev-only), Playwright at `/tmp/zoo-e2e` for manual verification.

**Spec:** `docs/superpowers/specs/2026-10-10-professional-art-design.md`

## Global Constraints

- No runtime dependencies, no build step for the game; generated files are committed.
- No network calls at runtime beyond the game's own files; all art is bundled under `art/`.
- Animal/zone art: Fluent Emoji 3D PNGs from `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/<Name>/3D/<name_snake>_3d.png`, converted to 256×256 WebP, each under 30 KB, at `art/animals/<id>.webp` and `art/zones/<id>.webp`.
- Button icons: Phosphor Icons 2.1.1 fill weight (star-empty uses regular weight), from `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/<weight>/<file>.svg`.
- MIT license texts committed at `art/LICENSE-fluentui-emoji.txt` and `art/LICENSE-phosphor-icons.txt`; credited in CREDITS.md and in-game Settings.
- Images are decorative (`alt=""`); controls keep localized `aria-label`s. Broken image → emoji fallback.
- Touch targets stay ≥ 64 px. Emoji inside Bruno's sentences (`encourage1`, `encourage2`, `encourageSound`) stay.
- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Work on branch `feat/pro-art`.

## Review Focus

1. **An image fails to load** (offline before caching, renamed file): the tile must show the emoji, not a broken-image icon or empty box — pinned in Task 3 (`art()` fallback; verified by a Playwright check blocking one image).
2. **Unearned stickers** must still read as mystery silhouettes with the new images, not reveal the animal — pinned in Task 4 (CSS filter on `.sticker.unknown .art`; screenshot check).
3. **Screen readers** must not announce image file names or icon junk — pinned in Task 3/4 (`alt=""`, `aria-hidden` on icons; existing `aria-label`s unchanged).
4. **A new emoji slipping back into a button** in a later change — pinned in Task 4 (emoji guard test over screen/UI source files).
5. **Installed iPads keep stale icons/art** after the update — pinned in Task 5 (`CACHE` bumped to `bruno-zoo-v2`; precache test covers `art/`).

**Plan deviation from spec (§4):** an SVG rendered as an image cannot load other images, so `icons/icon.svg` cannot reference the lion WebP. Instead `scripts/make-icons.sh` renders an HTML composition (orange radial gradient + `art/animals/lion.webp` at 64%) and `icons/icon.svg` is deleted. Same visual result as the approved design.

---

## File Structure

```
scripts/fetch-art.sh        NEW  downloads Fluent 3D PNGs → art/**.webp, fetches Fluent license
scripts/build-icons.js      NEW  downloads Phosphor SVGs → js/icons-data.js, fetches Phosphor license
art/animals/*.webp          NEW  36 animal pictures
art/zones/*.webp            NEW  6 zone pictures
art/LICENSE-*.txt           NEW  MIT notices
js/icons-data.js            NEW  generated: ICONS name → inner SVG markup
js/icons.js                 NEW  icon(name), flag(lang), FLAGS, ICON_NAMES
js/ui.js                    MOD  art/animalArt/zoneArt/starsRow; icons in backButton, languageToggle, stickerCard
js/screens/*.js             MOD  use art and icons instead of emoji
js/data/strings.js          MOD  starsNeeded without ⭐; artwork credit strings
css/style.css               MOD  .icon/.art/.flag/.stars-row sizing
scripts/make-icons.sh       MOD  HTML composition with the 3D lion
scripts/credits-md.js       MOD  Artwork section
icons/icon.svg              DEL
icons/icon-*.png            MOD  regenerated
index.html                  MOD  favicon → icons/icon-192.png
sw.js                       MOD  CACHE v2, precache art + new JS
tests/art.test.js           NEW
tests/icons.test.js         NEW
tests/pwa.test.js           MOD  art/ in precache expectation
tests/modules.test.js       MOD  starsText → starsRow
README.md                   MOD  layout + icon instructions + artwork credit
```

---

### Task 1: Bundled animal and zone artwork

**Files:**
- Create: `scripts/fetch-art.sh`, `art/animals/*.webp` (36), `art/zones/*.webp` (6), `art/LICENSE-fluentui-emoji.txt`, `tests/art.test.js`

**Interfaces:**
- Consumes: `ANIMALS`, `ZONES` ids from `js/data/animals.js`.
- Produces: files at `art/animals/<animal.id>.webp` and `art/zones/<zone.id>.webp` (used by Task 3's `art()` and Task 5's icon script).

- [ ] **Step 1: Write the failing test** — `tests/art.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { ANIMALS, ZONES } from "../js/data/animals.js";

const MAX_BYTES = 30 * 1024;

function assertWebp(path) {
  assert.ok(existsSync(path), `missing ${path}`);
  const bytes = readFileSync(path);
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", `${path} is not RIFF`);
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", `${path} is not WebP`);
  assert.ok(statSync(path).size < MAX_BYTES, `${path} is over 30 KB`);
}

test("every animal has a WebP picture under 30 KB", () => {
  for (const animal of ANIMALS) assertWebp(`art/animals/${animal.id}.webp`);
});

test("every zone has a WebP picture under 30 KB", () => {
  for (const zone of ZONES) assertWebp(`art/zones/${zone.id}.webp`);
});

test("the Fluent Emoji MIT license is included", () => {
  const text = readFileSync("art/LICENSE-fluentui-emoji.txt", "utf8");
  assert.match(text, /MIT License/);
  assert.match(text, /Microsoft/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/art.test.js`
Expected: FAIL — `missing art/animals/lion.webp`.

- [ ] **Step 3: Write `scripts/fetch-art.sh`**

```bash
#!/usr/bin/env bash
# Downloads the Fluent Emoji 3D artwork (MIT, Microsoft) and converts it to WebP.
# Dev-only: needs curl and cwebp (brew install webp). Run from the repo root:
#   bash scripts/fetch-art.sh
set -euo pipefail

BASE="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p art/animals art/zones

# kind|game id|Fluent asset name
MAP="
animals|lion|Lion
animals|elephant|Elephant
animals|zebra|Zebra
animals|hippo|Hippopotamus
animals|rhino|Rhinoceros
animals|giraffe|Giraffe
animals|monkey|Monkey
animals|gorilla|Gorilla
animals|parrot|Parrot
animals|tiger|Tiger
animals|snake|Snake
animals|frog|Frog
animals|dolphin|Dolphin
animals|whale|Spouting whale
animals|sea-lion|Seal
animals|shark|Shark
animals|octopus|Octopus
animals|sea-turtle|Turtle
animals|polar-bear|Polar bear
animals|penguin|Penguin
animals|arctic-wolf|Wolf
animals|arctic-fox|Fox
animals|reindeer|Deer
animals|snowy-owl|Owl
animals|cow|Cow
animals|pig|Pig
animals|sheep|Ewe
animals|horse|Horse
animals|chicken|Chicken
animals|duck|Duck
animals|bear|Bear
animals|raccoon|Raccoon
animals|squirrel|Chipmunk
animals|beaver|Beaver
animals|bee|Honeybee
animals|wild-turkey|Turkey
zones|savanna|Sheaf of rice
zones|jungle|Palm tree
zones|ocean|Water wave
zones|polar|Snowflake
zones|farm|Tractor
zones|forest|Evergreen tree
"

echo "$MAP" | while IFS='|' read -r kind id name; do
  [ -z "$kind" ] && continue
  folder=$(printf '%s' "$name" | sed 's/ /%20/g')
  file=$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')
  curl -sSfL --retry 3 -o "$TMP/$id.png" "$BASE/assets/$folder/3D/${file}_3d.png"
  cwebp -quiet -q 80 -resize 256 256 "$TMP/$id.png" -o "art/$kind/$id.webp"
  echo "art/$kind/$id.webp $(wc -c < "art/$kind/$id.webp" | tr -d ' ') bytes"
done

curl -sSfL --retry 3 -o art/LICENSE-fluentui-emoji.txt "$BASE/LICENSE"
echo "Wrote art/LICENSE-fluentui-emoji.txt"
```

- [ ] **Step 4: Run the script**

Run: `bash scripts/fetch-art.sh`
Expected: 42 lines `art/<kind>/<id>.webp <N> bytes`, each N < 30720, then the license line. If any file is ≥ 30720 bytes, re-run that one conversion with `-q 70`, and note it in the report.

- [ ] **Step 5: Look at a few results**

Open `art/animals/lion.webp`, `art/animals/sea-lion.webp`, `art/zones/ocean.webp` with the Read tool (it renders images) and confirm they are the expected 3D pictures on transparent backgrounds.

- [ ] **Step 6: Run tests — expect PASS**

Run: `npm test`
Expected: all pass (including the 3 new art tests). Note: `tests/pwa.test.js` does not yet list `art/`, so it still passes.

- [ ] **Step 7: Commit**

```bash
git add scripts/fetch-art.sh art tests/art.test.js
git commit -m "feat: bundle Fluent 3D artwork for animals and zones

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Icon module (Phosphor icons + drawn flags)

**Files:**
- Create: `scripts/build-icons.js`, `js/icons-data.js` (generated), `js/icons.js`, `art/LICENSE-phosphor-icons.txt`, `tests/icons.test.js`

**Interfaces:**
- Produces (`js/icons.js`):
  - `ICON_NAMES`: `["back","stickers","settings","sound","sayName","close","enter","playAgain","map","reset","quiz","lock","unlock","check","star","starEmpty","thumbsUp","thumbsDown","celebrate"]`
  - `icon(name) → SVGSVGElement` with class `icon icon-<name>`, `viewBox="0 0 256 256"`, `fill="currentColor"`, `aria-hidden="true"`, `focusable="false"`. Throws on unknown names.
  - `FLAGS: { en: string, es: string }` (complete `<svg>` markup) and `flag(lang) → SVGSVGElement` with class `flag`.
- Produces (`js/icons-data.js`): `ICONS: { [name]: string }` (inner SVG markup, e.g. `<path d="..."/>`).

- [ ] **Step 1: Write the failing test** — `tests/icons.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ICONS } from "../js/icons-data.js";
import { ICON_NAMES, FLAGS } from "../js/icons.js";

const external = /https?:|href=|<image|<script|on\w+=/i;

test("every icon the game uses exists as SVG path markup", () => {
  assert.deepEqual(Object.keys(ICONS).sort(), [...ICON_NAMES].sort());
  for (const name of ICON_NAMES) {
    assert.match(ICONS[name], /^<path /, `${name} starts with a path`);
    assert.doesNotMatch(ICONS[name], external, name);
  }
});

test("flags are self-contained SVGs for both languages", () => {
  for (const lang of ["en", "es"]) {
    assert.match(FLAGS[lang], /^<svg [^>]*viewBox="0 0 30 20"/, lang);
    assert.doesNotMatch(FLAGS[lang], external, lang);
  }
});

test("the Phosphor Icons MIT license is included", () => {
  const text = readFileSync("art/LICENSE-phosphor-icons.txt", "utf8");
  assert.match(text, /MIT License/);
  assert.match(text, /Phosphor Icons/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/icons.test.js`
Expected: FAIL — cannot find `js/icons-data.js`.

- [ ] **Step 3: Write `scripts/build-icons.js`**

```js
// Downloads the Phosphor icons the game uses and writes js/icons-data.js.
// Dev-only (needs network). Run from the repo root: node scripts/build-icons.js
import { writeFileSync } from "node:fs";

const VERSION = "2.1.1";
const BASE = `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@${VERSION}`;

// game icon name → [weight, Phosphor file name]
const ICONS = {
  back: ["fill", "arrow-fat-left-fill"],
  stickers: ["fill", "notebook-fill"],
  settings: ["fill", "gear-fill"],
  sound: ["fill", "speaker-high-fill"],
  sayName: ["fill", "user-sound-fill"],
  close: ["fill", "x-fill"],
  enter: ["fill", "play-fill"],
  playAgain: ["fill", "arrow-counter-clockwise-fill"],
  map: ["fill", "map-trifold-fill"],
  reset: ["fill", "trash-fill"],
  quiz: ["fill", "question-fill"],
  lock: ["fill", "lock-fill"],
  unlock: ["fill", "lock-open-fill"],
  check: ["fill", "check-fat-fill"],
  star: ["fill", "star-fill"],
  starEmpty: ["regular", "star"],
  thumbsUp: ["fill", "thumbs-up-fill"],
  thumbsDown: ["fill", "thumbs-down-fill"],
  celebrate: ["fill", "confetti-fill"],
};

async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response.text();
    if (attempt === 3) throw new Error(`${response.status} for ${url}`);
  }
}

const entries = [];
for (const [name, [weight, file]] of Object.entries(ICONS)) {
  const svg = await get(`${BASE}/assets/${weight}/${file}.svg`);
  const inner = svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>")).trim();
  entries.push(`  ${name}: ${JSON.stringify(inner)},`);
}

writeFileSync(
  "js/icons-data.js",
  `// Generated by scripts/build-icons.js from Phosphor Icons ${VERSION} (MIT). Do not edit.
export const ICONS = {
${entries.join("\n")}
};
`,
);
writeFileSync("art/LICENSE-phosphor-icons.txt", await get(`${BASE}/LICENSE`));
console.log(`Wrote js/icons-data.js (${entries.length} icons) and art/LICENSE-phosphor-icons.txt`);
```

- [ ] **Step 4: Run it**

Run: `node scripts/build-icons.js`
Expected: `Wrote js/icons-data.js (19 icons) and art/LICENSE-phosphor-icons.txt`. Spot-check `js/icons-data.js`: each value begins with `<path d="`.

- [ ] **Step 5: Write `js/icons.js`**

```js
// Button icons (Phosphor, MIT) and small drawn flags. Icons take the button's text color.
import { ICONS } from "./icons-data.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export const ICON_NAMES = [
  "back", "stickers", "settings", "sound", "sayName", "close", "enter", "playAgain", "map",
  "reset", "quiz", "lock", "unlock", "check", "star", "starEmpty", "thumbsUp", "thumbsDown",
  "celebrate",
];

// Simplified flags drawn for the language buttons (flag emoji show as letters on Windows).
export const FLAGS = {
  en: `<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#b22234"/><g fill="#fff"><rect y="2.86" width="30" height="2.86"/><rect y="8.57" width="30" height="2.86"/><rect y="14.29" width="30" height="2.86"/></g><rect width="13" height="11.43" fill="#3c3b6e"/><g fill="#fff"><circle cx="3" cy="3" r="1"/><circle cx="6.5" cy="3" r="1"/><circle cx="10" cy="3" r="1"/><circle cx="4.75" cy="5.7" r="1"/><circle cx="8.25" cy="5.7" r="1"/><circle cx="3" cy="8.4" r="1"/><circle cx="6.5" cy="8.4" r="1"/><circle cx="10" cy="8.4" r="1"/></g></svg>`,
  es: `<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#c60b1e"/><rect y="5" width="30" height="10" fill="#ffc400"/></svg>`,
};

function svgFrom(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

export function icon(name) {
  if (!Object.hasOwn(ICONS, name)) throw new Error(`Unknown icon: ${name}`);
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 256 256");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("class", `icon icon-${name}`);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.innerHTML = ICONS[name];
  return svg;
}

export function flag(lang) {
  const svg = svgFrom(FLAGS[lang]);
  svg.setAttribute("class", "flag");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  return svg;
}
```

- [ ] **Step 6: Run tests — expect PASS**

Run: `npm test`

- [ ] **Step 7: Commit**

```bash
git add scripts/build-icons.js js/icons-data.js js/icons.js art/LICENSE-phosphor-icons.txt tests/icons.test.js
git commit -m "feat: add Phosphor button icons and drawn flags

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: UI helpers, base CSS, and the Welcome, Map, and Zone screens

**Files:**
- Modify: `js/ui.js`, `css/style.css`, `js/data/strings.js` (`starsNeeded`), `js/screens/welcome.js`, `js/screens/map.js`, `js/screens/zone.js`, `tests/modules.test.js`

**Interfaces:**
- Consumes: `icon(name)`, `flag(lang)` (Task 2); art files (Task 1).
- Produces (`js/ui.js`):
  - `art(kind, item, className = "art") → HTMLImageElement` — `src="art/<kind>/<item.id>.webp"`, `alt=""`; on load error replaces itself with `<span class="<className> art-fallback" aria-hidden="true">item.emoji</span>`.
  - `animalArt(animal, className?)`, `zoneArt(zone, className?)` — shorthands for `art("animals", …)` / `art("zones", …)`.
  - `starsRow(n, max = 3) → <span class="stars-row">` of `icon("star")` × n then `icon("starEmpty")`.
  - `starsText` is kept in this task (results.js still uses it) and removed in Task 4.
  - `backButton`, `languageToggle`, `stickerCard` now use icons / flags / art.

- [ ] **Step 1: Update `tests/modules.test.js` for the new helper (failing first)**

Replace the second test with:

```js
test("main.js and ui.js load without a DOM", async () => {
  const main = await import("../js/main.js");
  assert.equal(typeof main.start, "function");
  const ui = await import("../js/ui.js");
  for (const name of ["art", "animalArt", "zoneArt", "starsRow"]) {
    assert.equal(typeof ui[name], "function", name);
  }
});
```

Run: `node --test tests/modules.test.js` → FAIL (`art` is not a function).

- [ ] **Step 2: Update `js/ui.js`**

Add the import below the existing imports:

```js
import { icon, flag } from "./icons.js";
```

Add after `screen(...)`:

```js
// A bundled picture of an animal or zone. Falls back to the emoji if the file can't load.
export function art(kind, item, className = "art") {
  const img = h("img", {
    class: className,
    src: `art/${kind}/${item.id}.webp`,
    alt: "",
    width: "256",
    height: "256",
    decoding: "async",
    draggable: "false",
  });
  img.addEventListener(
    "error",
    () => img.replaceWith(h("span", { class: `${className} art-fallback`, "aria-hidden": "true" }, item.emoji)),
    { once: true },
  );
  return img;
}

export const animalArt = (animal, className) => art("animals", animal, className);
export const zoneArt = (zone, className) => art("zones", zone, className);

export function starsRow(n, max = 3) {
  return h("span", { class: "stars-row", "aria-hidden": "true" },
    Array.from({ length: max }, (_, i) => icon(i < n ? "star" : "starEmpty")));
}
```

Replace `backButton`:

```js
export function backButton(ctx, to, params = {}) {
  return h("button", { "aria-label": ctx.t("back"), onclick: () => ctx.navigate(to, params) }, icon("back"));
}
```

In `languageToggle`, change the `option` signature and calls so labels get a flag:

```js
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
          onChange?.();
        },
      },
      flag(lang),
      label,
    );
  return h("div", { class: "row", role: "group", "aria-label": ctx.t("language") },
    option("en", "English"), option("es", "Español"));
```

Replace `stickerCard`:

```js
export function stickerCard(ctx, animal, earned) {
  const name = ctx.localized(animal.name);
  return h(
    "div",
    { class: earned ? "sticker" : "sticker unknown", role: "img", "aria-label": earned ? name : ctx.t("unknownSticker") },
    animalArt(animal),
    h("span", { class: "label", "aria-hidden": "true" }, earned ? name : "?"),
  );
}
```

- [ ] **Step 3: Update `starsNeeded` in `js/data/strings.js`**

```js
  starsNeeded: { en: "Need {n}", es: "Necesitas {n}" },
```

- [ ] **Step 4: Replace `js/screens/welcome.js` gate toppers and Enter label**

Change the import line to:

```js
import { h, screen, bruno, languageToggle, svgElement, animalArt } from "../ui.js";
import { GATE_SVG } from "../entrance.js";
import { getAnimal } from "../data/animals.js";
import { icon } from "../icons.js";
```

Replace the two topper spans and the Enter button inside `gate` with:

```js
    animalArt(getAnimal("lion"), "gate-topper gate-topper-left"),
    animalArt(getAnimal("elephant"), "gate-topper gate-topper-right"),
    h("h1", { class: "gate-sign", tabindex: "-1" }, ctx.t("appTitle")),
    h("button", { class: "btn-primary gate-enter", onclick: enter }, icon("enter"), ctx.t("enter")),
```

- [ ] **Step 5: Replace `js/screens/map.js`**

```js
import { h, screen, bruno, starsRow, zoneArt } from "../ui.js";
import { isZoneUnlocked, totalStars } from "../progress.js";
import { icon } from "../icons.js";

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
      unlocked ? zoneArt(zone) : icon("lock"),
      h("span", { "aria-hidden": "true" }, name),
      h("span", { class: "sub", "aria-hidden": "true" },
        unlocked ? starsRow(best) : [ctx.t("starsNeeded", { n: zone.threshold }), icon("star")]),
    );
  });

  root.append(
    screen(
      h("div", { class: "topbar" },
        h("button", { "aria-label": ctx.t("back"), onclick: () => ctx.navigate("welcome") }, icon("back")),
        h("span", { class: "pill" }, icon("star"), ctx.t("totalStars", { n: totalStars(state) })),
        h("div", { class: "row" },
          h("button", { "aria-label": ctx.t("stickerBook"), onclick: () => ctx.navigate("stickers") }, icon("stickers")),
          h("button", { "aria-label": ctx.t("settings"), onclick: () => ctx.navigate("settings") }, icon("settings")))),
      h("h1", { tabindex: "-1" }, ctx.t("mapTitle")),
      brunoEl,
      h("div", { class: "grid" }, tiles),
    ),
  );
}
```

- [ ] **Step 6: Edit `js/screens/zone.js`**

Change the import line to:

```js
import { h, screen, bruno, backButton, animalArt, zoneArt } from "../ui.js";
import { markVisited, isQuizUnlocked, isZoneUnlocked, visitedCount } from "../progress.js";
import { animalsInZone } from "../data/animals.js";
import { icon } from "../icons.js";
```

Make these exact replacements:

| Find | Replace with |
|---|---|
| `h("button", { "aria-label": ctx.t("close"), onclick: close }, "✖️")` | `h("button", { "aria-label": ctx.t("close"), onclick: close }, icon("close"))` |
| `h("div", { class: "big-emoji", "aria-hidden": "true" }, animal.emoji),` | `animalArt(animal, "art art-big"),` |
| `onclick: () => ctx.audio.playSound(animal.sound) }, "🔊")` | `onclick: () => ctx.audio.playSound(animal.sound) }, icon("sound"))` |
| `onclick: () => ctx.audio.speak(name) }, "🗣️"),` | `onclick: () => ctx.audio.speak(name) }, icon("sayName")),` |
| `h("span", { "aria-hidden": "true" }, animal.emoji),` | `animalArt(animal),` |
| `seen ? h("span", { class: "check", "aria-hidden": "true" }, "✓") : null,` | `seen ? h("span", { class: "check", "aria-hidden": "true" }, icon("check")) : null,` |
| `` `❓ ${ctx.t("quiz")}`) `` | `icon("quiz"), ctx.t("quiz"))` |
| `` `🔒 ${lockedLine}`); `` | `icon("lock"), lockedLine);` |
| `` h("h1", { tabindex: "-1" }, `${zone.emoji} ${ctx.localized(zone.name)}`), `` | `h("h1", { tabindex: "-1" }, zoneArt(zone, "art title-art"), ctx.localized(zone.name)),` |

- [ ] **Step 7: Add CSS to `css/style.css`**

Make `button` lay out icon + text: in the existing `button { ... }` rule add these three lines:

```css
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
```

Replace `.zone-tile .emoji { font-size: 64px; line-height: 1.1; }` with:

```css
.zone-tile .art, .zone-tile .icon-lock { width: 72px; height: 72px; }
```

Replace `.animal-btn { position: relative; min-height: 150px; font-size: 96px; line-height: 1; }` with:

```css
.animal-btn { position: relative; min-height: 150px; font-size: 96px; line-height: 1; }
.animal-btn .art { width: 108px; height: 108px; }
```

Replace `.card .big-emoji { font-size: 128px; line-height: 1; }` with:

```css
.card .art-big { width: 150px; height: 150px; font-size: 128px; }
```

Replace `.gate-topper { position: absolute; bottom: 71.8%; font-size: 9cqw; line-height: 1; transform: translateX(-50%); }` with:

```css
.gate-topper { position: absolute; bottom: 71.8%; width: 13cqw; height: 13cqw; font-size: 9cqw; line-height: 1; transform: translateX(-50%); }
```

Append at the end of the "Grids and tiles" area (after the `.animal-btn .check` rule):

```css
/* Bundled artwork and icons */
.art { display: block; object-fit: contain; user-select: none; }
.art-fallback { display: inline-grid; place-items: center; line-height: 1; }
.icon { width: 1.25em; height: 1.25em; flex: none; }
button > .icon { width: 1.4em; height: 1.4em; }
.title-art { display: inline-block; width: 1.3em; height: 1.3em; vertical-align: -0.28em; margin-right: 0.3em; }
.flag { width: 30px; height: 20px; border-radius: 3px; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15); flex: none; }
.stars-row { display: inline-flex; gap: 2px; vertical-align: middle; }
.stars-row .icon { width: 1em; height: 1em; }
.icon-star { color: #f4b400; }
.icon-starEmpty { color: #b9a68a; }
.pill { display: inline-flex; align-items: center; gap: 6px; }
.zone-tile .sub { display: inline-flex; align-items: center; gap: 4px; }
.animal-btn .check .icon { width: 22px; height: 22px; }
```

In the `@media (max-width: 480px)` block, replace `.animal-btn { min-height: 120px; font-size: 76px; }` with:

```css
  .animal-btn { min-height: 120px; font-size: 76px; }
  .animal-btn .art { width: 84px; height: 84px; }
```

and replace `.card .big-emoji { font-size: 96px; }` with:

```css
  .card .art-big { width: 112px; height: 112px; font-size: 96px; }
```

- [ ] **Step 8: Run tests — expect PASS**

Run: `npm test`

- [ ] **Step 9: Browser check (Playwright, outside the repo)**

Serve with `python3 -m http.server 8768` (background) from the repo root. Write `/tmp/zoo-e2e/art-t3.mjs` that, with `serviceWorkers: "block"` and a seeded save `{version:1, lang:"en", settings:{sfx:false, voice:false}, visited:{}, bestStars:{savanna:3}, stickers:{}}`, at 1024×768 and 390×844: screenshots Welcome, taps `.gate-enter`, screenshots Map, opens Savanna, screenshots the zone, opens the lion card, screenshots it. Also: route `**/art/animals/zebra.webp` to abort (`page.route(..., r => r.abort())`) and assert the zebra tile contains `.art-fallback` with text `🦓`. Collect page errors (expect none). Look at the screenshots with the Read tool: art visible, icons crisp, flags drawn, gate toppers are 3D lion/elephant, title has the zone picture. Kill the server.

- [ ] **Step 10: Commit**

```bash
git add js/ui.js css/style.css js/data/strings.js js/screens/welcome.js js/screens/map.js js/screens/zone.js tests/modules.test.js
git commit -m "feat: use artwork and icons on welcome, map, and zone screens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Quiz, Results, Sticker Book, Settings screens + emoji guard

**Files:**
- Modify: `js/screens/quiz.js`, `js/screens/results.js`, `js/screens/stickers.js`, `js/screens/settings.js`, `js/ui.js` (remove `starsText`), `css/style.css`
- Create: `tests/emoji-guard.test.js`

**Interfaces:**
- Consumes: `art`, `animalArt`, `zoneArt`, `starsRow`, `stickerCard` (Task 3); `icon` (Task 2).
- Produces: no emoji glyphs left in `js/ui.js`, `js/entrance.js`, `js/screens/*.js`.

- [ ] **Step 1: Write the failing guard test** — `tests/emoji-guard.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// Emoji used to be placed directly in buttons, tiles, and titles. They're now icons or artwork.
// Text emoji inside Bruno's sentences live in js/data/strings.js and are allowed.
const FILES = ["js/ui.js", "js/entrance.js", ...readdirSync("js/screens").map((f) => `js/screens/${f}`)];
const EMOJI = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[⭐☆✓✖▶]/u;

test("screens and UI helpers contain no emoji glyphs", () => {
  for (const file of FILES) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      assert.doesNotMatch(line, EMOJI, `${file}:${i + 1} still has an emoji: ${line.trim()}`);
    });
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/emoji-guard.test.js`
Expected: FAIL naming `js/ui.js` (the `starsText` line) and the four screens.

- [ ] **Step 3: Replace `js/screens/quiz.js` emoji**

Change the import line to:

```js
import { h, screen, bruno, backButton, animalArt, zoneArt } from "../ui.js";
import { buildQuiz, scoreAttempt, createSession, currentQuestion, answer, advance, isFinished } from "../quiz.js";
import { isQuizUnlocked, recordQuizResult, newStickerIds, newlyUnlockedZones } from "../progress.js";
import { getAnimal } from "../data/animals.js";
import { icon } from "../icons.js";
```

Replace `choiceButton` with:

```js
  const choiceButton = (q, choice) => {
    if (q.type === "truefalse") {
      return h("button", { class: "choice" }, icon(choice ? "thumbsUp" : "thumbsDown"), ctx.t(choice ? "true" : "false"));
    }
    const animal = getAnimal(choice);
    const name = ctx.localized(animal.name);
    return h("button", { class: "choice", "aria-label": name },
      animalArt(animal),
      q.type === "sound" ? h("span", { "aria-hidden": "true" }, name) : null);
  };
```

Make these exact replacements:

| Find | Replace with |
|---|---|
| `onclick: () => ctx.audio.playSound(animal.sound) }, "🔊"))` | `onclick: () => ctx.audio.playSound(animal.sound) }, icon("sound")))` |
| `? h("div", { class: "question-visual", "aria-hidden": "true" }, animal.emoji)` | `? h("div", { class: "question-visual", "aria-hidden": "true" }, animalArt(animal))` |
| `` h("h1", { tabindex: "-1" }, `${zone.emoji} ${ctx.t("quiz")}`), `` | `h("h1", { tabindex: "-1" }, zoneArt(zone, "art title-art"), ctx.t("quiz")),` |

- [ ] **Step 4: Replace `js/screens/results.js`**

```js
import { h, screen, bruno, starsRow, stickerCard } from "../ui.js";
import { getAnimal } from "../data/animals.js";
import { icon } from "../icons.js";

export function render(root, ctx) {
  const { zoneId, stars, newStickers = [], unlocked = [] } = ctx.params;
  if (!zoneId || ![1, 2, 3].includes(stars)) return ctx.navigate("map");

  const zoneName = (id) => ctx.localized(ctx.data.ZONES.find((z) => z.id === id).name);

  root.append(
    screen(
      h("h1", { tabindex: "-1" }, icon("celebrate"), ctx.t("resultsTitle")),
      bruno(ctx, [
        ctx.t(`brunoResults${stars}`),
        newStickers.length ? ctx.t("newStickers") : null,
        ...unlocked.map((id) => ctx.t("zoneUnlocked", { zone: zoneName(id) })),
      ].filter(Boolean).join(" ")),
      h("div", { class: "stars", role: "img", "aria-label": ctx.t("bestStarsLabel", { n: stars }) }, starsRow(stars)),
      newStickers.length
        ? [h("h2", {}, ctx.t("newStickers")),
           h("div", { class: "grid" }, newStickers.map((id) => stickerCard(ctx, getAnimal(id), true)))]
        : null,
      unlocked.map((id) => h("p", { class: "bubble unlocked" }, icon("unlock"), ctx.t("zoneUnlocked", { zone: zoneName(id) }))),
      h("div", { class: "row" },
        h("button", { onclick: () => ctx.navigate("quiz", { zoneId }) }, icon("playAgain"), ctx.t("playAgain")),
        h("button", { class: "btn-primary", onclick: () => ctx.navigate("map") }, icon("map"), ctx.t("toMap"))),
    ),
  );
}
```

- [ ] **Step 5: Edit `js/screens/stickers.js`**

Change the import line to:

```js
import { h, screen, bruno, backButton, stickerCard, zoneArt } from "../ui.js";
import { animalsInZone } from "../data/animals.js";
import { icon } from "../icons.js";
```

Make these exact replacements:

| Find | Replace with |
|---|---|
| `` h("h1", { tabindex: "-1" }, `📒 ${ctx.t("stickerBook")}`), `` | `h("h1", { tabindex: "-1" }, icon("stickers"), ctx.t("stickerBook")),` |
| `` h("h2", {}, `${zone.emoji} ${ctx.localized(zone.name)}`), `` | `h("h2", {}, zoneArt(zone, "art title-art"), ctx.localized(zone.name)),` |

- [ ] **Step 6: Edit `js/screens/settings.js`**

Change the import line to:

```js
import { h, screen, bruno, backButton, languageToggle, animalArt } from "../ui.js";
import { setSetting, resetProgress } from "../progress.js";
import { CREDITS } from "../data/credits.js";
import { getAnimal } from "../data/animals.js";
import { icon } from "../icons.js";
```

Make these exact replacements:

| Find | Replace with |
|---|---|
| `` const reset = h("button", { onclick: showConfirm }, `🗑️ ${ctx.t("resetProgress")}`); `` | `const reset = h("button", { onclick: showConfirm }, icon("reset"), ctx.t("resetProgress"));` |
| `` `${animal.emoji} ${ctx.localized(animal.name)}: “${c.title}” — ${c.author}. `, `` | `` animalArt(animal, "art credit-art"), `${ctx.localized(animal.name)}: “${c.title}” — ${c.author}. `, `` |
| `` h("h1", { tabindex: "-1" }, `⚙️ ${ctx.t("settings")}`), `` | `h("h1", { tabindex: "-1" }, icon("settings"), ctx.t("settings")),` |

- [ ] **Step 7: Remove `starsText` from `js/ui.js`**

Delete the whole `starsText` function (the `export function starsText(...) { ... }` block).

- [ ] **Step 8: CSS for these screens in `css/style.css`**

Replace `.question-visual { text-align: center; font-size: 110px; line-height: 1.1; }` with:

```css
.question-visual { display: flex; justify-content: center; font-size: 110px; }
.question-visual .art { width: 140px; height: 140px; }
```

Replace `.replay { font-size: 56px; min-height: 110px; min-width: 140px; }` with:

```css
.replay { min-height: 110px; min-width: 140px; }
.replay .icon { width: 56px; height: 56px; }
```

Replace `.choice .emoji { font-size: 80px; line-height: 1; }` with:

```css
.choice .art { width: 92px; height: 92px; font-size: 80px; }
.choice .icon { width: 64px; height: 64px; }
.choice .icon-thumbsUp { color: #2a9d4b; }
.choice .icon-thumbsDown { color: #c0392b; }
```

Replace `.stars { text-align: center; font-size: 56px; letter-spacing: 6px; }` with:

```css
.stars { display: flex; justify-content: center; font-size: 56px; }
```

Replace `.sticker .emoji { font-size: 56px; line-height: 1.1; }` and `.sticker.unknown .emoji { filter: brightness(0); opacity: 0.2; }` with:

```css
.sticker .art { width: 72px; height: 72px; font-size: 56px; }
.sticker.unknown .art { filter: brightness(0); opacity: 0.2; }
```

Append:

```css
.credit-art { display: inline-block; width: 1.5em; height: 1.5em; vertical-align: -0.4em; margin-right: 0.3em; }
.unlocked { display: flex; align-items: center; justify-content: center; gap: 8px; }
.icon-celebrate { color: #ff8c42; }
h1 > .icon { width: 1em; height: 1em; margin-right: 0.3em; vertical-align: -0.12em; }
```

In the `@media (max-width: 480px)` block, replace `.choice .emoji { font-size: 56px; }` with:

```css
  .choice .art { width: 64px; height: 64px; font-size: 56px; }
  .choice .icon { width: 48px; height: 48px; }
```

- [ ] **Step 9: Run tests — expect PASS**

Run: `npm test` (guard test now passes; all others still pass).

- [ ] **Step 10: Browser check (Playwright, outside the repo)**

Serve on port 8768. With a seeded save `{version:1, lang:"en", settings:{sfx:true, voice:false}, visited:{lion:true,elephant:true,zebra:true,hippo:true,rhino:true,giraffe:true}, bestStars:{savanna:1}, stickers:{lion:true}}` at 1024×768 and 390×844: open Savanna → Quiz, screenshot each of the three question types (loop through questions answering by trying choices until one gets class `correct`; screenshot the first of each type seen), the Results screen, the Sticker Book (confirm unknown stickers are dark silhouettes), and Settings (credits list shows small animal pictures; flags in the language row). No page errors. Read the screenshots. Kill the server.

- [ ] **Step 11: Commit**

```bash
git add js/screens/quiz.js js/screens/results.js js/screens/stickers.js js/screens/settings.js js/ui.js css/style.css tests/emoji-guard.test.js
git commit -m "feat: use artwork and icons on quiz, results, stickers, and settings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: App icon, favicon, credits, offline cache, docs

**Files:**
- Modify: `scripts/make-icons.sh`, `icons/icon-180.png`, `icons/icon-192.png`, `icons/icon-512.png`, `index.html`, `js/data/strings.js`, `js/screens/settings.js`, `scripts/credits-md.js`, `CREDITS.md`, `sw.js`, `tests/pwa.test.js`, `tests/sounds.test.js` (only if needed), `README.md`
- Delete: `icons/icon.svg`

**Interfaces:**
- Consumes: `art/animals/lion.webp` (Task 1); `js/icons.js`, `js/icons-data.js` (Task 2).

- [ ] **Step 1: Extend the PWA test (failing first)** — in `tests/pwa.test.js`, inside the precache test, replace the `expected` array with:

```js
  const expected = [
    "./", "index.html", "manifest.webmanifest",
    ...["css", "js", "sounds", "icons", "art"].flatMap(filesUnder)
      .filter((f) => !f.endsWith(".svg") && !f.endsWith(".txt")),
  ].sort();
```

Also append a new test at the end of the file:

```js
test("the favicon is the app icon, not an emoji", () => {
  const html = readFileSync("index.html", "utf8");
  assert.match(html, /<link rel="icon" href="icons\/icon-192\.png"/);
});
```

And append to `tests/sounds.test.js`'s CREDITS.md test a check — add a new test at the end of `tests/sounds.test.js`:

```js
test("CREDITS.md credits the artwork projects", () => {
  const md = readFileSync("CREDITS.md", "utf8");
  assert.match(md, /Fluent Emoji/);
  assert.match(md, /Phosphor Icons/);
});
```

Run: `npm test` → FAIL (precache missing `art/` files and new JS; favicon; CREDITS.md).

- [ ] **Step 2: Rewrite `scripts/make-icons.sh`**

```bash
#!/usr/bin/env bash
# Regenerates the app icons in icons/: the Fluent 3D lion on a warm orange glow.
# macOS dev-only (Google Chrome + sips). Run from the repo root: bash scripts/make-icons.sh
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# The lion stays inside the central safe zone so iPad/Android masks never clip it.
cat > "$TMP/icon.html" <<HTML
<!doctype html><html><body style="margin:0">
<div style="width:1024px;height:1024px;display:grid;place-items:center;
            background:radial-gradient(circle at 30% 25%, #ffd27a, #ff8c42 70%)">
  <img src="file://$PWD/art/animals/lion.webp" style="width:64%;height:auto">
</div>
</body></html>
HTML

"$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --window-size=1024,1024 --screenshot="$TMP/icon-1024.png" "file://$TMP/icon.html" >/dev/null 2>&1

for size in 512 192 180; do
  sips -z "$size" "$size" "$TMP/icon-1024.png" --out "icons/icon-$size.png" >/dev/null
done
echo "Wrote icons/icon-512.png, icons/icon-192.png, icons/icon-180.png"
```

Run: `git rm -q icons/icon.svg && bash scripts/make-icons.sh`
Then view `icons/icon-512.png` with the Read tool: orange glow, 3D lion centered, nothing clipped.

- [ ] **Step 3: Favicon in `index.html`**

Replace the line starting with `<link rel="icon" href="data:image/svg+xml,` with:

```html
    <link rel="icon" href="icons/icon-192.png" />
```

- [ ] **Step 4: Artwork credits — strings, Settings, CREDITS.md**

In `js/data/strings.js`, add after `sourceLink`:

```js
  artwork: { en: "Artwork", es: "Ilustraciones" },
  artworkAnimals: { en: "Animal and zone pictures", es: "Dibujos de animales y zonas" },
  artworkIcons: { en: "Button icons", es: "Iconos de botones" },
```

In `js/screens/settings.js`, replace the last line of the `screen(...)` children:

```js
      h("div", { class: "credits" }, h("h2", {}, ctx.t("credits")), credits),
```

with:

```js
      h("div", { class: "credits" },
        h("h2", {}, ctx.t("artwork")),
        h("ul", {},
          h("li", {}, `${ctx.t("artworkAnimals")}: `,
            h("a", { href: "https://github.com/microsoft/fluentui-emoji", target: "_blank", rel: "noopener" }, "Microsoft Fluent Emoji"),
            " · MIT"),
          h("li", {}, `${ctx.t("artworkIcons")}: `,
            h("a", { href: "https://phosphoricons.com/", target: "_blank", rel: "noopener" }, "Phosphor Icons"),
            " · MIT")),
        h("h2", {}, ctx.t("credits")),
        credits),
```

In `scripts/credits-md.js`, insert an Artwork section at the end of the `md` template literal: directly after the line `${rows.join("\n")}` and before the closing backtick, add these lines (inside the template literal, so the inner backticks are escaped):

```text

# Artwork credits

- Animal and zone pictures, and the app icon's lion: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji)
  (3D style), MIT License — see \`art/LICENSE-fluentui-emoji.txt\`. Converted to 256×256 WebP.
- Button icons: [Phosphor Icons](https://phosphoricons.com/) 2.1.1, MIT License — see
  \`art/LICENSE-phosphor-icons.txt\`.
```

Leave the existing `rows.join("\n")` line unchanged.

Run: `node scripts/credits-md.js`

- [ ] **Step 5: Service worker** — in `sw.js`:

Change `const CACHE = "bruno-zoo-v1";` to `const CACHE = "bruno-zoo-v2";`.

Regenerate the `PRECACHE` list so it contains `./`, `index.html`, `manifest.webmanifest`, then every file under `art/`, `css/`, `icons/`, `js/`, `sounds/` (sorted, excluding `.svg` and `.txt`) — run this to print the entries and paste them between `const PRECACHE = [` and `];` (keeping the first three entries first):

```bash
find art css icons js sounds -type f ! -name '*.svg' ! -name '*.txt' | sort | sed 's/.*/  "&",/'
```

- [ ] **Step 6: README** — in `README.md`:

In the "Project layout" block, add after the `js/scenery.js` line:

```
js/icons.js             button icons (Phosphor) and drawn flags
js/icons-data.js        generated icon shapes (scripts/build-icons.js)
art/animals, art/zones  Fluent 3D pictures for animals and zones (scripts/fetch-art.sh)
```

and add after the `scripts/make-icons.sh` line:

```
scripts/fetch-art.sh    downloads and converts the animal/zone artwork
scripts/build-icons.js  downloads the button icons into js/icons-data.js
```

Replace the "## Change the app icon" section body with:

```
The app icon is the 3D lion on an orange glow. To change it, edit the HTML inside
`scripts/make-icons.sh`, run `bash scripts/make-icons.sh` (needs Google Chrome on macOS), and
bump `CACHE` in `sw.js`.
```

In "## Add an animal", replace step 2's first line with:

```
2. Add its picture: add a line to the map in `scripts/fetch-art.sh` and run it (or put a
   256×256 WebP under 30 KB at `art/animals/<id>.webp`). Add a licensed clip at
   `sounds/<id>.mp3` (mono, ~64 kbps, 2–5 s, under 60 KB), or mark the animal quiet.
```

Replace the "## Credits" section body with:

```
Animal sounds: see [CREDITS.md](CREDITS.md) (also listed in the game under ⚙️ Settings).
Artwork: Microsoft Fluent Emoji (MIT) and Phosphor Icons (MIT); license texts in `art/`.
Game code by mariotristan.
```

- [ ] **Step 7: Run tests — expect PASS**

Run: `npm test`

- [ ] **Step 8: Offline check (Playwright)**

Serve on port 8768 and reuse `/tmp/zoo-e2e/pwa.mjs` pattern: load the page, wait for `navigator.serviceWorker.ready`, reload, assert `caches.open("bruno-zoo-v2")` holds every PRECACHE entry; go offline, reload, enter the zoo, open Savanna, and assert `art/animals/lion.webp` loads (`img.complete && img.naturalWidth > 0`). No page errors. Kill the server.

- [ ] **Step 9: Commit**

```bash
git add -A scripts/make-icons.sh icons index.html js/data/strings.js js/screens/settings.js scripts/credits-md.js CREDITS.md sw.js tests/pwa.test.js tests/sounds.test.js README.md
git commit -m "feat: 3D lion app icon, artwork credits, and offline cache v2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
