// build.mjs — nightly orchestrator (run by GitHub Actions).
//   Ingests new deals (press + mandated-disclosure spine), enriches them, and writes data.js.
//   data.js is the SINGLE SOURCE OF TRUTH; index.html is a data-free shell that reads it.
//
// Enrichment is TIERED: marquee/significant deals get DEEP enrichment (AI + web-search
// triangulation across sources); everything else gets AI enrichment WITHOUT web search
// (cheaper). A per-run cap (CLT_AI_MAX) bounds nightly cost; anything beyond it is
// metadata-structured and upgraded later by the monthly re-enrichment cycle (reenrich.mjs).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchNewItems, fetchMoves, fetchRegulators, fetchCommentary } from "./fetch.mjs";
import { fetchPublicDeals } from "./spine.mjs";
import { extractItem } from "./extract.mjs";
import { scoreDeal, OFFICIAL_RE, rawMarquee } from "./score.mjs";
import { structureRegulatorFree, routeArticleFree, LAW_IDS } from "./ingest.mjs";
const GENERIC_PORTAL=/(corporates\/ann\.html|companies-listing\/corporate-filings|combination\/orders|public-issues\.html|BS_ViewMasDirections|AllReleasem|order-judgement-date-wise|sebiweb\/home|dipam\.gov\.in\/?$|meity\.gov\.in\/?$|ecourts\.gov\.in\/?$|ibbi\.gov\.in\/en\/orders$|nclt\.gov\.in)/i;
function hasSpecificOfficial(d){return (d.sources||[]).some(s=>(s.official===true||OFFICIAL_RE.test(s.url||""))&&!GENERIC_PORTAL.test(s.url||""));}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(__dirname, "..", "index.html");
const DATA = path.join(__dirname, "..", "data.js");
const SEEN = path.join(__dirname, "seen.json");
const DISCOVERED = path.join(__dirname, "discovered-sources.json");
const START = "/* DEALS-START";
const END = "/* DEALS-END */";
const MAX_NEW = Number(process.env.CLT_MAX_NEW || 12);
const USE_AI = !!process.env.ANTHROPIC_API_KEY;

// Wide-net + depth controls.
const PRESS_MAX = Number(process.env.CLT_PRESS_MAX || MAX_NEW);          // Bar & Bench / RSS items per run
const BACKFILL_DAYS = Number(process.env.CLT_BACKFILL || 3);            // history window for the spine; set high (e.g. 120) for a one-off backfill
const SPINE_MAX = Number(process.env.CLT_SPINE_MAX || (BACKFILL_DAYS > 14 ? 400 : 100)); // safety ceiling on disclosures ingested per run
const SPINE_MIN = Number(process.env.CLT_SPINE_MIN || 25);             // materiality THRESHOLD — keep every deal at/above this, drop noise below
const SPINE_PAGES = Math.min(40, Math.max(4, Math.ceil(BACKFILL_DAYS * 1.5)));
const AI_MAX = Number(process.env.CLT_AI_MAX || 50);                    // max AI enrichments per run (nightly cost cap)

const JUNK = /\b(bail|murder|rape|fire|assault|custody|election|poll|assembly|MLA|MP\b|PIL|FIR|arrest|harass|defamation|divorce|gymkhana|polo)\b/i;
function isRelevant(item) { return !JUNK.test(item.headline || ""); }

async function loadSeen() {
  try { return new Set(JSON.parse(await readFile(SEEN, "utf8"))); }
  catch { return new Set(); }
}
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

// Tiered structuring: useAI=false → free extractor; useAI=true → AI enricher, with web
// search on/off per useSearch.
async function structure(item, useAI, useSearch) {
  if (useAI) {
    try {
      const { enrichItem } = await import("./enrich.mjs");
      return await enrichItem(item, useSearch);
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
  md += `_Generated automatically by Corporate Law Tracker._\n`;
  await writeFile(BRIEF, md, "utf8");
}

async function ensureDataFile() {
  try { return await readFile(DATA, "utf8"); }
  catch {
    console.log("data.js not found — migrating data out of index.html (one-time).");
    const html = await readFile(HTML, "utf8");
    const NAMES = ["DEALS", "MOVES", "REGITEMS", "COMMENTARY", "TRENDS"];
    let out = "/* CLT DATA — generated & owned by engine/build.mjs. Single source of truth.\n   Do NOT hand-edit; the nightly pipeline regenerates this file. */\nwindow.CLT_DATA = window.CLT_DATA || {};\n\n";
    for (const N of NAMES) {
      const m = html.match(new RegExp("const " + N + "=\\[([\\s\\S]*?)\\];"));
      const body = m ? m[1].trim() : "";
      out += `/* ${N}-START */\nwindow.CLT_DATA.${N}=[\n${body}\n];\n/* ${N}-END */\n\n`;
    }
    out += `window.CLT_DATA.UPDATED="Updated ${todayLabel()}";\n`;
    out = out.replace(/\bname:SRC\b/g, 'name:"Bar & Bench — Dealstreet"');
    await writeFile(DATA, out, "utf8");
    return out;
  }
}

async function main() {
  let data = await ensureDataFile();
  let changed = false;
  console.log(`Mode: ${USE_AI ? "AI enrichment (tiered)" : "FREE rule-based"}.`);
  const TODAY = todayLabel();

  /* ---------------- DEALS PHASE ---------------- */
  const seen = await loadSeen();
  const have = existingIds(data);

  // (1) PRESS spine — Bar & Bench Dealstreet + RSS: deals with NAMED law-firm teams.
  const press = (await fetchNewItems(have, PRESS_MAX)).filter(isRelevant);
  press.forEach((p) => have.add(p.id));
  // (2) MANDATED-DISCLOSURE spine — BSE/NSE: saturate the public-deals space.
  let spine = [];
  try { spine = (await fetchPublicDeals(have, { limit: SPINE_MAX, days: BACKFILL_DAYS, maxPages: SPINE_PAGES })).filter(isRelevant); }
  catch (e) { console.warn(`Spine phase skipped: ${e.message}`); }
  // QUANTITY via THRESHOLD: keep every deal at/above the materiality floor (drop routine noise),
  // rather than a blunt top-N cut.
  const spineKept = spine.filter((s) => (s.material || 0) >= SPINE_MIN);
  console.log(`New items — press: ${press.length}, spine: ${spineKept.length} (of ${spine.length} ≥ materiality ${SPINE_MIN})${BACKFILL_DAYS > 14 ? `, BACKFILL ${BACKFILL_DAYS}d` : ""}.`);

  const items = [...press, ...spineKept];
  const deals = [];
  let aiUsed = 0, deepN = 0, stdN = 0;
  for (const item of items) {
    const marquee = rawMarquee(item);
    const useAI = USE_AI && aiUsed < AI_MAX;
    const useSearch = useAI && marquee;
    try {
      const d = await structure(item, useAI, useSearch);
      if (d && d.id && d.headline) {
        if (useAI) { aiUsed++; if (useSearch) deepN++; else stdN++; d.enrichedAt = TODAY; d.enrichTier = useSearch ? "deep" : "standard"; }
        else d.enrichTier = d.enrichTier || "metadata";
        deals.push(d);
      }
    } catch (e) { console.warn(`  ! skipped ${item.id}: ${e.message}`); }
  }
  console.log(`Structured ${deals.length} deal(s)${USE_AI ? ` — ${deepN} deep (web-search), ${stdN} standard (no search), ${deals.length - deepN - stdN} metadata` : " (free rule-based)"}.`);

  if (deals.length) {
    for (const d of deals) {
      const { score, imp, reasons } = scoreDeal(d);
      d.score = score; d.imp = imp; d.scoreReasons = reasons;
      d.verified = hasSpecificOfficial(d);
    }
    data = spliceAfter(data, "window.CLT_DATA.DEALS=[", deals.map((d) => " " + JSON.stringify(d)).join(",\n"));
    for (const d of deals) seen.add(d.id);
    await writeFile(SEEN, JSON.stringify([...seen], null, 2), "utf8");
    await writeFile(DISCOVERED, JSON.stringify(recordDomains(await loadDiscovered(), deals), null, 2), "utf8");
    await writeBrief(deals);
    changed = true;
    console.log(`Added ${deals.length} deal(s).`);
  } else console.log("No new deals.");

  /* ---------------- MOVES PHASE ---------------- */
  try {
    const moves = await fetchMoves(moveIdsFrom(data));
    if (moves.length) {
      const lits = moves.map((m) => " " + JSON.stringify({ headline: m.headline, type: m.type, date: m.date, url: m.url })).join(",\n");
      data = spliceAfter(data, "window.CLT_DATA.MOVES=[", lits);
      changed = true; console.log(`Added ${moves.length} move(s).`);
    } else console.log("No new moves.");
  } catch (e) { console.warn(`Moves phase skipped: ${e.message}`); }

  /* ---------------- REGULATOR PHASE ---------------- */
  try {
    const regBlk = blockOf(data, "REGITEMS-START", "REGITEMS-END");
    const regHave = new Set([...idsInBlock(regBlk), ...slugTailsInBlock(regBlk)]);
    const regs = await fetchRegulators(regHave);
    const regItems = [];
    for (const it of regs) {
      try { regItems.push(USE_AI ? await (await import("./enrich.mjs")).enrichRegulatorAI(it, LAW_IDS) : structureRegulatorFree(it)); }
      catch (e) { console.warn(`  ! regulator ${it.id}: ${e.message}`); regItems.push(structureRegulatorFree(it)); }
    }
    if (regItems.length) { data = spliceAfter(data, "window.CLT_DATA.REGITEMS=[", regItems.map((r) => " " + JSON.stringify(r)).join(",\n")); changed = true; console.log(`Added ${regItems.length} regulator item(s).`); }
    else console.log("No new regulator items.");
  } catch (e) { console.warn(`Regulator phase skipped: ${e.message}`); }

  /* ---------------- COMMENTARY PHASE ---------------- */
  try {
    const commBlk = blockOf(data, "COMMENTARY-START", "COMMENTARY-END") + blockOf(data, "TRENDS-START", "TRENDS-END") + blockOf(data, "REGITEMS-START", "REGITEMS-END");
    const commHave = new Set(slugTailsInBlock(commBlk));
    const catalog = dealCatalogFrom(data);
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
    if (newComm.length) { data = spliceAfter(data, "window.CLT_DATA.COMMENTARY=[", newComm.map((c) => " " + JSON.stringify(c)).join(",\n")); changed = true; }
    if (newTrends.length) { data = spliceAfter(data, "window.CLT_DATA.TRENDS=[", newTrends.map((t) => " " + JSON.stringify(t)).join(",\n")); changed = true; }
    if (newReg.length) { data = spliceAfter(data, "window.CLT_DATA.REGITEMS=[", newReg.map((r) => " " + JSON.stringify(r)).join(",\n")); changed = true; }
    const n = newComm.length + newTrends.length + newReg.length;
    console.log(n ? `Added ${newComm.length} commentary, ${newTrends.length} trend(s), ${newReg.length} reg-analysis.` : "No new commentary.");
  } catch (e) { console.warn(`Commentary phase skipped: ${e.message}`); }

  /* ---------------- WRITE (data.js only) ---------------- */
  if (changed) {
    data = data.replace(/window\.CLT_DATA\.UPDATED="[^"]*"/, `window.CLT_DATA.UPDATED="Updated ${TODAY}"`);
    await writeFile(DATA, data, "utf8");
    console.log("data.js updated.");
  } else console.log("Nothing new anywhere. Clean exit.");

  /* ---------------- LINK-CHECK PHASE ---------------- */
  if (process.env.CLT_LINKCHECK !== "0") {
    try { const { runLinkCheck } = await import("./linkcheck.mjs"); await runLinkCheck(); }
    catch (e) { console.warn(`Link-check skipped: ${e.message}`); }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
