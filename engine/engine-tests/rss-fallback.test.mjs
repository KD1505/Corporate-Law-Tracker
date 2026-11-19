import test from "node:test";
import assert from "node:assert/strict";
import {parseRss} from "../rss-fallback.mjs";
const sample='<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>'
 +'<title>NSE Announcements</title><item><title><![CDATA[Example Ltd - Acquisition of shares]]></title>'
 +'<link>https://nsearchives.nseindia.com/corporate/example_2026.pdf</link>'
 +'<description><![CDATA[The company acquired a 51% stake in Test Company.]]></description>'
 +'<pubDate>Thu, 19 Nov 2026 10:35:00 GMT</pubDate></item></channel></rss>';
test("NSE RSS primary document references parsed with stable identity",()=>{
 const [item]=parseRss(sample,"NSE");assert.ok(item);
 assert.match(item.id,/^NSE-rss-[a-f0-9]{22}$/);
 assert.equal(item.title,"Example Ltd - Acquisition of shares");
 assert.equal(item.link,"https://nsearchives.nseindia.com/corporate/example_2026.pdf");
 assert.equal(item.description,"The company acquired a 51% stake in Test Company.");
 assert.equal(parseRss(sample,"NSE")[0].id,item.id);
});
test("RSS ignores javascript URLs and malformed responses",()=>{
 const unsafe=sample.replace("https://nsearchives.nseindia.com/corporate/example_2026.pdf","javascript:alert(1)");
 assert.equal(parseRss(unsafe,"NSE").length,0);
 assert.equal(parseRss("<html>captcha</html>","NSE").length,0);
 assert.equal(parseRss(sample,"NSE",0).length,0);
});
