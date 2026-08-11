function dealUrl(id){return location.origin+location.pathname+"#/deal/"+encodeURIComponent(id);}
function citeText(d){
  const s=primarySrc(d);
  return `"${d.headline}" — Corporate Law Tracker, ${d.time} (${isVerified(d)?"Verified against official source":"Reported; press source"}). ${s?`Primary source: ${s.name}, ${s.url}. `:""}${dealUrl(d.id)}`;
}
function openMeth(){$("meth").classList.add("on");}

/* ============================ DAILY BRIEF SUBSCRIBE ============================ */
/* Wire this to your email provider. Paste the form/POST endpoint from Beehiiv,
   Substack, Buttondown, ConvertKit or Formspree. Until then, signups are stored
   locally and shown so you can confirm the UX. The field name is "email". */
const SUBSCRIBE_ENDPOINT = ""; // e.g. "https://formspree.io/f/xxxxxx" or a Beehiiv embed URL
function briefCtaHtml(){
  if(lsGet("clt_subscribed",false)){
    return `<div class="brief-cta"><div class="brief-ok"><span class="tick">✓</span><span>You're on the list — the next brief lands tomorrow morning. <a href="#" id="briefManage" style="color:var(--accent)">Use a different email</a></span></div></div>`;
  }
  return `<div class="brief-cta">
    <h4>Get the brief — the day's Indian corporate deals, before 9am.</h4>
    <p>One concise, verified email each morning: the deals that moved overnight, who advised whom, and what's on the regulators' desk. Built only on primary filings — the same standard as everything here.</p>
    <form class="brief-form" id="ctaForm">
      <input id="ctaEmail" type="email" required autocomplete="email" placeholder="you@firm.com" aria-label="Your work email">
      <button type="submit" id="ctaBtn">Get the brief</button>
    </form>
    <div class="brief-note">Free · no spam · unsubscribe in one click.</div>
  </div>`;
}
function bindBriefCta(){
  const f=$("ctaForm");
  if(f)f.onsubmit=e=>{e.preventDefault();submitEmail($("ctaEmail").value,$("ctaBtn"),()=>render());};
  const m=$("briefManage");
  if(m)m.onclick=e=>{e.preventDefault();lsSet("clt_subscribed",false);render();};
}
function openSub(){
  const b=$("subBody");
  if(lsGet("clt_subscribed",false)){
    b.innerHTML=`<div class="brief-ok" style="margin-top:6px"><span class="tick">✓</span><span>You're already subscribed — the next brief lands tomorrow morning.</span></div>`;
  }
  $("sub").classList.add("on");
}
function isEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||"").trim());}
function submitEmail(value,btn,after){
  const email=(value||"").trim();
  if(!isEmail(email)){toast("Enter a valid email address.");return;}
  const orig=btn?btn.textContent:"";
  if(btn){btn.disabled=true;btn.textContent="…";}
  const reset=()=>{if(btn){btn.disabled=false;btn.textContent=orig;}};
  const done=()=>{
    // remember locally so the UI reflects the subscription
    const list=lsGet("clt_sub_emails",[]); if(!list.includes(email)){list.push(email);lsSet("clt_sub_emails",list);}
    lsSet("clt_subscribed",true);
    toast("You're on the list — first brief lands tomorrow morning.");
    reset();
    if(after)after();
  };
  if(SUBSCRIBE_ENDPOINT){
    const body=new FormData(); body.append("email",email); body.append("source","corplawtracker.com");
    fetch(SUBSCRIBE_ENDPOINT,{method:"POST",body,headers:{Accept:"application/json"}})
      .then(()=>done())
      .catch(()=>{ reset(); toast("Couldn't reach the server — please try again."); });
  } else {
    // No provider wired yet: store locally and confirm UX.
    console.info("[CorpLawTracker] Captured signup (no endpoint wired yet):",email);
    setTimeout(done,300);
  }
}

/* ============================ ROUTING (deep links) ============================ */
let _suppressHash=false;
function routeHash(r){
  if(r.name==="feed")return "#/";
  if(r.name==="deal")return "#/deal/"+encodeURIComponent(r.id);
  if(r.name==="firm")return "#/firm/"+encodeURIComponent(r.id);
  if(r.name==="law")return "#/law/"+encodeURIComponent(r.id);
  return "#/"+r.name;
}
function parseHash(){
  const h=decodeURIComponent(location.hash||"").replace(/^#\/?/,"");
  if(!h)return {name:"feed"};
  const[p,...rest]=h.split("/");const id=rest.join("/");
  if(p==="deal"&&id)return {name:"deal",id};
  if(p==="firm"&&id)return {name:"firm",id};
  if(p==="law"&&id)return {name:"law",id};
  const pages=["feed","foryou","precedents","pipeline","analytics","regulatory","calendar","trends","moves","firms","watch","saved","compare","coverage"];
  return pages.includes(p)?{name:p}:{name:"feed"};
}
function go(r){
  route=r;_suppressHash=true;
  const h=routeHash(r); if(location.hash!==h)location.hash=h;
  render();scrollTopReset();
  setTimeout(()=>{_suppressHash=false;},0);
}
function scrollTopReset(){window.scrollTo(0,0);var m=document.querySelector('.main');if(m)m.scrollTop=0;var a=document.querySelector('aside');if(a)a.scrollTop=0;}
window.addEventListener("hashchange",()=>{if(_suppressHash)return;route=parseHash();render();scrollTopReset();});

function resetFilters(){F={geo:"all",type:null,sector:"All Sectors",q:"",firm:"",firm2:"",city:"",stage:""};$("q").value="";}
function anyFilterActive(){return F.geo!=="all"||F.type||F.sector!=="All Sectors"||F.q||F.firm||F.firm2||F.city||F.stage;}
function matchesFilters(d){
  if(F.geo!=="all"&&d.geo!==F.geo)return false;
  if(F.type&&d.type!==F.type)return false;
  if(F.sector!=="All Sectors"&&d.sector!==F.sector)return false;
  if(F.city&&d.geo!==F.city)return false;
  if(F.stage&&d.stage!==F.stage)return false;
  if(F.firm&&!dealFirms(d).includes(F.firm))return false;
  if(F.firm2&&!dealFirms(d).includes(F.firm2))return false;
  if(F.q){const hay=(d.headline+d.sum+d.detail+d.parties+d.sector+d.firms.map(f=>f.name+" "+(f.lead||[]).map(l=>l.n).join(" ")+" "+(f.team||[]).join(" ")).join(" ")).toLowerCase();
    if(!hay.includes(F.q.toLowerCase()))return false;}
  return true;
}
const IMPRANK={hi:0,md:1,lo:2};
function sortList(list){
  const a=list.slice();
  if(sortMode==="value")a.sort((x,y)=>parseCr(y.value)-parseCr(x.value));
  else if(sortMode==="priority")a.sort((x,y)=>(IMPRANK[x.imp]??3)-(IMPRANK[y.imp]??3)||parseCr(y.value)-parseCr(x.value));
  return a; // "latest": engine prepends newest, keep array order
}

/* ============================ SIDEBAR ============================ */
function buildSidebar(){
  const grp=(label,items)=>`<div class="ng"><h4>${label}</h4>${items.map(b=>`<div class="ni" data-browse="${b.k}"><span class="ic">${b.ic}</span>${b.label}${b.ct!==undefined?`<span class="ct" ${b.ctid?`id="${b.ctid}"`:""}>${b.ct}</span>`:""}</div>`).join("")}</div>`;
  const ws=[{k:"feed",ic:"▤",label:"Today"},{k:"foryou",ic:"◈",label:"My Practice"},{k:"watch",ic:"★",label:"Watchlist",ct:starred.size,ctid:"starCt"},{k:"saved",ic:"⌗",label:"Saved & Alerts"},{k:"compare",ic:"⊞",label:"Compare",ct:cmp.size,ctid:"cmpCt"}];
  const intel=[{k:"precedents",ic:"⌕",label:"Precedent Transactions"},{k:"pipeline",ic:"◷",label:"Deal Pipeline"},{k:"analytics",ic:"▦",label:"League Tables"},{k:"trends",ic:"◎",label:"Market Trends"},{k:"moves",ic:"⇄",label:"People Moves"},{k:"firms",ic:"⚖",label:"Law Firms"}];
  const reg=[{k:"regulatory",ic:"§",label:"Regulatory Radar"},{k:"calendar",ic:"☷",label:"Regulatory Calendar"},{k:"coverage",ic:"◫",label:"Coverage & Method"}];
  const geo=`<div class="ng"><h4>Geography</h4>${GEOS.map(g=>{const ct=g.id==="all"?DEALS.length:DEALS.filter(d=>d.geo===g.id).length;
    return `<div class="ni" data-geo="${g.id}"><span class="dot" style="background:${g.dot}"></span>${g.label}<span class="ct">${ct}</span></div>`}).join("")}</div>`;
  const typ=`<div class="ng"><h4>Deal Type</h4>${Object.entries(TYPES).map(([k,v])=>{const ct=DEALS.filter(d=>d.type===k).length;
    return ct?`<div class="ni" data-type="${k}"><span class="dot" style="background:${v.c}"></span>${v.label}<span class="ct">${ct}</span></div>`:""}).join("")}</div>`;
  const learn=`<div class="ng"><h4>Learn</h4><div class="ni" data-href="academy.html"><span class="ic">◆</span>Academy<span class="ct">↗</span></div></div>`;
  $("sidebar").innerHTML=grp("Workspace",ws)+grp("Intelligence",intel)+grp("Regulatory",reg)+learn+geo+typ;
  $("sidebar").querySelectorAll("[data-href]").forEach(n=>n.onclick=()=>{location.href=n.dataset.href;});
  $("sidebar").querySelectorAll("[data-browse]").forEach(n=>n.onclick=()=>{const k=n.dataset.browse;
    if(k==="feed"){resetFilters();go({name:"feed"});}else go({name:k});});
  $("sidebar").querySelectorAll("[data-geo]").forEach(n=>n.onclick=()=>{F.geo=n.dataset.geo;F.firm="";F.firm2="";go({name:"feed"});});
  $("sidebar").querySelectorAll("[data-type]").forEach(n=>n.onclick=()=>{F.type=n.dataset.type;go({name:"feed"});});
}
function markSidebar(){
  document.querySelectorAll("aside .ni").forEach(n=>n.classList.remove("active"));
  if(route.name==="feed"){$("sidebar").querySelector(`[data-geo="${F.geo}"]`)?.classList.add("active");
    if(F.type)$("sidebar").querySelector(`[data-type="${F.type}"]`)?.classList.add("active");
    if(!F.type&&F.geo==="all"&&!anyFilterActive())$("sidebar").querySelector('[data-browse="feed"]')?.classList.add("active");}
  else {const pmap={law:"regulatory",deal:"feed",firm:"firms"};$("sidebar").querySelector(`[data-browse="${pmap[route.name]||route.name}"]`)?.classList.add("active");}
}
function syncCounts(){const s=$("starCt");if(s)s.textContent=starred.size;const c=$("cmpCt");if(c)c.textContent=cmp.size;}

/* ============================ CARDS / ROWS ============================ */
function typeBadge(d){const t=TYPES[d.type];return `<span class="ttype ${t.cls}">${t.label}</span>`;}
function starBtn(d,extra=""){return `<button class="star ${starred.has(d.id)?'on':''}" data-star="${d.id}" title="${starred.has(d.id)?'Remove from watchlist':'Add to watchlist'}" ${extra}>${starred.has(d.id)?'★':'☆'}</button>`;}
function cmpBtn(d){return `<button class="cmpadd ${cmp.has(d.id)?'on':''}" data-cmp="${d.id}" title="Add to side-by-side comparison">⊞${cmp.has(d.id)?' ✓':''}</button>`;}
function dealCard(d){
  const t=TYPES[d.type], st=STAGES[d.stage], g=CITYLABEL[d.geo];
  const firms=d.firms.length?`<div class="firms"><b>Counsel:</b> ${d.firms.map(f=>`<span class="fm">${f.name}</span> <span class="side">(${f.side})</span>`).join(" · ")}</div>`:"";
  return `<div class="card" data-deal="${d.id}">
    <div class="accentbar" style="background:${t.c}"></div>
    <div class="r1">${typeBadge(d)}
      <span class="stage"><span class="sd" style="background:${st.c}"></span>${st.l}</span>
      ${d.imp==="hi"?'<span class="priority">PRIORITY</span>':""}
      ${trustBadge(d)}
      ${ageChip(d)}
      ${d.value&&d.value!=="—"?`<span class="cardval">${d.value}</span>`:'<span style="margin-left:auto"></span>'}
      ${cmpBtn(d)}${starBtn(d)}
    </div>
    <h3>${d.headline}</h3>
    <div class="sum">${d.sum}</div>
    ${impl(d)?`<div class="impl"><b>Why it matters</b> · ${impl(d)}</div>`:""}
    <div class="meta"><span class="tag geo">${g}</span><span class="tag">${d.sector}</span></div>
    ${firms}
    <div class="srcrow">${(()=>{const s=primarySrc(d);return s?`<span class="schip">${s.name}</span>`:"";})()}<span class="stime">${d.time}</span><span class="go">Open →</span></div>
  </div>`;
}
function dealRow(d){
  const st=STAGES[d.stage];
  const vr=isVerified(d)?`<span class="vr" style="color:var(--green);font-weight:750;font-size:11px" title="${escA(TIP_VERIFIED)}" aria-label="Verified">✓</span>`:`<span class="vr" style="color:var(--amber);font-weight:750;font-size:11px" title="${escA(TIP_REPORTED)}" aria-label="Reported">◔</span>`;
  return `<div class="crow" data-deal="${d.id}" title="${escA(stripTags(impl(d)||d.sum||d.headline))}">
    ${typeBadge(d)}${vr}
    <span class="ch">${d.headline}</span>
    <span class="cv">${d.value&&d.value!=="—"?d.value:""}</span>
    <span class="cs"><span class="sd" style="width:6px;height:6px;border-radius:50%;background:${st.c};display:inline-block"></span>${st.l}</span>
    ${ageChip(d)}${cmpBtn(d)}${starBtn(d)}
  </div>`;
}

/* ============================ FEED / TODAY ============================ */
function heroHtml(){
  if(lsGet("clt_hero_hidden",false))return "";
  return `<div class="hero">
    <button class="hx" id="heroX" title="Dismiss — this stays available under Methodology">✕</button>
    <h1>The decision engine for India\u2019s corporate legal market.</h1>
    <div class="hsub">Every overnight deal, mandate and regulatory change — verified against primary filings, connected to the firms, partners and statutes involved, and turned into actions you can take the same morning.</div>
    <div class="hprops">
      <div class="hp"><b>Law-firm partners &amp; BD</b><span>See which companies are raising, buying or restructuring — and which rival firm took the mandate — while the pitch window is still open.</span></div>
      <div class="hp"><b>In-house counsel</b><span>Every new rule arrives with the deadline and the exact action for your documents — not a circular to decode.</span></div>
      <div class="hp"><b>Knowledge &amp; research</b><span>Source-linked, citation-ready deal and statute records that drop straight into a memo.</span></div>
    </div>
    <div class="hcta"><button class="abtn primary" id="heroGo">Set up my practice feed</button><button class="abtn" id="heroMeth">See how we verify</button></div>
  </div>`;
}
function deadlineStrip(){
  const dl=REGITEMS.filter(r=>r.deadline&&r.deadline!=="—");
  if(!dl.length)return "";
  return `<div class="bandh"><h3>Action window · regulatory deadlines</h3><span class="more" data-nav="regulatory">Open tracker →</span></div>
  <div class="dlstrip">${dl.map(r=>`<div class="dlitem" data-nav="regulatory" title="${escA(r.deadline)}"><span class="dld">${r.deadline.length>42?r.deadline.slice(0,42)+"…":r.deadline}</span><span class="dlt">${r.title}</span></div>`).join("")}</div>`;
}
function priorityBand(){
  // recency-aware: the most IMPORTANT deals among the RECENT ones, so the latest
  // material developments surface rather than the same evergreen marquee deals.
  const ts=d=>Date.parse(d.time)||0, now=Date.now();
  const recent=DEALS.filter(d=>now-ts(d)<=30*864e5);
  const pool=recent.length>=3?recent:DEALS;
  const ranked=pool.slice().sort((x,y)=>(IMPRANK[x.imp]??3)-(IMPRANK[y.imp]??3)||parseCr(y.value)-parseCr(x.value)||ts(y)-ts(x)).slice(0,3);
  if(!ranked.length)return "";
  return `<div class="bandh"><h3>What matters now</h3><span class="more" data-sort="priority">Sort feed by priority →</span></div>
  <div class="prio">${ranked.map(d=>{const st=STAGES[d.stage];return `<div class="priocard" data-deal="${d.id}" style="border-left-color:${d.imp==="hi"?"var(--red)":TYPES[d.type].c}">
    <div style="display:flex;align-items:center;gap:7px">${typeBadge(d)}${trustBadge(d)}${ageChip(d)}</div>
    <h3>${d.headline}</h3>
    <div class="pw">${impl(d)?`<b style="color:var(--accent);font-weight:700">Why this matters</b> · ${stripTags(impl(d))}`:stripTags(d.sum)}</div>
    <div class="pmeta">${d.value&&d.value!=="—"?`<b style="font-family:var(--mono);color:var(--green)">${d.value}</b> ·`:""} ${st.l} · ${d.sector}</div>
  </div>`;}).join("")}</div>`;
}
function sortListByPriority(list){return list.slice().sort((x,y)=>(IMPRANK[x.imp]??3)-(IMPRANK[y.imp]??3)||parseCr(y.value)-parseCr(x.value));}
function toolbarHtml(list,opts={}){
  return `<div class="toolbar">
    <span class="tcount">${list.length} item${list.length===1?"":"s"}${opts.scope?` · ${opts.scope}`:""}</span>
    <select class="tsel" id="tbSort" title="Sort">
      <option value="latest" ${sortMode==="latest"?"selected":""}>Latest first</option>
      <option value="value" ${sortMode==="value"?"selected":""}>Largest value</option>
      <option value="priority" ${sortMode==="priority"?"selected":""}>Priority</option>
    </select>
    <div class="seg" title="Density"><button id="tbComf" class="${density==="comfortable"?"on":""}">Cards</button><button id="tbComp" class="${density==="compact"?"on":""}">Rows</button></div>
    ${opts.sector?`<select class="tsel" id="tbSector" title="Sector">${SECTORS.map(s=>`<option value="${s}" ${s===F.sector?"selected":""}>${s==="All Sectors"?"All sectors":s}</option>`).join("")}</select>`:""}
    ${opts.save?`<button class="abtn" id="saveV">Save &amp; track</button>`:""}
    <button class="abtn" id="tbLink">Copy link</button>
  </div>`;
}
function bindToolbar(list,label){
  const s=$("tbSort");if(s)s.onchange=e=>{sortMode=e.target.value;lsSet("clt_sort",sortMode);render();};
  const c1=$("tbComf");if(c1)c1.onclick=()=>{density="comfortable";lsSet("clt_density",density);render();};
  const c2=$("tbComp");if(c2)c2.onclick=()=>{density="compact";lsSet("clt_density",density);render();};
  const sec=$("tbSector");if(sec)sec.onchange=e=>{F.sector=e.target.value;render();};
  const lk=$("tbLink");if(lk)lk.onclick=()=>copyText(location.href,"View link copied");
  const sv=$("saveV");if(sv)sv.onclick=saveCurrentView;
}
function renderFeed(title,list,sub){
  const home=route.name==="feed"&&!anyFilterActive();
  const sorted=sortList(list);
  const clear=anyFilterActive()&&route.name==="feed"?`<span class="clearf" id="clearF">✕ Clear filters</span>`:"";
  const body=sorted.length?`<div class="feed">${sorted.map(density==="compact"?dealRow:dealCard).join("")}</div>`:`<div class="empty">No matching developments. Clear the search or pick another filter.</div>`;
  const label=route.name==="watch"?"Watchlist":currentLabel();
  $("main").innerHTML=`
    ${home&&!lsGet("clt_orient_hidden",false)?`<div class="orient"><span><b style="color:var(--ink)">Verified deal &amp; regulatory intelligence for India's corporate market</b> — every item sourced to a primary filing.</span><button class="orientx" id="orientX" aria-label="Dismiss this">✕</button></div>`:""}
    ${home?`<div class="coverage"><span class="cv-dot"></span><b>${(window.CLT_DATA&&window.CLT_DATA.UPDATED)||'Updated 10 Jun 2026'}</b> · refreshed nightly · ${DEALS.length} matters · built only on primary filings — BSE/NSE · SEBI · RBI · CCI · IBBI · NCLT <span style="color:var(--accent);font-weight:700;cursor:pointer" onclick="openMeth()">Coverage &amp; method →</span></div>`:""}
    ${home?`<div class="stats" id="stats"></div>`:""}
    ${home?priorityBand()+deadlineStrip():""}
    <div class="vh"><h2>${title}</h2><span class="sub">${sub||(sorted.length+(sorted.length===1?" item":" items"))}</span>${clear}</div>
    ${toolbarHtml(sorted,{save:anyFilterActive()&&route.name==="feed",sector:route.name==="feed",scope:route.name==="watch"?"watchlist":""})}
    ${body}
    ${home?briefCtaHtml():""}
    <div class="foot">CorpLawTracker · The decision engine for India's corporate legal market.<br>Headlines &amp; snippets shown under fair-use linking — open the primary source &amp; filings before advising. <span class="methlink" onclick="openMeth()" style="cursor:pointer">Methodology</span></div>`;
  if(home)buildStats();
  bindCards();bindToolbar(list,label);
  $("main").querySelectorAll("[data-nav]").forEach(n=>n.onclick=()=>go({name:n.dataset.nav}));
  $("main").querySelectorAll("[data-sort]").forEach(n=>n.onclick=()=>{sortMode=n.dataset.sort;lsSet("clt_sort",sortMode);render();});
  $("orientX")&&($("orientX").onclick=()=>{lsSet("clt_orient_hidden",true);render();});
  bindBriefCta();
  $("heroX")&&($("heroX").onclick=()=>{lsSet("clt_hero_hidden",true);render();toast("You can reread the pitch under Methodology");});
  $("heroGo")&&($("heroGo").onclick=()=>go({name:"foryou"}));
  $("heroMeth")&&($("heroMeth").onclick=openMeth);
  $("main").querySelectorAll(".priocard[data-deal]").forEach(c=>c.onclick=e=>{if(e.target.closest("[data-star],[data-cmp]"))return;go({name:"deal",id:c.dataset.deal});});
  if(route.name==="feed"){
    $("clearF")&&($("clearF").onclick=()=>{resetFilters();render();});
  }
}

/* ============================ FIRMS ============================ */
function cntFirm(n){return DEALS.filter(d=>dealFirms(d).includes(n)).length;}
function collectPartners(name){const set=new Map();
  DEALS.forEach(d=>d.firms.filter(f=>f.name===name).forEach(f=>(f.lead||[]).forEach(l=>set.set(l.n,l.role))));
  return [...set.entries()].map(([n,role])=>({n,role}));}
function renderFirms(){
  const names=Object.keys(FIRMS).filter(n=>cntFirm(n)>0).sort((a,b)=>cntFirm(b)-cntFirm(a));
  const cards=names.map(n=>{const f=FIRMS[n];
    return `<div class="fcard" data-firm="${encodeURIComponent(n)}">
      <div class="fnm">${n}</div><div class="fmeta">${f.city} · ${f.type}</div>
      <div class="ffocus">${f.focus}</div>
      <div class="fstat"><div><b>${cntFirm(n)}</b><span>deals tracked</span></div><div><b>${collectPartners(n).length}</b><span>partners seen</span></div></div>
    </div>`}).join("");
  $("main").innerHTML=`
    <div class="vh"><h2>Law Firms</h2><span class="sub">${names.length} firms tracked · click a firm for its matters, partners and sources</span></div>
    <div class="firmgrid">${cards}</div>`;
  $("main").querySelectorAll("[data-firm]").forEach(c=>c.onclick=()=>go({name:"firm",id:decodeURIComponent(c.dataset.firm)}));
}
function renderFirm(name){
  const f=FIRMS[name]; if(!f){go({name:"firms"});return;}
  const list=DEALS.filter(d=>dealFirms(d).includes(name));
  const partners=collectPartners(name);
  const pchips=partners.length?`<div class="pchips">${partners.map(p=>`<span class="pchip">${p.n}${p.role?` <span class="pr">· ${p.role}</span>`:""}</span>`).join("")}</div>`:`<div class="note" style="margin-top:8px">Individual partners are listed as deal announcements name them.</div>`;
  const web=f.web?`<a class="fweb" href="${f.web}" target="_blank" rel="noopener">Visit firm website ↗</a>`:"";
  $("main").innerHTML=`
    <span class="back" onclick="go({name:'firms'})">← Law Firms</span>
    <div class="firmhero">
      <h1>${name}</h1><div class="fmeta">${f.city} · ${f.type} firm</div>
      <div class="ffocus">${f.focus}</div>${web}
      <div style="margin-top:14px"><h4 style="font-size:10px;letter-spacing:1.3px;text-transform:uppercase;color:var(--ink3);font-weight:750;margin-bottom:4px">Partners seen on tracked deals</h4>${pchips}</div>
    </div>
    <div class="vh"><h2>Deals · ${name}</h2><span class="sub">${list.length} tracked</span></div>
    <div class="feed">${list.map(dealCard).join("")}</div>`;
  bindCards();
}

/* ============================ DEAL DETAIL ============================ */
function renderDeal(id){
  const d=DEALS.find(x=>x.id===id); if(!d){go({name:"feed"});return;}
  const t=TYPES[d.type], st=STAGES[d.stage];
  const firmsHtml=d.firms.map(f=>{
    const lead=(f.lead&&f.lead.length)?f.lead.map(l=>`<div class="lead"><b>${l.n}</b> <span class="role">— ${l.role}</span></div>`).join(""):"";
    const team=(f.team&&f.team.length)?`<div class="teamline"><span class="lbl">Team:</span> ${f.team.join(" · ")}</div>`:"";
    const note=f.note?`<div class="note" style="margin-top:5px">${f.note}</div>`:"";
    const fn=firmKnown(f.name)?`<span class="fn link" onclick="go({name:'firm',id:'${f.name.replace(/'/g,"\\'")}'})">${f.name}</span>`:`<span class="fn">${f.name}</span>`;
    return `<div class="firmblk"><div class="fh">${fn}<span class="sidetag">${f.side}</span></div>${lead}${team}${note}</div>`;
  }).join("");
  const allSrcs=srcsWithOfficial(d);
  const srcHtml=allSrcs.map(s=>`<div class="srcitem"><div class="st"><span class="snm">${s.name}</span>${srcOfficial(s)?`<span class="otag" title="${escA(TIP_OFFICIAL)}">OFFICIAL</span>`:''}<a class="sgo" href="${s.url}" target="_blank" rel="noopener">Open ↗</a></div><div class="sblurb">${s.blurb}</div></div>`).join("");
  const mergedDocs=[...officialDocs(d),...(d.docs||[])].filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i);
  const docsHtml=mergedDocs.length?mergedDocs.map(dc=>`<div class="doc" onclick="window.open('${dc.url}','_blank','noopener')"><span class="di">§</span>${dc.label}<span style="margin-left:auto;color:var(--ink3)">↗</span></div>`).join(""):`<div class="note">Primary filings link out via the source article above.</div>`;
  const fw=frameworkOf(d);
  const fwHtml=fw.length?`<div class="sec" id="sec-framework"><h4>Legal framework · what to review <span style="font-weight:500;text-transform:none;letter-spacing:0;color:var(--ink4)">(${fw.length})</span></h4>${fw.map(x=>`<div class="fwitem ${x.flag||''}"><div class="fwref">${x.ref}${x.flag==="amended"?'<span class="fwtag amd">Recently amended</span>':x.flag==="central"?'<span class="fwtag ctr">Central</span>':''}</div><div class="fwnote">${x.note}</div></div>`).join("")}<div class="note" style="margin-top:10px">General transactional-review references — not legal advice; verify against the current text and the deal's specific facts. <span style="color:var(--accent);font-weight:700;cursor:pointer;font-style:normal" onclick="go({name:'regulatory'})">Open the Regulatory Library →</span></div></div>`:"";
  const comm=commentaryOf(d);
  const commHtml=comm.length?`<div class="sec" id="sec-commentary"><h4>Commentary &amp; analysis <span style="font-weight:500;text-transform:none;letter-spacing:0;color:var(--ink4)">(${comm.length})</span></h4>${comm.map(c=>`<div class="srcitem"><div class="st"><span class="snm">${c.title}</span><a class="sgo" href="${c.url}" target="_blank" rel="noopener">${c.source}${c.date?` · ${c.date}`:""} ↗</a></div><div class="sblurb">${c.insight}</div></div>`).join("")}</div>`:"";
  const relReg=regItemsFor(d);
  const relRegHtml=relReg.length?`<div class="sec" id="sec-regulatory"><h4>Related regulatory developments</h4>${relReg.map(r=>`<div class="doc" onclick="go({name:'regulatory'})"><span class="di">§</span>${r.title}<span style="margin-left:auto;color:var(--ink3)">→</span></div>`).join("")}</div>`:"";
  const sx=structOf(d);
  const structHtml=sx?`<div class="sec" id="sec-structure"><h4>Deal structure &amp; key terms <span style="font-weight:600;text-transform:none;letter-spacing:0;color:${sx.status==="Confirmed"?"var(--green)":"var(--amber)"}">· ${sx.status}</span></h4>
    ${sx.consideration&&sx.consideration!=="—"?`<div class="stk"><div class="stk-l">Consideration</div><div class="stk-v">${sx.consideration}</div></div>`:""}
    ${(sx.conditions&&sx.conditions.length&&sx.conditions[0]!=="—")?`<div class="stk"><div class="stk-l">Conditions / mechanics</div><div class="stk-v"><ul class="play" style="padding-left:16px;margin:0">${sx.conditions.map(x=>`<li>${x}</li>`).join("")}</ul></div></div>`:""}
    ${(sx.approvals&&sx.approvals.length&&sx.approvals[0]!=="—")?`<div class="stk"><div class="stk-l">Approvals</div><div class="stk-v">${sx.approvals.join(" · ")}</div></div>`:""}
    ${sx.novel?`<div class="stk"><div class="stk-l">What's notable</div><div class="stk-v">${sx.novel}</div></div>`:""}</div>`:"";
  const trigHtml=(sx&&sx.triggers&&sx.triggers.length)?`<div class="sec" id="sec-triggers"><h4>Why these laws apply here · deal-specific triggers</h4>${sx.triggers.map(t=>{const f=findLaw(t.law);return `<div class="trigrow"><span class="trig-s"${f?` data-law="${t.law}"`:""}>§ ${f?f.it.t:t.law}</span><span class="trig-n">${t.note}</span></div>`;}).join("")}</div>`:"";
  const tl=d.timeline&&d.timeline.length?`<div class="sec"><h4>Timeline</h4><div class="tl">${d.timeline.map(e=>`<div class="ev"><div class="ed">${e.d}</div><div class="et">${e.t}</div></div>`).join("")}</div></div>`:"";
  const related=DEALS.filter(x=>x.id!==d.id&&(x.sector===d.sector||x.firms.some(f=>dealFirms(d).includes(f.name)))).slice(0,4);
  const relHtml=related.length?`<div class="sec" id="sec-related"><h4>Related deals</h4>${related.map(r=>`<div class="doc" onclick="go({name:'deal',id:'${r.id}'})"><span class="di">●</span>${r.headline}<span style="margin-left:auto;color:var(--ink3)">→</span></div>`).join("")}</div>`:"";
  const webParts=[["Deal structure",sx?1:0,"sec-structure"],["Legal framework",fw.length,"sec-framework"],["Commentary",comm.length,"sec-commentary"],["Regulatory",relReg.length,"sec-regulatory"],["Related deals",related.length,"sec-related"]].filter(x=>x[1]>0);
  const webStrip=webParts.length?`<div class="webstrip"><span class="webstrip-lbl">This deal connects to →</span>${webParts.map(w=>`<span class="webchip" data-scroll="${w[2]}"><b>${w[1]}</b> ${w[0]}</span>`).join("")}</div>`:"";
  const ps=primarySrc(d);
  const snapReasons=(d.scoreReasons&&d.scoreReasons.length)?d.scoreReasons:[];
  const snapGlance=`${d.parties?`<b>${d.parties}</b> — `:""}${t.label}${d.value&&d.value!=="—"?` · <b>${d.value}</b>`:""} · ${d.sector} · ${d.city} · disclosed ${d.time}.`;
  const snapHtml=`<div class="sec"><h4>At a glance</h4><p style="margin:0;font-size:14px">${snapGlance}</p>${snapReasons.length?`<div style="margin-top:11px"><div style="font-family:var(--mono);font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:var(--ink3);margin-bottom:7px">Why it's tracked</div><div style="display:flex;flex-wrap:wrap;gap:6px">${snapReasons.map(r=>`<span class="tag">${r}</span>`).join("")}</div></div>`:""}${ps?`<div style="margin-top:13px"><a class="abtn primary" href="${ps.url}" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none">Read the primary filing ↗</a></div>`:""}</div>`;
  $("main").innerHTML=`
   <span class="back" onclick="go({name:'feed'})">← Back to feed</span>
   <div class="dd">
     <div class="dd-head">${typeBadge(d)}
       <span class="stage"><span class="sd" style="background:${st.c}"></span>${st.l}</span>
       ${d.imp==="hi"?'<span class="priority">PRIORITY</span>':""}
       ${trustBadge(d)}
       ${dealHasOfficial(d)?`<span class="official" title="${escA(TIP_OFFICIAL)}">OFFICIAL SOURCE</span>`:''}
       ${reviewedBy(d)?`<span class="rev">✔ Reviewed · ${reviewedBy(d)}</span>`:''}
       ${ageChip(d)}
     </div>
     <h1>${d.headline}</h1>
     <div class="lede">${d.sum}</div>
     <div class="actbar">
       ${starBtn(d,'style="font-size:14px;border:1px solid var(--line);border-radius:6px;padding:4px 10px;margin-left:0"')}
       <button class="abtn" id="ddCite">Copy citation</button>
       <button class="abtn" id="ddLink">Copy link</button>
       ${ps?`<button class="abtn" id="ddSrc">Open primary source ↗</button>`:""}
       ${cmpBtn(d)}
     </div>
     ${webStrip}
     <div class="dd-grid">
       <div>
         ${snapHtml}
         ${confidenceMeter(d)}
         ${impl(d)?`<div class="sec" style="background:var(--accent-soft);border-color:transparent"><h4 style="color:var(--accent)">Why it matters · practice implication</h4><p style="color:var(--ink);font-size:13.5px">${impl(d)}</p></div>`:""}
         ${(()=>{const su=(d.sum||"").replace(/<[^>]+>/g,"").trim().toLowerCase(),de=(d.detail||"").replace(/<[^>]+>/g,"").trim();return de&&de.toLowerCase().slice(0,60)!==su.slice(0,60)?`<div class="sec"><h4>What happened</h4><p>${d.detail}</p></div>`:"";})()}
         ${structHtml}
         ${trigHtml}
         ${fwHtml}
         ${commHtml}
         ${relRegHtml}
         ${firmsHtml?`<div class="sec"><h4>Counsel &amp; teams</h4>${firmsHtml}</div>`:""}
         <div class="sec"><h4>Sources &amp; official filings · what each adds <span style="font-weight:500;text-transform:none;letter-spacing:0;color:var(--ink4)">(${allSrcs.length})</span>${(()=>{var L=(window.CLT_DATA&&window.CLT_DATA.LINKCHECK)||{};var s=L.deals&&L.deals[d.id];if(s==='v')return ` <span class="lveri" title="Every source link was pinged and confirmed live as of ${L.at}.">✓ Links verified · ${L.at}</span>`;if(s==='i')return ` <span class="lveri warn" title="A source link could not be reached on the last automated check — under review.">⚠ Link under review</span>`;return '';})()}</h4>${srcHtml}</div>
         <div class="sec"><h4>Public documents</h4>${docsHtml}</div>
       </div>
       <div>
         <div class="sec"><h4>Deal facts</h4><div class="side-meta">
           <div class="mrow"><span class="mk">Type</span><span class="mv">${t.label}</span></div>
           <div class="mrow"><span class="mk">Stage</span><span class="mv">${st.l}</span></div>
           <div class="mrow"><span class="mk">Value</span><span class="mv">${d.value}</span></div>
           <div class="mrow"><span class="mk">Parties</span><span class="mv">${d.parties||"—"}</span></div>
           <div class="mrow"><span class="mk">Sector</span><span class="mv">${d.sector}</span></div>
           <div class="mrow"><span class="mk">City</span><span class="mv">${d.city}</span></div>
           <div class="mrow"><span class="mk">Updated</span><span class="mv">${d.time}</span></div>
           <div class="mrow"><span class="mk">Verification</span><span class="mv" style="color:${isVerified(d)?"var(--green)":"var(--amber)"}">${isVerified(d)?"Verified":"Reported"}</span></div>
         </div></div>
         ${tl}
         ${relHtml}
       </div>
     </div>
   </div>`;
  $("main").querySelectorAll("[data-star]").forEach(b=>b.onclick=e=>{e.stopPropagation();toggleStar(b.dataset.star);render();});
  $("main").querySelectorAll("[data-cmp]").forEach(b=>b.onclick=e=>{e.stopPropagation();toggleCmp(b.dataset.cmp);render();});
  $("main").querySelectorAll("[data-scroll]").forEach(n=>n.onclick=()=>document.getElementById(n.dataset.scroll)?.scrollIntoView({behavior:"smooth",block:"start"}));
  $("main").querySelectorAll(".trig-s[data-law]").forEach(n=>n.onclick=()=>go({name:"law",id:n.dataset.law}));
  $("ddCite")&&($("ddCite").onclick=()=>copyText(citeText(d),"Citation copied"));
  $("ddLink")&&($("ddLink").onclick=()=>copyText(dealUrl(d.id),"Deal link copied"));
  $("ddSrc")&&($("ddSrc").onclick=()=>window.open(ps.url,"_blank","noopener"));
}

