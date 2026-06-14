// linkcheck.mjs — nightly source-link health checker.
//
// Pings every source/doc URL across all deals, classifies each, and stamps every deal
// with a link-health status that the dashboard surfaces as "Links verified ✓ <date>".
//
// Design principles (so this BUILDS trust rather than breaking it):
//  - Government / exchange portals (BSE, NSE, CCI, SEBI) frequently bot-block automated
//    requests. A 403/429/timeout/5xx is therefore treated as "couldn't verify" — NOT "dead".
//    Only a real 404/410 marks a link dead.
//  - 7-day result cache + a per-run cap → incremental, polite, spreads load over nights.
//  - Per-host serialisation + small global concurrency → never hammers one site.
//  - Writes a detailed link-report.json (audit trail) and a COMPACT stamp into data.js.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data.js");
const REPORT = path.join(__dirname, "link-report.json");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const FRESH_DAYS = Number(process.env.CLT_LC_FRESH || 7);     // reuse a result if checked within this window
const MAX = Number(process.env.CLT_LC_MAX || 400);            // max (re)checks per run — keeps runtime bounded
const TIMEOUT = Number(process.env.CLT_LC_TIMEOUT || 9000);
const CONC = Number(process.env.CLT_LC_CONC || 6);
const HOST_GAP = Number(process.env.CLT_LC_HOST_GAP || 600);  // min ms between hits to the same host

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const todayISO = () => new Date().toISOString().slice(0, 10);
const todayLabel = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } }
function norm(u) { try { const x = new URL(u); return x.origin + x.pathname.replace(/\/$/, ""); } catch { return u; } }

// Evaluate the (trusted, self-generated) data.js to get the deal objects.
function parseData(src) {
  const window = {};
  // eslint-disable-next-line no-eval
  eval(src);
  return window.CLT_DATA || {};
}

async function ping(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { method: "GET", redirect: "follow", headers: { "User-Agent": UA, "Accept": "*/*", "Accept-Language": "en-US,en;q=0.9" }, signal: ctrl.signal });
    const finalUrl = r.url || url;
    const redirected = r.redirected || norm(finalUrl) !== norm(url);
    if (r.status === 404 || r.status === 410) return { status: "dead", code: r.status, finalUrl };
    if (r.status >= 200 && r.status < 400) return { status: redirected ? "redirected" : "ok", code: r.status, finalUrl };
    // 401/403/429/5xx → almost always a bot-block or transient issue on gov/exchange sites, not a dead link
    return { status: "unknown", code: r.status, finalUrl };
  } catch (e) {
    return { status: "unknown", code: 0, error: String(e && e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

export async function runLinkCheck() {
  let src;
  try { src = await readFile(DATA, "utf8"); }
  catch { console.warn("link-check: data.js not found; skipping."); return; }

  const data = parseData(src);
  const deals = data.DEALS || [];
  if (!deals.length) { console.log("link-check: no deals."); return; }

  // load cache
  let report = { urls: {}, deals: {}, history: [] };
  try { report = JSON.parse(await readFile(REPORT, "utf8")); report.urls = report.urls || {}; report.deals = report.deals || {}; } catch {}

  // gather unique URLs per deal
  const dealUrls = new Map();   // id -> [urls]
  const allUrls = new Set();
  for (const d of deals) {
    const urls = [];
    for (const s of (d.sources || [])) if (s && s.url && /^https?:\/\//.test(s.url)) urls.push(s.url);
    for (const dd of (d.docs || [])) if (dd && dd.url && /^https?:\/\//.test(dd.url)) urls.push(dd.url);
    const uniq = [...new Set(urls.map(norm).map((n, i) => urls[i]))]; // keep originals, de-dupe by norm
    dealUrls.set(d.id, [...new Set(urls)]);
    for (const u of urls) allUrls.add(u);
  }

  // decide which URLs to (re)check this run: stale or never-checked first, then previously-unknown
  const cutoff = Date.now() - FRESH_DAYS * 864e5;
  const fresh = (u) => { const e = report.urls[u]; return e && e.at && Date.parse(e.at) > cutoff && e.status !== "unknown"; };
  const toCheck = [...allUrls].filter((u) => !fresh(u));
  // prioritise: never-checked, then oldest
  toCheck.sort((a, b) => {
    const ea = report.urls[a], eb = report.urls[b];
    return (ea ? Date.parse(ea.at || 0) : 0) - (eb ? Date.parse(eb.at || 0) : 0);
  });
  const batch = toCheck.slice(0, MAX);
  console.log(`link-check: ${allUrls.size} unique URLs, ${toCheck.length} stale, checking ${batch.length} this run.`);

  // group by host, run hosts in parallel (CONC) but URLs within a host sequentially with a gap
  const byHost = new Map();
  for (const u of batch) { const h = hostOf(u); if (!byHost.has(h)) byHost.set(h, []); byHost.get(h).push(u); }
  const hosts = [...byHost.keys()];
  let hi = 0, dead = 0, redir = 0, ok = 0, unk = 0;
  async function worker() {
    while (hi < hosts.length) {
      const h = hosts[hi++];
      for (const u of byHost.get(h)) {
        const res = await ping(u);
        report.urls[u] = { status: res.status, code: res.code, at: todayISO(), finalUrl: res.finalUrl || u };
        if (res.status === "dead") dead++; else if (res.status === "redirected") redir++; else if (res.status === "ok") ok++; else unk++;
        await sleep(HOST_GAP);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, hosts.length) }, worker));

  // compute per-deal status from the full URL cache
  const stamp = {};   // id -> "v" | "i" | "u"   (verified / issues / unverified)
  let vC = 0, iC = 0, uC = 0;
  for (const d of deals) {
    const urls = dealUrls.get(d.id) || [];
    let nDead = 0, nGood = 0;
    for (const u of urls) {
      const e = report.urls[u];
      if (!e) continue;
      if (e.status === "dead") nDead++;
      else if (e.status === "ok" || e.status === "redirected") nGood++;
    }
    const st = nDead > 0 ? "i" : (nGood > 0 ? "v" : "u");
    stamp[d.id] = st;
    if (st === "v") vC++; else if (st === "i") iC++; else uC++;
    report.deals[d.id] = { at: todayISO(), total: urls.length, good: nGood, dead: nDead };
  }

  report.history = (report.history || []).slice(-30);
  report.history.push({ at: todayISO(), checked: batch.length, dead, redirected: redir, ok, unknown: unk, verifiedDeals: vC, issueDeals: iC });
  report.lastRun = todayISO();
  await writeFile(REPORT, JSON.stringify(report, null, 2), "utf8");

  // splice a COMPACT stamp into data.js: window.CLT_DATA.LINKCHECK = { at, deals:{id:"v|i|u"} }
  const block = `window.CLT_DATA.LINKCHECK=${JSON.stringify({ at: todayLabel(), deals: stamp })};`;
  let out = src;
  if (/\/\* LINKCHECK-START \*\/[\s\S]*?\/\* LINKCHECK-END \*\//.test(out)) {
    out = out.replace(/\/\* LINKCHECK-START \*\/[\s\S]*?\/\* LINKCHECK-END \*\//, `/* LINKCHECK-START */\n${block}\n/* LINKCHECK-END */`);
  } else {
    // insert just before the UPDATED line (or append)
    const anchor = out.indexOf("window.CLT_DATA.UPDATED");
    const ins = `/* LINKCHECK-START */\n${block}\n/* LINKCHECK-END */\n`;
    out = anchor !== -1 ? out.slice(0, anchor) + ins + out.slice(anchor) : out + "\n" + ins;
  }
  await writeFile(DATA, out, "utf8");
  console.log(`link-check: ${vC} deals link-verified, ${iC} with a dead link, ${uC} unverified. (dead URLs this run: ${dead}, redirected: ${redir})`);
}

// allow `node linkcheck.mjs` to run it standalone
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runLinkCheck().catch((e) => { console.error(e); process.exit(1); });
}
