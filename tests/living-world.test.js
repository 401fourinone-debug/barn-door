import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,act,restoreState} from '../dist/engine.js';
import {sceneArt,sceneSnapshot,ROLE_POOLS,workDelay} from '../dist/living-world.js';
import {DUTY_EVENTS} from '../dist/duty-events.js';
import {renderComms} from '../dist/comms-ui.js';
const step=(s,a,p={})=>{const r=act(s,a,p);assert.equal(r.error,null,r.error);return r.state;};
const ready=(role='gatekeeper',seed=3)=>({...createState('normal',seed,role),day:2,time:530,location:'gate',signed:true,dayDone:true,inheritedJobs:[],standbyStarted:true,nextIncidentAt:null});
test('場景每次實際前往才抽新圖，讀檔與計時不重抽且不會連續同一狀態',()=>{
 let s=ready(),kinds=new Set();for(let n=0;n<20;n++){s=step(s,'move',{location:'medical'});kinds.add(sceneSnapshot(s).kind);const one=structuredClone(s.world.scenes.medical);const reload=restoreState(JSON.stringify(s));assert.deepEqual(reload.world.scenes.medical,one);s=step(reload,'tick');assert.deepEqual(s.world.scenes.medical,one);s=step(s,'move',{location:'gate'});const previous=s.world.scenes.medical.kind;s=step(s,'move',{location:'medical'});assert.notEqual(s.world.scenes.medical.kind,previous);s=step(s,'move',{location:'gate'});}assert.equal(kinds.size,3);
});
test('場景抽圖使用獨立種子，不因移動改掉下一個事件抽籤種子',()=>{
 const s=ready(),m=step(s,'move',{location:'medical'});assert.equal(m.dutySeed,s.dutySeed);assert.notEqual(m.world.seed,s.world.seed);const a=sceneArt(m,{});assert.match(a.art,/scene-work-/);assert.equal(a.position,'100% 0%');
});
test('四職務的待命事件池不同，每職務能看到其他三職務具名工作回報',()=>{
 assert.equal(new Set(Object.values(ROLE_POOLS).map(x=>x.join(','))).size,4);assert.deepEqual(new Set(Object.values(ROLE_POOLS).flat()),new Set(DUTY_EVENTS.map(x=>x.key)));
 for(const role of Object.keys(ROLE_POOLS)){let s=ready(role);s=step(s,'tick');const rows=s.world.feed.filter(x=>x.type==='同事回報');assert.equal(new Set(rows.map(r=>r.actor)).size,3);assert.ok(rows.every(r=>r.eventId&&Number.isFinite(r.time)));assert.equal(new Set(s.world.npcDone).size,s.world.npcDone.length);const count=s.world.npcDone.length;s=step(s,'tick');assert.equal(s.world.npcDone.length,count);}
});
function caseStart(choice){const key='cold-store',event=DUTY_EVENTS.find(e=>e.key===key),id='EV-SOURCE';let s=ready('logistics');s.activeIncident={key,id,opened:s.time};s.events=[{id,title:event.title,category:'待命事件',systemKey:key,status:'查核中',owner:event.from,entries:[],attachments:[],opened:s.time,openedDay:2,closed:null}];s=step(s,'respondIncident',{choice});while(s.dutyJob)s=step(s,'tick');s.nextIncidentAt=null;return s;}
test('回報的兩種安排會排出有來源的不同後果，延遲生效並影響後續時間',()=>{
 const good=caseStart(0),pending=caseStart(1);for(const s of [good,pending]){const q=s.world.queue.find(q=>q.source==='EV-SOURCE');assert.ok(q);assert.ok(q.due>((s.day-1)*1440+s.time));assert.equal(q.pending,s===pending);}
 let a=good,b=pending;for(let n=0;n<170;n++){a=step(a,'tick');b=step(b,'tick');}assert.ok(a.world.resources.food>b.world.resources.food);assert.ok(workDelay(b,'food')>workDelay(a,'food'));assert.ok(b.world.feed.some(x=>x.cause==='EV-SOURCE'&&x.type==='連帶影響'));assert.equal(b.events.find(e=>e.id==='EV-SOURCE').status,'已安排／待追蹤');
 const copy=restoreState(JSON.stringify(b));assert.deepEqual(copy.world.queue,b.world.queue);assert.deepEqual(copy.world.resources,b.world.resources);
});
test('舊存檔補上運作狀態，不重播原回報，跨日保留後續與餘裕',()=>{
 let s=caseStart(1);const raw=structuredClone(s);delete raw.world;const old=restoreState(JSON.stringify(raw));assert.ok(old.world);assert.equal(old.world.feed.length,0);s.world.resources.water=71;s.ended=true;s.time=960;const next=step(s,'nextDay');assert.equal(next.day,3);assert.ok(next.world.resources.water<=71);assert.notEqual(next.world.resources.water,80);assert.ok(next.world.seen.length>=s.world.seen.length);
});
test('不同餘裕會改變新狀況估計，已安排工作不會每分鐘被改期',()=>{
 let s=ready('medic');s.world.resources.care=70;const id='INC';s.events=[{id,title:'事件',category:'待命事件',status:'查核中',entries:[],attachments:[]}];s.activeIncident={id,key:'ppe-seal',opened:s.time};const duration=DUTY_EVENTS.find(e=>e.key==='ppe-seal').choices[0].minutes+workDelay(s,'care');s=step(s,'respondIncident',{choice:0});assert.equal(s.dutyJob.due-s.time,duration);const due=s.dutyJob.due;s=step(s,'tick');assert.equal(s.dutyJob.due,due);
});
test('對話流有來源入口，移動與新狀況不自動打開視窗',()=>{
 let s=ready();s=step(s,'tick');const html=renderComms(s,x=>x);assert.match(html,/data-open-event/);assert.match(html,/值勤通訊/);const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');assert.doesNotMatch(app,/if\(state.activeIncident\).*openPanel\('incident'\)/);assert.doesNotMatch(app.slice(app.indexOf('function toast('),app.indexOf('function syncComms(')),/showModal|openPanel/);assert.match(html,/後續影響/);const causal={...s,world:{...s.world,feed:[{id:'W9',day:2,time:600,actor:'後勤',type:'後續影響',text:'補查結果',eventId:'EV-WORLD',cause:'EV-ORIGINAL'}]}};assert.match(renderComms(causal,x=>x),/data-open-event="EV-ORIGINAL"/);assert.doesNotMatch(renderComms(causal,x=>x,false),/comms-messages/);assert.match(renderComms(causal,x=>x,false),/補查結果/);
});
