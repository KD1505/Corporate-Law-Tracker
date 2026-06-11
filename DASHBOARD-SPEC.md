# CorpLawTracker — Command Center Specification (v5)

## 1. Executive summary

CorpLawTracker graduates from intelligence feed to **command center**: a live system that tells a lawyer what changed, why it matters, and what to do — in that order. The product's voice is a strategic analyst: every surface leads with a synthesized read (chips, deltas, signals, scenarios) and holds the evidence one click below. This spec defines ten command-center features, the data and intelligence layer behind them, the visual system (drawing on CRED's confidence: generous space, bold type, few elements, deep contrast), and a sequenced build plan.

**Shipped in this commit (live in `index.html`):** plain-language navigation — *Precedent Transactions* (was Precedent Search), *League Tables* (was Benchmarks), *Market Trends* (was Market Themes), *People Moves* (was Moves & Mandates), *Law Firms* (was Firms Directory); a de-crunch pass (≈40% more whitespace, larger headlines, softer radii and shadows, simplified deal cards showing one primary source instead of badge clutter, sector chip-wall replaced by a single dropdown); and removal of every inline "Export brief" control — exports return only as the deliberate Briefing Studio (§3.6). Everything else in this document is the build spec.

**Operating assumptions:** single-tenant static product today (nightly GitHub Actions pipeline, no backend); India corporate-law market; examples below use the live market (Khaitan & Co, CAM, SAM, JSA; SEBI/RBI/CCI; Mumbai/Delhi/Bengaluru) rather than the brief's placeholder geographies. Features needing persistence beyond `localStorage` are explicitly staged in §9.

## 2. Dashboard vision and principles

**Vision statement:** *Open CorpLawTracker for 90 seconds each morning and know exactly which client to call, which rival to watch, and which document to re-paper.*

Principles, in priority order:

1. **Analyst first, archive second.** Every module opens with a one-sentence synthesized read; rows are evidence, never the headline.
2. **Change is the product.** The default question is "what's different since I last looked," not "what exists."
3. **Calm density.** CRED-grade restraint: one idea per card, generous padding, max two accent colors per view. If a widget needs a legend, redesign it.
4. **Every insight names names.** No "activity is up" — always *which* firm, *which* sector, *which* client, *which* rule, with the count and period.
5. **Three statuses only.** Red = act today (deadline/risk), Amber = attention (change worth reading), Green/neutral = steady. No other semantic colors.
6. **Honest intelligence.** Every signal carries its base ("based on 14 matters since Jan 2026") and degrades gracefully when data is thin.

## 3. Full dashboard spec — the ten features

### 3.1 "Since your last visit" — the Delta panel

**Placement:** first module on Today, above the deadline strip, for returning visitors (skipped on first visit; hero shows instead).
**Mechanics:** on each visit, a snapshot `{ts, dealIds[], dealStages{}, regIds[], firmDealCounts{}, moveIds[]}` is written to `localStorage` (`clt_snapshot`). On return, the current state is diffed against it.

**Widget layout** — one full-width card, four delta columns + footer toggle:

| Column | Metric | Indicator | Click action |
|---|---|---|---|
| New deals | count of new deal ids, split "in your practice / elsewhere" | green dot; bold count | opens Delta view scoped to new deals |
| Stage moves | deals whose `stage` changed (e.g., Announced → In Review) | amber dot; "3 advanced" | opens those deals |
| Regulation | new REGITEMS; **!** prefix when a deadline exists | red **!** for dated items | opens Regulatory Radar |
| Firm momentum | top 3 movers by Δ deal-count since snapshot, ▲ green / ▼ red with rank delta | ▲▼ arrows | opens firm page |

Header copy: `Since your last visit — Tue 9 Jun, 18:40` · footer: **Delta view** toggle — filters the entire feed to only new/changed items, with a persistent amber "Delta view — showing 11 changed items · Show everything" bar.
**Filters:** respects My Practice scoping when set; otherwise market-wide.
**Visual design:** numbers in 26px tabular figures, labels 11px uppercase; no borders between columns, just space.
**Edge states:** >30 days away → "A lot happened. Here are the 5 developments that matter most" (top-scored items); same-day revisit → panel collapses to a single line.

### 3.2 Intelligence chips

One-sentence analyst reads attached to module headers. Computed nightly by the pipeline (free rule-based; AI-polished when `ANTHROPIC_API_KEY` is set) and written into a `CHIPS` data block.

**Template grammar:** *[Subject] [movement verb] [magnitude] [period]. [Named beneficiaries/laggards].* ≤140 characters, no adjectives, no hedging.

| Chip | Trigger rule | Example copy (live-data style) | Placement |
|---|---|---|---|
| Deal-volume | sector deal count ≥2× trailing-90d average | "Energy ECM is running 3× its quarterly pace. CAM, SAM and Khaitan hold every mandate." | Today, above feed |
| Regulation | new REGITEM with deadline + ≥1 connected sector | "DPDP Rules deadline now 5 months out. Re-papering demand favours TMT-heavy firms." | Regulatory Radar header |
| League-move | firm rank Δ ≥3 places in 90d | "JSA moved 8 → 4 in 90 days on repeat banking mandates (NaBFID, HDFC)." | League Tables header |
| Partner | partner on ≥3 mandates in 60d | "Madhur Kohli is the most active ECM partner of the last 60 days — 4 QIPs." | People Moves / firm pages |
| Counsel-pair | firm pair co-occurs ≥3× | "Khaitan and Linklaters have paired on 3 cross-border raises this quarter." | Precedent Transactions |

**Visual:** 13px serif sentence on a tinted strip with a left rule in the section's accent; one chip per module maximum; chip carries a small "evidence →" link opening the matching filtered view. If no trigger fires, the strip doesn't render — never pad.

### 3.3 Market maps

Three visual modes replacing list-only navigation, under one nav item **Market Maps** with a three-tab switcher.

| Map | Chart type | Data model | Interactions |
|---|---|---|---|
| Firm network | force-directed graph (D3, canvas) | nodes = firms (size = mandate count, color = primary practice); edges = co-counsel co-occurrence on DEALS (weight = shared matters) | hover = highlight ego-network; click = side panel with shared deals, common clients, sector overlap %; double-click = open firm page |
| Sector heat | matrix grid — sectors × deal types (no geographic map; jurisdiction is a filter) | cell value = deal count; overlay toggles: deal value ₹cr, regulation intensity (connected REGITEMS), client concentration (HHI of parties) | click cell = filtered feed; legend-free — values printed in cells |
| Client adjacency | Sankey, parties → sectors (and parties → jurisdictions toggle) | derived from DEALS.parties recurrence across sectors | click ribbon = the deals carrying that client across sectors |

**Filters (all maps):** period (90d / 12m / all), deal type, geography, minimum edge weight.
**Visual style:** near-monochrome ink on background; single accent for selection; heat scale = 5-step single-hue ramp (accent-soft → accent); node labels appear at zoom or hover only — the resting state must look like a poster, not a hairball.
**Degrade rule:** with <30 deals in scope, maps collapse to "Top 5 pairs / cells" bar lists rather than drawing a sparse graph.

### 3.4 Scenario panel — "Plays"

Pre-built questions, not filters. A **Plays** rail on Today (4 cards, 2×2) and a full Plays page. Each play = saved filter recipe + insight generator + alert hook.

| Play name (exact) | Logic | Output |
|---|---|---|
| **Pitch Window** | deals at `rumoured`/`announced` in my sectors where none of my shortlisted firms appear | ranked list + insight: "6 open situations in Energy; 4 have no Tier-1 counsel announced yet." |
| **Shadow a Rival** | pick firm F → its last-90d mandates, new sectors vs prior period, co-counsel, repeat clients | rival dossier + insight: "Firm F added Infrastructure (2 mandates) — first entry in 12 months." |
| **Client Risk Sweep** | match my watched parties/sectors against REGITEMS with deadlines | risk table + insight: "3 of your 10 tracked clients are touched by the DPDP re-papering deadline." |
| **The One That Got Away** | completed deals in my sectors/value band where I wasn't on counsel | gap list + insight: "₹9,400 cr of Q2 Energy mandates went to 3 rivals; 2 were repeat clients of Firm F." |

**UI layout:** card = play name (serif, 16px) + one-line promise + "Run play →". Running opens a results screen: insight sentence on top (chip style), evidence list below, then two actions — `Save as alert` and `Add to workspace`. Setup (e.g., "pick rival firm") is a single inline select, never a form page.

### 3.5 Workspaces

Upgrade Saved & Alerts into **Workspaces** — folders of intent. Defaults offered on first save: *Mumbai ECM Watch*, *Rival: [Firm]*, *DPDP Re-papering*, *My Sector Pipeline*.

**Data model (localStorage now, account-synced later):** workspace `{id, name, created, savedViews[] (filter states), watchedDeals[], shortlist[] (firms/partners), notes[] {itemRef, text, ts}, alertPrefs {digest: daily|weekly}}`.
**UI:** workspace switcher at top of the Workspace nav group; inside a workspace — four tabs: Overview (delta panel scoped to the workspace + its chips), Items (watched deals/rules), Shortlist, Notes. Every deal/regulation page gets an `Add to workspace` quick action.
**Permissions:** local/private now; with accounts (§9): private / team-shared (view) / team-shared (edit). **Export:** via Briefing Studio only (§3.6).

### 3.6 Briefing Studio (replaces all inline exports)

All scattered "Export brief" buttons are **removed (shipped)**. One deliberate surface: **Briefing Studio**, opened from a workspace or the command bar.

| Template (exact name) | Contents | Formats |
|---|---|---|
| **Partner One-Pager** | scope's top 5 developments, each: headline · why-it-matters · counsel · primary source; deadline box; generated-on stamp + methodology footnote | PDF (print-CSS first), email summary |
| **BD Pitch: Sector Report** | sector chip, league table for the sector, 90-day deal list, white-space analysis ("mandates without Tier-1 counsel"), rival head-to-head | PDF, PPTX (one slide per block), CSV appendix |
| **Client Regulatory Memo** | rules touching selected client/sector: what changed · deadline · action for documents · primary citations | PDF, email summary |

**Flow:** pick template → pick scope (workspace / current view / client) → 6-second generation with progress copy ("Ranking developments… drafting summary…") → preview pane → `Download` / `Copy email version`. AI drafts the connective prose when an API key is configured; otherwise templates assemble from structured fields verbatim. Every output carries source links and the Verified/Reported label per item — a briefing that can be checked is a briefing that gets forwarded.

### 3.7 Predictive signals

Computed nightly into a `SIGNALS` block; surfaced in a "Likely next" rail card and on relevant entity pages. Copy style: confident sentence + base + confidence tag (High/Moderate — never percentages on thin data).

| Signal | Conceptual algorithm | Example surface copy |
|---|---|---|
| Likely co-counsel | pointwise mutual information on firm-pair co-occurrence across DEALS; flag pairs with lift >2 and recency boost | "If this raise adds international counsel, Linklaters is the likeliest pairing for Khaitan — 3 joint mandates in 2026. *Moderate · 14 matters*" |
| Sector entry | firm's first mandate in a sector → match against that sector's most active parties without committed counsel | "JSA just entered semiconductors. Watch ISM-scheme applicants without announced counsel. *Early · 1 matter*" |
| Client stickiness | party↔firm repeat ratio over trailing 24m | "Coforge has used JSA on 3 of its last 3 deals — locked in. Pitch the other side. *High · 3 matters*" |
| Follow-on raise | issuer pattern: QIP + promoter warrants within 90d historically precedes further ECM | "HFCL's paired QIP + warrants fits the pre-follow-on pattern seen in 4 of 6 similar cases. *Moderate*" |

**Placement:** max 3 signals on Today's rail; full list under Market Maps → Signals tab; one inline signal allowed per deal page ("Likely next" box under Why-it-matters). **Integrity rule:** every signal shows its evidence on click; signals with a base <3 matters are labelled *Early* and visually muted.

### 3.8 Command-center UI

The shell behaves like a live system (within nightly-refresh honesty — counters say "today" meaning the latest run, tooltipped with the run timestamp).

**Layout zones:** header (brand · command bar · as-of/methodology) → left nav (3 job groups) → main canvas (delta panel → chips → modules) → right rail (Deadlines · Likely next · League movers) → floating compare tray.
**Live indicators:** three header pills, only when nonzero: `3 new in your practice` (green), `2 regulation alerts` (red !), `1 rival move` (amber) — each clicks to its Delta slice.
**Quick actions (uniform, everywhere):** `Watch` ★ · `Add to workspace` · `Save & track` · `Open in Briefing Studio`. Same order, same icons (★ ⊞ ⌗ ▤), always top-right of the entity.
**Status colors:** red = dated obligation or breaking ruling; amber = changed/attention; green = verified/steady. Type badges stay tonal and never compete with status.
**Command bar (⌘K / "/"):** one input for search + actions; typing "play", "brief", "watch" surfaces actions above results — grouped results: Actions · Deals · Firms · Partners · Rules.

### 3.9 Team collaboration

Requires accounts (§9 M3). **Data model:** `users {id, role}`, `comments {itemRef, author, text, ts, resolved}`, `tags {label, color, itemRef[]}` (firm-defined, e.g. `pitch-target`, `conflict-check`, `client-sensitive`), `assignments {itemRef, assignee, note}`.
**Roles:** BD (workspaces, tags, briefings), Partner (everything + assign), In-house (regulatory modules + client workspaces), Admin (members, API keys).
**UI:** comment drawer on deal/regulation pages (right side, threaded, @-mentions); tag pills under the headline, filterable ("show everything tagged pitch-target"); "Assigned to you" block on Today.
**Notifications:** in-app inbox + the daily email digest gains a "Your team" section (mentions, assignments, comments on watched items). No real-time push in v1 — the product's cadence is daily; pretending otherwise breaks trust.

### 3.10 API and data export

For power users and BD-ops integration. **Auth:** per-org API keys (Admin-issued).

| Endpoint (conceptual) | Returns |
|---|---|
| `GET /v1/deals?sector&type&firm&since&stage` | structured deal records incl. counsel, sources, verification |
| `GET /v1/firms/{id}/mandates` · `GET /v1/firms/{id}/pairs` | mandate list; co-counsel graph edges |
| `GET /v1/regulations?deadline_before&sector` | radar items with impact/action fields |
| `GET /v1/league?period&sector&metric=count\|value` | ranked tables with deltas |
| `GET /v1/signals` | active predictive signals with evidence refs |

**Formats:** JSON (API), CSV (every table view gets `Download CSV` for org plans). **Scheduling:** weekly/daily scheduled exports to email or webhook (workspace-scoped). **Integration patterns:** outbound webhooks on delta events (`new_deal_in_scope`, `stage_change`, `new_regulation`) → Slack/Teams/Zapier; CSV feed for CRM (Salesforce/HubSpot) BD pipelines; static stepping stone now: publish `deals.json` + `radar.json` artifacts from the nightly Action.

## 4. Widget-by-widget breakdown (Today canvas, top → bottom)

| # | Widget | Contents | Primary action | Status logic |
|---|---|---|---|---|
| 1 | Hero (first visit only) | positioning + 2 CTAs | `Set up my practice feed` | — |
| 2 | Since-your-last-visit | 4 delta columns + Delta-view toggle | enter Delta view | amber when any change; red when new dated regulation |
| 3 | Deadline strip | dated obligations, soonest first | open Regulatory Radar | red ≤30d, amber otherwise |
| 4 | Intelligence chip | 1 sentence, evidence link | open filtered evidence | accent strip |
| 5 | Plays (2×2) | 4 play cards | `Run play →` | neutral |
| 6 | What-matters-now | 3 priority cards (score-ranked) | open deal | red border = hi |
| 7 | KPI stats | 4 counters + hover drill | open slice | neutral |
| 8 | Feed | cards/rows toggle, sort, sector select | open deal | per-card badges |
| Rail | Deadlines · Likely next · League movers (▲▼) · Coverage & Method | — | per item | per item |

Widget rules: every widget is removable except 3 and 8 (a "customize" menu, localStorage-persisted); nothing animates except number count-up on load (200ms, once).

## 5. Data model and intelligence layer spec

**Existing blocks (pipeline-owned, unchanged):** `DEALS` (id, type, geo, sector, stage, value, parties, firms[{name, side, lead[], team[]}], sources[{name,url,official}], time, imp, score), `REGITEMS` (reg, title, status, effective, deadline, impact, action, sources, deals[], laws[]), `MOVES`, `COMMENTARY`, `TRENDS`, plus curated `EXTRA/STRUCT/FRAMEWORK/CASES/REGLIB/LAWDETAIL`.

**New nightly-computed blocks** (same splice-anchor pattern as existing ones; all derivable from current data):
- `CHIPS[]` — {id, scope, text, evidenceFilter, computedAt, trigger}.
- `SIGNALS[]` — {id, kind, subject, text, confidence, base (matter ids), computedAt}.
- `EDGES[]` — {firmA, firmB, weight, dealIds[]} for maps; `SECTOR_MATRIX` — counts/value/regIntensity per sector×type.
- `LEAGUE_DELTAS` — per-firm {rank, prevRank, count90d, prevCount90d}.

**Client-side state:** `clt_snapshot` (delta engine), workspaces, watchlist, compare, density/sort/theme, hero/panel dismissals. **Intelligence cadence:** all derived blocks recompute in the nightly Action after ingestion; computation is deterministic rules first, AI only for prose polish — the same item must produce the same insight two runs in a row.

## 6. UX/UI design direction

**Design language** (CRED's confidence + broadsheet authority, adapted to a data product):
- **Space over chrome.** Generous module padding (24–28px), 20px+ module gaps, max content width 1040px on canvas. One idea per card. *(De-crunch pass shipped.)*
- **Typography tone:** serif display (Charter stack) for headlines/insight sentences — the analyst's voice; system sans for UI; mono tabular for every number. Scale 11/13 UI, 16.5 card heads, 24 page titles, 27 hero.
- **Color:** paper-warm light theme default; ink-dark theme as the "terminal" option. One working accent (deep navy). Status red/amber/green reserved for §2.5 semantics. Heat ramps single-hue. No gradients except the dark theme's hero.
- **Information density:** headlines + one-line synthesis at rest; detail on click. Tables only where comparison is the job (League, Compare, API exports); cards for narrative items; dashboards (widgets) only on Today and workspace Overviews.
- **Trust signals:** Verified/Reported badges with tooltips, primary-source chip on every card *(shipped: one source chip, not five)*, methodology one click from everywhere, every AI/derived insight stamped with its base and date.
- **Mobile:** Today collapses to Delta panel → deadline strip → chips → compact rows (rows are mobile default); maps become top-5 lists; command bar becomes a search sheet; quick actions in a long-press sheet.

## 7. Interaction and flow spec

- **Morning loop (target <90s):** open → Delta panel reads itself → tap one delta slice → skim Delta view rows → star one deal, `Add to workspace` → done. Every step is one click; no modal interrupts the loop.
- **BD loop:** Plays → Pitch Window → insight + list → `Save as alert` → Briefing Studio → Partner One-Pager → forward.
- **Risk loop (in-house):** Radar chip → Client Risk Sweep play → tag items `client-sensitive` → weekly digest carries the tagged set.
- **Keyboard:** `/` search · `⌘K` command bar · `j/k` row navigation · `w` watch · `c` add-to-compare · `Esc` closes.
- **State rules:** every view URL-addressable (hash routes, shipped); filters persist per session; Delta view always dismissible to "Show everything"; destructive actions (delete workspace) require typed confirmation; no other confirmations anywhere.
- **Empty/thin states:** every intelligence module renders nothing rather than filler; thin data gets the *Early* label, never fake confidence.

## 8. Monetization and moat strategy

**Tiers:** Free — Today, feed, radar, one workspace, no exports. **Professional (per-seat)** — unlimited workspaces, Plays, Delta view history, Briefing Studio, email digests, signals. **Team** — collaboration (§3.9), shared workspaces, CSV everywhere, head-to-heads. **Enterprise/Data** — API, webhooks, scheduled exports, SSO.

**Why this redesign raises willingness-to-pay:** the unit of value shifts from "access to records" (commodity, scrapable) to "synthesized judgment + workflow state" (compounding, personal). Delta panels and workspaces create owned state that makes leaving costly; briefings put the product's name inside partner meetings (distribution); chips/signals are produced by a verification-weighted corpus (EXTRA overlay, official-source matching, co-counsel graph) that a copycat cannot regenerate from public feeds. **Defensibility stack:** curated verification layer → derived graph (EDGES/SIGNALS) → user state (workspaces/tags) → team workflows. Each layer makes the next more valuable and harder to replicate. Pricing anchor: one recovered mandate or one avoided re-papering miss pays for years of seats; sell against Bloomberg Law's generality, not against free news.

## 9. Implementation roadmap and milestones

| Milestone | Scope | Effort | Dependencies / risks |
|---|---|---|---|
| **M0 — shipped now** | renames, de-crunch, export-button removal, simplified cards, sector dropdown | done | none |
| **M1 (wk 1–2)** | Delta panel + Delta view (localStorage diff); live header pills; chips v1 (rule-based, 3 chip types); widget customize menu | S–M | pure client-side; risk: snapshot schema churn — version it (`v:1`) |
| **M2 (wk 3–5)** | Plays (4 plays); Workspaces v1 (local); Briefing Studio v1 (Partner One-Pager via print-CSS PDF; email-copy) | M | PPTX deferred to M4; risk: scope — ship 4 plays, not a play builder |
| **M3 (wk 6–9)** | accounts (magic link), synced workspaces/watchlists, email digests (Action → ESP), team tags/comments v1 | L | first backend; pick managed stack (Supabase) to stay one-dev-sized |
| **M4 (wk 10–13)** | Market Maps (network, heat, adjacency); signals v1 (co-counsel, stickiness); League deltas (needs ≥90d accumulated history — start logging in M1) | M–L | D3 canvas perf; degrade rules from §3.3 are mandatory |
| **M5 (quarter 2)** | API + webhooks + scheduled exports; PPTX briefings; roles/permissions | L | only after ≥10 paying teams request it |

**Prototype first:** Delta panel (it is the thesis). **Test with users:** (1) 5-second test on the Delta panel — "what changed?"; (2) can a BD user run Pitch Window and produce a one-pager unaided in <3 minutes; (3) do chips get clicked to evidence (target >25% CTR). **Delay deliberately:** real-time anything, mobile apps, play builder, AI chat — all dilute the daily-brief cadence that defines the product.

## 10. Technical considerations and constraints

- **Pipeline contract is sacred:** all new data blocks use the existing comment-anchor + `const X=[` splice pattern; never edit inside generated blocks; preserve the `Updated D Mon YYYY` regex target. The nightly engine has already proven it splices cleanly into the redesigned file.
- **Single-file discipline until M3:** new modules are functions in the existing app layer; D3 (maps only) is the first permitted external dependency, loaded lazily on the Maps route.
- **Performance budget:** first paint <1s on hotel Wi-Fi; defer maps/signals rendering; index search corpus once at load; cap DOM rows at 200 with "show more".
- **State integrity:** version every localStorage schema; migrations on read; Delta diff must tolerate ids disappearing (deals pruned upstream).
- **Testing:** keep the jsdom smoke suite (currently 13–20 assertions) in CI; add per-milestone assertions (delta panel renders from a seeded snapshot; plays produce non-empty results on fixture data; briefing PDF prints without overflow).
- **Honesty constraints:** nightly cadence means "today" labels must tooltip the run timestamp; signals/chips must always link to evidence; nothing in the UI may imply real-time monitoring or legal advice.
- **Privacy/compliance:** client names in workspaces and tags are user content — once accounts exist (M3), encrypt at rest, scope per org, and exclude from analytics; the product itself must satisfy the DPDP regime it reports on.
