/* ============================ DEAL STRUCTURE & KEY TERMS ============================
   The "precedent" layer: how the deal was actually done — consideration, conditions, approvals,
   what was novel — plus the deal-SPECIFIC regulatory triggers (why THIS deal needed THESE laws).
   'status' = Confirmed (from primary disclosure) or Partly inferred. 'reviewed' = editorial sign-off. */
const STRUCT={
 "acme-qip":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"₹2,800 cr QIP; ~10.02 crore equity shares allotted at ₹279.50 (within the permissible discount to the floor).",
  conditions:["Special resolution under s.62(1)(c) / Ch. VI ICDR","In-principle stock-exchange approval (LODR Reg. 28)","Placement document and QIB allotment within 365 days of the resolution"],
  approvals:["Board / pricing committee","Shareholders (special resolution)","Stock-exchange in-principle approval"],
  novel:"First equity raise since the 2024 listing; deleveraging-led use of proceeds; marquee anchor book (ADIA, BlackRock, Goldman, SBI MF).",
  triggers:[{law:"sebi-icdr-regulations-2018",note:"QIP under Ch. VI — floor at 2-week VWAP, ≤5% discount with shareholder nod."},{law:"indian-stamp-act-1899-2019-2020-securities-amendment",note:"Uniform securities stamp duty collected at issue."},{law:"sebi-pit-regulations-2015",note:"Trading-window discipline around the raise."}]},
 "jsw-energy-qip":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"₹4,000 cr QIP; 7.62 crore shares at ₹525; SBI Equity Hybrid Fund and GQG together absorbed ~72.55%.",
  conditions:["Special resolution (ICDR Ch. VI)","In-principle exchange approval","Placement document; allotment within 365 days"],
  approvals:["Board / pricing committee","Shareholders","Stock exchanges"],
  novel:"Second equity raise since 2010; concentrated anchor conviction in the 30 GW-by-2030 build-out; proceeds deleverage and fund JSW Neo.",
  triggers:[{law:"sebi-icdr-regulations-2018",note:"QIP pricing and placement-document regime."},{law:"indian-stamp-act-1899-2019-2020-securities-amendment",note:"Securities stamp duty on issue."}]},
 "coal-india-ofs":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"Offer for sale of ~12.33 crore shares (2%: 1% base + 1% green-shoe) at a ₹412 floor, aggregating ~₹5,549 cr; non-retail ~4x subscribed.",
  conditions:["OFS notice to exchanges (T-1)","Floor price fixed by the seller","Separate non-retail / retail windows"],
  approvals:["DIPAM / Government of India (seller)","Stock-exchange OFS mechanism"],
  novel:"Promoter holding cut from 63.13% to 61.13%; part of the FY27 ₹80,000 cr disinvestment pipeline; OFS-via-exchange as the clean government-exit route.",
  triggers:[{law:"sebi-lodr-regulations-2015",note:"Reg. 30 disclosure of the OFS."},{law:"sebi-pit-regulations-2015",note:"Seller trading-window and UPSI controls."},{law:"income-tax-act-1961-m-a-provisions",note:"s.112A LTCG + STT on the listed-share sale."}]},
 "tata-freight-tiger":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"Secondary purchase of shares from Lightspeed India, Florintree Infra and founder Swapnil Shah for ₹95.66 cr, taking Tata Motors to ~63%.",
  conditions:["Share-purchase/SPA execution","Board and shareholder authorisations","Founder-exit and SHA waterfall mechanics"],
  approvals:["Boards of acquirer/target","Selling-shareholder consents"],
  novel:"Stake-creep to control of an UNLISTED target — structured to avoid an open offer; the SHA drag/tag and founder-exit terms are the live points.",
  triggers:[{law:"companies-act-2013",note:"s.56 share transfer; board/SH approvals."},{law:"income-tax-act-1961-m-a-provisions",note:"s.50CA / s.56(2)(x) FMV floor on unlisted-share transfer."},{law:"indian-contract-act-1872-specific-relief-amendment-act-2018",note:"SPA/SHA enforceability; specific performance now the default remedy."}]},
 "hcl-foxconn":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"50:50-style JV (India Chip Private Limited); ₹3,706 cr OSAT plant at YEIDA, Uttar Pradesh; Foxconn ~40% (≈₹312 cr).",
  conditions:["Joint-venture agreement + technology-licence agreement","India Semiconductor Mission fiscal-support agreement","Foreign-investment approval (land-border route)"],
  approvals:["India Semiconductor Mission / MeitY","FDI Government route (Press Note 3)","CCI (if combination thresholds met)"],
  novel:"JV-plus-tech-licence structure under the ISM; the Foxconn (China-linked) investor puts Press Note 3 and IP-licensing carve-outs at the centre.",
  triggers:[{law:"press-note-3-of-2020-dpiit",note:"Land-border FDI approval for the Foxconn-linked investment."},{law:"competition-act-2002",note:"Combination notification; the new s.6A deal-value threshold may apply."},{law:"companies-act-2013",note:"s.186 JV / inter-corporate investment; JV governance."}]},
 "coforge-cigniti":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"Scheme of amalgamation, 1:1 share-exchange; NCLT Chandigarh sanction 29 Apr 2026; effective 5 May 2026; appointed date 1 Apr 2025; 99.95% Cigniti shareholder approval.",
  conditions:["SEBI / stock-exchange NOC (LODR Reg. 37) before NCLT filing","Shareholder and creditor meetings","NCLT sanction and filing of the order with the ROC"],
  approvals:["NCLT, Chandigarh","SEBI / stock exchanges","Shareholders and creditors"],
  novel:"Absorption via a court scheme (not a share purchase) — tax-neutral amalgamation creating a ~$2.5 bn AI-native engineering entity; a clean listed-target-merger precedent.",
  triggers:[{law:"companies-act-2013",note:"s.230–232 scheme; NCLT process."},{law:"income-tax-act-1961-m-a-provisions",note:"s.2(1B) tax-neutral amalgamation + s.72A loss carry-forward."},{law:"sebi-lodr-regulations-2015",note:"Reg. 37 NOC for a listed-company scheme."}]},
 "paytm-elevation":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"On-market block sale of One97 (Paytm) shares by Elevation Capital V on the NSE/BSE for ₹963.6 cr (22 May 2026).",
  conditions:["Open trading window (no UPSI)","Block/bulk-deal window mechanics","Disclosure on crossing 5%/2% change thresholds"],
  approvals:["No corporate approval (secondary sale); fund-level authorisations"],
  novel:"A 2014-vintage VC monetising via an on-market block — a clean read on fund DPI timing and large block-sale mechanics in listed new-age companies.",
  triggers:[{law:"sebi-pit-regulations-2015",note:"Window/UPSI/contra-trade for the selling insider."},{law:"sebi-sast-takeover-regulations-2011",note:"Reg. 29 disclosure on the change in holding."},{law:"income-tax-act-1961-m-a-provisions",note:"s.112A LTCG + STT."}]},
 "irfc-hyd-metro":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"₹13,527 cr term loan to L&T Metro Rail (Hyderabad), 20-year tenure, quarterly repayments; refinances existing NCDs, CPs and term loans.",
  conditions:["Credit-enhancement package (Telangana State guarantee; RBI direct-debit mandate)","Creation and registration of security/charge","Project-finance covenant suite"],
  approvals:["IRFC board / credit committee","Government of Telangana (guarantee)"],
  novel:"A replicable credit-enhancement template for monetising operating metro/DBFOT assets; IRFC stepping beyond railways into urban-transit refinancing.",
  triggers:[{law:"rbi-project-finance-directions-2025",note:"Provisioning/DCCO discipline for the refinancing."},{law:"companies-act-2013",note:"s.77 registration of charge within 30 days."},{law:"sarfaesi-act-2002",note:"Secured-creditor enforcement on default."}]},
 "jsa-hdfc-indusinfra":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"₹1,940 cr facility from HDFC Bank to Indus Infra Trust (road InvIT backed by GR Infra) to refinance debt of newly acquired SPVs.",
  conditions:["InvIT leverage-cap headroom (SEBI InvIT Reg. 20)","Security creation over SPV assets","Inter-creditor arrangements"],
  approvals:["Lender credit committee","InvIT investment manager / unitholders (as needed)"],
  novel:"InvIT-level leverage used to recycle capital and refinance acquisition debt — the SEBI leverage cap is the binding constraint.",
  triggers:[{law:"sebi-invit-regulations-2014",note:"Reg. 20 leverage cap on the InvIT financing."},{law:"rbi-project-finance-directions-2025",note:"Provisioning norms for the lender."},{law:"companies-act-2013",note:"Charge creation/registration."}]},
 "pepsico-varun":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"Revised Exclusive Bottling Appointment + Trademark Licence; rights extended to 30 April 2049; Varun's single-brand exclusivity restriction removed.",
  conditions:["Execution of the revised agreement and related documents","Listed-company disclosure (Varun)"],
  approvals:["Boards of PepsiCo India / Varun Beverages"],
  novel:"The removal of Varun's exclusivity is the real story — it frees Varun's M&A optionality and is the competition-sensitive vertical term to watch.",
  triggers:[{law:"trade-marks-act-1999",note:"s.48–49 permitted/registered-user licensing of the marks."},{law:"competition-act-2002",note:"s.3(4) vertical/exclusive-arrangement analysis (exclusivity removed)."},{law:"sebi-lodr-regulations-2015",note:"Reg. 30 disclosure of the material agreement."}]},
 "hfcl-pref":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"Preferential issue of 7.5 crore warrants aggregating ₹555 cr to the promoter group (25% upfront, 18-month exercise).",
  conditions:["Special resolution and registered-valuer pricing","Warrant lock-in","SAST creep/exemption analysis"],
  approvals:["Shareholders (special resolution)"],
  novel:"Promoter capital infusion via warrants — the SAST creeping-acquisition limit and ICDR warrant mechanics are the gating points.",
  triggers:[{law:"sebi-icdr-regulations-2018",note:"Reg. 158–167 preferential issue & warrants."},{law:"sebi-sast-takeover-regulations-2011",note:"Promoter allotment vs the 5% creep / open-offer exemption."},{law:"companies-act-2013",note:"s.62(1)(c) preferential allotment."}]},
 "hfcl-qip":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"QIP aggregating ₹550 cr.",
  conditions:["Special resolution (ICDR Ch. VI)","Exchange in-principle approval","Placement document"],
  approvals:["Board / shareholders / exchanges"],
  novel:"Paired with the promoter preferential issue — a QIP-plus-promoter-warrant balance-sheet-strengthening combination.",
  triggers:[{law:"sebi-icdr-regulations-2018",note:"QIP regime."},{law:"indian-stamp-act-1899-2019-2020-securities-amendment",note:"Securities stamp duty."}]},
 "embio-truenorth":{reviewed:"CorpTracker Editorial",status:"Partly inferred",
  consideration:"Minority equity investment by True North into Embio Limited (complex high-value APIs / CDMO).",
  conditions:["Multi-practice diligence (pharma licences, IP, CCI, real estate, employment)","SHA / SPA","Regulatory-licence transferability checks"],
  approvals:["Boards; CCI (if thresholds met)"],
  novel:"Illustrates the diligence load for controlled-substance API targets — licence transferability is the gating item.",
  triggers:[{law:"companies-act-2013",note:"s.62(1)(c) preferential allotment of CCPS/equity."},{law:"competition-act-2002",note:"Combination test if thresholds met."},{law:"income-tax-act-1961-m-a-provisions",note:"FMV on any unlisted-share transfer."}]},
 "anveshan-seriesb":{reviewed:"CorpTracker Editorial",status:"Partly inferred",
  consideration:"₹150 cr Series B led by Vertex Ventures and IFC Co-Invest, with founder-angel participation (Sriharsha Majety).",
  conditions:["SHA with DFI covenants (E&S, governance, anti-corruption)","FEMA pricing for the IFC (foreign) tranche"],
  approvals:["Board; investor consents"],
  novel:"IFC's DFI covenants materially reshape the SHA beyond a vanilla priced round.",
  triggers:[{law:"companies-act-2013",note:"s.62(1)(c) preferential allotment."},{law:"fem-non-debt-instruments-rules-2019",note:"FDI route and pricing for the IFC investment."},{law:"income-tax-act-1961-m-a-provisions",note:"Angel tax (s.56(2)(viib)) abolished from AY 2025-26 — no longer a constraint."}]},
 "pagani-residency":{reviewed:"CorpTracker Editorial",status:"Partly inferred",
  consideration:"$35 mn India/Middle-East residency-investment programme channelling Indian outbound investment into Portugal.",
  conditions:["Structuring under FEMA outbound rules","Investor onboarding / KYC / source-of-funds","Transaction documentation and governance"],
  approvals:["Programme regulatory framework; RBI route as applicable"],
  novel:"Cross-border outbound structure — LRS/ODI limits and the AIF-adjacent marketing perimeter are the live issues.",
  triggers:[{law:"fem-overseas-investment-rules-regulations-2022",note:"ODI/OPI + LRS for resident participation."},{law:"income-tax-act-1961-m-a-provisions",note:"TCS on LRS remittances; Schedule FA foreign-asset reporting."}]},
 "airtel-spectrum":{reviewed:"CorpTracker Editorial",status:"Confirmed",
  consideration:"Writ outcome (not a transaction): retrospective one-time spectrum-charge demand quashed; bank guarantees ordered returned.",
  conditions:["—"],
  approvals:["—"],
  novel:"Holds the State cannot retrospectively re-price licences under s.4 Telegraph Act — authority against retrospective regulatory charges.",
  triggers:[{law:"telecommunications-act-2023",note:"Read with the new authorisation regime replacing the Telegraph Act."},{law:"indian-contract-act-1872-specific-relief-amendment-act-2018",note:"Licence-as-contract; legitimate expectation; no unilateral variation."}]}
};
function structOf(d){return STRUCT[d.id]||d.structure||null;}
function reviewedBy(d){const s=structOf(d);return (s&&s.reviewed)||d.reviewed||null;}

/* ============================ LEADING CASES (Library) ============================
   Landmark judgments per statute, with a one-line holding. Keyed by law id. */
const CASES={
 "insolvency-and-bankruptcy-code-2016":[
  {name:"Swiss Ribbons v. Union of India",cite:"(2019) 4 SCC 17",held:"Upheld the IBC's constitutional validity and the financial/operational-creditor distinction; affirmed the CoC's central role."},
  {name:"CoC of Essar Steel v. Satish Kumar Gupta",cite:"(2020) 8 SCC 531",held:"Primacy of the CoC's commercial wisdom in distribution; equitable (not equal) treatment of creditors; narrow judicial review of plans."},
  {name:"ArcelorMittal India v. Satish Kumar Gupta",cite:"(2019) 2 SCC 1",held:"Construed s.29A ineligibility and 'connected persons', and the cure-by-payment window before plan approval."}],
 "sebi-sast-takeover-regulations-2011":[
  {name:"SEBI v. Subhkam Ventures",cite:"SAT, 2010 (SC left the question open)",held:"Protective/affirmative investor rights are ordinarily NOT 'control' under the Takeover Code — the leading authority on the control debate."}],
 "companies-act-2013":[
  {name:"Miheer H. Mafatlal v. Mafatlal Industries",cite:"(1997) 1 SCC 579",held:"The court's role in sanctioning a scheme is supervisory, not appellate — the scheme must be fair, lawful and carried by the requisite majority."}],
 "competition-act-2002":[
  {name:"Excel Crop Care v. CCI",cite:"(2017) 8 SCC 47",held:"Penalty under s.27 is computed on 'relevant turnover' (the affected product/segment), not total turnover — proportionality in cartel penalties."},
  {name:"CCI v. Coordination Committee of Artists",cite:"(2017) 5 SCC 17",held:"Clarified the relevant-market and effects analysis for anti-competitive conduct under s.3."}],
 "arbitration-and-conciliation-act-1996":[
  {name:"BALCO v. Kaiser Aluminium",cite:"(2012) 9 SCC 552",held:"Part I does not apply to foreign-seated arbitrations; the 'seat' fixes the supervisory court — foundational for cross-border deal clauses."},
  {name:"Vidya Drolia v. Durga Trading",cite:"(2021) 2 SCC 1",held:"Laid down the fourfold non-arbitrability test and the limited scope of court interference at the reference stage."}],
 "income-tax-act-1961-m-a-provisions":[
  {name:"Vodafone International Holdings v. Union of India",cite:"(2012) 6 SCC 613",held:"Offshore indirect transfer of Indian assets was not taxable on the then law — triggered the (later withdrawn) retrospective amendment; central to cross-border structuring."},
  {name:"Union of India v. Azadi Bachao Andolan",cite:"(2004) 10 SCC 1",held:"Upheld India–Mauritius treaty benefits/treaty-shopping — the backdrop to GAAR and the substance requirement."}],
 "sebi-pit-regulations-2015":[
  {name:"Hindustan Lever Ltd v. SEBI",cite:"Landmark insider-trading order (1998)",held:"Foundational insider-trading case (HLL's purchase of BBLIL shares ahead of the merger) shaping the UPSI/insider analysis."}],
 "telecommunications-act-2023":[
  {name:"Bharti Airtel, Vodafone Idea v. Union of India",cite:"Bombay HC, 8 Jun 2026 (tracked here)",held:"The State cannot retrospectively re-price telecom licences under s.4 of the Telegraph Act; demand notices quashed."}]
};
function casesFor(id){return CASES[id]||[];}

/* Lateral moves & GC appointments — from Bar & Bench Corporate & In-House. */
/* MOVES-START — auto-extended nightly by the engine; new items inserted on top. */
const MOVES=(window.CLT_DATA&&window.CLT_DATA.MOVES)||[];
/* MOVES-END */

/* ============================ LEGAL FRAMEWORK ============================
   Per-deal checklist of the statutes, regulations and SPECIFIC sections a transactional
   lawyer must run through. flag: "central" = core to this deal; "amended" = recently
   changed, review the current text. Reusable blocks below are composed per deal id. */
const FW={
 qip:[
  {ref:"SEBI (ICDR) Regulations, 2018 — Reg. 171–179 (Ch. VI)",note:"Governs the QIP end-to-end: QIB eligibility, the floor-price formula, placement document and allotment.",flag:"central"},
  {ref:"Companies Act, 2013 — s.42 r/w PAS Rules, 2014",note:"Private-placement procedure, special resolution and return of allotment (PAS-3).",flag:""},
  {ref:"SEBI (LODR) Regulations, 2015 — Reg. 28, 29, 30",note:"In-principle listing approval, prior board-meeting intimation and disclosure of the fund-raising.",flag:""},
  {ref:"SCRR, 1957 — Rule 19(2)(b) / 19A",note:"Minimum public shareholding must be maintained through the dilution.",flag:""},
  {ref:"FEMA (Non-Debt Instruments) Rules, 2019 + SEBI (FPI) Regs, 2019",note:"FPI participation, sectoral caps and pricing for non-resident allottees.",flag:""},
  {ref:"Indian Stamp Act, 1899 (2019 amendment)",note:"Uniform stamp duty on issue of securities, collected through the depository.",flag:"amended"},
  {ref:"SEBI (PIT) Regulations, 2015",note:"Trading-window closure and UPSI controls around the raise.",flag:""}],
 pref:[
  {ref:"SEBI (ICDR) Regulations, 2018 — Reg. 158–167",note:"Preferential issue & warrants: pricing, 25% upfront money, 18-month exercise and lock-in.",flag:"central"},
  {ref:"Companies Act, 2013 — s.62(1)(c) r/w Rule 13, PAS Rules",note:"Special resolution and registered-valuer pricing for the preferential allotment.",flag:""},
  {ref:"SEBI (SAST) Regulations, 2011 — Reg. 3/4 & exemption Reg. 10",note:"Promoter allotment can cross creeping-acquisition limits; check open-offer exemption.",flag:"central"},
  {ref:"SEBI (LODR) Regulations, 2015 — Reg. 30",note:"Disclosure of the preferential issue as a material event.",flag:""},
  {ref:"Indian Stamp Act, 1899 (2019 amendment)",note:"Stamp duty on issue of warrants and resultant shares.",flag:"amended"}],
 ofs:[
  {ref:"SEBI Master Circular — OFS through Stock Exchange Mechanism",note:"The framework for a promoter/PSU sale via the exchange OFS window (floor price, T+1, allocation).",flag:"central"},
  {ref:"SCRR, 1957 — Rule 19A",note:"Minimum public shareholding for listed PSUs — the disinvestment driver.",flag:"central"},
  {ref:"DIPAM disinvestment guidelines",note:"Process, pricing and approvals for Government stake sales.",flag:""},
  {ref:"SEBI (PIT) Regulations, 2015",note:"Trading window and UPSI for the selling shareholder.",flag:""},
  {ref:"SEBI (LODR) Regulations, 2015 — Reg. 30",note:"Disclosure of the offer for sale.",flag:""}],
 scheme:[
  {ref:"Companies Act, 2013 — s.230–232",note:"Scheme of arrangement/amalgamation; NCLT-convened meetings and sanction.",flag:"central"},
  {ref:"Income-tax Act, 1961 — s.2(1B) & s.72A",note:"Tax-neutral amalgamation and carry-forward/ set-off of accumulated losses.",flag:"central"},
  {ref:"SEBI (LODR) Reg. 37 + SEBI Scheme Master Circular",note:"Stock-exchange/SEBI NOC before a listed-company scheme; NCLT filing.",flag:"central"},
  {ref:"Companies (CAA) Rules, 2016",note:"Procedural rules for compromises, arrangements and amalgamations.",flag:""},
  {ref:"Competition Act, 2002 — s.5/6",note:"Combination notification if asset/turnover or deal-value thresholds are met.",flag:""},
  {ref:"SEBI (PIT) Regulations, 2015",note:"UPSI control through the scheme process.",flag:""}],
 maUnlisted:[
  {ref:"Companies Act, 2013 — s.56 (transfer) & board/SH approvals",note:"Share-transfer mechanics and authorisations for acquiring control of the unlisted target.",flag:"central"},
  {ref:"SPA/SHA — Contract Act, 1872 + Specific Relief (Amendment) Act, 2018",note:"Specific performance is now the rule, not the exception — affects deal certainty and remedies.",flag:"amended"},
  {ref:"Competition Act, 2002 — s.5/6 + Competition (Amendment) Act, 2023 (s.6A deal-value threshold)",note:"New DVT can catch tech deals below the old asset/turnover tests.",flag:"amended"},
  {ref:"Income-tax Act — s.50CA & s.56(2)(x)",note:"FMV floor on transfer of unlisted shares for both seller and buyer.",flag:"central"},
  {ref:"FEMA (NDI) Rules, 2019 + pricing guidelines",note:"Applies to any non-resident seller (e.g., offshore VC) and downstream-investment tests.",flag:""},
  {ref:"Indian Stamp Act, 1899",note:"Stamp duty on the share-transfer instrument.",flag:""}],
 block:[
  {ref:"SEBI Master Circular — Block / Bulk Deal window",note:"Mechanism, price band and disclosure for a large on-market sale of listed shares.",flag:"central"},
  {ref:"SEBI (PIT) Regulations, 2015",note:"Trading window, UPSI and contra-trade restrictions for the selling investor.",flag:"central"},
  {ref:"SEBI (SAST) Regulations, 2011 — Reg. 29",note:"Disclosure on crossing/again falling below 5% and material change thresholds.",flag:""},
  {ref:"Income-tax Act — s.112A + STT",note:"LTCG on listed equity and securities-transaction-tax treatment of the sale.",flag:""},
  {ref:"SEBI (AIF) Regs, 2012 / FEMA",note:"Fund-level structuring and repatriation for the selling investor.",flag:""}],
 pe:[
  {ref:"Companies Act, 2013 — s.62(1)(c) & s.42",note:"Preferential allotment of equity/CCPS to the investor; valuation and special resolution.",flag:"central"},
  {ref:"FEMA (NDI) Rules, 2019 + pricing guidelines",note:"FDI route, entry pricing and downstream-investment rules for any foreign investor (e.g., IFC).",flag:"central"},
  {ref:"Shareholders' agreement — Companies Act s.58/59",note:"Enforceability of transfer restrictions, ROFR/ROFO, drag/tag against free-transferability.",flag:""},
  {ref:"Income-tax Act — s.56(2)(viib) ('angel tax')",note:"Abolished w.e.f. AY 2025-26 — premium pricing no longer taxed; confirm for the round's date.",flag:"amended"},
  {ref:"SEBI (AIF) Regulations, 2012",note:"Investor-side compliance for domestic AIFs.",flag:""},
  {ref:"Competition Act, 2002 — s.5/6",note:"Notification if thresholds met (less common at minority growth stage).",flag:""}],
 fin:[
  {ref:"RBI (Project Finance) Directions, 2025",note:"Standardised provisioning and DCCO/extension norms — effective 1 Oct 2025; re-paper covenants.",flag:"amended"},
  {ref:"SEBI (InvIT) Regulations, 2014 — leverage cap",note:"InvIT borrowing limit (≤70% with conditions) governs the road-InvIT financing.",flag:"central"},
  {ref:"Companies Act, 2013 — s.179/180 & s.77 (charge)",note:"Borrowing authorisations and registration of charge (CHG-1) within 30 days.",flag:""},
  {ref:"Contract Act, 1872 (s.126 guarantee) + SARFAESI Act, 2002",note:"Guarantee enforceability and secured-creditor enforcement on default.",flag:""},
  {ref:"Indian Stamp Act / State stamp law",note:"Stamp duty on facility agreement and security documents.",flag:""},
  {ref:"RBI ECB Framework / FEMA",note:"Applies to any offshore/foreign-currency tranche.",flag:""}],
 jv:[
  {ref:"FEMA (NDI) Rules, 2019 + Press Note 3 of 2020",note:"Land-border FDI approval route — directly relevant given the Foxconn (China-linked) investor.",flag:"central"},
  {ref:"Companies Act, 2013 — s.186 + JV/Shareholders' Agreement",note:"Inter-corporate investment limits and JV-company governance.",flag:""},
  {ref:"Competition Act, 2002 — s.5/6 + Amendment Act, 2023 (DVT)",note:"Combination notification for the JV; deal-value threshold may apply.",flag:"amended"},
  {ref:"India Semiconductor Mission / MeitY scheme + fiscal-support agreement",note:"Eligibility conditions and clawbacks attached to capital subsidy.",flag:"central"},
  {ref:"Patents Act, 1970 & Trade Marks Act, 1999 (technology licence)",note:"IP-licensing terms; FEMA royalty remittance on the automatic route.",flag:""},
  {ref:"Income-tax Act — s.92 (transfer pricing) & royalty withholding",note:"Arm's-length pricing and WHT on cross-border technical/royalty payments.",flag:""}],
 commercial:[
  {ref:"Trade Marks Act, 1999 — s.48–49",note:"Permitted/registered-user licensing of the PepsiCo marks to the bottler.",flag:"central"},
  {ref:"Competition Act, 2002 — s.3(4)",note:"Vertical agreement / exclusive supply & distribution — the removal of exclusivity is the key competition point.",flag:"central"},
  {ref:"Contract Act, 1872 + Specific Relief (Amendment) Act, 2018",note:"Master commercial agreement; enhanced specific-performance remedies.",flag:""},
  {ref:"FEMA / FDI policy — royalty & trademark remittances",note:"Royalty/licence-fee remittance permitted on the automatic route.",flag:""},
  {ref:"SEBI (LODR) Reg. 30",note:"Varun Beverages' disclosure of the material agreement.",flag:""}],
 ruling:[
  {ref:"Indian Telegraph Act, 1885 — s.4",note:"The Centre's licensing power; the Court's limit on retrospective re-pricing turns on this section.",flag:"central"},
  {ref:"Telecommunications Act, 2023",note:"Now replacing the Telegraph regime — read the ruling alongside the new framework.",flag:"amended"},
  {ref:"TRAI Act, 1997",note:"TRAI's recommendatory role on spectrum charges and licensing terms.",flag:""},
  {ref:"Constitution — Art. 14, 265, 226",note:"No levy without authority of law; equality; writ jurisdiction invoked to quash the demand.",flag:""},
  {ref:"Doctrine of legitimate expectation & novation",note:"Licence-as-contract reasoning; State cannot unilaterally vary financial terms.",flag:""}],
 outbound:[
  {ref:"FEMA — Liberalised Remittance Scheme (LRS)",note:"Per-individual annual remittance limit for resident Indian investors into the programme.",flag:"central"},
  {ref:"FEM (Overseas Investment) Rules & Regulations, 2022 + RBI OI Directions",note:"The overhauled ODI/OPI regime governing outbound investment structures.",flag:"amended"},
  {ref:"Prevention of Money-Laundering Act, 2002",note:"Source-of-funds and KYC diligence on participating investors.",flag:""},
  {ref:"Income-tax Act — s.6, Schedule FA + TCS on LRS",note:"Residency, foreign-asset reporting and tax-collected-at-source on remittances.",flag:"amended"},
  {ref:"SEBI (AIF) Regulations, 2012",note:"If the programme is marketed as a pooled vehicle in India.",flag:""}]
};
const FRAMEWORK={
 "acme-qip":FW.qip,"jsw-energy-qip":FW.qip,"hfcl-qip":FW.qip,"hfcl-pref":FW.pref,
 "coal-india-ofs":FW.ofs,"coforge-cigniti":FW.scheme,"tata-freight-tiger":FW.maUnlisted,
 "paytm-elevation":FW.block,"embio-truenorth":FW.pe,"anveshan-seriesb":FW.pe,
 "hcl-foxconn":FW.jv,"pepsico-varun":FW.commercial,"jsa-hdfc-indusinfra":FW.fin,
 "irfc-hyd-metro":FW.fin,"airtel-spectrum":FW.ruling,"pagani-residency":FW.outbound
};
function frameworkOf(d){return d.framework||FRAMEWORK[d.id]||[];}
function commentaryOf(d){return (typeof COMMENTARY!=="undefined"?COMMENTARY.filter(c=>c.deal===d.id):[]);}
function regItemsFor(d){return (typeof REGITEMS!=="undefined"?REGITEMS:[]).filter(r=>(r.deals&&r.deals.includes(d.id))||r.linkDeal===d.id);}

/* ============================ STATE ============================ */
let route={name:"feed"};
let F={geo:"all",type:null,sector:"All Sectors",q:"",firm:"",firm2:"",city:"",stage:""};
const $=id=>document.getElementById(id);
function lsGet(k,fb){try{const v=JSON.parse(localStorage.getItem(k));return v===null||v===undefined?fb:v;}catch{return fb;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
let starred=new Set(lsGet("clt_starred",[]));
let cmp=new Set(lsGet("clt_cmp",[]));
let density=lsGet("clt_density","compact");
let sortMode=lsGet("clt_sort","latest");
function dealFirms(d){return d.firms.map(f=>f.name);}

/* ============================ UTILITIES ============================ */
function escA(s=""){return String(s).replace(/"/g,"&quot;");}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),1800);}
function copyText(txt,msg){
  const done=()=>toast(msg||"Copied to clipboard");
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,()=>{fallbackCopy(txt);done();});}
  else{fallbackCopy(txt);done();}
}
function fallbackCopy(txt){const ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");}catch{}ta.remove();}
function parseDealDate(s=""){const t=Date.parse(s);return isNaN(t)?0:t;}
function relAge(s=""){
  const t=parseDealDate(s); if(!t)return s||"";
  const days=Math.floor((Date.now()-t)/86400000);
  if(days<=0)return "today"; if(days===1)return "1d"; if(days<7)return days+"d";
  if(days<35)return Math.round(days/7)+"w"; if(days<365)return Math.round(days/30)+"mo";
  return Math.round(days/365)+"y";
}
function ageChip(d){return `<span class="age" title="${escA(d.time)}">${relAge(d.time)}</span>`;}
const TIP_VERIFIED="Corroborated by a specific official filing (exchange/regulator/court) or editor-confirmed. See Methodology.";
const TIP_REPORTED="Credible trade-press sourcing; specific primary filing not yet matched. See Methodology.";
const TIP_OFFICIAL="Carries at least one source on a government, regulator, exchange or court domain.";
function trustBadge(d){return isVerified(d)
  ?`<span class="real" title="${escA(TIP_VERIFIED)}">✓ VERIFIED</span>`
  :`<span class="real reported" title="${escA(TIP_REPORTED)}">REPORTED</span>`;}
function stripTags(s=""){return s.replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();}
function primarySrc(d){const off=(d.sources||[]).find(s=>srcOfficial(s));return off||(d.sources&&d.sources[0])||null;}
function confidenceMeter(d){
  const off=(d.sources||[]).filter(s=>srcOfficial(s)).length;
  const n=(d.sources||[]).length;
  const ver=isVerified(d);
  const lc=(window.CLT_DATA&&window.CLT_DATA.LINKCHECK&&window.CLT_DATA.LINKCHECK.deals)||null;
  const ls=lc?lc[d.id]:null;
  let seg=0;
  if(n>=1)seg++;
  if(off>=1)seg++;
  if(off>=2||(ver&&n>=2))seg++;
  if(ls==="v"||(off>=2&&n>=3))seg++;
  seg=Math.max(1,Math.min(4,seg));
  const lvl=seg>=4?"High":seg>=3?"Strong":seg>=2?"Moderate":"Limited";
  const parts=[];
  if(off)parts.push(off+" official");
  const other=n-off; if(other>0)parts.push(other+" press");
  if(ls==="v")parts.push("links verified");
  const bars=[1,2,3,4].map(i=>`<span class="cseg${i<=seg?' on':''}"></span>`).join("");
  return `<div class="confm" title="Evidentiary confidence — from number of sources, how many are official/primary, and link health.">`
    +`<span class="confm-l">Confidence</span><span class="confm-bar">${bars}</span><span class="confm-v">${lvl}</span>`
    +`${parts.length?`<span class="confm-d">${parts.join(" · ")}</span>`:""}</div>`;
}
