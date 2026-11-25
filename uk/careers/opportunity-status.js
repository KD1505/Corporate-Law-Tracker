"use strict";
(()=>{
function classify(o,day){
 const valid=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)===x;
 if(!valid(day))throw Error("Invalid assessment date");
 if(o.deadline&&!valid(o.deadline)||o.opensOn&&!valid(o.opensOn))return {bucket:"recheck",label:"Check inconsistent date information"};
 if(valid(o.deadline)&&o.deadline<day)return {bucket:"elapsed",label:"Published deadline passed"};
 if(valid(o.opensOn)&&o.opensOn>day)return {bucket:"future",label:"Future published opening — confirm timing"};
 const age=valid(o.verifiedOn)?(Date.parse(day)-Date.parse(o.verifiedOn))/864e5:Infinity;
 if(age<0||age>14)return {bucket:"recheck",label:"Source review date needs reconfirmation"};
 if(valid(o.deadline)){const days=(Date.parse(o.deadline)-Date.parse(day))/864e5;if(days<=7)return {bucket:"soon",label:days===0?"Deadline today — confirm time and availability":"Published deadline within 7 days — confirm availability"};return {bucket:"later",label:"Published deadline upcoming — verify availability"};}
 return {bucket:"undated",label:"No recorded deadline — check official application instructions"};
}
const api=Object.freeze({classify});
if(typeof module==="object"&&module.exports)module.exports=api;else globalThis.CLTOpportunityStatus=api;
})();
