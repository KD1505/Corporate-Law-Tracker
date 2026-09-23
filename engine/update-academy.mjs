import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUT = path.join(ROOT, "data", "academy-updates.json");
const MAX_PER_RUN = Number(process.env.CLT_ACADEMY_MAX || 3);
const KEEP = Number(process.env.CLT_ACADEMY_KEEP || 40);

const OFFICIAL = /(sebi\.gov\.in|rbi\.org\.in|cci\.gov\.in|mca\.gov\.in|ibbi\.gov\.in|dpiit\.gov\.in|meity\.gov\.in|egazette\.nic\.in|incometax\.gov\.in)/i;
const REGULATORY = /\b(amend|amendment|notification|circular|regulation|rules?|master direction|guidelines?|framework|threshold|exemption|approval|filing|disclosure|open offer|takeover|merger control|combination|foreign investment|fdi|fema|pricing|beneficial owner|insider trading|delisting|buyback|scheme|insolvency|ibc|data protection|dpdp)\b/i;
const MNA = /\b(m&a|merger|acquisition|takeover|share purchase|share sale|share subscription|private equity|pe\b|venture capital|vc\b|joint venture|open offer|control|scheme|demerger|amalgamation|preferential issue|rights issue|delisting|buyback|combination|competition|fdi|fema|cross-border|resolution plan)\b/i;
const STRUCTURAL = /\b(locked[- ]box|completion accounts|earn[- ]out|escrow|indemnity|warrant(y|ies)|condition precedent|change of control|drag|tag|rofr|rofo|liquidation preference|anti-dilution|share swap|minority investment|gun[- ]jump|standstill|deal value|dvt)\b/i;
const NOISE = /\b(appointment|joins? firm|partner move|office opening|award|webinar|conference|podcast|ranking)\b/i;

function textOf(x) {
  return [x.headline,x.title,x.sum,x.summary,x.implication,x.analysis,x.type,x.law,x.category,(x.tags||[]).join(" ")].filter(Boolean).join(" ");
}
function sourceOf(x) {
  const a = Array.isArray(x.sources) ? x.sources : [];
  return a.find(function(s){ return s && (s.official || OFFICIAL.test(s.url||"")); }) || a[0] || (x.url ? {url:x.url,name:x.sourceName||""} : null);
}
function categoryOf(t) {
  const s=t.toLowerCase();
  if(/competition|combination|cci|deal value|gun-jump|standstill/.test(s)) return "Competition / CCI";
  if(/fema|fdi|foreign investment|rbi|ndi|fc-gpr|fc-trs|land border/.test(s)) return "FEMA / FDI";
  if(/sast|takeover|open offer|sebi|lodr|insider|delisting|listed/.test(s)) return "Listed M&A / SEBI";
  if(/ibc|insolvency|resolution plan|29a|32a/.test(s)) return "IBC / Distressed M&A";
  if(/data protection|dpdp|privacy|meity/.test(s)) return "Data / Technology";
  if(/companies act|mca|private placement|preferential|beneficial owner|scheme|amalgamation|demerger/.test(s)) return "Companies Act";
  if(/tax|stamp|withholding/.test(s)) return "Tax / Stamp";
  return "Deal Structuring";
}
function promptFor(cat) {
  const m = {
    "Competition / CCI":"Explain the trigger, whether standstill applies, and how the point changes conditions precedent, long-stop date or remedies drafting.",
    "FEMA / FDI":"State the route/cap/pricing/reporting issue, then explain which approval, filing or SPA condition it changes.",
    "Listed M&A / SEBI":"Identify the SAST/LODR/PIT trigger, disclosure or open-offer consequence, and the timetable impact.",
    "IBC / Distressed M&A":"Explain what changes for bidder eligibility, process certainty, liabilities and implementation of the resolution plan.",
    "Data / Technology":"Translate the rule into diligence, data-room, consent/security or contractual risk in an acquisition.",
    "Companies Act":"Identify the corporate approval/capital step, the document or filing affected, and the consequence of getting it wrong.",
    "Tax / Stamp":"Spot the structuring consequence, say what specialist input is needed, and identify which deal document must allocate the risk.",
    "Deal Structuring":"Explain why the structure matters commercially, then identify the legal risk and the clause/approval that manages it."
  };
  return m[cat] || m["Deal Structuring"];
}
function clip(s,n) {
  s=String(s||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
  if(s.length<=n) return s;
  return s.slice(0,n-1).replace(/\s+\S*$/,"")+"…";
}
function score(x) {
  const t=textOf(x), src=sourceOf(x);
  if(!t || NOISE.test(t)) return {score:0, t:t, src:src};
  let s=0;
  const regulatory=REGULATORY.test(t), mna=MNA.test(t), structural=STRUCTURAL.test(t);
  if(regulatory) s+=4;
  if(mna) s+=3;
  if(structural) s+=2;
  if(src && (src.official || OFFICIAL.test(src.url||""))) s+=3;
  if(x.imp==="hi" || Number(x.score||0)>=70) s+=2;
  if(Number(x.score||0)>=85) s+=1;
  if(/\b(first|new regime|effective|comes into force|revised|clarif|landmark|material)\b/i.test(t)) s+=1;
  const worthy = s>=7 && (regulatory || structural || (mna && (x.imp==="hi" || Number(x.score||0)>=70)));
  return {score:s, worthy:worthy, t:t, src:src};
}
function parseAdded(diff) {
  const out=[];
  for(const line of diff.split("\n")) {
    if(!line.startsWith("+") || line.startsWith("+++")) continue;
    let raw=line.slice(1).trim();
    if(!raw.startsWith("{")) continue;
    if(raw.endsWith(",")) raw=raw.slice(0,-1);
    try {
      const x=JSON.parse(raw);
      if(x && (x.headline || x.title)) out.push(x);
    } catch {}
  }
  return out;
}
async function loadExisting() {
  try {
    const x=JSON.parse(await readFile(OUT,"utf8"));
    return x && Array.isArray(x.updates) ? x : {updates:[]};
  } catch { return {updates:[]}; }
}
function idOf(x) {
  return String(x.id || x.headline || x.title || "").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,140);
}

async function main() {
  let stdout="";
  try {
    const r=await exec("git",["diff","--unified=0","--","data.js"],{cwd:ROOT,maxBuffer:30*1024*1024});
    stdout=r.stdout||"";
  } catch(e) {
    console.warn("Academy update skipped: unable to inspect data.js diff:",e.message);
    return;
  }
  if(!stdout.trim()) {
    console.log("Academy: no newly-added tracker data; no update.");
    return;
  }
  const added=parseAdded(stdout);
  const ranked=added.map(function(x){ return {x:x, meta:score(x)}; })
    .filter(function(r){ return r.meta.worthy; })
    .sort(function(a,b){ return b.meta.score-a.meta.score; });

  const existing=await loadExisting();
  const have=new Set(existing.updates.map(function(x){ return x.sourceId || x.id; }));
  const today=new Date().toISOString().slice(0,10);
  const fresh=[];
  for(const r of ranked) {
    if(fresh.length>=MAX_PER_RUN) break;
    const x=r.x, sid=idOf(x);
    if(!sid || have.has(sid)) continue;
    const src=r.meta.src;
    const cat=categoryOf(r.meta.t);
    const why=clip(x.implication || x.sum || x.summary || ("This development changes or illustrates a transaction issue in "+cat+"."),260);
    fresh.push({
      id:"academy-"+today+"-"+fresh.length+"-"+sid.slice(0,48),
      sourceId:sid,
      date:String(x.time || x.date || today).replace(/^Updated\s+/i,""),
      category:cat,
      headline:clip(x.headline || x.title,180),
      why:why,
      interviewPrompt:promptFor(cat),
      source:src && src.url ? src.url : (x.url || ""),
      sourceName:src && src.name ? src.name : ""
    });
    have.add(sid);
  }
  if(!fresh.length) {
    console.log("Academy: new data reviewed, but nothing cleared the materiality gate.");
    return;
  }
  const next={generatedAt:new Date().toISOString(),algorithm:"material-change-only-v1",updates:fresh.concat(existing.updates).slice(0,KEEP)};
  await mkdir(path.dirname(OUT),{recursive:true});
  await writeFile(OUT,JSON.stringify(next,null,2)+"\n","utf8");
  console.log("Academy: published "+fresh.length+" material learning update(s).");
}
main().catch(function(e){ console.error(e); process.exit(1); });