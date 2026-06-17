// score.mjs — transparent "is this important / useful?" rubric + official-source detection.
// Used by both the free extractor and the AI enricher so importance is consistent and explainable.

// Domains we treat as OFFICIAL / primary (government, regulator, exchange, court).
export const OFFICIAL_RE =
  /(\.gov\.in|\.nic\.in|sebi\.gov\.in|rbi\.org\.in|cci\.gov\.in|ibbi\.gov\.in|mca\.gov\.in|dipam\.gov\.in|pib\.gov\.in|meity\.gov\.in|dpiit|egazette|bseindia\.com|nseindia\.com|nclt\.gov\.in|nclat\.gov\.in|sci\.gov\.in|trai\.gov\.in|irdai\.gov\.in)/i;

// A company's own press-release / investor-relations page also counts as primary;
// the AI enricher tags those, and we honour an explicit {official:true} flag on a source.
export function isOfficial(src) {
  if (!src) return false;
  if (src.official === true) return true;
  return OFFICIAL_RE.test(src.url || "");
}
export function hasOfficial(deal) {
  return (deal.sources || []).some(isOfficial) || (deal.docs || []).some((d) => OFFICIAL_RE.test(d.url || ""));
}

const TIER1 = [
  "Cyril Amarchand Mangaldas", "Shardul Amarchand Mangaldas", "AZB & Partners",
  "Khaitan & Co", "Trilegal", "JSA", "Linklaters", "Hogan Lovells",
  "Latham & Watkins", "Sidley Austin", "Cravath", "A&O Shearman",
];

// crude rupee/dollar magnitude in ₹ crore
function magnitudeCr(value = "") {
  const v = value.replace(/,/g, "");
  let m = v.match(/₹\s?([\d.]+)\s?(cr|crore|bn|billion|lakh)?/i);
  if (m) {
    let n = parseFloat(m[1]); const u = (m[2] || "cr").toLowerCase();
    if (/bn|billion/.test(u)) n *= 100000; // ₹1bn = 100 cr
    if (/lakh/.test(u)) n /= 100;
    return n;
  }
  m = v.match(/\$\s?([\d.]+)\s?(mn|million|bn|billion)?/i);
  if (m) {
    let n = parseFloat(m[1]); const u = (m[2] || "mn").toLowerCase();
    const usdToCr = /bn|billion/.test(u) ? 8300 : 8.3; // ~₹83/$, $1mn≈₹8.3cr
    return n * usdToCr;
  }
  return 0;
}

/**
 * Returns { score (0-100), imp ('hi'|'md'|'lo'), reasons[] }.
 * Transparent so the criteria can be tuned and explained to users.
 */
export function scoreDeal(deal) {
  let s = 0; const reasons = [];
  const cr = magnitudeCr(deal.value || "");
  if (cr >= 5000) { s += 35; reasons.push("Mega deal (≥₹5,000 cr)"); }
  else if (cr >= 1000) { s += 25; reasons.push("Large deal (₹1,000–5,000 cr)"); }
  else if (cr >= 100) { s += 12; reasons.push("Mid-size deal (₹100–1,000 cr)"); }
  else { s += 3; }

  const firmNames = (deal.firms || []).map((f) => f.name);
  if (firmNames.some((n) => TIER1.includes(n))) { s += 15; reasons.push("Tier-1 firm involved"); }
  if (firmNames.length >= 3) { s += 8; reasons.push("Multi-firm / complex"); }

  if (deal.geo === "global") { s += 10; reasons.push("Cross-border"); }
  if (deal.type === "reg" || deal.type === "lit") { s += 12; reasons.push("Regulatory / precedent value"); }

  if (hasOfficial(deal)) { s += 10; reasons.push("Corroborated by an official source"); }
  const nSrc = (deal.sources || []).length;
  if (nSrc >= 3) { s += 8; reasons.push(`${nSrc} corroborating sources`); }
  else if (nSrc === 2) { s += 4; }

  s = Math.min(100, s);
  const imp = s >= 55 ? "hi" : s >= 30 ? "md" : "lo";
  return { score: s, imp, reasons };
}

// Is this deal "marquee" — significant enough to spend DEEP enrichment (AI + web search)
// triangulating multiple sources? Everything else still gets AI enrichment, just without
// the (paid) web-search step.
export function isMarquee(deal) {
  const cr = magnitudeCr(deal.value || "");
  if (deal.imp === "hi") return true;
  if (cr >= 1000) return true;                                   // ≥ ₹1,000 cr
  if ((deal.type === "ma" || deal.type === "ipo" || deal.type === "pe") && cr >= 250) return true;
  const firmNames = (deal.firms || []).map((f) => f.name);
  if (firmNames.some((n) => TIER1.includes(n)) && cr >= 100) return true;  // tier-1 + ≥ ₹100 cr
  if (deal.type === "reg" || deal.type === "lit") return true;   // precedent / regulatory value
  return false;
}
// Pre-enrichment guess (used when we must decide search BEFORE we have the rich record):
// press items (named law-firm teams) and high-materiality spine items are treated as marquee.
export function rawMarquee(item) {
  if (/Bar & Bench|LiveLaw|VCCircle/i.test(item.source || "")) return true;
  return (item.material || 0) >= 55;
}
