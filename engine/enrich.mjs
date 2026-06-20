// enrich.mjs — turns one raw Bar & Bench item into a fully structured, multi-source
// deal object, using Claude with the server-side web_search tool to TRIANGULATE
// across credible sources (government / regulator / exchange / company-official
// PRIORITISED), in the house style of a tier-1 corporate-law deal tracker.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Fast + cheap for this volume. Swap to a Sonnet model for richer synthesis if desired.
const MODEL = process.env.CLT_MODEL || "claude-haiku-4-5-20251001";

// Web search is OFF by default — it needs special account access and was the most common cause
// of the AI call failing (and silently falling back to free mode). The article text is already
// supplied, so the core enrichment doesn't need it. Set CLT_USE_SEARCH=1 to switch it on later.
const USE_SEARCH = process.env.CLT_USE_SEARCH === "1";
// useSearch can be overridden per call (tiered enrichment: marquee deals → search on,
// the rest → search off). When undefined, falls back to the global CLT_USE_SEARCH flag.
async function aiCreate(params, maxUses = 5, useSearch) {
  const search = useSearch === undefined ? USE_SEARCH : useSearch;
  if (search) {
    try {
      return await client.messages.create({ ...params, tools: [{ type: "web_search_20250305", name: "web_search", max_uses: maxUses }] });
    } catch (e) {
      console.warn(`web_search unavailable (${e.message}); retrying without search`);
    }
  }
  return await client.messages.create(params);
}

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
- Provide a "structure": how the deal was actually done — the consideration (amount/price/share count if public),
  the key conditions precedent / mechanics, the approvals required, what was NOVEL, and the deal-SPECIFIC regulatory
  triggers (why THIS deal needs THESE laws). Set status "Confirmed" only where taken from primary disclosure, else
  "Partly inferred". This is the precedent layer — be specific and practical, never invent figures.
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
 "structure": { "consideration": string, "conditions": [string], "approvals": [string], "novel": string,
   "triggers": [ { "law": string, "note": string } ], "status": "Confirmed"|"Partly inferred" },
 "firms": [ { "name": string, "side": string,
              "lead": [ { "n": string, "role": string } ],
              "team": [ string ],
              "note": string } ],    // note optional; omit lead/team if not stated
 "sources": [ { "name": string, "url": string, "official": boolean, "blurb": string } ],   // 3-6; set official:true for gov/regulator/exchange/company-PR; aim for >=2 official
 "docs": [ { "label": string, "url": string } ],   // primary filings / PDFs if found; else []
 "timeline": [ { "d": string, "t": string } ]
}`;

// Repair a truncated/unterminated JSON object by closing dangling strings + brackets.
function repairJSON(s) {
  const first = s.indexOf("{");
  if (first === -1) return null;
  s = s.slice(first);
  const stack = []; let inStr = false, esc = false, out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i]; out += c;
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" || c === "]") stack.pop();
  }
  if (inStr) out += '"';
  out = out.replace(/,\s*$/, "");
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i] === "{" ? "}" : "]";
  try { return JSON.parse(out); } catch { return null; }
}

function safeJSON(text) {
  let t = text;
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);  // strip a markdown code fence if present
  if (fence) t = fence[1];
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1) throw new Error("No JSON in model output");
  try { return JSON.parse(t.slice(first, last + 1)); }
  catch (e) {
    const repaired = repairJSON(t.slice(first));   // model output was cut off mid-JSON → close it
    if (repaired) return repaired;
    throw e;
  }
}

export async function enrichItem(item, useSearch) {
  const userMsg = `Primary source (Bar & Bench):
URL: ${item.url}
Headline: ${item.headline}
Article text:
"""
${item.body || "(body unavailable — rely on the headline and web search)"}
"""

Use id = "${item.id}". Today's date context: the article was published around ${new Date(item.published).toDateString()}.
Now research and return the JSON record. Corroborate with as many credible sources as possible, government/regulator/exchange/company-official prioritised.`;

  const resp = await aiCreate({
    model: MODEL,
    max_tokens: 5000,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }],
  }, 6, useSearch);

  // concatenate all text blocks from the final assistant message
  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const deal = safeJSON(text);
  deal.id = item.id; // enforce
  return finishDeal(deal, item);
}

function finishDeal(deal, item) {
  // Guarantee the originating source is present (Bar & Bench, exchange filing, or other spine)
  if (!deal.sources?.some((s) => (s.url || "") === item.url)) {
    deal.sources = deal.sources || [];
    const isExch = /BSE|NSE/.test(item.source || "");
    deal.sources.unshift(isExch
      ? { name: item.source, url: item.url, official: true, blurb: "Primary exchange filing/announcement for this corporate event." }
      : { name: item.source || "Bar & Bench — Dealstreet", url: item.url, blurb: "Primary source for the matter." });
  }
  return deal;
}

async function askJSON(system, user, maxUses = 5) {
  const resp = await aiCreate({
    model: MODEL, max_tokens: 3600, system,
    messages: [{ role: "user", content: user }],
  }, maxUses);
  return safeJSON(resp.content.filter((b) => b.type === "text").map((b) => b.text).join("\n"));
}

const LEGAL_MIND = `You are a senior Indian corporate/transactional lawyer writing for other transactional lawyers (not a classroom).
Be precise, practical and deep. Never invent facts, sections, dates or URLs — verify with web_search and cite only specific real URLs you saw.
Triple-check accuracy; flag anything you are unsure of by omitting it rather than guessing.`;

// Structure a regulator notification/circular into a tracker item with real legal analysis.
export async function enrichRegulatorAI(item, lawIds) {
  const system = `${LEGAL_MIND}
Read the regulator issuance below (use web_search on the URL/title). Output ONLY this JSON:
{ "id": string, "reg": string, "title": string, "status": string, "effective": string, "deadline": string,
  "impact": string,   // what actually changes, in practice, for deals/documents — 1-3 sentences
  "action": string,   // what a transactional lawyer should DO about it
  "sources": [ { "name": string, "url": string, "official": boolean, "blurb": string } ],
  "laws": [string],   // pick 0-4 ids from the provided LAW_IDS that this relates to
  "deals": [] }
LAW_IDS = ${JSON.stringify(lawIds)}`;
  const user = `Regulator: ${item.regulator}\nTitle: ${item.headline}\nURL: ${item.url}\nUse id="${item.id}". Analyse and return the JSON.`;
  const r = await askJSON(system, user);
  r.id = item.id; r.reg = r.reg || item.regulator; r.deals = r.deals || [];
  return r;
}

// Route + analyse a commentary article into the deal web. Returns {kind, payload}.
export async function routeArticleAI(item, dealCatalog, lawIds) {
  const system = `${LEGAL_MIND}
Read the article (use web_search on the URL). Decide where it belongs and output ONLY this JSON:
{ "kind": "deal" | "trend" | "regulation",
  "deal": string|null,        // if kind=deal, the DEAL_ID it concerns
  "insight": string,          // YOUR one-sentence practical read of what the piece adds (not a copy)
  "title": string,
  "summary": string,          // if kind=trend: 2-3 sentence synthesis of the theme
  "impact": string,           // if kind=regulation: what changes in practice
  "action": string,           // if kind=regulation: what to do
  "laws": [string],           // 0-4 ids from LAW_IDS
  "deals": [string] }         // if kind=trend: DEAL_IDs the theme connects
Rules: kind="deal" only if it clearly concerns a specific tracked deal; kind="regulation" if it analyses a new
amendment/circular/regulation; otherwise kind="trend". DEAL_IDs (id → headline) = ${JSON.stringify(dealCatalog).slice(0, 4000)}.
LAW_IDS = ${JSON.stringify(lawIds)}.`;
  const user = `Title: ${item.headline}\nURL: ${item.url}\nUse id="${item.id}". Analyse and return the JSON.`;
  const r = await askJSON(system, user);
  const yr = String(new Date(item.published).getFullYear());
  if (r.kind === "deal" && r.deal) return { kind: "deal", payload: { deal: r.deal, title: r.title || item.headline, source: item.source || "Bar & Bench", url: item.url, date: yr, insight: r.insight || "Analysis touching this matter." } };
  if (r.kind === "regulation") return { kind: "regulation", payload: { id: item.id, reg: "Analysis", title: r.title || item.headline, status: "Commentary", effective: yr, deadline: "—", impact: r.impact || r.insight || "Commentary on a regulatory development.", action: r.action || "Read and assess.", sources: [{ name: item.source || "Bar & Bench", url: item.url, official: false, blurb: r.insight || "Legal analysis." }], deals: r.deals || [], laws: r.laws || [] } };
  return { kind: "trend", payload: { id: item.id, title: r.title || item.headline, date: yr, summary: r.summary || r.insight || "Market commentary.", sources: [{ name: item.source || "Bar & Bench", url: item.url }], deals: r.deals || [], laws: r.laws || [] } };
}
