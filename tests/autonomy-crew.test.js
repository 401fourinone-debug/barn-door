import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createState,act,restoreState} from '../dist/engine.js';
import {DUTY_EVENTS} from '../dist/duty-events.js';
import {CREW,autoDecision,crewPosts,crewAvailable,absolute} from '../dist/crew.js';
import {investigationOf} from '../dist/investigation.js';
import {crewStrip} from '../dist/crew-ui.js';
import {createAudio,hasRadioReport} from '../dist/ambient-audio.js';
const step=(s,a,p={})=>{const r=act(s,a,p);assert.equal(r.error,null,r.error);return r.state;};
const ready=(seed=3,role='gatekeeper')=>({...createState('normal',seed,role),day:1,time:600,signed:true,inheritedJobs:[],standbyStarted:true,standardReceived:true,decision:'approved',outerGate:'closed',dayDone:true,nextIncidentAt:null});
test('一般狀況有負責人自主判斷，只有權限或協調問題交給玩家',()=>{
 let automatic=0,escalated=0;for(let seed=1;seed<60;seed++){let s=ready(Math.imul(seed,98765431)>>>0);s.nextIncidentAt=601;s=step(s,'tick');if(s.activeIncident){escalated++;assert.ok(s.activeIncident.reason);assert.equal(s.dutyHandled.length,0);}else{automatic++;assert.equal(s.dutyHandled[0].decisionBy,'auto');assert.ok(s.dutyJob?.ownerId);assert.ok(s.events.some(e=>e.entries.some(r=>r.type==='系統決策')));assert.equal(act(s,'tick').error,null);}}assert.ok(automatic>escalated);assert.ok(escalated>0);
 for(const event of DUTY_EVENTS){const p=autoDecision(ready(),event);assert.ok(CREW.some(x=>x.id===p.ownerId));assert.ok(event.choices[p.choice]);}
});
test('不同餘裕會改變同事的安全安排，淨水不足會要求跨職務協調',()=>{
 const s=ready(),water=DUTY_EVENTS.find(e=>e.key==='water-reading'),meal=DUTY_EVENTS.find(e=>e.key==='meal');assert.equal(autoDecision(s,water).player,false);s.world.resources.water=70;assert.equal(autoDecision(s,water).player,true);s.world.resources.food=70;assert.equal(autoDecision(s,meal).choice,0);assert.match(autoDecision(s,meal).reason,/避免直接多用備料/);assert.equal(autoDecision(s,DUTY_EVENTS.find(e=>e.key==='cold-store')).choice,1);
});
test('同一同事不會同時完成兩件事，多人協作也等所有人有空',()=>{
 let s=ready();s.inheritedJobs=[{id:'busy',key:'water-check',owner:'工程師',status:'處理中',due:650,dueDay:1,reply:'既有工程完成。'}];s.events.push({id:'busy',title:'既有工程',entries:[],attachments:[]});const id='manual';s.events.push({id,title:'冷藏',status:'查核中',entries:[],attachments:[]});s.activeIncident={key:'cold-store',id,opened:600};s=step(s,'respondIncident',{choice:0});assert.ok(s.dutyJob.participants.includes('P02'));assert.ok(s.dutyJob.participants.includes('P04'));assert.equal(s.dutyJob.start,650);assert.equal(s.dutyJob.due,661);const posts=crewPosts(s);assert.equal(posts.find(p=>p.id==='P02').status,'工作中');assert.equal(posts.find(p=>p.id==='P02').location,'engineering');assert.equal(posts.find(p=>p.id==='P04').status,'排隊接手');assert.equal(crewAvailable(s,'P04'),661);
});
test('跨班才有空的工作保留待辦，不能在16:00虛構做完',()=>{
 let s=ready();s.time=950;s.traceWork={id:'other',ownerId:'P02',caseDay:1,due:980};const id='late';s.events.push({id,title:'門機檢查',status:'查核中',entries:[],attachments:[]});s.activeIncident={key:'motor',id,opened:950};s=step(s,'respondIncident',{choice:0});assert.equal(s.dutyJob,null);assert.equal(s.events.find(e=>e.id===id).closed,undefined);const j=s.inheritedJobs.find(j=>j.id===id);assert.equal(j.dueDay,2);assert.equal(j.status,'處理中');assert.ok(j.due>=489);assert.equal(s.events.find(e=>e.id===id).status,'已安排／待追蹤');
});
test('玩家需取得對照線索後指出位置，交給專業同事延遲複查',()=>{
 let s=ready();s.time=619;s=step(s,'tick');assert.equal(investigationOf(s).status,'比對中');s.nextIncidentAt=null;assert.ok(act(s,'diagnosePost',{location:'engineering'}).error);
 s=step(s,'move',{location:'engineering'});s=step(s,'inspectPost');s=step(s,'move',{location:'canteen'});s=step(s,'inspectPost');s=step(s,'diagnosePost',{location:'engineering'});const due=s.traceWork.due;assert.equal(investigationOf(s).status,'複查中');assert.equal(s.events.find(e=>e.id===s.traceWork.id).closed,null);while(absolute(s)<due)s=step(s,'tick');assert.equal(s.traceWork,null);assert.equal(investigationOf(s).status,'已完成');assert.ok(s.events.some(e=>e.category==='巡查對照'&&e.entries.some(r=>r.type==='完成回報')));
});
test('證據不足的判讀不會硬結案，新增觀察後可更正，讀檔不丟線索',()=>{
 let s=ready();s.time=619;s=step(s,'tick');s.nextIncidentAt=null;for(const location of ['engineering','medical']){s=step(s,'move',{location});s=step(s,'inspectPost');}s=step(s,'diagnosePost',{location:'engineering'});assert.equal(investigationOf(s).status,'比對中');s=restoreState(JSON.stringify(s));assert.equal(investigationOf(s).clues.length,2);s=step(s,'move',{location:'canteen'});s=step(s,'inspectPost');s=step(s,'diagnosePost',{location:'engineering'});assert.equal(investigationOf(s).status,'複查中');
});
test('六個人物沿用固定代號，工作位置隨正在負責的事改變',()=>{
 const s=ready();assert.equal(CREW.length,6);assert.equal(new Set(CREW.map(p=>p.id)).size,6);s.dutyJob={id:'case',key:'motor',ownerId:'P02',participants:['P02'],start:600,due:615};assert.equal(crewPosts(s).find(p=>p.id==='P02').location,'gate');const html=crewStrip(s,x=>x);assert.equal((html.match(/data-crew=/g)||[]).length,6);assert.match(html,/P06/);assert.match(html,/巡查對照/);
});
test('新同事回報才播放對講機提示，重讀或玩家操作回覆不重播',()=>{
 const before=ready(),after=structuredClone(before);after.world.serial=1;after.world.feed=[{id:'W1',actor:'工程師 P02',type:'回報'}];assert.equal(hasRadioReport(before,after),true);assert.equal(hasRadioReport(after,after),false);after.world.feed[0].actor='玩家';assert.equal(hasRadioReport(before,after),false);
});
test('對講機合成有收訊雜訊與雙音，遵守音量、靜音、隱藏及節流',()=>{
 const previous=globalThis.document;globalThis.document={hidden:false};const starts=[];const node=()=>({connect(){},start(t){starts.push(t);},stop(){},frequency:{value:0},Q:{value:0},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}});const ctx={state:'running',currentTime:1,sampleRate:8000,destination:{},createBuffer(c,n){return {getChannelData(){return new Float32Array(n);}};},createBufferSource:node,createBiquadFilter:node,createGain:node,createOscillator:node};const settings={sound:false,radio:true,volume:.25},audio=createAudio(()=>settings,()=>{});audio.ctx=ctx;
 try{audio.radio();assert.equal(starts.length,0);settings.sound=true;audio.radio();assert.equal(starts.length,3);audio.radio();assert.equal(starts.length,3);ctx.currentTime=2;settings.volume=0;audio.radio();assert.equal(starts.length,3);settings.volume=.25;globalThis.document.hidden=true;audio.radio();assert.equal(starts.length,3);globalThis.document.hidden=false;settings.radio=false;audio.radio();assert.equal(starts.length,3);}finally{globalThis.document=previous;}
});

test('三天有不同來源與複查位置，跨日不丟未完成工作或原時間',()=>{
 for(const [day,at,site,other] of [[1,620,'engineering','canteen'],[2,640,'power','engineering'],[3,650,'supplies','medical']]){let s=ready();s.day=day;s.time=at-1;s=step(s,'tick');s.nextIncidentAt=null;for(const location of [site,other]){s=step(s,'move',{location});s=step(s,'inspectPost');}s=step(s,'diagnosePost',{location:site});assert.equal(investigationOf(s).status,'複查中');const id=s.traceWork.id;if(day<3){s.traceWork.due=(day-1)*1440+972;s.ended=true;s.time=960;s.world.resources[day===1?'water':'power']=70;const next=step(s,'nextDay');assert.equal(next.events.find(e=>e.id===id).closedDay,day);assert.equal(next.events.find(e=>e.id===id).closed,972);assert.equal(next.traceWork,null);assert.ok(next.world.feed.some(r=>r.eventId===id&&r.type==='完成回報'));assert.ok(next.world.resources[day===1?'water':'power']!==80);}}
});

test('多筆跨班工程工作依所有參與人員排隊，隔天保留實際工作地點',()=>{let s=ready();s.time=900;s.traceWork={id:'busy-late',ownerId:'P02',caseDay:1,start:890,due:980};for(const [id,key] of [['late1','motor'],['late2','drain']]){s.events.push({id,title:key,status:'查核中',entries:[],attachments:[]});s.activeIncident={key,id,opened:s.time};s=step(s,'respondIncident',{choice:0});}const [a,b]=s.inheritedJobs;assert.equal(a.key,'motor');assert.equal(a.start,1920);assert.ok(b.start>=((a.dueDay-1)*1440+a.due));assert.ok(b.due>a.due);s.day=2;s.time=480;s.traceWork=null;const post=crewPosts(s).find(p=>p.id==='P02');assert.equal(post.location,'gate');assert.equal(post.eventId,'late1');assert.match(post.task,/接續.*drain/);assert.equal(post.due,(a.dueDay-1)*1440+a.due);s.time=a.due;a.status='已完成';assert.equal(crewPosts(s).find(p=>p.id==='P02').location,'engineering');});
