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
import { fetchNewItems, fetchMoves } from "./fetch.mjs";
import { extractItem } from "./extract.mjs";
import { scoreDeal, OFFICIAL_RE } from "./score.mjs";
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

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

async function structure(item) {
  if (USE_AI) {
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
  const sorted = [...deals].sort((a, b) => (order[a.imp] ?? 3) - (order[b.imp] ?? 3));
  let md = `# Corporate Law Tracker — Daily Brief\n_${d}_\n\n${deals.length} new development(s) overnight.\n\n`;
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
  let items = (await fetchNewItems(have, MAX_NEW)).filter(isRelevant);
  console.log(`New relevant deal items: ${items.length}`);
  const deals = [];
  for (const item of items) {
    try {
      const d = await structure(item);
      if (d && d.id && d.headline) { deals.push(d); console.log(`  • deal: ${item.id}`); }
    } catch (e) { console.warn(`  ! skipped ${item.id}: ${e.message}`); }
  }
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

  /* ---------------- WRITE ---------------- */
  if (changed) {
    html = html.replace(/Updated \d{1,2} [A-Za-z]{3,} \d{4}/g, `Updated ${todayLabel()}`);
    await writeFile(HTML, html, "utf8");
    console.log("index.html updated.");
  } else console.log("Nothing new anywhere. Clean exit.");
}

main().catch((e) => { console.error(e); process.exit(1); });
