import {createInitialWork,assignmentEta} from './initial-work.js';
import {DUTY_EVENTS} from './duty-events.js';
export const VERSION = 1;
export const DIFFICULTIES = {easy:{name:'容易',threshold:60,initial:87,review:12},normal:{name:'中等',threshold:75,initial:82,review:16},hard:{name:'最難',threshold:90,initial:78,review:24}};
export const CASE_ID = 'EV-21260916-004';
export const ROUTINE_ID = 'EV-21260916-003';
export const timeText = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
export function createState(difficulty='normal',seed=Math.floor(Math.random()*4294967295)) {
  if (!DIFFICULTIES[difficulty]) difficulty='normal';
  const initial=createInitialWork(difficulty);
  return {inheritedJobs:initial.jobs,backlogReviewed:false,dutySeed:seed>>>0,standbyStarted:false,standbyPaused:false,nextIncidentAt:null,activeIncident:null,dutyJob:null,dutyHandled:[],day:1,history:[],handoverRead:false,readerRepaired:false,repairDeferred:false,version:VERSION,difficulty,time:410,location:'dorm',health:DIFFICULTIES[difficulty].initial,trust:78,stamina:84,fatigue:22,pressure:12,gear:false,ate:false,rosterRead:false,signed:false,readerChecked:false,readerClean:false,arrived:false,idChecked:false,manifestChecked:false,claimHeard:false,held:false,standardReceived:false,medicalRequested:false,medicalDue:null,medicalReviewed:false,delegated:false,delegateDue:null,decision:null,innerGate:'closed',outerGate:'closed',gateDue:null,ended:false,events:initial.events,rosterDraft:{gate:'資深守門人',engineering:'工程師',medical:'醫療負責人',logistics:'後勤人員'},flags:[],last:'你在普通的九月早晨醒來。通風正常，早餐供應中。'};
}
export function caseEvent(s){return s.events.find(e=>e.id===CASE_ID);}
function ensureEvent(s,id,title,category){let e=s.events.find(e=>e.id===id);if(!e){e={id,title,category,opened:s.time,openedDay:s.day||1,status:'查核中',owner:'玩家',closed:null,entries:[],attachments:[]};s.events.push(e);}return e;}
function log(s,id,type,actor,text,at=s.time){const e=s.events.find(e=>e.id===id);if(e){e.entries.push({id:`${id}-${e.entries.length+1}`,time:at,day:s.day||1,type,actor,text});e.entries.sort((a,b)=>(a.day||1)-(b.day||1)||a.time-b.time);}}
function evidence(s,id,title,source,content,at=s.time){const e=caseEvent(s);if(e&&!e.attachments.some(a=>a.id===id))e.attachments.push({id,title,source,time:at,content});}
const bound=v=>Math.min(100,Math.max(0,v));
function bump(s,health=0,trust=0){s.health=bound(s.health+health);s.trust=bound(s.trust+trust);}
function closeExtra(s,decision,description){s.decision=decision;const e=caseEvent(s);e.status='待覆核';log(s,CASE_ID,'處置',decision==='delegated'?'代理守門人':'玩家',description);}
export function advance(s,minutes){
  s.time=Math.min(960,s.time+minutes);s.stamina=bound(s.stamina-Math.max(0,Math.floor(minutes/30)));s.fatigue=bound(s.fatigue+Math.floor(minutes/45));
  if(s.gateDue!==null&&s.time>=s.gateDue){const at=s.gateDue;s.outerGate='closed';s.gateDue=null;log(s,CASE_ID,'系統','門位感測器','外門關閉完成；內門維持關閉。',at);}
  if(s.medicalDue!==null&&s.time>=s.medicalDue&&!s.medicalReviewed){const at=s.medicalDue;s.medicalReviewed=true;s.medicalDue=null;evidence(s,'E03','醫療覆核回報','值班醫療負責人','確曾請託交換隊轉運密封耗材，但未事先登記。批次與封條已覆核，尚需後勤驗收。不涉及個人病歷。',at);log(s,CASE_ID,'證據','醫療負責人','確認請託及耗材批次，已提供授權覆核。',at);if(!s.decision)s.last='醫療回覆已收到，可在門禁終端與事件附件查看。';}
  if(s.delegateDue!==null&&s.time>=s.delegateDue){const at=s.delegateDue;s.delegateDue=null;s.medicalReviewed=true;s.standardReceived=true;s.outerGate='closed';s.gateDue=null;evidence(s,'E04','代理完成回報','代理守門人／後勤／醫療','代理依程序完成身分核驗、醫療覆核、濾芯與額外耗材驗收；門位回報正常。',at);s.decision='delegated';caseEvent(s).status='待覆核';log(s,CASE_ID,'處理','代理守門人','與醫療、後勤完成查核及驗收，提交覆核。',at);bump(s,3,4);s.last='代理完成處理。你可以查閱回報，準備交班。';}
}
function message(s,text){s.last=text;}
function firstDayCan(s,action){
  if(s.ended)return '本次試玩已結束，請重新開始或查看紀錄。';
  const gateActions=['inspectReader','cleanReader','arrivals','checkId','manifest','visitor','hold','callMedical','receiveStandard','approve','return','delegate','bypass','closeOuter','handover'];
  if(gateActions.includes(action)&&s.location!=='gate')return '請先前往門禁控制室。';
  if(action==='gear')return s.gear?'已取得工作裝備。':null;
  if(action==='eat')return s.ate?'本班餐點已領取，無需重複領餐。':s.location!=='canteen'?'請先前往餐廳。':null;
  if(action==='readRoster')return !s.backlogReviewed?'先看看上一班留下的待辦，分清楚哪些要你安排、哪些同事正在做。':!s.gear?'先拿好工作服和識別證。':!s.ate?'先到餐廳吃早餐，再聽上一班說明。':s.rosterRead?'已經聽過上一班的提醒。':null;
  if(action==='sign')return s.signed?'已完成接班。':!s.gear?'先回置物櫃取工作裝備與識別證。':!s.rosterRead?'先閱讀交班事項。':s.location!=='gate'?'請在門禁控制室完成接班。':null;
  if(gateActions.includes(action)&&!s.signed)return '先閱讀交班事項並完成接班。';
  if(action==='inspectReader')return s.readerChecked?'已完成讀取器檢查。':null;
  if(action==='cleanReader')return !s.readerChecked?'先檢查讀取器。':s.readerClean?'已清潔；偶發故障仍需工程覆查。':null;
  if(action==='arrivals')return !s.readerChecked?'先完成例行設備檢查。':s.arrived?'交換隊已抵達。':null;
  if(['checkId','manifest','visitor','hold','callMedical','receiveStandard','approve','return','delegate','bypass'].includes(action)&&!s.arrived)return '預約交換隊尚未抵達。';
  if(s.delegated&&['checkId','manifest','visitor','hold','callMedical','receiveStandard','approve','return','delegate','bypass'].includes(action))return '代理已接手，等待完成回報或查看事件紀錄。';
  if(action==='checkId')return s.idChecked?'身分交叉核驗已完成。':null;
  if(action==='manifest')return s.manifestChecked?'貨單已核對，額外箱未登記。':null;
  if(action==='visitor')return s.claimHeard?'已記錄訪客陳述。':null;
  if(action==='receiveStandard')return s.standardReceived?'六支預約濾芯已完成接收。':!s.idChecked?'先完成身分交叉核驗。':!s.manifestChecked?'先核對貨單。':s.innerGate!=='closed'?'內門未確認關閉，互鎖阻止外門開啟。':s.outerGate!=='closed'?'等待外門完成上一輪關閉。':null;
  if(['hold','callMedical','approve','return','delegate','bypass'].includes(action)&&!s.manifestChecked)return '先核對貨單，建立額外箱紀錄。';
  if(['hold','callMedical','approve','return','delegate','bypass'].includes(action)&&s.decision)return '額外物資已有處置，請在事件簿查看或補註。';
  if(action==='hold')return s.held?'額外箱已封存在 H02，後勤已接收保管。':null;
  if(action==='callMedical')return s.medicalRequested?'醫療覆核已提出，請查看回覆或等待。':null;
  if(action==='approve')return !s.medicalReviewed?'等待醫療覆核，不以訪客口述代替證據。':!s.idChecked?'先完成身分核驗。':null;
  if(action==='delegate')return s.outerGate!=='closed'?'先等外門關閉完成，再交接控制權。':null;
  if(action==='closeOuter')return s.outerGate==='closed'?'外門已確認關閉。':null;
  if(action==='leaveHeld')return !s.held?'先請後勤把箱子保管好。':s.decision?'這箱已經安排好了。':null;
  if(action==='reviewHandover'||action==='handover')return !s.standardReceived?'先收下約好的六支濾芯，或請同事幫忙。':!s.decision?'先安排多出來的箱子。要留給下一班，請明確選擇「交給下一班繼續處理」。':s.delegateDue!==null?'同事還沒忙完，先等他回覆。':s.outerGate!=='closed'?'外門還在關，等它關好再交班。':action==='handover'&&!s.handoverRead?'先把已做和未做的事交代給接班同事。':null;
  if(action==='wait')return !s.signed?'完成接班後才能跳至下一工作事項。':null;
  return null;
}
function firstDayAct(state,action,payload={}){
  const s=structuredClone(state);const reason=can(s,action);if(reason)return {state,error:reason};
  switch(action){
    case 'move': {if(!['dorm','canteen','gate','engineering'].includes(payload.location))return {state,error:'未知地點。'};s.location=payload.location;advance(s,3);message(s,{dorm:'生活區乾燥安靜。隔壁的夜班居民仍在休息。',canteen:'飯菜是熱的，抽風與冷藏設備運作正常。',gate:s.arrived?'交換隊正在接收區等待你的處理。':'門禁設備待命。外面是普通的多雲早晨。',engineering:'工程師正在例行巡檢。未見緊急故障。'}[s.location]);break;}
    case 'gear':s.gear=true;advance(s,4);message(s,'已取識別證、工作外套與通訊器。進檢疫區時另需防護裝備。');break;
    case 'eat':s.ate=true;advance(s,15);s.stamina=bound(s.stamina+12);s.fatigue=bound(s.fatigue-5);message(s,'早餐是米飯、蔬菜與豆類。你聽見後勤提醒：「夜班還有留份。」');break;
    case 'readRoster':s.rosterRead=true;advance(s,2);message(s,'交班重點：讀取器偶發失靈；09:10 有預約交換隊；工程師午後覆查。');break;
    case 'sign':s.signed=true;s.time=Math.max(480,s.time);ensureEvent(s,ROUTINE_ID,'指紋讀取器例行檢查','設備');log(s,ROUTINE_ID,'交接','資深守門人 → 玩家','門禁控制權已交接，內外門位置均確認關閉。');message(s,'08:00 值勤開始。先完成例行設備檢查，再接待交換隊。');break;
    case 'inspectReader':s.readerChecked=true;advance(s,4);log(s,ROUTINE_ID,'查核','玩家','指紋讀取器接觸面有污漬；自檢出現偶發不可讀。虹膜與既有預約資料可交叉核驗。');message(s,'讀取器偶發不可讀。你可以清潔並回報，不能直接把它判定為已修復。');break;
    case 'cleanReader':s.readerClean=true;advance(s,6);log(s,ROUTINE_ID,'處理','玩家','已清潔接觸面，偶發不可讀仍存在。工單保留，工程午後覆查。');bump(s,1,1);message(s,'清潔完成，仍有偶發錯誤。已附註工程工單。');break;
    case 'arrivals':s.time=Math.max(550,s.time);s.arrived=true;ensureEvent(s,CASE_ID,'貨單外的一箱耗材','門禁／物資');log(s,CASE_ID,'系統','門禁終端','預約交換隊抵達，共兩名訪客。對外來源 K-17；位置資料不公開。');message(s,'兩名訪客帶來六支預約濾芯，另有一個密封箱。先核對身分與貨單。');break;
    case 'checkId':s.idChecked=true;advance(s,3);log(s,CASE_ID,'查核','玩家','虹膜及預約核驗碼相符；指紋不可讀已連結設備工單。以交叉證據完成本次身分覆核，未據此判定健康。');evidence(s,'E01','身分交叉核驗','本地預約快取／虹膜比對','兩名訪客與預約紀錄及既有聯絡核驗碼相符。指紋不可讀是待查項，未直接判定冒名。此結論不代表醫療健康通過。');message(s,'人和預約資料對上了。指紋機的問題已另外記下，這不代表訪客通過健康檢查。');break;
    case 'manifest':s.manifestChecked=true;advance(s,3);log(s,CASE_ID,'證據','玩家／後勤貨單','預約：濾芯六支。現場另有密封醫療耗材箱，未列於貨單。');evidence(s,'E02','貨單與現場差異','預約貨單／現場觀察','濾芯 06 支已登記；額外箱 01 件未登記，箱體封條完整。外觀及封條不足以證明內容或健康安全。');message(s,'發現未登記的醫療耗材箱。可以請醫療覆核、留置、退回或委派。');break;
    case 'visitor':s.claimHeard=true;advance(s,2);log(s,CASE_ID,'陳述','訪客／玩家登錄','訪客稱醫療人員曾請託轉運，未提供正式預登記。尚待查核。');evidence(s,'E00','訪客口述','訪客陳述，未查證','「醫療那邊上次託我們帶的，可能還沒補登記。你可以問一下。」');message(s,'訪客說：「醫療那邊託我們帶的，你可以問一下。」已標記為未查證陳述。');break;
    case 'hold':s.held=true;advance(s,4);caseEvent(s).status='待醫療覆核';log(s,CASE_ID,'保管','玩家 → 後勤人員','額外箱移至外側留置位 H02；封條及件數記錄完成，後勤接受保管責任。未進生活區。');message(s,'後勤已接收 H02 留置箱。你可以繼續查核，或將未完成事項正式交班。');break;
    case 'callMedical':s.medicalRequested=true;s.medicalDue=s.time+DIFFICULTIES[s.difficulty].review;log(s,CASE_ID,'請求','玩家 → 醫療負責人','請求覆核未登記耗材，等待授權回報。');message(s,`醫療已受理，預計 ${DIFFICULTIES[s.difficulty].review} 分鐘回覆。可先接收預約濾芯或等待。`);break;
    case 'receiveStandard':s.standardReceived=true;s.outerGate='closing';s.gateDue=s.time+3;advance(s,2);log(s,CASE_ID,'處理','後勤／門禁終端','六支預約濾芯驗收完成。外門正在關閉，內門維持關閉；等待門位回報。');bump(s,3,2);message(s,'六支濾芯已接收。外門正在關閉，尚未收到完成回報。');break;
    case 'approve':advance(s,6);closeExtra(s,'approved','醫療授權覆核及後勤驗收完成，額外耗材依程序入庫。');bump(s,3,5);message(s,'耗材已完成覆核及入庫。這次遺漏登記已留下紀錄，沒有把責任藏起來。');break;
    case 'return':advance(s,4);closeExtra(s,'returned','未登記箱退回交換隊，已通知醫療與後勤；預約交易不受影響。');bump(s,0,1);message(s,'額外箱已退回。程序清楚，但醫療耗材將延後取得。');break;
    case 'delegate':s.delegated=true;s.delegateDue=s.time+22;caseEvent(s).owner='代理守門人';log(s,CASE_ID,'交接','玩家 → 代理守門人','代理接受接待、查核及驗收；玩家暫離控制權。');message(s,'代理已接手，約 22 分鐘完成回報。你可以去用餐或到工程區。');break;
    case 'bypass':advance(s,2);closeExtra(s,'bypassed','玩家未經醫療及貨物覆核，直接批准額外箱入內；程序缺口列待覆核，未虛構病原結果。');bump(s,-5,-16);s.pressure=bound(s.pressure+8);message(s,'額外箱已放行，但缺少授權覆核。後勤要求你在交班時說明。');break;
    case 'closeOuter':advance(s,3);s.outerGate='closed';s.gateDue=null;log(s,CASE_ID,'系統','門位感測器','外門關閉完成；內門維持關閉。');message(s,'門位感測器已確認外門關閉。');break;
    case 'wait':{const target=s.delegateDue??s.medicalDue??s.gateDue;advance(s,target!==null?Math.max(1,target-s.time):10);if(!s.last.includes('回覆')&&!s.last.includes('代理完成'))message(s,'等待完成。設備資料已更新。');break;}
    case 'note':{const text=String(payload.text||'').trim().slice(0,500);if(!text)return {state,error:'請輸入補註內容。'};const id=payload.id||CASE_ID;if(!s.events.some(e=>e.id===id))return {state,error:'事件不存在。'};log(s,id,'補註','玩家',text);message(s,'補註已追加；既有紀錄保留。');break;}
    case 'draft':{if(!['gate','engineering','medical','logistics'].includes(payload.role)||!String(payload.person||'').trim())return {state,error:'排班資料不完整。'};s.rosterDraft[payload.role]=String(payload.person).slice(0,30);message(s,'已儲存 10 月排班草案，本日職務未變更。');break;}
    case 'leaveHeld':s.decision='held';log(s,CASE_ID,'安排','玩家','箱子由後勤保管，未完成的確認工作明確留給下一班。');message(s,'箱子已保管好，還要做的事也列好了。接著繼續待命，到下午四點再交班。');break;
    case 'reviewHandover':s.handoverRead=true;log(s,CASE_ID,'交班說明','玩家 → 接班守門人','已說明收貨結果、門是否關好、讀取器問題及尚未完成的工作。');message(s,'接班同事看過紀錄，確認知道接下來要做什麼。現在可以下班了。');break;
    case 'handover':{const e=caseEvent(s);if(s.decision==='held'){e.status='已交接／待覆核';e.owner='接班守門人';bump(s,1,3);}else{e.status=s.decision==='bypassed'?'已交接／程序待查':'已結案';e.closed=s.decision==='bypassed'?null:s.time;if(s.decision==='bypassed')e.owner='接班守門人／覆核人';}log(s,CASE_ID,'交接','接班守門人','兩扇門都關好了。同事已接下紀錄和未完成的工作。');s.ended=true;message(s,'交班完成，可以下班了。');break;}
    default:return {state,error:'未知操作。'};
  }
  return {state:s,error:null};
}
function firstDayWorkflow(s){
 const step=(stage,text,action,panel,location)=>({stage,text,action,panel,location});
 if(s.ended)return step(4,'今天的工作交給同事了。看看這一班的結果。',null,'result');
 if(!s.gear)return step(0,'先從置物櫃拿工作服、識別證和對講機。','gear','inventory','dorm');
 if(!s.ate)return step(0,'到餐廳吃早餐，再開始上班。','eat',null,'canteen');
 if(!s.rosterRead)return step(1,'聽上一班說明今天要注意的事。',null,'briefing');
 if(!s.signed)return step(1,'到守門室，告訴上一班「接下來換我」。','sign','briefing','gate');
 if(!s.readerChecked)return step(2,'先看看指紋機哪裡有問題。','inspectReader',null,'gate');
 if(!s.arrived)return step(2,'檢查做完了，等 09:10 的送貨隊過來。','arrivals',null,'gate');
 if(s.delegated&&s.delegateDue)return step(2,'同事正在處理，等他回覆。','wait');
 if(!s.idChecked&&!s.delegated)return step(2,'先確認來的人是不是約好的送貨隊。',null,'terminal','gate');
 if(!s.manifestChecked)return step(2,'看看送來的東西和貨單是否一樣。',null,'terminal','gate');
 if(!s.standardReceived)return step(2,'先收下約好的六支濾芯，多的箱子另外處理。',null,'terminal','gate');
 if(s.outerGate!=='closed')return step(2,'貨收好了，等外門完全關上。','closeOuter',null,'gate');
 if(!s.decision)return step(2,s.medicalDue?'醫護還在確認。可以等回覆，或選擇其他處理方式。':s.medicalReviewed?'醫護已回覆。決定要收下箱子，還是另作安排。':'多了一箱沒登記的東西，問清楚再決定怎麼辦。',null,'terminal','gate');
 return step(3,s.handoverRead?'同事已聽清楚，也答應接手。確認後就能下班。':'把今天做過的事、還沒做完的事交代給接班同事。',null,'handover','gate');
}
export function objective(s){return workflow(s).text;}
function firstDayOutcome(s){const names={approved:'查核後接收',returned:'依程序退回',delegated:'協作完成',held:'留置並交接',bypassed:'未核驗放行'};return {title:names[s.decision]||'尚未完成',threshold:DIFFICULTIES[s.difficulty].threshold,passed:s.health>=DIFFICULTIES[s.difficulty].threshold&&s.trust>=DIFFICULTIES[s.difficulty].threshold,lesson:{approved:'你取得證據、完成授權與驗收。額外耗材可使用，未登記的原因也有紀錄。',returned:'你維持入區程序，也承擔醫療耗材延後的代價。這是可行選擇，並非隱藏錯誤答案。',delegated:'你把責任交給有能力的人，並取得可查核回報。庇護所不需要你親自完成每個步驟。',held:'事情尚未結案，但物資保管、承辦人與後續責任清楚。未完成事項也能負責任地交接。',bypassed:'沒有憑空發生感染，但你跳過查核的事實會影響信任，並成為後續待查事項。'}[s.decision]||''};}
export function restoreState(raw){try{const s=JSON.parse(raw);if(s.version!==VERSION||!DIFFICULTIES[s.difficulty]||!Array.isArray(s.events)||!Number.isFinite(s.time)||!['dorm','canteen','gate','engineering'].includes(s.location))return null;return {...createState(s.difficulty),...s,inheritedJobs:Array.isArray(s.inheritedJobs)?s.inheritedJobs:[],backlogReviewed:s.backlogReviewed??true};}catch{return null;}}

export const dateText=s=>`2126.09.${15+(s.day||1)}`;
export const dayCaseId=s=>(s.day||1)===1?CASE_ID:(s.day===2?'EV-21260917-001':'EV-21260918-001');
function missionCan(s,action){
 if(action==='nextDay')return !s.ended?'先把今天的工作交給接班同事。':(s.day||1)>=3?'三天試玩已結束。':null;
 if((s.day||1)===1)return firstDayCan(s,action);
 if(s.ended)return '今天已經下班了，可以休息到隔天。';
 if(['move','gear','eat','readRoster','note','draft'].includes(action))return firstDayCan(s,action);
 if(action==='sign')return !s.gear?'先拿工作裝備。':!s.ate?'先吃早餐。':!s.rosterRead?'先聽上一班交代。':s.signed?'已經接班了。':s.location!=='gate'?'先到守門室。':null;
 if(!s.signed)return '接下這一班後，再處理工作。';
 if(['reviewHandover','handover'].includes(action))return !s.dayDone?'今天的工作還沒安排好。':s.location!=='gate'?'回守門室，把工作交給同事。':action==='handover'&&!s.handoverRead?'先把做過的事和待辦交代清楚。':null;
 if(s.day===2){
  if(action==='reviewYesterday')return s.yesterdayChecked?'昨天的工作已追蹤。':null;
  if(!s.yesterdayChecked)return '先追蹤昨天留下的事情。';
  if(s.dayDone)return '今天的安排已記下來，準備交班。';
  if(action==='requestRepair')return s.repairRequested?'已經請工程師來修。':s.location!=='engineering'?'先到工程區找工程師。':null;
  if(action==='arrangeCover')return !s.repairRequested?'先問工程師什麼時候能修。':s.coverArranged?'已有人幫你顧門。':s.location!=='gate'?'回守門室安排同事顧門。':null;
  if(action==='waitRepair')return !s.coverArranged?'先有人顧門，工程師才能停機維修。':null;
  if(action==='deferRepair')return null;
 }
 if(s.day===3){
  if(s.dayDone)return '送貨和安全安排已做好，準備交班。';
  if(action==='checkForecast')return s.forecastChecked?'已看過今天的天氣。':null;
  if(action==='callConvoy')return !s.forecastChecked?'先看今天的天氣提醒。':s.convoyCalled?'已向熟悉的聯絡人問過。':s.location!=='gate'?'到守門室使用對講機。':null;
  if(action==='inspectDrain')return !s.convoyCalled?'先問清楚送貨隊的情況。':s.drainChecked?'排水已經檢查過。':s.location!=='engineering'?'到工程區請人檢查排水。':null;
  if(['verifyRoute','postponeDelivery','acceptMessage'].includes(action))return !s.drainChecked?'先確認外面排水正常，再安排送貨。':null;
 }
 return '目前不能做這件事。';
}
function missionAct(state,action,payload={}){
 const error=can(state,action);if(error)return {state,error};
 if(action==='nextDay'){
  const fresh=createState(state.difficulty,((state.dutySeed||1)+2654435761)>>>0),history=[...(state.history||[]),{day:state.day||1,decision:state.decision||state.dayChoice,health:state.health,trust:state.trust}];
  const s={...fresh,day:(state.day||1)+1,history,events:structuredClone(state.events),inheritedJobs:structuredClone(state.inheritedJobs||[]),backlogReviewed:false,health:state.health,trust:state.trust,readerRepaired:!!state.readerRepaired,repairDeferred:!!state.repairDeferred,rosterDraft:structuredClone(state.rosterDraft),fatigue:Math.max(8,state.fatigue-10),last:'睡了一晚，起床了。今天有新的交班提醒。'};return {state:s,error:null};
 }
 if((state.day||1)===1)return firstDayAct(state,action,payload);
 if(['move','gear','eat','readRoster','note','draft'].includes(action)){
  const r=firstDayAct(state,action,payload);
  if(action==='readRoster')r.state.last=state.day===2?'上一班提醒：先追蹤昨天的箱子，再安排指紋機維修。':'上一班提醒：午後可能下大雨。送貨隊傳來改地點的消息，要再確認。';
  return r;
 }
 const s=structuredClone(state),id=dayCaseId(s),record=(type,who,text)=>log(s,id,type,who,text);
 switch(action){
  case 'sign':s.signed=true;s.time=Math.max(480,s.time);ensureEvent(s,id,s.day===2?'指紋機維修與代班':'雨天送貨安排',s.day===2?'維修／人員':'天氣／送貨');record('接班','上一班 → 玩家','已說明今天要做的事，玩家接手。');message(s,'接班完成。按今天的提醒，一件一件做。');break;
  case 'reviewYesterday':{
   s.yesterdayChecked=true;advance(s,5);const old=s.events.find(e=>e.id===CASE_ID);const choice=s.history.find(h=>h.day===1)?.decision;
   if(choice==='held'){log(s,CASE_ID,'後續','接班守門人／醫護','醫護確認這箱是託人帶來的用品。後勤點收完成，箱子已收進倉庫。');old.status='已結案';old.closed=s.time;old.closedDay=2;old.owner='後勤人員';message(s,'昨天暫存的箱子，下一班已問清楚並收下。你留下的紀錄讓他們能接著做。');}
   else if(choice==='bypassed'){log(s,CASE_ID,'後續','醫護／後勤','已補查箱子並確認來源。這次沒有發現問題，但提醒玩家下次先問清楚。');old.status='已結案';old.closed=s.time;old.closedDay=2;message(s,'醫護幫忙補問了箱子來源。這次沒有出事，但你的跳步處理仍留在紀錄裡。');}
   else if(choice==='returned')message(s,'醫護知道箱子被退回，會重新約時間送來。昨天的濾芯照常使用。');
   else message(s,'昨天的貨物已收好，紀錄完整，沒有漏下未處理的箱子。');
   record('追蹤','玩家',s.last);break;}
  case 'requestRepair':s.repairRequested=true;advance(s,4);record('安排','工程師','可以今天修，但要暫停指紋機。需要另一位守門人幫忙看著出入口。');message(s,'工程師說可以修。回守門室，先找同事幫你顧門。');break;
  case 'arrangeCover':s.coverArranged=true;advance(s,3);record('代班','資深守門人','同意在維修期間看守出入口；確認內外門關閉。');message(s,'資深守門人答應顧門，工程師開始修理。');break;
  case 'waitRepair':advance(s,18);s.readerRepaired=true;s.repairDeferred=false;markReaderFixed(s);s.dayDone=true;s.dayChoice='repaired';bump(s,4,3);record('完成','工程師／資深守門人','指紋機修好，試過數次都正常。門口有人顧，已恢復平常工作。');message(s,'指紋機修好了。工程師和幫忙顧門的同事都確認完成，接著繼續值勤到下午四點。');break;
  case 'deferRepair':s.repairDeferred=true;s.dayDone=true;s.dayChoice='deferred';advance(s,3);bump(s,-1,0);record('安排','玩家／工程師','維修留到明天。今天以眼睛掃描和預約資料確認身分，守門人已接受提醒。');message(s,'維修留到明天。這不是沒事可做，交班時要提醒下一班繼續用其他方式確認身分。');break;
  case 'checkForecast':s.forecastChecked=true;advance(s,3);record('天氣','本地氣象接收器','08:00 更新：午後可能有強降雨，山路與排水需留意。預報不是保證。');message(s,'午後可能下大雨，先問送貨隊走哪條路。');break;
  case 'callConvoy':s.convoyCalled=true;advance(s,5);record('消息','K-17 熟悉的聯絡人','收到改交貨地點的消息，但尚未確認新位置。用原本的聯絡方式回問，避免只相信代號。');message(s,'熟悉的聯絡人說，有人傳了新交貨地點。他也還沒確認，別急著派人出去。');break;
  case 'inspectDrain':s.drainChecked=true;advance(s,s.repairDeferred?20:7);if(s.repairDeferred){s.readerRepaired=true;s.repairDeferred=false;markReaderFixed(s);log(s,'EV-21260917-001','後續','工程師','先完成昨天延後的指紋機維修，再檢查排水；等待較久。');}record('檢查','工程師','排水溝清理完成，泵浦測試正常。室內維持乾燥。');message(s,'工程師確認排水正常。'+(state.repairDeferred?'他先修昨天留下的指紋機，所以這次等得比較久。':'今天沒有前一天留下的維修，檢查很快完成。'));break;
  case 'verifyRoute':advance(s,15);s.dayDone=true;s.dayChoice='verified';bump(s,3,4);record('確認','玩家／K-17 聯絡人','以原聯絡方式確認新交貨點是道路施工後的正式替代點。已約時間，收到對方同意，尚未代表貨物抵達。');message(s,'新地點問清楚了，也約好時間。下一班只要接著追蹤送貨進度。');break;
  case 'postponeDelivery':advance(s,4);s.dayDone=true;s.dayChoice='postponed';bump(s,0,2);record('安排','玩家／K-17','雙方同意延後到天氣穩定時再送。本所庫存可支應今天，明日需重新聯絡。');message(s,'對方同意延後。今天物資夠用，明天還要再聯絡。');break;
  case 'acceptMessage':advance(s,2);s.dayDone=true;s.dayChoice='unverified';bump(s,-3,-8);record('待處理','玩家','新地點未確認就安排出發。外勤發現位置不明，先停在安全處等消息；需要下一班繼續聯絡。');message(s,'外勤發現地點不清楚，先停在安全處。人沒事，但下一班多了一件急事要處理。');break;
  case 'reviewHandover':s.handoverRead=true;record('交班說明','玩家 → 接班同事','已交代完成的工作、未做完的事、負責的人及下一步。');message(s,'接班同事聽清楚，也答應接手。現在可以下班。');break;
  case 'handover':s.ended=true;{const e=s.events.find(e=>e.id===id);const pending=s.dayChoice==='deferred'||s.dayChoice==='postponed'||s.dayChoice==='unverified'||s.dayChoice==='verified';e.status=pending?'已交接／待追蹤':'已結案';e.owner=pending?'接班同事':'工程師';e.closed=pending?null:s.time;record('交班','接班同事','已接下紀錄和下一步工作，玩家可以休息。');message(s,s.day===3?'三天試玩完成。':'今天下班了，休息後再接明天的班。');}break;
  default:return {state,error:'找不到這個操作。'};
 }
 return {state:s,error:null};
}
function missionWorkflow(s){
 if((s.day||1)===1)return firstDayWorkflow(s);
 const step=(stage,text,action,panel,location)=>({stage,text,action,panel,location});
 if(s.ended)return step(4,s.day===3?'三天試玩完成，看看一路留下的紀錄。':'今天下班了，休息到明天再繼續。',null,'result');
 if(!s.gear)return step(0,'起床後先拿工作服和識別證。','gear','inventory','dorm');
 if(!s.ate)return step(0,'到餐廳吃早餐。','eat',null,'canteen');
 if(!s.rosterRead)return step(1,'先聽上一班交代，看看昨天有沒有待辦。',null,'briefing');
 if(!s.signed)return step(1,'到守門室，接下今天這一班。','sign','briefing','gate');
 if(s.dayDone)return step(3,s.handoverRead?'同事已答應接手，可以下班。':'整理做過的事和還沒做完的事，交給下一班。',null,'handover','gate');
 if(s.day===2){if(!s.yesterdayChecked)return step(2,'先追蹤昨天的箱子，別讓紀錄停在昨天。','reviewYesterday',null,'gate');if(!s.repairRequested)return step(2,'到工程區，問工程師今天能不能修指紋機。','requestRepair',null,'engineering');if(!s.coverArranged)return step(2,'回守門室，請同事在維修時幫忙顧門。','arrangeCover',null,'gate');return step(2,'有人顧門了，等工程師修好並試用。','waitRepair');}
 if(!s.forecastChecked)return step(2,'先看看今天的天氣提醒。','checkForecast');if(!s.convoyCalled)return step(2,'有人說交貨地點改了。用原本的聯絡方式再問一次。','callConvoy',null,'gate');if(!s.drainChecked)return step(2,'到工程區，請人確認排水和泵浦正常。','inspectDrain',null,'engineering');return step(2,s.location==='gate'?'送貨地點還沒確認。決定再問一次，或和對方改天送。':'回守門室，決定今天怎麼安排送貨。',null,'terminal','gate');
}
export function outcome(s){
 if((s.day||1)===1)return firstDayOutcome(s);
 const names={repaired:'分工完成維修',deferred:'維修留到明天',verified:'問清楚再安排',postponed:'雙方同意延後',unverified:'多了一件待處理的事'};
 return {title:names[s.dayChoice]||'尚未完成',threshold:DIFFICULTIES[s.difficulty].threshold,passed:s.health>=DIFFICULTIES[s.difficulty].threshold&&s.trust>=DIFFICULTIES[s.difficulty].threshold,lesson:({repaired:'工程師修理、同事顧門，工作有分工，也有試過是否修好。',deferred:'維修已排到明天，沒有假裝機器沒問題。下一班知道要用其他方式確認身分。',verified:'你問清楚新地點，也確認雙方同意。下一班可以照紀錄繼續追蹤送貨。',postponed:'你和對方約好延後，今天的庫存足夠，但明天仍要重新聯絡。',unverified:'外勤停在安全處等消息。沒有憑空發生傷亡，但下一班多了急需確認的路線。'}[s.dayChoice]||s.last)};
}

function markReaderFixed(s){for(const id of [ROUTINE_ID,'EV-21260917-001']){const e=s.events.find(e=>e.id===id);if(e){e.status='已結案';e.closed=s.time;e.closedDay=s.day;e.owner='工程師';}}const routine=s.events.find(e=>e.id===ROUTINE_ID);if(routine)log(s,ROUTINE_ID,'完成','工程師','指紋機已修好並試用正常，原報修紀錄完成。');}

export const SHIFT_END=960;
export function mainWorkDone(s){return !!s.signed&&!(s.inheritedJobs||[]).some(j=>j.status==='待安排')&&((s.day||1)===1?!!s.standardReceived&&!!s.decision&&s.delegateDue===null&&s.outerGate==='closed':!!s.dayDone);}
function randomDuty(s){s.dutySeed=(Math.imul(s.dutySeed||1,1664525)+1013904223)>>>0;return s.dutySeed/4294967296;}
function scheduleDuty(s,first=false){const at=s.time+(first?20+Math.floor(randomDuty(s)*26):48+Math.floor(randomDuty(s)*33));s.nextIncidentAt=at<=930&&(s.dutyHandled||[]).length<5?at:null;}
function startStandby(s){if(mainWorkDone(s)&&!s.ended&&!s.standbyStarted){s.standbyStarted=true;s.standbyPaused=false;s.dutyHandled=s.dutyHandled||[];scheduleDuty(s,true);if(s.time<SHIFT_END)s.last='主要工作已安排好。接著繼續待命，時鐘每秒走一分鐘，到下午四點再交班。';}}
function incidentId(s){return `EV-212609${15+(s.day||1)}-D${String((s.dutyHandled||[]).length+1).padStart(2,'0')}`;}
function triggerIncident(s){const seen=new Set((s.dutyHandled||[]).map(x=>x.key));const pool=DUTY_EVENTS.filter(x=>!seen.has(x.key));if(!pool.length){s.nextIncidentAt=null;return;}const event=pool[Math.floor(randomDuty(s)*pool.length)];const id=incidentId(s);s.activeIncident={key:event.key,id,opened:s.time};s.nextIncidentAt=null;ensureEvent(s,id,event.title,'待命事件');log(s,id,'通知',event.from,event.text);s.last=`${event.from}：${event.title}。時鐘已暫停，先回應這件事。`;}
function finishDutyJob(s){const job=s.dutyJob,definition=DUTY_EVENTS.find(e=>e.key===job.key),choice=definition.choices[job.choice];log(s,job.id,'回報',choice.actor,choice.reply,job.due);const e=s.events.find(e=>e.id===job.id);e.status=choice.pending?'已安排／待追蹤':'已結案';e.owner=choice.pending?'接班同事':choice.actor;e.closed=choice.pending?null:job.due;e.closedDay=s.day||1;bump(s,choice.health,choice.trust);s.last=choice.reply;s.dutyJob=null;}
function processDuty(s){processInitialWork(s);if(s.ended||!mainWorkDone(s))return;if(s.dutyJob&&s.time>=s.dutyJob.due)finishDutyJob(s);if(!s.dutyJob&&!s.activeIncident&&s.nextIncidentAt!==null&&s.time>=s.nextIncidentAt){if(s.time<=930)triggerIncident(s);else s.nextIncidentAt=null;}}
export function can(s,action){
 if(action==='rest')return !s.ended?'先完成交班，再休息。':s.resting?'已經在休息。':(s.day||1)>=3?'三天試玩已完成。':null;
 if(action==='readBacklog')return s.ended?'本班已結束，可查看但不用重新確認。':null;
 if(action==='assignInherited')return s.ended?'本班已結束。':!s.signed?'先接下這一班，再安排人手。':s.activeIncident?'先回應剛才的狀況。':null;
 if(action==='tick')return s.ended?'今天已下班。':!mainWorkDone(s)?'先處理眼前的工作。':s.standbyPaused?'時鐘已暫停。':s.activeIncident?'先回應剛發生的事。':s.time>=SHIFT_END?'已到交班時間。':null;
 if(action==='toggleStandby')return !mainWorkDone(s)||s.ended||s.time>=SHIFT_END?'目前沒有在待命。':s.activeIncident?'事件處理完才會繼續走時鐘。':null;
 if(action==='respondIncident')return !s.activeIncident?'目前沒有需要回應的新狀況。':null;
 if(action==='wait'&&mainWorkDone(s))return '工作已安排好，待命時鐘會自動前進，不需要再跳時間。';
 if(mainWorkDone(s)&&!s.ended&&s.time<SHIFT_END&&!['tick','toggleStandby','respondIncident','readBacklog','assignInherited','move','note','draft','reviewHandover','handover'].includes(action))return '主要工作已安排好。現在繼續待命，有新狀況時再處理。';
 if(['reviewHandover','handover'].includes(action)){
  const missionReason=missionCan(s,action);if(missionReason)return missionReason;
  if(s.time<SHIFT_END)return `還沒到下班時間。現在 ${timeText(s.time)}，下午四點才能交班。`;
  if(s.activeIncident)return '先回應正在發生的事，再交班。';
  if(s.dutyJob)return '同事還在處理，等回報後再交班。';
 }
 if(s.activeIncident&&!['respondIncident','readBacklog','note','draft','nextDay'].includes(action))return '先回應剛發生的狀況；可以打開事件簿查看資料。';
 return missionCan(s,action);
}
export function act(state,action,payload={}){
 const reason=can(state,action);if(reason)return {state,error:reason};
 if(action==='rest'){const s=structuredClone(state);s.resting=true;s.location='dorm';s.time=1230;s.last='20:30。晚餐後回到寢室，夜班已接手。睡前可以看看公共區域，準備好就休息。';processInitialWork(s);return {state:s,error:null};}
 if(action==='move'&&mainWorkDone(state)&&state.time<SHIFT_END){if(!['dorm','canteen','gate','engineering'].includes(payload.location))return {state,error:'未知地點。'};const s=structuredClone(state);s.location=payload.location;s.last='換個位置查看。對講機保持聯絡，值勤時鐘不會因切換場景而跳時間。';return {state:s,error:null};}
 if(action==='readBacklog'){const s=structuredClone(state);s.backlogReviewed=true;s.last='已看過上一班留下的工作。接班後先安排待辦，同事正在做的事不用重派。';return {state:s,error:null};}
 if(action==='assignInherited'){return assignInitialWork(state,payload);}
 if(action==='tick'){
  const s=structuredClone(state);startStandby(s);advance(s,1);
  processDuty(s);
  if(s.time===SHIFT_END&&!s.activeIncident&&!s.dutyJob)s.last='下午四點了。接班同事已到，現在可以整理紀錄、交代工作。';
  return {state:s,error:null};
 }
 if(action==='toggleStandby'){const s=structuredClone(state);s.standbyPaused=!s.standbyPaused;s.last=s.standbyPaused?'時鐘已暫停，準備好可以繼續。':'繼續待命，每秒推進遊戲內一分鐘。';return {state:s,error:null};}
 if(action==='respondIncident'){
  const s=structuredClone(state),incident=s.activeIncident,definition=DUTY_EVENTS.find(e=>e.key===incident.key),index=Number(payload.choice),choice=definition?.choices[index];if(!choice)return {state,error:'請選擇一個處理方式。'};
  log(s,incident.id,'安排','玩家',choice.label);const event=s.events.find(e=>e.id===incident.id);event.owner=choice.actor;event.status='處理中';s.dutyHandled.push({key:incident.key,id:incident.id,choice:index,time:s.time});s.activeIncident=null;s.dutyJob={key:incident.key,id:incident.id,choice:index,due:Math.min(SHIFT_END,s.time+choice.minutes)};scheduleDuty(s);s.last=`已請${choice.actor}處理，大約 ${choice.minutes} 分鐘後回覆。時鐘繼續前進。`;processDuty(s);return {state:s,error:null};
 }
 const result=missionAct(state,action,payload);if(!result.error){startStandby(result.state);processDuty(result.state);}return result;
}
export function workflow(s){
 if(!s.ended&&!s.activeIncident&&s.signed&&(s.inheritedJobs||[]).some(j=>j.status==='待安排'))return {stage:2,text:'先安排上一班留下的待辦；同事已經在做的工作，不用你全部接手。',panel:'workboard'};
 if(!s.ended&&s.activeIncident)return {stage:2,text:'有新的狀況需要回應，時鐘先停在這裡。',panel:'incident'};
 if(!s.ended&&mainWorkDone(s)&&s.time<SHIFT_END)return {stage:2,text:s.standbyPaused?'待命時鐘已暫停。準備好後可繼續。':s.dutyJob?'同事正在處理剛才的事，等回報時也要繼續顧門。':`主要工作已安排好，繼續值勤到 16:00。現在 ${timeText(s.time)}。`,panel:'standby'};
 return missionWorkflow(s);
}

function processInitialWork(s){
 const now=((s.day||1)-1)*1440+s.time;
 for(const job of s.inheritedJobs||[]){
  const e=s.events.find(e=>e.id===job.id);if(!e)continue;
  if(job.status==='處理中'&&job.due!=null&&now>=((job.dueDay||1)-1)*1440+job.due){
   job.status='已完成';job.progress=job.reply;job.next='已完成，可查看處理紀錄。';e.status='已結案';e.owner=job.owner;e.closed=job.due;e.closedDay=job.dueDay||1;e.entries.push({id:job.id+'-'+(e.entries.length+1),day:job.dueDay||1,time:job.due,type:'完成回報',actor:job.owner,text:job.reply});s.last=`${job.owner}回報：${job.reply}`;
  }
  if(job.status==='待安排'&&job.deadline!=null&&now>((job.deadlineDay||1)-1)*1440+job.deadline&&!job.overdue){job.overdue=true;e.entries.push({id:job.id+'-'+(e.entries.length+1),day:s.day||1,time:s.time,type:'提醒',actor:'交班紀錄',text:'超過原訂安排時間，請接班人說明後續；不自動假定設備失效。'});}
 }
}
function assignInitialWork(state,payload){
 const s=structuredClone(state),job=(s.inheritedJobs||[]).find(j=>j.id===payload.id),index=Number(payload.choice),choice=job?.options?.[index];
 if(!job||job.status!=='待安排'||!choice)return {state,error:'這件工作已有人處理，或選項不正確。'};
 const e=s.events.find(e=>e.id===job.id);if(!e)return {state,error:'找不到這件工作的紀錄。'};
 const eta=assignmentEta(s,choice);job.owner=choice.actor;job.status=choice.pending?'已安排／待追蹤':'處理中';job.progress=choice.label+(eta.queued?'；負責人先完成手上的工作，再接這一件。':'');job.next=choice.pending?'物品繼續保管，接班同事追蹤本人確認。':`等${choice.actor}回報，不必重派。`;job.reply=choice.reply;job.due=choice.pending?null:eta.due;job.dueDay=s.day||1;e.owner=choice.actor;e.status=job.status;e.entries.push({id:job.id+'-'+(e.entries.length+1),day:s.day||1,time:s.time,type:'接手安排',actor:'玩家 → '+choice.actor,text:choice.label+'。'+job.next});s.last=choice.pending?'保管位置和後續責任已交代清楚。':`已請${choice.actor}處理，預計 ${timeText(job.due)} 回報。${eta.queued?'他手上已有工作，這件會接著做。':''}`;
 startStandby(s);processInitialWork(s);return {state:s,error:null};
}
