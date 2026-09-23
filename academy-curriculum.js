(() => {
  const MODULES = [
    {
      id:"deal-map", tier:"CORE", mins:30, title:"1. Deal map & transaction lifecycle",
      why:"You should be able to place any question inside the transaction: structure, diligence, signing, conditions, closing, filings and post-closing.",
      know:[
        "Asset sale vs share sale vs primary subscription vs secondary transfer vs merger/demerger/scheme: what changes legally and commercially.",
        "Typical sequence: NDA → term sheet/LOI → diligence → structure/tax/regulatory analysis → definitive documents → signing → CP satisfaction → closing → post-closing filings/integration.",
        "Signing is not always closing. Explain why regulatory approvals, lender consents, third-party consents and internal approvals can create a gap.",
        "Identify buyer-side vs seller-side priorities: certainty of funds, leakage, business conduct, risk allocation, liability caps, price protection and execution certainty.",
        "Know where each document fits: SPA, SSA, SHA, disclosure letter, escrow agreement, transition services agreement, IP assignment, employment/retention documents, board/shareholder resolutions and closing agenda."
      ],
      anchors:[
        "Answer transaction questions in this order: commercial objective → legal trigger → document/approval → execution risk → practical solution.",
        "A strong junior does not merely identify law; they identify what the law changes in the deal timetable or drafting."
      ],
      drills:[
        "Walk me through an acquisition from first contact to closing in 90 seconds.",
        "Why would a buyer prefer a share sale over an asset sale, and when might the opposite be true?",
        "What is the difference between signing and closing?",
        "What are conditions precedent and why do they matter?"
      ],
      traps:["Reciting statutes without connecting them to transaction steps.","Treating every deal as a simple share purchase.","Forgetting approvals, lender consents, competition/FDI and post-closing filings."]
    },
    {
      id:"companies", tier:"CORE", mins:60, title:"2. Companies Act: approvals, capital and corporate mechanics",
      why:"This is the operating system for Indian private-company M&A. Interviewers often test whether you can map a transaction to board/shareholder actions and filings.",
      know:[
        "Board powers and reserved shareholder matters; ordinary vs special resolutions; quorum, notice and minutes at a practical level.",
        "Issue/allotment of securities: private placement, preferential issue, rights issue and the interaction with Section 42 and Section 62.",
        "Share transfers, restrictions in articles/shareholders agreements, pre-emption and the difference between transfer and fresh issuance.",
        "Sections commonly worth issue-spotting: 179, 180, 184, 185, 186, 188, 42, 62, 68, 89/90 and schemes under 230–232; know the purpose before memorising mechanics.",
        "Related-party transactions, loans/guarantees/security and director-interest conflicts: identify when approvals or abstentions may matter.",
        "Why SHA rights should be reflected in constitutional documents where enforceability against the company or future shareholders matters.",
        "Beneficial ownership/SBO checks and cap-table hygiene as diligence items."
      ],
      anchors:[
        "Do not bluff a section number. State the principle first, then the section if you are sure.",
        "Always ask: company type, listed/unlisted, public/private, shareholder profile, articles, existing investor rights and whether securities are being issued or transferred."
      ],
      drills:[
        "A foreign PE fund is subscribing to new shares in an Indian private company. What corporate-law questions do you ask first?",
        "What is the practical difference between a rights issue and a preferential allotment?",
        "Why do transaction lawyers care about the articles of association?",
        "When can a director conflict matter on a deal?"
      ],
      traps:["Assuming the board can approve everything.","Ignoring existing articles/SHA restrictions.","Treating issuance and transfer as legally identical."]
    },
    {
      id:"spa", tier:"CORE", mins:75, title:"3. SPA / SSA / SHA drafting and risk allocation",
      why:"This is the single highest-yield practical module for a corporate/M&A interview.",
      know:[
        "SPA architecture: definitions → sale/purchase → price → conditions → pre-closing covenants → closing → warranties → indemnities → limitations → termination → confidentiality/restrictive covenants → boilerplate.",
        "Warranty vs indemnity: warranty allocates risk through a contractual statement and damages framework; indemnity is a promise to compensate for specified loss. Explain the practical negotiation difference.",
        "Disclosure: general/specific disclosures, disclosure letter, data-room disclosure and why sellers qualify warranties.",
        "Liability architecture: de minimis, basket/deductible, cap, survival periods, fundamental warranties, tax claims, fraud carve-out, mitigation, double recovery and third-party claims procedure.",
        "Price mechanisms: fixed price, completion accounts, locked-box, leakage protection, earn-outs, holdbacks and escrow.",
        "CPs vs covenants vs conditions subsequent; bring-down of warranties; MAC clauses; ordinary-course covenants; long-stop date.",
        "SHA rights: governance/reserved matters, information rights, transfer restrictions, ROFR/ROFO, tag, drag, anti-dilution, exit rights and deadlock.",
        "Boilerplate that interviewers love: assignment, entire agreement, waiver, severability, notices, counterparts, further assurances, governing law and dispute resolution."
      ],
      anchors:[
        "When asked to mark up a clause: identify whose side you act for, the risk, the proposed edit and the commercial fallback.",
        "A clause is not 'buyer-friendly' or 'seller-friendly' in the abstract; explain what risk it allocates and why."
      ],
      drills:[
        "Explain warranties and indemnities to a business client.",
        "What is a locked-box and why would a seller like it?",
        "What are tag and drag rights?",
        "What would you negotiate in an indemnity clause for a buyer?",
        "What is a MAC clause and why is it contentious?"
      ],
      traps:["Saying indemnity automatically gives rupee-for-rupee recovery in every case.","Ignoring limitation language.","Confusing ROFR and ROFO.","Treating boilerplate as unimportant."]
    },
    {
      id:"pe-vc", tier:"CORE", mins:50, title:"4. Private equity / VC economics and investor rights",
      why:"Mumbai M&A teams frequently overlap with PE. You should understand the economics behind the documents.",
      know:[
        "Primary vs secondary investment; pre-money vs post-money valuation; dilution; fully diluted share capital and cap tables.",
        "Common instruments: equity, CCPS and CCDs; distinguish economic terms from legal/regulatory characterisation.",
        "Liquidation preference: participating/non-participating, multiple, seniority and conversion economics.",
        "Anti-dilution: broad concept of weighted-average vs full-ratchet; understand why down-round protection matters.",
        "Founder restrictions: vesting, lock-in, non-compete/non-solicit where enforceable, good leaver/bad leaver and ESOP pool.",
        "Governance: board seats, observer rights, reserved matters/affirmative votes and information rights.",
        "Exit: IPO, strategic sale, secondary, buyback, drag/tag; explain why some contractual exits can face enforceability or regulatory constraints."
      ],
      anchors:["Always connect a right to the investor's risk: downside protection, governance, information or exit.","Be able to calculate simple dilution and ownership after a primary issuance."],
      drills:[
        "A fund invests ₹100 crore at a ₹400 crore pre-money valuation. What percentage does it own post-money, ignoring other dilution?",
        "Why would an investor ask for liquidation preference?",
        "Difference between a primary and secondary transaction?",
        "Why are reserved matters negotiated?"
      ],
      traps:["Confusing company valuation with enterprise value.","Assuming every exit right is mechanically enforceable.","Ignoring FEMA or Companies Act constraints on instrument terms."]
    },
    {
      id:"fema", tier:"CORE", mins:75, title:"5. FEMA / FDI / cross-border M&A",
      why:"Almost every serious Indian M&A practice tests foreign-investment issue spotting.",
      know:[
        "Start with residency: who is resident/non-resident, what instrument is being issued/transferred and whether the investment is repatriable.",
        "NDI framework: entry route, sectoral cap, prohibited sectors, conditionalities, beneficial ownership/land-border screening and downstream investment.",
        "Pricing guidelines differ depending on direction of transfer. Know the floor/ceiling logic rather than memorising formulas you cannot defend.",
        "Reporting: recognise FC-GPR for issue and FC-TRS for transfer; know that reporting and authorised-dealer bank process are transaction-critical.",
        "Deferred consideration / escrow / seller indemnity in resident–non-resident equity transfers: current RBI framework permits up to 25% of total consideration for up to 18 months, subject to conditions and pricing compliance.",
        "Press Note 3 land-border framework was revised in 2026. For an interview, flag government-route/beneficial-owner screening and verify the latest text before giving a definitive answer.",
        "Cross-border deals can also trigger sector regulators, CCI, tax, securities and sanctions/KYC analysis."
      ],
      anchors:[
        "RBI Master Direction on Foreign Investment in India is a primary reference; FEMA/NDI rules prevail if inconsistent.",
        "Never answer 'FDI is allowed' without asking the sector, route, cap, investor/beneficial owner, instrument, price and approvals."
      ],
      drills:[
        "A US fund buys shares from an Indian founder. Give me the FEMA checklist.",
        "What are FC-GPR and FC-TRS?",
        "Why do pricing guidelines matter in an SPA?",
        "How can FEMA affect escrow or indemnity drafting?"
      ],
      traps:["Using old FDI policy without checking later press notes.","Treating FEMA reporting as a post-closing afterthought.","Ignoring beneficial ownership and sector-specific conditions."],
      sources:[
        {n:"RBI — Master Direction: Foreign Investment in India",u:"https://www.rbi.org.in/scripts/FS_Notification.aspx?Id=11200"},
        {n:"DPIIT — FDI policy / press notes",u:"https://www.dpiit.gov.in/"}
      ]
    },
    {
      id:"listed", tier:"CORE", mins:75, title:"6. Listed-company M&A: SAST, LODR, PIT and securities overlays",
      why:"Even if the role is private M&A, partners expect you to recognise when listed-company rules change the transaction completely.",
      know:[
        "SAST core triggers: acquisition reaching 25% or more voting rights; acquisition of control is an independent trigger; holders at 25% or more but below maximum permissible non-public shareholding generally face the 5% annual creeping-acquisition trigger.",
        "Understand persons acting in concert, direct vs indirect acquisition, exemptions and why open-offer analysis starts early.",
        "LODR: material-event disclosure, board/shareholder approvals, related-party and governance overlays; exact obligations depend on the transaction and issuer.",
        "PIT: unpublished price sensitive information, trading restrictions, structured digital database and deal-team information controls.",
        "ICDR/preferential issue and pricing rules can matter where consideration or fund-raising uses listed shares.",
        "Schemes of arrangement for listed companies require Companies Act plus SEBI/stock-exchange overlays.",
        "Delisting, buyback and open-offer regimes are separate but can interact with control transactions."
      ],
      anchors:["Say '25% / control / creeping acquisition' before diving into detail.","Listed-company M&A is timetable-sensitive because announcement, disclosure, pricing and regulatory steps interact."],
      drills:[
        "What can trigger an open offer under SAST?",
        "What is control and why can it matter even below 25%?",
        "Why does insider-trading law matter during M&A negotiations?",
        "A listed target issues shares to the buyer. What extra regimes do you think about?"
      ],
      traps:["Assuming only share percentage can trigger SAST.","Ignoring indirect acquisitions/PACs.","Giving stale pricing/timetable rules from memory."],
      sources:[{n:"SEBI — Regulations index (current SAST/LODR/PIT/ICDR texts)",u:"https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=3"}]
    },
    {
      id:"cci", tier:"CORE", mins:70, title:"7. Competition law / CCI merger control",
      why:"Merger-control analysis is a classic Tier-1 interview test because it combines thresholds, control, timing and deal drafting.",
      know:[
        "Ask whether the transaction is an acquisition/merger/amalgamation and whether it crosses Section 5 thresholds or the deal-value threshold.",
        "Deal-value threshold: more than ₹2,000 crore plus substantial business operations in India can require notification even where ordinary asset/turnover thresholds are not met.",
        "Current small-target/de minimis benchmark: target assets in India not more than ₹450 crore OR turnover in India not more than ₹1,250 crore; do not assume it defeats a deal-value-threshold filing.",
        "Standstill/gun-jumping: a notifiable combination should not be implemented before approval/deemed approval, subject to statutory exceptions.",
        "Current statutory outer review period is 150 days; CCI's prima facie opinion timeline is 30 days, subject to the statutory framework.",
        "Green Channel provides deemed approval for qualifying no-overlap combinations; eligibility analysis matters.",
        "Control can include material influence; minority investments are not automatically outside merger control.",
        "Translate CCI analysis into SPA drafting: condition precedent, cooperation covenant, long-stop date, efforts standard, remedies and termination allocation."
      ],
      anchors:["Threshold analysis is only step one; ask about control and overlaps.","Always connect merger control to signing-closing gap and CP drafting."],
      drills:[
        "What is the deal-value threshold and why was it introduced?",
        "What is gun-jumping?",
        "Can a minority investment require CCI approval?",
        "How would CCI risk show up in an SPA?"
      ],
      traps:["Relying only on target exemption without checking DVT.","Assuming 49% means no control.","Confusing notification with approval."],
      sources:[
        {n:"CCI — Combinations Regulations, 2024",u:"https://www.cci.gov.in/combination/legal-framwork/regulations/details/12/0"},
        {n:"CCI — Combination filing / current thresholds",u:"https://cci.gov.in/combination/combination/filing-of-combination-notice/introduction"}
      ]
    },
    {
      id:"dd", tier:"CORE", mins:65, title:"8. Legal due diligence and red-flag thinking",
      why:"Interviewers want to know whether you can turn documents into transaction consequences.",
      know:[
        "Corporate: incorporation, charter documents, cap table, issuances/transfers, registers, beneficial ownership, board/shareholder approvals and investor rights.",
        "Material contracts: change of control, termination, exclusivity, MFN, assignment, consent, pricing, unusual liability and key-customer/vendor concentration.",
        "Financing/security: debt documents, covenants, security, guarantees, change-of-control/prepayment and lender consent.",
        "Litigation/investigations: quantify exposure, injunction risk, business interruption, regulatory consequences and disclosure/indemnity response.",
        "Employment: key employees, incentives, restrictive covenants, employee claims, social-security compliance and change-in-control payouts.",
        "IP/technology/data: title, licences, open-source risk, cybersecurity, personal data, data-transfer obligations and key software dependencies.",
        "Real estate/environment/sector licences where material.",
        "Every red flag should answer: fact → rule/contract → risk → value/timing impact → proposed protection."
      ],
      anchors:["A DD report is not a document inventory.","Materiality is contextual: value, closing certainty, business continuity, regulatory exposure and reputational risk."],
      drills:[
        "You find a key customer contract with a change-of-control consent. What do you do?",
        "What belongs in a red-flag DD report?",
        "How does DD feed into SPA warranties, indemnities and CPs?",
        "What would you review first in a data room if time is limited?"
      ],
      traps:["Listing missing documents without explaining why they matter.","Treating every issue as equally material.","Failing to convert diligence into drafting/price/closing actions."]
    },
    {
      id:"closing", tier:"HIGH", mins:45, title:"9. Conditions, signing, closing and post-closing mechanics",
      why:"This distinguishes candidates who understand a transaction from candidates who only know doctrine.",
      know:[
        "CP checklist: regulatory approvals, corporate approvals, third-party/lender consents, restructuring steps, financing, key contracts and no-prohibition conditions.",
        "Closing deliverables: transfer instruments, board actions, resignations/appointments, certificates, funds flow, escrow release, share certificates/demat steps and updated registers.",
        "Closing agenda and responsibility matrix: owner, dependency, evidence and status.",
        "Long-stop date, waiver rights, satisfaction standards and consequences of failure.",
        "Conditions subsequent and post-closing filings should be exceptional and consciously allocated.",
        "Closing set/bible and audit trail matter because years later the client may need proof of what happened."
      ],
      anchors:["If a CP is outside your client's control, negotiate cooperation and objective satisfaction mechanics.","A junior should always know what remains open, who owns it and whether it blocks closing."],
      drills:["Build a five-item CP list for a cross-border acquisition.","What goes into a closing agenda?","What is a long-stop date?","Why might a party waive a CP?"],
      traps:["Confusing CPs with warranties.","Forgetting evidence of satisfaction.","Using vague 'satisfactory to buyer' language without considering objectivity."]
    },
    {
      id:"finance", tier:"CORE", mins:55, title:"10. Finance, valuation and accounting literacy for M&A lawyers",
      why:"You do not need to be an investment banker, but you must understand the numbers driving price and covenants.",
      know:[
        "Enterprise value vs equity value; bridge for debt, cash and debt-like items.",
        "EBITDA, revenue, net debt, working capital and why completion accounts adjust price.",
        "Pre-money/post-money, dilution and cap-table maths.",
        "Debt-free/cash-free deals and normalised working-capital concepts.",
        "Locked-box date, permitted leakage and value accrual/ticking fee concepts.",
        "Earn-outs: metric definition, accounting policy, control of business, information rights and manipulation risk.",
        "Basic financing awareness: acquisition debt, security, guarantee, change-of-control and funds-flow certainty."
      ],
      anchors:["A legal term often protects a financial assumption. Ask which number the clause is protecting.","Be comfortable doing simple ownership and price-bridge calculations aloud."],
      drills:["Difference between enterprise value and equity value?","Why does working capital affect purchase price?","What is permitted leakage?","Why are earn-outs dispute-prone?"],
      traps:["Calling revenue profit.","Confusing EV with market capitalisation.","Ignoring accounting-policy definitions in earn-outs/completion accounts."]
    },
    {
      id:"tax-stamp", tier:"HIGH", mins:35, title:"11. Tax, stamp duty and structure: issue spotting, not tax advice",
      why:"M&A lawyers are expected to know when structure has tax/stamp consequences and when specialist advice is needed.",
      know:[
        "Share sale vs asset/business transfer can create very different tax, GST and stamp consequences.",
        "Withholding, capital gains, treaty/beneficial-owner and indirect-transfer issues can arise in cross-border deals.",
        "Stamp duty can depend on instrument, state and structure; never quote a rate unless you have checked the current law.",
        "Tax indemnity, pre-closing tax covenant, tax warranties and control of tax claims are standard allocation tools.",
        "Schemes, slump sales, internal reorganisations and share swaps require early tax input.",
        "Your interview job is to spot the issue and identify the next question, not improvise tax advice."
      ],
      anchors:["Say 'I would involve tax counsel, but the transaction issue is…' and then explain the consequence.","Never assume a tax-efficient structure is corporate/regulatory-efficient."],
      drills:["Why can structure change stamp duty?","What is a tax indemnity for?","Why would a cross-border SPA contain withholding mechanics?"],
      traps:["Guessing tax rates.","Treating tax as a closing checklist item instead of a structuring input."]
    },
    {
      id:"ibc", tier:"HIGH", mins:45, title:"12. Distressed M&A / IBC",
      why:"Distressed acquisitions appear in major corporate practices and test whether you understand a statutory sale process.",
      know:[
        "CIRP architecture: admission → moratorium → IRP/RP → claims/CoC → invitation/evaluation of plans → CoC approval → NCLT approval/implementation.",
        "Section 29A eligibility is a threshold diligence point for resolution applicants.",
        "Section 32A can protect the corporate debtor/property from specified pre-CIRP offence consequences after qualifying change in control, but it is not a blanket immunity for wrongdoers.",
        "Resolution-plan acquisition differs from ordinary SPA M&A: process, creditor voting, tribunal approval, information quality, warranties and clean-slate questions differ.",
        "IBC was amended again in 2026. Verify the current Act/regulations and do not rely on stale timelines or pre-amendment notes."
      ],
      anchors:["Distressed M&A is process-driven and court/CoC supervised; execution risk is different from bilateral M&A.","Separate liabilities of the corporate debtor from liabilities of former management/promoters."],
      drills:["What is Section 29A?","Why might a buyer prefer an IBC resolution process?","What does Section 32A broadly do?","How is IBC M&A different from an SPA deal?"],
      traps:["Saying NCLT approval automatically cures every liability.","Using old CIRP timelines without checking the 2026 position."],
      sources:[{n:"IBBI — current Code, regulations, circulars and 2026 amendments",u:"https://ibbi.gov.in/"}]
    },
    {
      id:"special-dd", tier:"HIGH", mins:45, title:"13. Data/privacy, employment, IP, real estate and sector licences",
      why:"Modern M&A diligence is multidisciplinary. You should know what to escalate even if another specialist leads it.",
      know:[
        "Data/privacy: map personal data, processing basis/consent, processor contracts, security incidents, cross-border/vendor arrangements and transaction-specific data-room sharing.",
        "DPDP Rules, 2025 were notified with phased commencement. Treat privacy compliance and implementation status as a current diligence issue; verify what is in force on interview day.",
        "Employment: key-person dependency, incentive plans, statutory dues, contractor classification, employee litigation and change-in-control benefits.",
        "IP: chain of title from founders/employees/vendors, licences, encumbrances, open-source software and brand/domain ownership.",
        "Real estate: title/lease, use permissions, encumbrances, material consents and termination/change-of-control terms.",
        "Sector licences: financial services, insurance, telecom, defence, media, pharma and other regulated sectors can require regulator-specific approvals."
      ],
      anchors:["You are not expected to know every specialist rule; you are expected to recognise when the deal needs a specialist.","Ask whether the licence/contract survives a change in ownership or control."],
      drills:["What data-protection issues arise in a data room?","What IP documents would you verify for a software company?","Why do employment incentives matter to an acquisition?"],
      traps:["Assuming ownership of code because the company paid for it.","Ignoring sector-regulator change-of-control approvals."],
      sources:[{n:"MeitY — DPDP Rules 2025 and enforcement timeline",u:"https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digit"}]
    },
    {
      id:"advanced", tier:"EDGE", mins:55, title:"14. Schemes, JVs, delisting, buybacks and advanced structures",
      why:"These topics are less universal but separate a very well-prepared candidate from a merely competent one.",
      know:[
        "Schemes of arrangement under Sections 230–232: tribunal process plus SEBI/stock-exchange overlays for listed companies.",
        "Fast-track merger concept under Section 233 and when an internal reorganisation may use a different route.",
        "Joint ventures: governance, business plan/funding obligations, reserved matters, deadlock, transfer/exit and non-compete/confidentiality.",
        "Buyback and capital reduction: know they are distinct statutory mechanisms with solvency, approval and securities-law consequences.",
        "Delisting: control transaction may interact with SAST, delisting rules, public shareholder process and price discovery.",
        "Share swaps and rollover equity: think valuation, issuance approvals, FEMA/CCI/listed-company rules and tax.",
        "Warranty & indemnity insurance: why it can bridge seller clean-exit and buyer recourse, and what it does not replace."
      ],
      anchors:["Advanced structures are chosen for a commercial objective; begin with the objective, not the mechanism."],
      drills:["Why use a scheme instead of a simple share purchase?","What are the main legal issues in a 50:50 JV?","How can delisting interact with a takeover?"],
      traps:["Treating schemes as simple contracts.","Ignoring deadlock design in JVs."]
    },
    {
      id:"commercial", tier:"CORE", mins:45, title:"15. Commercial awareness and discussing live deals",
      why:"A Tier-1 interviewer often cares more about whether you can think commercially than whether you can recite sections.",
      know:[
        "Prepare three deals: one strategic M&A, one PE/VC or fund transaction, and one regulated/listed/competition-heavy transaction.",
        "For each deal know: parties, sector, value, structure, strategic rationale, financing, advisers, key regulatory issues and what you would ask if advising one side.",
        "Translate macro themes into legal work: rates/financing, IPO markets, antitrust, FDI policy, distressed assets, digital regulation and sector consolidation.",
        "Have a view, but distinguish fact from inference. Say what is known, what you infer and what you would verify.",
        "Use CorpLawTracker's live deal feed and firm pages to make this firm-specific."
      ],
      anchors:["The best deal answer is not a news summary; it identifies the legal work generated by the commercial event.","Never pretend you read a deal document you did not read."],
      drills:["Tell me about a recent deal that interested you and why.","What legal issues would you expect in that deal?","What current regulatory development is most relevant to M&A practice?"],
      traps:["Naming a headline but not the deal structure.","Giving a political/economic opinion without connecting it to client work."]
    },
    {
      id:"practical", tier:"CORE", mins:70, title:"16. Practical tests: drafting, clause review, DD note and research",
      why:"Many strong firms test output, not memory.",
      know:[
        "Clause review: identify client side, issue, consequence, edit, fallback and drafting consistency.",
        "Email task: answer first, then reasoning, then action/deadline; use short paragraphs and precise defined terms.",
        "DD note: fact → risk → materiality → recommendation. Avoid long legal essays.",
        "Research task: issue statement → primary law → regulator/case → application → caveat → source links. Know when to stop.",
        "Proofreading: names, dates, defined terms, cross-references, numbers, schedules, signature blocks, formatting and version control.",
        "Word/PDF competence: track changes, compare, styles, numbering, TOC, comments, clean/blackline versions and metadata hygiene."
      ],
      anchors:["Under time pressure, correct structure beats extra volume.","If uncertain, flag the assumption and say how you would verify it."],
      drills:["Redraft a one-sided indemnity in favour of a seller.","Write a five-line email flagging a missing lender consent.","Summarise a 10-page order for a partner in six bullets."],
      traps:["Overwriting.","Changing commercial terms accidentally during a language clean-up.","Researching secondary articles before checking primary law."]
    },
    {
      id:"interview", tier:"CORE", mins:50, title:"17. Interview execution: CV, motivation, behavioural and partner questions",
      why:"Technical strength does not rescue an unfocused or unconvincing interview.",
      know:[
        "Know every line of your CV: what you did, what you personally owned, what you learned and one difficulty you handled.",
        "Why M&A? Give a concrete answer about transactions, business, negotiation, structure and team execution—not prestige.",
        "Why this firm/team? Use their recent matters, partner/practice profile, sector mix and training model.",
        "Prepare concise stories for mistake, conflict, pressure, leadership, detail orientation, feedback and competing deadlines.",
        "If you do not know law: state the issue you recognise, the principle you recall, what you would check and where you would look.",
        "Ask questions that reveal how the team works: junior ownership, matter mix, feedback, drafting exposure and team structure."
      ],
      anchors:["Aim for 45–90 second answers unless the interviewer drills down.","Never turn uncertainty into confident fabrication."],
      drills:["Why corporate/M&A?","Why this firm?","Tell me about a mistake.","What is the hardest piece of work you have done?","What would your previous supervisor say you need to improve?"],
      traps:["Generic prestige answers.","Claiming ownership of work you only observed.","Long autobiographical responses."]
    }
  ];

  const RAPID = [
    "Share sale vs asset sale — give three legal/commercial differences.",
    "Primary vs secondary investment.",
    "Signing vs closing.",
    "Warranty vs indemnity.",
    "CP vs covenant vs condition subsequent.",
    "Locked-box vs completion accounts.",
    "Tag vs drag.",
    "ROFR vs ROFO.",
    "What triggers an open offer under SAST?",
    "Why can control matter below 25%?",
    "What is gun-jumping?",
    "CCI deal-value threshold — state the rule.",
    "What is the small-target exemption and its DVT caveat?",
    "What are FC-GPR and FC-TRS?",
    "FEMA deferred consideration — what is the current 25% / 18-month concept?",
    "What is a disclosure letter?",
    "What belongs in a red-flag DD report?",
    "What is a change-of-control clause?",
    "Enterprise value vs equity value.",
    "Why does working capital affect price?",
    "What is liquidation preference?",
    "What is anti-dilution protection?",
    "What is Section 29A of the IBC?",
    "What is Section 32A broadly for?",
    "Why do SHA rights often need AoA alignment?",
    "What is a material adverse change clause?",
    "What are fundamental warranties?",
    "What is a long-stop date?",
    "What is an escrow holdback used for?",
    "Give the five stages of a typical M&A transaction.",
    "What would you check first in the articles of a target?",
    "How does legal DD change SPA drafting?",
    "What can lender consent do to a deal timetable?",
    "Why does PIT matter during listed M&A?",
    "What is a Green Channel CCI filing?",
    "Why can a minority acquisition still raise merger-control issues?",
    "What is permitted leakage?",
    "What is an earn-out and why can it create disputes?",
    "Name five closing deliverables.",
    "Discuss one recent deal: rationale → structure → law → risk → adviser work."
  ];

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]; }); }
  function slug(s){ return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
  function list(items){ return '<ul class="ac-list">' + items.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join("") + '</ul>'; }
  function sourceLinks(items){ if(!items || !items.length) return ""; return '<div class="ac-sources"><b>Primary/current sources:</b> ' + items.map(function(x){return '<a target="_blank" rel="noopener" href="'+esc(x.u)+'">'+esc(x.n)+' ↗</a>';}).join(" · ") + '</div>'; }

  function card(m){
    return '<article class="ac-module" data-tier="'+m.tier+'" data-search="'+esc((m.title+" "+m.why+" "+m.know.join(" ")+" "+m.drills.join(" ")).toLowerCase())+'">'+
      '<div class="ac-module-head">'+
        '<label class="ac-check"><input type="checkbox" data-progress="'+m.id+'"><span></span></label>'+
        '<button class="ac-toggle" aria-expanded="false">'+
          '<span class="ac-tier '+m.tier.toLowerCase()+'">'+m.tier+'</span>'+
          '<span class="ac-title">'+esc(m.title)+'</span>'+
          '<span class="ac-time">'+m.mins+' min</span>'+
          '<span class="ac-chev">⌄</span>'+
        '</button>'+
      '</div>'+
      '<div class="ac-body">'+
        '<p class="ac-why">'+esc(m.why)+'</p>'+
        '<div class="ac-grid"><div><h4>Must know</h4>'+list(m.know)+'</div><div><h4>Interview anchors</h4>'+list(m.anchors)+'<h4 class="ac-mt">Rapid-fire questions</h4>'+list(m.drills)+'</div></div>'+
        '<div class="ac-traps"><b>Common traps:</b> '+esc(m.traps.join(" · "))+'</div>'+
        sourceLinks(m.sources)+
      '</div>'+
    '</article>';
  }

  function styles(){
    const css = '.ac-shell{margin-top:4px}.ac-callout{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin:18px 0}.ac-callout strong{color:var(--accent)}.ac-callout p{color:var(--ink2);margin-top:7px}.ac-toolbar{position:sticky;top:66px;z-index:30;background:rgba(243,241,236,.94);backdrop-filter:blur(10px);padding:12px 0;border-bottom:1px solid var(--line);margin:8px 0 18px}.ac-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.ac-btn{border:1px solid var(--line);background:#fff;color:var(--ink2);border-radius:8px;padding:8px 11px;font:600 12px var(--sans);cursor:pointer}.ac-btn.on,.ac-btn:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}.ac-search{flex:1;min-width:210px;border:1px solid var(--line);background:#fff;border-radius:8px;padding:9px 11px;font:13px var(--sans);outline:none}.ac-search:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}.ac-progress{font:600 11px var(--mono);color:var(--ink3);white-space:nowrap}.ac-section{margin-top:26px}.ac-section-title{display:flex;justify-content:space-between;gap:14px;align-items:end;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px}.ac-section-title h3{font:700 22px var(--serif);letter-spacing:-.3px}.ac-section-title p{font-size:12.5px;color:var(--ink3);max-width:55ch}.ac-sprints{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.ac-sprint{background:#fff;border:1px solid var(--line);border-radius:11px;padding:14px}.ac-sprint b{display:block;font:700 15px var(--serif);margin-bottom:4px}.ac-sprint span{font-size:12.5px;color:var(--ink3);line-height:1.45}.ac-module{background:#fff;border:1px solid var(--line);border-radius:12px;margin:9px 0;overflow:hidden}.ac-module-head{display:flex;align-items:stretch}.ac-check{width:46px;display:grid;place-items:center;border-right:1px solid var(--line2);cursor:pointer}.ac-check input{display:none}.ac-check span{width:16px;height:16px;border:1.5px solid var(--accent);border-radius:4px}.ac-check input:checked+span{background:var(--accent);box-shadow:inset 0 0 0 3px #fff}.ac-toggle{flex:1;border:0;background:transparent;display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center;text-align:left;padding:14px 15px;cursor:pointer;color:inherit}.ac-tier{font:700 9px var(--mono);letter-spacing:.7px;border-radius:99px;padding:4px 7px}.ac-tier.core{background:#e8efe9;color:#285c36}.ac-tier.high{background:#f4efe4;color:#765b20}.ac-tier.edge{background:#eeeaf4;color:#5b477a}.ac-title{font:700 16px var(--serif)}.ac-time{font:600 10px var(--mono);color:var(--ink3)}.ac-chev{font-size:18px;color:var(--ink3);transition:transform .15s}.ac-toggle[aria-expanded="true"] .ac-chev{transform:rotate(180deg)}.ac-body{display:none;border-top:1px solid var(--line2);padding:16px 20px 20px 66px}.ac-module.open .ac-body{display:block}.ac-why{font-size:14px;color:var(--ink2);margin-bottom:14px;max-width:78ch}.ac-grid{display:grid;grid-template-columns:1.25fr 1fr;gap:28px}.ac-grid h4{font:700 11px var(--mono);letter-spacing:.7px;text-transform:uppercase;color:var(--accent);margin-bottom:7px}.ac-mt{margin-top:16px}.ac-list{margin:0;padding-left:18px}.ac-list li{font-size:13.5px;color:var(--ink2);margin:6px 0;line-height:1.5}.ac-traps{margin-top:14px;padding:10px 12px;background:var(--surface2);border-radius:8px;font-size:12.5px;color:var(--ink2)}.ac-sources{font-size:11.5px;color:var(--ink3);margin-top:12px}.ac-sources a{font-weight:600}.ac-drill{display:flex;gap:14px;align-items:start;background:var(--accent);color:#fff;border-radius:14px;padding:18px 20px}.ac-drill q{font:700 18px/1.35 var(--serif);quotes:none;flex:1}.ac-drill button{border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;border-radius:8px;padding:7px 10px;cursor:pointer}.ac-updates{display:grid;gap:9px}.ac-update{background:#fff;border:1px solid var(--line);border-radius:10px;padding:13px 15px}.ac-update .meta{font:700 9px var(--mono);letter-spacing:.7px;text-transform:uppercase;color:var(--ink3)}.ac-update h4{font:700 15px var(--serif);margin:4px 0}.ac-update p{font-size:12.8px;color:var(--ink2);margin-top:5px}.ac-update .prompt{border-left:2px solid var(--accent);padding-left:9px}.ac-update a{font-size:11.5px;font-weight:650}.ac-empty{font-size:13px;color:var(--ink3);font-style:italic;background:var(--surface2);border:1px dashed var(--line);border-radius:9px;padding:12px}.ac-master{display:grid;grid-template-columns:repeat(2,1fr);gap:7px 18px}.ac-master div{font-size:13px;color:var(--ink2);padding-left:18px;position:relative}.ac-master div:before{content:"✓";position:absolute;left:0;color:var(--accent);font-weight:700}@media(max-width:760px){.ac-sprints{grid-template-columns:1fr 1fr}.ac-grid{grid-template-columns:1fr}.ac-body{padding-left:18px}.ac-toggle{grid-template-columns:auto 1fr auto}.ac-time{display:none}.ac-master{grid-template-columns:1fr}.ac-toolbar{top:58px}.ac-section-title{display:block}.ac-section-title p{margin-top:4px}}';
    const s=document.createElement("style"); s.textContent=css; document.head.appendChild(s);
  }

  function renderUpdates(){
    const box=document.getElementById("academy-updates");
    if(!box) return;
    fetch("data/academy-updates.json",{cache:"no-store"}).then(function(r){ if(!r.ok) throw new Error("no feed"); return r.json(); }).then(function(j){
      const u=(j && j.updates || []).slice(0,8);
      if(!u.length){ box.innerHTML='<div class="ac-empty">No material Academy update today — by design. The nightly job only publishes a learning update when a new development clears the materiality threshold.</div>'; return; }
      box.innerHTML=u.map(function(x){
        return '<div class="ac-update"><div class="meta">'+esc(x.date||"")+" · "+esc(x.category||"Update")+'</div><h4>'+esc(x.headline||"")+'</h4><p>'+esc(x.why||"")+'</p><p class="prompt"><b>Interview angle:</b> '+esc(x.interviewPrompt||"")+'</p>'+(x.source?'<a target="_blank" rel="noopener" href="'+esc(x.source)+'">Primary/source link ↗</a>':"")+'</div>';
      }).join("");
    }).catch(function(){ box.innerHTML='<div class="ac-empty">The nightly material-update feed is not available yet.</div>'; });
  }

  function boot(){
    styles();
    const hero=document.querySelector(".hero h1");
    if(hero) hero.innerHTML='Mumbai Tier-1 M&A interviews. <em>Prepare like an associate.</em>';
    const lede=document.querySelector(".hero .lede");
    if(lede) lede.innerHTML='A full interview syllabus, rapid-review system and live market layer for serious Indian corporate/M&A recruiting. <b>No single resource can guarantee an interview outcome</b>, but this is designed to cover the high-probability legal, transactional, commercial and practical ground you should be ready to defend.';
    const first=document.querySelector('.goal[data-p="job"]');
    if(first){ first.querySelector(".gt").textContent="Master the M&A interview"; first.querySelector(".gd").textContent="Law, deal mechanics, drafting, DD, commercial awareness and drills."; }

    const panel=document.getElementById("p-job");
    if(!panel) return;
    panel.innerHTML =
      '<div class="ph"><span class="pn">01</span><h2>Mumbai Tier-1 M&A Interview Academy</h2></div>'+
      '<div class="ac-shell">'+
        '<div class="ac-callout"><div class="mono">What “comprehensive” means here</div><p>This is not a reading list. It is a <strong>defensible interview syllabus</strong>: what you should understand, what you should be able to explain in 60–90 seconds, the clauses and deal mechanics you should recognise, practical exercises you may be asked to perform, and the current-law points you must verify before an interview.</p></div>'+
        '<div class="ac-section"><div class="ac-section-title"><div><h3>Use the right sprint</h3><p>Choose the time you actually have. The filter below will hide lower-priority modules automatically.</p></div></div>'+
          '<div class="ac-sprints"><div class="ac-sprint"><b>30 minutes</b><span>Core anchors + random rapid-fire. Use immediately before the interview.</span></div><div class="ac-sprint"><b>2 hours</b><span>CORE modules only. Focus on deal map, SPA, FEMA, SAST, CCI and DD.</span></div><div class="ac-sprint"><b>48 hours</b><span>CORE + HIGH. Add finance, closing, IBC and specialist diligence.</span></div><div class="ac-sprint"><b>7+ days</b><span>Full curriculum + firm-specific live deals + practical drafting drills.</span></div></div>'+
        '</div>'+
        '<div class="ac-toolbar"><div class="ac-tools"><button class="ac-btn on" data-mode="ALL">Full</button><button class="ac-btn" data-mode="CORE">Core only</button><button class="ac-btn" data-mode="48H">48-hour</button><input class="ac-search" id="academy-search" placeholder="Search law, clause, issue or question…"><span class="ac-progress" id="academy-progress">0 / '+MODULES.length+' complete</span></div></div>'+
        '<div class="ac-section"><div class="ac-section-title"><div><h3>Non-negotiable master checklist</h3><p>If these twelve are weak, fix them before chasing edge topics.</p></div></div><div class="ac-callout"><div class="ac-master">'+
          ["Explain a deal from NDA to post-closing","Share sale vs asset sale vs primary issue","Warranty / indemnity / disclosure / limitations","CPs, covenants, closing and long-stop","Tag / drag / ROFR / ROFO / reserved matters","FEMA route, cap, price, reporting and cross-border checks","SAST 25% / control / creeping-acquisition triggers","CCI thresholds, DVT, standstill and SPA impact","Run a red-flag DD analysis","EV vs equity value / dilution / working capital","Discuss three recent deals intelligently","Defend every line of your CV and 'why this firm?'"].map(function(x){return "<div>"+esc(x)+"</div>";}).join("")+
        '</div></div></div>'+
        '<div class="ac-section"><div class="ac-section-title"><div><h3>Curriculum</h3><p>CORE = expected. HIGH = strong-candidate territory. EDGE = useful differentiation.</p></div></div><div id="academy-modules">'+MODULES.map(card).join("")+'</div></div>'+
        '<div class="ac-section"><div class="ac-section-title"><div><h3>Rapid-fire drill</h3><p>Answer aloud in under 60 seconds. Then ask yourself what changes in the document or timetable.</p></div></div><div class="ac-drill"><q id="academy-drill">'+esc(RAPID[0])+'</q><button id="academy-next">Next</button></div></div>'+
        '<div class="ac-section"><div class="ac-section-title"><div><h3>Nightly material updates</h3><p>Only developments that are plausibly interview-relevant are added. No filler for the sake of daily activity.</p></div></div><div class="ac-updates" id="academy-updates"><div class="ac-empty">Loading material updates…</div></div></div>'+
      '</div>';

    const saved=JSON.parse(localStorage.getItem("cltAcademyProgress")||"{}");
    panel.querySelectorAll("[data-progress]").forEach(function(cb){ cb.checked=!!saved[cb.dataset.progress]; });
    function progress(){
      const all=[].slice.call(panel.querySelectorAll("[data-progress]"));
      const done=all.filter(function(x){return x.checked;}).length;
      const out=document.getElementById("academy-progress"); if(out) out.textContent=done+" / "+all.length+" complete";
      const state={}; all.forEach(function(x){state[x.dataset.progress]=x.checked;}); localStorage.setItem("cltAcademyProgress",JSON.stringify(state));
    }
    progress();
    panel.addEventListener("change",function(e){ if(e.target && e.target.matches("[data-progress]")) progress(); });

    panel.querySelectorAll(".ac-toggle").forEach(function(b){ b.addEventListener("click",function(){
      const m=b.closest(".ac-module"); const open=!m.classList.contains("open"); m.classList.toggle("open",open); b.setAttribute("aria-expanded",String(open));
    }); });

    let mode="ALL";
    function apply(){
      const q=(document.getElementById("academy-search").value||"").trim().toLowerCase();
      panel.querySelectorAll(".ac-module").forEach(function(m){
        const tier=m.dataset.tier; const tierOK=mode==="ALL" || (mode==="CORE" && tier==="CORE") || (mode==="48H" && (tier==="CORE"||tier==="HIGH"));
        const searchOK=!q || (m.dataset.search||"").indexOf(q)!==-1;
        m.style.display=tierOK && searchOK ? "" : "none";
      });
    }
    panel.querySelectorAll("[data-mode]").forEach(function(b){ b.addEventListener("click",function(){
      mode=b.dataset.mode; panel.querySelectorAll("[data-mode]").forEach(function(x){x.classList.toggle("on",x===b);}); apply();
    }); });
    document.getElementById("academy-search").addEventListener("input",apply);
    document.getElementById("academy-next").addEventListener("click",function(){
      const q=RAPID[Math.floor(Math.random()*RAPID.length)]; document.getElementById("academy-drill").textContent=q;
    });
    renderUpdates();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();