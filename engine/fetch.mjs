// fetch.mjs — pulls the latest deals from the Bar & Bench Dealstreet API (the
// ingestion spine), plus recent regulatory/litigation items from the main feed.
// Returns normalised raw items: { id, url, headline, body, published }.
//
// No external dependencies — uses Node 20+ built-in fetch.

const UA = "CorporateLawTrackerBot/1.0 (+https://www.corporatelawtracker.com)";

// ONLY the Dealstreet section — these are curated corporate deals (M&A, ECM, PE,
// financings) with named law-firm teams. We deliberately do NOT ingest the general
// News section: in free (rule-based) mode there's no reliable way to separate
// corporate-relevant rulings from general criminal/political litigation, which would
// pollute the tracker. (AI mode can be extended to gate News items later.)
const DEALSTREET_API =
  "https://www.barandbench.com/api/v1/stories?section-id=14032&limit=30&fields=headline,slug,url,last-published-at";

// Additional spines so the tracker isn't single-origin. RSS; relevance-gated + de-duped downstream.
// (These may be blocked in some sandboxes but resolve fine from the GitHub Actions runner.)
const RSS_SPINES = [
  { name: "VCCircle", url: "https://www.vccircle.com/feed" },
];

function parseRSS(xml) {
  const items = [];
  const blocks = xml.split(/<item[ >]/i).slice(1);
  for (const b of blocks) {
    const pick = (tag) => {
      const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
      if (!m) return "";
      return m[1].replace(/<!\\[CDATA\\[|\\]\\]>/g, "").replace(/<[^>]+>/g, "").trim();
    };
    const title = pick("title");
    const link = (b.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || "";
    const pub = pick("pubDate");
    if (title && link) items.push({ title, link: link.trim(), pub });
  }
  return items;
}

async function fetchSpine(spine, existingIds, max = 8) {
  try {
    const r = await fetch(spine.url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (!r.ok) return [];
    const xml = await r.text();
    const out = [];
    for (const it of parseRSS(xml).slice(0, 20)) {
      const id = idFromSlug(it.link.split(/[?#]/)[0]);
      if (!id || existingIds.has(id) || out.some((x) => x.id === id)) continue;
      out.push({ id, url: it.link, headline: it.title, published: Date.parse(it.pub) || Date.now(), spine: spine.name });
      if (out.length >= max) break;
    }
    return out;
  } catch { return []; }
}

async function getJSON(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!r.ok) throw new Error(`Fetch failed ${r.status} for ${url}`);
  return r.json();
}

// Strip the Bar & Bench HTML wrapper down to readable article text.
function extractArticleText(html) {
  // The article body sits after "Listen to this article" and before the
  // "If you would like your Deals…" footer on Dealstreet posts.
  let txt = html;
  const start = txt.indexOf("Listen to this article");
  if (start !== -1) txt = txt.slice(start + "Listen to this article".length);
  const cut = txt.indexOf("If you would like your Deals");
  if (cut !== -1) txt = txt.slice(0, cut);
  // Remove tags, collapse whitespace.
  txt = txt
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8377;|&#x20B9;/g, "₹")
    .replace(/\s+/g, " ")
    .trim();
  return txt.slice(0, 6000); // keep prompt size sane
}

async function fetchArticleBody(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (!r.ok) return "";
    const html = await r.text();
    return extractArticleText(html);
  } catch {
    return "";
  }
}

function idFromSlug(slug) {
  // slug like "dealstreet/khaitan-co-acts-on-hfcl-555-crore-preferential-issue"
  return slug.split("/").pop().slice(0, 120);
}

// ---- REGULATORS ----
// Notifications/circulars/master directions. Add more feeds (incl. the link you provide) here.
// RSS where available; failures are swallowed so one bad feed never breaks the run.
const REGULATOR_FEEDS = [
  { reg: "RBI", url: "https://www.rbi.org.in/Scripts/Rss.aspx" },
  { reg: "PIB", url: "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3" },
  // { reg: "SEBI", url: "<add SEBI circulars RSS / the link you give me>" },
  // { reg: "CCI",  url: "<add CCI press/orders feed>" },
  // { reg: "IBBI", url: "<add IBBI circulars feed>" },
];
export async function fetchRegulators(existing, max = 12) {
  const out = [];
  for (const f of REGULATOR_FEEDS) {
    try {
      const r = await fetch(f.url, { headers: { "User-Agent": UA }, redirect: "follow" });
      if (!r.ok) continue;
      const xml = await r.text();
      for (const it of parseRSS(xml).slice(0, 20)) {
        const id = (idFromSlug(it.link.split(/[?#]/)[0]) || (it.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")).slice(0, 100);
        if (!id || existing.has(id) || out.some((x) => x.id === id)) continue;
        out.push({ id, url: it.link, headline: it.title, published: Date.parse(it.pub) || Date.now(), regulator: f.reg });
        if (out.length >= max) break;
      }
    } catch { /* skip bad feed */ }
  }
  return out;
}

// ---- COMMENTARY / ANALYSIS ----
// Columns, viewpoints and analysis. We take Bar & Bench's analytical sections off the latest feed
// (URLs under /view-point/, /columns/, /latest-legal-news/). Add LiveLaw / firm-blog feeds similarly.
export async function fetchCommentary(existing, max = 10) {
  const j = await getJSON("https://www.barandbench.com/api/v1/stories?limit=40&fields=headline,slug,url,last-published-at").catch(() => ({ stories: [] }));
  const out = [];
  for (const s of j.stories || []) {
    const url = s.url || "";
    if (!/\/(view-point|columns|latest-legal-news)\//.test(url)) continue;
    const id = idFromSlug(s.slug || url);
    if (!id || existing.has(id) || out.some((x) => x.id === id)) continue;
    out.push({ id, url, headline: s.headline, published: s["last-published-at"] || Date.now(), source: "Bar & Bench" });
    if (out.length >= max) break;
  }
  for (const it of out) it.body = await fetchArticleBody(it.url);
  return out;
}

// Lateral moves & GC appointments from Bar & Bench "Corporate & In-House" (section 14024).
const MOVES_API =
  "https://www.barandbench.com/api/v1/stories?section-id=14024&limit=25&fields=headline,slug,url,last-published-at";
const MOVE_RE = /elevat|appoint|promot|joins|hires|general counsel|\bGC\b|named|moves to|strengthens|onboards|inducts|re-?designat/i;
export async function fetchMoves(existingMoveIds, max = 10) {
  const j = await getJSON(MOVES_API).catch(() => ({ stories: [] }));
  const out = [];
  for (const s of j.stories || []) {
    const id = idFromSlug(s.slug || s.url || "");
    const h = s.headline || "";
    if (!id || existingMoveIds.has(id) || out.some((x) => x.id === id)) continue;
    if (!MOVE_RE.test(h)) continue;
    const type = /general counsel|\bGC\b/i.test(h) ? "GC appointment"
      : /elevat|promot|re-?designat/i.test(h) ? "Promotion"
      : /joins|hires|moves to|onboards|inducts/i.test(h) ? "Lateral move" : "Update";
    out.push({ id, headline: h, type,
      date: new Date(s["last-published-at"] || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      url: s.url });
    if (out.length >= max) break;
  }
  return out;
}

// ---- EXCHANGES (BSE + NSE) ----
// Listed-company capital events straight from the exchanges. The biggest free completeness lever.
// These JSON endpoints are anti-scraping; they generally work from the GitHub Actions runner with
// browser-like headers but may need endpoint/header tuning after the first live run (check the log).
// We keep only DEAL events (not dividends/board-meeting/results noise), and link the actual filing.
const DEAL_EVENT = /qualified institution|\bQIP\b|offer for sale|\bOFS\b|preferential|rights issue|scheme of (arrangement|amalgamation)|amalgamation|\bmerger\b|open offer|acquisition|acquir|fund ?rais|allotment|buy-?back|\bInvIT\b|\bREIT\b|block deal|bulk deal|divest|takeover|warrant|stake/i;

async function bseGet(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json", "Origin": "https://www.bseindia.com", "Referer": "https://www.bseindia.com/" } });
  if (!r.ok) throw new Error("bse " + r.status);
  return r.json();
}
async function nseGet(url) {
  let cookie = "";
  try { const p = await fetch("https://www.nseindia.com/", { headers: { "User-Agent": UA, "Accept": "text/html" } }); cookie = p.headers.get("set-cookie") || ""; } catch {}
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json, text/plain, */*", "Accept-Language": "en-US,en;q=0.9", "Referer": "https://www.nseindia.com/", ...(cookie ? { Cookie: cookie } : {}) } });
  if (!r.ok) throw new Error("nse " + r.status);
  return r.json();
}
export async function fetchExchanges(existing, max = 10) {
  const out = [];
  const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
  // --- BSE corporate announcements (last 3 days) ---
  try {
    const u = `https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w?pageno=1&strCat=-1&strPrevDate=${fmt(new Date(Date.now() - 3 * 864e5))}&strScrip=&strSearch=P&strToDate=${fmt(new Date())}&strType=C`;
    const j = await bseGet(u);
    for (const a of (j.Table || [])) {
      const head = String(a.HEADLINE || a.NEWSSUB || "").trim();
      if (!DEAL_EVENT.test(head)) continue;
      const id = ("bse-" + (a.NEWSID || `${a.SCRIP_CD}-${a.NEWS_DT || ""}`)).replace(/[^a-z0-9-]/gi, "").slice(0, 100);
      if (!id || existing.has(id) || out.some((x) => x.id === id)) continue;
      const url = a.ATTACHMENTNAME ? `https://www.bseindia.com/xml-data/corpfiling/AttachLive/${a.ATTACHMENTNAME}` : "https://www.bseindia.com/corporates/ann.html";
      out.push({ id, url, headline: `${a.SLONGNAME || a.SCRIP_CD}: ${head}`, published: Date.parse(a.NEWS_DT) || Date.now(), source: "BSE" });
      if (out.length >= max) break;
    }
  } catch { /* skip BSE this run */ }
  // --- NSE corporate announcements (equities) ---
  if (out.length < max) {
    try {
      const j = await nseGet("https://www.nseindia.com/api/corporate-announcements?index=equities");
      for (const a of (Array.isArray(j) ? j : (j.data || []))) {
        const head = `${a.desc || ""} ${a.attchmntText || ""}`.trim();
        if (!DEAL_EVENT.test(head)) continue;
        const id = ("nse-" + `${a.symbol || ""}-${a.an_dt || a.sort_date || ""}`).replace(/[^a-z0-9-]/gi, "").slice(0, 100);
        if (!id || existing.has(id) || out.some((x) => x.id === id)) continue;
        const url = a.attchmntFile || `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(a.symbol || "")}`;
        out.push({ id, url, headline: `${a.symbol || ""}: ${String(a.desc || head).slice(0, 140)}`, published: Date.parse(a.an_dt) || Date.now(), source: "NSE" });
        if (out.length >= max) break;
      }
    } catch { /* skip NSE this run */ }
  }
  return out;
}

/**
 * @param {Set<string>} existingIds  ids already present in the site (skip these)
 * @param {number} maxNew            cap on number of new items to enrich per run
 */
export async function fetchNewItems(existingIds, maxNew = 12) {
  const ds = await getJSON(DEALSTREET_API).catch(() => ({ stories: [] }));
  const stories = [...(ds.stories || [])];
  const seen = new Set();
  const candidates = [];
  for (const s of stories) {
    const id = idFromSlug(s.slug || s.url || "");
    if (!id || seen.has(id) || existingIds.has(id)) continue;
    seen.add(id);
    candidates.push({
      id,
      url: s.url,
      headline: s.headline,
      published: s["last-published-at"] || Date.now(),
      source: "Bar & Bench - Dealstreet",
    });
  }
  // pull additional spines (multi-origin), respecting existing + already-seen this run
  for (const spine of RSS_SPINES) {
    const more = await fetchSpine(spine, new Set([...existingIds, ...seen]));
    for (const it of more) { if (seen.has(it.id)) continue; seen.add(it.id); candidates.push({ ...it, source: spine.name }); }
  }

  // pull the exchanges (BSE/NSE) — listed-company capital events from the primary filing
  try {
    const ex = await fetchExchanges(new Set([...existingIds, ...seen]));
    for (const it of ex) { if (seen.has(it.id)) continue; seen.add(it.id); candidates.push(it); }
  } catch { /* exchanges optional */ }

  // newest first, cap
  candidates.sort((a, b) => b.published - a.published);
  const batch = candidates.slice(0, maxNew);

  // fetch article body only for Bar & Bench (exchange/RSS items have no parseable article body)
  for (const item of batch) {
    item.body = /barandbench\.com/.test(item.url) ? await fetchArticleBody(item.url) : "";
  }
  return batch;
}
