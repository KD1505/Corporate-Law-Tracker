import {test} from "node:test";
import assert from "node:assert/strict";
import {triage} from "./editorial-triage.mjs";
const day="2026-11-25",r={id:"a",category:"Transactions",title:"Fictional",status:"Phase 1",verifiedOn:"2026-11-24",values:[{}],advisers:[{}],research:{claims:[{}]}};const run=x=>triage({records:[{...r,...x}]},day).rows[0];
test("near and elapsed deadlines require urgent source checks, not inferred clearance",()=>{for(const date of ["2026-11-24","2026-11-25","2026-12-02"]){const a=run({deadline:{date}});assert.equal(a.priority,"P0");assert.equal(a.recordedStatus,"Phase 1");}assert.equal(run({deadline:{date:"2026-12-03"}}).priority,"routine");});
test("cadence and absent disclosures remain distinct",()=>{assert.equal(run({verifiedOn:"2026-11-18"}).priority,"P1");assert.equal(run({status:"Completed",verifiedOn:"2026-11-18"}).priority,"routine");assert.equal(run({values:[]}).priority,"P2");});
test("malformed and future dates fail conservatively",()=>{assert.equal(run({deadline:{date:"2026-02-30"}}).priority,"P0");assert.equal(run({verifiedOn:"2026-11-26"}).priority,"P0");assert.throws(()=>triage({records:[]},"invalid"));});
