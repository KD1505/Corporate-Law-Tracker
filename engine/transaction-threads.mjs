// Conservative, reversible grouping of exchange disclosures that could concern
// one transaction. Grouping is a RESEARCH HINT, not a conclusion of legal identity.
const CATEGORY = /^(.*?)\s*:\s*(Open Offer|Qualified Institutional Placement|Scheme of Arrangement|Rights Issue)$/i;
function companyKey(s){return String(s||"").normalize("NFKC").toLowerCase().replace(/\b(?:limited|ltd|private|pvt)\b\.?/g,"").replace(/[^a-z0-9]+/g," ").trim();}
function stamp(s){const t=Date.parse(s||"");return Number.isFinite(t)?t:0;}
function keyOf(d){
 const m=String(d?.headline||"").match(CATEGORY);
 if(!m)return null;
 const c=companyKey(m[1]);if(c.length<5)return null;
 return {key:c+"|"+m[2].toLowerCase(),company:m[1].trim(),category:m[2]};
}
export function groupPossibleRelatedFilings(deals, maxDayGap=45){
 const bins=new Map();
 for(const d of deals){
  const k=keyOf(d);if(!k||!stamp(d.time))continue;
  if(!bins.has(k.key))bins.set(k.key,{company:k.company,category:k.category,records:[]});
  bins.get(k.key).records.push(d);
 }
 const groups=[];
 for(const b of bins.values()){
  const sorted=b.records.sort((a,z)=>stamp(a.time)-stamp(z.time));
  let part=[];
  const flush=()=>{
   if(part.length<2)return;
   const ids=[...new Set(part.map(d=>d.id))];
   if(ids.length<2)return;
   const group={company:b.company,category:b.category,
    windowStart:part[0].time,windowEnd:part[part.length-1].time,ids,
    note:"Potentially related public announcements. Grouped by company, disclosure label and date proximity only; may represent distinct transactions or obligations."};
   groups.push(group);
   for(const d of part){
     d.possibleRelatedFilings=part.filter(x=>x.id!==d.id).slice(0,16).map(x=>({
       id:x.id,headline:x.headline,time:x.time,sourceUrl:(x.sources||[])[0]?.url||null}));
     d.relatedDisclosureCaution=group.note;
   }
  };
  for(const d of sorted){
   if(part.length && stamp(d.time)-stamp(part[part.length-1].time)>maxDayGap*864e5){flush();part=[];}
   part.push(d);
  }
  flush();
 }
 return groups;
}
