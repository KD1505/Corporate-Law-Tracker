# UK research edition
Editorial snapshot 24 November 2026. Independent static HTML at /uk.html; India remains at /. No shared data migration. The India prerender's sitemap list includes UK without treating it as Indian data. Transaction, briefing and regulation cards are generated from editorial JSON using node engine/uk/render.mjs. CI checks the generated output; Academy and firm cards, including reverse mandate links, are also generated from the same data.
 
## Evidence
Records include selected transactions and regulatory milestones, not exhaustive coverage. Disclosed investment figures are labelled by type and linked to their evidence; they are not aggregated into market totals. Event date is not necessarily announcement date. The December 2025 CMA guidance entry uses a month placeholder; do not interpret as an exact publication date. No unverified deal values or adviser names. Confirmed adviser work is scoped and linked to an explicit mandate announcement. Source links are direct; analysis is separated from fact. Firm links are programmes, not open vacancies. Objective quiz answers are original practice material. No AI, credentials or personal data leave the browser.
 
## Discovery
The CMA adapter uses documented GOV.UK Search API. It validates shape, restricts links to CMA case paths, deduplicates, bounds response size and attempts three timed requests. It retains the last good snapshot on failures; Actions logs expose failures. This is a discovery list, not verified deal data. Live endpoint response was not accessible through the research tool; do not claim ingestion is proven until Actions succeeds. No automated use of FCA NSM or commercial news sites until terms and technical access are reviewed. GOV.UK terms: https://www.gov.uk/help/terms-conditions. Search API docs: https://docs.publishing.service.gov.uk/repos/search-api/using-the-search-api.html.
 
## Checks
node --check uk/app.js; node --test engine/uk/test.mjs. Branch preview, then check root and UK on mobile/desktop, source links, search, quiz, refresh, and discovery status before merging. No destructive migrations. Revert the release commit to roll back. Next: canonical deal entity and event model, claim-level evidence, reviewed publication generator, richer historical backfill and verified recruitment opportunities; then live daily briefing and firm graph. No league tables until coverage supports them.

## Initial competitor evidence and positioning
Mergermarket (https://info.mergermarket.com/legal/) emphasises relationships, deal chronology and alerts. PitchBook (https://pitchbook.com/platform-data/deals) offers broad private-market screening. Practical Law (https://uk.practicallaw.thomsonreuters.com/Browse/Home/About/AboutUs) provides peer-reviewed practitioner resources. Chambers Student (https://chambers.com/student) and LawCareers.Net (https://www.lawcareers.net/commercial-awareness/welcome) combine firm and recruitment research with awareness. TCLA (https://www.thecorporatelawacademy.com/tcla-premium/) offers application and assessment preparation. The proposed differentiation is a single primary-source case-to-concept-to-interview workflow; no claim of parity on breadth, proprietary datasets or reviewed know-how. A fuller user study remains outstanding.

## Production verification
Main pushes trigger a separate live-browser job which waits for exact editorial JSON parity and then exercises the public domain. A failed job does not certify a release. Main pushes also trigger the first CMA discovery attempt, in addition to the daily schedule. Discovery output remains separate from editorial records.

## UK-first portal v2
Root and /uk.html generated from one editorial document; /india.html is the established India shell and all India nightly writers now target it. Legacy #/ India routes are forwarded. UK dossiers add typed values, parties, dated source-backed chronology, scoped mandates, commercial and legal-work analysis, watchlist and calendar. GOV.UK Content API enriches discovery separately; no auto-promotion to verified deals. Dossiers contain only bounded metadata and regulator-hosted PDF links, no personal contact data or copied full documents.

## Reading desk and official newswire
Curated reading desk links to dated analysis. Separate automated title/link feed queries GOV.UK organisation search and published Bank of England/PRA/FCA RSS endpoints; per-source success/failure and prior snapshots are retained. This is discovery, not editorial verification. No automated proprietary issuer feed or paywall access.
