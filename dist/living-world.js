import {crewName,crewAvailable} from './crew.js?v=09c';
import {ROLE_IDS,ROLES} from './roles.js?v=09c';
export const RESOURCE_NAMES={power:'備援電力',water:'可用淨水',food:'可發物資',care:'照護餘裕',access:'接待餘裕',signal:'通訊餘裕'};
export const ROLE_POOLS={gatekeeper:['radio','rest','motor','unbooked-visitor','outside-dog','uplink-noise'],engineer:['drain','motor','water-reading','battery-warm','camera-link','uplink-noise'],medic:['rest','water-reading','ppe-seal','sleep-distress','unbooked-visitor','camera-link'],logistics:['meal','parcel','cold-store','ration-argument','outside-dog','radio']};
const domains={drain:'water',rest:'care',radio:'signal',meal:'food',motor:'access',parcel:'food','cold-store':'food','water-reading':'water','camera-link':'signal','battery-warm':'power','unbooked-visitor':'access','outside-dog':'care','ppe-seal':'care','sleep-distress':'care','ration-argument':'food','uplink-noise':'signal'};
const abs=s=>((s.day||1)-1)*1440+s.time;
const stamp=n=>({day:Math.floor(n/1440)+1,time:n%1440});
const clamp=n=>Math.max(0,Math.min(100,n));
const idFor=s=>`EV-212609${15+(s.day||1)}-WORLD`;
const names={dorm:'生活區寢室',canteen:'公共餐廳',gate:'守門控制室',engineering:'工程維護區',medical:'醫療工作室',supplies:'物資倉儲',isolation:'隔離接待室',power:'能源通訊室'};
const worker={dorm:'生活區同事',canteen:'後勤',gate:'守門同事',engineering:'工程技師',medical:'醫護',supplies:'後勤',isolation:'接待同事',power:'能源同事'};
export function initWorld(s){
 if(!s.world||s.world.version!==1){s.world={version:1,since:abs(s),seed:((s.dutySeed||1)^0x51f15e)>>>0,visits:0,scenes:{},resources:Object.fromEntries(Object.keys(RESOURCE_NAMES).map(k=>[k,80])),queue:[],seen:[],npcDone:[],observed:[],feed:[],serial:0};}
 const w=s.world;for(const key of ['queue','seen','npcDone','observed','feed'])if(!Array.isArray(w[key]))w[key]=[];
 for(const key of Object.keys(RESOURCE_NAMES))if(!Number.isFinite(w.resources?.[key])){w.resources=w.resources||{};w.resources[key]=80;}
 w.serial=Number.isFinite(w.serial)?w.serial:0;w.visits=w.visits||0;w.scenes=w.scenes||{};
 if(!w.scenes[s.location])w.scenes[s.location]={kind:'empty',visit:0};
 return s;
}
function rng(w){w.seed=(Math.imul(w.seed||1,1664525)+1013904223)>>>0;return w.seed/4294967296;}
function worldEvent(s){let e=s.events.find(e=>e.id===idFor(s));if(!e){e={id:idFor(s),title:'各區工作與後續影響',category:'庇護所運作',opened:s.time,openedDay:s.day||1,status:'持續記錄',owner:'各區值班同事',closed:null,entries:[],attachments:[]};s.events.push(e);}return e;}
function feed(s,actor,text,type='同事回報',eventId=null,at=abs(s),cause=null){const w=s.world,t=stamp(at),row={id:'W'+(++w.serial),...t,actor,text,type,eventId,cause};w.feed.push(row);if(w.feed.length>100)w.feed.shift();return row;}
function journal(s,actor,text,type,at=abs(s),cause=null){const e=worldEvent(s),t=stamp(at),r={id:e.id+'-'+(e.entries.length+1),...t,actor,text,type,cause};e.entries.push(r);e.entries.sort((a,b)=>a.day-b.day||a.time-b.time);feed(s,actor,text,type,e.id,at,cause);return e.id;}
function domainOf(text=''){return /電池|負載|供電|電力/.test(text)?'power':/水|排水|濾網|泵/.test(text)?'water':/醫|護|休息|陪伴|封口/.test(text)?'care':/通訊|天線|衛星|鏡頭|無線電/.test(text)?'signal':/門|來訪|路線|送貨隊/.test(text)?'access':'food';}
const effects={
 water:['排水或取水的追查仍需人手，工程要預留後續確認。','先前的水路確認讓後勤少跑一趟，備水安排有餘裕。'],
 power:['備援的完整量測或確認尚未完成，下一次檢查要多留時間。','先前留下的負載紀錄讓下一輪檢查更快定位。'],
 food:['仍待查的物品先保管，後勤需要另排可用庫存。','分清批次與領用紀錄後，下一輪點貨少了重複確認。'],
 care:['陪伴或用品追查仍需人手，下一輪照護要預留接手時間。','照護與用品安排清楚，接班醫護能把時間留給新需求。'],
 access:['接待或門機事項仍待確認，下一次接待要多留核對時間。','接待與設備紀錄完整，守門同事能較快交叉核對。'],
 signal:['訊號或來源仍待確認，後續聯絡需要多一次重問。','查過的線路與來源已記下，後續聯絡少一次重問。']
};
function scheduleEffect(s,key,domain,pending,source,title,at=abs(s)){
 const w=s.world;if(w.seen.includes(key))return;w.seen.push(key);
 w.queue.push({id:key,due:at+35+Math.floor(rng(w)*21),stage:1,domain,pending,source,title,actor:crewName(domain==='care'?'P03':domain==='food'?'P04':domain==='access'?'P01':domain==='signal'?'P05':'P02')});
}
export function workDelay(s,domain){const n=s.world?.resources?.[domain]??80;return n<78?Math.min(6,Math.ceil((78-n)/2)):n>82?-2:0;}
export function dutyPool(s,all){const pool=all.filter(e=>ROLE_POOLS[s.role||'gatekeeper'].includes(e.key));return pool.flatMap(e=>{const n=s.world?.resources?.[domains[e.key]]??80;return n<78?[e,e]:[e];});}
export function sceneSnapshot(s,location=s.location){const saved=s.world?.scenes?.[location];return {kind:saved?.kind||'empty',visit:saved?.visit||0,name:names[location]};}
export function sceneArt(s,env,location=s.location){const view=sceneSnapshot(s,location),life=['dorm','canteen','gate','engineering'],work=['isolation','medical','supplies','power'];const group=life.includes(location)?'life':'work',idx=(group==='life'?life:work).indexOf(location);return {id:`${location}-${view.kind}-${view.visit}`,art:`assets/scene-${group}-${view.kind}-v08.png`,position:['0% 0%','100% 0%','0% 100%','100% 100%'][idx],size:'200% 200%',mobileSize:'auto 200%',kind:view.kind};}
function visit(s){const w=s.world,location=s.location;w.visits++;const previous=w.scenes[location]?.kind;const candidates=['people','empty','anomaly'].filter(x=>x!==previous);const kind=candidates[Math.floor(rng(w)*candidates.length)];w.scenes[location]={kind,visit:w.visits};
 if(kind==='anomaly'){const key=`${s.day}-${location}`;if(!w.observed.includes(key)){w.observed.push(key);const id=journal(s,worker[location],`${names[location]}有一項標示或讀值需要確認；已請當班同事查核，尚未判定原因。`,'現場待查');scheduleEffect(s,'scene-'+key,({dorm:'care',canteen:'food',gate:'access',engineering:'water',medical:'care',supplies:'food',isolation:'care',power:'power'})[location],true,id,names[location]+'現場待查');}}
}
const NPC={
 gatekeeper:[['接班巡查','access','內外門的關門指示已核對，接待台有人值守。'],['到貨協調','access','今天的貨物依原到貨紀錄辦理，未登記物品另交承辦人追查。'],['預約聯絡','signal','下一輪預約用原窗口核對，沒有把入口位置傳給陌生代號。'],['午間代班','care','午餐時間的代班已確認，出入口不會無人看守。'],['雨棚巡查','water','外側通道完成巡看，排水與濕滑處的觀察已留給工程。'],['交班準備','access','正在整理來訪與未完成接待，下一班會接到原始紀錄。']],
 engineer:[['供電檢查','power','必要設備的負載紀錄已核對，門禁與通風保持供電。'],['淨水觀察','water','換濾網後的壓力趨勢已記下，下一輪沿用同一組量測點。'],['通訊設備','signal','內部對講的測試已完成，外部雜訊另留來源與時段。'],['維修分工','access','停機工作先確認有人顧門，不邊拆機邊代替守門人查人。'],['雨前準備','water','外側排水的巡檢與備用泵試動紀錄已交付當班同事。'],['備援交班','power','夜班的備援讀值與停用項目分開交代，沒有只寫一句正常。']],
 medic:[['用品接手','care','上一班的用品清單已接手，未確認的批次仍分開保管。'],['接待準備','care','接待耗材與防護衣檢查分開記，物品核對不等於人的健康結果。'],['居民照護','care','今日照護與休息安排已交接，個人細節只留在醫護紀錄。'],['午間休息','care','需要陪伴的居民已有同事接手，醫護仍按排程回訪。'],['物資協調','food','確認可用的耗材才列入發放單，待查批次沒有混入。'],['夜班照護','care','夜班用品、尚未釐清的事與接手人已分別寫下。']],
 logistics:[['庫位整理','food','可領、封存與待到貨的位置已分開，推車通道保持暢通。'],['送貨對單','food','到貨數量照現有貨單逐批對，沒到的箱子不寫成已驗收。'],['保存紀錄','food','冷藏讀值與批次紀錄已分開核對，疑問批次仍不能發放。'],['留餐分配','care','輪班用餐與留餐位置已通知各區，代班人也知道領取時間。'],['補給調度','food','下一輪先用確認可領的庫存，額外使用的備品會留下紀錄。'],['倉儲交班','food','未領工具、封存物品與夜班餐點，各自交給接手人。']]
};
function processWorld(s){const w=s.world,now=abs(s);
 // The model's scheduled work has exact game timestamps even when a button advances time.
 for(let day=1;day<=s.day;day++)for(const time of [492,575,660,755,850,930])for(const role of ROLE_IDS){if(role===s.role)continue;const key=`npc-${day}-${time}-${role}`;const at=(day-1)*1440+time;if(at>now||at<(w.since||0)||w.npcDone.includes(key))continue;const personId=({gatekeeper:'P01',engineer:'P02',medic:'P03',logistics:'P04'})[role];if(crewAvailable(s,personId)>now)continue;w.npcDone.push(key);const actualAt=Math.max(at,now);const [title,domain,text]=NPC[role][[492,575,660,755,850,930].indexOf(time)],tight=w.resources[domain]<78,id=journal(s,crewName(({gatekeeper:'P01',engineer:'P02',medic:'P03',logistics:'P04'})[role]),title+'：'+text+(tight?' 先前的待查仍占用餘裕，下一輪需多留確認時間。':''),'同事回報',actualAt);scheduleEffect(s,key,domain,tight,id,ROLES[role].name+'的'+title,actualAt);}
 const due=w.queue.filter(q=>q.due<=now).sort((a,b)=>a.due-b.due);for(const q of due){w.queue=w.queue.filter(x=>x.id!==q.id);const delta=q.pending?-2:1;w.resources[q.domain]=clamp(w.resources[q.domain]+delta);const label=RESOURCE_NAMES[q.domain];
 if(q.stage===1){const text=`因為「${q.title}」：${effects[q.domain][q.pending?0:1]}${label}${delta>0?'+':''}${delta}。`;journal(s,q.actor,text,'後續影響',q.due,q.source);w.queue.push({...q,id:q.id+'-next',due:q.due+100,stage:2});}
 else{const d=workDelay(s,q.domain);journal(s,q.actor,`接續「${q.title}」：${q.pending?'未完成項目仍列在原紀錄，沒有自動結案。':'先前的安排已供下一輪使用。'}${d>0?'相關新工作的預估處理會多 '+d+' 分鐘。':d<0?'相關新工作的預估處理可少 '+(-d)+' 分鐘。':'相關新工作目前按原時間安排。'}`,'連帶影響',q.due,q.source);}}
}
export function updateWorld(before,s,action,payload={},carried=false){
 if(action==='nextDay'&&before.world&&!carried)s.world=structuredClone(before.world);initWorld(s);const w=s.world;
 if(action==='move'&&s.location!==before.location)visit(s);
 const old=new Set((before.events||[]).flatMap(e=>e.entries.map(r=>e.id+':'+r.id)));
 for(const event of s.events.slice())for(const row of event.entries.slice()){if(old.has(event.id+':'+row.id)||event.category==='庇護所運作')continue;
  if(['補註','提醒'].includes(row.type))continue;feed(s,row.actor,row.text,row.type,event.id,((row.day||s.day)-1)*1440+row.time);
  if(['完成回報','回報','完成工作','安排追蹤','處置','處理','證據','離開回報'].includes(row.type)){
   const choice=event.systemKey?(s.dutyHandled||[]).find(x=>x.id===event.id)?.choice:null;
   const pending=choice!=null?!!payload.pending||/待追蹤|處理中/.test(event.status):row.type==='安排追蹤'||/待追蹤|待覆|程序待查/.test(event.status);
   scheduleEffect(s,event.id+':'+row.id,domains[event.systemKey]||domainOf(row.text+' '+row.actor),pending,event.id,event.title,((row.day||s.day)-1)*1440+row.time);
  }
 }
 processWorld(s);
 w.feed.sort((a,b)=>a.day-b.day||a.time-b.time||Number(a.id.slice(1))-Number(b.id.slice(1)));
 if(!['tick','move','note','draft'].includes(action)&&s.last!==before.last&&!w.feed.some(r=>r.day===s.day&&r.time===s.time&&r.text===s.last))feed(s,action==='roleTask'?ROLES[s.role].name:'值勤回報',s.last,'操作回覆');
 return s;
}
