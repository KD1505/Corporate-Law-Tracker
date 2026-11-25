import {test} from "node:test";
import assert from "node:assert/strict";
import {buildSourceRights} from "./source-rights.mjs";
const empty={opportunities:[],employers:[],resources:[]};
test("deduplicates fragments and retains use context without granting rights",()=>{const r=buildSourceRights({records:[{id:"a",sources:[{url:"https://example.com/a#p1"},{url:"https://example.com/a#p2"}]}]},{...empty,opportunities:[{id:"b",url:"https://example.com/a"}]},{});assert.equal(r.documents,1);assert.equal(r.sources[0].uses.length,2);assert.equal(r.commercialReuseApproved,0);assert.equal(r.sources[0].licence,null);});
test("rejects non-HTTPS and credential-bearing links",()=>{const r=buildSourceRights({records:[{id:"a",sources:[{url:"http://example.com/a"},{url:"https://user@example.com/a"}]}]},empty,{});assert.equal(r.errors.length,2);assert.equal(r.documents,0);});
