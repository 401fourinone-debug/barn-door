export const VERSION = 1;
export const DIFFICULTIES = {easy:{name:'容易',threshold:60,initial:87,review:12},normal:{name:'中等',threshold:75,initial:82,review:16},hard:{name:'最難',threshold:90,initial:78,review:24}};
export const CASE_ID = 'EV-21260916-004';
export const ROUTINE_ID = 'EV-21260916-003';
export const timeText = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
export function createState(difficulty='normal') {
  if (!DIFFICULTIES[difficulty]) difficulty='normal';
  return {version:VERSION,difficulty,time:410,location:'dorm',health:DIFFICULTIES[difficulty].initial,trust:78,stamina:84,fatigue:22,pressure:12,gear:false,ate:false,rosterRead:false,signed:false,readerChecked:false,readerClean:false,arrived:false,idChecked:false,manifestChecked:false,claimHeard:false,held:false,standardReceived:false,medicalRequested:false,medicalDue:null,medicalReviewed:false,delegated:false,delegateDue:null,decision:null,innerGate:'closed',outerGate:'closed',gateDue:null,ended:false,events:[],rosterDraft:{gate:'資深守門人',engineering:'工程師',medical:'醫療負責人',logistics:'後勤人員'},flags:[],last:'你在普通的九月早晨醒來。通風正常，早餐供應中。'};
}
export function caseEvent(s){return s.events.find(e=>e.id===CASE_ID);}
function ensureEvent(s,id,title,category){let e=s.events.find(e=>e.id===id);if(!e){e={id,title,category,opened:s.time,status:'查核中',owner:'玩家',closed:null,entries:[],attachments:[]};s.events.push(e);}return e;}
function log(s,id,type,actor,text,at=s.time){const e=s.events.find(e=>e.id===id);if(e){e.entries.push({id:`${id}-${e.entries.length+1}`,time:at,type,actor,text});e.entries.sort((a,b)=>a.time-b.time);}}
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
export function can(s,action){
  if(s.ended)return '本次試玩已結束，請重新開始或查看紀錄。';
  const gateActions=['inspectReader','cleanReader','arrivals','checkId','manifest','visitor','hold','callMedical','receiveStandard','approve','return','delegate','bypass','closeOuter','handover'];
  if(gateActions.includes(action)&&s.location!=='gate')return '請先前往門禁控制室。';
  if(action==='gear')return s.gear?'已取得工作裝備。':null;
  if(action==='eat')return s.ate?'本班餐點已領取，無需重複領餐。':s.location!=='canteen'?'請先前往餐廳。':null;
  if(action==='readRoster')return s.rosterRead?'交班事項已閱讀。':null;
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
  if(action==='handover')return !s.standardReceived?'預約濾芯尚未接收，請處理或委派。':!s.decision&&!s.held?'請決定額外箱的處置，或留置並交班。':s.delegateDue!==null?'代理仍在處理，先等待完成回報。':s.outerGate!=='closed'?'外門尚未確認關閉，不能完成交班。':null;
  if(action==='wait')return !s.signed?'完成接班後才能跳至下一工作事項。':null;
  return null;
}
export function act(state,action,payload={}){
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
    case 'checkId':s.idChecked=true;advance(s,3);log(s,CASE_ID,'查核','玩家','虹膜及預約核驗碼相符；指紋不可讀已連結設備工單。以交叉證據完成本次身分覆核，未據此判定健康。');evidence(s,'E01','身分交叉核驗','本地預約快取／虹膜比對','兩名訪客與預約紀錄及既有聯絡核驗碼相符。指紋不可讀是待查項，未直接判定冒名。此結論不代表醫療健康通過。');message(s,'身分交叉核驗完成。讀取器異常與健康狀態分開紀錄。');break;
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
    case 'handover':{if(!s.decision){s.decision='held';log(s,CASE_ID,'交接','玩家 → 接班守門人','H02 留置箱未結案；接班人接受追蹤醫療覆核與驗收。');bump(s,1,3);}const e=caseEvent(s);if(s.decision==='held'){e.status='已交接／待覆核';e.owner='接班守門人';}else{e.status=s.decision==='bypassed'?'已交接／程序待查':'已結案';e.closed=s.decision==='bypassed'?null:960;if(s.decision==='bypassed')e.owner='接班守門人／覆核人';}s.time=960;log(s,CASE_ID,'交接','接班守門人','門位正常，已接收本班紀錄及待辦；控制權交接完成。');s.ended=true;message(s,'交班完成。你可以離開崗位，今天的工作有人接手了。');break;}
    default:return {state,error:'未知操作。'};
  }
  return {state:s,error:null};
}
export function objective(s){if(s.ended)return '本班已交接，查看首日回顧。';if(!s.gear)return '打開置物櫃，取得識別證與工作裝備。';if(!s.ate)return '前往餐廳吃早餐，再查看工作名冊。';if(!s.rosterRead)return '閱讀工作名冊中的交班事項。';if(!s.signed)return '前往門禁控制室，確認接班。';if(!s.readerChecked)return '檢查指紋讀取器，留下設備紀錄。';if(!s.arrived)return '準備好後，等候 09:10 的交換隊。';if(s.delegated&&s.delegateDue)return '代理已接手，可等候回報或前往其他區域。';if(!s.manifestChecked||!s.idChecked)return '核對訪客身分與預約貨單。';if(!s.decision&&!s.held)return '決定額外箱的查核與處置方式。';if(!s.standardReceived)return '完成六支預約濾芯的接收。';if(s.outerGate!=='closed')return '等待門位回報，確認外門關閉。';return '查閱事件紀錄，準備向接班人交班。';}
export function outcome(s){const names={approved:'查核後接收',returned:'依程序退回',delegated:'協作完成',held:'留置並交接',bypassed:'未核驗放行'};return {title:names[s.decision]||'尚未完成',threshold:DIFFICULTIES[s.difficulty].threshold,passed:s.health>=DIFFICULTIES[s.difficulty].threshold&&s.trust>=DIFFICULTIES[s.difficulty].threshold,lesson:{approved:'你取得證據、完成授權與驗收。額外耗材可使用，未登記的原因也有紀錄。',returned:'你維持入區程序，也承擔醫療耗材延後的代價。這是可行選擇，並非隱藏錯誤答案。',delegated:'你把責任交給有能力的人，並取得可查核回報。庇護所不需要你親自完成每個步驟。',held:'事情尚未結案，但物資保管、承辦人與後續責任清楚。未完成事項也能負責任地交接。',bypassed:'沒有憑空發生感染，但你跳過查核的事實會影響信任，並成為後續待查事項。'}[s.decision]||''};}
export function restoreState(raw){try{const s=JSON.parse(raw);if(s.version!==VERSION||!DIFFICULTIES[s.difficulty]||!Array.isArray(s.events)||!Number.isFinite(s.time)||!['dorm','canteen','gate','engineering'].includes(s.location))return null;return {...createState(s.difficulty),...s};}catch{return null;}}
