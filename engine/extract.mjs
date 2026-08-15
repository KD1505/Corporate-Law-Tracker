// extract.mjs — FREE, no-API rule-based extractor.
// Turns a raw Bar & Bench item into a structured deal record WITHOUT any paid AI.
// Used by default; if ANTHROPIC_API_KEY is set, build.mjs uses the richer AI enricher instead.
//
// Philosophy: never fabricate. We only use what the article actually says —
// firm names (matched against a known list), the value (regex), the article's own
// lede as the summary, and keyword heuristics for classification.

import { scoreDeal } from "./score.mjs";

const KNOWN_FIRMS = [
  "Cyril Amarchand Mangaldas","Shardul Amarchand Mangaldas","AZB & Partners","Khaitan & Co",
  "Trilegal","JSA","J Sagar Associates","IndusLaw","CMS INDUSLAW","S&R Associates","Talwar Thakore",
  "TT&A","Saraf and Partners","DSK Legal","Bharucha & Partners","DMD Advocates","Anand and Anand",
  "Saikrishna & Associates","Hogan Lovells","Latham & Watkins","Sidley Austin","Cravath",
  "A&O Shearman","Linklaters","Allen & Overy","Dentons Link Legal","Vidhiśāstras","Agram Legal",
  "S&A Law Offices","SNG & Partners","Vertices Partners","Universal Legal","NovoJuris","Sequitur",
  "Legacy Law Offices","Vidhigya Associates"
];

const TYPE_RULES = [
  ["ipo", /\b(IPO|DRHP|RHP|QIP|qualified institution|offer for sale|OFS|preferential issue|rights issue|listing|public offer)\b/i],
  ["ibc", /\b(insolvency|CIRP|NCLT|IBC|liquidation|resolution plan|moratorium)\b/i],
  ["bank", /\b(financing|loan|refinanc|sanction|debt|NCD|bond|credit facility|term loan|ECB)\b/i],
  ["pe", /\b(Series [A-F]|fundraise|funding round|private equity|venture|PE\b|investment from|stake from|pre-IPO|secondary)\b/i],
  ["reg", /\b(SEBI|RBI|CCI|circular|notification|rules notified|guidelines|penalty|regulat)\b/i],
  ["lit", /\b(High Court|Supreme Court|Tribunal|judgment|injunction|petition|dispute|arbitrat)\b/i],
  ["ma", /\b(acqui|merger|amalgamation|joint venture|JV|controlling stake|buyout|takeover|divest)\b/i],
];

const SECTOR_RULES = [
  ["Energy & Renewables", /\b(solar|renewable|power|energy|wind|green hydrogen|IPP)\b/i],
  ["Telecom", /\b(telecom|spectrum|fibre|fiber|5G|HFCL)\b/i],
  ["Pharma & Healthcare", /\b(pharma|API|drug|healthcare|hospital|biotech|life science)\b/i],
  ["BFSI", /\b(bank|NBFC|insurance|mutual fund|fintech|financial services|lending)\b/i],
  ["FMCG", /\b(FMCG|beverage|consumer goods|food|bottling)\b/i],
  ["Metals & Mining", /\b(coal|steel|metal|mining|ore|cement)\b/i],
  ["Infrastructure", /\b(infra|metro|highway|road|InvIT|airport|port|construction)\b/i],
  ["Technology", /\b(tech|software|SaaS|semiconductor|chip|IT services|platform|digital|AI)\b/i],
  ["Consumer & Retail", /\b(retail|QSR|D2C|brand|e-commerce|consumer)\b/i],
];

const GEO_RULES = [
  ["mumbai", /\b(Mumbai|Bombay)\b/i],
  ["delhi", /\b(Delhi|Gurugram|Gurgaon|Noida|NCR)\b/i],
  ["bengaluru", /\b(Bengaluru|Bangalore)\b/i],
  ["global", /\b(cross-border|US |U\.S\.|UK |Singapore|Portugal|overseas|offshore|global)\b/i],
];

const STAGE_RULES = [
  ["ruling", /\b(High Court|Supreme Court|Tribunal|judgment|quashed|injunction|ruling|held that)\b/i],
  ["filed", /\b(DRHP|filed|price band|comment|draft|opens)\b/i],
  ["completed", /\b(completed|closed|raised|sanctioned|executed|allotted|acquired|effective)\b/i],
  ["announced", /\b(announce|signs|signed|to acquire|agreement|enters)\b/i],
  ["review", /\b(NCLT|CCI approval|pending|seeking approval|notified to)\b/i],
];

function firstSentences(text, n = 2, limit = 320) {
  if (!text) return "";
  let out = text.split(/(?<=[.?!])\s+/).slice(0, n).join(" ").trim();
  if (out.length > limit) out = out.slice(0, limit).replace(/\s+\S*$/, "").trim() + "…"; // never cut mid-word
  return out;
}
function matchRule(rules, hay, fallback) {
  for (const [val, re] of rules) if (re.test(hay)) return val;
  return fallback;
}
function extractValue(hay) {
  let m = hay.match(/₹\s?[\d,]+(?:\.\d+)?\s?(?:crore|cr|lakh|billion|bn)?/i);
  if (m) return m[0].replace(/\s+/g, " ").replace(/crore/i, "cr").trim();
  m = hay.match(/(?:US)?\$\s?[\d,.]+\s?(?:million|mn|billion|bn)?/i);
  if (m) return m[0].replace(/\s+/g, " ").replace(/million/i, "mn").replace(/billion/i, "bn").trim();
  return "—";
}
function extractFirms(hay) {
  const found = [];
  for (const f of KNOWN_FIRMS) {
    const probe = f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(probe, "i").test(hay)) {
      // normalise a couple of aliases
      let name = f;
      if (f === "J Sagar Associates") name = "JSA";
      if (f === "Talwar Thakore") name = "TT&A";
      if (f === "Allen & Overy") name = "A&O Shearman";
      if (!found.some((x) => x.name === name)) {
        found.push({ name, side: "See source for role", lead: [], team: [], note: "Team as stated in the source article." });
      }
    }
  }
  return found;
}

// Generic "search-portal" verification links were intentionally removed: they are not deep
// links, several 404 or have moved, and they cluttered the source list with pointers
// irrelevant to the specific matter (e.g. a CCI combination link on a SEBI-takeover notice).
// Free-mode deals now rely on their ACTUAL primary filing (the exchange/company disclosure)
// as the official source. The link-checker keeps that honest.
function officialLinks(type) { return []; }

// Spine items (BSE/NSE/CCI/SEBI mandated disclosures) arrive pre-classified with a
// company, deal-type and the SPECIFIC filing URL. Honour that rather than re-guessing.
const SPINE_RE = /^(BSE|NSE|CCI|SEBI)$/i;
const SPINE_PORTAL = /corporates\/ann\.html|corporate-filings-announcements/i;

export function extractItem(item) {
  const body = item.body || "";
  const hay = `${item.headline}\n${body}`;
  const isSpine = SPINE_RE.test(item.source || "");
  const type = item.dealType || matchRule(TYPE_RULES, hay, "ma");
  const sector = matchRule(SECTOR_RULES, hay, "Industrials");
  const geo = matchRule(GEO_RULES, hay, "other");
  const stage = matchRule(STAGE_RULES, hay, isSpine ? "completed" : "announced");
  const value = (item.value && item.value !== "—") ? item.value : extractValue(hay);
  const firms = extractFirms(hay);
  const date = new Date(item.published).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const official = officialLinks(type);

  // The primary source. For a spine item with a real attachment, that IS a specific
  // official filing → it counts toward "Verified". A bare portal fallback does not.
  let primary;
  if (isSpine) {
    const specific = !!item.url && !SPINE_PORTAL.test(item.url);
    primary = { name: `${item.source} filing${item.company ? " - " + item.company : ""}`, url: item.url,
      official: specific, blurb: `Primary ${item.source} disclosure (SEBI LODR Reg. 30 / regulator filing) for this corporate event.` };
  } else {
    primary = { name: item.source || "Bar & Bench - Dealstreet", url: item.url,
      blurb: "Primary source naming the law firms, partners and teams on the matter." };
  }

  const deal = {
    id: item.id,
    type, geo,
    city: geo === "mumbai" ? "Mumbai" : geo === "delhi" ? "Delhi-NCR" : geo === "bengaluru" ? "Bengaluru" : geo === "global" ? "Cross-border" : "India",
    sector,
    imp: "md",
    verified: false,      // recomputed in build.mjs from whether a SPECIFIC official source exists
    implication: "",      // authored by AI mode or curators
    framework: [],        // authored by AI mode or curators
    stage, value,
    parties: item.company || "",
    time: date,
    headline: item.headline,
    sum: firstSentences(body, 2, 240) || item.headline,
    detail: firstSentences(body, 4, 700),
    firms,
    sources: [
      primary,
      // official/primary verification points (search by the parties)
      ...official.filter((o) => o.url !== item.url).map((o) => ({ name: o.label, url: o.url, official: true, blurb: "Official source - search by the parties to pull the primary filing/order." })),
    ],
    docs: (isSpine && item.url && !SPINE_PORTAL.test(item.url) ? [{ label: `${item.source} filing`, url: item.url }] : []).concat(official),
    timeline: [{ d: date, t: item.headline }],
  };
  const { score, imp, reasons } = scoreDeal(deal);
  deal.imp = imp; deal.score = score; deal.scoreReasons = reasons;
  return deal;
}
