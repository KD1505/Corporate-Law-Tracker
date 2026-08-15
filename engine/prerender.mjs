/* ============================================================================
   prerender.mjs - make CorpLawTracker crawlable.

   The dashboard is a client-rendered SPA: a non-executing fetch (Googlebot,
   Bing, LLM crawlers, social scrapers) sees only the shell. This script emits a
   real, static, server-rendered HTML layer from data.js so the content is
   indexable - without changing the interactive app:

     • /d/<deal-id>.html   - one crawlable page per deal (content + meta + JSON-LD + links)
     • /firm/<slug>.html   - one page per law firm (its mandates + league position)
     • /deals.html         - crawlable index of every deal (link hub)
     • /firms.html         - crawlable index of every firm (link hub)
     • sitemap.xml + robots.txt
     • injects a static snapshot of the latest deals into index.html's #main
       (between <!--PRERENDER-START--> / <!--PRERENDER-END-->). The SPA overwrites
       #main on load, so JS users get the live app; crawlers keep the static HTML.
       This is progressive enhancement (same content), NOT cloaking.

   Run AFTER build.mjs / reenrich.mjs so pages carry the latest enrichment.
   USAGE:  node prerender.mjs
   ============================================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Location-robust: find the repo root by locating data.js, whether this file
// sits in engine/ or at the repo root (guards against mis-placed copies).
function findRoot() {
  for (const c of [path.resolve(__dirname, ".."), path.resolve(__dirname), process.cwd(), path.resolve(process.cwd(), "..")]) {
    try { if (fs.existsSync(path.join(c, "data.js"))) return c; } catch {}
  }
  return path.resolve(__dirname, "..");
}
const ROOT = findRoot();
const SITE = "https://www.corplawtracker.com";
const HOME_SNAPSHOT = 40; // deals baked into the homepage HTML

/* ---- load data ---- */
function loadData() {
  const src = fs.readFileSync(path.join(ROOT, "data.js"), "utf8");
  const window = {}; new Function("window", src)(window); return window.CLT_DATA || {};
}
const MONTHS = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
const pdate = t => { const m = String(t||"").match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/); return m ? new Date(+m[3],MONTHS[m[2]]??0,+m[1]) : new Date(0); };
const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const strip = s => String(s||"").replace(/<[^>]+>/g,"");
const clamp = (s,n) => { s=strip(s).trim(); return s.length>n ? s.slice(0,n-1).replace(/\s+\S*$/,"")+"…" : s; };
const slug = s => String(s||"").toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80);

const TYPE = { ma:"M&A / JV", ipo:"IPO / ECM", pe:"PE / VC", ibc:"IBC", reg:"Regulatory", bank:"Banking & Finance", lit:"Disputes" };
const STAGE = { rumoured:"Rumoured", announced:"Announced", review:"In regulatory review", completed:"Completed", filed:"Filed / open", ruling:"Ruling", inforce:"In force" };

const dealPath = d => `/d/${d.id}.html`;
const firmPath = n => `/firm/${slug(n)}.html`;
const dealFirms = d => [...new Set((d.firms||[]).map(f=>f.name).filter(Boolean))];

/* ---- shared shell ---- */
function page({ title, desc, canonical, jsonld, body, crumbs, noindex }) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${noindex?"noindex,follow":"index,follow"}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="CorpLawTracker"><meta property="og:image" content="${SITE}/og.png?v=1">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="CorpLawTracker - verified Indian corporate deal and regulatory intelligence, built only on primary filings.">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/og.png?v=1">
<link rel="icon" type="image/svg+xml" href="/logo.svg">
${jsonld?`<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`:""}
<style>
:root{--ink:#1c1b17;--ink2:#57534a;--ink3:#8e897c;--line:#e9e5db;--accent:#1b2d4f;--soft:#e9ecf3;--bg:#f6f4ef}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,'Segoe UI',Helvetica,Arial,sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:22px 20px 60px}
header.top{display:flex;align-items:center;gap:10px;padding:6px 0 18px;border-bottom:1px solid var(--line);margin-bottom:22px}
.mark{width:26px;height:26px;background:var(--accent);border-radius:6px;flex:none}
.brand{font-weight:700;letter-spacing:-.01em;color:var(--accent);text-decoration:none;font-size:16px}
.brand span{color:var(--ink3);font-weight:500}
.crumbs{font-size:12.5px;color:var(--ink3);margin-bottom:14px}
.skiplink{position:absolute;left:8px;top:-44px;z-index:99;background:var(--accent);color:#fff;font-size:13px;font-weight:600;padding:9px 15px;border-radius:0 0 8px 8px;text-decoration:none;transition:top .16s ease}
.skiplink:focus{top:0}
main:focus{outline:none}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:3px}
.crumbs a{color:var(--ink2);text-decoration:none}
h1{font-family:Georgia,serif;font-weight:600;font-size:27px;line-height:1.25;letter-spacing:-.01em;margin:0 0 12px}
h2{font-family:Georgia,serif;font-weight:600;font-size:20px;margin:30px 0 10px}
.meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 18px;font-size:12.5px;color:var(--ink2)}
.pill{display:inline-block;font:600 11px/1 -apple-system,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#fff;background:var(--accent);padding:4px 8px;border-radius:4px}
.tag{color:var(--ink3)}.ok{color:#0c8f5a;font-weight:600}.rep{color:#9a8f7a;font-weight:600}
.lead{font-size:16px;color:#33373d;margin:0 0 18px}
.why{border-left:3px solid var(--accent);padding:6px 0 6px 15px;margin:0 0 20px;background:var(--soft);border-radius:0 6px 6px 0}
.why b{display:block;font:600 10px/1 sans-serif;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin-bottom:6px;padding-top:6px}
.why span{display:block;padding-bottom:8px;padding-right:12px;color:#3a3f47;font-size:14.5px}
.kv{margin:0 0 18px;font-size:14px}.kv div{padding:6px 0;border-bottom:1px solid var(--line)}
.kv b{color:var(--ink3);font-weight:600;display:inline-block;min-width:120px}
.chips span{display:inline-block;font-size:12px;color:var(--ink2);background:#fff;border:1px solid var(--line);border-radius:20px;padding:3px 11px;margin:0 6px 6px 0}
ul.links{list-style:none;padding:0;margin:0}ul.links li{padding:7px 0;border-bottom:1px solid var(--line)}
a{color:var(--accent)}a.card{text-decoration:none;color:inherit;display:block}
a.card:hover .ct{text-decoration:underline}
.ct{font-weight:600;color:var(--ink)}.cs{font-size:12.5px;color:var(--ink3)}
.cta{display:inline-block;margin:22px 0 0;background:var(--accent);color:#fff;text-decoration:none;padding:11px 20px;border-radius:6px;font-weight:600;font-size:14px}
footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--line);font-size:12px;color:var(--ink3)}
footer a{color:var(--ink2);text-decoration:none}
</style></head><body><a class="skiplink" href="#content">Skip to main content</a><div class="wrap">
<header class="top" role="banner"><span class="mark" aria-hidden="true"></span><a class="brand" href="/">CorpLaw<span>Tracker</span></a></header>
${crumbs?`<nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>`:""}
<main id="content" tabindex="-1">
${body}
</main>
<footer role="contentinfo"><b>CorpLawTracker</b> - the decision engine for India's corporate legal market. Research and current-awareness only - not legal advice. Read the primary filing and the current text of the law before advising.<br>
<a href="/">Home</a> · <a href="/deals.html">Deals</a> · <a href="/firms.html">Firms</a> · <a href="/methodology.html">Methodology</a> · <a href="/coverage.html">Coverage</a> · <a href="/corrections.html">Corrections</a> · <a href="/about.html">About</a> · <a href="/contact.html">Contact</a> · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></footer>
</div></body></html>`;
}

/* ---- deal page ---- */
function dealPage(d, all) {
  const firms = dealFirms(d);
  const why = clamp(d.implication, 600);
  const rel = all.filter(x => x.id!==d.id && (x.sector===d.sector || dealFirms(x).some(f=>firms.includes(f)))).slice(0,6);
  const verified = d.verified ? `<span class="ok">✓ Verified</span>` : `<span class="rep">◔ Reported</span>`;
  const canonical = `${SITE}${dealPath(d)}`;
  const body = `
<h1>${esc(d.headline)}</h1>
<div class="meta"><span class="pill">${esc(TYPE[d.type]||d.type||"Deal")}</span>
<span class="tag">${esc(d.time||"")}</span>${d.value&&d.value!=="—"?`<span class="tag">· ${esc(d.value)}</span>`:""}
${d.stage&&STAGE[d.stage]?`<span class="tag">· ${esc(STAGE[d.stage])}</span>`:""}<span>· ${verified}</span></div>
<p class="lead">${esc(clamp(d.detail||d.sum,700))}</p>
${why?`<div class="why"><b>Why it matters</b><span>${esc(why)}</span></div>`:""}
<div class="kv">
${firms.length?`<div><b>Counsel</b>${firms.map(f=>`<a href="${firmPath(f)}">${esc(f)}</a>`).join(", ")}</div>`:""}
${d.sector?`<div><b>Sector</b>${esc(d.sector)}</div>`:""}
${d.value&&d.value!=="—"?`<div><b>Value</b>${esc(d.value)}</div>`:""}
</div>
${(d.framework&&d.framework.length)?`<div class="chips">${d.framework.map(f=>`<span>${esc(f)}</span>`).join("")}</div>`:""}
${(d.sources&&d.sources.length)?`<h2>Sources</h2><ul class="links">${d.sources.map(s=>`<li><a href="${esc(s.url)}" rel="nofollow">${esc(s.name)}</a>${s.official?" · official":""}</li>`).join("")}</ul>`:""}
<a class="cta" href="/#/deal/${encodeURIComponent(d.id)}">Open in the live tracker →</a>
${rel.length?`<h2>Related deals</h2><ul class="links">${rel.map(r=>`<li><a class="card" href="${dealPath(r)}"><span class="ct">${esc(r.headline)}</span><span class="cs">${esc(r.time||"")}${r.value&&r.value!=="—"?" · "+esc(r.value):""}</span></a></li>`).join("")}</ul>`:""}
`;
  const jsonld = { "@context":"https://schema.org", "@type":"NewsArticle", headline: strip(d.headline),
    datePublished: pdate(d.time).toISOString().slice(0,10), description: clamp(d.sum||d.detail,300), url: canonical,
    isAccessibleForFree:true, publisher:{ "@type":"Organization", name:"CorpLawTracker", url:SITE } };
  return page({ title:`${strip(d.headline)} | CorpLawTracker`, desc:clamp(d.implication||d.sum||d.detail,300),
    canonical, jsonld, crumbs:`<a href="/">Home</a> / <a href="/deals.html">Deals</a> / ${esc(clamp(d.headline,60))}`, body });
}

/* ---- firm page ---- */
function firmPage(name, deals, rank, total) {
  const list = deals.slice().sort((a,b)=>pdate(b.time)-pdate(a.time));
  const canonical = `${SITE}${firmPath(name)}`;
  const body = `
<h1>${esc(name)}</h1>
<div class="meta"><span class="pill">Law firm</span><span class="tag">${deals.length} deals tracked</span>${rank?`<span class="tag">· #${rank} of ${total} by deal count</span>`:""}</div>
<p class="lead">Corporate transactions and mandates on which ${esc(name)} has been named counsel, verified against primary filings and tracked by CorpLawTracker.</p>
<h2>Tracked mandates</h2>
<ul class="links">${list.map(d=>`<li><a class="card" href="${dealPath(d)}"><span class="ct">${esc(d.headline)}</span><span class="cs">${esc(d.time||"")}${d.value&&d.value!=="—"?" · "+esc(d.value):""}${d.sector?" · "+esc(d.sector):""}</span></a></li>`).join("")}</ul>
<a class="cta" href="/#/firm/${encodeURIComponent(name)}">Open in the live tracker →</a>
`;
  const jsonld = { "@context":"https://schema.org", "@type":"Organization", name, url:canonical,
    description:`${name} - ${deals.length} corporate-law mandates tracked by CorpLawTracker.` };
  return page({ noindex: deals.length < 5,
    title:`${name} - deals, mandates & league position | CorpLawTracker`,
    desc:`${name}: ${deals.length} tracked corporate mandates${rank?`, #${rank} of ${total} by deal count`:""}. Verified against primary filings.`,
    canonical, jsonld, crumbs:`<a href="/">Home</a> / <a href="/firms.html">Firms</a> / ${esc(name)}`, body });
}

/* ---- hub pages ---- */
function dealsIndex(all) {
  const body = `<h1>All tracked deals</h1><p class="lead">${all.length} corporate transactions and regulatory matters, newest first - each verified against primary filings.</p>
<ul class="links">${all.map(d=>`<li><a class="card" href="${dealPath(d)}"><span class="ct">${esc(d.headline)}</span><span class="cs">${esc(TYPE[d.type]||d.type||"")} · ${esc(d.time||"")}${d.value&&d.value!=="—"?" · "+esc(d.value):""}</span></a></li>`).join("")}</ul>`;
  return page({ title:"All tracked deals | CorpLawTracker", desc:`${all.length} verified Indian corporate deals and mandates, newest first.`,
    canonical:`${SITE}/deals.html`, crumbs:`<a href="/">Home</a> / Deals`, body });
}
function firmsIndex(firms) {
  const body = `<h1>Law firms</h1><p class="lead">${firms.length} firms named as counsel across tracked Indian corporate transactions, ranked by deal count.</p>
<ul class="links">${firms.map((f,i)=>`<li><a class="card" href="${firmPath(f.name)}"><span class="ct">${esc(f.name)}</span><span class="cs">#${i+1} · ${f.deals.length} deals tracked</span></a></li>`).join("")}</ul>`;
  return page({ title:"Law firms - league & mandates | CorpLawTracker", desc:`${firms.length} Indian corporate law firms ranked by tracked deal count.`,
    canonical:`${SITE}/firms.html`, crumbs:`<a href="/">Home</a> / Firms`, body });
}

/* ---- homepage snapshot (injected into #main) ---- */
function homeSnapshot(all) {
  const latest = all.slice(0, HOME_SNAPSHOT);
  // NOTE: homepage snapshot links use the SPA hash route, which ALWAYS resolves even if
  // the static /d/ pages haven't been committed yet. Crawlers reach the static deal pages
  // via sitemap.xml and the /deals.html hub instead. This makes index.html safe to deploy
  // on its own - it can never produce a 404.
  const items = latest.map(d=>`<article style="padding:14px 0;border-bottom:1px solid #e9e5db">
<a href="/#/deal/${encodeURIComponent(d.id)}" style="text-decoration:none;color:#1c1b17"><h3 style="font:600 17px/1.3 Georgia,serif;margin:0 0 5px">${esc(d.headline)}</h3></a>
<div style="font-size:12px;color:#8e897c;margin-bottom:6px">${esc(TYPE[d.type]||d.type||"")} · ${esc(d.time||"")}${d.value&&d.value!=="—"?" · "+esc(d.value):""}${dealFirms(d).length?" · "+esc(dealFirms(d).slice(0,2).join(", ")):""}</div>
<p style="font-size:13.5px;color:#41454c;margin:0">${esc(clamp(d.implication||d.sum||d.detail,220))}</p></article>`).join("");
  const jsonld = { "@context":"https://schema.org", "@type":"ItemList", name:"Latest Indian corporate deals | CorpLawTracker",
    itemListElement: latest.map((d,i)=>({ "@type":"ListItem", position:i+1, url:`${SITE}${dealPath(d)}`, name:strip(d.headline) })) };
  return `<!--PRERENDER-START--><section id="seo-snapshot" style="max-width:820px;margin:0 auto;padding:16px 4px">
<h1 style="font:600 22px/1.25 Georgia,serif;margin:0 0 4px">Verified deal &amp; regulatory intelligence for India's corporate legal market</h1>
<p style="color:#57534a;font-size:14px;margin:0 0 6px">Who advised whom, what it means, and what's on the regulators' desk - every item sourced to a primary filing. <a href="/deals.html">All deals</a> · <a href="/firms.html">Law firms</a>.</p>
${items}
<script type="application/ld+json">${JSON.stringify(jsonld)}</script></section>
<script>/* Progressive enhancement: crawlers (no JS) keep the static content above; browsers
hide it immediately so the live app renders instead of flashing a static list while data.js loads. */
(function(){var n=document.getElementById('seo-snapshot');if(n)n.style.display='none';})();</script><!--PRERENDER-END-->`;
}


/* ---- Governance pages (Red-Line 3 / Task 2.1) ----
   A partner must be able to find the operator, the editor, how to report an
   error, and what happens to their email - without asking anyone. These are
   generated so they are crawlable, not trapped in a modal. */
const EDITOR = "Kush Desai";                       // named, accountable editor
const CONTACT = "editor@corplawtracker.com";
const CORRECTIONS = "corrections@corplawtracker.com";

function govPage(slug,title,desc,body){
  return { slug, html: page({ title:`${title} | CorpLawTracker`, desc,
    canonical:`${SITE}/${slug}.html`, crumbs:`<a href="/">Home</a> / ${esc(title)}`,
    body:`<h1>${esc(title)}</h1>${body}` }) };
}

function governancePages(all, firms, updated){
  const verified = all.filter(d=>d.verified).length;
  const official = all.filter(d=>(d.sources||[]).some(s=>s.official)).length;
  const pctv = all.length?Math.round(verified/all.length*100):0;
  const pcto = all.length?Math.round(official/all.length*100):0;
  const dates = all.map(d=>pdate(d.time)).filter(d=>+d>0).sort((a,b)=>a-b);
  const range = dates.length?`${dates[0].toDateString().slice(4)} - ${dates[dates.length-1].toDateString().slice(4)}`:"—";

  return [
  govPage("about","About CorpLawTracker",
    "Who operates CorpLawTracker, what it tracks, and how it is built.",
    `<p class="lead">CorpLawTracker is a deal-and-regulatory intelligence service for India's corporate legal market. It tracks corporate transactions and regulatory developments, records which law firms advised whom, and links every item to the primary filing that evidences it.</p>
     <h2>Who operates it</h2><p>CorpLawTracker is operated and edited by <b>${esc(EDITOR)}</b>. Editorial responsibility for verification decisions and corrections rests with the named editor.</p>
     <h2>Who it is for</h2><p>Corporate partners and business-development teams, transactional associates, in-house and compliance counsel, and investors and advisers who need to know who is doing what in the Indian market - and be able to check it.</p>
     <h2>How it is built</h2><p>An automated pipeline ingests Indian corporate-law trade press and regulator feeds nightly, deduplicates against everything already tracked, structures each item (parties, value, counsel, stage), and links it to the statutes engaged. Items are then classified against the verification standard set out in the <a href="/methodology.html">methodology</a>.</p>
     <h2>What it is not</h2><p>It is a research and current-awareness tool. It is <b>not legal advice</b>, and it is not a substitute for reading the primary filing and the current text of the law.</p>
     <p><a href="/contact.html">Contact</a> · <a href="/corrections.html">Report an error</a></p>`),

  govPage("contact","Contact",
    "How to reach CorpLawTracker, including corrections and editorial queries.",
    `<p class="lead">We read everything sent to these addresses.</p>
     <h2>Editorial and general</h2><p><a href="mailto:${CONTACT}">${CONTACT}</a> - we aim to respond within one working day.</p>
     <h2>Corrections</h2><p><a href="mailto:${CORRECTIONS}">${CORRECTIONS}</a> - please include the item URL and the primary document. See the <a href="/corrections.html">corrections policy</a>.</p>
     <h2>Editor</h2><p>${esc(EDITOR)}</p>`),

  govPage("methodology","Methodology & verification standards",
    "How items reach CorpLawTracker, what each verification label asserts, coverage scope and known gaps.",
    `<p class="lead">What each label asserts, precisely - and what it does not.</p>
     <h2>What CorpLawTracker is</h2><p>A decision engine, not a clippings file. Items are machine-collected nightly, verified against primary filings where they exist, and labelled honestly when they don't.</p>
     <h2>Pipeline &amp; cadence</h2><p>An automated pipeline ingests Indian corporate-law trade press and regulator feeds nightly, deduplicates, structures each item, and links it to the statutes engaged. The "last run" date is the date of the last successful pipeline run. There is no intraday updating.</p>
     <h2>✓ Verified</h2><p>The matter is corroborated by a <b>specific official source</b> - the named company's BSE/NSE filing, a regulator's order or circular, or a court record - or has been editor-confirmed against such a filing. <b>A generic regulator portal is never treated as verification.</b></p>
     <h2>Reported</h2><p>Sourced to credible trade press but a specific primary filing has not yet been matched. Treat as press-level reliability and open the source before relying on it.</p>
     <h2>OFFICIAL</h2><p>A source is marked OFFICIAL only when its URL resolves to a government, regulator, exchange or court domain (SEBI, RBI, CCI, IBBI, MCA, BSE/NSE, NCLT, e-Courts, PIB and equivalents).</p>
     <h2>Coverage &amp; known gaps</h2>
     <p>Corpus at last build: <b>${all.length.toLocaleString()}</b> items · <b>${pctv}%</b> verified · <b>${pcto}%</b> carrying an official source · <b>${firms.length}</b> firms with attributed mandates · date range ${esc(range)}.</p>
     <p><b>Known gaps, stated plainly:</b> coverage is drawn from trade press and regulator feeds, so <b>firms that do not publicise mandates are systematically undercounted</b>. Private transactions with no filing obligation and no press release will not appear at all. Counsel attribution reflects what the source states; where a source names only one side, only that side is recorded. Exchange filings are ingested above a materiality threshold, so routine disclosures may be omitted.</p>
     <h2>Editorial responsibility</h2><p>Editor: <b>${esc(EDITOR)}</b>. Errors: <a href="/corrections.html">corrections policy</a>.</p>
     <h2>Limits</h2><p>Research and current-awareness only - <b>not legal advice</b>. Always read the primary filing and the current text of the law before advising.</p>`),

  govPage("corrections","Corrections",
    "CorpLawTracker's corrections policy and public corrections log. We do not silently edit.",
    `<p class="lead">We get things wrong. When we do, we fix the record and say so.</p>
     <p>Email <a href="mailto:${CORRECTIONS}">${CORRECTIONS}</a> with the item URL and the primary document. We aim to respond within <b>one working day</b> and to correct verified errors within <b>two</b>.</p>
     <p>Every correction is logged below with the original text, the corrected text and the date. <b>We do not silently edit.</b></p>
     <h2>Corrections log</h2>
     <table><caption>Published corrections</caption>
     <thead><tr><th scope="col">Date</th><th scope="col">Item</th><th scope="col">What was wrong</th><th scope="col">What it now says</th></tr></thead>
     <tbody><tr><td colspan="4">No corrections have been published yet. This log will record every one.</td></tr></tbody></table>`),

  govPage("coverage","Coverage &amp; method",
    "What CorpLawTracker covers, how much is verified, and where the known gaps are.",
    `<p class="lead">Live coverage statistics, and an honest account of what is missing.</p>
     <h2>Corpus</h2>
     <table><caption>Coverage at last build</caption>
     <tbody>
     <tr><th scope="row">Items tracked</th><td>${all.length.toLocaleString()}</td></tr>
     <tr><th scope="row">Verified against an official source</th><td>${verified.toLocaleString()} (${pctv}%)</td></tr>
     <tr><th scope="row">Carrying an official source link</th><td>${official.toLocaleString()} (${pcto}%)</td></tr>
     <tr><th scope="row">Firms with attributed mandates</th><td>${firms.length}</td></tr>
     <tr><th scope="row">Date range</th><td>${esc(range)}</td></tr>
     <tr><th scope="row">Last successful run</th><td>${esc(updated)}</td></tr>
     </tbody></table>
     <h2>Sources monitored</h2><p>Indian corporate-law trade press, and the BSE and NSE corporate-announcement feeds. Regulator sources: SEBI, RBI, CCI, IBBI, MCA, NCLT.</p>
     <h2>Known gaps</h2>
     <p>These are real and we would rather state them than have you discover them:</p>
     <ul class="links">
       <li>Firms that do not publicise mandates are <b>systematically undercounted</b>. Any ranking here measures our coverage, not market share.</li>
       <li>Private transactions with no filing obligation and no press coverage do not appear.</li>
       <li>Counsel attribution reflects what the source states. Where only one side is named, only that side is recorded.</li>
       <li>Exchange filings are ingested above a materiality threshold; routine periodic disclosures may be omitted by design.</li>
     </ul>
     <p><a href="/methodology.html">Full methodology →</a></p>`),

  govPage("privacy","Privacy notice",
    "What CorpLawTracker collects, why, and how to exercise your rights.",
    `<p class="lead">Short version: we collect an email address if you ask for the Brief, and we use it only to send the Brief.</p>
     <h2>Who is responsible</h2><p>CorpLawTracker, operated by <b>${esc(EDITOR)}</b>. Contact: <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
     <h2>What we collect</h2><ul class="links"><li>Your email address, if you subscribe to the Brief.</li><li>Standard server logs (IP address, user-agent) generated by our host in the ordinary course of serving the site.</li></ul>
     <h2>Why, and on what basis</h2><p>To send you the daily Brief you asked for (consent), and to operate and secure the site (legitimate interests / necessary for service operation).</p>
     <h2>Who processes it</h2><p>Our hosting provider (Vercel) and our email delivery provider. We do not sell or share your address.</p>
     <h2>How long we keep it</h2><p>Until you unsubscribe, plus 30 days.</p>
     <h2>Your rights</h2><p>You can ask for access to, correction of, or deletion of your data, and withdraw consent at any time - every email carries a one-click unsubscribe. Email <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
     <h2>International transfers</h2><p>Our host and email provider may process data outside India.</p>
     <h2>Grievances</h2><p>Email <a href="mailto:${CONTACT}">${CONTACT}</a> and we will respond within one working day.</p>`),

  govPage("terms","Terms of use",
    "Terms on which CorpLawTracker is made available, including limitation of reliance.",
    `<p class="lead">Please read these before relying on anything here.</p>
     <h2>Not legal advice</h2><p>CorpLawTracker is a research and current-awareness tool. Nothing on it is legal advice, and no lawyer–client relationship arises from using it. <b>Always read the primary filing and the current text of the law before advising.</b></p>
     <h2>No warranty of accuracy</h2><p>We work hard to be accurate and we publish our methodology and our corrections. We do not warrant that every item is complete or error-free. Verification labels describe our evidence, not a guarantee.</p>
     <h2>Sources and third-party content</h2><p>Headlines and short extracts are shown to identify and link to the underlying source, with attribution. Rights in third-party material remain with their owners. If you believe material has been used improperly, email <a href="mailto:${CONTACT}">${CONTACT}</a> and we will address it promptly.</p>
     <h2>Acceptable use</h2><p>Do not scrape the site at a rate that degrades it for others, and do not redistribute the corpus wholesale as your own product.</p>
     <h2>Changes</h2><p>These terms may change; the current version is always at this URL.</p>`)
  ];
}


/* ---- STAGE 1 of the data split (Task 1.3) -------------------------------
   Emits a lightweight search/filter index next to the existing data.js.
   data.js is left untouched, so the live app keeps working exactly as now.
   Stage 2 will switch the app to fetch this index instead of the 9.9 MB file.

   /data/index.json  - one compact row per deal: everything the feed, the
                       filters, the league table and search actually need.
                       Full prose (detail, timeline, docs) is deliberately
                       excluded; the deal page already carries it.          */
function writeDataIndex(all, firms, updated){
  const dir = path.join(ROOT, "data");
  fs.mkdirSync(dir, { recursive: true });
  const rows = all.map(d => ({
    id: d.id,
    u: dealPath(d),                                  // canonical page
    h: d.headline || "",
    s: clamp(d.sum || d.detail, 180),                // short summary only
    w: clamp(d.implication, 180) || undefined,       // why it matters
    t: d.type || "", g: d.geo || "", sec: d.sector || "",
    st: d.stage || "", v: d.value || "", d: d.time || "",
    i: d.imp || "", ver: d.verified ? 1 : 0,
    off: (d.sources || []).some(x => x.official) ? 1 : 0,
    f: dealFirms(d),                                 // counsel
    sc: d.score || 0,
    fw: (d.framework && d.framework.length) ? d.framework : undefined,
    // trimmed sources: name/url/official only. The feed needs these for the
    // verification chip and confidence meter; full prose lives in the per-deal file.
    src: (d.sources || []).map(x => ({ n: x.name, u: x.url, o: x.official ? 1 : 0 }))
  }));
  const payload = {
    updated, count: rows.length,
    firms: firms.map(f => ({ n: f.name, c: f.deals.length, u: firmPath(f.name) })),
    deals: rows,
    // small collections carried whole - together these are a few KB
    moves: DATA.MOVES || [], reg: DATA.REGITEMS || [],
    commentary: DATA.COMMENTARY || [], trends: DATA.TRENDS || [],
    linkcheck: DATA.LINKCHECK || null
  };
  const out = path.join(dir, "index.json");
  fs.writeFileSync(out, JSON.stringify(payload));

  /* Per-deal records, fetched on demand when a card is opened. These carry the
     fields the index deliberately omits (detail, sources, docs, timeline,
     framework), so the detail view loses nothing while the initial payload
     stays small. ~4 KB each; only ever one is fetched at a time. */
  const ddir = path.join(dir, "deals");
  fs.mkdirSync(ddir, { recursive: true });
  let wrote = 0;
  for (const d of all) {
    fs.writeFileSync(path.join(ddir, `${d.id}.json`), JSON.stringify(d));
    wrote++;
  }
  console.log(`  data/deals/: ${wrote} per-deal records`);
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  const srcKb = (fs.statSync(path.join(ROOT, "data.js")).size / 1024).toFixed(0);
  console.log(`  data/index.json: ${kb} KB for ${rows.length} deals (data.js is ${srcKb} KB)`);
  return { kb, srcKb };
}

/* ============================ MAIN ============================ */
const DATA = loadData();
const all = (DATA.DEALS||[]).slice().sort((a,b)=>pdate(b.time)-pdate(a.time));

// firms aggregate
const firmMap = new Map();
for (const d of all) for (const f of dealFirms(d)) { if(!firmMap.has(f)) firmMap.set(f,[]); firmMap.get(f).push(d); }
const firms = [...firmMap.entries()].map(([name,deals])=>({name,deals})).filter(f=>f.name && f.deals.length)
  .sort((a,b)=>b.deals.length-a.deals.length);

// write deal pages
const dDir = path.join(ROOT,"d"); fs.mkdirSync(dDir,{recursive:true});
for (const d of all) fs.writeFileSync(path.join(dDir,`${d.id}.html`), dealPage(d, all));
// write firm pages
const fDir = path.join(ROOT,"firm"); fs.mkdirSync(fDir,{recursive:true});
firms.forEach((f,i)=>fs.writeFileSync(path.join(fDir,`${slug(f.name)}.html`), firmPage(f.name, f.deals, i+1, firms.length)));
// hubs
fs.writeFileSync(path.join(ROOT,"deals.html"), dealsIndex(all));
fs.writeFileSync(path.join(ROOT,"firms.html"), firmsIndex(firms));
// governance pages - operator, editor, corrections, coverage, privacy, terms
const GOV = governancePages(all, firms, (DATA.UPDATED||"").replace(/^Updated\s+/,""));
writeDataIndex(all, firms, DATA.UPDATED || "");
for (const g of GOV) fs.writeFileSync(path.join(ROOT, g.slug + ".html"), g.html);

// sitemap + robots
const today = new Date().toISOString().slice(0,10);
const urls = [ `${SITE}/`, `${SITE}/deals.html`, `${SITE}/firms.html`, `${SITE}/academy.html`,
  ...GOV.map(g=>`${SITE}/${g.slug}.html`),
  ...all.map(d=>`${SITE}${dealPath(d)}`), ...firms.filter(f=>f.deals.length>=5).map(f=>`${SITE}${firmPath(f.name)}`) ];
fs.writeFileSync(path.join(ROOT,"sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + urls.map(u=>`  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n") + `\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT,"robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

// inject homepage snapshot between markers in index.html
const idxPath = path.join(ROOT,"index.html");
let idx = fs.readFileSync(idxPath,"utf8");
const snap = homeSnapshot(all);
const re = /<!--PRERENDER-START-->[\s\S]*?<!--PRERENDER-END-->/;
let idxChanged = false;
if (re.test(idx)) { idx = idx.replace(re, snap); idxChanged = true; }
else console.warn("prerender: PRERENDER markers not found in index.html - homepage snapshot NOT injected.");

/* Cache-bust the app bundle.
   app1..app6.js are served with a one-hour max-age, and the loader in
   index.html requests them at a fixed "?v=N". That meant a code change stayed
   invisible to anyone with a warm cache until the hour expired. Stamping the
   token on every run ties the URL to the deploy, so a new build is always
   picked up immediately and an unchanged one still caches normally. */
const stamp = new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + all.length;
const vre = /(fetch\(f\+"\?v=)[^"]*(")/;
if (vre.test(idx)) {
  const next = idx.replace(vre, `$1${stamp}$2`);
  if (next !== idx) { idx = next; idxChanged = true; }
  console.log(`prerender: app cache token set to ${stamp}`);
} else console.warn("prerender: app version token not found in index.html - app cache NOT busted.");

if (idxChanged) fs.writeFileSync(idxPath, idx);

console.log(`prerender: ${all.length} deal pages, ${firms.length} firm pages, ${GOV.length} governance pages, hubs, sitemap (${urls.length} urls), robots. Homepage snapshot: ${re.test(fs.readFileSync(idxPath,"utf8"))?"injected":"MISSING"}.`);
