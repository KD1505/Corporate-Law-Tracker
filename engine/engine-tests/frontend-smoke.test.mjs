import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const ROOT=path.resolve("..");

test("the six concatenated client scripts remain syntactically executable",()=>{
 const src=[1,2,3,4,5,6].map(i=>fs.readFileSync(path.join(ROOT,"app"+i+".js"),"utf8")).join("\n");
 assert.doesNotThrow(()=>new Function(src)); // syntax check, no browser execution
});
test("main homepage bootloader is valid JavaScript",()=>{
 const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
 const pivot=html.lastIndexOf('var PARTS=["app1.js"');
 assert.ok(pivot>0,"bootloader exists");
 const start=html.lastIndexOf("(function(){",pivot);
 const stop=html.indexOf("</script>",pivot);
 assert.ok(start>=0&&stop>pivot);
 assert.doesNotThrow(()=>new Function(html.slice(start,stop)));
});
test("unconfigured email subscription must not claim success",()=>{
 const js=fs.readFileSync(path.join(ROOT,"app4.js"),"utf8");
 assert.match(js,/const SUBSCRIBE_ENDPOINT = "";/);
 assert.match(js,/if\(!SUBSCRIBE_ENDPOINT\).*RSS/);
 assert.match(js,/Subscription failed/);
});
test("frontend must escape source-provided text and validate URLs",()=>{
 const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
 assert.match(html,/function cltEscape/);
 assert.match(html,/function cltSafeDeal/);
 assert.match(html,/function cltSafeUrl/);
});
test("export includes formula protection against spreadsheet injection",()=>{
 const js=fs.readFileSync(path.join(ROOT,"app4.js"),"utf8");
 assert.match(js,/tbCSV/);
 assert.match(js,/Apostrophe-prefix formula-like values/);
 assert.match(js,/application\/json/);
});
