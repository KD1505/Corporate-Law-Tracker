import test from "node:test";
import assert from "node:assert/strict";
import { groupPossibleRelatedFilings } from "../transaction-threads.mjs";

test("close same-company, same-type filings link for research without destructive merging",()=>{
 const d=[
  {id:"one",headline:"IIFL Capital Services Limited: Open Offer",time:"11 Nov 2026",sources:[]},
  {id:"two",headline:"IIFL Capital Services Limited: Open Offer",time:"12 Nov 2026",sources:[]},
  {id:"other",headline:"IIFL Capital Services Limited: Scheme of Arrangement",time:"12 Nov 2026",sources:[]},
  {id:"unrelated",headline:"Acme Limited: Open Offer",time:"12 Nov 2026",sources:[]}];
 const groups=groupPossibleRelatedFilings(d);
 assert.equal(groups.length,1);
 assert.deepEqual(groups[0].ids,["one","two"]);
 assert.equal(d[0].possibleRelatedFilings[0].id,"two");
 assert.match(d[0].relatedDisclosureCaution,/distinct transactions/);
 assert.equal(d[2].possibleRelatedFilings,undefined);
});
test("different transactions months apart are not linked",()=>{
 const d=[
  {id:"x",headline:"Example Limited: Open Offer",time:"1 Jan 2025"},
  {id:"y",headline:"Example Limited: Open Offer",time:"1 Jul 2026"}];
 assert.equal(groupPossibleRelatedFilings(d).length,0);
});
test("routine filing names are never automatically combined into confirmed transactions",()=>{
 const d=[{id:"one",headline:"Nimbus Projects Limited: Disclosure under SEBI Takeover Regulations",time:"11 Nov 2026"},
 {id:"two",headline:"Nimbus Projects Limited: Disclosure under SEBI Takeover Regulations",time:"12 Nov 2026"}];
 assert.equal(groupPossibleRelatedFilings(d).length,0);
});