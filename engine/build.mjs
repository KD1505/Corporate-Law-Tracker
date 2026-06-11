// build.mjs — orchestrator run by GitHub Actions nightly.
//   1. read index.html, find existing deal ids (dedupe)
//   2. fetch newest Bar & Bench items not already present
//   3. structure each: FREE rule-based extractor by default; richer AI enricher
//      ONLY if ANTHROPIC_API_KEY is set
//   4. prepend the new deals into the DEALS block (between the markers)
//   5. refresh the "Updated …" date
//   6. write index.html back  (GitHub Actions then commits it → Vercel redeploys)
//
// Runs with ZERO paid services unless you opt into AI.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchNewItems, fetchMoves, fetchRegulators, fetchCommentary } from "./fetch.mjs";
import { fetchPublicDeals } from "./spine.mjs";
import { extractItem } from "./extract.mjs";
import { scoreDeal, OFFICIAL_RE } from "./score.mjs";
import { structureRegulatorFree, routeArticleFree, LAW_IDS } from "./ingest.mjs";
const GENERIC_PORTAL=/(corporates\/ann\.html|companies-listing\/corporate-filings|combination\/orders|public-issues\.html|BS_ViewMasDirections|AllReleasem|order-judgement-date-wise|sebiweb\/home|dipam\.gov\.in\/?$|meity\.gov\.in\/?$|ecourts\.gov\.in\/?$|ibbi\.gov\.in\/en\/orders$|nclt\.gov\.in)/i;
function hasSpecificOfficial(d){return (d.sources||[]).some(s=>(s.official===true||OFFICIAL_RE.test(s.url||""))&&!GENERIC_PORTAL.test(s.url||""));}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(__dirname, "..", "index.html");
const SEEN = path.join(__dirname, "seen.json");
const DISCOVERED = path.join(__dirname, "discovered-sources.json");
const START = "/* DEALS-START";
const END = "/* DEALS-END */";
const MAX_NEW = Number(process.env.CLT_MAX_NEW || 12);
const USE_AI = !!process.env.ANTHROPIC_API_KEY;

// Wide-net + depth controls (Phase 1).
const PRESS_MAX = Number(process.env.CLT_PRESS_MAX || MAX_NEW);          // Bar & Bench / RSS items per run
const BACKFILL_DAYS = Number(process.env.CLT_BACKFILL || 3);            // history window for the spine; set high (e.g. 120) for a one-off backfill
const SPINE_MAX = Number(process.env.CLT_SPINE_MAX || (BACKFILL_DAYS > 14 ? 250 : 60)); // public-deal disclosures ingested per run
const SPINE_PAGES = Math.min(40, Math.max(4, Math.ceil(BACKFILL_DAYS * 1.5)));          // BSE pages to walk
const AI_DEEP = Number(process.env.CLT_AI_DEEP || 18);                  // how many spine items to ENRICH DEEPLY with AI (cost guard)

// Safety-net relevance gate: drop anything that is clearly NOT a corporate/commercial
// matter, even if it somehow reaches us. Dealstreet is already deal-only, so this
// rarely triggers — it's belt-and-braces against criminal/political/PIL noise.
const JUNK = /\b(bail|murder|rape|fire|assault|custody|election|poll|assembly|MLA|MP\b|PIL|FIR|arrest|harass|defamation|divorce|gymkhana|polo)\b/i;
function isRelevant(item) { return !JUNK.test(item.headline || ""); }

async function loadSeen() {
  try { return new Set(JSON.parse(await readFile(SEEN, "utf8"))); }
  catch { return new Set(); }
}

// THE SOURCE FUNNEL: every domain that ever corroborates a deal is logged here with a
// running count. Over time this accumulates into a ranked map of the most useful credible
// sources — the raw material for promoting new sources into the curated registry.
async function loadDiscovered() {
  try { return JSON.parse(await readFile(DISCOVERED, "utf8")); }
  catch { return {}; }
}
function domainOf(url = "") { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } }
function recordDomains(disc, deals) {
  const today = new Date().toISOString().slice(0, 10);
  for (const d of deals) for (const s of d.sources || []) {
    const host = domainOf(s.url); if (!host) continue;
    const e = disc[host] || { count: 0, firstSeen: today, official: !!s.official };
    e.count += 1; e.lastSeen = today; if (s.official) e.official = true;
    disc[host] = e;
  }
  return disc;
}

function existingIds(html) {
  const a = html.indexOf(START), b = html.indexOf(END);
  const block = a !== -1 && b !== -1 ? html.slice(a, b) : html;
  // matches both hand-written  id:"x"  and auto-generated  "id":"x"
  return new Set([...block.matchAll(/"?id"?\s*:\s*"([^"]+)"/g)].map((m) => m[1]));
}
function moveIdsFrom(html) {
  const a = html.indexOf("MOVES-START"), b = html.indexOf("MOVES-END");
  const blk = a !== -1 && b !== -1 ? html.slice(a, b) : "";
  return new Set([...blk.matchAll(/barandbench\.com\/([^"']+)/g)].map((m) => m[1].split(/[?#]/)[0].split("/").pop().slice(0, 120)));
}
function spliceAfter(html, anchor, literals) {
  const at = html.indexOf(anchor);
  if (at === -1) throw new Error(`anchor not found: ${anchor}`);
  const p = at + anchor.length;
  return html.slice(0, p) + "\n" + literals + ",\n" + html.slice(p);
}
function blockOf(html, a, b) { const i = html.indexOf(a), j = html.indexOf(b); return i !== -1 && j !== -1 ? html.slice(i, j) : ""; }
function idsInBlock(blk) { return [...blk.matchAll(/"?id"?\s*:\s*"([^"]+)"/g)].map((m) => m[1]); }
function slugTailsInBlock(blk) { return [...blk.matchAll(/https?:\/\/[^"']+/g)].map((m) => m[0].split(/[?#]/)[0].split("/").pop().slice(0, 120)).filter(Boolean); }
function dealCatalogFrom(html) {
  const blk = blockOf(html, START, END);
  const ids = idsInBlock(blk);
  const heads = [...blk.matchAll(/headline:\s*"([^"]+)"/g)].map((m) => m[1]);
  return ids.map((id, i) => ({ id, headline: heads[i] || "", text: (heads[i] || "").toLowerCase() }));
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

async function structure(item, deep = true) {
  if (USE_AI && deep) {
    try {
      const { enrichItem } = await import("./enrich.mjs");
      return await enrichItem(item);
    } catch (e) {
      console.warn(`AI enrich failed for ${item.id} (${e.message}); falling back to free extractor.`);
    }
  }
  return extractItem(item);
}

const BRIEF = path.join(__dirname, "..", "brief.md");
function strip(s=""){return s.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();}
async function writeBrief(deals) {
  const d = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const order = { hi: 0, md: 1, lo: 2 };
  const sorted = [...deals].sort((a, b) => ((order[a.imp] ?? 3) - (order[b.imp] ?? 3)) || ((b.score || 0) - (a.score || 0))).slice(0, 40);
  let md = `# Corporate Law Tracker — Daily Brief\n_${d}_\n\n${deals.length} new development(s)${deals.length > 40 ? " — top 40 shown" : ""}.\n\n`;
  for (const x of sorted) {
    const src = (x.sources && x.sources[0] && x.sources[0].url) || "";
    md += `### ${x.imp === "hi" ? "🔴 " : ""}${x.headline}\n`;
    md += `**${(x.type || "").toUpperCase()}** · ${x.value && x.value !== "—" ? x.value + " · " : ""}${x.city || ""}${x.verified ? " · ✓ Verified" : " · Reported"}\n\n`;
    md += `${strip(x.sum)}\n\n`;
    if (x.implication) md += `*Why it matters:* ${strip(x.implication)}\n\n`;
    if (src) md += `[Open source ↗](${src})\n\n`;
    md += `---\n\n`;
  }
  md += `_Generated automatically by Corporate Law Tracker. Open the dashboard for the full picture, official filings and the legal-framework checklist per deal._\n`;
  await writeFile(BRIEF, md, "utf8");
}

async function main() {
  let html = await readFile(HTML, "utf8");
  let changed = false;
  console.log(`Mode: ${USE_AI ? "AI enrichment" : "FREE rule-based"}.`);

  /* ---------------- DEALS PHASE ---------------- */
  const seen = await loadSeen();
  const have = new Set([...existingIds(html), ...seen]);

  // (1) PRESS spine — Bar & Bench Dealstreet + RSS: deals with NAMED law-firm teams.
  const press = (await fetchNewItems(have, PRESS_MAX)).filter(isRelevant);
  press.forEach((p) => have.add(p.id));
  // (2) MANDATED-DISCLOSURE spine — BSE/NSE/CCI/SEBI: saturate the public-deals space.
  let spine = [];
  try { spine = (await fetchPublicDeals(have, { limit: SPINE_MAX, days: BACKFILL_DAYS, maxPages: SPINE_PAGES })).filter(isRelevant); }
  catch (e) { console.warn(`Spine phase skipped: ${e.message}`); }
  console.log(`New items — press: ${press.length}, spine: ${spine.length}${BACKFILL_DAYS > 14 ? ` (BACKFILL ${BACKFILL_DAYS}d)` : ""}.`);

  // Depth where it matters: deep AI-enrich every press item (named teams) + the most
  // material spine items; structure the long tail from filing metadata so NOTHING is missed.
  const deepIds = new Set([
    ...press.map((p) => p.id),
    ...spine.slice(0, AI_DEEP).map((s) => s.id),
  ]);
  const items = [...press, ...spine];
  const deals = [];
  let deepCount = 0;
  for (const item of items) {
    try {
      const deep = deepIds.has(item.id);
      const d = await structure(item, deep);
      if (d && d.id && d.headline) { deals.push(d); if (deep && USE_AI) deepCount++; }
    } catch (e) { console.warn(`  ! skipped ${item.id}: ${e.message}`); }
  }
  console.log(`Structured ${deals.length} deal(s)${USE_AI ? ` — ${deepCount} deep-enriched, ${deals.length - deepCount} metadata-structured` : " (free rule-based)"}.`);
  if (deals.length) {
    for (const d of deals) {
      const { score, imp, reasons } = scoreDeal(d);
      d.score = score; d.imp = imp; d.scoreReasons = reasons;
      d.verified = hasSpecificOfficial(d); // Verified only with a SPECIFIC official source
    }
    html = spliceAfter(html, "const DEALS=[", deals.map((d) => " " + JSON.stringify(d)).join(",\n"));
    for (const d of deals) seen.add(d.id);
    await writeFile(SEEN, JSON.stringify([...seen], null, 2), "utf8");
    await writeFile(DISCOVERED, JSON.stringify(recordDomains(await loadDiscovered(), deals), null, 2), "utf8");
    await writeBrief(deals);
    changed = true;
    console.log(`Added ${deals.length} deal(s).`);
  } else console.log("No new deals.");

  /* ---------------- MOVES PHASE (always runs) ---------------- */
  try {
    const moves = await fetchMoves(moveIdsFrom(html));
    if (moves.length) {
      const lits = moves.map((m) => " " + JSON.stringify({ headline: m.headline, type: m.type, date: m.date, url: m.url })).join(",\n");
      html = spliceAfter(html, "const MOVES=[", lits);
      changed = true;
      console.log(`Added ${moves.length} move(s).`);
    } else console.log("No new moves.");
  } catch (e) { console.warn(`Moves phase skipped: ${e.message}`); }

  /* ---------------- REGULATOR PHASE (notifications/circulars → tracker) ---------------- */
  try {
    const regBlk = blockOf(html, "REGITEMS-START", "REGITEMS-END");
    const regHave = new Set([...idsInBlock(regBlk), ...slugTailsInBlock(regBlk)]);
    const regs = await fetchRegulators(regHave);
    const regItems = [];
    for (const it of regs) {
      try { regItems.push(USE_AI ? await (await import("./enrich.mjs")).enrichRegulatorAI(it, LAW_IDS) : structureRegulatorFree(it)); }
      catch (e) { console.warn(`  ! regulator ${it.id}: ${e.message}`); regItems.push(structureRegulatorFree(it)); }
    }
    if (regItems.length) { html = spliceAfter(html, "const REGITEMS=[", regItems.map((r) => " " + JSON.stringify(r)).join(",\n")); changed = true; console.log(`Added ${regItems.length} regulator item(s).`); }
    else console.log("No new regulator items.");
  } catch (e) { console.warn(`Regulator phase skipped: ${e.message}`); }

  /* ---------------- COMMENTARY PHASE (articles → deal / trend / regulation) ---------------- */
  try {
    const commBlk = blockOf(html, "COMMENTARY-START", "COMMENTARY-END") + blockOf(html, "TRENDS-START", "TRENDS-END") + blockOf(html, "REGITEMS-START", "REGITEMS-END");
    const commHave = new Set(slugTailsInBlock(commBlk));
    const catalog = dealCatalogFrom(html);
    const arts = await fetchCommentary(commHave);
    const newComm = [], newTrends = [], newReg = [];
    for (const it of arts) {
      let r;
      try { r = USE_AI ? await (await import("./enrich.mjs")).routeArticleAI(it, catalog.map((c) => ({ id: c.id, headline: c.headline })), LAW_IDS) : routeArticleFree(it, catalog); }
      catch (e) { console.warn(`  ! route ${it.id}: ${e.message}`); r = routeArticleFree(it, catalog); }
      if (r.kind === "deal") newComm.push(r.payload);
      else if (r.kind === "regulation") newReg.push(r.payload);
      else newTrends.push(r.payload);
    }
    if (newComm.length) { html = spliceAfter(html, "const COMMENTARY=[", newComm.map((c) => " " + JSON.stringify(c)).join(",\n")); changed = true; }
    if (newTrends.length) { html = spliceAfter(html, "const TRENDS=[", newTrends.map((t) => " " + JSON.stringify(t)).join(",\n")); changed = true; }
    if (newReg.length) { html = spliceAfter(html, "const REGITEMS=[", newReg.map((r) => " " + JSON.stringify(r)).join(",\n")); changed = true; }
    const n = newComm.length + newTrends.length + newReg.length;
    console.log(n ? `Added ${newComm.length} commentary, ${newTrends.length} trend(s), ${newReg.length} reg-analysis.` : "No new commentary.");
  } catch (e) { console.warn(`Commentary phase skipped: ${e.message}`); }

  /* ---------------- WRITE ---------------- */
  if (changed) {
    html = html.replace(/Updated \d{1,2} [A-Za-z]{3,} \d{4}/g, `Updated ${todayLabel()}`);
    await writeFile(HTML, html, "utf8");
    console.log("index.html updated.");
  } else console.log("Nothing new anywhere. Clean exit.");
}

main().catch((e) => { console.error(e); process.exit(1); });
