import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {buildInventory} from "./evidence-inventory.mjs";
function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==="object")return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));return v;}
export function evaluate(inventory,register){
 const errors=[], current=new Map(inventory.rows.map(r=>[r.id,r])),seen=new Set(),results=[];
 const nonempty=x=>typeof x==="string"&&x.trim().length>0;
 for(const entry of register.entries){
  const attempt=entry.attempt??1;const k=entry.id+"|"+entry.checkedOn+"|"+attempt;if(seen.has(k))errors.push("Duplicate check: "+k);seen.add(k);
  const date=entry.checkedOn;const validDate=typeof date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date))&&new Date(date+"T00:00:00Z").toISOString().slice(0,10)===date;
  if(!Number.isSafeInteger(attempt)||attempt<1||!nonempty(entry.id)||!validDate||entry.independentReview!==false||entry.method!=="AI-assisted public-source editorial check"||!["source-extract-support","retrieval-blocked","conflict"].includes(entry.outcome)||!nonempty(entry.note)||!entry.snapshot||!Array.isArray(entry.snapshot?.evidence)||!entry.snapshot.evidence.some(e=>e.url===entry.source)|| (entry.outcome!=="retrieval-blocked"&&!nonempty(entry.locator))){errors.push("Invalid check: "+k);continue;}
  const r=current.get(entry.id);const same=r&&JSON.stringify(stable(entry.snapshot))===JSON.stringify(stable({statement:r.statement,evidence:r.evidence,qualification:r.qualification}));
  results.push({id:entry.id,checkedOn:entry.checkedOn,attempt,outcome:entry.outcome,state:same?"current-revision":r?"stale-revision":"retired-item",revision:same?r.revision:null,independentReview:false});
 }
 const latest=new Map();for(const r of results.filter(r=>r.state==="current-revision").sort((a,b)=>a.checkedOn.localeCompare(b.checkedOn)||a.attempt-b.attempt))latest.set(r.id,r);
 const active=[...latest.values()];
 return {scope:"Source extract checks only; not independent verification or a freshness guarantee. No review authorises premium release.",errors,attempts:results.length,currentRevisionChecks:active.length,supported:active.filter(r=>r.outcome==="source-extract-support").length,blocked:active.filter(r=>r.outcome==="retrieval-blocked").length,conflicts:active.filter(r=>r.outcome==="conflict").length,stale:results.filter(r=>r.state!=="current-revision").length,independentReviews:0,results};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const data=JSON.parse(fs.readFileSync(new URL("../../../uk/data.json",import.meta.url),"utf8"));const register=JSON.parse(fs.readFileSync(new URL("./source-checks.json",import.meta.url),"utf8"));const report=evaluate(buildInventory(data),register);console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;}
