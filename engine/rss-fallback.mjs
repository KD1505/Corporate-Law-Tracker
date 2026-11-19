// Conservative RSS/XML fallback parser for official exchange announcement feeds.
// These are *feed announcements*, not independently verified company PDFs.
import {createHash} from "node:crypto";
function decode(s){
 return String(s||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi,"$1")
  .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
  .replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
  .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(0x10ffff,Number(n))))
  .replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
}
function field(item,name){
 const re=new RegExp("<(?:[\\w-]+:)?"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?"+name+">","i");
 return decode(item.match(re)?.[1]||"");
}
export function parseRss(xml,label,max=250){
 if(typeof xml!=="string"||xml.length>12_000_000||!/<rss\b|<rdf:RDF\b/i.test(xml))return [];
 const parts=xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi)||[];
 return parts.slice(0,max).map(node=>{
  const title=field(node,"title"),description=field(node,"description");
  const link=field(node,"link")||field(node,"guid");
  if(title.length<14||!/^https?:\/\//i.test(link))return null;
  const pubDate=field(node,"pubDate")||field(node,"date");
  const date=Date.parse(pubDate),published=Number.isFinite(date)?date:Date.now();
  const id=label+"-rss-"+createHash("sha256").update(title+"|"+link+"|"+String(pubDate)).digest("hex").slice(0,22);
  return {id,title,description:description.slice(0,900),link,published,
    source:label,feedKind:"official-exchange-rss-item"};
 }).filter(Boolean);
}
