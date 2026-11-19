// Evidence-first dossier for EVERY deal, including legacy records.
// Deterministic: NEVER fabricates SPA terms, percentages, dates, approvals,
// legal advisers, share allocations or deal completion from a headline.
// The published "verified" flag means a relevant filing LINK exists;
// it does not verify every sentence in the record.
const REGULATOR_HOST = /(^|\.)(sebi\.gov\.in|rbi\.org\.in|cci\.gov\.in|ibbi\.gov\.in|mca\.gov\.in|bseindia\.com|nseindia\.com|nclt\.gov\.in|nclat\.gov\.in|sci\.gov\.in|pib\.gov\.in|egazette\.gov\.in|indiacode\.nic\.in|gov\.in|nic\.in)$/i;
const PORTAL_ONLY = /(\/corporates\/ann\.html\/?$|\/corporate-filings-announcements\/?$|\/combination\/orders\/?$|\/public-issues\.html\/?$|\/sebiweb\/home\/|\/en\/orders\/?$|\/order-judgement-date-wise\/?$|\/?$)/i;
const NO_DATA = /^(?:—|-|n\/a|unknown|undisclosed|not disclosed)$/i;
function validUrl(url) {
  try { const x = new URL(url); return /^https?:$/.test(x.protocol) && x.hostname.length > 3; }
  catch { return false; }
}
function sourceType(s) {
  if (!validUrl(s?.url)) return "unverified-link";
  const u = new URL(s.url), host = u.hostname.toLowerCase().replace(/^www\./,"");
  const isReg = REGULATOR_HOST.test(host);
  if (isReg && u.pathname !== "/" && !PORTAL_ONLY.test(u.pathname)) return "official-document";
  if (isReg) return "official-portal-only";
  if (/^https?:\/\//.test(s.url) && /\.(pdf)(?:[?#]|$)/i.test(s.url)) return "third-party-document";
  return "published-source";
}
function uniqueSourceList(d) {
  const seen = new Set(), out = [];
  for (const s of [...(d.sources || []), ...(d.docs || []).map(x=>({name:x.label,url:x.url,blurb:"Linked transaction document"}))]) {
    if (!s || !validUrl(s.url)) continue;
    const url = s.url.split("#")[0];
    if (seen.has(url)) continue;
    seen.add(url);
    const kind = sourceType(s);
    out.push({name:s.name || "Source document",url,kind,note:s.blurb || ""});
  }
  return out;
}
const GAPS = {
  ma: ["Exact closing and control-transfer documents", "Consideration and ownership allocation", "Regulatory approvals, if applicable", "Material SPA covenants and conditions precedent"],
  ipo: ["Final issue/pricing and allotment status", "Use of proceeds and issue structure", "Offer document and exchange approvals"],
  pe: ["Equity terms and post-money ownership", "Investor rights and conditions precedent", "Regulatory and shareholder consents"],
  bank: ["Facility agreement and tenor", "Security package and covenants", "Lender-side and borrower-side counsel"],
  ibc: ["Latest tribunal order and effective date", "Approved plan and implementation", "Creditor recoveries and any appeal"],
  reg: ["Effective date and transitional provisions", "Whether a consultation or binding rule", "Exact provision and applicability"],
  lit: ["Operative order and case number", "Final versus interim disposition", "Stay/appeal status"]
};
function missingQuestions(d, sources) {
  const out = [], s=d.structure || {};
  if (!sources.some(x=>x.kind==="official-document"))
    out.push("A transaction-specific regulator/exchange primary document has not been linked or independently checked.");
  if (!d.value || NO_DATA.test(String(d.value).trim())) out.push("Public monetary consideration is not established.");
  if (!d.firms?.length) out.push("No independently attributed legal advisers in the stored sources.");
  if (!d.timeline?.length) out.push("A detailed dated closing/approval chronology is not established.");
  if (!(s.conditions?.length || d.keyContractTerms?.length))
    out.push("Executed contract conditions, warranties and restrictive covenants are not disclosed in the record.");
  if (!(s.approvals?.length || d.openOffer))
    out.push("Deal-specific regulatory approval and consent outcomes are not evidenced in the record.");
  // Not a claim of nonexistence: a gap in the currently available documentation.
  const expected = GAPS[d.type] || GAPS.ma;
  return [...out,...expected.filter(x=>!out.some(y=>y.toLowerCase().includes(x.toLowerCase().split(" ")[0])))]
    .slice(0,7);
}
export function dossierForDeal(d) {
  const sources=uniqueSourceList(d);
  const official=sources.filter(x=>x.kind==="official-document").length;
  const documents=sources.filter(x=>/document/.test(x.kind)).length;
  const structured=(d.structure?.conditions?.length||0)+(d.structure?.approvals?.length||0)
    +(d.research?.facts?.length||0)+(d.keyContractTerms?.length||0);
  const fullyCurated=!!(d.transaction && d.openOffer);
  const depth=fullyCurated ? "Document-intensive case study"
    : official>0 && (structured>=3 || (d.timeline?.length||0)>=3) ? "Substantive source-linked record"
    : official>0 ? "Primary-filing linked record" : "Reported-source record";
  return {
    version:1,depth,
    coverageStatement:fullyCurated
      ? "Multiple primary transaction instruments and post-offer materials cross-referenced; later changes separately dated."
      : official>0
        ? "At least one specific regulator/exchange filing is linked. Individual deal assertions still require checking against the underlying filing."
        : "This record has not been matched to a transaction-specific regulator/exchange filing. Treat the description as a report, not a verified closing record.",
    specificOfficialDocuments:official,
    linkedDocuments:documents,
    sourceLedger:sources,
    gaps:fullyCurated ? [...(d.editorialCautions||[])] : missingQuestions(d,sources),
    // Facts from independent deep extraction may be attached later, but should
    // carry per-claim evidence links, status and quotations.
    facts:(d.research?.facts||[]).filter(x=>x && validUrl(x.sourceUrl) && x.fact),
    reviewedOn:d.verifiedAsOf || d.research?.reviewedOn || null
  };
}
export function attachEvidenceDossier(deal) {
  return {...deal, evidenceDossier:dossierForDeal(deal)};
}
