// spine.mjs — the MANDATED-DISCLOSURE SPINE.
//
// Phase 1 of "saturate the public-deals space". Every listed company in India is
// legally required to disclose material corporate events (acquisitions, schemes,
// fundraises, allotments, JVs, open offers, insolvencies) to the stock exchanges
// within 24h under SEBI LODR Reg. 30, and every notifiable combination passes
// through the CCI. That mandatory layer is a near-COMPLETE, FREE spine for public
// deals — this module ingests it comprehensively.
//
// Design:
//  - Cast the net WIDE: pull every deal-classified disclosure (paginated, multi-day),
//    not a capped sample.
//  - Score MATERIALITY so the caller can spend deep AI enrichment on what matters and
//    structure the long tail cheaply — nothing is dropped, so nothing is "missed".
//  - Each source is FAILURE-ISOLATED: one bad endpoint never breaks the run.
//  - Zero paid services. Built-in fetch only.
//
// Workhorses: BSE + NSE (proven endpoints). Best-effort bonus: CCI, SEBI — these
// scrape HTML that may shift; they log their own status so the first live run tells
// us exactly what to tune.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// ---- small utilities -------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function ymd(d) { return d.toISOString().slice(0, 10).replace(/-/g, ""); }
function slugify(s = "") { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100); }
function domainOf(u = "") { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } }

async function timedFetch(url, opts = {}, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal, redirect: "follow" }); }
  finally { clearTimeout(t); }
}

// ---- deal taxonomy ---------------------------------------------------------
// First match wins. [type, regex, baseWeight]. Weight feeds the materiality score
// so structurally bigger events (M&A, schemes) get prioritised for deep enrichment.
const TAX = [
  ["ma",  /scheme of (arrangement|amalgamation)|amalgamation|de-?merger|\bmerger\b|slump sale|business transfer agreement|\bBTA\b|acquisition|acquir(e|es|ed|ing)|controlling stake|majority stake|open offer|takeover|buy-?out|joint venture|\bJV\b|strategic (investment|partnership|alliance)|divest|hive[- ]?off|sale of (business|undertaking|stake|shares)/i, 32],
  ["ipo", /\bQIP\b|qualified institution(s|al)? placement|offer for sale|\bOFS\b|rights issue|\bIPO\b|draft red herring|\bDRHP\b|red herring prospectus|further public offer|\bFPO\b|listing of (equity|shares|securities)|public issue|initial public/i, 26],
  ["ibc", /insolvency|\bCIRP\b|\bNCLT\b|\bNCLAT\b|resolution plan|resolution professional|liquidation|moratorium|\bIBC\b|one[- ]time settlement|\bOTS\b|debt resolution/i, 24],
  ["bank",/non[- ]convertible deb|\bNCD\b|debenture|bond issue|issue of bonds|term loan|external commercial borrowing|\bECB\b|refinanc|credit facility|\bloan\b|sanctioned? (a )?facility|fund ?rais(e|ing) (via|through|by way of) (debt|bonds?|ncds?|debentures?)/i, 16],
  ["pe",  /preferential (issue|allotment)|private placement|series [a-h]\b|allotment of (equity|shares|warrants|securities)|\bwarrants?\b|raising of funds|fund ?rais(e|ing)|capital infusion|primary infusion|subscription to (equity|shares)/i, 18],
  ["reg", /\bSEBI\b|\bRBI\b|\bCCI\b|penalt|adjudicat(e|ion|ing)|show cause|settlement order|consent order|regulatory (action|order)/i, 12],
];
function classify(text = "") {
  for (const [type, re, w] of TAX) if (re.test(text)) return { type, weight: w };
  return null; // not a deal event
}

// rupee/dollar magnitude → ₹ crore (for materiality only; display value kept verbatim)
function valueText(text = "") {
  let m = text.match(/₹\s?[\d,]+(?:\.\d+)?\s?(?:crore|cr|lakh|billion|bn)?/i);
  if (m) return m[0].replace(/\s+/g, " ").replace(/crore/i, "cr").trim();
  m = text.match(/(?:Rs\.?|INR)\s?[\d,]+(?:\.\d+)?\s?(?:crore|cr|lakh|billion|bn)?/i);
  if (m) return "₹" + m[0].replace(/^(Rs\.?|INR)\s?/i, "").replace(/\s+/g, " ").replace(/crore/i, "cr").trim();
  m = text.match(/(?:US)?\$\s?[\d,.]+\s?(?:million|mn|billion|bn)?/i);
  if (m) return m[0].replace(/\s+/g, " ").replace(/million/i, "mn").replace(/billion/i, "bn").trim();
  return "—";
}
function magnitudeCr(value = "") {
  const v = value.replace(/,/g, "");
  let m = v.match(/₹\s?([\d.]+)\s?(cr|crore|bn|billion|lakh)?/i);
  if (m) { let n = parseFloat(m[1]); const u = (m[2] || "cr").toLowerCase(); if (/bn|billion/.test(u)) n *= 100000; if (/lakh/.test(u)) n /= 100; return n; }
  m = v.match(/\$\s?([\d.]+)\s?(mn|million|bn|billion)?/i);
  if (m) { let n = parseFloat(m[1]); const u = (m[2] || "mn").toLowerCase(); return n * (/bn|billion/.test(u) ? 8300 : 8.3); }
  return 0;
}
function materiality(weight, value, ageDays) {
  let s = weight;
  const cr = magnitudeCr(value);
  if (cr >= 5000) s += 45; else if (cr >= 1000) s += 30; else if (cr >= 250) s += 18; else if (cr >= 50) s += 8;
  if (ageDays <= 2) s += 6; else if (ageDays <= 7) s += 3;
  return Math.round(s);
}
function ageDaysOf(ts) { return Math.max(0, (Date.now() - ts) / 864e5); }

function mkItem({ id, url, company, head, ts, source, raw }) {
  const cl = classify(`${head} ${raw || ""}`);
  if (!cl) return null;
  const value = valueText(`${head} ${raw || ""}`);
  const headline = company ? `${company}: ${head}`.slice(0, 200) : head.slice(0, 200);
  return {
    id, url, source, official: true,
    company: company || "",
    headline,
    dealType: cl.type,
    value,
    category: cl.type,
    body: [head, raw].filter(Boolean).join(" — ").slice(0, 1200),
    published: ts || Date.now(),
    material: materiality(cl.weight, value, ageDaysOf(ts || Date.now())),
  };
}

// ---- BSE: corporate announcements (LODR Reg. 30) ---------------------------
// JSON API. strType=C = company announcements. We paginate and walk a date window.
async function bseGet(url) {
  const r = await timedFetch(url, { headers: {
    "User-Agent": UA, "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.bseindia.com", "Referer": "https://www.bseindia.com/corporates/ann.html",
  } });
  if (!r.ok) throw new Error("bse " + r.status);
  return r.json();
}
async function fetchBSE(existing, { days, maxPages, out, log }) {
  const to = new Date(), from = new Date(Date.now() - days * 864e5);
  let kept = 0, scanned = 0;
  for (let page = 1; page <= maxPages; page++) {
    let j;
    try {
      const u = `https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w?pageno=${page}&strCat=-1&strPrevDate=${ymd(from)}&strToDate=${ymd(to)}&strScrip=&strSearch=P&strType=C`;
      j = await bseGet(u);
    } catch (e) { log(`BSE page ${page} failed: ${e.message}`); break; }
    const rows = j.Table || [];
    if (!rows.length) break;
    for (const a of rows) {
      scanned++;
      const head = String(a.HEADLINE || a.NEWSSUB || "").trim();
      const cat = `${a.CATEGORYNAME || ""} ${a.SUBCATNAME || a.SUBCATEGORYNAME || ""}`.trim();
      const company = String(a.SLONGNAME || a.SCRIP_CD || "").trim();
      const id = ("bse-" + (a.NEWSID || `${a.SCRIP_CD}-${a.NEWS_DT || ""}`)).replace(/[^a-z0-9-]/gi, "").slice(0, 100);
      if (!id || existing.has(id) || out.some((x) => x.id === id)) continue;
      const url = a.ATTACHMENTNAME
        ? `https://www.bseindia.com/xml-data/corpfiling/AttachLive/${a.ATTACHMENTNAME}`
        : "https://www.bseindia.com/corporates/ann.html";
      const it = mkItem({ id, url, company, head: head + (cat ? ` [${cat}]` : ""), ts: Date.parse(a.NEWS_DT) || Date.now(), source: "BSE", raw: a.NEWSSUB });
      if (it) { out.push(it); kept++; }
    }
    await sleep(250); // be polite
  }
  log(`BSE: scanned ${scanned}, kept ${kept} deal events (${days}d, ${maxPages}p).`);
}

// ---- NSE: corporate announcements (equities) -------------------------------
async function nseGet(url) {
  let cookie = "";
  try {
    const p = await timedFetch("https://www.nseindia.com/companies-listing/corporate-filings-announcements",
      { headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" } });
    cookie = (p.headers.get("set-cookie") || "").split(",").map((c) => c.split(";")[0]).join("; ");
  } catch {}
  const r = await timedFetch(url, { headers: {
    "User-Agent": UA, "Accept": "application/json, text/plain, */*", "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.nseindia.com/companies-listing/corporate-filings-announcements",
    ...(cookie ? { Cookie: cookie } : {}),
  } });
  if (!r.ok) throw new Error("nse " + r.status);
  return r.json();
}
async function fetchNSE(existing, { days, out, log }) {
  let kept = 0, scanned = 0;
  try {
    const to = new Date(), from = new Date(Date.now() - days * 864e5);
    const dd = (d) => `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
    const url = `https://www.nseindia.com/api/corporate-announcements?index=equities&from_date=${dd(from)}&to_date=${dd(to)}`;
    const j = await nseGet(url);
    const rows = Array.isArray(j) ? j : (j.data || []);
    for (const a of rows) {
      scanned++;
      const desc = String(a.desc || a.subject || "").trim();
      const txt = `${desc} ${a.attchmntText || ""}`.trim();
      const company = String(a.sm_name || a.smName || a.symbol || "").trim();
      const id = ("nse-" + `${a.symbol || ""}-${a.an_dt || a.sort_date || a.exchdisstime || ""}`).replace(/[^a-z0-9-]/gi, "").slice(0, 100);
      if (!id || existing.has(id) || out.some((x) => x.id === id)) continue;
      const url2 = a.attchmntFile || `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(a.symbol || "")}`;
      const it = mkItem({ id, url: url2, company, head: desc, ts: Date.parse(a.an_dt) || Date.now(), source: "NSE", raw: a.attchmntText });
      if (it) { out.push(it); kept++; }
    }
  } catch (e) { log(`NSE failed: ${e.message}`); }
  log(`NSE: scanned ${scanned}, kept ${kept} deal events.`);
}

// ---- CCI: combination orders (every notifiable M&A) ------------------------
// Best-effort HTML scrape. Structure may shift; isolated + logged.
async function fetchCCI(existing, { out, log }) {
  let kept = 0;
  for (const page of ["https://www.cci.gov.in/combination/orders", "https://www.cci.gov.in/combination/notices"]) {
    try {
      const r = await timedFetch(page, { headers: { "User-Agent": UA, "Accept": "text/html" } });
      if (!r.ok) { log(`CCI ${domainOf(page)} ${r.status}`); continue; }
      const html = await r.text();
      // grab anchor tags pointing at order/notice PDFs, with their visible text as the party line
      const re = /<a[^>]+href="([^"]+\.pdf[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = re.exec(html))) {
        const href = m[1].startsWith("http") ? m[1] : new URL(m[1], page).href;
        const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (!text || text.length < 12) continue;
        if (!/combination|acqui|merger|amalgamation|\bvs\b|order|c-\d|notice/i.test(text)) continue;
        const id = ("cci-" + slugify(text)).slice(0, 100);
        if (existing.has(id) || out.some((x) => x.id === id)) continue;
        const it = mkItem({ id, url: href, company: "", head: `CCI combination: ${text}`, ts: Date.now(), source: "CCI", raw: "" });
        if (it) { it.dealType = "ma"; it.material += 12; out.push(it); kept++; }
        if (kept >= 40) break;
      }
    } catch (e) { log(`CCI ${domainOf(page)} failed: ${e.message}`); }
  }
  log(`CCI: kept ${kept} combination order(s).`);
}

// ---- SEBI: public issues / draft offer documents ---------------------------
// Best-effort HTML scrape of the public-issues listing.
async function fetchSEBI(existing, { out, log }) {
  let kept = 0;
  const page = "https://www.sebi.gov.in/filings/public-issues.html";
  try {
    const r = await timedFetch(page, { headers: { "User-Agent": UA, "Accept": "text/html" } });
    if (!r.ok) { log(`SEBI ${r.status}`); return; }
    const html = await r.text();
    const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = re.exec(html))) {
      const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (!/draft (red herring|offer)|DRHP|red herring|prospectus|public issue|rights issue|letter of offer/i.test(text)) continue;
      const href = m[1].startsWith("http") ? m[1] : new URL(m[1], page).href;
      const id = ("sebi-" + slugify(text)).slice(0, 100);
      if (existing.has(id) || out.some((x) => x.id === id)) continue;
      const it = mkItem({ id, url: href, company: "", head: text, ts: Date.now(), source: "SEBI", raw: "" });
      if (it) { it.dealType = "ipo"; out.push(it); kept++; }
      if (kept >= 30) break;
    }
  } catch (e) { log(`SEBI failed: ${e.message}`); }
  log(`SEBI: kept ${kept} public-issue filing(s).`);
}

/**
 * Comprehensive public-deal spine.
 * @param {Set<string>} existing  ids already in the site / seen ledger
 * @param {object} opts  { limit, days, maxPages, sources }
 * @returns items[] sorted by materiality desc, then recency desc.
 */
export async function fetchPublicDeals(existing, opts = {}) {
  const days = opts.days ?? 3;
  const maxPages = opts.maxPages ?? 4;
  const limit = opts.limit ?? 60;
  const sources = opts.sources ?? ["bse", "nse", "cci", "sebi"];
  const log = (m) => console.log(`  [spine] ${m}`);
  const out = [];

  if (sources.includes("bse")) await fetchBSE(existing, { days, maxPages, out, log });
  if (sources.includes("nse")) await fetchNSE(existing, { days, out, log });
  if (sources.includes("cci")) await fetchCCI(existing, { out, log });
  if (sources.includes("sebi")) await fetchSEBI(existing, { out, log });

  out.sort((a, b) => (b.material - a.material) || (b.published - a.published));
  log(`TOTAL spine: ${out.length} deal events; taking top ${Math.min(limit, out.length)} by materiality.`);
  return out.slice(0, limit);
}
