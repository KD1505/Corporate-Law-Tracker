import fs from "node:fs/promises";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
const endpoint="https://www.corplawtracker.com/uk/data.json",target=new URL("../../../uk/publication-observations.json",import.meta.url);
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const digest=v=>createHash("sha256").update(JSON.stringify(canonical(v))).digest("hex");
const date=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
export function indexTransactions(data){
 if(!Array.isArray(data?.records))throw Error("Invalid transaction dataset");
 const rows=data.records.filter(r=>r.category==="Transactions"),out={};if(!rows.length)throw Error("Empty transaction dataset");
 for(const r of rows){if(typeof r.id!=="string"||!/^[a-z0-9][a-z0-9-]{0,100}$/.test(r.id)||Object.hasOwn(out,r.id)||!date(r.eventDate)||typeof r.title!=="string"||!r.title.trim())throw Error("Invalid or duplicate transaction");const {verifiedOn,research,...rest}=r;const {reviewedOn,...findings}=research||{};out[r.id]={revision:digest({...rest,research:research?findings:null}),eventDate:r.eventDate,announcedOn:date(r.announcedOn)?r.announcedOn:null};}
 return Object.fromEntries(Object.entries(out).sort(([a],[b])=>a.localeCompare(b)));
}
export function observe(previous,{at,publicData,repositoryData,error=null}){
 if(!Number.isFinite(Date.parse(at)))throw Error("Invalid observation time");
 const prior=previous?.lastSuccessful??null,history=Array.isArray(previous?.history)?previous.history:[];
 if(previous?.lastAttempt&&Date.parse(at)<=Date.parse(previous.lastAttempt.at))throw Error("Observation timestamps must increase");
 const baseline=prior===null;
 let entry,lastSuccessful=prior;
 try{if(error)throw Error("Public retrieval failed");const current=indexTransactions(publicData),expected=indexTransactions(repositoryData),before=prior?.transactions??{},ids=Object.keys(current),added=baseline?[]:ids.filter(id=>!Object.hasOwn(before,id)),changed=baseline?[]:ids.filter(id=>Object.hasOwn(before,id)&&before[id].revision!==current[id].revision),removed=baseline?[]:Object.keys(before).filter(id=>!Object.hasOwn(current,id)),parity=digest(current)===digest(expected),latestEvent=ids.map(id=>current[id].eventDate).sort().at(-1),previousSuccessfulAt=prior?.at??null;
 entry={at,outcome:"observed",baseline,count:ids.length,latestEvent,previousSuccessfulAt,repositoryParity:parity,added,changed,removed};
 lastSuccessful={at,transactions:current,count:ids.length,latestEvent,repositoryParity:parity};
 }catch{entry={at,outcome:"unavailable",reason:"Public or repository transaction snapshot could not be retrieved or validated"};}
 return {schemaVersion:1,notice:"Periodic public-domain observations, not exact publication times, uptime, or independent accuracy. Baseline is not historical publication. Added/changed IDs were observed between successful samples; review-only timestamps are excluded from fingerprints. History retains 90 attempts; repository git history preserves prior snapshots.",lastAttempt:entry,lastSuccessful,history:[...history,entry].slice(-90)};
}
async function run(){const previous=JSON.parse(await fs.readFile(target,"utf8")),repositoryData=JSON.parse(await fs.readFile(new URL("../../../uk/data.json",import.meta.url),"utf8"));let publicData,error=null;try{const response=await fetch(endpoint,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000),headers:{"Accept":"application/json","User-Agent":"CorpLawTracker health observer (corplawtracker.com/contact.html)"}});if(!response.ok)throw Error("HTTP "+response.status);const len=Number(response.headers.get("content-length"));if(len>8_000_000)throw Error("Snapshot too large");const reader=response.body.getReader(),parts=[];let total=0;try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>8_000_000)throw Error("Snapshot too large");parts.push(value);}}finally{await reader.cancel().catch(()=>{});}publicData=JSON.parse(Buffer.concat(parts).toString("utf8"));}catch{error=true;}const result=observe(previous,{at:new Date().toISOString(),publicData,repositoryData,error});const tmp=new URL(target.href+".tmp");await fs.writeFile(tmp,JSON.stringify(result,null,2)+"\n");await fs.rename(tmp,target);console.log("Public transaction observation:",JSON.stringify(result.lastAttempt));}
if(process.argv[1]===fileURLToPath(import.meta.url))await run();
