# Habits

A small, personal habit tracker based on James Clear's *Atomic Habits*. It runs in the browser, works offline, and can be installed on your phone's home screen. All data stays on your device.

## How the book maps to the app

| Law | Build a habit | Break a habit |
|---|---|---|
| 1. Obvious / invisible | Implementation intention (*when* + *where*) and habit stacking (*after I…*) | Name the trigger and how you'll remove it |
| 2. Attractive / unattractive | Temptation bundle | What the habit really costs you |
| 3. Easy / difficult | Two-minute version, which you can log on hard days | Friction you'll add |
| 4. Satisfying / unsatisfying | Immediate reward, shown when you check off | Accountability partner or consequence |

Also included:

- **Identity votes.** Each habit belongs to an identity ("I am a reader"), and every successful day counts as a vote for it.
- **Never miss twice.** Missing one day shows a nudge, not a failure.
- **Habits Scorecard.** List your current daily habits and rate them +, = or −. Any − item can become a "break" habit in one tap.
- **Progress.** Streaks, 30-day rate and a 12-week heatmap for each habit.
- **Backup.** Export and import your data as JSON from the Habits tab.
- **English / Español.** The whole interface is available in both languages. The app starts in your device's language and the EN/ES switch at the top of every screen remembers your choice.

## Development

```sh
npm install
npm run dev     # local dev server
npm test        # unit tests (streak logic)
npm run build   # production build in dist/
```

All interface text lives in `src/i18n.tsx`. The Spanish dictionary is typed against the English one, so a missing translation fails the type check.

Stack: React, TypeScript, Vite, Dexie (IndexedDB), vite-plugin-pwa.

## Deploying

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. To enable it, go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**. The app will then be at `https://<user>.github.io/habits-tracker/`.

To install it on your phone, open that URL and choose **Add to Home Screen** (Safari on iOS) or **Install app** (Chrome on Android).
