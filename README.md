# 🦁 Bruno's Zoo

A free browser game for kids aged 7–10. Visit zookeeper **Bruno Tristan**'s zoo, meet 36
animals, hear their real sounds, learn their names in **English and Spanish**, and then test
what you learned in quizzes to earn stars and stickers.

**Play:** https://mariotristan.github.io/animals/ (installable on iPad, works offline)

## How to play

1. Pick a language (🇺🇸 English / 🇪🇸 Español) and press **Play**.
2. Choose a zone on the map. Tap every animal to hear its sound, see its name, and learn a
   fun fact from Bruno. Tap 🔊 to hear the sound again and 🗣️ to hear the name again.
3. When you've met all six animals in a zone, take the zone **Quiz** (6 questions):
   - 🔊 **Sound**: "Who makes this sound?"
   - 🔤 **Name**: "Find the lion!"
   - ❓ **True or false**: Bruno says something about an animal; answer 👍 or 👎.

   Wrong answers just get another try. Nobody fails.
4. Earn up to ⭐⭐⭐ per zone (6 right on the first try = 3 stars, 4–5 = 2, otherwise 1).
   Stars unlock new zones, and every animal you get right on the first try goes into your
   📒 **Sticker Book**.

Bruno reads everything important aloud, so early readers can play on their own.

### Zones

| Zone | Stars to unlock | Animals |
|---|---|---|
| 🌾 Savanna | 0 | lion, elephant, zebra, hippo, rhino, giraffe |
| 🌴 Jungle | 2 | monkey, gorilla, parrot, tiger, snake, frog |
| 🌊 Ocean | 4 | dolphin, whale, sea lion, shark, octopus, sea turtle |
| ❄️ Polar | 6 | polar bear, penguin, arctic wolf, arctic fox, reindeer, snowy owl |
| 🚜 Farm | 8 | cow, pig, sheep, horse, chicken, duck |
| 🌲 Forest | 10 | bear, raccoon, squirrel, beaver, bee, wild turkey |

30 animals have a real recorded sound. Giraffe, shark, octopus, sea turtle, arctic fox, and
beaver have no clip; their cards tell kids how those animals communicate instead, and they
are never the answer to a sound question.

### Settings (⚙️)

Switch language, turn sounds or Bruno's voice on and off, reset progress (asks first), and see
the credits for every sound.

## Install on an iPad (works offline)

1. Open https://mariotristan.github.io/animals/ in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open Bruno's Zoo from the home screen once while online. It saves the whole game (about
   1 MB) on the device, so after that it plays offline too.

When you're online, the installed app picks up the newest version the next time it opens.
It also installs from Chrome or Edge on Android and desktop (install icon in the address bar).

## Privacy

No accounts, ads, analytics, or trackers. Progress (stars, stickers, visited animals,
settings) is stored only on the device, in the browser's local storage. The game makes no
network requests except for its own files.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

Run the tests (Node 20+; no dependencies):

```bash
npm test
```

No build step: the browser loads the ES modules directly.

## Project layout

```
index.html              the single page
manifest.webmanifest    app name, icons, and display mode for installing
sw.js                   service worker: saves the game for offline play
css/style.css           layout, zone scenery, big touch targets
js/main.js              boots the app, owns state, routes between screens
js/ui.js                small DOM helpers and Bruno's speech bubble
js/i18n.js              current language and text lookup
js/quiz.js              quiz building, scoring, quiz session (pure)
js/progress.js          stars, stickers, unlocks, saved data (pure)
js/audio.js             animal sounds, Bruno's voice, chimes
js/data/animals.js      zones and the 36 animals (names, facts, false statements)
js/data/strings.js      all on-screen text in English and Spanish
js/data/credits.js      credit for every sound clip
js/screens/*.js         welcome, map, zone, quiz, results, stickers, settings
sounds/*.mp3            animal sound clips
icons/                  app icon (icon.svg) and the PNGs made from it
scripts/credits-md.js   regenerates CREDITS.md from js/data/credits.js
scripts/make-icons.sh   regenerates the icon PNGs from icons/icon.svg (macOS)
tests/*.test.js         node --test suites
```

## Add an animal

1. Add a record to `js/data/animals.js` (`id`, `zone`, `emoji`, `name`, `fact`, `myth`,
   each text in `en` and `es`). Each zone should keep 6 animals.
2. Add a licensed clip at `sounds/<id>.mp3` (mono, ~64 kbps, 2–5 s, under 60 KB), or mark
   the animal quiet. Use only public domain, CC0, CC BY, or CC BY-SA recordings.
3. Add its credit to `js/data/credits.js` and run `node scripts/credits-md.js`.
4. Add the new sound to `PRECACHE` in `sw.js` (the tests will remind you).
5. Run `npm test`.

If you **replace** an existing sound or icon, also bump `CACHE` in `sw.js` (e.g.
`bruno-zoo-v2`) so installed copies download the new file.

## Change the app icon

Edit `icons/icon.svg`, then run `bash scripts/make-icons.sh` (needs Google Chrome on macOS)
and bump `CACHE` in `sw.js`.

## Deploying

GitHub Pages serves the `main` branch root at https://mariotristan.github.io/animals/. Open a
pull request; once it's merged, the site updates within a minute or two. Merged PR branches
are deleted automatically.

## Credits

Animal sounds: see [CREDITS.md](CREDITS.md) (also listed in the game under ⚙️ Settings).
Game code by mariotristan.
