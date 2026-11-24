# UK research edition
Editorial snapshot 24 November 2026. Independent static HTML at /uk.html; India remains at /. No shared data migration. The India prerender's sitemap list includes UK without treating it as Indian data. Editorial JSON is a structured mirror of the initial HTML; update both together (a generated publication layer is a next step).
 
## Evidence
Records are selected regulatory milestones, not exhaustive transactions. Event date is not necessarily announcement date. The December 2025 CMA guidance entry uses a month placeholder; do not interpret as an exact publication date. No unverified deal values or adviser names. Source links are direct; analysis is separated from fact. Firm links are programmes, not open vacancies. Objective quiz answers are original practice material. No AI, credentials or personal data leave the browser.
 
## Discovery
The CMA adapter uses documented GOV.UK Search API. It validates shape, restricts links to CMA case paths, deduplicates, bounds response size and attempts three timed requests. It retains the last good snapshot on failures; Actions logs expose failures. This is a discovery list, not verified deal data. Live endpoint response was not accessible through the research tool; do not claim ingestion is proven until Actions succeeds. No automated use of FCA NSM or commercial news sites until terms and technical access are reviewed. GOV.UK terms: https://www.gov.uk/help/terms-conditions. Search API docs: https://docs.publishing.service.gov.uk/repos/search-api/using-the-search-api.html.
 
## Checks
node --check uk/app.js; node --test engine/uk/test.mjs. Branch preview, then check root and UK on mobile/desktop, source links, search, quiz, refresh, and discovery status before merging. No destructive migrations. Revert the release commit to roll back. Next: canonical deal entity and event model, claim-level evidence, reviewed publication generator, richer historical backfill and verified recruitment opportunities; then live daily briefing and firm graph. No league tables until coverage supports them.
