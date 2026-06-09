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
    });
  }
  // pull additional spines (multi-origin), respecting existing + already-seen this run
  for (const spine of RSS_SPINES) {
    const more = await fetchSpine(spine, new Set([...existingIds, ...seen]));
    for (const it of more) { if (seen.has(it.id)) continue; seen.add(it.id); candidates.push(it); }
  }

  // newest first, cap
  candidates.sort((a, b) => b.published - a.published);
  const batch = candidates.slice(0, maxNew);

  // fetch bodies (sequential to be polite)
  for (const item of batch) {
    item.body = await fetchArticleBody(item.url);
  }
  return batch;
}
