import {test} from "node:test";
import assert from "node:assert/strict";
import status from "../../../uk/careers/opportunity-status.js";
const today="2026-11-25",row={verifiedOn:"2026-11-24"};
test("deadline action separates dates without implying availability",()=>{for(const [deadline,bucket] of [["2026-11-24","elapsed"],["2026-11-25","soon"],["2026-12-02","soon"],["2026-12-03","later"],[null,"undated"]])assert.equal(status.classify({...row,deadline},today).bucket,bucket);});
test("future windows and stale reviews require distinct actions",()=>{assert.equal(status.classify({...row,opensOn:"2026-12-01"},today).bucket,"future");assert.equal(status.classify({verifiedOn:"2026-11-10",deadline:"2026-11-28"},today).bucket,"recheck");assert.equal(status.classify({verifiedOn:"2026-11-26"},today).bucket,"recheck");assert.equal(status.classify({verifiedOn:"2026-11-11"},today).bucket,"undated");});
test("malformed dates fail conservatively",()=>{assert.equal(status.classify({...row,deadline:"2026-02-30"},today).bucket,"recheck");assert.equal(status.classify({},today).bucket,"recheck");assert.throws(()=>status.classify(row,"bad"));});
