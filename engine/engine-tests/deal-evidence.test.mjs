import test from "node:test";
import assert from "node:assert/strict";
import { attachEvidenceDossier, dossierForDeal } from "../deal-evidence.mjs";
test("a specific exchange filing is distinguished from generic portals",()=>{
 const d={id:"x",type:"ma",sources:[
  {name:"BSE filing",url:"https://www.bseindia.com/xml-data/corpfiling/AttachLive/example.pdf",official:true},
  {name:"BSE generic search",url:"https://www.bseindia.com/corporates/ann.html",official:true}
 ],docs:[],firms:[],timeline:[],value:"—"};
 const r=dossierForDeal(d);
 assert.equal(r.specificOfficialDocuments,1);
 assert.equal(r.depth,"Primary-filing linked record");
 assert.ok(r.gaps.some(s=>s.includes("consideration")));
});
test("a press-only entry gets no fictitious approval, price or closing",()=>{
 const r=attachEvidenceDossier({id:"x",type:"pe",headline:"Buyer acquires target",sources:[
  {name:"Media",url:"https://www.example.com/business/deal"}],docs:[],value:"—",
  firms:[],timeline:[]}).evidenceDossier;
 assert.equal(r.specificOfficialDocuments,0);
 assert.equal(r.facts.length,0);
 assert.match(r.coverageStatement,/not been matched/);
 assert.ok(r.gaps.some(s=>s.includes("legal advisers")));
});
test("case-study status remains documentary, never inferred from a headline",()=>{
 const d={id:"case",type:"ma",transaction:{spaShares:10},openOffer:{acceptedSharesActual:2},
  sources:[{name:"SEBI LOF",url:"https://www.sebi.gov.in/sebi_data/commondocs/oct-2025/test.pdf"}],
  editorialCautions:["An offer ceiling is not acceptance."]};
 const r=dossierForDeal(d);
 assert.equal(r.depth,"Document-intensive case study");
 assert.deepEqual(r.gaps,d.editorialCautions);
});
