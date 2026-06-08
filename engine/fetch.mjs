// fetch.mjs — pulls the latest deals from the Bar & Bench Dealstreet API (the
// ingestion spine), plus recent regulatory/litigation items from the main feed.
// Returns normalised raw items: { id, url, headline, body, published }.
//
// No external dependencies — uses Node 20+ built-in fetch.

const UA = "CorporateLawTrackerBot/1.0 (+https://www.corporatelawtracker.com)";

const DEALSTREET_API =
  "https://www.barandbench.com/api/v1/stories?section-id=14032&limit=30&fields=headline,slug,url,last-published-at";
// Section 14017 = News (covers regulatory + litigation rulings relevant to corporates)
const NEWS_API =
  "https://www.barandbench.com/api/v1/stories?section-id=14017&limit=30&fields=headline,slug,url,last-published-at";

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
  return slug.split("/").pop().slice(0, 80);
}

/**
 * @param {Set<string>} existingIds  ids already present in the site (skip these)
 * @param {number} maxNew            cap on number of new items to enrich per run
 */
export async function fetchNewItems(existingIds, maxNew = 12) {
  const [ds, news] = await Promise.all([
    getJSON(DEALSTREET_API).catch(() => ({ stories: [] })),
    getJSON(NEWS_API).catch(() => ({ stories: [] })),
  ]);

  const stories = [...(ds.stories || []), ...(news.stories || [])];
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
  // newest first, cap
  candidates.sort((a, b) => b.published - a.published);
  const batch = candidates.slice(0, maxNew);

  // fetch bodies (sequential to be polite)
  for (const item of batch) {
    item.body = await fetchArticleBody(item.url);
  }
  return batch;
}
