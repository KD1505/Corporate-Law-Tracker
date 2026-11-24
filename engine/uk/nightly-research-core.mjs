// Research-only pipeline. Retrieved metadata cannot promote a candidate or certify a claim.
export function validateQuality(data,floor){
 const errors=[],tx=data.records.filter(r=>r.category==="Transactions"),by=new Map(tx.map(r=>[r.id,r])),old=new Map(floor.records.map(x=>[x.id,x]));
 if(by.size!==tx.length)errors.push("duplicate transaction IDs");
 for(const f of floor.records){const r=by.get(f.id);if(!r){errors.push(f.id+": removed without approved floor change");continue}
  if(new Set(r.sources.map(s=>s.url)).size<f.minSources)errors.push(r.id+": source floor");
  if(f.deep&&!r.research)errors.push(r.id+": lost research");
  if((r.research?.claims?.length||0)<f.minClaims)errors.push(r.id+": lost findings");
  if((r.advisers?.length||0)<f.minAdvisers)errors.push(r.id+": lost adviser associations");
  if(f.mappedEvent&&!r.factSources?.length)errors.push(r.id+": lost event evidence");
 }
 const strict=new Set(floor.strictIds||[]);
 for(const r of tx){
  const links=new Set((r.sources||[]).map(s=>s.url)),newRecord=!old.has(r.id)||strict.has(r.id),research=r.research,questions=research?.openQuestions||[];
  if([...links].some(u=>!/^https:\/\/[^/]+\/.+/.test(u)))errors.push(r.id+": invalid source URL");
  for(const u of [...(r.factSources||[]),...(r.timeline||[]).map(x=>x.source),...(r.advisers||[]).map(x=>x.source),...(r.values||[]).map(x=>x.source)])if(!links.has(u))errors.push(r.id+": dangling source");
  for(const f of research?.claims||[])if(!f.text||!f.evidence?.length||f.evidence.some(e=>!links.has(e.url)||!e.locator||!e.publisher))errors.push(r.id+": finding without evidence locator");
  if(newRecord){
   if(links.size<2||!r.factSources?.length||!r.announcedOn||!r.structure||!r.parties?.length||!r.analysis||!r.legalWork||!r.watch||!r.timeline?.length||(research?.claims?.length||0)<4||(research?.workstreams?.length||0)<4||(research?.documents?.length||0)<2||!questions.length)errors.push(r.id+": new dossier lacks mandatory research modules");
   if(!r.values?.length&&!questions.some(x=>/value|price|consideration|disclos/i.test(x)))errors.push(r.id+": value gap not documented");
   if(!r.advisers?.length&&!questions.some(x=>/counsel|adviser/i.test(x)))errors.push(r.id+": adviser gap not documented");
  }
  for(const a of r.advisers||[])if(!a.client||!a.scope||!data.firms.some(f=>f.id===a.firmId))errors.push(r.id+": invalid adviser mandate");
  for(const x of r.values||[]){if(!x.basis||!x.unit||!x.disclosure||(!Number.isFinite(x.numericAmount)&&x.disclosure!=="explicit-none"))errors.push(r.id+": invalid financial value")}
 }
 return errors;
}
const terminal=/^(completed|abandoned|withdrawn|terminated|restructured deal cleared|notes issued|securitisation completed|project sold)/i;
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function key(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(16)}
export function buildState({data,discovery,documents,feeds,policy,archive={items:[]},previous={},today}){
 const tx=data.records.filter(r=>r.category==="Transactions"),byCase=new Map();
 for(const r of tx)for(const s of r.sources){const path=s.url.match(/^https:\/\/www\.gov\.uk(\/cma-cases\/[a-z0-9-]+)\/?$/)?.[1];if(path){const set=byCase.get(path)||new Set();set.add(r.id);byCase.set(path,set)}}
 const prev=new Map((previous.leads||[]).map(x=>[x.id,x])),leads=new Map(),tasks=[];
 const add=(id,fields)=>{const old=prev.get(id);const fingerprint=key(JSON.stringify([fields.title,fields.sourceUpdated,fields.documents||[],fields.related||[]]));leads.set(id,{id,...fields,firstSeen:old?.firstSeen||today,lastSeen:today,changed:!!old&&old.fingerprint!==fingerprint,fingerprint,reviewState:old?.fingerprint===fingerprint?old.reviewState||"pending":"pending",publication:"candidate only; review required"})};
 const docMap=new Map((documents.items||[]).map(x=>[x.path,x]));
 const live=new Set((discovery.items||[]).map(x=>x.path));
 for(const x of [...(discovery.items||[]),...(archive.items||[]).filter(x=>!live.has(x.path))]){if(!/^\/cma-cases\/[a-z0-9-]+$/.test(x.path))continue;const doc=docMap.get(x.path),related=[...(byCase.get(x.path)||[])],recent=live.has(x.path);add("cma:"+x.path,{title:x.title,url:"https://www.gov.uk"+x.path,sourceUpdated:doc?.updated||x.sourceUpdated||null,documents:(doc?.documents||[]).map(y=>({url:y.url,title:y.title})),related,kind:related.length?"existing-case-update":recent?"new-regulatory-candidate":"historical-regulatory-candidate",priority:related.length?80:recent?45:20})}
 for(const f of feeds.sources||[])if(f.status==="ok")for(const x of f.items||[]){if(!/^https:\/\//.test(x.url)||!x.title)continue;const related=(f.related||[]).filter(id=>tx.some(r=>r.id===id));add("filing:"+x.url,{title:x.title,url:x.url,sourceUpdated:x.date||null,related,kind:f.cik?"issuer-filing-lead":"counsel-lead",priority:related.length?60:35})}
 // A bounded source feed can roll off older leads; never equate absence with completion.
 for(const [id,x] of prev)if(!leads.has(id)&&x.reviewState==="pending")leads.set(id,{...x,changed:false,notInCurrentWindow:true});
 const ledger=[];
 for(const r of tx){const active=!terminal.test(r.status),deadline=r.deadline?.date||null,days=deadline?Math.round((Date.parse(deadline)-Date.parse(today))/86400000):null;
  const task=(kind,priority,detail)=>tasks.push({id:r.id+":"+kind,transactionId:r.id,kind,priority,detail,state:"review-required"});
  if(active)task("lifecycle",days!==null&&days<=3?100:80,deadline?"Check authority and issuer updates; recorded deadline "+deadline:"Check actual closing, amendments and regulator updates");
  if(!r.research)task("deep-research",75,"Read original deal documents; consolidate structure, economics, business context and legal workstreams");
  if(!r.advisers?.length)task("adviser",70,"Search buyer, target, seller, finance and regulatory mandates separately");
  if(!r.values?.length)task("financial",65,"Establish typed amounts or document genuine non-disclosure");
  if(!r.factSources?.length)task("event-evidence",75,"Map event assertions to primary documents");
  if(!r.announcedOn)task("announcement-date",50,"Distinguish announcement, signing, mandate disclosure and regulatory event");
  for(const [i,q] of (r.research?.openQuestions||[]).entries())task("open-"+key(q),active?65:40,q);
  task("claim-review",active?70:35,"Review document entailment and source independence; link mapping is not certification");
  for(const c of r.research?.claims||[])ledger.push({id:r.id+":finding:"+slug(c.heading),transactionId:r.id,kind:"editorial-finding",heading:c.heading,statement:c.text,qualification:c.qualification,links:c.evidence.map(e=>({...e,originGroup:null})),status:"source-linked; independent entailment review pending"});
  for(const [kind,items] of [["value",r.values||[]],["adviser",r.advisers||[]],["event",r.timeline||[]]])for(const item of items){const identity=kind==="value"?[item.basis,item.label]:kind==="adviser"?[item.firmId,item.client,item.scope]:[item.date,item.event];ledger.push({id:r.id+":"+kind+":"+key(JSON.stringify(identity)),transactionId:r.id,kind,value:item,links:[{url:item.source,locator:null,originGroup:null}],status:"source-linked; precise locator and entailment review pending"})}
  ledger.push({id:r.id+":summary",transactionId:r.id,kind:"summary",statement:r.fact,links:(r.factSources||[]).map(url=>({url,locator:null,originGroup:null})),status:r.factSources?.length?"source-linked; split into atomic claims and verify":"unmapped summary; review required"});
 }
 const health=[...(feeds.sources||[]),...(policy.sources||[])].map(x=>({id:x.id||x.name,name:x.name,status:x.status,checkedAt:x.checkedAt||null,itemCount:x.items?.length||0,healthy:x.status==="ok"&&!!x.items?.length}));
 const ordered=[...leads.values()].sort((a,b)=>(b.priority+(b.changed?20:0))-(a.priority+(a.changed?20:0))||a.id.localeCompare(b.id));
 return {schemaVersion:1,asOf:today,notice:"Research candidates, health and evidence pointers only. No auto-promotion or inference of independence.",records:tx.length,health,caseRetrieval:{succeeded:documents.succeeded??null,failed:documents.failed||[],checkedAt:documents.checkedAt||null},tasks:tasks.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)),leads:ordered,ledger,summary:{candidateCount:ordered.length,changedLeads:ordered.filter(x=>x.changed).length,openTasks:tasks.length,linkedLedgerEntries:ledger.filter(x=>x.links.length).length,unmappedLedgerEntries:ledger.filter(x=>!x.links.length).length,independentCertification:null}};
}
