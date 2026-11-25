import fs from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==="object")return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));return v;}
function key(v){return String(v??"").normalize("NFKC").trim().toLowerCase().replace(/\s+/g," ");}
function inventory(data,digest){
 const rows=[],documents=new Map(),ids=new Set(),errors=[];
 for(const r of data.records.filter(x=>x.category==="Transactions")){
  const sources=new Set(r.sources.map(s=>s.url));
  function add(kind,identity,statement,evidence,qualification){
   const id=[r.id,kind,...identity.map(x=>encodeURIComponent(key(x)))].join("/");
   if(identity.some(x=>!key(x))||ids.has(id))errors.push("Missing or duplicate review identity: "+id);ids.add(id);
   const edges=evidence.map(e=>({url:e.url,publisher:e.publisher||null,locator:e.locator||null}));
   for(const e of edges){if(!sources.has(e.url))errors.push("Unregistered evidence: "+id+" "+e.url);if(!documents.has(e.url))documents.set(e.url,{url:e.url,publishers:[],originGroup:null,derivativeOf:null,rightsReview:"pending",reviewState:"pending"});const doc=documents.get(e.url);if(e.publisher&&!doc.publishers.includes(e.publisher))doc.publishers.push(e.publisher);}
   const revision=digest(JSON.stringify(stable({statement,evidence:edges,qualification})));
   rows.push({id,transactionId:r.id,kind,statement,qualification,evidence:edges,revision,priority:["deadline","status"].includes(kind)?"P0":["financial-value","legal-adviser","financial-adviser","chronology","summary","financing","regulatory","structure"].includes(kind)?"P1":"P2",evidenceState:!edges.length?"missing":edges.every(e=>e.locator&&e.publisher)?"locator-recorded":"document-only",atomicity:"not-assessed",reviewState:"pending",independentReview:null});
  }
  const refs=(urls=[])=>[...new Set(urls)].map(url=>({url}));
  for(const c of r.research?.claims||[])add("finding",[c.heading],{heading:c.heading,text:c.text},c.evidence||[],c.qualification||"unclassified");
  for(const v of r.values||[])add("financial-value",[v.label],v,refs([v.source]),"recorded-value");
  for(const a of r.advisers||[])add("legal-adviser",[a.firm,a.client,a.scope],a,refs([a.source]),"recorded-attribution");
  for(const e of r.timeline||[])add("chronology",[e.date,e.event],e,refs([e.source]),"recorded-event");
  if(r.deadline)add("deadline",["current"],r.deadline,refs([r.deadline.source]),"recorded-deadline");
  for(const [kind,statement] of [["summary",r.fact],["status",{status:r.status,eventDate:r.eventDate}],["financing",r.financing],["regulatory",r.regulatory],["structure",r.structure],["announcement",r.announcedOn],["parties",r.parties],["analysis",r.analysis],["financial-adviser",r.financialAdvisers]])if(statement)add(kind,["current"],statement,["summary","status"].includes(kind)?refs(r.factSources):[],"unclassified");
 }
 rows.sort((a,b)=>a.priority.localeCompare(b.priority)||a.id.localeCompare(b.id));
 const counts={};for(const r of rows)counts[r.kind]=(counts[r.kind]||0)+1;
 return {scope:"Review inventory, not an atomic claim ledger or factual certification. Source document identity is not independent origin. Missing locators require editorial mapping.",counts,total:rows.length,pending:rows.length,locatorRecorded:rows.filter(r=>r.evidenceState==="locator-recorded").length,documentOnly:rows.filter(r=>r.evidenceState==="document-only").length,missingEvidence:rows.filter(r=>r.evidenceState==="missing").length,errors,documents:[...documents.values()].sort((a,b)=>a.url.localeCompare(b.url)),rows};
}
export const buildInventory=data=>inventory(data,s=>createHash("sha256").update(s).digest("hex"));
if(process.argv[1]===fileURLToPath(import.meta.url)){const report=buildInventory(JSON.parse(fs.readFileSync(new URL("../../../uk/data.json",import.meta.url),"utf8")));console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;}
