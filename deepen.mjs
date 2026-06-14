// deepen.mjs — one-shot upgrader for the EXISTING deal backlog.
//
// Re-runs the AI enricher (multi-source web triangulation) over deals that are still "thin"
// (single source, no structure/implication/framework), so opening a card delivers real,
// credibly-sourced detail instead of one line. New deals already come in rich when the
// pipeline runs in AI mode; this fixes the ones ingested earlier in FREE mode.
//
// REQUIRES: ANTHROPIC_API_KEY (AI is the only honest way to add new, sourced detail).
// RECOMMENDED: CLT_USE_SEARCH=1  (turns on multi-source web scanning per deal).
// USAGE: process a batch at a time, e.g.  CLT_DEEPEN=30 node deepen.mjs  (repeat until 0 thin).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { scoreDeal } from "./score.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data.js");
const MAX = Number(process.env.CLT_DEEPEN || 0);

function parse(src) { const window = {}; eval(src); return window.CLT_DATA || {}; }

// The 16 hand-curated deals keep their rich detail in index.html maps (EXTRA/STRUCT/FRAMEWORK),
// so they only LOOK thin here — never re-enrich (and never overwrite) them.
const CURATED = new Set(["acme-qip","airtel-spectrum","jsw-energy-qip","coal-india-ofs","irfc-hyd-metro","jsa-hdfc-indusinfra","tata-freight-tiger","paytm-elevation","hcl-foxconn","pepsico-varun","coforge-cigniti","embio-truenorth","anveshan-seriesb","hfcl-pref","hfcl-qip","pagani-residency"]);
// A deal is "thin" if its own record lacks the partner-grade detail layer.
function isThin(d) {
  if (CURATED.has(d.id)) return false;
  const ns = (d.sources || []).length, det = (d.detail || "").length;
  return !d.implication || det < 140 || ns < 2;
}
function mergeUnique(a = [], b = []) {
  const seen = new Set(), out = [];
  for (const s of [...a, ...b]) { const k = (s && s.url) || JSON.stringify(s); if (s && !seen.has(k)) { seen.add(k); out.push(s); } }
  return out;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("deepen: ANTHROPIC_API_KEY not set. AI is required to add credible, sourced detail — aborting (no fabrication).");
    process.exit(1);
  }
  if (MAX <= 0) { console.log("deepen: set CLT_DEEPEN to a batch size (e.g. 30). Nothing to do."); return; }

  const src = await readFile(DATA, "utf8");
  const C = parse(src);
  const deals = C.DEALS || [];
  const { enrichItem } = await import("./enrich.mjs");

  const thin = deals.map((d, i) => ({ d, i })).filter((x) => isThin(x.d));
  thin.sort((a, b) => (a.d.detail || "").length - (b.d.detail || "").length); // thinnest first
  const batch = thin.slice(0, MAX);
  console.log(`deepen: ${thin.length} thin deal(s); deepening ${batch.length} this run (web-search=${process.env.CLT_USE_SEARCH === "1" ? "ON" : "off"}).`);

  let done = 0;
  for (const { d, i } of batch) {
    const url = (d.sources && d.sources[0] && d.sources[0].url) || "";
    const item = { id: d.id, url, headline: d.headline, body: [d.sum, d.detail].filter(Boolean).join(" "), published: Date.parse(d.time) || Date.now() };
    try {
      const e = await enrichItem(item);
      const merged = {
        ...d, ...e, id: d.id,
        // never lose the original primary filing; union enriched + existing
        sources: mergeUnique(e.sources, d.sources),
        docs: mergeUnique(e.docs, d.docs),
      };
      const { score, imp } = scoreDeal(merged); merged.score = score; merged.imp = imp;
      deals[i] = merged; done++;
      console.log("  ✓ deepened:", d.id);
    } catch (err) { console.warn("  ! skipped", d.id, "-", err.message); }
  }

  // regenerate data.js (preserve markers + LINKCHECK + UPDATED)
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const arr = (n) => `/* ${n}-START */\nwindow.CLT_DATA.${n}=[\n` + (C[n] || []).map((x) => " " + JSON.stringify(x)).join(",\n") + `\n];\n/* ${n}-END */\n\n`;
  let out = "/* CLT DATA — generated & owned by engine/build.mjs. Single source of truth.\n   Do NOT hand-edit; the nightly pipeline regenerates this file. */\nwindow.CLT_DATA = window.CLT_DATA || {};\n\n";
  out += arr("DEALS") + arr("MOVES") + arr("REGITEMS") + arr("COMMENTARY") + arr("TRENDS");
  if (C.LINKCHECK) out += `/* LINKCHECK-START */\nwindow.CLT_DATA.LINKCHECK=${JSON.stringify(C.LINKCHECK)};\n/* LINKCHECK-END */\n\n`;
  out += `window.CLT_DATA.UPDATED=${JSON.stringify(C.UPDATED || ("Updated " + today))};\n`;
  await writeFile(DATA, out, "utf8");
  console.log(`deepen: done ${done} deal(s) this run; ${thin.length - done} thin remaining. data.js updated.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
