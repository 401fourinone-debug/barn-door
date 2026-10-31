import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {environmentAt,nearbyContacts,cameraEnvironment,SCENE_ART,CAMERAS} from '../dist/environment.js';
import {createState,act,can,restoreState} from '../dist/engine.js';
test('清晨、午後雨天與夜間使用正確時段及不同底圖，素材均存在',()=>{
 const dawn=environmentAt(1,410),day=environmentAt(1,630),rain=environmentAt(1,840),night=environmentAt(1,1230);
 assert.equal(dawn.phase,'dawn');assert.equal(day.kind,'clear');assert.equal(rain.kind,'rain');assert.equal(night.phase,'night');
 assert.notEqual(day.art,rain.art);assert.notEqual(day.art,night.art);
 for(const file of Object.values(SCENE_ART))assert.ok(existsSync(new URL('../dist/'+file,import.meta.url)));
 assert.equal(environmentAt(3,840).kind,'storm');assert.equal(environmentAt(2,410).kind,'rain');
});
test('時段預覽只回傳視覺資訊，不改動目前時間、任務與接近訊號',()=>{
 const s={...createState(),time:530},snapshot=structuredClone(s),contacts=nearbyContacts(s);
 assert.equal(cameraEnvironment(s,'night').time,1230);assert.equal(cameraEnvironment(s,'live').time,530);
 assert.deepEqual(s,snapshot);assert.deepEqual(nearbyContacts(s),contacts);assert.equal(CAMERAS.length,4);
});
test('雷達人員隨遊戲時間接近，但不能從位置提前得知身分或健康',()=>{
 const s=createState();assert.equal(nearbyContacts(s).length,0);
 const far=nearbyContacts({...s,time:510}).find(c=>c.id==='approach-01');
 const near=nearbyContacts({...s,time:540}).find(c=>c.id==='approach-01');
 assert.ok(far.distance>near.distance);assert.equal(near.people,2);assert.equal(near.known,false);assert.doesNotMatch(near.label,/送貨隊|健康/);
 const arrived=nearbyContacts({...s,time:550,arrived:true}).find(c=>c.id==='approach-01');assert.equal(arrived.motion,'接收區等候');
 const checked=nearbyContacts({...s,time:550,arrived:true,idChecked:true}).find(c=>c.id==='approach-01');assert.equal(checked.known,true);
});
test('送貨隊依處理紀錄離開，隔天不重播昨天的人員接近',()=>{
 const s={...createState(),time:570,arrived:true,standardReceived:true,decision:'approved',outerGate:'closed',events:[{id:'EV-21260916-004',entries:[{type:'處置',time:566}]}]};
 assert.equal(nearbyContacts(s).find(c=>c.id==='approach-01').motion,'離開中');
 assert.ok(!nearbyContacts({...s,time:579}).some(c=>c.id==='approach-01'));
 assert.ok(!nearbyContacts({...s,day:2}).some(c=>c.id==='approach-01'));
});
test('交給合格同事的身分確認，完成回報前後正確反映在雷達',()=>{
 let s={...createState(),signed:true,readerChecked:true,location:'gate',time:550};
 for(const action of ['arrivals','manifest','delegate']){const r=act(s,action);assert.equal(r.error,null);s=r.state;}
 assert.equal(nearbyContacts(s).find(c=>c.id==='approach-01').known,false);
 const r=act(s,'wait');assert.equal(r.error,null);s=r.state;
 assert.equal(s.decision,'delegated');assert.equal(s.delegateDue,null);assert.equal(s.idChecked,false);
 assert.equal(nearbyContacts(s).find(c=>c.id==='approach-01').known,true);
});
test('夜間休息必須先交班，保留紀錄且讀檔後可繼續隔天',()=>{
 let s=createState();assert.ok(can(s,'rest'));s={...s,ended:true,time:960};const ids=s.events.map(e=>e.id);
 const night=act(s,'rest');assert.equal(night.error,null);assert.equal(night.state.time,1230);assert.equal(night.state.location,'dorm');assert.equal(night.state.resting,true);assert.deepEqual(night.state.events.map(e=>e.id),ids);
 const restored=restoreState(JSON.stringify(night.state));assert.equal(restored.resting,true);assert.ok(can(restored,'rest'));
 const next=act(restored,'nextDay');assert.equal(next.error,null);assert.equal(next.state.day,2);assert.equal(next.state.time,410);assert.ok(!next.state.resting);assert.ok(can({...s,day:3},'rest'));
});
