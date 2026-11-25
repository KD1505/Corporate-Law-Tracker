# Evidence review inventory — tranche 02

Run `node engine/uk/commercial/evidence-inventory.mjs > /tmp/uk-evidence-review.json`. Derived from the current corpus; includes structured findings, typed figures, advisers, milestones, deadlines and core narrative fields, including unmapped statements. No private review notes included. CI rejects duplicate identities or unregistered links. It does not certify facts.

1. Review P0 deadlines/status first, then P1 economics, roles, chronology and legal/financial descriptions. Initial triage is not a comprehensive risk assessment.
2. Split compound items into atomic propositions. Verify amount/basis, party, role, date, status and jurisdiction against the actual original documents. Map precise page/section or paragraph. Do not attach unrelated sources simply to increase coverage.
3. Identify actual original issuer/author and derivative documents. Exact URL deduplication is not independent origin. Origin and reuse rights remain pending until assessed.
4. Record inventory ID, exact SHA-256 revision, atomic proposition, source URL and locator, origin group, reviewer identity/qualification, review date, decision and reason in an approved review system. Do not commit personal or confidential review notes to this public repository. Changed revision needs renewed review; changed identity labels create new IDs. Tool does not ingest decisions yet.
5. Correct or quarantine material errors, regenerate pages, test and record corrections. Keep discovery, editorial checking and independent qualified review distinct. No acceptance gate closes from inventory generation alone.

Baseline: 800 review items across 42 transactions; 174 with publisher and locator recorded, 397 document-only, 229 without explicit mapped evidence in this inventory. These counts are not exhaustive atomic claim coverage or factual accuracy.

## Source checks (tranche 03)
Run `node engine/uk/commercial/source-check-register.mjs` to evaluate `source-checks.json`. The register accepts AI-assisted checks only, with exact statement/evidence snapshots. Changed snapshots become stale; latest matching attempt counts once. Source extract support is not a current-status guarantee or qualified independent verification. Keep human reviewer identities and private notes outside this public repository. This does not yet ingest professional decisions or decompose compound claims.
