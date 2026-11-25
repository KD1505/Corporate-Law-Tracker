import fs from "node:fs";
import {fileURLToPath} from "node:url";
export function triage(data,asOf){
 const day=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
 if(!day(asOf))throw Error("Invalid as-of date");
 const diff=(a,b)=>(Date.parse(a)-Date.parse(b))/86400000;
 const rows=[];
 for(const r of data.records.filter(r=>r.category==="Transactions")){
  const reasons=[],age=day(r.verifiedOn)?diff(asOf,r.verifiedOn):null,days=day(r.deadline?.date)?diff(r.deadline.date,asOf):null;
  // A textual terminal hint only controls queue cadence, not legal lifecycle or completed status.
  const terminal=/^(completed\b|abandoned\b|securitisation completed\b|notes issued\b)/i.test(r.status||"");
  const interval=terminal?90:7;
  if(age===null||age<0)reasons.push("review-date-invalid");
  else if(age>=interval)reasons.push("review-cadence-due");
  if(r.deadline&&days===null)reasons.push("deadline-date-invalid");
  else if(days!==null&&days<=7)reasons.push(days<0?"published-deadline-elapsed":days===0?"published-deadline-today":"published-deadline-within-seven-days");
  if(!r.advisers?.length)reasons.push("no-recorded-legal-adviser");
  if(!r.values?.length)reasons.push("no-recorded-value");
  if(!r.research?.claims?.length)reasons.push("no-structured-research-findings");
  const priority=reasons.some(x=>x.startsWith("published-deadline")||x==="deadline-date-invalid"||x==="review-date-invalid")?"P0":reasons.includes("review-cadence-due")?"P1":reasons.length?"P2":"routine";
  rows.push({id:r.id,title:r.title,recordedStatus:r.status,recordedReview:r.verifiedOn,daysSinceRecordedReview:age,reviewIntervalDays:interval,deadline:r.deadline??null,daysToPublishedDeadline:days,priority,reasons,nextAction:priority==="P0"?"Check original timetable and subsequent outcomes before relying on the recorded date":priority==="P1"?"Recheck relevant issuer, regulator and other original sources":priority==="P2"?"Assess whether missing disclosures exist; preserve unknowns if not established":"Continue scheduled monitoring"});
 }
 rows.sort((a,b)=>["P0","P1","P2","routine"].indexOf(a.priority)-["P0","P1","P2","routine"].indexOf(b.priority)||(a.daysToPublishedDeadline??Infinity)-(b.daysToPublishedDeadline??Infinity)||a.id.localeCompare(b.id));
 return {asOf,scope:"Editorial workload triage only; recorded review dates are not evidence of live freshness or verification. Cadence is a provisional operating target; missing disclosures may be legitimate.",counts:Object.fromEntries(["P0","P1","P2","routine"].map(k=>[k,rows.filter(r=>r.priority===k).length])),rows};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const data=JSON.parse(fs.readFileSync(new URL("../../../uk/data.json",import.meta.url),"utf8"));console.log(JSON.stringify(triage(data,process.argv[2]||new Date().toISOString().slice(0,10)),null,2));}
