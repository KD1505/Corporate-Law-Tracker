import test from "node:test";
import assert from "node:assert/strict";
import { canonicalFirm,cleanCounsel,classifySource,recordQuality,sanitiseDeal } from "../quality.mjs";
import { scoreDeal } from "../score.mjs";

test("remove placeholder and non-law-firm entities from firm rankings",()=>{
 const a=cleanCounsel([{name:"—"},{name:"Unknown"},{name:"NSE (National Stock Exchange of India Ltd.)"},
  {name:"SBI Capital Markets Limited"},{name:"Khaitan & Co"},{name:"Khaitan & Co."},
  {name:"JSA Advocates & Solicitors"},{name:"JSA"},{name:"IndusLaw"}]);
 const names=a.accepted.map(x=>x.name);
 assert.deepEqual([...new Set(names)],["Khaitan & Co","JSA","CMS INDUSLAW"]);
 assert.equal(a.quarantined.length,4);
 assert.equal(canonicalFirm("Not disclosed in primary source"),null);
});
test("direct filing and generic regulator lookup are distinct",()=>{
 assert.equal(classifySource("https://nsearchives.nseindia.com/corporate/actual.pdf"),"official-filing-link");
 assert.equal(classifySource("https://www.sebi.gov.in/sebi_data/commondocs/oct-2025/offer.pdf"),"official-filing-link");
 assert.equal(classifySource("https://www.bseindia.com/corporates/ann.html"),"portal");
 assert.equal(classifySource("https://www.bseindia.com/stock-share-price/example/abc/500001/"),"portal");
 assert.equal(classifySource("https://www.nseindia.com/get-quotes/equity?symbol=ABC"),"portal");
 assert.equal(classifySource("https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml"),"portal");
 assert.equal(classifySource("https://www.cci.gov.in/combination/orders"),"portal");
 assert.equal(classifySource("javascript:alert(1)"),"invalid");
 assert.equal(classifySource("https://example.com/article"),"secondary");
});
test("SAST Regulation 31(4) disclosure is not a completed M&A deal",()=>{
 const d={id:"x",headline:"Nimbus Projects Limited: Disclosure under SEBI Takeover Regulations",
  sum:"Promoter has submitted disclosure under Regulation 31(4) of SEBI SAST Regulations.",
  stage:"completed",type:"ma",firms:[],sources:[{url:"https://nsearchives.nseindia.com/corporate/x.pdf",official:true}]};
 const q=sanitiseDeal(d);
 assert.equal(recordQuality(d).kind,"disclosure");
 assert.equal(q.stage,"filed");
 assert.equal(q.verified,true);
});
test("generic acquisition filing without content goes to research queue",()=>{
 const d={headline:"Example Limited: Acquisition",
  sum:"Acquisition - Example Limited has informed the Exchange about Acquisition",
  stage:"completed",type:"ma",sources:[],firms:[]};
 assert.equal(sanitiseDeal(d).quality.kind,"needs-research");
});
test("true economic deal stays in the transaction feed",()=>{
 const d={headline:"Buyer acquires 54% of Target Ltd",type:"ma",
   detail:"Under a share purchase agreement, Buyer acquired a 54% stake in Target Limited and the acquisition has closed.",
   stage:"completed",firms:[{name:"Trilegal"}],sources:[{url:"https://www.sebi.gov.in/sebi_data/commondocs/oct-2025/a.pdf"}]};
 const x=sanitiseDeal(d);
 assert.equal(x.quality.kind,"deal");
 assert.equal(x.firms.length,1);
 assert.equal(x.stage,"completed");
});
test("rupee billion conversion cannot inflate importance by 1,000x",()=>{
 const a=scoreDeal({value:"₹1 billion",sources:[],docs:[],firms:[],geo:"other",type:"ma"});
 const b=scoreDeal({value:"₹100 crore",sources:[],docs:[],firms:[],geo:"other",type:"ma"});
 assert.equal(a.score,b.score);
});
