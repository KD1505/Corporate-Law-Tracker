// ingest.mjs — structuring + cross-linking for regulator notifications and commentary.
// AI mode (enrich.mjs) produces richer, analysed versions; these are the no-API fallbacks
// PLUS the shared matchers (law/deal) used to weave each item into the deal-centric web.

// Statute/regulation keyword → law id (matches the LAWDETAIL/REGLIB slugs in index.html).
export const LAW_KEYWORDS = {
  "sebi-icdr-regulations-2018": /\bicdr\b|qip|preferential issue|rights issue|public issue|drhp/i,
  "sebi-lodr-regulations-2015": /\blodr\b|listing obligation|related[- ]party|\brpt\b/i,
  "sebi-sast-takeover-regulations-2011": /takeover|\bsast\b|open offer|substantial acquisition/i,
  "sebi-pit-regulations-2015": /insider trading|\bpit\b|\bupsi\b/i,
  "sebi-invit-regulations-2014": /\binvit\b|infrastructure investment trust/i,
  "sebi-aif-regulations-2012": /\baif\b|alternative investment fund/i,
  "sebi-act-1992": /\bsebi\b/i,
  "companies-act-2013": /companies act|section 230|amalgamation|scheme of arrangement|preferential allotment/i,
  "competition-act-2002": /\bcci\b|competition act|combination|deal value threshold|anti-competitive/i,
  "fem-non-debt-instruments-rules-2019": /\bfdi\b|non-debt instrument|\bndi\b|foreign direct investment/i,
  "press-note-3-of-2020-dpiit": /press note 3|land border/i,
  "fem-overseas-investment-rules-regulations-2022": /overseas investment|\bodi\b|\bopi\b|liberalised remittance|\blrs\b/i,
  "external-commercial-borrowings-ecb-framework": /\becb\b|external commercial borrowing/i,
  "foreign-exchange-management-act-1999": /\bfema\b|foreign exchange/i,
  "insolvency-and-bankruptcy-code-2016": /insolvency|\bibc\b|\bcirp\b|\bibbi\b|\bnclt\b|resolution plan/i,
  "sarfaesi-act-2002": /sarfaesi/i,
  "rbi-project-finance-directions-2025": /project finance|provisioning|\bdcco\b/i,
  "banking-regulation-act-1949": /banking regulation/i,
  "income-tax-act-1961-m-a-provisions": /income[- ]?tax|capital gains|angel tax|\bgaar\b|finance act/i,
  "indian-stamp-act-1899-2019-2020-securities-amendment": /stamp duty|stamp act/i,
  "digital-personal-data-protection-act-2023-rules-2025": /\bdpdp\b|data protection|personal data/i,
  "trade-marks-act-1999": /trade ?mark/i,
  "information-technology-act-2000": /information technology act|intermediary/i,
  "telecommunications-act-2023": /telecom|spectrum|telegraph/i,
  "arbitration-and-conciliation-act-1996": /arbitration|conciliation/i,
};
export const LAW_IDS = Object.keys(LAW_KEYWORDS);
export function matchLaws(text = "") { return Object.entries(LAW_KEYWORDS).filter(([, re]) => re.test(text)).map(([id]) => id).slice(0, 4); }

const STOP = /limited|company|crore|acquisition|advises|advise|shardul|cyril|khaitan|partners|amarchand|mangaldas|trilegal|industries|holdings|capital|financial|services/;
// catalog: [{id, text}] where text = deal headline (lowercased). Returns best-match deal id.
export function matchDealId(text, catalog) {
  const t = (text || "").toLowerCase(); if (!t) return null;
  for (const c of catalog) {
    const toks = (c.text || "").split(/[^a-z0-9]+/).filter((w) => w.length > 5 && !STOP.test(w));
    for (const w of toks) if (t.includes(w)) return c.id;
  }
  return null;
}

const REG_WORDS = /circular|notification|master direction|guideline|amendment|regulation|advisory|framework|press release|\border\b|directive|rules?\b/i;

export function structureRegulatorFree(item) {
  const d = new Date(item.published).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return {
    id: item.id, reg: item.regulator, title: item.headline, status: "Notification", effective: d, deadline: "—",
    impact: `New ${item.regulator} issuance — review the source for applicability and any deadlines.`,
    action: "Read the notification and assess impact on live mandates and document templates.",
    sources: [{ name: item.regulator, url: item.url, official: true, blurb: `Official ${item.regulator} issuance.` }],
    deals: [], laws: matchLaws(item.headline),
  };
}

// Route a commentary article. Returns { kind: 'deal'|'regulation'|'trend', payload }.
export function routeArticleFree(item, catalog) {
  const text = (item.headline || "") + " " + (item.body || "");
  const yr = String(new Date(item.published).getFullYear());
  const dealId = matchDealId(text, catalog);
  if (dealId) return { kind: "deal", payload: { deal: dealId, title: item.headline, source: item.source || "Bar & Bench", url: item.url, date: yr, insight: "Analysis touching this matter — open the source for the full piece." } };
  if (REG_WORDS.test(item.headline)) return { kind: "regulation", payload: {
    id: item.id, reg: "Analysis", title: item.headline, status: "Commentary", effective: yr, deadline: "—",
    impact: "Commentary on a regulatory development — review for applicability.", action: "Read and assess.",
    sources: [{ name: item.source || "Bar & Bench", url: item.url, official: false, blurb: "Legal analysis." }], deals: [], laws: matchLaws(item.headline) } };
  return { kind: "trend", payload: {
    id: item.id, title: item.headline, date: yr, summary: "Market commentary — open the source for the analysis.",
    sources: [{ name: item.source || "Bar & Bench", url: item.url }], deals: [], laws: matchLaws(item.headline) } };
}
