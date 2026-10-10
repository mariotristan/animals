# Bruno's Zoo — Design Spec

Date: 2026-10-10
Status: Approved in conversation; pending written-spec review

## 1. Purpose

A free browser game, published on GitHub Pages, that teaches kids aged 7–10 about
animals. Players visit a zoo run by zookeeper **Bruno Tristan**, learn each animal's
**name** and **sound**, and then test what they learned in quizzes.

### Success criteria

- A 7–10-year-old can play without adult help: big targets, minimal reading, everything
  important is spoken aloud.
- Kids learn to recognize animals by sound and by name, in English and/or Spanish.
- Kids have a reason to come back: stars, stickers, and zones to unlock.
- The game loads quickly, works on desktop and tablets, and is made of static files only — no backend, no accounts, no data leaves the device.

### Decisions made with the user

| Topic | Decision |
|---|---|
| Gameplay | Both an **Explore** mode (learn) and a **Quiz** mode (test), linked by rewards |
| Visuals | Emoji animals and an emoji Bruno, plus CSS-drawn scenery |
| Sounds | Real recorded animal sounds with open licenses, credited |
| Language | English + Spanish, switchable |
| Size | 6 zones × 6 animals = 36 animals |
| Tech | Plain HTML/CSS/JavaScript (ES modules), no build step |
| Hosting | Public repo `mariotristan/animals`, GitHub Pages from `main` (root) |
| Identity | All commits authored as `mariotristan <mariotristan@gmail.com>` |

## 2. Screens and flow

```
Welcome ──► Zoo Map ──► Zone (Explore) ──► Zone Quiz ──► Results ──► Zoo Map
               │
               ├──► Sticker Book
               └──► Settings / About (credits)
```

1. **Welcome** — Bruno 🧑‍🌾 greets the player ("Welcome to my zoo!"). Language toggle
   🇺🇸 / 🇪🇸 and a large **Play** button. The language choice is saved.
2. **Zoo Map** — 6 large zone tiles. Unlocked zones show in color; locked zones show 🔒 and
   the number of ⭐ needed. Shows total ⭐. Buttons: Sticker Book 📒, Settings ⚙️.
3. **Zone (Explore)** — the zone's 6 animals as large emoji. Tapping an animal:
   - plays its recorded sound (if it has one),
   - opens a card with its name in large letters, which Bruno speaks aloud,
   - shows one fun fact in a Bruno speech bubble, also spoken aloud,
   - marks the animal visited (✓).
   A 🔊 button on the card replays the sound; a 🗣️ button repeats the name.
   The **Quiz** button for the zone unlocks once all 6 animals have been visited at least
   once. Visits are saved, so this only has to happen once per zone.
4. **Zone Quiz** — 6 questions, one per animal in the zone, in random order. Each question
   uses one of three types:
   - 🔊 **Sound** — "Who makes this sound?" Plays the clip; choose 1 of 3 animals (emoji +
     name). Only for animals that have a sound.
   - 🔤 **Name** — "Find the ___!" Shows and speaks a name; choose 1 of 3 emoji.
   - ❓ **True/False** — Bruno states a fact about the animal; answer 👍 / 👎.
     Half the time the statement is that animal's real fact, half the time it is a false
     statement written for that animal (each animal has one of each).
   Wrong choices for Sound and Name questions come from the same zone first, falling back to
   other zones only if needed.
   **Wrong answer:** Bruno encourages ("Almost! Listen again 👂"), the wrong option is
   dimmed, and the player tries again. Nobody fails a quiz.
5. **Results** — Bruno celebrates. Stars for the attempt, newly earned stickers, and any
   zone that just unlocked.
6. **Sticker Book** — 36 slots grouped by zone. Earned stickers show the emoji and name;
   unearned slots show a silhouette "?".
7. **Settings / About** — language toggle, sound effects on/off, Bruno's voice on/off,
   "Reset progress" (with a confirmation step), and the credits for every sound.

### Bruno

Bruno appears on every screen as a large 🧑‍🌾 with a speech bubble. He gives
instructions, cheers correct answers, gently encourages after mistakes, and tells the fun
facts. All of his lines live in `strings.js` in both languages and are spoken through the
browser's speech synthesis.

## 3. Rules: stars, stickers, unlocks

- **Stars per quiz attempt** (based on questions answered right on the *first* try, out of 6):
  6 → ⭐⭐⭐, 4–5 → ⭐⭐, 0–3 → ⭐.
- A zone stores its **best** star score (0–3). Total stars = sum of best scores (max 18).
- **Stickers:** answering an animal's question correctly on the first try earns that animal's
  sticker permanently.
- **Zone unlock thresholds** (total stars needed), in this order:
  Savanna 0, Jungle 2, Ocean 4, Polar 6, Farm 8, Forest 10.
  A player who scores 2★ in every quiz can unlock every zone.

## 4. Animals

🔇 = quiet animal: no sound clip, never used for Sound questions. Its explore card says it's
quiet and includes a fact about how it communicates.

| Zone | Animals |
|---|---|
| 🌾 Savanna | lion 🦁, elephant 🐘, zebra 🦓, hippo 🦛, rhino 🦏, giraffe 🦒🔇 |
| 🌴 Jungle | monkey 🐒, gorilla 🦍, parrot 🦜, tiger 🐅, snake 🐍, frog 🐸 |
| 🌊 Ocean | dolphin 🐬, whale 🐋, sea lion 🦭, shark 🦈🔇, octopus 🐙🔇, sea turtle 🐢🔇 |
| ❄️ Polar | polar bear 🐻‍❄️, penguin 🐧, arctic wolf 🐺, arctic fox 🦊, reindeer 🦌, snowy owl 🦉 |
| 🚜 Farm | cow 🐄, pig 🐖, sheep 🐑, horse 🐴, chicken 🐔, duck 🦆 |
| 🌲 Forest | bear 🐻, raccoon 🦝, squirrel 🐿️, beaver 🦫, bee 🐝, wild turkey 🦃 |

Each animal record:

```js
{
  id: "lion",
  zone: "savanna",
  emoji: "🦁",
  sound: "sounds/lion.mp3",      // null for quiet animals
  name:  { en: "Lion", es: "León" },
  fact:  { en: "...", es: "..." }, // true, short, kid-friendly
  myth:  { en: "...", es: "..." }  // false statement for True/False questions
}
```

Facts must be accurate and short (one sentence, simple words a 7-year-old can follow).

## 5. Architecture

Static site; ES modules loaded directly by the browser. No framework and no runtime dependencies.

```
index.html             single page; one root element that screens render into
css/style.css          layout, zone colors, big touch targets, responsive
js/main.js             boots the app, owns the current screen, simple router
js/data/animals.js     the 36 animal records + zone list (id, emoji, colors, threshold)
js/data/strings.js     UI text and Bruno's lines, { en, es }
js/i18n.js             current language, t(key), localized(field)
js/quiz.js             PURE: buildQuiz(zoneId, animals, rng) → questions; scoreAttempt(...)
js/progress.js         PURE state functions + a small storage adapter (localStorage)
js/audio.js            playSound(path), speak(text, lang), settings-aware, fail-safe
js/screens/*.js        welcome, map, zone, quiz, results, stickers, settings
sounds/*.mp3           one clip per non-quiet animal
CREDITS.md             source URL, author, license for every sound
tests/*.test.js        node --test
package.json           only for `npm test` → `node --test`; no dependencies
```

### Unit boundaries

- **`quiz.js`** never touches the DOM or storage. Inputs: zone id, animal list, injectable
  random function. Output: a list of question objects
  `{ type, animalId, choices[], answer }`. This makes it fully testable.
- **`progress.js`** works on a plain state object
  `{ version, lang, settings, visited: {}, bestStars: {}, stickers: {} }`.
  Pure functions (`markVisited`, `recordQuizResult`, `totalStars`, `isZoneUnlocked`,
  `isQuizUnlocked`) return new state. `load(storage)` / `save(storage, state)` take a storage
  object so tests can pass a fake.
- **Screens** each export `render(root, ctx)`, where `ctx` provides state, `navigate(screen,
  params)`, `t()`, and audio helpers. Screens hold no long-lived state of their own.

### Error handling

- **Missing/broken sound file or autoplay blocked:** `playSound` catches the error, logs a
  warning, and the game continues (name and fact still show). All audio is triggered by a
  tap, which satisfies browser autoplay rules.
- **No speech synthesis or no voice for the language:** text is still shown; `speak` is a
  no-op. Prefers a voice matching `en-*` / `es-*`.
- **Corrupt or old saved data:** `load` validates the shape and `version`; on failure it starts
  fresh rather than crashing.
- **localStorage unavailable (private mode):** the game runs with in-memory progress.

## 6. Sounds: sourcing and licensing

- Sources, in order of preference: public domain / CC0 (Wikimedia Commons, US government
  wildlife agencies such as NPS/USFWS, freesound.org CC0), then CC-BY with attribution.
  No NonCommercial or NoDerivatives licenses, and no unlicensed clips.
- Each clip is trimmed to roughly 2–5 seconds, normalized in volume, and saved as mono MP3
  (~64 kbps) so it plays in all major browsers and stays small (target under 60 KB each).
  `ffmpeg` (installed via Homebrew) is a dev-only tool for this; it is not part of the game.
- `CREDITS.md` and the in-game About screen list each clip's title, author, source URL, and
  license.
- If no acceptable clip can be found for an animal, it becomes 🔇 or is swapped for another
  animal in the same zone. Any such change gets reported to the user.

## 7. Accessibility and kid-friendliness

- Touch targets at least 64 px; animal emoji large (≈ 96 px+).
- Minimal text, high contrast, a large rounded font; everything important is spoken aloud.
- Works in portrait and landscape from ~360 px wide up to desktop.
- Keyboard and screen-reader friendly: real `<button>` elements with `aria-label`s in the
  current language.
- No ads, no external trackers, no network calls beyond loading the game's own files.

## 8. Testing

Automated, `node --test` (no dependencies):

- **quiz:** 6 questions per zone, one per animal; correct answer always among the choices;
  no duplicate choices; Sound questions never use quiet animals; deterministic with a seeded
  RNG.
- **progress:** star scoring boundaries (6/5/4/3), best score kept, sticker awarding, unlock
  thresholds, quiz unlock after all 6 visited, load/save round-trip, corrupt data → fresh
  state.
- **data integrity:** 36 animals, 6 per zone, unique ids, every animal has `en` and `es` for
  name/fact/myth, every sound path exists on disk, every sound has a `CREDITS.md` entry,
  every `strings.js` key has both languages.

Manual: serve locally (`python3 -m http.server`), play through every screen in both languages
on a desktop and a narrow/mobile viewport, and check the browser console for errors.

## 9. Publishing

- Public GitHub repo `mariotristan/animals` (existing; use the `mariotristan` gh account, switching from the default active account first).
- GitHub Pages: deploy from branch `main`, folder `/`. Include an empty `.nojekyll` file.
- All file paths are relative so the game works under `/animals/`.
- Live URL: https://mariotristan.github.io/animals/
- `README.md` with a description, how to play, how to run locally, how to add an animal, and
  credits.

## 10. Out of scope (v1)

Accounts or online leaderboards, more than two languages, custom illustrated art, background
music, a timer or pressure mechanics, and analytics. Any of these can be
added later.

## 11. Addendum (2026-10-10): installable, offline app

The game is a Progressive Web App so it can be installed on an iPad from Safari (Share → Add to
Home Screen) and played offline:

- `manifest.webmanifest`: name, standalone display, relative `start_url`/`scope`, sky/orange
  colors, 192/512 px icons (512 also maskable). `index.html` adds the Apple full-screen tags and a
  180 px `apple-touch-icon`.
- Icons are a hand-drawn paw print (`icons/icon.svg`), rendered to PNG by `scripts/make-icons.sh`
  (dev-only). No emoji artwork is shipped as images.
- `sw.js` precaches every game file on first load (page, CSS, JS, sounds, icons). Pages and code
  are network-first (updates arrive on the next online launch); sounds and icons are cache-first
  and answer byte-range requests with 206 responses, which Safari needs to play audio served by a
  service worker. Old caches are deleted on activation.
- If the service worker can't register, the game keeps working online.
- `tests/pwa.test.js` checks the manifest, the HTML tags, that `PRECACHE` lists exactly the game's
  files, and the byte-range parser.

## 12. Addendum (2026-10-10): illustrated zone scenery

Each zone gets a hand-drawn SVG scene (Savanna: acacias and birds at sunset; Jungle: vines, big
leaves, palm, flowers; Ocean: underwater light rays, seaweed, coral, sand; Polar: northern
lights, snow, icebergs; Farm: barn, silo, fence, hay; Forest: layered pines, log, mushrooms),
and the other screens use a sunny park. Scenes live in `js/scenery.js` as six layers (sky, top
band, ground, bottom-left, bottom-right, floor), each pinned to its own screen edge so nothing
important is cropped from phone portrait to wide desktop. Detail stays at the edges so the
middle remains calm behind the animal buttons; no animation. Screen titles sit on a soft white
card for readability, and locked buttons are drawn solid instead of transparent.

