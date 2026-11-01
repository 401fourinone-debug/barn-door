import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createState,act,can,mainWorkDone,restoreState} from '../dist/engine.js';
import {ROLES,roleTasks,roleEventId} from '../dist/roles.js';
import {DUTY_EVENTS} from '../dist/duty-events.js';
import {EXTRA_EVENTS} from '../dist/extra-events.js';
import {monitorWall,cameraStatus} from '../dist/surveillance-ui.js';
import {DETAIL_AREAS} from '../dist/details-ui.js';
function step(s,action,payload){const r=act(s,action,payload);assert.equal(r.error,null,r.error);return r.state;}
function prepare(s){s=step(s,'gear');s=step(s,'move',{location:'canteen'});s=step(s,'eat');s=step(s,'readBacklog');s=step(s,'readRoster');s=step(s,'move',{location:ROLES[s.role].home});s=step(s,'sign');for(const j of s.inheritedJobs.filter(j=>j.status==='待安排'))s=step(s,'assignInherited',{id:j.id,choice:0});return s;}
function dutyReady(seed=7){return {...createState('normal',seed),inheritedJobs:[],day:2,location:'gate',time:530,signed:true,dayDone:true};}
function finish(s){let ticks=0;while(s.time<960){assert.ok(ticks++<800);s=step(s,s.activeIncident?'respondIncident':'tick',s.activeIncident?{choice:0}:{});}return s;}
test('三種新身分各有三天工作，可分工、待命、交班且跨日保留身分',()=>{
 for(const difficulty of ['easy','normal','hard'])for(const role of ['engineer','medic','logistics'])for(const choice of [0,1]){let s=createState(difficulty,43,role);for(let day=1;day<=3;day++){
  s=prepare(s);assert.ok(can(s,'checkId'));assert.ok(can(s,'approve'));assert.equal(s.role,role);
  while(!s.dayDone){const index=s.roleStep,task=roleTasks(s)[index];s=step(s,'move',{location:task.location});if(task.earliest&&s.time<task.earliest)s=step(s,'roleWait');s=step(s,'roleTask',{step:index,choice});}
  assert.equal(mainWorkDone(s),true);assert.ok(can(s,'handover'));assert.equal(s.roleChoices.length,3);
  const reloaded=restoreState(JSON.stringify(s));assert.equal(reloaded.role,role);assert.deepEqual(reloaded.roleChoices,s.roleChoices);s=finish(reloaded);s=step(s,'move',{location:ROLES[role].home});s=step(s,'reviewHandover');s=step(s,'handover');assert.equal(s.ended,true);assert.equal(s.events.find(e=>e.id===roleEventId(s)).status,choice===1?'已交接／待追蹤':'已結案');
  if(day<3){s=step(s,'nextDay');assert.equal(s.role,role);assert.equal(s.roleStep,0);assert.equal(s.day,day+1);}
 }}
});
test('職務工作需要正確地點、接班與目前步驟，不能重複取得結果',()=>{
 let s=createState('normal',1,'medic');assert.ok(act(s,'roleTask',{step:0,choice:0}).error);s=prepare(s);assert.ok(can(s,'inspectReader'));const task=roleTasks(s)[0];s=step(s,'move',{location:task.location});const before=s.time;s=step(s,'roleTask',{step:0,choice:0});assert.ok(s.time>before);const again=act(s,'roleTask',{step:0,choice:0});assert.ok(again.error);assert.equal(again.state,s);const wrong=act({...s,location:'dorm'},'roleTask',{step:1,choice:0});assert.ok(wrong.error);
});
test('舊存檔預設守門身分；新醫療與倉儲地點能正確還原',()=>{
 const old=createState();delete old.role;delete old.roleStep;assert.equal(restoreState(JSON.stringify(old)).role,'gatekeeper');
 for(const [role,location] of [['medic','medical'],['logistics','supplies'],['engineer','power']]){const s=restoreState(JSON.stringify({...createState('normal',3,role),location}));assert.equal(s.role,role);assert.equal(s.location,location);}
});
test('十個新事件加入十六事件池，多個固定新局種子可抽到全部種類',()=>{
 assert.equal(EXTRA_EVENTS.length,10);assert.equal(DUTY_EVENTS.length,16);assert.equal(new Set(DUTY_EVENTS.map(x=>x.key)).size,16);
 const seen=new Set();for(let seed=1;seed<=160;seed++){let s=dutyReady(seed);while(!s.activeIncident)s=step(s,'tick');seen.add(s.activeIncident.key);}assert.equal(seen.size,16);
});
test('每個新事件的兩種安排都等回報才結案或保留下一班責任',()=>{
 for(const event of EXTRA_EVENTS)for(const choice of [0,1]){const id='EV-TEST';let s={...dutyReady(),standbyStarted:true,activeIncident:{key:event.key,id,opened:530},events:[{id,title:event.title,category:'待命事件',systemKey:event.key,status:'查核中',owner:event.from,entries:[],attachments:[],opened:530,openedDay:2,closed:null}]};s=step(s,'respondIncident',{choice});assert.equal(s.events[0].status,'處理中');const due=s.dutyJob.due;s.nextIncidentAt=null;while(s.time<due)s=step(s,'tick');assert.equal(s.dutyJob,null);assert.equal(s.events[0].status,event.choices[choice].pending?'已安排／待追蹤':'已結案');assert.equal(s.events[0].entries.at(-1).time,due);assert.equal(s.events[0].entries.at(-1).actor,event.choices[choice].actor);}
});
test('八路畫面一起呈現；鏡頭失聯只影響該鏡頭並隨修復回報解除',()=>{
 const s=createState();assert.equal((monitorWall(s).match(/data-camera-detail=/g)||[]).length,8);assert.equal(cameraStatus(s,'hall').ok,true);
 const broken={...s,events:[{systemKey:'camera-link',status:'已安排／待追蹤'}]};assert.equal(cameraStatus(broken,'hall').ok,false);assert.equal(cameraStatus(broken,'gate').ok,true);assert.match(monitorWall(broken),/畫面未更新/);broken.events[0].status='已結案';assert.equal(cameraStatus(broken,'hall').ok,true);
});
test('八區四格細節圖都有實體素材，涵蓋三十二個設備近景',()=>{
 assert.equal(DETAIL_AREAS.length,8);assert.equal(DETAIL_AREAS.reduce((n,a)=>n+a.parts.length,0),32);for(const area of DETAIL_AREAS)assert.ok(existsSync(new URL('../dist/assets/'+area.file,import.meta.url)),area.file);
});
test('非守門身分不能提前處理未到貨的箱子，同事回報依預約時間留下紀錄',()=>{
 let s=prepare(createState('normal',5,'medic'));assert.notEqual(s.inheritedJobs.find(j=>j.key==='medical-stock').title,'醫療用品盤點還在核對');s=step(s,'move',{location:'medical'});s=step(s,'roleTask',{step:0,choice:0});assert.match(can(s,'roleTask'),/09:10/);s=step(s,'roleWait');assert.equal(s.time,550);const event=s.events.find(e=>e.id==='EV-21260916-TEAM');assert.equal(event.entries[0].time,550);s=step(s,'roleTask',{step:1,choice:0});assert.equal(s.events.find(e=>e.id===event.id).entries.find(e=>e.type==='身分回報').time,553);
});
