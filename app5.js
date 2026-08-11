/* ============================ STATS ============================ */
function buildStats(){
  // Quality metrics, not vanity totals — every number is a TRUST signal.
  const verified=DEALS.filter(d=>isVerified(d));
  const official=DEALS.filter(d=>dealHasOfficial(d));
  const pct=(n)=>DEALS.length?Math.round(n/DEALS.length*100):0;
  const lc=(window.CLT_DATA&&window.CLT_DATA.LINKCHECK&&window.CLT_DATA.LINKCHECK.deals)||null;
  const linksList=lc?DEALS.filter(d=>lc[d.id]==="v"):null;
  const enriched=DEALS.filter(d=>(d.framework&&d.framework.length)||d.enrichTier==="deep"||d.enrichTier==="standard");
  const groups=[
   {n:DEALS.length,l:"Deals tracked",d:"sourced & deduped nightly",list:DEALS},
   {n:verified.length,l:"Verified",d:`${pct(verified.length)}% corroborated by an official source`,list:verified},
   {n:official.length,l:"Official filings",d:`${pct(official.length)}% primary-source linked`,muted:true,list:official},
   linksList
     ? {n:linksList.length,l:"Links verified",d:"pinged &amp; live — checked nightly",muted:true,list:linksList}
     : {n:enriched.length,l:"Deep-enriched",d:"multi-source detail on file",muted:true,list:enriched}
  ];
  $("stats").innerHTML=groups.map((g,i)=>`<div class="stat" data-stat="${i}">
    <div class="n">${g.n}</div><div class="l">${g.l}</div><div class="d ${g.muted?'muted':''}">${g.d}</div>
    <div class="pop"><div class="ph">${g.l} — click any to open</div>${g.list.map(d=>`<div class="pr" data-deal="${d.id}"><span class="pt ${TYPES[d.type].cls}">${TYPES[d.type].label}</span><span class="px">${d.headline}</span></div>`).join("")}</div>
  </div>`).join("");
  $("stats").querySelectorAll(".pop .pr").forEach(r=>r.onclick=e=>{e.stopPropagation();go({name:"deal",id:r.dataset.deal});});
}

/* ============================ RAIL ============================ */
function buildRail(){
  const dl=REGITEMS.filter(r=>r.deadline&&r.deadline!=="—");
  $("raildl").innerHTML=dl.length?dl.map(r=>`<div class="raildl" data-nav="regulatory"><div class="rdd">${r.deadline.length>54?r.deadline.slice(0,54)+"…":r.deadline}</div><div class="rdt">${r.title}</div></div>`).join(""):'<div class="note">No dated obligations on file.</div>';
  document.querySelectorAll("#raildl [data-nav]").forEach(n=>n.onclick=()=>go({name:"regulatory"}));
  const tally={};DEALS.forEach(d=>(d.firms||[]).forEach(f=>{if(firmKnown(f.name))tally[f.name]=(tally[f.name]||0)+1;}));
  const ranked=Object.entries(tally).filter(([,v])=>v>=2).sort((a,b)=>b[1]-a[1]).slice(0,8);
  $("league").innerHTML=ranked.length
    ?ranked.map((r,i)=>`<div class="lr" data-firm="${encodeURIComponent(r[0])}"><span class="rk">${i+1}</span><span class="fn">${r[0]}</span><span class="dl">${r[1]}</span></div>`).join("")+`<div class="note" style="margin-top:9px;font-size:10px;color:var(--ink4)">Firms with ≥2 attributed mandates</div>`
    :'<div class="note">Ranks build up as deals gain attributed counsel.</div>';
  $("league").querySelectorAll("[data-firm]").forEach(n=>n.onclick=()=>go({name:"firm",id:decodeURIComponent(n.dataset.firm)}));
  const radar=DEALS.filter(d=>d.type==="reg"||d.type==="bank");
  $("radar").innerHTML=radar.map(d=>`<div class="reg" data-deal="${d.id}"><div class="when">${d.sources[0].name.split('—')[0].trim()} · ${d.time}</div><div class="what">${d.headline}</div></div>`).join("");
  $("radar").querySelectorAll("[data-deal]").forEach(n=>n.onclick=()=>go({name:"deal",id:n.dataset.deal}));
  $("cov").innerHTML=`Bar &amp; Bench · LiveLaw · Mint · Economic Times · Business Standard · VCCircle · BSE / NSE · SEBI · CCI · IBBI · RBI · PIB<br><span style="color:var(--accent);font-weight:700;cursor:pointer" onclick="openMeth()">How verification works →</span>`;
}

/* ============================ INTERACTIONS ============================ */
function bindCards(){
  $("main").querySelectorAll(".card[data-deal],.crow[data-deal]").forEach(c=>{
    c.onclick=e=>{if(e.target.closest("[data-star],[data-cmp],a"))return;go({name:"deal",id:c.dataset.deal});};});
  $("main").querySelectorAll("[data-star]").forEach(b=>b.onclick=e=>{e.stopPropagation();toggleStar(b.dataset.star);render();});
  $("main").querySelectorAll("[data-cmp]").forEach(b=>b.onclick=e=>{e.stopPropagation();toggleCmp(b.dataset.cmp);render();});
}
function toggleStar(id){starred.has(id)?starred.delete(id):starred.add(id);lsSet("clt_starred",[...starred]);syncCounts();}
function toggleCmp(id){
  if(cmp.has(id))cmp.delete(id);
  else{if(cmp.size>=4){toast("Compare holds up to 4 deals");return;}cmp.add(id);}
  lsSet("clt_cmp",[...cmp]);syncCounts();renderCmpBar();
}
function renderCmpBar(){
  let bar=$("cmpbar");
  if(!cmp.size||route.name==="compare"){if(bar)bar.remove();return;}
  if(!bar){bar=document.createElement("div");bar.id="cmpbar";bar.className="cmpbar";document.body.appendChild(bar);}
  bar.innerHTML=`<span>${cmp.size} deal${cmp.size>1?"s":""} selected</span><button class="go" ${cmp.size<2?"disabled style='opacity:.5'":""} onclick="go({name:'compare'})">Compare side-by-side</button><button class="x" onclick="clearCmp()">Clear</button>`;
}
function clearCmp(){cmp.clear();lsSet("clt_cmp",[]);syncCounts();renderCmpBar();if(route.name==="compare")render();}

/* ============================ COMPARE ============================ */
function renderCompare(){
  const list=[...cmp].map(id=>DEALS.find(d=>d.id===id)).filter(Boolean);
  if(list.length<2){
    $("main").innerHTML=`<div class="vh"><h2>Compare deals</h2></div><div class="empty">Select two to four deals with the <b>⊞</b> button on any card, then return here for a side-by-side view.</div>`;
    return;
  }
  const n=list.length;
  const row=(k,cells,hd)=>`<div class="cmprow ${hd?"hd":""}"><div class="cmpk">${k}</div>${cells.map(c=>`<div class="cmpv">${c}</div>`).join("")}</div>`;
  const sxs=list.map(d=>structOf(d));
  const html=
    row("Matter",list.map(d=>`<span class="h" onclick="go({name:'deal',id:'${d.id}'})">${d.headline}</span>`),true)+
    row("Type · stage",list.map(d=>`${typeBadge(d)} <span style="font-size:11.5px">${STAGES[d.stage].l}</span>`))+
    row("Value",list.map(d=>`<b style="font-family:var(--mono);color:var(--green)">${d.value||"—"}</b>`))+
    row("Verification",list.map(d=>trustBadge(d)))+
    row("Sector · geo",list.map(d=>`${d.sector} · ${CITYLABEL[d.geo]}`))+
    row("Date",list.map(d=>d.time))+
    row("Structure",list.map((d,i)=>sxs[i]&&sxs[i].consideration&&sxs[i].consideration!=="—"?sxs[i].consideration:"—"))+
    row("Approvals",list.map((d,i)=>sxs[i]&&sxs[i].approvals&&sxs[i].approvals.length&&sxs[i].approvals[0]!=="—"?sxs[i].approvals.join(" · "):"—"))+
    row("Counsel",list.map(d=>d.firms.length?d.firms.map(f=>`<b>${f.name}</b> <span style="color:var(--ink3);font-size:11px">(${f.side})</span>`).join("<br>"):"—"))+
    row("Framework",list.map(d=>{const fw=frameworkOf(d);return fw.length?fw.slice(0,4).map(x=>x.ref).join("<br>")+(fw.length>4?`<br><span style="color:var(--ink3)">+${fw.length-4} more</span>`:""):"—";}))+
    row("Primary source",list.map(d=>{const s=primarySrc(d);return s?`<a href="${s.url}" target="_blank" rel="noopener">${s.name} ↗</a>`:"—";}));
  $("main").innerHTML=`
    <div class="vh"><h2>Compare deals</h2><span class="sub">${n} matters side-by-side</span>
      <span style="margin-left:auto;display:flex;gap:8px">
        <button class="abtn" id="cmpClear">Clear comparison</button></span></div>
    <div class="cmptbl" style="--cols:${n}">${html}</div>
    <div class="foot">Structure and approvals reflect curated deal records; open each matter for sources and the full legal framework.</div>`;
  $("cmpClear").onclick=()=>{clearCmp();};
}

/* ============================ ADVANCED SEARCH ============================ */
function buildAdv(){
  const firmOpts=`<option value="">Any firm</option>`+Object.keys(FIRMS).filter(n=>cntFirm(n)>0).sort().map(n=>`<option>${n}</option>`).join("");
  $("aFirm").innerHTML=firmOpts; $("aFirm2").innerHTML=firmOpts;
  $("aCity").innerHTML=`<option value="">Any city / region</option>`+Object.entries(CITYLABEL).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
  $("aSector").innerHTML=SECTORS.map(s=>`<option value="${s}">${s}</option>`).join("");
  $("aType").innerHTML=`<option value="">Any type</option>`+Object.entries(TYPES).filter(([k])=>DEALS.some(d=>d.type===k)).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join("");
  $("aStage").innerHTML=`<option value="">Any stage</option>`+Object.entries(STAGES).filter(([k])=>DEALS.some(d=>d.stage===k)).map(([k,v])=>`<option value="${k}">${v.l}</option>`).join("");
  $("advOpen").onclick=()=>{$("adv").classList.add("on");
    $("aFirm").value=F.firm;$("aFirm2").value=F.firm2;$("aCity").value=F.city;$("aSector").value=F.sector;$("aType").value=F.type||"";$("aStage").value=F.stage;$("aText").value=F.q;};
  $("adv").onclick=e=>{if(e.target.id==="adv")$("adv").classList.remove("on");};
  $("advReset").onclick=()=>{["aFirm","aFirm2","aCity","aType","aStage","aText"].forEach(i=>$(i).value="");$("aSector").value="All Sectors";};
  $("advApply").onclick=()=>{
    F.firm=$("aFirm").value;F.firm2=$("aFirm2").value;F.city=$("aCity").value;F.sector=$("aSector").value;
    F.type=$("aType").value||null;F.stage=$("aStage").value;F.q=$("aText").value;F.geo="all";$("q").value=F.q;
    $("adv").classList.remove("on");go({name:"feed"});};
}

/* ============================ ANALYTICS HELPERS ============================ */
function parseCr(v=""){v=v.replace(/,/g,"");let m=v.match(/₹\s?([\d.]+)\s?(cr|crore|bn|billion|lakh)?/i);
  if(m){let n=parseFloat(m[1]);const u=(m[2]||"cr").toLowerCase();if(/bn|billion/.test(u))n*=100000;if(/lakh/.test(u))n/=100;return n;}
  m=v.match(/\$\s?([\d.]+)\s?(mn|million|bn|billion)?/i);
  if(m){let n=parseFloat(m[1]);const u=(m[2]||"mn").toLowerCase();return n*(/bn|billion/.test(u)?8300:8.3);}return 0;}
function fmtCr(n){if(!n)return "—";if(n>=100000)return "₹"+(n/100000).toFixed(1).replace(/\.0$/,"")+" lakh cr";if(n>=1000)return "₹"+Math.round(n).toLocaleString("en-IN")+" cr";return "₹"+Math.round(n)+" cr";}

/* ============================ PIPELINE ============================ */
function renderPipeline(){
  const order=[["rumoured","Rumoured"],["announced","Announced"],["review","In Regulatory Review"],["filed","Filed / Open"],["completed","Completed"]];
  const cols=order.map(([k,label])=>{
    const items=DEALS.filter(d=>d.stage===k);
    if(!items.length)return "";
    const st=STAGES[k];
    return `<div class="pcol"><h5><span class="sd" style="width:8px;height:8px;border-radius:50%;background:${st.c};display:inline-block"></span>${label}<span class="ct">${items.length}</span></h5>
      ${items.map(d=>`<div class="pitem" data-deal="${d.id}"><div class="ph">${d.headline}</div><div class="pm"><span class="ttype ${TYPES[d.type].cls}">${TYPES[d.type].label}</span>${d.value&&d.value!=="—"?`<span>${d.value}</span>`:""}<span>${CITYLABEL[d.geo]}</span></div></div>`).join("")}
    </div>`;}).join("");
  $("main").innerHTML=`<div class="vh"><h2>Deal Pipeline</h2><span class="sub">${DEALS.length} tracked by stage · rumoured and in-review — the pitch window, not the post-mortem</span></div><div class="pipe">${cols}</div>`;
  $("main").querySelectorAll(".pitem[data-deal]").forEach(c=>c.onclick=()=>go({name:"deal",id:c.dataset.deal}));
}

/* ============================ LEAGUE & ANALYTICS ============================ */
function barRows(pairs,fmt,onClickType){
  const max=Math.max(...pairs.map(p=>p[1]),1);
  return pairs.map((p,i)=>`<div class="anrow" ${onClickType?`data-${onClickType}="${encodeURIComponent(p[0])}"`:""}>
    <span class="anrank">${i+1}</span><span class="anlabel">${p[0]}</span>
    <span class="anbar" style="width:${Math.max(6,Math.round(p[1]/max*150))}px"></span>
    <span class="anval">${fmt(p[1])}</span></div>`).join("");
}
function renderCoverage(){
  const total=DEALS.length;
  const verified=DEALS.filter(d=>isVerified(d)).length;
  const official=DEALS.filter(d=>dealHasOfficial(d)).length;
  const attributed=DEALS.filter(d=>(d.firms||[]).some(f=>firmKnown(f.name))).length;
  const pct=n=>total?Math.round(n/total*100):0;
  const lcd=(window.CLT_DATA&&window.CLT_DATA.LINKCHECK&&window.CLT_DATA.LINKCHECK.deals)||null;
  let lv=0,li=0,lu=0;
  if(lcd)Object.keys(lcd).forEach(k=>{const s=lcd[k];if(s==="v")lv++;else if(s==="i")li++;else lu++;});
  let sOff=0,sPress=0,sTot=0;
  DEALS.forEach(d=>(d.sources||[]).forEach(s=>{sTot++;if(srcOfficial(s))sOff++;else sPress++;}));
  const ts=d=>Date.parse(d.time)||0;
  const recent=[...DEALS].sort((a,b)=>ts(b)-ts(a)).slice(0,12);
  const corrections=(window.CLT_DATA&&window.CLT_DATA.CORRECTIONS)||[];
  const upd=(window.CLT_DATA&&window.CLT_DATA.UPDATED)||"Updated recently";
  const metric=(n,l,d)=>`<div class="stat" style="cursor:default"><div class="n">${n}</div><div class="l">${l}</div><div class="d">${d}</div></div>`;
  $("main").innerHTML=`
    <div class="vh"><h2>Coverage &amp; Method</h2><span class="sub">${upd} · how this data is sourced, verified and kept honest</span></div>
    <div class="stats" style="margin-bottom:24px">
      ${metric(total,"Deals tracked","sourced & deduped nightly")}
      ${metric(pct(verified)+"%","Verified","corroborated by an official source")}
      ${metric(pct(official)+"%","Official-linked","carry a primary filing")}
      ${metric(lcd?Math.round(lv/Math.max(1,lv+li+lu)*100)+"%":"—","Links live","pinged nightly")}
    </div>
    <div class="anwrap">
      <div class="sec"><h4>Source mix</h4><p style="font-size:13px;color:var(--ink2);line-height:1.65"><b>${sTot}</b> source links across <b>${total}</b> deals — <b>${sOff}</b> official/primary (exchange, regulator, court, company) and <b>${sPress}</b> press/secondary. <b>${attributed}</b> deals carry named counsel.</p></div>
      <div class="sec"><h4>Link health · checked nightly</h4>${lcd?`<p style="font-size:13px;color:var(--ink2);line-height:1.65"><span style="color:var(--green);font-weight:700">${lv}</span> deals with every link confirmed live · <span style="color:var(--amber);font-weight:700">${li}</span> with a link under review · ${lu} not yet checked. Every source URL is pinged on a rolling nightly basis — a genuine 404 is flagged; a bot-blocked government page is not falsely failed.</p>`:`<p style="font-size:13px;color:var(--ink2);line-height:1.65">The nightly link-checker pings every source URL and flags any that die or redirect. Results appear here after the first run.</p>`}</div>
      <div class="sec"><h4>The verification ladder</h4>
        <div class="fwitem"><div class="fwref">⛉ Official</div><div class="fwnote">Carries a specific primary filing — an exchange disclosure, a regulator/court order, or the company's own release.</div></div>
        <div class="fwitem"><div class="fwref">✓ Verified</div><div class="fwnote">Corroborated by at least one official/primary source.</div></div>
        <div class="fwitem"><div class="fwref">◔ Reported</div><div class="fwnote">A single press source; not yet corroborated against a primary filing.</div></div>
      </div>
      <div class="sec"><h4>Recently entered</h4>${recent.map(d=>`<div class="lr" data-deal="${d.id}"><span class="fn" style="font-family:var(--sans)">${d.headline}</span><span class="dl" style="color:var(--ink3)">${d.time}</span></div>`).join("")}</div>
      <div class="sec"><h4>Corrections log</h4>${corrections.length?corrections.map(c=>`<div class="fwitem"><div class="fwref">${c.date||""}</div><div class="fwnote">${c.note||""}</div></div>`).join(""):`<div class="empty" style="text-align:left">No corrections logged to date. When we fix or retract an item, it is recorded here — openly. We would rather show our edits than claim perfection.</div>`}</div>
      <div class="sec"><h4>How we keep this honest</h4><p style="font-size:12.5px;color:var(--ink2);line-height:1.7">Deals are machine-collected nightly from primary disclosures (BSE/NSE filings, regulator and court orders) and named-counsel legal press, deduplicated, and scored. We tag each item by evidentiary strength rather than hiding uncertainty, link every claim to its source, ping those links nightly, and rank league tables only on deals with attributed counsel. Nothing here is fabricated; where we don't know, we mark it "—".</p></div>
    </div>`;
  $("main").querySelectorAll("[data-deal]").forEach(n=>n.onclick=()=>go({name:"deal",id:n.dataset.deal}));
}
function renderAnalytics(){
  const fc={},fv={},pc={},tc={},sc={};
  DEALS.forEach(d=>{
    const val=parseCr(d.value);
    d.firms.forEach(f=>{if(!firmKnown(f.name))return;fc[f.name]=(fc[f.name]||0)+1;fv[f.name]=(fv[f.name]||0)+val;
      (f.lead||[]).forEach(l=>pc[l.n]=(pc[l.n]||0)+1);});
    tc[TYPES[d.type].label]=(tc[TYPES[d.type].label]||0)+1;
    sc[d.sector]=(sc[d.sector]||0)+1;
  });
  const top=(o,n=8)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n);
  const attributed=DEALS.filter(d=>(d.firms||[]).some(f=>firmKnown(f.name))).length;
  const MIN=2;
  const fcG=Object.fromEntries(Object.entries(fc).filter(([,v])=>v>=MIN));
  const fvG=Object.fromEntries(Object.entries(fv).filter(([k])=>fc[k]>=MIN));
  const enough=Object.keys(fcG).length>=3;
  $("main").innerHTML=`<div class="vh"><h2>League Tables</h2><span class="sub">${attributed} of ${DEALS.length} deals carry attributed counsel · firms with ≥${MIN} tracked mandates ranked</span></div>
    <div class="anwrap">
      ${enough?`<div class="sec"><h4>Top firms · by deals tracked</h4>${barRows(top(fcG),v=>v+" deals","firm")}</div>
      <div class="sec"><h4>Top firms · by aggregate deal value</h4>${barRows(top(fvG),fmtCr,"firm")}</div>`
      :`<div class="sec"><h4>Top firms</h4><div class="empty">Not enough deals carry attributed counsel yet to rank firms reliably. This fills out as deals are enriched with their advising firms.</div></div>`}
      <div class="sec"><h4>Most active partners</h4>${barRows(top(pc),v=>v+(v>1?" deals":" deal"))}</div>
      <div class="sec"><h4>Deals by type</h4>${barRows(top(tc,9),v=>v+"")}</div>
      <div class="sec"><h4>Deals by sector</h4>${barRows(top(sc,12),v=>v+"")}</div>
      <div class="sec"><h4>How to read this · methodology</h4><p style="font-size:12.5px;color:var(--ink2);line-height:1.6">League tables are computed <b>only from deals where counsel is named</b> (${attributed} of ${DEALS.length} tracked). To avoid noise from one-off appearances, only firms with <b>≥${MIN} mandates</b> are ranked. Aggregate value sums every attributed deal's value; a firm is credited on every side it is named on. Click any firm to open its page.</p></div>
    </div>`;
  $("main").querySelectorAll("[data-firm]").forEach(n=>n.onclick=()=>go({name:"firm",id:decodeURIComponent(n.dataset.firm)}));
}

/* ============================ REGULATORY TRACKER ============================ */
let regQuery="";
function lawId(t){return t.toLowerCase().replace(/&/g," ").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function findLaw(id){for(const A of REGLIB)for(const it of A.items)if(lawId(it.t)===id)return {it,area:A.area};return null;}
function dealChip(id){const d=DEALS.find(x=>x.id===id);if(!d)return "";const h=d.headline||"";const t=h.length>44?h.slice(0,44)+"…":h;return `<span class="dealchip" data-deal="${id}" title="${h.replace(/"/g,'&quot;')}">${t}</span>`;}
function lawChip(id){const f=findLaw(id);if(!f)return "";return `<span class="lawchip" data-law="${id}">§ ${f.it.t}</span>`;}
function renderRegulatory(){
  const trackerCards=REGITEMS.map(r=>{
    const src=(r.sources||[]).map(s=>`<div class="srcitem"><div class="st"><span class="snm">${s.name}</span>${s.official?`<span class="otag" title="${escA(TIP_OFFICIAL)}">OFFICIAL</span>`:''}<a class="sgo" href="${s.url}" target="_blank" rel="noopener">Open ↗</a></div><div class="sblurb">${s.blurb}</div></div>`).join("");
    return `<div class="regc">
      <div class="rt">${r.title}</div>
      <div class="rmeta"><span class="rpill">${r.reg}</span><span class="rpill">${r.status}</span><span class="rpill">Effective: ${r.effective}</span>${r.deadline&&r.deadline!=="—"?`<span class="rpill dead">⏱ ${r.deadline}</span>`:""}</div>
      <div class="rlab">What it changes</div><p>${r.impact}</p>
      <div class="rlab">Action for your documents</div><p class="ract">${r.action}</p>
      <div class="rlab" style="margin-bottom:8px">Sources</div>${src}
      ${(r.deals&&r.deals.length)?`<div class="rlab">Connected deals</div><div class="lawrefs">${r.deals.map(dealChip).filter(Boolean).join("")}</div>`:(r.linkDeal?`<div class="rlab">Connected deal</div><div class="lawrefs">${dealChip(r.linkDeal)}</div>`:"")}
      ${(r.laws&&r.laws.length)?`<div class="rlab">Connected law</div><div class="lawrefs">${r.laws.map(lawChip).filter(Boolean).join("")}</div>`:""}
    </div>`;}).join("");

  const q=regQuery.trim().toLowerCase();
  const match=it=>!q||(it.t+" "+it.governs+" "+(it.amended||"")+" "+it.key.map(k=>k.s+" "+k.n).join(" ")).toLowerCase().includes(q);
  const areasHtml=REGLIB.map((A,ai)=>{
    const items=A.items.filter(match); if(!items.length)return "";
    const cards=items.map(it=>{
      const keys=it.key.map(k=>`<div class="keyrow"><span class="keys">${k.s}</span><span class="keyn">${k.n}</span></div>`).join("");
      const amd=it.amended?`<div class="lawamd"><b>Recently amended ·</b> ${it.amended}</div>`:"";
      const deals=(it.deals||[]).map(dealChip).filter(Boolean).join("");
      const off=(it.official||[]).map(o=>`<a class="sgo" href="${o.u}" target="_blank" rel="noopener">${o.l} ↗</a>`).join("  ·  ");
      const hasDetail=!!LAWDETAIL[lawId(it.t)];
      return `<div class="lawcard" data-law="${lawId(it.t)}"><div class="lt">${it.t} <span class="lawopen">${hasDetail?"Open masterclass →":"Open →"}</span></div><div class="lg">${it.governs}</div>
        <div class="lawkeylbl">Key provisions</div>${keys}${amd}
        ${deals?`<div class="lawkeylbl">Applies to deals on the tracker</div><div class="lawrefs">${deals}</div>`:""}
        ${off?`<div class="lawkeylbl">Official source</div><div class="lawrefs">${off}</div>`:""}</div>`;}).join("");
    return `<div class="regarea" id="regarea-${ai}"><h3>${A.area}</h3><div class="ai">${A.intro}</div>${cards}</div>`;}).join("");
  const nav=REGLIB.map((A,ai)=>`<span class="chip" data-jump="regarea-${ai}">${A.area}</span>`).join("");
  const total=REGLIB.reduce((n,a)=>n+a.items.length,0);

  $("main").innerHTML=`<div class="vh"><h2>Regulatory Radar</h2><span class="sub">${REGITEMS.length} active · every item carries its deadline and the action for your documents</span></div>${trackerCards}
    <div class="vh" style="margin-top:26px"><h2>Regulatory Library</h2><span class="sub">${total} statutes &amp; regulations · cross-referenced to tracked deals</span></div>
    <div class="search" style="max-width:none;margin-bottom:13px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b93a3" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><input id="regq" type="text" placeholder="Search the library — e.g. QIP, Section 230, angel tax, Press Note 3, leverage cap…" value="${regQuery.replace(/"/g,'&quot;')}"></div>
    <div class="regnav">${nav}</div>
    ${areasHtml||'<div class="empty">No provisions match your search.</div>'}
    <div class="foot">A study &amp; checklist aid for transactional review — not legal advice. Always read the current text of the law and the latest amendments.</div>`;
  $("main").querySelectorAll(".lawcard[data-law]").forEach(c=>c.onclick=e=>{if(e.target.closest("a,[data-deal],.lawchip"))return;go({name:"law",id:c.dataset.law});});
  $("main").querySelectorAll(".lawchip[data-law]").forEach(n=>n.onclick=e=>{e.stopPropagation();go({name:"law",id:n.dataset.law});});
  $("main").querySelectorAll("[data-deal]").forEach(n=>n.onclick=e=>{e.stopPropagation();go({name:"deal",id:n.dataset.deal});});
  $("main").querySelectorAll(".lawrefs a").forEach(a=>a.onclick=e=>e.stopPropagation());
  $("main").querySelectorAll("[data-jump]").forEach(n=>n.onclick=()=>document.getElementById(n.dataset.jump)?.scrollIntoView({behavior:"smooth",block:"start"}));
  const ri=$("regq");
  if(ri){ri.oninput=e=>{regQuery=e.target.value;renderRegulatory();};ri.focus();ri.setSelectionRange(ri.value.length,ri.value.length);}
}

/* ============================ LAW DETAIL ============================ */
function renderLaw(id){
  const found=findLaw(id); if(!found){go({name:"regulatory"});return;}
  const it=found.it, area=found.area, D=LAWDETAIL[id]||{};
  const provs=(D.provisions&&D.provisions.length)?D.provisions:it.key.map(k=>({s:k.s,t:"",d:k.n}));
  const provHtml=provs.map(p=>`<div class="lpro"><div class="lpro-s">${p.s}</div><div class="lpro-b">${p.t?`<b>${p.t}.</b> `:""}${p.d}</div></div>`).join("");
  const amds=(D.amendments&&D.amendments.length)?D.amendments:(it.amended?[{date:"Recent",t:"",d:it.amended}]:[]);
  const amdHtml=amds.length?`<div class="sec"><h4>Recent amendments — what changed for deals</h4>${amds.map(a=>`<div class="amdc"><div class="amdc-d">${a.date}</div><div class="amdc-b">${a.t?`<b>${a.t}.</b> `:""}${a.d}</div></div>`).join("")}</div>`:"";
  const play=(D.playbook&&D.playbook.length)?`<div class="sec"><h4>Transactional playbook · practical insights</h4><ul class="play">${D.playbook.map(x=>`<li>${x}</li>`).join("")}</ul></div>`:"";
  const pit=(D.pitfalls&&D.pitfalls.length)?`<div class="sec"><h4>Common pitfalls &amp; drafting points</h4><ul class="play pit">${D.pitfalls.map(x=>`<li>${x}</li>`).join("")}</ul></div>`:"";
  const cs=casesFor(id);
  const casesHtml=cs.length?`<div class="sec"><h4>Leading cases</h4>${cs.map(c=>`<div class="casec"><div class="case-n">${c.name} <span class="case-c">${c.cite}</span></div><div class="case-h">${c.held}</div></div>`).join("")}</div>`:"";
  const deals=(it.deals||[]).map(dealChip).filter(Boolean).join("");
  const off=(it.official||[]).map(o=>`<div class="doc" onclick="window.open('${o.u}','_blank','noopener')"><span class="di">§</span>${o.l}<span style="margin-left:auto;color:var(--ink3)">↗</span></div>`).join("");
  $("main").innerHTML=`
    <span class="back" onclick="go({name:'regulatory'})">← Regulatory Library</span>
    <div class="dd">
      <div class="dd-head"><span class="rpill" style="background:var(--accent-soft);color:var(--accent)">${area}</span>${D.amendments&&D.amendments.length?'<span class="official">RECENTLY AMENDED</span>':''}</div>
      <h1>${it.t}</h1>
      <div class="lede">${D.overview||it.governs}</div>
      <div class="actbar"><button class="abtn" id="lawLink">Copy link</button></div>
      <div class="dd-grid">
        <div>
          <div class="sec"><h4>Provisions that matter in practice <span style="font-weight:500;text-transform:none;letter-spacing:0;color:var(--ink4)">(${provs.length})</span></h4>${provHtml}</div>
          ${amdHtml}
          ${play}
          ${pit}
          ${casesHtml}
        </div>
        <div>
          <div class="sec"><h4>At a glance</h4><div class="side-meta">
            <div class="mrow"><span class="mk">Area</span><span class="mv">${area}</span></div>
            <div class="mrow"><span class="mk">Governs</span><span class="mv" style="text-align:right">${it.governs.length>60?it.governs.slice(0,60)+"…":it.governs}</span></div>
            <div class="mrow"><span class="mk">Provisions</span><span class="mv">${provs.length} key</span></div>
            <div class="mrow"><span class="mk">Status</span><span class="mv">${amds.length?"Recently amended":"In force"}</span></div>
          </div></div>
          ${deals?`<div class="sec"><h4>Where it shows up · tracked deals</h4><div class="lawrefs" style="flex-direction:column;align-items:stretch;gap:7px">${deals}</div></div>`:""}
          <div class="sec"><h4>Read the law</h4>${off||'<div class="note">Official link in the library.</div>'}</div>
        </div>
      </div>
    </div>`;
  $("main").querySelectorAll("[data-deal]").forEach(n=>n.onclick=()=>go({name:"deal",id:n.dataset.deal}));
  $("lawLink")&&($("lawLink").onclick=()=>copyText(location.origin+location.pathname+"#/law/"+encodeURIComponent(id),"Link copied"));
}

/* ============================ MOVES ============================ */
function renderMoves(){
  const tcol={"GC appointment":["var(--teal)","var(--teal-soft)"],"Promotion":["var(--green)","var(--green-soft)"],"Lateral move":["var(--accent)","var(--accent-soft)"],"Update":["var(--slate)","var(--slate-soft)"]};
  function initials(m){const n=(m.who||m.org||m.headline||"").replace(/^(the\s+)/i,"").trim();const p=n.split(/\s+/).filter(Boolean);return ((p[0]||" ")[0]+(p[1]||" ")[0]).toUpperCase();}
  const rows=MOVES.map(m=>{const [c,bg]=tcol[m.type]||tcol["Update"];return `<div class="moverow" onclick="window.open('${m.url}','_blank','noopener')">
    <span class="mv-avatar" style="background:${bg};color:${c}">${initials(m)}</span>
    <div class="mv-main"><div class="mv-who">${m.who||m.headline}</div>${m.who?`<div class="mv-what">${m.what}${m.org?` · <span style="color:var(--ink3)">${m.org}</span>`:""}</div>`:""}</div>
    <div class="mv-right"><span class="mtype" style="background:${bg};color:${c}">${m.type}</span><span class="mv-date">${m.date}</span></div></div>`;}).join("");
  $("main").innerHTML=`<div class="vh"><h2>People Moves</h2><span class="sub">${MOVES.length} recent · lateral moves and GC changes are pitch triggers — a new GC reopens every panel</span></div>${rows}
    <div class="foot">Auto-expands as the engine ingests the Corporate &amp; In-House wire nightly.</div>`;
}

/* ============================ MARKET THEMES ============================ */
function renderTrends(){
  const cards=TRENDS.map(t=>{
    const src=(t.sources||[]).map(s=>`<a class="sgo" href="${s.url}" target="_blank" rel="noopener">${s.name} ↗</a>`).join("  ·  ");
    const deals=(t.deals||[]).map(dealChip).filter(Boolean).join("");
    const laws=(t.laws||[]).map(lawChip).filter(Boolean).join("");
    return `<div class="trendcard"><div class="tt">${t.title}</div><div class="tsum">${t.summary}</div>
      ${deals?`<div class="lawkeylbl">Connected deals</div><div class="lawrefs">${deals}</div>`:""}
      ${laws?`<div class="lawkeylbl">Connected law</div><div class="lawrefs">${laws}</div>`:""}
      <div class="lawkeylbl">Sources</div><div class="lawrefs">${src}</div></div>`;}).join("");
  $("main").innerHTML=`<div class="vh"><h2>Market Trends</h2><span class="sub">${TRENDS.length} trends connecting deals, firms and regulation</span></div>${cards}
    <div class="foot">Each theme links to the deals and law it touches.</div>`;
  $("main").querySelectorAll("[data-deal]").forEach(n=>n.onclick=()=>go({name:"deal",id:n.dataset.deal}));
  $("main").querySelectorAll("[data-law]").forEach(n=>n.onclick=()=>go({name:"law",id:n.dataset.law}));
}

/* ============================ PRECEDENT SEARCH ============================ */
let P={type:"",sector:"All Sectors",bucket:""};
function bucketOk(d,b){if(!b)return true;const cr=parseCr(d.value);if(b==="mega")return cr>=5000;if(b==="large")return cr>=1000&&cr<5000;if(b==="mid")return cr>0&&cr<1000;return true;}
function renderPrecedents(){
  const list=DEALS.filter(d=>(!P.type||d.type===P.type)&&(P.sector==="All Sectors"||d.sector===P.sector)&&bucketOk(d,P.bucket));
  const typeOpts=`<option value="">Any type</option>`+Object.entries(TYPES).filter(([k])=>DEALS.some(d=>d.type===k)).map(([k,v])=>`<option value="${k}" ${P.type===k?"selected":""}>${v.label}</option>`).join("");
  const secOpts=SECTORS.map(s=>`<option ${P.sector===s?"selected":""}>${s}</option>`).join("");
  const bucketOpts=[["","Any value"],["mega","≥ ₹5,000 cr"],["large","₹1,000–5,000 cr"],["mid","< ₹1,000 cr"]].map(([v,l])=>`<option value="${v}" ${P.bucket===v?"selected":""}>${l}</option>`).join("");
  const rows=list.map(d=>{const sx=structOf(d);return `<div class="card" data-deal="${d.id}"><div class="r1">${typeBadge(d)}${d.value&&d.value!=="—"?`<span class="tag val">${d.value}</span>`:""}<span class="tag">${d.sector}</span>${reviewedBy(d)?'<span class="rev">✔ Reviewed</span>':''}<span style="margin-left:auto"></span>${cmpBtn(d)}<span class="go">View precedent →</span></div><h3>${d.headline}</h3>${sx&&sx.consideration&&sx.consideration!=="—"?`<div class="sum"><b>Structure:</b> ${sx.consideration}</div>`:""}<div class="firms"><b>Counsel:</b> ${d.firms.map(f=>f.name).join(" · ")}</div></div>`;}).join("");
  $("main").innerHTML=`<div class="vh"><h2>Precedent Transactions</h2><span class="sub">${list.length} comparable deals · filter by type, sector and size — pick 2–4 to compare</span></div>
    <div class="frow" style="grid-template-columns:1fr 1fr 1fr;max-width:660px;margin-bottom:16px">
      <div class="fld"><label>Deal type</label><select id="pcType">${typeOpts}</select></div>
      <div class="fld"><label>Sector</label><select id="pcSector">${secOpts}</select></div>
      <div class="fld"><label>Deal size</label><select id="pcBucket">${bucketOpts}</select></div></div>
    <div class="feed">${rows||'<div class="empty">No matching precedents — widen the filters.</div>'}</div>`;
  $("pcType").onchange=e=>{P.type=e.target.value;renderPrecedents();};
  $("pcSector").onchange=e=>{P.sector=e.target.value;renderPrecedents();};
  $("pcBucket").onchange=e=>{P.bucket=e.target.value;renderPrecedents();};
  bindCards();
}

