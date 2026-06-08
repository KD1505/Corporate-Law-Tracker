# Corporate Law Tracker — Nightly Engine (Runbook)

This folder is the automation that keeps the live site fresh. It runs on **GitHub Actions**
(free) every night at **11:00 PM IST** and commits an updated `index.html`; Vercel then
redeploys automatically.

## Free vs. paid — you choose

| Mode | What you get | Cost | How to enable |
|---|---|---|---|
| **FREE (default)** | Nightly auto-update. Pulls new Bar & Bench deals, extracts firm names + value + the article's own lede, classifies type/sector/city, links the Bar & Bench article and the relevant **government/exchange filing portal**. | **₹0** | Nothing — it's the default. No API key. |
| **AI upgrade (optional)** | Everything above **plus** smart-brevity summaries, sharper classification, full partner/associate teams, and **automatic multi-source triangulation** (3-6 credible sources per deal, government prioritised, found via web search). | a few $/month of Claude API | Add an `ANTHROPIC_API_KEY` secret (below). |

The free mode is genuinely free and fully automatic. The trade-off: summaries are the article's
own words (still accurate), and corroboration is the Bar & Bench link + the right filing portal,
rather than 4-5 specific corroborating article URLs (that discovery needs paid web search).

## Files
- `fetch.mjs` — pulls newest Bar & Bench Dealstreet + News items (free public API).
- `extract.mjs` — FREE rule-based structuring (no API).
- `enrich.mjs` — optional AI structuring + web-search triangulation (needs `ANTHROPIC_API_KEY`).
- `build.mjs` — orchestrator: dedupes, structures, splices new deals into `index.html`.
- `sources.json` — the credible-source registry (government/regulator/exchange prioritised).
- `../.github/workflows/update.yml` — the nightly schedule + "Run workflow" button.

## One-time setup
1. Upload this `engine/` folder and the `.github/workflows/update.yml` file to the
   **KD1505/Corporate-Law-Tracker** repo (keep the paths).
2. In the repo: **Settings → Actions → General → Workflow permissions → Read and write** (lets the
   bot commit). Usually on by default for your own repos.
3. (Optional, for AI mode) **Settings → Secrets and variables → Actions → New repository secret**,
   name `ANTHROPIC_API_KEY`, paste your key.
4. Go to the **Actions** tab → "Update Corporate Law Tracker" → **Run workflow** to test now.
   Watch it fetch, structure, and commit. Vercel redeploys within ~1-2 minutes.

## Notes
- The 16 curated launch deals stay put — new items are added on top of them.
- Edit deal data via the engine, not by hand: the block between `/* DEALS-START */` and
  `/* DEALS-END */` in `index.html` is regenerated on each run.
- To change cadence, edit the `cron` line in the workflow (it uses UTC; 17:30 UTC = 23:00 IST).
- Local test: `cd engine && npm install && node build.mjs` (add `ANTHROPIC_API_KEY=...` in front for AI mode).
