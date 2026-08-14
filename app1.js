/* ============================ TAXONOMY ============================ */
const TYPES={
  ma:{label:"M&A / JV",cls:"t-ma",c:"var(--accent)"}, ipo:{label:"IPO / ECM",cls:"t-ipo",c:"var(--green)"},
  pe:{label:"PE / VC",cls:"t-pe",c:"var(--purple)"}, ibc:{label:"IBC",cls:"t-ibc",c:"var(--red)"},
  reg:{label:"Regulatory",cls:"t-reg",c:"var(--amber)"}, bank:{label:"Banking & Fin",cls:"t-bank",c:"var(--teal)"},
  lit:{label:"Disputes",cls:"t-lit",c:"var(--slate)"}
};
const STAGES={
  rumoured:{l:"Rumoured",c:"#b87400"}, announced:{l:"Announced",c:"#2f54eb"},
  review:{l:"In Regulatory Review",c:"#6e44d4"}, completed:{l:"Completed",c:"#0c8f5a"},
  filed:{l:"Filed / Open",c:"#0a8585"}, ruling:{l:"Ruling",c:"#cf3a52"}, inforce:{l:"In Force",c:"#475569"}
};
const GEOS=[{id:"all",label:"All India",dot:"var(--accent)"},{id:"mumbai",label:"Mumbai",dot:"#6d8bff"},
  {id:"delhi",label:"Delhi-NCR",dot:"#7b4fd6"},{id:"bengaluru",label:"Bengaluru",dot:"#0a8585"},
  {id:"other",label:"India - Other",dot:"#8b93a3"},{id:"global",label:"Global / Cross-border",dot:"#0c8f5a"}];
const CITYLABEL={mumbai:"Mumbai",delhi:"Delhi-NCR",bengaluru:"Bengaluru",other:"India - Other",global:"Global / Cross-border"};
/* Safe lookups - the nightly pipeline can introduce a deal type/stage/geo the UI
   doesn't know yet. Never let an unknown key crash the whole render. */
function TY(t){return (typeof TYPES!=="undefined"&&TYPES[t])||{label:String(t||"Other").toUpperCase(),cls:"t-ma",c:"var(--ink3)"};}
function ST(s){return (typeof STAGES!=="undefined"&&STAGES[s])||{l:String(s||"—"),c:"var(--ink3)"};}
function CL(g){return (typeof CITYLABEL!=="undefined"&&CITYLABEL[g])||String(g||"India");}
const SECTORS=["All Sectors","Technology","BFSI","Pharma & Healthcare","Energy & Renewables","Infrastructure","Consumer & Retail","Telecom","FMCG","Metals & Mining","Financial Services","Industrials"];
// official / primary-source detection (the moat signal)
const OFFICIAL_RE=/(\.gov\.in|\.nic\.in|sebi|rbi\.org|cci\.gov|ibbi|mca\.gov|dipam|pib\.gov|meity|bseindia|nseindia|nclt|nclat|sci\.gov|trai|irdai|ecourts)/i;
function srcOfficial(s){return !!s&&(s.official===true||OFFICIAL_RE.test(s.url||""));}
// official / primary verification points by deal type - collated for EVERY deal (the moat)
function officialPointers(type){
  const EX=[{name:"BSE corporate announcements",url:"https://www.bseindia.com/corporates/ann.html",official:true,blurb:"Official exchange filings - search by the company to pull the disclosure."},
            {name:"NSE corporate announcements",url:"https://www.nseindia.com/companies-listing/corporate-filings-announcements",official:true,blurb:"Official exchange filings - search by the company."}];
  const M={ipo:[...EX,{name:"SEBI public issues / DRHPs",url:"https://www.sebi.gov.in/filings/public-issues.html",official:true,blurb:"SEBI filing for the issue."}],
    ma:[...EX,{name:"CCI combination orders",url:"https://www.cci.gov.in/combination/orders",official:true,blurb:"CCI merger-clearance order, if notified."}],
    ibc:[{name:"IBBI orders",url:"https://ibbi.gov.in/en/orders",official:true,blurb:"IBBI / insolvency record."},{name:"NCLT orders",url:"https://nclt.gov.in/order-judgement-date-wise",official:true,blurb:"NCLT order."}],
    reg:[{name:"SEBI circulars",url:"https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=6&smid=0",official:true,blurb:"The regulator's primary text."},{name:"PIB releases",url:"https://pib.gov.in/AllReleasem.aspx",official:true,blurb:"Government press release."}],
    bank:[{name:"RBI notifications",url:"https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx",official:true,blurb:"RBI primary text."},...EX],
    lit:[{name:"Judgments portal (eCourts)",url:"https://judgments.ecourts.gov.in/",official:true,blurb:"The court's judgment record."}]};
  return M[type]||EX;
}
// generic regulator/exchange PORTAL roots - these are "where to look", not proof of a specific filing
const GENERIC_PORTAL=/(corporates\/ann\.html|companies-listing\/corporate-filings|combination\/orders|public-issues\.html|BS_ViewMasDirections|AllReleasem|order-judgement-date-wise|sebiweb\/home|dipam\.gov\.in\/?$|meity\.gov\.in\/?$|judgments\.ecourts\.gov\.in\/?$|ibbi\.gov\.in\/en\/orders$|nclt\.gov\.in)/i;
function specificOfficial(u){return OFFICIAL_RE.test(u||"")&&!GENERIC_PORTAL.test(u||"");}
// a deal carries a REAL, specific official source (a named company's filings page or a specific filing) - not a generic portal
function dealHasRealOfficial(d){
  return (d.sources||[]).some(s=>srcOfficial(s)&&specificOfficial(s.url))
    ||(typeof officialDocs==="function"&&officialDocs(d).some(o=>specificOfficial(o.url)))
    ||(d.docs||[]).some(x=>specificOfficial(x.url));
}
function dealHasOfficial(d){return dealHasRealOfficial(d);}
// for the deal page: real official deep-links first, then generic verification portals as a fallback
function srcsWithOfficial(d){
  const od=(typeof officialDocs==="function"?officialDocs(d):[]).map(o=>({name:o.label,url:o.url,official:true,blurb:"Official filing / disclosure - opens the party's exchange or regulator page."}));
  const base=[...(d.sources||[]),...od];
  return dealHasRealOfficial(d)?base:[...base,...officialPointers(d.type)];
}

/* ============================ FIRMS ============================ */
const FIRMS={
 "Cyril Amarchand Mangaldas":{city:"Mumbai",type:"Indian",focus:"India's largest full-service law firm; market leader in M&A, capital markets, banking and disputes.",web:"https://www.cyrilshroff.com"},
 "Shardul Amarchand Mangaldas":{city:"New Delhi",type:"Indian",focus:"Top-tier full-service firm; powerhouse in capital markets, M&A, competition and insolvency.",web:"https://www.amsshardul.com"},
 "Khaitan & Co":{city:"Mumbai",type:"Indian",focus:"Full-service firm strong in M&A, capital markets, PE, banking & finance and competition.",web:"https://www.khaitanco.com"},
 "JSA":{city:"Gurugram",type:"Indian",focus:"J Sagar Associates - M&A, banking & finance, projects/infrastructure and disputes.",web:"https://www.jsalaw.com"},
 "TT&A":{city:"Mumbai",type:"Indian",focus:"Talwar Thakore & Associates - banking, M&A and capital markets.",web:""},
 "S&R Associates":{city:"Mumbai / Delhi",type:"Indian",focus:"Corporate, capital markets, private equity and disputes.",web:""},
 "CMS INDUSLAW":{city:"Bengaluru",type:"Indian",focus:"Venture capital, technology, PE and corporate (CMS–IndusLaw).",web:"https://induslaw.com"},
 "Hogan Lovells":{city:"London / Global",type:"International",focus:"Global firm; international counsel on India-linked capital markets and cross-border M&A.",web:"https://www.hoganlovells.com"},
 "Linklaters":{city:"London / Global",type:"International",focus:"Magic Circle firm; international counsel on India capital-markets transactions.",web:"https://www.linklaters.com"},
 "DMD Advocates":{city:"New Delhi / Mumbai",type:"Indian",focus:"Disputes-led firm; telecom, regulatory and commercial litigation.",web:"https://www.dmdadvocates.com"},
 "Bharucha & Partners":{city:"Mumbai",type:"Indian",focus:"Disputes and corporate firm with a strong Supreme Court and Bombay HC practice.",web:"https://www.bharucha.in"},
 "Agram Legal Consultants":{city:"Bengaluru",type:"Indian",focus:"Corporate and M&A advisory boutique.",web:""},
 "Vidhiśāstras":{city:"India",type:"Indian",focus:"Corporate, funds and cross-border advisory firm.",web:""}
};
function firmKnown(n){return Object.prototype.hasOwnProperty.call(FIRMS,n);}

/* ============================ DEALS (all verified, sourced to Bar & Bench) ============================ */
const SRC="Bar & Bench - Dealstreet";
/* DEALS-START - this block is auto-generated by the nightly pipeline (engine/build.mjs). Manual edits here are overwritten on the next run. */
const DEALS=(window.CLT_DATA&&window.CLT_DATA.DEALS)||[];
/* DEALS-END */

/* ============================ PARTNER-GRADE ENRICHMENT ============================
   Curated overlay keyed by deal id: the lawyer-facing "practice implication", a
   Verified flag, and REAL official-document deep-links (verified BSE scrip codes /
   NSE symbols / regulator pages). Engine-added deals carry their own fields and fall
   back gracefully. */
function bse(slug,sym,code){return `https://www.bseindia.com/stock-share-price/${slug}/${sym}/${code}/`;}
function nse(sym){return `https://www.nseindia.com/get-quotes/equity?symbol=${sym}`;}
const EXTRA={
 "acme-qip":{verified:true,
   implication:"First raise since the 2024 listing, priced at ₹279.50 with a deep marquee book (ADIA, BlackRock, Goldman) - reads as a re-opening of the renewables ECM window. QIP route sidesteps promoter-OFS overhang; a template for IPP balance-sheet repair.",
   official:[{label:"ACME Solar - BSE filings (scrip 544283)",url:bse("acme-solar-holdings-ltd","acmesolar","544283")},{label:"ACME Solar - NSE filings (ACMESOLAR)",url:nse("ACMESOLAR")}]},
 "airtel-spectrum":{verified:true,
   implication:"A real limit on the State's power to retrospectively re-price licences - Section 4 of the Telegraph Act cannot be used to add post-hoc financial burdens. Cite in any licence-variation or regulatory-charge dispute; bank guarantees were ordered returned.",
   official:[{label:"Bharti Airtel - BSE filings (532454)",url:bse("bharti-airtel-ltd","BHARTIARTL","532454")},{label:"Vodafone Idea - BSE filings (532822)",url:bse("vodafone-idea-ltd","IDEA","532822")}]},
 "jsw-energy-qip":{verified:true,
   implication:"Second equity raise since 2010; ₹525/share with SBI Hybrid + GQG absorbing ~73% - concentrated anchor conviction in the 30 GW-by-2030 build-out. Proceeds deleverage and fund JSW Neo. Watch for a wave of IPP follow-ons.",
   official:[{label:"JSW Energy - BSE filings (533148)",url:bse("jsw-energy-ltd","JSWENERGY","533148")},{label:"JSW Energy - NSE filings (JSWENERGY)",url:nse("JSWENERGY")}]},
 "coal-india-ofs":{verified:true,
   implication:"₹412 floor, 2% (1% base + 1% green-shoe), non-retail ~4x subscribed - strong PSU-paper appetite underwrites the FY27 ₹80,000 cr disinvestment pipeline. OFS-via-exchange remains the cleanest government-exit route.",
   official:[{label:"Coal India - BSE filings (533278)",url:bse("coal-india-ltd","COALINDIA","533278")},{label:"DIPAM (disinvestment)",url:"https://dipam.gov.in/"}]},
 "irfc-hyd-metro":{verified:true,
   implication:"₹13,527 cr, 20-yr tenure, Telangana State guarantee + RBI direct-debit mandate - a replicable credit-enhancement template for monetising operating metro/DBFOT assets, and IRFC stepping beyond railways into urban-transit refinancing.",
   official:[{label:"IRFC - BSE filings (543257)",url:bse("indian-railway-finance-corporation-ltd","IRFC","543257")},{label:"IRFC - NSE filings (IRFC)",url:nse("IRFC")}]},
 "jsa-hdfc-indusinfra":{verified:true,
   implication:"₹1,940 cr to a road InvIT to refinance acquired-SPV debt - InvIT-level leverage to recycle capital. Note SEBI InvIT leverage caps and the refinancing-of-acquisition-debt structure.",
   official:[{label:"HDFC Bank - BSE filings (500180)",url:bse("hdfc-bank-ltd","HDFCBANK","500180")},{label:"RBI notifications",url:"https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx"}]},
 "tata-freight-tiger":{verified:true,
   implication:"Crossing ~63% via secondary purchase from Lightspeed, Florintree and the founder - structured as stake-creep to control of an unlisted target, avoiding an open offer. Watch the SHA drag/tag and founder-exit mechanics.",
   official:[{label:"Tata Motors - NSE filings (TATAMOTORS)",url:nse("TATAMOTORS")}]},
 "paytm-elevation":{verified:true,
   implication:"₹963.6 cr on-market block exit by a 2014-vintage VC - a clean read on fund DPI timing and the mechanics of large block sales in listed new-age companies post lock-up.",
   official:[{label:"One97 (Paytm) - BSE filings (543396)",url:bse("one-97-communications-ltd","paytm","543396")},{label:"Paytm - NSE filings (PAYTM)",url:nse("PAYTM")}]},
 "hcl-foxconn":{verified:true,
   implication:"OSAT JV (India Chip Pvt Ltd), ₹3,706 cr at YEIDA, Foxconn ~40% - a JV + technology-licence structure under the India Semiconductor Mission. The live issues: fiscal-support conditions, PN3/FDI posture and IP-licensing carve-outs.",
   official:[{label:"PIB - India Semiconductor Mission",url:"https://pib.gov.in/AllReleasem.aspx"},{label:"MeitY",url:"https://www.meity.gov.in/"}]},
 "pepsico-varun":{verified:true,
   implication:"Bottling + trademark licence extended to 2049 AND Varun's single-brand exclusivity restriction removed - the removal is the real story: it frees Varun's M&A optionality and is the competition-sensitive term to watch.",
   official:[{label:"Varun Beverages - BSE filings (540180)",url:bse("varun-beverages-ltd","VBL","540180")},{label:"Varun Beverages - NSE filings (VBL)",url:nse("VBL")}]},
 "coforge-cigniti":{verified:true,
   implication:"Absorption by court scheme (1:1, NCLT Chandigarh, appointed date 1 Apr 2025, effective 5 May 2026) rather than a share purchase - a clean precedent for amalgamating a listed target tax-neutrally; 99.95% shareholder approval.",
   official:[{label:"Coforge - BSE filings (532541)",url:bse("coforge-ltd","COFORGE","532541")},{label:"Coforge - NSE filings (COFORGE)",url:nse("COFORGE")}]},
 "embio-truenorth":{verified:true,
   implication:"PE minority into an API/CDMO maker with a full multi-practice diligence (pharma licences, IP, CCI, real estate, employment) - illustrates the diligence load for controlled-substance API targets; licence-transferability is the gating item.",
   official:[]},
 "anveshan-seriesb":{verified:true,
   implication:"₹150 cr Series B led by Vertex and IFC - note IFC's DFI covenants (E&S, governance, anti-corruption) that materially shape the SHA beyond a vanilla priced round.",
   official:[]},
 "hfcl-pref":{verified:true,
   implication:"₹555 cr preferential warrants to promoters (25% upfront, 18-month exercise) - promoter capital infusion; watch ICDR pricing, lock-in and the conversion-timing optionality.",
   official:[{label:"HFCL - BSE filings (500183)",url:bse("himachal-futuristic-communications-ltd","hfcl","500183")},{label:"HFCL - NSE filings (HFCL)",url:nse("HFCL")}]},
 "hfcl-qip":{verified:true,
   implication:"₹550 cr QIP paired with the promoter preferential issue - the QIP + promoter-warrant combination is a balance-sheet-strengthening template worth noting for mid-cap issuers.",
   official:[{label:"HFCL - BSE filings (500183)",url:bse("himachal-futuristic-communications-ltd","hfcl","500183")},{label:"HFCL - NSE filings (HFCL)",url:nse("HFCL")}]},
 "pagani-residency":{verified:true,
   implication:"Cross-border residency-investment programme for Indian outbound into Portugal - LRS/ODI limits, FEMA overseas-investment rules and the AIF-adjacent marketing perimeter are the live regulatory issues.",
   official:[]}
};
function impl(d){return d.implication||(EXTRA[d.id]&&EXTRA[d.id].implication)||"";}
function officialDocs(d){return (d.officialDocs)||(EXTRA[d.id]&&EXTRA[d.id].official)||[];}
function isVerified(d){
  if(d.verified===true)return true;
  if(EXTRA[d.id]&&EXTRA[d.id].verified)return true;
  return dealHasRealOfficial(d);
}

/* Regulatory tracker - real developments with effective dates, deadlines and "what changes in your documents". */
/* REGITEMS-START - auto-extended nightly with regulator circulars/notifications; new items on top. */
const REGITEMS=(window.CLT_DATA&&window.CLT_DATA.REGITEMS)||[];
/* REGITEMS-END */

/* ============================ COMMENTARY & ANALYSIS (per deal) ============================
   Opinion pieces, columns and analysis that discuss a specific deal - the "what the market is
   saying" branch of each deal's web. Keyed by deal id. 'insight' is OUR one-line read of what the
   article adds, not a copy of it. Auto-extended nightly by the engine. */
/* COMMENTARY-START - flat list; new items inserted on top by the engine. */
const COMMENTARY=(window.CLT_DATA&&window.CLT_DATA.COMMENTARY)||[];
/* COMMENTARY-END */

/* ============================ MARKET INTELLIGENCE / TRENDS ============================
   Cross-deal themes synthesised from commentary and data - the strands that connect several deals'
   webs. Each links to the deals and laws it touches. Auto-extended nightly. */
/* TRENDS-START */
const TRENDS=(window.CLT_DATA&&window.CLT_DATA.TRENDS)||[];
/* TRENDS-END */

/* ============================ REGULATORY LIBRARY (the masterclass) ============================
   Organised by area. Each entry: what it governs, the key sections/regulations a lawyer actually
   uses, recent amendments (flagged), the deals on this site it applies to (cross-linked), and
   official sources. Written to be useful to a first-year associate learning it and a senior
   partner revising it. References are a study/checklist aid, not legal advice. */
const REGLIB=[
 {area:"Securities & Capital Markets",intro:"The SEBI rulebook governing how companies raise equity, stay listed, and how control changes hands on the market.",items:[
  {t:"SEBI Act, 1992",governs:"Constitutes SEBI and arms it to regulate securities markets and protect investors.",key:[{s:"s.11",n:"SEBI's functions and powers over the market"},{s:"s.11B",n:"Power to issue directions and remedial orders"},{s:"s.15A–15J",n:"Civil penalties for disclosure/dealing defaults"}],deals:["acme-qip","jsw-energy-qip","coal-india-ofs"],official:[{l:"SEBI - Acts",u:"https://www.sebi.gov.in/acts.html"}]},
  {t:"SEBI (ICDR) Regulations, 2018",governs:"Primary-market fund-raising: IPOs/FPOs, rights issues, preferential issues and QIPs - eligibility, pricing and disclosure.",key:[{s:"Reg. 5–6",n:"Eligibility and entry norms for a public issue"},{s:"Ch. V, Reg. 158–167",n:"Preferential issue & warrants - pricing formula, 25% upfront, lock-in"},{s:"Ch. VI, Reg. 171–179",n:"Qualified Institutions Placement - QIB-only, floor price, placement document"},{s:"Reg. 164",n:"QIP pricing: 2-week VWAP floor (and permissible discount)"}],amended:"QIP/preferential pricing and disclosure norms have been tightened in recent SEBI amendments - confirm the current pricing window.",deals:["acme-qip","jsw-energy-qip","hfcl-qip","hfcl-pref"],official:[{l:"SEBI - ICDR Regulations",u:"https://www.sebi.gov.in/legal/regulations/sep-2018/securities-and-exchange-board-of-india-issue-of-capital-and-disclosure-requirements-regulations-2018_40328.html"}]},
  {t:"SEBI (LODR) Regulations, 2015",governs:"Continuous obligations of a listed company - governance, disclosure and related-party controls.",key:[{s:"Reg. 17",n:"Board composition and independent directors"},{s:"Reg. 23",n:"Related-party transactions: thresholds, audit-committee & shareholder approval"},{s:"Reg. 29 & 30 (Sch. III)",n:"Prior intimation and disclosure of material events/board meetings"},{s:"Reg. 37",n:"Scheme of arrangement - stock-exchange/SEBI NOC before NCLT"}],amended:"RPT thresholds and the materiality/disclosure framework (Reg. 23 & 30) have been progressively tightened - review the latest circulars.",deals:["pepsico-varun","coforge-cigniti","paytm-elevation"],official:[{l:"SEBI - LODR Regulations",u:"https://www.sebi.gov.in/legal/regulations/sep-2015/securities-and-exchange-board-of-india-listing-obligations-and-disclosure-requirements-regulations-2015_34050.html"}]},
  {t:"SEBI (SAST) Takeover Regulations, 2011",governs:"When acquiring shares/control of a listed company triggers a mandatory open offer to public shareholders.",key:[{s:"Reg. 3",n:"25% voting-rights trigger (and the 5% annual creep limit)"},{s:"Reg. 4",n:"Acquisition of 'control' triggers an offer regardless of %"},{s:"Reg. 7",n:"Minimum open-offer size (26%)"},{s:"Reg. 10",n:"Exemptions (e.g. inter-se promoter, some preferential issues)"}],deals:["hfcl-pref","tata-freight-tiger"],official:[{l:"SEBI - Takeover Regulations",u:"https://www.sebi.gov.in/legal/regulations/sep-2011/sebi-substantial-acquisition-of-shares-and-takeovers-regulations-2011_22979.html"}]},
  {t:"SEBI (PIT) Regulations, 2015",governs:"Prohibition of insider trading and the handling of unpublished price-sensitive information (UPSI).",key:[{s:"Reg. 3",n:"Bar on communicating UPSI except for legitimate purposes"},{s:"Reg. 4",n:"Bar on trading while in possession of UPSI"},{s:"Sch. B/C",n:"Codes of conduct; trading-window closures and contra-trade"}],deals:["paytm-elevation","coal-india-ofs"],official:[{l:"SEBI - PIT Regulations",u:"https://www.sebi.gov.in/legal/regulations/jan-2015/sebi-prohibition-of-insider-trading-regulations-2015_30958.html"}]},
  {t:"SEBI (InvIT) Regulations, 2014",governs:"Infrastructure Investment Trusts - structure, leverage and distribution for monetising operating infra.",key:[{s:"Reg. 20",n:"Leverage cap (≤70% of asset value, with conditions/ratings)"},{s:"Reg. 18",n:"Mandatory distribution of ≥90% of net distributable cash flows"}],deals:["jsa-hdfc-indusinfra"],official:[{l:"SEBI - InvIT Regulations",u:"https://www.sebi.gov.in/legal/regulations/sep-2014/sebi-infrastructure-investment-trusts-regulations-2014_30447.html"}]},
  {t:"SEBI (AIF) Regulations, 2012",governs:"Pooled investment vehicles (PE/VC/hedge) - Categories I, II and III.",key:[{s:"Reg. 10",n:"Placement memorandum and minimum ₹1 cr investor commitment"},{s:"Reg. 15–16",n:"Investment conditions and category-specific limits"}],deals:["embio-truenorth","anveshan-seriesb","paytm-elevation"],official:[{l:"SEBI - AIF Regulations",u:"https://www.sebi.gov.in/legal/regulations/may-2012/sebi-alternative-investment-funds-regulations-2012_22025.html"}]}
 ]},
 {area:"Company Law",intro:"The Companies Act and its rules - the backbone for issuances, approvals, schemes and corporate governance.",items:[
  {t:"Companies Act, 2013",governs:"The principal statute for incorporation, capital, management, related-party dealings and restructuring.",key:[{s:"s.42 + s.62(1)(c)",n:"Private placement / preferential allotment (special resolution, valuation)"},{s:"s.179/180",n:"Board powers; shareholder approval for borrowing & asset sales"},{s:"s.185/186",n:"Loans to directors; inter-corporate loans/investments & limits"},{s:"s.188",n:"Related-party transactions - board/shareholder approval"},{s:"s.230–232",n:"Compromise, arrangement & amalgamation (NCLT scheme)"},{s:"s.233",n:"Fast-track merger (small/holding-subsidiary)"},{s:"s.77",n:"Creation & registration of charges (CHG-1)"}],amended:"Successive Companies (Amendment) Acts have decriminalised many defaults and eased CSR/board procedure - check the current section text.",deals:["coforge-cigniti","hfcl-pref","acme-qip","embio-truenorth"],official:[{l:"MCA - Companies Act, 2013",u:"https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks/acts.html"},{l:"India Code",u:"https://www.indiacode.nic.in/handle/123456789/2114"}]},
  {t:"Companies (Compromises, Arrangements and Amalgamations) Rules, 2016",governs:"Procedure for NCLT-sanctioned schemes - meetings, notices, objections and sanction.",key:[{s:"Rule 3–6",n:"Application, convening of meetings and notice of the scheme"},{s:"Rule 15–17",n:"Petition for sanction and filing of the order"}],deals:["coforge-cigniti"],official:[{l:"MCA - Rules",u:"https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks/rules.html"}]},
  {t:"Companies (Prospectus & Allotment of Securities) Rules, 2014",governs:"Mechanics of private placement and return of allotment.",key:[{s:"Rule 13",n:"Preferential allotment - valuation and explanatory statement"},{s:"Rule 14 + PAS-3",n:"Private-placement offer letter and return of allotment"}],deals:["hfcl-pref","acme-qip"],official:[{l:"MCA - Rules",u:"https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks/rules.html"}]}
 ]},
 {area:"Competition",intro:"Merger control and conduct rules - increasingly central to deal timing after the 2023 amendments.",items:[
  {t:"Competition Act, 2002",governs:"Anti-competitive agreements, abuse of dominance and merger control (combinations).",key:[{s:"s.3",n:"Anti-competitive agreements (incl. s.3(4) vertical/exclusive arrangements)"},{s:"s.4",n:"Abuse of dominant position"},{s:"s.5 & 6",n:"Combination thresholds and the bar on consummation before approval"},{s:"s.6A",n:"Deal-Value Threshold - NEW: catches large-value deals with substantial India ops"},{s:"s.31",n:"CCI order on a combination (approve/modify/reject)"}],amended:"Competition (Amendment) Act, 2023 - introduced the ₹2,000 cr deal-value threshold (s.6A), settlement & commitment mechanism, and a shorter review timeline. Major change for tech/M&A.",deals:["hcl-foxconn","tata-freight-tiger","coforge-cigniti","pepsico-varun"],official:[{l:"CCI - Act & Rules",u:"https://www.cci.gov.in/legal-framework/act"}]},
  {t:"CCI (Combination) Regulations, 2024",governs:"Procedure and forms for notifying mergers/acquisitions, including the green-channel route.",key:[{s:"Green channel",n:"Automatic deemed-approval where there is no horizontal/vertical/complementary overlap"},{s:"Form I / Form II",n:"Short-form vs long-form notification"}],deals:["hcl-foxconn","tata-freight-tiger"],official:[{l:"CCI - Combination Regulations",u:"https://www.cci.gov.in/combination/regulations"}]}
 ]},
 {area:"Foreign Investment & Exchange Control",intro:"FEMA and the FDI regime - entry routes, sectoral caps, pricing, and the China-border approval rule.",items:[
  {t:"Foreign Exchange Management Act, 1999",governs:"All cross-border capital and current-account transactions; the parent statute for FDI/ODI.",key:[{s:"s.6",n:"Capital-account transactions - basis for the NDI/OI rules"},{s:"s.13",n:"Penalties and compounding for contraventions"}],deals:["hcl-foxconn","pagani-residency","jsw-energy-qip"],official:[{l:"RBI - FEMA",u:"https://www.rbi.org.in/Scripts/BS_FemaNotifications.aspx"}]},
  {t:"FEM (Non-Debt Instruments) Rules, 2019",governs:"Inbound FDI into equity instruments - routes, sectoral caps, pricing and downstream investment.",key:[{s:"Schedule I",n:"Permissible FDI in equity; automatic vs approval route"},{s:"Pricing guidelines",n:"Floor for issue/transfer to/from non-residents (internationally accepted methodology)"},{s:"Downstream rules",n:"Indirect foreign investment via Indian holding companies"}],amended:"Sectoral caps and conditions are updated through the consolidated FDI Policy and periodic notifications.",deals:["hcl-foxconn","embio-truenorth","anveshan-seriesb"],official:[{l:"DPIIT - FDI Policy",u:"https://dpiit.gov.in/foreign-direct-investment/foreign-direct-investment-policy"},{l:"RBI - NDI Rules",u:"https://www.rbi.org.in/Scripts/BS_FemaNotifications.aspx"}]},
  {t:"Press Note 3 of 2020 (DPIIT)",governs:"Prior Government approval for FDI from countries sharing a land border with India (incl. China).",key:[{s:"Para 3.1.1(a)",n:"Approval route for land-border investors; beneficial-ownership test"}],amended:"A live diligence item on any deal with Chinese/HK-linked capital - e.g. Foxconn-linked structures.",deals:["hcl-foxconn"],official:[{l:"DPIIT - Press Notes",u:"https://dpiit.gov.in/whats-new"}]},
  {t:"FEM (Overseas Investment) Rules & Regulations, 2022",governs:"Outbound investment by residents - ODI, OPI and the Liberalised Remittance Scheme (LRS).",key:[{s:"OI Rules 2022",n:"Overhauled ODI/OPI framework (replaced the 2004 regime)"},{s:"LRS",n:"Per-individual annual remittance limit for resident individuals"},{s:"Round-tripping",n:"Now permitted within limits, subject to conditions"}],amended:"The 2022 overhaul consolidated and liberalised outbound investment - a recent, frequently-tested change.",deals:["pagani-residency"],official:[{l:"RBI - Overseas Investment",u:"https://www.rbi.org.in/Scripts/BS_FemaNotifications.aspx"}]},
  {t:"External Commercial Borrowings (ECB) Framework",governs:"Foreign-currency/INR borrowing by eligible Indian entities from recognised lenders.",key:[{s:"Master Direction – ECB",n:"Eligible borrowers/lenders, all-in-cost ceiling, end-use restrictions, hedging"}],deals:["jsa-hdfc-indusinfra","irfc-hyd-metro"],official:[{l:"RBI - ECB Master Direction",u:"https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx"}]}
 ]},
 {area:"Insolvency & Restructuring",intro:"The IBC and enforcement statutes governing distressed companies and creditor recovery.",items:[
  {t:"Insolvency and Bankruptcy Code, 2016",governs:"Time-bound corporate insolvency resolution and liquidation.",key:[{s:"s.7 / s.9 / s.10",n:"Initiation by financial creditor / operational creditor / corporate applicant"},{s:"s.12A",n:"Withdrawal of admitted application (90% CoC approval)"},{s:"s.29A",n:"Persons ineligible to submit a resolution plan"},{s:"s.31",n:"Approval of resolution plan (binding on all stakeholders)"},{s:"s.53",n:"Liquidation waterfall / priority of claims"},{s:"s.54A",n:"Pre-packaged insolvency for MSMEs (2021 amendment)"}],amended:"The 2021 amendment introduced pre-packs (s.54A); the framework continues to evolve via IBBI regulations.",deals:[],official:[{l:"IBBI - Legal framework",u:"https://ibbi.gov.in/legal-framework"}]},
  {t:"SARFAESI Act, 2002",governs:"Secured-creditor enforcement without court intervention; asset reconstruction.",key:[{s:"s.13(2)/(4)",n:"Demand notice and enforcement of security interest"},{s:"s.17",n:"Borrower's appeal to the DRT"}],deals:["jsa-hdfc-indusinfra"],official:[{l:"India Code - SARFAESI",u:"https://www.indiacode.nic.in/handle/123456789/2006"}]}
 ]},
 {area:"Banking & Finance",intro:"RBI norms shaping lending documentation, provisioning and project finance.",items:[
  {t:"RBI (Project Finance) Directions, 2025",governs:"Standardised provisioning and credit discipline for project loans (infra and non-infra).",key:[{s:"Standard-asset provisioning",n:"1% during construction (eased from the 2.5% draft); steps up with DCCO deferment"},{s:"DCCO norms",n:"Date of Commencement of Commercial Operations - deferment and resolution"}],amended:"Effective 1 October 2025 - re-paper facility/covenant terms for project financings.",deals:["irfc-hyd-metro","jsa-hdfc-indusinfra"],official:[{l:"RBI - Master Directions",u:"https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx"}]},
  {t:"Banking Regulation Act, 1949",governs:"Licensing and prudential regulation of banks; RBI's supervisory powers.",key:[{s:"s.21/35A",n:"RBI power to issue directions to banking companies"}],deals:["jsa-hdfc-indusinfra"],official:[{l:"RBI - Acts",u:"https://www.rbi.org.in/Scripts/OccasionalPublications.aspx"}]}
 ]},
 {area:"Taxation & Stamp",intro:"The tax and stamp-duty rules that drive deal structuring.",items:[
  {t:"Income-tax Act, 1961 (M&A provisions)",governs:"Tax treatment of mergers, demergers, share transfers and capital gains.",key:[{s:"s.2(1B) / s.2(19AA)",n:"Conditions for a tax-neutral amalgamation / demerger"},{s:"s.47 & s.72A",n:"Exempt transfers; carry-forward of accumulated losses on amalgamation"},{s:"s.50CA / s.56(2)(x)",n:"Fair-market-value floor on transfer of unlisted shares; deemed income on under-value receipt"},{s:"s.56(2)(viib)",n:"'Angel tax' on share premium - ABOLISHED from AY 2025-26"},{s:"s.112A",n:"10%/12.5% LTCG on listed equity (with STT)"},{s:"Ch. X-A",n:"General Anti-Avoidance Rules (GAAR)"}],amended:"Angel tax (s.56(2)(viib)) abolished w.e.f. AY 2025-26 - a major change for priced equity rounds.",deals:["coforge-cigniti","tata-freight-tiger","embio-truenorth","paytm-elevation"],official:[{l:"Income Tax Dept - the Act",u:"https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx"}]},
  {t:"Indian Stamp Act, 1899 (2019/2020 securities amendment)",governs:"Stamp duty on instruments, including a uniform regime for securities.",key:[{s:"2019 amendment (eff. 1 Jul 2020)",n:"Uniform, centrally-collected stamp duty on issue/transfer of securities via depositories/exchanges"}],amended:"The uniform securities-stamp regime is a relatively recent, frequently-overlooked change.",deals:["acme-qip","jsw-energy-qip","hfcl-pref","tata-freight-tiger"],official:[{l:"India Code - Indian Stamp Act",u:"https://www.indiacode.nic.in/handle/123456789/2384"}]}
 ]},
 {area:"Data, IP & Technology",intro:"The fast-moving data-protection, IP and technology statutes.",items:[
  {t:"Digital Personal Data Protection Act, 2023 + Rules, 2025",governs:"Processing of digital personal data - consent, security, breach and cross-border transfer.",key:[{s:"Consent & notice",n:"Consent-based processing with itemised notice; consent managers"},{s:"Breach notification",n:"Notify the Data Protection Board and affected principals"},{s:"SDFs",n:"Significant Data Fiduciaries - DPIA, audit and DPO obligations"}],amended:"Rules notified 13 Nov 2025; phased - consent-manager registration by Nov 2026, core obligations by May 2027.",deals:["hcl-foxconn"],official:[{l:"MeitY - Data Protection",u:"https://www.meity.gov.in/data-protection-framework"}]},
  {t:"Trade Marks Act, 1999",governs:"Registration, licensing and protection of trade marks.",key:[{s:"s.48–49",n:"Registered/permitted user - licensing of marks"},{s:"s.29",n:"Infringement; s.27 passing off"}],deals:["pepsico-varun"],official:[{l:"IP India",u:"https://ipindia.gov.in/trade-marks.htm"}]},
  {t:"Information Technology Act, 2000",governs:"Electronic records, intermediary liability and cyber-contraventions.",key:[{s:"s.43A / s.72A",n:"Compensation/penalty for data mishandling (being subsumed by DPDP)"},{s:"s.79",n:"Intermediary safe-harbour and due diligence"}],deals:[],official:[{l:"MeitY - IT Act",u:"https://www.meity.gov.in/content/information-technology-act-2000"}]}
 ]},
 {area:"Sector & Cross-cutting",intro:"Sector statutes and the contract/dispute backbone every deal relies on.",items:[
  {t:"Telecommunications Act, 2023",governs:"Authorisations for telecom networks/services; replaces the Indian Telegraph Act, 1885.",key:[{s:"Authorisation regime",n:"Replaces licensing; spectrum assignment and management"},{s:"Transition",n:"Read alongside legacy Telegraph Act jurisprudence (e.g. retrospective-levy rulings)"}],amended:"New statute (2023) - a recent, significant overhaul of the telecom legal framework.",deals:["airtel-spectrum"],official:[{l:"DoT - Telecom Act",u:"https://dot.gov.in/relatedlinks/telecommunications-act-2023"}]},
  {t:"Indian Contract Act, 1872 + Specific Relief (Amendment) Act, 2018",governs:"Formation and enforcement of commercial contracts (SPAs, SHAs, facility agreements).",key:[{s:"s.10/s.73",n:"Valid contracts; damages for breach"},{s:"Specific Relief (Amdt) 2018",n:"Specific performance now the rule, not the exception - strengthens deal certainty"}],amended:"The 2018 amendment shifted specific performance from discretionary to a default remedy - material for deal documentation.",deals:["tata-freight-tiger","pepsico-varun"],official:[{l:"India Code - Contract Act",u:"https://www.indiacode.nic.in/handle/123456789/2187"}]},
  {t:"Arbitration and Conciliation Act, 1996",governs:"Domestic and international commercial arbitration and enforcement of awards.",key:[{s:"s.9 / s.17",n:"Interim measures by court / tribunal"},{s:"s.34",n:"Limited grounds to set aside an award"},{s:"s.36",n:"Enforcement; automatic stay removed by the 2015/2021 amendments"}],amended:"Amended in 2015, 2019 and 2021 - timelines, interim relief and the stay-on-enforcement regime changed materially.",deals:[],official:[{l:"India Code - Arbitration Act",u:"https://www.indiacode.nic.in/handle/123456789/1978"}]}
 ]}
];

