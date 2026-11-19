// Primary-evidence deep backfill for existing and future deals.
// New claims are admitted only when the source URL was fetched and a verbatim
// supporting passage can be matched; unavailable material is never invented.
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const DATA=path.join(ROOT,"data.js");
const MODEL=process.env.CLT_DEEP_MODEL||"claude-haiku-4-5-20251001";
const BATCH=Math.max(0,Math.min(120,Number(process.env.CLT_DEEP_BATCH||25)));
const CREDIT=/credit balance is too low|insufficient.*credit|billing|purchase credits/i;
function norm(s){return String(s||"").toLowerCase().replace(/&nbsp;|&#160;/gi," ")
 .replace(/[\u200b\u00ad]/g,"").replace(/[\s\u00a0]+/g," ").replace(/[‘’]/g,"'")
 .replace(/[“”]/g,'"').trim();}
function nums(s){return (String(s||"").match(/\d[\d,]*(?:\.\d+)?%?/g)||[])
 .map(x=>x.replace(/,/g,"")).filter(x=>x.length>1);}
function safeUrl(u){try{const p=new URL(u);if(p.protocol!=="https:"&&p.protocol!=="http:")return false;
  if(/^(localhost|.*\.local|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/i.test(p.hostname))return false;
  return true;}catch{return false;}}
function fromHtml(s){
 s=s.replace(/<(script|style|svg|nav|footer|header|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi," ");
 const article=s.match(/<(article|main)\b[^>]*>([\s\S]*?)<\/\1>/i);
 if(article&&article[2].length>800)s=article[2];
 return s.replace(/<\/(?:p|div|section|h[1-6]|li|tr|br)>/gi,"\n").replace(/<[^>]+>/g," ")
  .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
  .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ")
  .replace(/[\t ]+/g," ").replace(/\n{3,}/g,"\n\n").trim().slice(0,26000);
}
async function fetchText(url){
 if(!safeUrl(url))return null;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try {
   const r=await fetch(url,{signal:controller.signal,headers:{"User-Agent":"CorpLawTracker/1.0 (evidence research)","Accept":"text/html,application/pdf;q=0.9,*/*;q=0.5"}});
   if(!r.ok||Number(r.headers.get("content-length")||0)>6000000)return null;
   let chunks=[],size=0;for await(const p of r.body){size+=p.length;if(size>6000000)return null;chunks.push(p);}
   const buf=Buffer.concat(chunks);
   const pdf=/pdf/i.test(r.headers.get("content-type")||"")||/\.pdf(?:[?#]|$)/i.test(url);
   let result="";
   if(pdf){try{const m=await import("pdf-parse/lib/pdf-parse.js");const parse=m.default||m;
     result=String((await parse(buf,{max:14})).text||"").slice(0,26000);}
     catch(e){console.warn("PDF extraction skipped: "+e.message);return null;}}
   else result=fromHtml(buf.toString("utf8"));
   return result.length>=350?{url,text:result}:null;
 }catch{return null;}finally{clearTimeout(timer);}
}
function sourceUrls(d){
 const urls=[...(d.sources||[]).map(s=>s.url),...(d.docs||[]).map(s=>s.url)].filter(safeUrl);
 const score=u=> (/sebi\.gov\.in|bseindia\.com|nseindia\.com|cci\.gov\.in|rbi\.org\.in|nclt\.gov\.in/i.test(u)?4:0)
 +(/\.pdf(?:[?#]|$)/i.test(u)?2:0);
 return [...new Set(urls.map(x=>x.split("#")[0]))].sort((a,b)=>score(b)-score(a)).slice(0,3);
}
function validFact(f,docs){
 if(!f||typeof f.fact!=="string"||f.fact.length<25||f.fact.length>450)return null;
 const doc=docs.find(d=>d.url===f.sourceUrl);if(!doc)return null;
 const quote=String(f.supportingText||"").trim();
 if(quote.length<24||quote.length>450||!norm(doc.text).includes(norm(quote)))return null;
 const supported=new Set(nums(quote));
 if(nums(f.fact).some(x=>!supported.has(x)))return null;
 const status=/^(completed|proposed|announced|filed|conditional|reported|unknown)$/i.test(f.status||"")?f.status.toLowerCase():"reported";
 return {label:String(f.label||"Documented fact").slice(0,72),fact:f.fact.trim(),
   sourceUrl:doc.url,evidenceSha256:createHash("sha256").update(norm(quote)).digest("hex"),status};
}
function jsonResult(s){
 const a=s.indexOf("{"),b=s.lastIndexOf("}");if(a<0||b<=a)throw Error("Model did not return complete JSON");
 return JSON.parse(s.slice(a,b+1));
}
async function researchOne(client,d,docs){
 const system=[
  "You research Indian corporate deals for transaction lawyers. Answer ONLY JSON.",
  "Use EXCLUSIVELY the supplied fetched SOURCE EXTRACTS. Never use memory to complete missing information.",
  "Return up to 16 legally material, non-duplicative facts: exact parties; price, amount and shares;",
  "shareholding and conditional versus actual results; SPA and closing dates; executed contracts and conditions;",
  "specific regulatory approval status; legal advisers only where expressly named with sides;",
  "escrow, issue or offer result; genuinely documented subsequent dated events.",
  "Every fact MUST have sourceUrl equal to a supplied URL AND a supportingText copied verbatim as one",
  "continuous 24-450 character passage from that very source. Copy all figures in the passage exactly.",
  "No derived percentages or numbers. Never convert an offered maximum to actual shares acquired.",
  "Statuses must distinguish proposed, filed, announced and completed. Skip unsupported facts.",
  "Shape: {\"facts\":[{\"label\":\"...\",\"fact\":\"...\",\"sourceUrl\":\"...\",",
  "\"supportingText\":\"...\",\"status\":\"completed|proposed|announced|filed|conditional|reported|unknown\"}]}"
 ].join(" ");
 const input="Transaction: "+String(d.headline||d.id)+"\n"+docs.map(x=>
   "SOURCE URL: "+x.url+"\n<EXTRACT>\n"+x.text+"\n</EXTRACT>").join("\n");
 const response=await client.messages.create({model:MODEL,max_tokens:4800,system,messages:[{role:"user",content:input}]});
 const obj=jsonResult(response.content.filter(x=>x.type==="text").map(x=>x.text).join("\n"));
 if(!Array.isArray(obj.facts))throw Error("No facts array");
 const verified=[...new Map(obj.facts.map(f=>validFact(f,docs)).filter(Boolean)
   .map(f=>[f.fact.toLowerCase(),f])).values()];
 const cap=new Map(),out=[];
 for(const f of verified){const n=cap.get(f.sourceUrl)||0;if(n>=4)continue;
   cap.set(f.sourceUrl,n+1);out.push(f);if(out.length>=16)break;}
 return out;
}
function parseData(s){const window={};new Function("window",s)(window);return window.CLT_DATA||{};}
function serialized(C){
 const names=["DEALS","MOVES","REGITEMS","COMMENTARY","TRENDS"];
 let s="/* CLT DATA: built by engine/build.mjs and source-backed research. */\nwindow.CLT_DATA = window.CLT_DATA || {};\n\n";
 for(const n of names)s+="/* "+n+"-START */\nwindow.CLT_DATA."+n+"=[\n"+(C[n]||[]).map(d=>" "+JSON.stringify(d)).join(",\n")+"\n];\n/* "+n+"-END */\n\n";
 if(C.LINKCHECK)s+="/* LINKCHECK-START */\nwindow.CLT_DATA.LINKCHECK="+JSON.stringify(C.LINKCHECK)+";\n/* LINKCHECK-END */\n\n";
 return s+"window.CLT_DATA.UPDATED="+JSON.stringify(C.UPDATED||"")+";\n";
}
function eligible(d){
 if(d.transaction&&d.openOffer)return false; // preserve fully curated cases
 if((d.research?.facts||[]).length>=12)return false;
 const last=Date.parse(d.research?.lastAttempt||"");
 if(Number.isFinite(last)&&Date.now()-last<30*864e5)return false;
 return sourceUrls(d).length>0;
}
async function main(){
 if(!process.env.ANTHROPIC_API_KEY){console.log("deep-research: no funded API key; deterministic dossiers still generated");return;}
 if(!BATCH){console.log("deep-research: disabled by batch=0");return;}
 const C=parseData(await fs.readFile(DATA,"utf8"));
 const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
 const deals=C.DEALS||[],queue=deals.filter(eligible);
 // New disclosures take priority, then high-impact primary-filed historical deals.
// Without this freshness boost, a 5,000+ record backlog can bury tomorrow's deals.
 const rank=d=>{
   const date=Date.parse(d.time||""),age=Number.isFinite(date)?(Date.now()-date)/864e5:99999;
   return (age>=0&&age<=10?1500:age>=0&&age<=35?600:0)
     +Number(!!d.verified)*130+(d.score||0)
     -Math.min(100,(d.research?.facts||[]).length*12);
 };
 queue.sort((a,b)=>rank(b)-rank(a));
 let upgraded=0,claims=0,unreadable=0,errors=0,paused=false;
 for(const d of queue.slice(0,BATCH)){
  const docs=[];
  for(const url of sourceUrls(d)){const x=await fetchText(url);if(x)docs.push(x);}
  d.research=d.research||{};d.research.lastAttempt=new Date().toISOString().slice(0,10);
  if(!docs.length){unreadable++;d.research.auditStatus="source-text-unavailable";continue;}
  try{
   const facts=await researchOne(client,d,docs);
   const old=Array.isArray(d.research.facts)?d.research.facts:[];
   d.research.facts=[...new Map([...facts,...old].filter(x=>x.fact)
     .map(x=>[x.fact.toLowerCase(),x])).values()].slice(0,24);
   d.research.evidenceVersion=1;d.research.reviewedOn=new Date().toISOString().slice(0,10);
   d.research.documentsRead=docs.map(x=>x.url);
   d.research.auditStatus=facts.length?"quote-matched-to-source":"no-new-validated-facts";
   upgraded++;claims+=facts.length;console.log("deep-research: "+d.id+": "+facts.length+" validated facts");
  }catch(e){
   errors++;console.warn("deep-research error: "+d.id+": "+String(e.message).slice(0,250));
   if(CREDIT.test(e.message)){paused=true;delete d.research.lastAttempt;console.warn("deep-research: AI credits exhausted; stopping calls");break;}
  }
 }
 if(upgraded||unreadable)await fs.writeFile(DATA,serialized(C),"utf8");
 console.log(JSON.stringify({job:"deep-research",due:queue.length,selected:Math.min(BATCH,queue.length),upgraded,claims,unreadable,errors,pausedForBilling:paused}));
}
main().catch(e=>{console.error(e);process.exit(1);});
