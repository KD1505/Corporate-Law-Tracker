// enrich.mjs — turns one raw Bar & Bench item into a fully structured, multi-source
// deal object, using Claude with the server-side web_search tool to TRIANGULATE
// across credible sources (government / regulator / exchange / company-official
// PRIORITISED), in the house style of a tier-1 corporate-law deal tracker.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Fast + cheap for this volume. Swap to a Sonnet model for richer synthesis if desired.
const MODEL = process.env.CLT_MODEL || "claude-haiku-4-5-20251001";

const SYSTEM = `You are the research engine behind "Corporate Law Tracker", a deal & regulatory
intelligence dashboard for partners at tier-1 Indian corporate law firms. You convert a primary
Bar & Bench article into ONE structured, VERIFIED deal record.

Hard rules:
- Accuracy over everything. Never invent facts, values, names or URLs. If unknown, omit or use "—".
- The Bar & Bench article is the primary source for the LAW-FIRM TEAMS (firms, partners, associates, sides).
- Use the web_search tool to find ADDITIONAL credible sources reporting the SAME event, to corroborate
  value, parties, dates and structure. Add as many credible corroborating sources as you can find (aim 3-6 total).
- PRIORITISE in this order: government/regulator (sebi.gov.in, rbi.org.in, cci.gov.in, ibbi.gov.in, mca.gov.in,
  dipam.gov.in, pib.gov.in, meity.gov.in), stock exchanges (bseindia.com, nseindia.com), the company's own
  press release / investor-relations page, then reputable legal/business press (LiveLaw, SCC Online, Reuters,
  Mint, Economic Times, Business Standard, Hindu BusinessLine).
- Every source must be a REAL, specific article/filing URL you actually saw in search results — never a homepage,
  never a guess. For each source give a one-sentence blurb stating exactly what THAT source adds.
- Aim for AT LEAST TWO official/primary sources per deal wherever they exist — e.g., the company's BSE/NSE
  announcement AND the regulator order (CCI/SEBI/RBI/IBBI/NCLT) or the company's own press release. Mark every
  official/primary source with "official": true. The whole value of this product is having the official sources
  collated in one place, so hunt for them hard.
- Writing voice: crisp, factual, "smart brevity". The summary is one or two sentences with a bolded lede idea.
  No hype, no filler. Assume the reader is a senior corporate partner.
- Provide a one-sentence "implication": the practice point a partner takes away — the structuring nuance,
  the precedent, the regulatory gating item or the market read. Lawyerly, not journalistic.
- Provide a "framework": the 5-9 key Indian statutes/regulations a transactional lawyer must review for THIS
  deal, each with the SPECIFIC section/regulation and a one-line note. Flag items "central" (core to this deal)
  or "amended" (recently changed — review the current text). Be accurate; if unsure of a section, name the statute.
- For official sources, prefer SPECIFIC URLs (the named company's exchange filing page, or the specific
  CCI/SEBI/NCLT order) over portal homepages.

Output ONLY a single JSON object (no markdown fences, no commentary) with EXACTLY this shape:
{
 "id": string,                       // use the provided id
 "type": "ma"|"ipo"|"pe"|"ibc"|"reg"|"bank"|"lit",
 "geo": "mumbai"|"delhi"|"bengaluru"|"other"|"global",
 "city": string,                     // human label, e.g. "Mumbai", "Hyderabad", "Cross-border (India–US)"
 "sector": "Technology"|"BFSI"|"Pharma & Healthcare"|"Energy & Renewables"|"Infrastructure"|"Consumer & Retail"|"Telecom"|"FMCG"|"Metals & Mining"|"Financial Services"|"Industrials",
 "imp": "hi"|"md"|"lo",              // hi for marquee / >₹2,000cr / market-moving
 "stage": "rumoured"|"announced"|"review"|"completed"|"filed"|"ruling"|"inforce",
 "value": string,                    // e.g. "₹2,800 cr", "$1.6 bn", or "—"
 "parties": string,
 "time": string,                     // e.g. "8 Jun 2026"
 "headline": string,
 "sum": string,                      // 1-2 sentences, may include <b>..</b> around the key idea
 "implication": string,              // one sentence: the practice point / structuring nuance / precedent
 "detail": string,                   // 2-4 sentences of substantive detail
 "framework": [ { "ref": string, "note": string, "flag": "central"|"amended"|"" } ],  // 5-9 key statutes/sections
 "firms": [ { "name": string, "side": string,
              "lead": [ { "n": string, "role": string } ],
              "team": [ string ],
              "note": string } ],    // note optional; omit lead/team if not stated
 "sources": [ { "name": string, "url": string, "official": boolean, "blurb": string } ],   // 3-6; set official:true for gov/regulator/exchange/company-PR; aim for >=2 official
 "docs": [ { "label": string, "url": string } ],   // primary filings / PDFs if found; else []
 "timeline": [ { "d": string, "t": string } ]
}`;

function safeJSON(text) {
  // grab the last {...} block
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON in model output");
  return JSON.parse(text.slice(first, last + 1));
}

export async function enrichItem(item) {
  const userMsg = `Primary source (Bar & Bench):
URL: ${item.url}
Headline: ${item.headline}
Article text:
"""
${item.body || "(body unavailable — rely on the headline and web search)"}
"""

Use id = "${item.id}". Today's date context: the article was published around ${new Date(item.published).toDateString()}.
Now research and return the JSON record. Corroborate with as many credible sources as possible, government/regulator/exchange/company-official prioritised.`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2200,
    system: SYSTEM,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
    messages: [{ role: "user", content: userMsg }],
  });

  // concatenate all text blocks from the final assistant message
  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const deal = safeJSON(text);
  deal.id = item.id; // enforce
  // Guarantee Bar & Bench is present as a source
  if (!deal.sources?.some((s) => /barandbench\.com/.test(s.url || ""))) {
    deal.sources = deal.sources || [];
    deal.sources.unshift({
      name: "Bar & Bench — Dealstreet",
      url: item.url,
      blurb: "Primary source naming the law firms, partners and teams on the matter.",
    });
  }
  return deal;
}
