# 🦁 Bruno's Zoo

A free browser game for kids aged 7–10. Visit zookeeper **Bruno Tristan**'s zoo, meet 36
animals, hear their real sounds, learn their names in **English and Spanish**, and then test
what you learned in quizzes to earn stars and stickers.

**Play:** https://mariotristan.github.io/animals/

## How to play

1. Pick a language and press **Play**.
2. Choose a zone on the map. Tap every animal to hear it and learn a fun fact.
3. When you've met all six, take the zone **Quiz**: guess animals by sound, by name, or
   answer true/false. Wrong answers just get another try.
4. Earn ⭐ to unlock new zones and collect stickers for every animal you get right the
   first time.

Progress is saved in your browser only — no accounts, no tracking.

## Install on an iPad (works offline)

1. Open https://mariotristan.github.io/animals/ in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open Bruno's Zoo from the home screen once while online. After that it plays offline too.

It also installs from Chrome or Edge on Android and desktop (install icon in the address bar).

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

Run the tests (Node 20+; no dependencies):

```bash
npm test
```

## Add an animal

1. Add a record to `js/data/animals.js` (`id`, `zone`, `emoji`, `name`, `fact`, `myth`,
   each text in `en` and `es`). Each zone should keep 6 animals.
2. Add a licensed clip at `sounds/<id>.mp3` (mono, ~64 kbps, under 60 KB), or mark the
   animal quiet.
3. Add its credit to `js/data/credits.js` and run `node scripts/credits-md.js`.
4. Add the new sound to `PRECACHE` in `sw.js` (the tests will remind you) and bump `CACHE`.
5. Run `npm test`.

## Credits

Animal sounds: see [CREDITS.md](CREDITS.md). Game code by mariotristan.
