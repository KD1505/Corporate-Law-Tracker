/* ============================ LAW DETAIL - the transactional masterclass ============================
   Deep, practical, deal-lawyer-oriented detail per regulation: overview, provisions that matter in
   practice, recent amendments highlighted, a transactional playbook and pitfalls. Keyed by lawId(title).
   Written as a working reference (not a classroom). Always read the current text of the law. */
const LAWDETAIL={
 "sebi-icdr-regulations-2018":{
  overview:"The fund-raising master-timetable for listed and to-be-listed companies. For a transactional lawyer this is the rulebook for QIPs, preferential issues, rights issues and IPOs - the eligibility gates, the pricing floor, the placement/offer document and the allotment mechanics. Most ECM deals turn on its pricing and disclosure rules.",
  provisions:[
   {s:"Reg. 5–6",t:"Eligibility & entry norms",d:"Gatekeeper for a public issue - net-tangible-asset, operating-profit and net-worth tests, or the alternative QIB-allotment route under Reg. 6(2). First question on any IPO: does the issuer qualify, or must it take the 75%-to-QIBs route?"},
   {s:"Ch. VI, Reg. 171–179",t:"Qualified Institutions Placement (QIP)",d:"QIBs only; minimum two allottees; placement document is NOT pre-cleared by SEBI (unlike an IPO prospectus); allotment within 365 days of the special resolution. The fastest equity route for a listed issuer - used by ACME Solar and JSW Energy on this tracker."},
   {s:"Reg. 176",t:"QIP pricing & discount",d:"Floor = two-week VWAP of the relevant stock; up to 5% discount permitted with shareholder approval. The single most negotiated number in a QIP and the driver of the pricing-committee timetable."},
   {s:"Ch. V, Reg. 158–167",t:"Preferential issue & warrants",d:"Pricing by the 90/10-trading-day VWAP for frequently-traded shares; warrants need 25% upfront with exercise in 18 months; lock-in applies. Promoter infusions run through here - always cross-check SAST creep/trigger."},
   {s:"Reg. 164 / 164A",t:"Pricing - frequently vs infrequently traded",d:"Different VWAP windows; infrequently-traded shares require a registered-valuer report. Confirm trading frequency at kick-off - it changes the entire price build."},
   {s:"Monitoring agency",t:"Use-of-proceeds monitoring",d:"A credit-rating agency must monitor utilisation of QIP/preferential proceeds above the threshold, with quarterly reporting until fully deployed."}],
  amendments:[
   {date:"17 May 2024",t:"QIP timing + rumour-pricing",d:"Removed the two-working-day prior intimation for the QIP pricing board meeting - a QIP can now stay open for under three working days. Added a 'market-rumour unaffected price' framework: if a rumour moves the price and the company confirms within 24 hours, that move is stripped out of the pricing formula. Materially compresses the QIP calendar."},
   {date:"2025",t:"Rights-issue overhaul",d:"Faster rights-issue timeline and process - re-check the current rights-issue calendar before advising."}],
  playbook:[
   "Build the QIP timetable backwards from the pricing-committee meeting: special resolution (or postal ballot) → in-principle exchange approval (LODR Reg. 28) → pricing on the 'relevant date' → placement document → allotment → listing.",
   "For a promoter preferential issue, run the SAST analysis in parallel - the allotment can cross the 5% creep or 25% trigger and need an exemption (SAST Reg. 10) or even an open offer.",
   "Pin down 'frequently traded' status (Reg. 164) on day one; infrequently-traded needs a valuer and a different price build.",
   "Model post-issue shareholding against minimum public shareholding (SCRR) and lock-in before committing a deal size.",
   "Remember the QIP placement document is not SEBI-cleared - diligence, the legal opinion and the comfort package carry the disclosure risk."],
  pitfalls:["Mis-computing the 'relevant date' / VWAP window - the classic error that can invalidate the issue.","Forgetting the monitoring-agency appointment for large proceeds.","Treating preferential pricing as negotiable - it is formula-driven and floored."]},
 "sebi-lodr-regulations-2015":{
  overview:"The continuous-compliance code for every listed company - governance, disclosure and, crucially for deal lawyers, the related-party-transaction (RPT) and material-event regime. It dictates what must be disclosed to the exchanges, when, and what board/shareholder approvals a transaction needs.",
  provisions:[
   {s:"Reg. 23",t:"Related-party transactions",d:"Audit-committee approval for all RPTs; shareholder approval for 'material' RPTs (≥ ₹1,000 cr or 10% of consolidated turnover, whichever lower). The single biggest LODR touchpoint on M&A and intra-group deals."},
   {s:"Reg. 30 + Sch. III",t:"Disclosure of material events",d:"Time-bound disclosure of price-sensitive events (deals, fund-raises, rulings) - generally within 30 minutes/12/24 hours depending on the trigger. Governs the announcement choreography on any signing."},
   {s:"Reg. 29",t:"Prior intimation of board meetings",d:"Advance notice to exchanges for fund-raising, buy-backs, dividends etc. - the front end of the ECM timetable."},
   {s:"Reg. 17",t:"Board composition & independence",d:"Independent-director minimums, audit/NRC committees - the governance backdrop diligence always checks."},
   {s:"Reg. 37 & 37A",t:"Schemes of arrangement",d:"Stock-exchange/SEBI no-objection (NOC) BEFORE filing a scheme with the NCLT; SEBI scrutiny of the scheme terms and the valuation/swap ratio."}],
  amendments:[
   {date:"12 Dec 2024",t:"RPT framework eased (3rd Amendment)",d:"Independent directors may ratify an RPT within three months up to ₹1 cr/FY; omnibus approval now available for subsidiary RPTs with quarterly review; remuneration/sitting fees to non-promoter directors/KMP/senior management are excluded from audit-committee approval if not material. Practical relief on day-to-day RPT compliance."},
   {date:"Ongoing",t:"Disclosure tightening",d:"Materiality thresholds and timelines under Reg. 30 have been progressively sharpened - confirm the current Sch. III triggers before advising on announcement timing."}],
  playbook:[
   "On any signing, map the Reg. 30 disclosure clock immediately - the announcement must hit the exchange within the prescribed window from board approval/agreement.",
   "Screen every intra-group or promoter deal through Reg. 23 early: audit committee always; shareholders if 'material' (and the related party can't vote).",
   "For a scheme, the LODR Reg. 37 NOC is a gating item before the NCLT petition - build it into the timeline alongside the s.230 process.",
   "Keep the RPT policy and materiality thresholds current post the Dec-2024 amendment - boards are refreshing these at the AGM."],
  pitfalls:["Missing the Reg. 30 disclosure window - a common, visible default.","Assuming a deal is exempt from RPT shareholder approval without testing the consolidated-turnover limb."]},
 "sebi-sast-takeover-regulations-2011":{
  overview:"The open-offer code: when acquiring shares or 'control' of a listed company forces a tender offer to public shareholders. It is tested on every listed-target acquisition, promoter infusion and creeping purchase - and its mechanics (PAC, offer price, escrow, completion) drive the deal timetable and certainty.",
  provisions:[
   {s:"Reg. 3(1)",t:"25% trigger",d:"Acquiring shares/voting rights that take the acquirer and PAC to 25% or more triggers a mandatory open offer."},
   {s:"Reg. 3(2)",t:"Creeping acquisition (5%/year)",d:"A holder already at 25% up to the maximum permissible non-public shareholding may acquire only up to 5% more in a financial year without an offer (computed gross of sales)."},
   {s:"Reg. 4",t:"Acquisition of control",d:"Acquiring 'control' (right to appoint majority of directors, or to control management/policy) triggers an offer regardless of percentage - the limb that catches SHA veto/affirmative rights (the Subhkam debate)."},
   {s:"Reg. 5",t:"Indirect acquisition",d:"Acquiring control/shares of an upstream entity that in turn holds the target is treated as an acquisition of the target - and becomes a 'direct' trigger where the target is the predominant part of the upstream business."},
   {s:"Reg. 6",t:"Voluntary open offer",d:"A holder at ≥25% may make a voluntary offer of at least 10%, subject to no acquisition in the preceding 52 weeks and a 6-month standstill after - used to consolidate or signal commitment."},
   {s:"Reg. 7",t:"Offer size",d:"Minimum open offer of 26% of total voting capital (as of the 10th working day after the tendering period closes)."},
   {s:"Reg. 8",t:"Offer price floors",d:"Highest of: the negotiated price; the highest price paid by the acquirer/PAC in the 52 weeks before the PA; the highest paid in the 26 weeks; and the 60-trading-day VWAP before the PA (for frequently-traded shares). Deferred/indexed/earn-out consideration must be built in."},
   {s:"Reg. 17",t:"Escrow",d:"Before the offer, fund an escrow (cash/bank guarantee/securities): 25% of the first ₹500 cr of consideration + 10% of the balance - security for the public's consideration."},
   {s:"Reg. 22(2A)",t:"Completion before offer closes",d:"By depositing 100% of the offer consideration in escrow (cash), the acquirer may COMPLETE the underlying acquisition before the open offer closes - the key deal-certainty/timing tool."},
   {s:"Reg. 10 & 11",t:"Exemptions",d:"Automatic exemptions (inter-se transfer among qualifying persons, schemes, rights issues, buy-backs - each on strict conditions) and case-by-case SEBI exemption on application."},
   {s:"Reg. 20 / 19 / 23",t:"Competing, conditional & withdrawal",d:"A competing offer may be made within 15 working days of the DPS; an offer can be made conditional on a minimum acceptance (Reg. 19); withdrawal (Reg. 23) is permitted only on very limited grounds - so be certain before the PA."},
   {s:"Reg. 29",t:"Disclosure",d:"Every 5% crossing, and every 2% change while above 25%, must be disclosed to the company and exchanges within 2 working days."}],
  playbook:[
   "Map the PAC (persons acting in concert) FIRST - SAST aggregates the holdings of the acquirer and everyone acting in concert; under-counting the PAC group is the single most common error and understates the trigger.",
   "Compute the offer price across all four Reg. 8 floors and add any deferred, indexed, earn-out or non-cash consideration - the tendering price must clear the highest.",
   "Use Reg. 22(2A): a 100%-cash escrow lets you close the underlying SPA before the open offer concludes - essential for deal certainty when the seller wants out promptly.",
   "Size and fund the Reg. 17 escrow early (25% of first ₹500 cr + 10% beyond) - it gates the public announcement.",
   "Choose the offer type deliberately: mandatory (Reg. 3/4), voluntary (Reg. 6 - needs clean hands for 52 weeks), or conditional (Reg. 19 - minimum acceptance). Each carries different commercial risk.",
   "Plan for a competing offer (Reg. 20) within 15 working days of the DPS - and for the fact that withdrawal (Reg. 23) is near-impossible once announced.",
   "Structure to a genuine exemption (Reg. 10) where the conditions are truly met (e.g., 3-year prior holding for inter-se transfer; scheme; rights issue) - but never to defeat the Code, or SEBI will look through it.",
   "Run the Reg. 29 disclosure clock from day one - 5% crossings and 2% moves above 25% need exchange/company filings within 2 working days."],
  pitfalls:["Under-counting PAC holdings - the classic SAST mistake.","Treating 'control' as purely numerical - affirmative/veto rights in an SHA can be 'control'.","Missing indirect/upstream acquisitions (Reg. 5).","Omitting deferred/earn-out/non-cash consideration from the Reg. 8 price.","Announcing before you are certain - withdrawal under Reg. 23 is barely available."]},
 "sebi-pit-regulations-2015":{
  overview:"Insider-trading prohibition and the handling of unpublished price-sensitive information (UPSI). Shapes how deal teams, diligence and announcements are run for any listed-company transaction.",
  provisions:[
   {s:"Reg. 3",t:"Communication of UPSI",d:"No communication or procurement of UPSI except for legitimate purposes - the basis for clean-team and NDA protocols in diligence."},
   {s:"Reg. 4",t:"Trading on UPSI",d:"Bar on trading while in possession of UPSI; defences (e.g. trading plans, off-market inter-se) are narrow."},
   {s:"Reg. 3(2A)/(2B)",t:"Structured digital database + legitimate purpose",d:"Maintain a database of persons with whom UPSI is shared and the rationale - diligence counterparties must be logged."},
   {s:"Sch. B/C",t:"Codes of conduct & trading window",d:"Window closures around results/material events and contra-trade restrictions for designated persons."}],
  playbook:[
   "Treat the deal as UPSI from inception - set up the structured digital database (Reg. 3(2A)) and log every recipient of UPSI, including advisers and the counterparty.",
   "Time the announcement against the trading window; designated persons can't trade while the window is shut.",
   "On a block/secondary sale by an insider (e.g. a PE exit), confirm the seller is not in possession of UPSI and the window is open - the Paytm/Elevation-type exit lives here."],
  pitfalls:["Sharing diligence data without a legitimate-purpose log.","Overlooking contra-trade rules for designated persons."]},
 "sebi-invit-regulations-2014":{
  overview:"The trust vehicle for monetising operating infrastructure (roads, transmission, etc.). For finance lawyers, the key levers are the leverage cap and the mandatory distribution - both shape any InvIT-level financing or acquisition.",
  provisions:[
   {s:"Reg. 20",t:"Leverage cap",d:"Aggregate borrowing capped at 70% of asset value (above 49% needs credit rating + unitholder approval). The hard constraint on any InvIT-level debt raise or refinancing - directly relevant to the Indus Infra Trust financing here."},
   {s:"Reg. 18",t:"Mandatory distribution",d:"At least 90% of net distributable cash flows must be distributed to unitholders - affects cash trapping and DSRA structuring in financings."},
   {s:"Reg. 12–15",t:"Structure & parties",d:"Sponsor, investment manager, trustee and project-SPV architecture; related-party and valuation safeguards."}],
  playbook:[
   "Size any InvIT financing against the Reg. 20 leverage cap on a look-through basis - acquisitions that add SPV debt can breach it.",
   "The 90% distribution mandate limits cash sweeps - negotiate DSRA and distribution-blocker mechanics carefully with lenders.",
   "Refinancing acquired-SPV debt (the Indus Infra pattern) needs the InvIT-level and SPV-level security and inter-creditor position mapped."],
  pitfalls:["Assuming SPV-level debt sits outside the InvIT leverage test.","Ignoring unitholder-approval triggers above 49% leverage."]},
 "sebi-aif-regulations-2012":{
  overview:"The regime for pooled PE/VC/hedge vehicles. Relevant on the investor side of almost every private fund-raise and on exits.",
  provisions:[
   {s:"Reg. 3",t:"Categories I/II/III",d:"VC/SME/infra (I), PE/debt (II) and hedge/complex-strategy (III) - category drives leverage, concentration and tax treatment."},
   {s:"Reg. 10",t:"Placement memorandum & commitments",d:"PPM-based offering; minimum ₹1 cr investor commitment; sponsor 'skin in the game'."},
   {s:"Reg. 15–16",t:"Investment conditions",d:"Diversification/concentration limits and category-specific restrictions that shape the fund's term sheet."}],
  playbook:[
   "On a priced round, check the lead investor's AIF category and concentration limits - they cap cheque size and can drive co-investment structures.",
   "DFI/IFC investors layer their own E&S, governance and anti-corruption covenants on top of the AIF rules - these reshape the SHA (see the Anveshan round).",
   "Map the fund's exit rights (drag, tag, IPO ratchet) against SEBI and FEMA on the way out."]},
 "companies-act-2013":{
  overview:"The backbone statute for everything corporate - issuances, approvals, related-party dealings, charges and court-supervised restructuring. Nearly every deal step traces to a section here.",
  provisions:[
   {s:"s.42 + s.62(1)(c)",t:"Private placement / preferential allotment",d:"Special resolution and registered-valuer pricing for any non-rights issue of shares; PAS-3 return of allotment. The corporate engine behind preferential issues and PE rounds."},
   {s:"s.179 / 180",t:"Board vs shareholder powers",d:"s.180(1)(a) (sale of undertaking) and s.180(1)(c) (borrowing beyond paid-up + free reserves) need special resolutions - gating items on asset sales and financings."},
   {s:"s.185 / 186",t:"Loans & inter-corporate investments",d:"s.185 bars most loans to directors/related entities; s.186 caps and conditions inter-corporate loans, guarantees and investments - a frequent structuring constraint in group deals and JVs."},
   {s:"s.188",t:"Related-party transactions",d:"Board and (for large RPTs) shareholder approval; the Companies Act layer that sits beneath LODR Reg. 23."},
   {s:"s.230–232",t:"Compromise, arrangement & amalgamation",d:"The NCLT scheme route for mergers, demergers and capital reductions - used for the Coforge–Cigniti amalgamation. Creditor/member meetings, valuation and sanction."},
   {s:"s.233",t:"Fast-track merger",d:"Board/RD-approved merger for small companies and holding-subsidiary combinations - no NCLT, much faster."},
   {s:"s.77 / 78",t:"Creation & registration of charges",d:"Register charges (CHG-1) within 30 days - missed registration makes security void against the liquidator. Core to every financing."}],
  amendments:[
   {date:"2019–2021",t:"Decriminalisation & ease",d:"Successive Companies (Amendment) Acts decriminalised many procedural defaults, eased CSR and allowed direct overseas listing enablers. Confirm the current penalty/compounding position for any default."}],
  playbook:[
   "For any equity issue, line up s.42/s.62 (special resolution + valuation + PAS-3) with the ICDR/ FEMA pricing rules - three regimes, one price.",
   "Check s.180 thresholds before a borrowing or asset sale - missing the special resolution is a classic closing-condition failure.",
   "On group financings/JVs, test s.185/186 limits early - they can force a restructure of guarantees and inter-co loans.",
   "Choose the restructuring tool deliberately: s.233 fast-track vs s.230–232 NCLT scheme vs a share purchase - each has very different timelines and tax outcomes."],
  pitfalls:["Late CHG-1 charge registration (30-day clock) - security becomes void against the liquidator.","Overlooking s.186 layering limits in multi-tier group structures."]},
 "competition-act-2002":{
  overview:"Merger control and conduct law. Since the 2023 amendments it is a front-of-mind deal-timing issue: the new deal-value threshold can catch transactions the old asset/turnover tests missed, and consummation before approval ('gun-jumping') is penalised.",
  provisions:[
   {s:"s.5 & 6",t:"Combinations & standstill",d:"Asset/turnover thresholds for notifiable combinations; s.6(2A) bars consummation before approval (now within the shorter timeline)."},
   {s:"s.6A",t:"Deal-Value Threshold (DVT)",d:"NEW: a deal exceeding ₹2,000 cr where the target has 'substantial business operations in India' needs CCI approval even if asset/turnover thresholds (and de-minimis) aren't met. Aimed squarely at tech/digital acquisitions."},
   {s:"s.3",t:"Anti-competitive agreements",d:"s.3(3) cartels (per se) and s.3(4) vertical/exclusive arrangements - the latter is the live issue on exclusive distribution/bottling (PepsiCo–Varun)."},
   {s:"s.4",t:"Abuse of dominance",d:"Conduct rules for dominant firms - relevant to diligence on market-leading targets."},
   {s:"s.31",t:"CCI order on a combination",d:"Approve, approve-with-modifications, or block; remedies/commitments negotiated here."}],
  amendments:[
   {date:"10 Sep 2024",t:"DVT + new Combination Regulations in force",d:"The Competition (Amendment) Act, 2023 deal-value threshold (s.6A, ₹2,000 cr + 'substantial business operations in India') and the CCI (Combinations) Regulations, 2024 took effect. SBOI test: non-digital - India turnover >10% of global AND >₹500 cr; digital - India turnover >10% of global OR India users ≥10% of global. Also introduced settlement & commitment and a 150-day overall review timeline."}],
  playbook:[
   "Run merger-control analysis on TWO tracks now: classic asset/turnover thresholds AND the s.6A deal-value threshold - a sub-threshold tech deal can still be notifiable.",
   "Test de-minimis (target India turnover <₹1,250 cr or India assets <₹450 cr) - but remember DVT can override it.",
   "Use the green channel only where there is genuinely no horizontal/vertical/complementary overlap - a wrong green-channel filing voids the consummation.",
   "Mind gun-jumping: no integration, no exercising of control, before approval - structure interim covenants accordingly."],
  pitfalls:["Assuming a small target = no filing; the DVT changed that.","Closing/integrating before CCI clearance (gun-jumping penalties)."]},
 "cci-combination-regulations-2024":{
  overview:"The procedure and forms for notifying mergers and acquisitions to the CCI, including the green-channel automatic route. Read with the s.5/6/6A substantive tests.",
  provisions:[
   {s:"Green channel",t:"Automatic deemed approval",d:"Self-certified route where there is no horizontal, vertical or complementary overlap - clearance on filing. Powerful but risky: a wrong filing renders the combination void."},
   {s:"Form I / Form II",t:"Short vs long form",d:"Form I (most deals) vs Form II (high market-share/overlap deals needing detailed economic analysis)."},
   {s:"Timelines",t:"Review clock",d:"Prima-facie opinion in 30 working days; overall outer limit now 150 days post-amendment."}],
  playbook:[
   "Choose the form early - Form II materially increases the diligence and economic-evidence burden.",
   "Document the no-overlap analysis before opting for the green channel - the certification carries real consequences.",
   "Build the CCI timeline (and any Phase II risk) into the conditions-precedent and long-stop date."]},
 "fem-non-debt-instruments-rules-2019":{
  overview:"The inbound-FDI rulebook: routes, sectoral caps, pricing and downstream-investment tests for foreign investment into Indian equity. Sits on almost every cross-border deal and many domestic ones with foreign money in the cap table.",
  provisions:[
   {s:"Schedule I",t:"FDI in equity instruments",d:"Permissible instruments (equity, CCPS, CCDs), automatic vs Government route, and sectoral caps/conditions."},
   {s:"Pricing guidelines",t:"Entry/exit pricing",d:"Floor for issue/transfer to a non-resident and ceiling for transfer from a non-resident, on an internationally-accepted methodology (DCF/ comparable) - the FEMA price that must reconcile with ICDR/Companies-Act pricing."},
   {s:"Downstream investment",t:"Indirect foreign investment",d:"Investment by an Indian entity that is foreign-owned/controlled counts as indirect FDI - a frequent trap in multi-tier structures."},
   {s:"Reporting",t:"FC-GPR / FC-TRS",d:"Single-Master-Form reporting of issues and transfers within the prescribed windows - a closing-mechanics item."}],
  amendments:[
   {date:"Ongoing",t:"FDI policy updates",d:"Sectoral caps/conditions are revised through the consolidated FDI Policy and periodic Press Notes - always check the current sectoral entry for the target's business."}],
  playbook:[
   "Reconcile three prices on any foreign-investor issue: FEMA pricing floor, ICDR/Companies-Act valuation, and the commercial price - the deal price must clear all.",
   "Map the cap table for foreign ownership/control to test downstream-investment consequences before signing.",
   "Diarise FC-GPR/FC-TRS reporting - late filing needs compounding with the RBI.",
   "For any China/land-border money, layer Press Note 3 approval on top (see that entry)."],
  pitfalls:["Missing downstream-investment characterisation in layered structures.","Late or wrong Single-Master-Form filings."]},
 "press-note-3-of-2020-dpiit":{
  overview:"The land-border FDI rule: any investment from an entity of a country sharing a land border with India (or with a beneficial owner there) needs prior Government approval. A standing diligence item on any deal with Chinese/Hong-Kong-linked capital.",
  provisions:[
   {s:"Para 3.1.1(a)",t:"Prior Government approval",d:"Beneficial-ownership-based approval requirement for land-border investors - applies regardless of sector or amount."},
   {s:"Beneficial ownership",t:"Look-through test",d:"Trace ultimate beneficial ownership through the structure; even indirect land-border ownership triggers it."}],
  playbook:[
   "Run a beneficial-ownership trace on every foreign investor/acquirer at term-sheet stage - PN3 approval timelines can dominate the deal calendar (relevant to Foxconn-linked structures).",
   "If PN3 applies, the Government-route filing and security clearance become conditions precedent - price the delay into the long-stop date.",
   "Reps & warranties on no-land-border beneficial ownership, plus a specific CP, are standard protection."]},
 "fem-overseas-investment-rules-regulations-2022":{
  overview:"The overhauled outbound-investment regime - ODI, OPI and the Liberalised Remittance Scheme (LRS) for residents investing abroad. A 2022 consolidation that liberalised and clarified the old framework.",
  provisions:[
   {s:"OI Rules/Regs 2022",t:"ODI vs OPI",d:"Distinguishes Overseas Direct Investment (control/10%+) from Overseas Portfolio Investment; sets limits, approvals and the 'no Indian-resident-controlled' conditions."},
   {s:"LRS",t:"Resident-individual route",d:"Annual per-individual remittance limit for outbound investment/expenditure - the rail for individual participation in overseas programmes."},
   {s:"Round-tripping",t:"Now permitted within limits",d:"The 2022 regime permits limited round-tripping (one layer) subject to conditions - a notable change from the earlier blanket bar."}],
  amendments:[
   {date:"Aug 2022",t:"Regime overhaul",d:"Replaced the 2004 ODI framework - consolidated rules/regulations, clarified financial-commitment limits, late-submission-fee mechanism and round-tripping. Frequently tested; advise on the new text, not the old."}],
  playbook:[
   "For an outbound/residency-investment programme (the Pagani pattern), map LRS limits for individuals and the OI route for entities, plus TCS on remittances.",
   "Test for prohibited structures (e.g. round-tripping beyond one layer, investment into a resident-controlled entity).",
   "Build PMLA/source-of-funds diligence into investor onboarding."]},
 "external-commercial-borrowings-ecb-framework":{
  overview:"The RBI rules for foreign-currency or INR borrowing by eligible Indian entities from recognised overseas lenders. Sits on any offshore tranche of a financing.",
  provisions:[
   {s:"Eligible borrowers/lenders",t:"Who can borrow/lend",d:"Defined eligible-borrower classes and recognised lenders (incl. foreign equity holders) under the automatic/approval routes."},
   {s:"All-in-cost ceiling",t:"Pricing cap",d:"Benchmark-linked all-in-cost ceiling - caps margin + fees on the ECB."},
   {s:"End-use restrictions",t:"Permitted uses",d:"Negative list (e.g. on-lending, real-estate, working capital save exceptions) and minimum-average-maturity requirements."},
   {s:"Hedging & reporting",t:"Risk + LRN",d:"Hedging norms for certain borrowers and Loan Registration Number/Form ECB reporting to RBI."}],
  playbook:[
   "Confirm eligible-borrower/lender status and the end-use against the negative list before documenting an offshore tranche.",
   "Model the all-in-cost ceiling and minimum average maturity into the term sheet.",
   "Diarise LRN and monthly ECB-2 reporting - non-reporting is a compounding issue."]},
 "insolvency-and-bankruptcy-code-2016":{
  overview:"The time-bound corporate-insolvency and liquidation code. Restructuring, distressed-M&A and lender-side deal lawyers live in it; it also reshapes credit and security analysis on every financing.",
  provisions:[
   {s:"s.7 / 9 / 10",t:"Initiation",d:"Financial creditor (s.7), operational creditor (s.9) or the corporate debtor itself (s.10) can trigger CIRP on default."},
   {s:"s.14",t:"Moratorium",d:"On admission, a moratorium freezes suits, enforcement and asset transfers - the reason lenders watch admission dates closely."},
   {s:"s.29A",t:"Ineligible resolution applicants",d:"Bars defaulting promoters and connected persons from bidding for their own company - central to who can buy a distressed asset."},
   {s:"s.31",t:"Resolution plan approval",d:"An approved plan binds all stakeholders, including dissenting creditors and the Government - the 'clean slate' that makes distressed M&A attractive."},
   {s:"s.53",t:"Liquidation waterfall",d:"Statutory priority of claims - drives recovery modelling and inter-creditor positions."},
   {s:"s.54A",t:"Pre-packaged insolvency (MSME)",d:"2021 addition - a debtor-initiated, faster pre-pack for MSMEs."}],
  amendments:[
   {date:"2021",t:"Pre-packs + threshold",d:"Introduced s.54A pre-packaged insolvency for MSMEs and raised the default threshold to ₹1 cr. The framework continues to evolve through IBBI regulations and case law."}],
  playbook:[
   "On any acquisition of a distressed target, structure as a s.31 resolution plan to get the clean-slate effect - an ordinary share purchase carries the old liabilities.",
   "Screen the buyer against s.29A early - connected-party ineligibility can sink a bid.",
   "On the lender side, map s.53 priority and the moratorium effect into security and inter-creditor documents.",
   "Watch admission timing - the s.14 moratorium changes enforcement strategy overnight."]},
 "rbi-project-finance-directions-2025":{
  overview:"The new standardised provisioning and credit-discipline regime for project (infrastructure and non-infrastructure) lending. Reshapes facility terms, DCCO covenants and lender provisioning - directly relevant to the IRFC and HDFC–Indus Infra financings here.",
  provisions:[
   {s:"Standard-asset provisioning",t:"Construction-phase provisioning",d:"1% standard-asset provision during construction (eased from the 2.5% in the draft), stepping up with each quarter of DCCO deferment (0.375% infra / 0.5625% non-infra)."},
   {s:"DCCO regime",t:"Date of Commencement of Commercial Operations",d:"Permissible DCCO deferment windows and the provisioning/resolution consequences of slippage - the covenant that drives project-loan documentation."},
   {s:"CRE",t:"Commercial real estate",d:"1.25% provisioning for under-construction CRE exposures."}],
  amendments:[
   {date:"Effective 1 Oct 2025",t:"Final directions (eased from draft)",d:"The final directions softened the draft 2.5% provisioning materially and applied to project loans sanctioned on/after 1 Oct 2025. Re-paper facility/covenant terms and reset lender provisioning expectations."}],
  playbook:[
   "For any project financing or refinancing post 1 Oct 2025, align DCCO/extension covenants and provisioning expectations to the new directions.",
   "On a refinancing of operating-asset debt (the IRFC/Indus Infra pattern), the credit-enhancement package (State guarantee, RBI direct-debit mandate) is what de-risks the lender - document it tightly.",
   "Model the step-up provisioning into pricing and the lenders' return."]},
 "income-tax-act-1961-m-a-provisions":{
  overview:"The tax architecture that drives deal structuring - whether to use a scheme or a share purchase, how losses travel, the FMV floors, and the capital-gains cost. Often the decisive factor in choosing the structure.",
  provisions:[
   {s:"s.2(1B) / 2(19AA)",t:"Tax-neutral amalgamation / demerger",d:"Conditions for a merger/demerger to be tax-neutral (continuity of shareholding, undertaking transfer 'as a going concern'). The reason the Coforge–Cigniti scheme used these tests."},
   {s:"s.47 & 72A",t:"Exempt transfers; loss carry-forward",d:"s.47 exempts qualifying amalgamation/demerger transfers; s.72A allows carry-forward and set-off of accumulated losses/depreciation on amalgamation - a major value driver."},
   {s:"s.50CA / 56(2)(x)",t:"FMV floors",d:"s.50CA deems FMV as the sale consideration for unlisted shares (seller side); s.56(2)(x) taxes the buyer on any under-value receipt. Both must be cleared on an unlisted-share transfer (Tata–Freight Tiger pattern)."},
   {s:"s.112A / 111A",t:"Capital gains on listed equity",d:"LTCG and STCG rates on listed equity (with STT) - drives the after-tax outcome of block/secondary sales."},
   {s:"Ch. X-A (GAAR)",t:"General Anti-Avoidance Rules",d:"Lets the revenue disregard 'impermissible avoidance arrangements' lacking commercial substance - the backstop that disciplines aggressive structuring."}],
  amendments:[
   {date:"23 Jul 2024",t:"Capital-gains rates reset",d:"From 23 July 2024: LTCG on listed equity (s.112A) is 12.5% above ₹1.25 lakh (was 10% above ₹1 lakh); STCG (s.111A) is 20% (was 15%). Re-model after-tax economics on any listed-share exit dated on/after this."},
   {date:"AY 2025-26",t:"Angel tax abolished",d:"s.56(2)(viib) ('angel tax' on share premium) is inapplicable from 1 April 2025 - a major relief for priced equity rounds for ALL investors (resident and non-resident). Legacy years may still see demands."}],
  playbook:[
   "Pick the structure for tax first: a s.230–232 amalgamation (tax-neutral + loss carry-forward via s.2(1B)/s.72A) versus a share/asset purchase has very different outcomes.",
   "On unlisted-share transfers, clear both s.50CA (seller) and s.56(2)(x) (buyer) FMV limbs - get a registered-valuer report.",
   "Post-July-2024, re-run the after-tax exit model for listed-share sales at the new 12.5%/20% rates.",
   "For priced rounds dated on/after 1 Apr 2025, angel tax is no longer a structuring constraint - but confirm the round date for legacy exposure.",
   "Pressure-test any structure against GAAR - commercial substance is the defence."]},
 "indian-stamp-act-1899-2019-2020-securities-amendment":{
  overview:"Stamp duty on instruments - and, since the 2019 amendment, a uniform centrally-collected regime for securities. A small-percentage cost that is easy to under-provision on large deals.",
  provisions:[
   {s:"2019 amendment (eff. 1 Jul 2020)",t:"Uniform securities stamp duty",d:"One rate, collected at source by the depository/exchange/clearing corporation on issue and transfer of securities - replacing the old state-by-state patchwork for demat securities."},
   {s:"Instrument-based duty",t:"Agreements & conveyances",d:"SPAs, SHAs, debentures, security and conveyance documents attract state stamp duty on execution - budget for it and check the state of execution."}],
  playbook:[
   "Provision for the uniform securities stamp duty on any issue/transfer of shares - it is collected automatically but is a real cost on large QIPs/OFS/secondaries.",
   "Choose the place of execution of SPAs/SHAs/security documents with stamp duty in mind - rates vary materially by state.",
   "Ensure adequate stamping before relying on a document in evidence or for registration of charge."]},
 "digital-personal-data-protection-act-2023-rules-2025":{
  overview:"India's data-protection statute and its 2025 implementing Rules - consent, security, breach notification and cross-border transfer. A live diligence and post-closing-integration item on any data-rich target.",
  provisions:[
   {s:"Consent & notice",t:"Lawful processing",d:"Processing on itemised, withdrawable consent (or 'legitimate uses'); consent managers as registered intermediaries."},
   {s:"Breach notification",t:"Board + principals",d:"Notify the Data Protection Board and affected data principals on a personal-data breach - build into incident-response."},
   {s:"SDFs",t:"Significant Data Fiduciaries",d:"Higher-bar entities face DPIA, independent audit and Data Protection Officer obligations."},
   {s:"Cross-border transfer",t:"Transfer regime",d:"Transfers permitted except to restricted territories (negative-list approach) - affects group data flows."}],
  amendments:[
   {date:"13 Nov 2025",t:"DPDP Rules notified (phased)",d:"Rules notified 13 Nov 2025 with a staggered clock: consent-manager registration and obligations by ~Nov 2026; the core obligations (notice, security, breach, cross-border, children's consent, SDF duties) by ~May 2027. Start re-papering DPAs and notices now - the 18-month runway is short for portfolio-wide change."}],
  playbook:[
   "On any data-rich target, diligence DPDP-readiness (consent architecture, retention, breach history) and price remediation.",
   "Refresh data-processing agreements, privacy notices and cross-border-transfer clauses across the portfolio against the phased deadlines.",
   "For SDFs, stand up DPIA/audit/DPO governance ahead of the 2027 trigger."]},
 "telecommunications-act-2023":{
  overview:"The new authorisation-based telecom framework replacing the colonial-era Indian Telegraph Act, 1885. Read alongside legacy Telegraph-Act jurisprudence (e.g. the Airtel/Vodafone retrospective-levy ruling on this tracker).",
  provisions:[
   {s:"Authorisation regime",t:"From licence to authorisation",d:"Replaces the old licensing model with authorisations for networks/services; reshapes M&A and assignment consents in the sector."},
   {s:"Spectrum",t:"Assignment & management",d:"Statutory basis for spectrum assignment, sharing, trading and surrender."},
   {s:"Transition",t:"Continuity",d:"Saves existing licences/jurisprudence during transition - legacy disputes (retrospective charges) still turn on the old Telegraph Act."}],
  amendments:[
   {date:"2023",t:"New statute",d:"A significant overhaul of the telecom legal framework; provisions are being operationalised in phases - check what is in force for any sector deal."}],
  playbook:[
   "On a telecom-sector deal, map the authorisation/assignment consents needed for a change of control.",
   "Read current spectrum holdings and any pending legacy levies/disputes (the Airtel/Vodafone ruling is directly on point)."]},
 "indian-contract-act-1872-specific-relief-amendment-act-2018":{
  overview:"The contract backbone for every SPA, SHA and facility agreement - plus the 2018 Specific Relief amendment that shifted specific performance from a discretionary remedy to the default, materially improving deal certainty.",
  provisions:[
   {s:"s.10 / 73 / 74",t:"Formation & damages",d:"Essentials of a valid contract; compensation for breach (s.73) and liquidated damages/penalty (s.74) - the basis for indemnity and cap negotiations."},
   {s:"Specific Relief (Amdt) 2018",t:"Specific performance as the rule",d:"Specific performance is now generally enforceable (not discretionary), with provisions for substituted performance and special courts - strengthens a buyer's ability to compel closing."},
   {s:"s.27 + SHA enforceability",t:"Restraint of trade",d:"Non-compete/exclusivity clauses must navigate s.27; SHA transfer restrictions interact with Companies Act s.58/59 free-transferability."}],
  playbook:[
   "Draft closing mechanics knowing specific performance is now a realistic remedy - it changes the leverage on a recalcitrant counterparty.",
   "Calibrate indemnity caps, baskets and survival against s.73/74 principles; label liquidated damages carefully to avoid 'penalty' challenges.",
   "Test non-compete/exclusivity against s.27 and (for vertical exclusivity) Competition Act s.3(4) - the PepsiCo–Varun exclusivity-removal point."]},
 "arbitration-and-conciliation-act-1996":{
  overview:"The dispute-resolution engine for commercial contracts - the clause every deal lawyer drafts and the regime that decides how quickly an award is enforced. Amended thrice (2015/2019/2021) on timelines, interim relief and the stay regime.",
  provisions:[
   {s:"s.9 / 17",t:"Interim measures",d:"Court (s.9) and tribunal (s.17) interim relief - critical for preserving assets/status quo pending the dispute."},
   {s:"s.11",t:"Appointment of arbitrators",d:"Court-assisted appointment; institutional vs ad-hoc choice drives speed and cost."},
   {s:"s.34",t:"Setting aside",d:"Narrow grounds (patent illegality/public policy) to challenge an award - the gateway every enforcement runs through."},
   {s:"s.36",t:"Enforcement & stay",d:"Post-2015/2021, no automatic stay on enforcement merely by filing a s.34 challenge - a major pro-enforcement shift."}],
  amendments:[
   {date:"2015 / 2019 / 2021",t:"Three reform waves",d:"Strict 12-month award timelines (s.29A), removal of the automatic stay on enforcement, institutional-arbitration push, and a 2021 change to the unconditional-stay/fraud carve-out. Advise on the current consolidated text."}],
  playbook:[
   "Draft the arbitration clause deliberately - seat, institution, language, number of arbitrators and emergency-arbitrator availability decide how the dispute actually runs.",
   "Use s.9 interim relief early to preserve deal assets; remember enforcement is no longer auto-stayed by a challenge.",
   "Prefer institutional arbitration for speed and the s.29A timeline discipline."]},
 "trade-marks-act-1999":{
  overview:"Registration, licensing and protection of trade marks - central to brand-heavy deals, licensing arrangements (PepsiCo–Varun) and IP diligence.",
  provisions:[
   {s:"s.48–49",t:"Registered/permitted user",d:"Framework for licensing marks (registered user) and recording permitted use - the basis of a trademark-licence structure."},
   {s:"s.29",t:"Infringement",d:"Statutory infringement of registered marks; s.27 preserves passing-off for unregistered marks."},
   {s:"Assignment",t:"With/without goodwill",d:"Marks can be assigned with or without goodwill, subject to conditions - a diligence and transfer-document point on brand deals."}],
  playbook:[
   "On a brand/licensing deal, paper the licence as a registered-user/permitted-use arrangement and address quality control and termination.",
   "Diligence the trademark register for ownership, validity and encumbrances before relying on brand value.",
   "For exclusivity in a licence, run the Competition Act s.3(4) vertical-restraint check."]},
 "sarfaesi-act-2002":{
  overview:"Secured-creditor self-help enforcement and asset reconstruction - the lender's recovery toolkit outside the IBC.",
  provisions:[
   {s:"s.13(2)/(4)",t:"Enforcement of security",d:"60-day demand notice (13(2)) then enforcement (13(4)) - possession/sale of secured assets without a court decree."},
   {s:"s.17",t:"Borrower remedy",d:"Appeal to the Debts Recovery Tribunal against enforcement action."},
   {s:"ARCs",t:"Asset reconstruction",d:"Sale of NPAs to asset-reconstruction companies - a distressed-debt acquisition route."}],
  playbook:[
   "On the lender side, SARFAESI and IBC are parallel tracks - choose based on asset type, security and recovery strategy.",
   "Confirm the security is validly created and registered (Companies Act s.77) before relying on SARFAESI enforcement."]},
 "foreign-exchange-management-act-1999":{
  overview:"The parent exchange-control statute under which the NDI (inbound), OI (outbound) and ECB rules are made. Civil, compounding-based regime - contraventions are regularised, not (usually) criminalised.",
  provisions:[
   {s:"s.6",t:"Capital-account transactions",d:"Empowers the rules governing FDI/ODI/ECB - the umbrella for cross-border equity and debt."},
   {s:"s.13 / 15",t:"Penalties & compounding",d:"Contraventions attract penalties but can be compounded with the RBI - the practical clean-up route for reporting defaults."}],
  playbook:[
   "Treat FEMA as a compounding regime - most defaults (late FC-GPR, pricing) are regularised via RBI compounding; build it into post-closing clean-up.",
   "Always trace the transaction to the specific rule (NDI/OI/ECB) - FEMA itself is the enabling shell."]},
 "sebi-act-1992":{
  overview:"The statute constituting SEBI and arming it to regulate the securities market. The source of all the SEBI regulations a deal lawyer uses, and of SEBI's enforcement powers.",
  provisions:[
   {s:"s.11 / 11B",t:"Powers & directions",d:"SEBI's market-regulation functions and its power to issue remedial directions (disgorgement, restraint)."},
   {s:"s.15A–15J",t:"Penalties",d:"Civil-penalty framework for disclosure, dealing and intermediary defaults."},
   {s:"s.15T",t:"Appeals (SAT)",d:"Appeals from SEBI orders lie to the Securities Appellate Tribunal."}],
  playbook:[
   "When advising on any SEBI regulation, remember SEBI's s.11B directions power - interim/ex-parte orders can freeze a deal or a person.",
   "Map the SAT appeal route into any contentious SEBI matter."]},
 "banking-regulation-act-1949":{
  overview:"Licensing and prudential regulation of banks and RBI's supervisory powers - the backdrop to any bank-counterparty financing and to acquisitions of regulated banking/NBFC targets.",
  provisions:[
   {s:"s.21 / 35A",t:"RBI directions",d:"RBI's power to issue binding directions to banking companies - the source of lending-norm circulars."},
   {s:"s.12B",t:"Acquisition of shares/voting",d:"RBI prior approval for acquiring 5%+ shareholding/voting in a banking company - a gating item on bank M&A."}],
  playbook:[
   "On any acquisition of a bank/regulated lender, build RBI 'fit and proper' and s.12B approvals into the conditions precedent.",
   "Lending documentation must track current RBI directions (e.g. the Project Finance Directions)."]},
 "information-technology-act-2000":{
  overview:"Electronic records, intermediary liability and cyber-contraventions - increasingly read with the DPDP Act, which is subsuming the data-protection limb.",
  provisions:[
   {s:"s.43A / 72A",t:"Data mishandling",d:"Compensation/penalty for negligent handling of sensitive personal data - being overtaken by the DPDP regime."},
   {s:"s.79",t:"Intermediary safe-harbour",d:"Conditional immunity for intermediaries on due-diligence compliance - central to platform/tech-target diligence."}],
  playbook:[
   "On a platform/tech target, diligence s.79 intermediary compliance and the migration path to DPDP.",
   "Read s.43A exposure together with the new DPDP breach/penalty regime."]},
 "companies-compromises-arrangements-and-amalgamations-rules-2016":{
  overview:"The procedural rules that operationalise a Companies Act s.230–232 scheme - meetings, notices, objections and the petition for sanction.",
  provisions:[
   {s:"Rule 3–6",t:"Application & meetings",d:"First-motion application, NCLT-directed creditor/member meetings and the notice/explanatory-statement package."},
   {s:"Rule 15–17",t:"Sanction petition",d:"Second-motion petition for sanction, service on regulators (RD, ROC, OL, IT, SEBI) and filing of the order."}],
  playbook:[
   "Sequence the scheme: LODR Reg. 37 NOC (if listed) → first motion → meetings → regulator representations → sanction → filing the order with the ROC.",
   "Build in time for regulator objections (RD/ROC/IT/SEBI) - they drive the real timeline."]},
 "companies-prospectus-allotment-of-securities-rules-2014":{
  overview:"The mechanics of private placement and preferential allotment under the Companies Act - the paperwork layer beneath s.42/s.62.",
  provisions:[
   {s:"Rule 13",t:"Preferential allotment",d:"Registered-valuer pricing and the explanatory statement for a preferential issue."},
   {s:"Rule 14 + PAS-3",t:"Private placement & return",d:"Offer-letter (PAS-4) mechanics and the PAS-3 return of allotment within the prescribed window."}],
  playbook:[
   "Keep the s.42 private-placement discipline: identified allottees, separate bank account, no public advertisement, and PAS-3 on time.",
   "Reconcile the registered-valuer price with ICDR and FEMA pricing on any preferential issue."]}
};

