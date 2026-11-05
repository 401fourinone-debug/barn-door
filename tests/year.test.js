import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createState,act,can,workflow,restoreState,VERSION} from '../dist/engine.js';
import {dateText,dateCode,weekdayText,seasonOf,isMonthEnd,monthDay,YEAR_DAYS} from '../dist/calendar.js';
import {exportSave,parseSave,importError} from '../dist/save-file.js';

function go(s,a,p){const r=act(s,a,p);assert.equal(r.error,null,`day${s.day} ${a}: ${r.error}`);return r.state;}
// 照 workflow 的提示自動玩完一天；待命事件一律選第一個選項。
const at=(s,loc)=>s.location===loc?s:go(s,'move',{location:loc});
// 第 1–3 天的固定劇本：選一條固定路線走完。
function scripted(s){
 if(s.role!=='gatekeeper')return roleTasksLeft(s)?s=>{const w=workflow(s);s=at(s,w.location);if(!can(s,'roleWait'))s=go(s,'roleWait');return go(s,'roleTask',{step:s.roleStep,choice:0});}:null;
 if(s.day===1&&!s.decision)return s=>{s=at(s,'gate');for(const a of ['inspectReader','arrivals','checkId','manifest','receiveStandard','closeOuter','hold','leaveHeld'])s=go(s,a);return s;};
 if(s.day===2)return s=>{s=at(s,'gate');if(!s.yesterdayChecked)s=go(s,'reviewYesterday');return go(s,'deferRepair');};
 if(s.day===3)return s=>{for(const [a,loc] of [['checkForecast','gate'],['callConvoy','gate'],['inspectDrain','engineering'],['postponeDelivery','gate']])if(!can(at(s,loc),a))s=go(at(s,loc),a);return s;};
 return null;
}
const roleTasksLeft=s=>workflow(s).panel==='roleWork';
function playDay(s){
 for(let guard=0;guard<3000&&!s.ended;guard++){
  if(s.signed)for(const j of s.inheritedJobs||[])if(j.status==='待安排')s=go(s,'assignInherited',{id:j.id,choice:0});
  if(s.activeIncident){s=go(s,'respondIncident',{choice:0});continue;}
  if(s.signed&&!s.dayDone&&scripted(s)){s=scripted(s)(s);continue;}
  if(s.signed&&!s.dayDone&&s.day>=4){const w=workflow(s);if(s.location!==w.location)s=go(s,'move',{location:w.location});s=go(s,'routineCheck');continue;}
  const w=workflow(s);
  if(!s.backlogReviewed&&!can(s,'readBacklog')&&w.panel==='briefing'){s=go(s,'readBacklog');continue;}
  if(w.location&&s.location!==w.location&&!can(s,'move',{location:w.location})){s=go(s,'move',{location:w.location});continue;}
  if(w.action&&!can(s,w.action)){s=go(s,w.action);continue;}
  if(!s.rosterRead&&!can(s,'readRoster')){s=go(s,'readRoster');continue;}
  if(!can(s,'tick')){s=go(s,'tick');continue;}
  if(!can(s,'reviewHandover')&&!s.handoverRead){s=go(s,'reviewHandover');continue;}
  if(!can(s,'handover')){s=go(s,'handover');continue;}
  assert.fail(`day${s.day} 卡住：${w.text}`);
 }
 assert.ok(s.ended,`day${s.day} 沒有交班`);return s;
}

test('日曆：第 1 天 2126-09-16，第 365 天 2127-09-15',()=>{
 assert.equal(dateText(1),'2126.09.16');assert.equal(dateCode(16),'21261001');assert.equal(dateText(YEAR_DAYS),'2127.09.15');
 assert.equal(weekdayText(1),'週一');assert.equal(seasonOf(1),'autumn');assert.equal(seasonOf(120),'winter');assert.equal(seasonOf(200),'spring');assert.equal(seasonOf(300),'summer');
 assert.equal(monthDay(0),'9/15');assert.equal(monthDay(16),'10/1');assert.equal(monthDay(YEAR_DAYS),'9/15');
 assert.ok(isMonthEnd(15));assert.ok(!isMonthEnd(14));
});

test('第 4 天起每天照例值勤，不會在第 3 天結束',()=>{
 let s=createState('normal',12345);s=playDay(s);
 for(let d=2;d<=6;d++){s=go(s,'nextDay');assert.equal(s.day,d);s=playDay(s);}
 assert.equal(s.history.length,5);assert.ok(s.events.some(e=>e.id==='EV-21260921-001'));
});

test('守門人連續玩 30 天：事件編號跟著日期走、舊紀錄歸檔、存檔夠小',()=>{
 let s=playDay(createState('normal',777));
 for(let d=2;d<=30;d++)s=playDay(go(s,'nextDay'));
 assert.equal(s.day,30);assert.equal(dateText(s.day),'2126.10.15');
 const ids=s.events.map(e=>e.id);assert.equal(new Set(ids).size,ids.length,'事件編號重複');
 assert.ok(ids.includes('EV-21260916-004'),'第一天的主要事件仍保留');assert.ok(!ids.includes('EV-21260916-WORLD'),'舊的各區流水帳已歸檔');
 assert.ok(s.health>=0&&s.health<=100&&s.trust>=0&&s.trust<=100);
 const size=JSON.stringify(s).length;assert.ok(size<400*1024,'存檔太大：'+size);
 assert.deepEqual(restoreState(JSON.stringify(s)),s);
});

test('工程、醫護、後勤也能玩過第 3 天，接著例行值勤',()=>{
 for(const role of ['engineer','medic','logistics']){
  let s=playDay(createState('normal',99,role));
  for(let d=2;d<=9;d++)s=playDay(go(s,'nextDay'));
  assert.equal(s.day,9);assert.equal(s.history.length,8);
  const ids=s.events.map(e=>e.id);assert.equal(new Set(ids).size,ids.length,role+' 事件編號重複');
 }
});

test('最後一天之後不能再跳日',()=>{
 const s={...createState(),day:YEAR_DAYS,ended:true};assert.ok(can(s,'nextDay'));assert.ok(can({...s,day:YEAR_DAYS-1},'nextDay')===null);
});

test('舊版 v0.9 存檔可以接續，並升級版本號',()=>{
 const old={...createState(),version:1,day:2};const s=restoreState(JSON.stringify(old));assert.ok(s);assert.equal(s.version,VERSION);assert.equal(s.day,2);
 assert.equal(restoreState(JSON.stringify({...old,version:99})),null);
});

test('備份可以匯出匯入，但不能用來回到過去',()=>{
 const later={...createState(),day:5,time:600},earlier={...createState(),day:3,time:900};
 const {state,error}=parseSave(exportSave(later));assert.equal(error,null);assert.equal(state.day,5);
 assert.equal(importError(earlier,state),null);assert.match(importError(later,parseSave(exportSave(earlier)).state),/不能用備份回到過去/);
 assert.equal(importError(null,state),null);
 const legacy=parseSave(JSON.stringify({prototype:'0.9',exportedAt:'2026-11-01',...createState(),version:1}));assert.equal(legacy.error,null);
 assert.ok(parseSave('not json').error);assert.ok(parseSave('{"format":"barn-door-save","state":{}}').error);
});
