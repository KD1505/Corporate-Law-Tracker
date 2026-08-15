/* ============================ REGULATORY CALENDAR ============================ */
function parseRegDate(s=""){const m=String(s).match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);if(m){const t=Date.parse(`${m[1]} ${m[2]} ${m[3]}`);if(t)return t;}const y=String(s).match(/(20\d{2})/);return y?Date.parse(`1 Jan ${y[1]}`):0;}
function renderCalendar(){
  const entries=[];
  REGITEMS.forEach(r=>entries.push({t:parseRegDate(r.effective),date:r.effective,title:r.title,note:r.impact,tag:r.reg,deadline:(r.deadline&&r.deadline!=="—")?r.deadline:"",law:(r.laws&&r.laws[0])||null,deal:(r.deals&&r.deals[0])||r.linkDeal||null}));
  Object.entries(LAWDETAIL).forEach(([lid,D])=>(D.amendments||[]).forEach(a=>{const f=findLaw(lid);entries.push({t:parseRegDate(a.date),date:a.date,title:(f?f.it.t:lid)+(a.t?" - "+a.t:""),note:a.d,tag:"Amendment",deadline:"",law:lid,deal:null});}));
  entries.sort((a,b)=>b.t-a.t);
  const rows=entries.map(e=>`<div class="calrow"><div class="cal-d">${e.date}</div><div class="cal-b"><div class="cal-t">${e.title} <span class="rpill" style="font-size:9.5px">${e.tag}</span>${e.deadline?`<span class="rpill dead" style="font-size:9.5px">⏱ ${e.deadline}</span>`:""}</div><div class="cal-n">${e.note}</div><div class="cal-links">${e.law?`<span class="lawchip" data-law="${e.law}">§ Open in Library</span>`:""}${e.deal?dealChip(e.deal):""}</div></div></div>`).join("");
  $("main").innerHTML=`<div class="vh"><h2>Regulatory Calendar</h2><span class="sub">${entries.length} dated items · effective dates, deadlines and amendments on one timeline</span></div>${rows}
    <div class="foot">Auto-extends as regulator notifications and amendments are ingested nightly.</div>`;
  $("main").querySelectorAll("[data-law]").forEach(n=>n.onclick=()=>go({name:"law",id:n.dataset.law}));
  $("main").querySelectorAll("[data-deal]").forEach(n=>n.onclick=()=>go({name:"deal",id:n.dataset.deal}));
}

/* ============================ FOR YOU (personalisation) ============================ */
function loadPractice(){try{return JSON.parse(localStorage.getItem("clt_practice")||"null");}catch{return null;}}
function savePractice(p){try{p?localStorage.setItem("clt_practice",JSON.stringify(p)):localStorage.removeItem("clt_practice");}catch{}}
function renderForYou(){
  const p=loadPractice();
  if(!p||(!p.sectors.length&&!p.types.length)){
    $("main").innerHTML=`<div class="vh"><h2>Set up your practice</h2><span class="sub">Pick your areas - My Practice (and your daily brief) is scoped to them</span></div>
      <div class="sec"><h4>Sectors</h4><div class="fb" id="pSec">${SECTORS.filter(s=>s!=="All Sectors").map(s=>`<span class="chip" data-sec="${s}">${s}</span>`).join("")}</div>
        <h4 style="margin-top:16px">Deal types</h4><div class="fb" id="pType">${Object.entries(TYPES).map(([k,v])=>`<span class="chip" data-type="${k}">${v.label}</span>`).join("")}</div>
        <button class="mbtn primary" id="pSave" style="margin-top:16px">Save my practice</button></div>`;
    const sel={sectors:new Set(),types:new Set()};
    $("main").querySelectorAll("#pSec .chip").forEach(c=>c.onclick=()=>{c.classList.toggle("on");const v=c.dataset.sec;sel.sectors.has(v)?sel.sectors.delete(v):sel.sectors.add(v);});
    $("main").querySelectorAll("#pType .chip").forEach(c=>c.onclick=()=>{c.classList.toggle("on");const v=c.dataset.type;sel.types.has(v)?sel.types.delete(v):sel.types.add(v);});
    $("pSave").onclick=()=>{savePractice({sectors:[...sel.sectors],types:[...sel.types]});render();};
    return;
  }
  const list=DEALS.filter(d=>(p.sectors.length?p.sectors.includes(d.sector):true)&&(p.types.length?p.types.includes(d.type):true));
  const label=[...p.sectors,...p.types.map(t=>TY(t)?TY(t).label:t)].join(", ")||"your practice";
  $("main").innerHTML=`<div class="vh"><h2>My Practice</h2><span class="sub">${list.length} matching · ${label} · <span style="color:var(--accent);cursor:pointer;font-weight:700" id="pEdit">Edit practice</span></span></div>
    ${toolbarHtml(list,{scope:"My Practice"})}
    <div class="feed">${list.length?sortList(list).map(density==="compact"?dealRow:dealCard).join(""):'<div class="empty">Nothing in your areas yet - it will populate as deals come in.</div>'}</div>`;
  $("pEdit").onclick=()=>{savePractice(null);render();};
  bindCards();bindToolbar(list,"My Practice - "+label);
}

/* ============================ SAVED VIEWS ============================ */
function loadSaved(){try{return JSON.parse(localStorage.getItem("clt_saved")||"[]");}catch{return[];}}
function persistSaved(a){try{localStorage.setItem("clt_saved",JSON.stringify(a));}catch{}}
function currentLabel(){const b=[];if(F.firm)b.push(F.firm);if(F.firm2)b.push("+"+F.firm2);if(F.city)b.push(CL(F.city));else if(F.geo!=="all")b.push(CL(F.geo));if(F.type)b.push(TY(F.type).label);if(F.stage)b.push(ST(F.stage).l);if(F.sector!=="All Sectors")b.push(F.sector);if(F.q)b.push('"'+F.q+'"');return b.join(" · ")||"All deals";}
function saveCurrentView(){const a=loadSaved();a.unshift({label:currentLabel(),F:JSON.parse(JSON.stringify(F)),n:DEALS.filter(matchesFilters).length,at:Date.now()});persistSaved(a.slice(0,30));toast("View saved");render();}
function countForF(sf){const o=F;F=sf;const n=DEALS.filter(matchesFilters).length;F=o;return n;}
function renderSaved(){
  const a=loadSaved();
  const body=a.length?a.map((s,i)=>{
    const cur=countForF(s.F);const delta=cur-(typeof s.n==="number"?s.n:cur);
    const when=s.at?new Date(s.at).toLocaleDateString("en-GB",{day:"numeric",month:"short"}):"";
    const meta=`${cur} match${cur===1?"":"es"}${delta>0?` · <span style="color:var(--green);font-weight:700">+${delta} since ${when}</span>`:(when?` · saved ${when}`:" · click to run")}`;
    return `<div class="moverow"><div data-apply="${i}" style="flex:1;cursor:pointer"><div class="mv-who">${s.label}</div><div class="mv-what">${meta}</div></div><span class="delx" data-del="${i}">✕ remove</span></div>`;
  }).join(""):'<div class="empty">No saved views yet. Apply filters on the feed, then click <b>Save &amp; track</b> in the toolbar. Saved views also seed your daily brief.</div>';
  $("main").innerHTML=`<div class="vh"><h2>Saved &amp; Alerts</h2><span class="sub">${a.length} saved · standing questions you can re-run in one click - these seed your daily brief</span></div>${body}`;
  $("main").querySelectorAll("[data-apply]").forEach(n=>n.onclick=()=>{F=JSON.parse(JSON.stringify(loadSaved()[+n.dataset.apply].F));$("q").value=F.q||"";go({name:"feed"});});
  $("main").querySelectorAll("[data-del]").forEach(n=>n.onclick=()=>{const a=loadSaved();a.splice(+n.dataset.del,1);persistSaved(a);renderSaved();});
}

/* ============================ MAIN RENDER ============================ */
function render(){
  markSidebar();syncCounts();renderCmpBar();
  if(route.name==="feed"){
    const list=DEALS.filter(matchesFilters);
    let title="All India",bits=[];
    if(F.firm)bits.push(F.firm); if(F.firm2)bits.push("+ "+F.firm2);
    if(F.city)bits.push(CL(F.city)); else if(F.geo!=="all")bits.push(CL(F.geo));
    if(F.type)bits.push(TY(F.type).label); if(F.stage)bits.push(ST(F.stage).l);
    if(F.sector!=="All Sectors")bits.push(F.sector);
    if(bits.length)title=bits.join(" · ");
    renderFeed(title,list);
  }
  else if(route.name==="firms")renderFirms();
  else if(route.name==="firm")renderFirm(route.id);
  else if(route.name==="deal")renderDeal(route.id);
  else if(route.name==="pipeline")renderPipeline();
  else if(route.name==="analytics")renderAnalytics();
  else if(route.name==="coverage")renderCoverage();
  else if(route.name==="regulatory")renderRegulatory();
  else if(route.name==="law")renderLaw(route.id);
  else if(route.name==="trends")renderTrends();
  else if(route.name==="precedents")renderPrecedents();
  else if(route.name==="calendar")renderCalendar();
  else if(route.name==="foryou")renderForYou();
  else if(route.name==="moves")renderMoves();
  else if(route.name==="saved")renderSaved();
  else if(route.name==="compare")renderCompare();
  else if(route.name==="watch")renderFeed("Watchlist",DEALS.filter(d=>starred.has(d.id)),starred.size+" starred");
}

/* ============================ INIT ============================ */
$("q").addEventListener("input",e=>{F.q=e.target.value;if(route.name!=="feed")route={name:"feed"};render();});
document.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement.tagName!=="INPUT"&&document.activeElement.tagName!=="SELECT"&&document.activeElement.tagName!=="TEXTAREA"){e.preventDefault();$("q").focus();}
  if(e.key==="Escape"){$("adv").classList.remove("on");$("meth").classList.remove("on");$("sub").classList.remove("on");}});
$("theme").onclick=()=>{const h=document.documentElement;h.dataset.theme=h.dataset.theme==="dark"?"light":"dark";lsSet("clt_theme",h.dataset.theme);};
(function(){const t=lsGet("clt_theme",null);if(t)document.documentElement.dataset.theme=t;})();
$("methOpen").onclick=openMeth;
$("methClose").onclick=()=>$("meth").classList.remove("on");
$("meth").onclick=e=>{if(e.target.id==="meth")$("meth").classList.remove("on");};
$("briefOpen").onclick=openSub;
$("subClose").onclick=()=>$("sub").classList.remove("on");
$("sub").onclick=e=>{if(e.target.id==="sub")$("sub").classList.remove("on");};
$("subForm").onsubmit=e=>{e.preventDefault();submitEmail($("subEmail").value,$("subBtn"),()=>{$("subBody").innerHTML=`<div class="brief-ok" style="margin-top:6px"><span class="tick">✓</span><span>You're on the list - the first brief lands tomorrow morning.</span></div>`;});};
route=parseHash();
buildSidebar();buildRail();buildAdv();render();

try{if(window.CLT_DATA&&window.CLT_DATA.UPDATED){var _u=document.getElementById("updated");if(_u)_u.textContent=window.CLT_DATA.UPDATED;}}catch(e){}

/* Mobile nav drawer + ⌘K search */
(function(){
  var t=document.getElementById("navToggle"), bd=document.getElementById("navBackdrop"), body=document.body;
  function setOpen(o){ body.classList.toggle("nav-open",o); if(t)t.setAttribute("aria-expanded",o?"true":"false"); }
  if(t)t.addEventListener("click",function(){ setOpen(!body.classList.contains("nav-open")); });
  if(bd)bd.addEventListener("click",function(){ setOpen(false); });
  document.addEventListener("click",function(e){ if(e.target.closest && e.target.closest("aside .ni")) setOpen(false); });
  document.addEventListener("keydown",function(e){
    if((e.metaKey||e.ctrlKey)&&(e.key==="k"||e.key==="K")){ e.preventDefault(); var q=document.getElementById("q"); if(q){ q.focus(); try{q.select();}catch(_){} } }
    if(e.key==="Escape") setOpen(false);
  });
})();
