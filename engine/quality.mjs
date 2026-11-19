// Evidence-first quality and market-entity hygiene.
// This module is applied deterministically to EVERY historical and incoming record
// at publication time; source items are not erased when removed from the deal feed.
import { isOfficial } from "./score.mjs";

const VERIFIED_FIRMS = [
 "Cyril Amarchand Mangaldas","Shardul Amarchand Mangaldas","Khaitan & Co",
 "JSA","Trilegal","AZB & Partners","S&R Associates","TT&A","CMS INDUSLAW",
 "Hogan Lovells","Linklaters","Latham & Watkins","A&O Shearman","DSK Legal",
 "Legacy Law Offices","Saraf and Partners","Vertices Partners","Dentons Link Legal",
 "Sidley Austin","Bharucha & Partners","SNG & Partners","DMD Advocates","NovoJuris",
 "Universal Legal","Economic Laws Practice","Cravath","Rajani Associates",
 "HSA Advocates","Kochhar & Co","Desai & Diwanji","Fox Mandal & Associates",
 "Sequitur","ALMT Legal","Greenberg Traurig","McDermott Will & Schulte",
 "Morgan Lewis","Agram Legal","TLH Advocates & Solicitors",
 "White & Case","Anagram Partners","Kanga & Co","Aritra Partners",
 "Vidhiśāstras","S&A Law Offices","Triumvir Law","Argus Partners",
 "Lexygen","Chamberlain Hrdlicka","Bradley Arant Boult Cummings",
 "Foley Hoag","Legalics","Gibson, Dunn & Crutcher",
 "Davis Polk & Wardwell","Freshfields","Crawford Bayley & Co",
 "Quillon Partners","FBT Gibbons","Vidhigya Associates","Pinac",
 "Luthra and Luthra","Talwar Thakore & Associates"
];
const FIRM_NAMES = new Map(VERIFIED_FIRMS.map(x=>[key(x),x]));
function key(s){return String(s||"").normalize("NFKC").trim().toLowerCase().replace(/[.]/g,"").replace(/[\s–—-]+/g," ").replace(/\s*&\s*/g," & ").replace(/\s+/g," ");}
const ALIASES = {
 "jsa advocates & solicitors":"JSA","jsa advocates and solicitors":"JSA",
 "jsa (j sagar associates)":"JSA","j sagar associates (jsa)":"JSA",
 "j sagar associates":"JSA","jsa advocates & solicitors (jsa)":"JSA",
 "shardul amarchand mangaldas & co":"Shardul Amarchand Mangaldas",
 "shardul amarchand mangaldas & co (sam)":"Shardul Amarchand Mangaldas",
 "cyril amarchand mangaldas (cam)":"Cyril Amarchand Mangaldas",
 "khaitan & co (k&co)":"Khaitan & Co",
 "cms induslaw":"CMS INDUSLAW","induslaw":"CMS INDUSLAW",
 "talwar thakore & associates (tt&a)":"TT&A",
 "talwar thakore & associates":"TT&A",
 "vertices partners":"Vertices Partners",
 "latham & watkins llp":"Latham & Watkins",
 "white & case llp":"White & Case",
 "novojuris legal":"NovoJuris",
 "almt legal, bangalore":"ALMT Legal",
 "agram legal consultants":"Agram Legal",
 "sequitur advocates & legal consultants":"Sequitur",
 "tlh, advocates & solicitors":"TLH Advocates & Solicitors",
 "economic laws practice (elp)":"Economic Laws Practice",
 "kochhar & co":"Kochhar & Co",
 "mcd ermott will & emery":"McDermott Will & Schulte",
 "mcd ermott will & schulte":"McDermott Will & Schulte",
 "m c dermott will & emery":"McDermott Will & Schulte",
 "mcd ermott will & emery (also referred to as 'mcd ermott will & schulte')":"McDermott Will & Schulte",
 "freshfields bruckhaus deringer":"Freshfields"
};
for(const [name,canonical] of Object.entries(ALIASES)) FIRM_NAMES.set(key(name),canonical);
const BAD_FIRM = /^(?:[—–-]|unknown\b|not (?:disclosed|stated|identified)\b|bar\s*&\s*bench\b|nse\b|bse\b|insolvency professional|resolution professional|monitoring agency|scrutinizer|legal counsel to\b|(?:sbi ?caps|sbi capital markets|rothschild|jp morgan|investec)\b)/i;
const ENTITY = /\b(?:limited|private limited|ltd\.?|government|ministr(?:y|ies)|stock exchange|funds|capital market|advisor|advisors|investment banker|brokers)\b/i;

export function canonicalFirm(name) {
 const raw=String(name||"").trim();
 if(!raw||BAD_FIRM.test(raw))return null;
 const firm=FIRM_NAMES.get(key(raw));
 return firm || null; // non-registered names go to review, never into a league table
}
export function cleanCounsel(firms=[]) {
 const seen=new Set(),accepted=[],quarantined=[];
 for(const f of Array.isArray(firms)?firms:[]) {
   if(!f)continue;
   const entry=typeof f==="string"?{name:f}:f;
   const original=String(entry.name||"").trim();
   const canonical=canonicalFirm(original);
   if(!canonical) {if(original)quarantined.push({name:original,reason:BAD_FIRM.test(original)||ENTITY.test(original)?"not a verified external legal adviser":"firm name requires validation"});continue;}
   const side=String(entry.side||"").trim();
   // Do not populate fabricated buyer/seller side information.
   const dedupe=canonical+"|"+side.toLowerCase();
   if(seen.has(dedupe))continue;
   seen.add(dedupe);
   accepted.push({...entry,name:canonical,originalName:original!==canonical?original:undefined});
 }
 return {accepted,quarantined};
}
const GENERIC_URL = /\/corporates\/ann\.html|\/companies-listing\/corporate-filings|\/combination\/orders\/?$|\/public-issues\.html\/?$|\/sebiweb\/home\/|\/BS_ViewMasDirections\.aspx|\/AllReleasem\.aspx|\/order-judgement-date-wise\/?$|\/en\/orders\/?$|\/corporates\/?$|\/corporate\/?$|\/legal\/regulations\/?$/i;
const OFFICIAL_HOST = /(^|\.)(?:sebi\.gov\.in|rbi\.org\.in|cci\.gov\.in|ibbi\.gov\.in|mca\.gov\.in|bseindia\.com|nseindia\.com|nclt\.gov\.in|nclat\.gov\.in|sci\.gov\.in|pib\.gov\.in|gov\.in|nic\.in)$/i;
export function classifySource(url) {
 try {
  const u=new URL(url);
  if(!/^https?:$/.test(u.protocol))return "invalid";
  const host=u.hostname.toLowerCase().replace(/^www\./,"");
  if(!OFFICIAL_HOST.test(host))return "secondary";
  if(!u.pathname||u.pathname==="/"||GENERIC_URL.test(u.pathname))return "portal";
  return "official-filing-link";  // URL not yet fetched: claim-level validation is separate
 }catch {return "invalid";}
}
function sourceList(sources=[]) {
 const seen=new Set(),specific=[],portals=[],invalid=[];
 for(const source of Array.isArray(sources)?sources:[]) {
   if(!source||!source.url)continue;
   const url=String(source.url).trim().split("#")[0],kind=classifySource(url);
   if(seen.has(url))continue;seen.add(url);
   const tagged={...source,url,official:kind==="official-filing-link",sourceKind:kind};
   (kind==="portal"?portals:kind==="invalid"?invalid:specific).push(tagged);
 }
 return {specific,portals,invalid};
}
// A routine filing is not itself a transaction. These filters are intentionally
// narrow; ambiguous records are visible in a separate archive, never destroyed.
const ROUTINE_TITLE = /\b(?:monitoring agency report|general updates|copy of newspaper publication|newspaper publication|intimation of (?:board|committee) meeting|scrutinizer(?:'s)? report|trading window closure|regulation 74\(5\)|regulation 31\(4\)|shareholding pattern|book closure|outcome of board meeting|quarterly compliance certificate)\b/i;
const THIN_HEADLINE = /:\s*(?:updates|others|press release|acquisition|general update|corporate announcement)$/i;
const REG31 = /\bregulation\s*31\s*\(?4\)?\b/i;
export function recordQuality(d) {
 const headline=String(d?.headline||""),body=String(d?.detail||d?.sum||"");
 if(ROUTINE_TITLE.test(headline)||REG31.test(body))return {kind:"disclosure",reason:"Routine compliance/disclosure, not proof of a new economic transaction"};
 if(THIN_HEADLINE.test(headline) && body.length<210)
  return {kind:"needs-research",reason:"Generic filing headline without material transaction facts"};
 if(/disclosure under sebi takeover regulations/i.test(headline)&&!/open offer|share purchase|acqui(?:red|sition|re|ring)|transaction|sale of\b/i.test(body))
  return {kind:"disclosure",reason:"Ownership disclosure is not automatically M&A"};
 return {kind:"deal",reason:""};
}
function evidenceStage(d,q) {
 if(q.kind!=="deal")return "filed";
 const stage=d.stage||"announced";
 const combined=String(d.headline||"")+" "+String(d.sum||"");
 // Narrow downgrade for a filing with no actual closing evidence.
 if(stage==="completed" && /:\s*Acquisition$/i.test(d.headline||"") && /has informed the Exchange about (?:Acquisition|allotment)/i.test(combined)
     && !/\b(?:completed the acquisition|acquisition has been completed|completion of acquisition|has acquired|acquired an? \d|fully consummated)\b/i.test(combined))
   return "filed";
 return stage;
}
export function sanitiseDeal(d) {
 const firm=cleanCounsel(d.firms||[]),sources=sourceList(d.sources||[]),docs=sourceList((d.docs||[]).map(x=>({name:x.label,url:x.url})));
 const q=recordQuality(d);
 // Historical curated verified flags are *not* discarded, but the public badge
 // distinguishes editorial review from merely having a linked filing.
 const direct=[...sources.specific,...docs.specific].some(s=>s.sourceKind==="official-filing-link");
 const reviewed=!!(d.transaction&&d.openOffer&&d.verifiedAsOf);
 return {...d,stage:evidenceStage(d,q),firms:firm.accepted,
   sources:sources.specific,docs:docs.specific.map(x=>({label:x.name||"Document",url:x.url})),
   researchPortals:[...sources.portals,...docs.portals],sourceQuarantine:[...sources.invalid,...docs.invalid],
   quality:{...q,counselQuarantine:firm.quarantined.map(x=>x.name),
     directOfficialFiling:direct,reviewed,reviewStatus:reviewed?"editorial-document-review":direct?"filing-linked":"reported"},
   verified:reviewed||direct};
}
export function dossierCounts(records=[]) {
 const counts={total:records.length,deal:0,disclosure:0,needsResearch:0,verified:0,withCounsel:0,fullyCurated:0};
 for(const d of records){
  if(d.quality?.kind==="deal")counts.deal++;
  else if(d.quality?.kind==="disclosure")counts.disclosure++;
  else counts.needsResearch++;
  if(d.verified)counts.verified++;
  if(d.firms?.length)counts.withCounsel++;
  if(d.transaction&&d.openOffer)counts.fullyCurated++;
 }
 return counts;
}
