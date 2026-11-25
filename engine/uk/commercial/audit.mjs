import fs from "node:fs";
import {fileURLToPath} from "node:url";
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
export function inspect({uk,careers,learning,discovery},asOf){
 const errors=[], validDay=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)===x;
 if(!validDay(asOf))throw Error("Invalid as-of date");
 function index(rows,label){const map=new Map();for(const row of rows){if(!row.id||map.has(row.id))errors.push(label+": duplicate or missing ID "+row.id);else map.set(row.id,row);}return map;}
 const a=index(uk.opportunities,"UK opportunities"),b=index(careers.opportunities,"Career opportunities");
 for(const [id,row] of a){if(!b.has(id)||JSON.stringify(canonical(row))!==JSON.stringify(canonical(b.get(id))))errors.push("Opportunity dataset divergence: "+id);}
 for(const id of b.keys())if(!a.has(id))errors.push("Opportunity missing in UK data: "+id);
 const jobs=careers.opportunities, deals=uk.records.filter(r=>r.category==="Transactions");index(deals,"Transactions");
 let findings=0,unanchored=0;
 for(const r of deals){const urls=new Set(r.sources.map(x=>x.url));for(const claim of r.research?.claims||[]){findings++;if(!claim.text||!Array.isArray(claim.evidence)||!claim.evidence.length||claim.evidence.some(e=>!urls.has(e.url)||!e.publisher||!e.locator)){unanchored++;errors.push("Unanchored structured finding: "+r.id);}}}
 for(const r of jobs){if(r.deadline&&!validDay(r.deadline))errors.push("Invalid deadline: "+r.id);if(!validDay(r.verifiedOn)||r.verifiedOn>asOf)errors.push("Invalid review date: "+r.id);if(!["unknown","confirmed","not-offered"].includes(r.sponsorshipState))errors.push("Invalid sponsorship classification: "+r.id);if(r.sponsorshipState!=="unknown"&&!/^https:\/\//.test(r.sponsorshipSource||""))errors.push("Unsubstantiated sponsorship: "+r.id);}
 const sources=discovery.sources||[],leads=discovery.leads||[];index(sources,"Discovery sources");
 return {asOf,scope:"Structural observations only; no independent review, vacancy availability or commercial certification inferred.",errors,transactions:{records:deals.length,structuredFindings:findings,unanchoredFindings:unanchored,withStructuredFindings:deals.filter(r=>r.research?.claims?.length).length,withoutRecordedAdviser:deals.filter(r=>!r.advisers?.length).length,withoutRecordedValue:deals.filter(r=>!r.values?.length).length},careers:{records:jobs.length,employment:jobs.filter(r=>r.kind==="Employment").length,programmes:jobs.filter(r=>r.kind==="Programme").length,elapsedDeadlines:jobs.filter(r=>r.deadline&&r.deadline<asOf).length,noRecordedDeadline:jobs.filter(r=>!r.deadline).length,sponsorshipUnknown:jobs.filter(r=>r.sponsorshipState==="unknown").length,employers:careers.employers.length,confirmedLiveVacancies:null},academy:{modules:careers.lessons.length+learning.modules.length,questions:learning.questions.length,simulations:learning.simulations.length},discovery:{attemptedAt:discovery.attemptedAt||null,configuredEntries:sources.length,httpSuccess:sources.filter(r=>r.status==="ok").length,httpFailure:sources.filter(r=>r.status==="failed").length,unreviewedLeads:leads.length},commercialLaunch:"BLOCKED — independent editorial, user, legal, security and paid-pilot evidence outstanding; structural checks cannot authorise launch"};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const read=p=>JSON.parse(fs.readFileSync(new URL("../../../"+p,import.meta.url),"utf8"));
 const report=inspect({uk:read("uk/data.json"),careers:read("uk/careers/data.json"),learning:read("uk/careers/learning.json"),discovery:read("uk/careers/discovery.json")},process.argv[2]||new Date().toISOString().slice(0,10));
 console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;
}
