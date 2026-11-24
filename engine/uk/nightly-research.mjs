import fs from "node:fs/promises";
import {validateQuality,buildState} from "./nightly-research-core.mjs";
import {audit} from "./research-audit.mjs";
const root=new URL("../../uk/",import.meta.url),read=async name=>JSON.parse(await fs.readFile(new URL(name,root),"utf8"));
const data=await read("data.json"),floor=JSON.parse(await fs.readFile(new URL("research-quality-floor.json",import.meta.url),"utf8")),errors=validateQuality(data,floor);
if(errors.length)throw Error("Research quality gate:\n"+errors.join("\n"));
if(process.argv.includes("--check")){console.log("Curated structural quality gate passed; independent verification not implied.");process.exit(0)}
const [discovery,documents,feeds,policy,archive]=await Promise.all(["discovery.json","source-dossiers.json","research-queue.json","policy-feed.json","case-archive.json"].map(read));
let previous={};try{previous=await read("research-quality.json")}catch(e){if(e.code!=="ENOENT")throw e}
const today=new Date().toISOString().slice(0,10),state=buildState({data,discovery,documents,feeds,policy,archive,previous,today});
state.audit=audit(data).metrics;
if(state.audit.structuralErrors)throw Error("Internal source mapping regression");
const dest=new URL("research-quality.json",root),tmp=new URL("research-quality.json.tmp",root);
await fs.writeFile(tmp,JSON.stringify(state,null,2)+"\n");await fs.rename(tmp,dest);
console.log("Nightly review queue",JSON.stringify(state.summary),JSON.stringify(state.audit));
