/* ============================================================================
   prerender.mjs — make CorpLawTracker crawlable.

   The dashboard is a client-rendered SPA: a non-executing fetch (Googlebot,
   Bing, LLM crawlers, social scrapers) sees only the shell. This script emits a
   real, static, server-rendered HTML layer from data.js so the content is
   indexable — without changing the interactive app:

     • /d/<deal-id>.html   — one crawlable page per deal (content + meta + JSON-LD + links)
     • /firm/<slug>.html   — one page per law firm (its mandates + league position)
     • /deals.html         — crawlable index of every deal (link hub)
     • /firms.html         — crawlable index of every firm (link hub)
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
const ROOT = path.resolve(__dirname, "..");
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
function page({ title, desc, canonical, jsonld, body, crumbs }) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="CorpLawTracker"><meta property="og:image" content="${SITE}/logo.svg">
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
</style></head><body><div class="wrap">
<header class="top"><span class="mark"></span><a class="brand" href="/">CorpLaw<span>Tracker</span></a></header>
${crumbs?`<div class="crumbs">${crumbs}</div>`:""}
${body}
<footer><b>CorpLawTracker</b> — the decision engine for India's corporate legal market. Verified against primary filings; current-awareness, not legal advice.<br>
<a href="/">Home</a> · <a href="/deals.html">All deals</a> · <a href="/firms.html">Law firms</a></footer>
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
  return page({ title:`${strip(d.headline)} — CorpLawTracker`, desc:clamp(d.implication||d.sum||d.detail,300),
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
    description:`${name} — ${deals.length} corporate-law mandates tracked by CorpLawTracker.` };
  return page({ title:`${name} — deals, mandates & league position | CorpLawTracker`,
    desc:`${name}: ${deals.length} tracked corporate mandates${rank?`, #${rank} of ${total} by deal count`:""}. Verified against primary filings.`,
    canonical, jsonld, crumbs:`<a href="/">Home</a> / <a href="/firms.html">Firms</a> / ${esc(name)}`, body });
}

/* ---- hub pages ---- */
function dealsIndex(all) {
  const body = `<h1>All tracked deals</h1><p class="lead">${all.length} corporate transactions and regulatory matters, newest first — each verified against primary filings.</p>
<ul class="links">${all.map(d=>`<li><a class="card" href="${dealPath(d)}"><span class="ct">${esc(d.headline)}</span><span class="cs">${esc(TYPE[d.type]||d.type||"")} · ${esc(d.time||"")}${d.value&&d.value!=="—"?" · "+esc(d.value):""}</span></a></li>`).join("")}</ul>`;
  return page({ title:"All tracked deals — CorpLawTracker", desc:`${all.length} verified Indian corporate deals and mandates, newest first.`,
    canonical:`${SITE}/deals.html`, crumbs:`<a href="/">Home</a> / Deals`, body });
}
function firmsIndex(firms) {
  const body = `<h1>Law firms</h1><p class="lead">${firms.length} firms named as counsel across tracked Indian corporate transactions, ranked by deal count.</p>
<ul class="links">${firms.map((f,i)=>`<li><a class="card" href="${firmPath(f.name)}"><span class="ct">${esc(f.name)}</span><span class="cs">#${i+1} · ${f.deals.length} deals tracked</span></a></li>`).join("")}</ul>`;
  return page({ title:"Law firms — league & mandates | CorpLawTracker", desc:`${firms.length} Indian corporate law firms ranked by tracked deal count.`,
    canonical:`${SITE}/firms.html`, crumbs:`<a href="/">Home</a> / Firms`, body });
}

/* ---- homepage snapshot (injected into #main) ---- */
function homeSnapshot(all) {
  const latest = all.slice(0, HOME_SNAPSHOT);
  const items = latest.map(d=>`<article style="padding:14px 0;border-bottom:1px solid #e9e5db">
<a href="${dealPath(d)}" style="text-decoration:none;color:#1c1b17"><h3 style="font:600 17px/1.3 Georgia,serif;margin:0 0 5px">${esc(d.headline)}</h3></a>
<div style="font-size:12px;color:#8e897c;margin-bottom:6px">${esc(TYPE[d.type]||d.type||"")} · ${esc(d.time||"")}${d.value&&d.value!=="—"?" · "+esc(d.value):""}${dealFirms(d).length?" · "+esc(dealFirms(d).slice(0,2).join(", ")):""}</div>
<p style="font-size:13.5px;color:#41454c;margin:0">${esc(clamp(d.implication||d.sum||d.detail,220))}</p></article>`).join("");
  const jsonld = { "@context":"https://schema.org", "@type":"ItemList", name:"Latest Indian corporate deals — CorpLawTracker",
    itemListElement: latest.map((d,i)=>({ "@type":"ListItem", position:i+1, url:`${SITE}${dealPath(d)}`, name:strip(d.headline) })) };
  return `<!--PRERENDER-START--><section id="seo-snapshot" style="max-width:820px;margin:0 auto;padding:16px 4px">
<h1 style="font:600 22px/1.25 Georgia,serif;margin:0 0 4px">Verified deal &amp; regulatory intelligence for India's corporate legal market</h1>
<p style="color:#57534a;font-size:14px;margin:0 0 6px">Who advised whom, what it means, and what's on the regulators' desk — every item sourced to a primary filing. <a href="/deals.html">All deals</a> · <a href="/firms.html">Law firms</a>.</p>
${items}
<script type="application/ld+json">${JSON.stringify(jsonld)}</script></section><!--PRERENDER-END-->`;
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

// sitemap + robots
const today = new Date().toISOString().slice(0,10);
const urls = [ `${SITE}/`, `${SITE}/deals.html`, `${SITE}/firms.html`, `${SITE}/academy.html`,
  ...all.map(d=>`${SITE}${dealPath(d)}`), ...firms.map(f=>`${SITE}${firmPath(f.name)}`) ];
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
if (re.test(idx)) { idx = idx.replace(re, snap); fs.writeFileSync(idxPath, idx); }
else console.warn("prerender: PRERENDER markers not found in index.html — homepage snapshot NOT injected.");

console.log(`prerender: ${all.length} deal pages, ${firms.length} firm pages, hubs, sitemap (${urls.length} urls), robots. Homepage snapshot: ${re.test(fs.readFileSync(idxPath,"utf8"))?"injected":"MISSING"}.`);
