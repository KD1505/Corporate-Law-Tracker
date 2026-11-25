import fs from "node:fs";
import {fileURLToPath} from "node:url";
function parseSource(value){const u=new URL(value);if(u.protocol!=="https:"||u.username||u.password)throw Error("Unsafe source");u.hash="";return {url:u.href,host:u.hostname};}
function buildSourceRights(uk,careers,learning,parse=parseSource){
 const docs=new Map(),errors=[];
 function add(value,context){if(!value)return;let u;try{u=parse(value);}catch{errors.push("Invalid source "+context);return;}if(!docs.has(u.url))docs.set(u.url,{url:u.url,host:u.host,uses:new Set(),licence:null,commercialReuse:"unassessed",sourceOrigin:"unassessed"});docs.get(u.url).uses.add(context);}
 for(const r of uk.records){for(const s of r.sources||[])add(s.url,"record:"+r.id);for(const s of r.factSources||[])add(s,"fact:"+r.id);for(const x of r.research?.claims||[])for(const e of x.evidence||[])add(e.url,"finding:"+r.id);}
 for(const o of careers.opportunities){add(o.url,"opportunity:"+o.id);add(o.sponsorshipSource,"sponsorship:"+o.id);}
 for(const e of careers.employers){add(e.url,"employer:"+e.id);for(const x of e.researchFacts||[])add(x.url,"employer-fact:"+e.id);}
 for(const r of careers.resources)add(r.url,"resource:"+r.id);
 for(const l of [...(uk.lessons||[]),...(careers.lessons||[]),...(learning.modules||[])])add(l.source?.url,"lesson:"+l.id);
 const sources=[...docs.values()].map(x=>({...x,uses:[...x.uses].sort()})).sort((a,b)=>a.url.localeCompare(b.url));const hosts=new Map();
 for(const d of sources){const x=hosts.get(d.host)||{host:d.host,documentCount:0,uses:0,reviewState:"pending",licence:null};x.documentCount++;x.uses+=d.uses.length;hosts.set(d.host,x);}
 return {scope:"Rights and lineage inventory; not licensing decisions or permission to scrape/reproduce.",documents:sources.length,hosts:hosts.size,commercialReuseApproved:0,errors,reviewQueue:[...hosts.values()].sort((a,b)=>b.uses-a.uses||a.host.localeCompare(b.host)),sources};
}
export {buildSourceRights};
if(process.argv[1]===fileURLToPath(import.meta.url)){const read=p=>JSON.parse(fs.readFileSync(new URL("../../../"+p,import.meta.url),"utf8"));const report=buildSourceRights(read("uk/data.json"),read("uk/careers/data.json"),read("uk/careers/learning.json"));console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;}
