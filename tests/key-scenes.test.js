import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {GATE_SETTINGS,gateScene,cameraScene} from '../dist/key-scenes.js';
import {CAMERAS,nearbyContacts} from '../dist/environment.js';
import {createState} from '../dist/engine.js';
test('九種門外設定與四個新增區域使用實際存在的素材',()=>{
 assert.equal(GATE_SETTINGS.length,9);assert.equal(new Set(GATE_SETTINGS.map(x=>x.id)).size,9);
 assert.equal(CAMERAS.length,8);assert.equal(CAMERAS.filter(x=>x.concept).length,4);
 for(const f of [...GATE_SETTINGS.map(x=>x.art),...CAMERAS.filter(x=>x.art).map(x=>x.art)])assert.ok(existsSync(new URL('../dist/'+f,import.meta.url)),f);
});
test('守門自動換景區分無人、兩人抵達、離開與隔日',()=>{
 const s={...createState(),time:550};assert.equal(gateScene(s).id,'live-empty');
 assert.equal(gateScene({...s,arrived:true}).id,'live-visitors');
 const left={...s,time:590,arrived:true,standardReceived:true,decision:'approved',outerGate:'closed',events:[{id:'EV-21260916-004',entries:[{type:'處置',time:566}]}]};
 assert.equal(gateScene(left).id,'live-empty');assert.equal(gateScene({...s,day:2,arrived:true}).id,'live-empty');
 assert.equal(gateScene({...s,time:900}).id,'live-rain');assert.equal(gateScene({...s,time:1230}).id,'live-night');
});
test('預覽未知生物與人類情境不增加任務或雷達訊號，保留現在存檔',()=>{
 const s={...createState(),time:550,arrived:true},before=structuredClone(s),radar=nearbyContacts(s),gate=CAMERAS[0];
 for(const x of GATE_SETTINGS){const view=cameraScene(s,gate,'live',x.id);assert.equal(view.concept,true);assert.equal(view.art,x.art);assert.equal(view.env.time,x.time);}
 const unknown=cameraScene(s,gate,'live','unknown');assert.equal(unknown.env.phase,'night');assert.equal(unknown.env.kind,'fog');
 assert.deepEqual(s,before);assert.deepEqual(nearbyContacts(s),radar);
});
test('查看雨夜只預覽光線，新區域保持固定日間圖與設定圖標記',()=>{
 const s={...createState(),time:550,arrived:true};
 const night=cameraScene(s,CAMERAS[0],'night','auto');assert.equal(night.id,'live-night');assert.equal(night.env.time,1230);
 const room=cameraScene(s,CAMERAS.find(c=>c.id==='medical'),'night','unknown');assert.equal(room.concept,true);assert.match(room.art,/key-rooms-v06/);assert.equal(room.setting,null);assert.equal(room.env.phase,'day');assert.equal(room.env.time,630);
});
