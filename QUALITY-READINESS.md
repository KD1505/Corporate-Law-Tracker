# CorpLawTracker — Quality-readiness register
_Last updated: 19 November 2026. Implementation status is not evidence that a legal professional has validated the results._

This is an *engineering progress register*, not a declaration that the product is already ready to charge. A paid professional product must demonstrate end-to-end accuracy, uptime, sourcing and repeat utility.

## Audit recommendations (35)

| No. | Recommendation | State | Relevant action or remaining gate |
|---|---|---|---|
| 1 | Clean law-firm database | Delivered; validate | Canonical law-firm registry, aliases, quarantine non-law firms, rebuild SEO pages |
| 2 | Replace false verified claims | Delivered; validate | Editorial/document/press evidence tiers on SPA and SEO pages |
| 3 | Separate routine filings from transactions | Delivered; tune | Quality gate, disclosure archive, reversible exclusions |
| 4 | One deal across its dated filings | Open | Permanent transaction ID + conservative document-to-event association |
| 5 | Remove non-functioning promises | Delivered partially | Fake email capture disabled, RSS exists; real email alerts not yet enabled |
| 6 | Eliminate regulator-portal confidence inflation | Delivered | Official filing URL treated separately from generic lookup pages |
| 7 | Fix transaction-value scale | Delivered | Rupee billion/cr conversion corrected; tested |
| 8 | Prioritize usefulness over raw records | Partial | Quality gate; usability-weighted editorial score needs testing |
| 9 | Separate completed from disclosed/announced | Partial | Selective downgrades and archival rules; full state-transition evidence required |
| 10 | Fix freshness timestamps | Partial | Latest data timestamp + source-failure telemetry; verify deploy status |
| 11 | Match monitoring claims to actual sources | Partial | Public wording corrected; BSE/NSE RSS retry implemented but not yet proven reachable in Actions |
| 12 | Fix broken primary documents | Queue created | Link repair prioritized; individual URL resolution required |
| 13 | Genuine document research at scale | Infrastructure, blocked | PDF extraction + quote checking; Anthropic API has insufficient billing credits |
| 14 | Editorial quality-control gate | Partial | Automated provenance and counsel filters; independent exception review needed |
| 15 | XSS and unsafe markup | Partial | Sanitized incoming text and URLs; specialist security test and enforcing CSP still required |
| 16 | Curated homepage | Partial | Source-quality filtering + separate archive, editorial significance ranking to improve |
| 17 | Standardized detailed transaction page | Partial | Rich facts and sources for curated cases, sparse pages reveal omissions |
| 18 | Company identity and historical aliases | Open | CIN, ISIN, NSE/BSE code, dated ownership changes |
| 19 | Advanced entity-aware legal search | Open | Structured counterparties, deal mechanics, laws and full roles |
| 20 | Semantic change intelligence | Partial | Append-only public research-record change log; underlying transaction event graph still needed |
| 21 | Dependable personal alerts | Blocked | Requires accounts, subscriber datastore, notifications and consent |
| 22 | Daily/weekly research brief | Partial | RSS daily feed delivered; human editorial ranking and email unimplemented |
| 23 | Claim-level citations | Partial | Editorial source-to-fact references; exact page/paragraph and quote-hash review still limited |
| 24 | Usable exports | Partial | Download complete deal JSON; Excel/PDF partner briefs pending |
| 25 | Deal-specific legal implications | Partial | Evidence-based Marico, Bajaj, Aegis and Lake Shore dossiers; broader backfill blocked |
| 26 | Reliable law-firm rankings | Partial | Non-firms blocked and aliases merged; deal sides/underreporting to validate |
| 27 | Transparent correction log | Partial | Deal-level report issue links; change log now distinguishes editorial revisions |
| 28 | Simplify navigation | Open | Discover / Research / Monitor / Analyse information architecture |
| 29 | Faster data delivery | Partial | Reduced feed, lazy deal JSON; page performance and mobile testing pending |
| 30 | Pipeline health observability | Partial | BSE/NSE attempt reports, link-repair queue, daily build status; alerts needed |
| 31 | Editorial review queue | Partial | Candidate classification and source repair queue; authenticated editor interface pending |
| 32 | Automated regression tests | Partial | Currency, evidence, counsel, routine-filing and RSS unit tests |
| 33 | Real lawyer usability testing | Not performed | Five independent research sessions + error/time-saving measurement |
| 34 | Audit every product promise | Partial | Corrected many explicit claims; full operational and privacy review pending |
| 35 | Commercial source rights | Not resolved | BSE/NSE information-vendor/licensing terms and third-party media permissions need legal review |

## Operational blockers

1. **BSE / NSE direct data collection**: CI previously logged BSE 403 and NSE network timeout. Official exchange RSS fallback now exists, but it cannot be counted as recovered until a successful run proves that new items arrive.
2. **Anthropic API billing**: Previous Actions logs show insufficient credits. Automated deep research therefore does not deliver the configured backlog enrichment.
3. **Email and alerts**: No verified mailing-list backend, opt-in storage, unsubscribe, delivery logs or user database. The actual product offers RSS instead of fake email success.
4. **Source permissions**: NSE's technical information-feed offerings and BSE information-product terms may require commercial licensing for redistribution/use in a paid product. Obtain permissions or legal analysis before charging for market data, rather than inferring that public accessibility authorizes paid redistribution.
5. **Customer testing**: Market readiness cannot be asserted without independent practitioner workflows, measurement and ongoing error corrections.

## Professional readiness acceptance criteria

- No placeholder/non-legal firm names on leaderboards and every displayed adviser role sourced;
- No known 1,000-fold value conversion errors or material misstatements about signed versus completed;
- Each flagship matter has working primary evidence and source-specific factual references;
- Freshness claims and actual collector successes match;
- Every subscription, monitoring and export promise functions end-to-end, or is clearly disabled;
- At least 5 professionals independently complete five meaningful tasks faster than their existing workflow;
- Data rights, privacy and security reviewed before any paid external onboarding.

**Current conclusion:** A meaningful platform-quality refactor is implemented, but this remains an active product-hardening programme rather than a finished monetizable research service.
