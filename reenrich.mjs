// reenrich.mjs — backlog enrichment + monthly refresh cycle.
//
// Enriches EVERY live deal with the AI enricher, TIERED:
//   • marquee/significant deals  → DEEP enrichment (AI + web-search across many sources)
//   • everything else            → AI enrichment WITHOUT web search (cheaper)
// Each deal is stamped with `enrichedAt`. A deal is (re)processed if it has never been
// enriched OR was last enriched more than CLT_REENRICH_AGE days ago — so the same script
// does the one-time "enrich all" pass AND the monthly refresh.
//
// REQUIRES: ANTHROPIC_API_KEY.
// USAGE:  CLT_REENRICH=80 node reenrich.mjs   (batch size; re-run until "0 due remaining").
//         CLT_REENRICH_AGE=30  → refresh anything older than 30 days (default).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { scoreDeal, isMarquee } from "./score.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data.js");
const BATCH = Number(process.env.CLT_REENRICH || 0);
const AGE_DAYS = Number(process.env.CLT_REENRICH_AGE || 30);

// Hand-curated deals keep their rich detail in index.html maps — never touch them here.
const CURATED = new Set(["acme-qip","airtel-spectrum","jsw-energy-qip","coal-india-ofs","irfc-hyd-metro","jsa-hdfc-indusinfra","tata-freight-tiger","paytm-elevation","hcl-foxconn","pepsico-varun","coforge-cigniti","embio-truenorth","anveshan-seriesb","hfcl-pref","hfcl-qip","pagani-residency"]);

function parse(src) { const window = {}; eval(src); return window.CLT_DATA || {}; }
function mergeUnique(a = [], b = []) {
  const seen = new Set(), out = [];
  for (const s of [...a, ...b]) { const k = (s && s.url) || JSON.stringify(s); if (s && !seen.has(k)) { seen.add(k); out.push(s); } }
  return out;
}
function isDue(d) {
  if (CURATED.has(d.id)) return false;
  if (!d.enrichedAt) return true;
  const t = Date.parse(d.enrichedAt.replace(/^Updated\s+/, ""));
  if (isNaN(t)) return true;
  return (Date.now() - t) > AGE_DAYS * 864e5;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("reenrich: ANTHROPIC_API_KEY not set — AI required. Aborting."); process.exit(1); }
  if (BATCH <= 0) { console.log("reenrich: set CLT_REENRICH to a batch size (e.g. 80). Nothing to do."); return; }

  const src = await readFile(DATA, "utf8");
  const C = parse(src);
  const deals = C.DEALS || [];
  const { enrichItem } = await import("./enrich.mjs");
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const due = deals.map((d, i) => ({ d, i })).filter((x) => isDue(x.d));
  // oldest / never-enriched first
  due.sort((a, b) => (Date.parse((a.d.enrichedAt || "").replace(/^Updated\s+/, "")) || 0) - (Date.parse((b.d.enrichedAt || "").replace(/^Updated\s+/, "")) || 0));
  const batch = due.slice(0, BATCH);
  console.log(`reenrich: ${due.length} deals due; processing ${batch.length} this run (refresh age ${AGE_DAYS}d).`);

  let deep = 0, std = 0;
  for (const { d, i } of batch) {
    const marquee = isMarquee(d);
    const url = (d.sources && d.sources[0] && d.sources[0].url) || "";
    const item = { id: d.id, url, headline: d.headline, body: [d.sum, d.detail].filter(Boolean).join(" "), published: Date.parse(d.time) || Date.now() };
    try {
      const e = await enrichItem(item, marquee);   // marquee → web search on; else off
      const merged = { ...d, ...e, id: d.id, enrichedAt: today, enrichTier: marquee ? "deep" : "standard",
        sources: mergeUnique(e.sources, d.sources), docs: mergeUnique(e.docs, d.docs) };
      const { score, imp } = scoreDeal(merged); merged.score = score; merged.imp = imp;
      deals[i] = merged; marquee ? deep++ : std++;
      console.log(`  ✓ ${marquee ? "deep " : "std  "} ${d.id}`);
    } catch (err) { console.warn(`  ! skipped ${d.id} - ${err.message}`); }
  }

  // regenerate data.js (preserve markers + LINKCHECK + UPDATED)
  const arr = (n) => `/* ${n}-START */\nwindow.CLT_DATA.${n}=[\n` + (C[n] || []).map((x) => " " + JSON.stringify(x)).join(",\n") + `\n];\n/* ${n}-END */\n\n`;
  let out = "/* CLT DATA — generated & owned by engine/build.mjs. Single source of truth.\n   Do NOT hand-edit; the nightly pipeline regenerates this file. */\nwindow.CLT_DATA = window.CLT_DATA || {};\n\n";
  out += arr("DEALS") + arr("MOVES") + arr("REGITEMS") + arr("COMMENTARY") + arr("TRENDS");
  if (C.LINKCHECK) out += `/* LINKCHECK-START */\nwindow.CLT_DATA.LINKCHECK=${JSON.stringify(C.LINKCHECK)};\n/* LINKCHECK-END */\n\n`;
  out += `window.CLT_DATA.UPDATED=${JSON.stringify(C.UPDATED || ("Updated " + today))};\n`;
  await writeFile(DATA, out, "utf8");
  console.log(`reenrich: done — ${deep} deep, ${std} standard; ${due.length - batch.length} due remaining. data.js updated.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
