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
import { fetchNewItems } from "./fetch.mjs";
import { extractItem } from "./extract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(__dirname, "..", "index.html");
const SEEN = path.join(__dirname, "seen.json");
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

function existingIds(html) {
  const a = html.indexOf(START), b = html.indexOf(END);
  const block = a !== -1 && b !== -1 ? html.slice(a, b) : html;
  // matches both hand-written  id:"x"  and auto-generated  "id":"x"
  return new Set([...block.matchAll(/"?id"?\s*:\s*"([^"]+)"/g)].map((m) => m[1]));
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

async function main() {
  let html = await readFile(HTML, "utf8");
  const seen = await loadSeen();
  const have = new Set([...existingIds(html), ...seen]); // dedupe vs page AND ledger
  console.log(`Known items: ${have.size} (page + ledger). Mode: ${USE_AI ? "AI enrichment" : "FREE rule-based"}.`);

  let items = await fetchNewItems(have, MAX_NEW);
  items = items.filter(isRelevant); // belt-and-braces relevance gate
  console.log(`New relevant items fetched: ${items.length}`);
  if (!items.length) { console.log("Nothing new. Exiting clean."); return; }

  const deals = [];
  for (const item of items) {
    try {
      const d = await structure(item);
      if (d && d.id && d.headline) deals.push(d);
      console.log(`  • structured: ${item.id}`);
    } catch (e) {
      console.warn(`  ! skipped ${item.id}: ${e.message}`);
    }
  }
  if (!deals.length) { console.log("No deals structured. Exiting."); return; }

  // serialise new deals as JS-valid object literals (JSON is valid JS here)
  const literals = deals.map((d) => " " + JSON.stringify(d)).join(",\n");

  // splice into the DEALS array, right after "const DEALS=["
  const anchor = "const DEALS=[";
  const at = html.indexOf(anchor);
  if (at === -1) throw new Error("DEALS anchor not found — markers missing in index.html");
  const insertPos = at + anchor.length;
  html = html.slice(0, insertPos) + "\n" + literals + ",\n" + html.slice(insertPos);

  // refresh the visible "Updated …" date (span + JS fallback)
  html = html.replace(/Updated \d{1,2} [A-Za-z]{3,} \d{4}/g, `Updated ${todayLabel()}`);

  await writeFile(HTML, html, "utf8");

  // record what we ingested so it is never added twice
  for (const d of deals) seen.add(d.id);
  await writeFile(SEEN, JSON.stringify([...seen], null, 2), "utf8");

  console.log(`Added ${deals.length} deal(s). index.html + seen.json updated.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
