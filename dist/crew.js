// Stable individuals from the six-person exploration board. Names remain unassigned.
export const CREW=[
 {id:'P01',label:'守門人',post:'gate',position:'守門控制室',x:'7%',skill:'門禁、接待、代班',aliases:/守門|門口|代理/,domain:'access'},
 {id:'P02',label:'工程師',post:'engineering',position:'工程維護區',x:'26%',skill:'供電、淨水、門機',aliases:/工程|技師|能源/,domain:'power'},
 {id:'P03',label:'醫護',post:'medical',position:'醫療工作室',x:'43%',y:'20%',skill:'照護、用品、防護',aliases:/醫療|醫護/,domain:'care'},
 {id:'P04',label:'後勤',post:'supplies',position:'物資倉儲',x:'60%',y:'26%',skill:'點貨、保存、配給',aliases:/後勤/,domain:'food'},
 {id:'P05',label:'外勤通訊',post:'power',position:'能源通訊室',x:'76%',skill:'通訊、聯絡、巡檢',aliases:/通訊|巡檢|無線電/,domain:'signal'},
 {id:'P06',label:'居民代表',post:'canteen',position:'公共餐廳',x:'94%',skill:'居民協調、休息安排',aliases:/居民|生活區|動物照護/,domain:'care'}
];
export function crewParticipants(actor,lead){return [...new Set([lead,...CREW.filter(p=>p.aliases.test(actor||'')).map(p=>p.id)].filter(Boolean))];}
export const crewById=id=>CREW.find(p=>p.id===id);
export const crewName=id=>{const p=crewById(id);return p?`${p.label} ${p.id}`:'值班同事';};
export const EVENT_DOMAINS={drain:'water',rest:'care',radio:'signal',meal:'food',motor:'access',parcel:'food','cold-store':'food','water-reading':'water','camera-link':'signal','battery-warm':'power','unbooked-visitor':'access','outside-dog':'care','ppe-seal':'care','sleep-distress':'care','ration-argument':'food','uplink-noise':'signal'};
export const EVENT_OWNERS={drain:'P02',rest:'P03',radio:'P05',meal:'P04',motor:'P02',parcel:'P04','cold-store':'P04','water-reading':'P02','camera-link':'P02','battery-warm':'P02','unbooked-visitor':'P01','outside-dog':'P06','ppe-seal':'P03','sleep-distress':'P03','ration-argument':'P06','uplink-noise':'P05'};
export const absolute=s=>((s.day||1)-1)*1440+s.time;
export function crewAvailable(s,id,exclude=null){const p=crewById(id);let at=absolute(s);if(!p)return at;for(const j of s.inheritedJobs||[])if(j.status==='處理中'&&j.due!=null&&p.aliases.test(j.owner))at=Math.max(at,((j.dueDay||1)-1)*1440+j.due);if(s.dutyJob&&s.dutyJob.id!==exclude&&(s.dutyJob.ownerId===id||s.dutyJob.participants?.includes(id)||p.aliases.test(s.dutyJob.owner||'')))at=Math.max(at,((s.day||1)-1)*1440+s.dutyJob.due);if(s.traceWork&&s.traceWork.ownerId===id&&s.traceWork.id!==exclude)at=Math.max(at,s.traceWork.due);return at;}
export function crewPosts(s){const now=absolute(s),jobLocation={'water-check':'engineering','medical-stock':'medical','antenna-test':'power','backup-light':'gate','radio-battery':'supplies','tool-receipt':'supplies'},dutyLocation={drain:'engineering',rest:'dorm',radio:'power',meal:'canteen',motor:'gate',parcel:'supplies','cold-store':'canteen','water-reading':'engineering','camera-link':'engineering','battery-warm':'power','unbooked-visitor':'gate','outside-dog':'gate','ppe-seal':'isolation','sleep-distress':'dorm','ration-argument':'canteen','uplink-noise':'power'};
 return CREW.map(p=>{const duty=(s.dutyJob?.ownerId===p.id||s.dutyJob?.participants?.includes(p.id))?s.dutyJob:null,trace=s.traceWork?.ownerId===p.id?s.traceWork:null,jobs=(s.inheritedJobs||[]).filter(j=>j.status==='處理中'&&p.aliases.test(j.owner)).sort((a,b)=>((a.dueDay||1)-(b.dueDay||1))*1440+a.due-b.due),job=jobs.find(j=>(j.dueDay||1)<=(s.day||1)&&(!j.start||j.start<=now)),activeDuty=duty&&(!duty.start||duty.start<=now)?duty:null,activeTrace=trace&&(!trace.start||trace.start<=now)?trace:null,active=activeDuty||activeTrace||job,queued=!activeDuty&&duty?duty:!activeTrace&&trace?trace:jobs.find(j=>(j.dueDay||1)>(s.day||1)||j.start>now);let location=p.post,title=p.skill,due=null;
 if(activeDuty){location=activeDuty.key==='rest'&&p.id==='P01'?'gate':dutyLocation[activeDuty.key]||p.post;title=s.events.find(e=>e.id===activeDuty.id)?.title||'處理職務狀況';due=((s.day||1)-1)*1440+activeDuty.due;}
 else if(activeTrace){location=(s.investigations||[]).find(q=>q.id===trace.id)?.site||p.post;title='複查玩家指出的紀錄差異';due=trace.due;}
 else if(job){location=job.key==='rest'&&p.id==='P01'?'gate':jobLocation[job.key]||dutyLocation[job.key]||p.post;title=job.title;due=((job.dueDay||1)-1)*1440+job.due;}
 if(queued){const next=s.events.find(e=>e.id===queued.id)?.title||queued.title||'複查工作';title=active?title+'；接續：'+next:'排隊接手：'+next;if(due==null)due=queued===duty?((s.day||1)-1)*1440+duty.due:queued===trace?trace.due:((queued.dueDay||1)-1)*1440+queued.due;}
 return {...p,location,status:active?'工作中':queued?'排隊接手':'崗位待命',task:title,due,eventId:active?.id||queued?.id||null};});}
export function autoDecision(s,event){const ownerId=EVENT_OWNERS[event.key]||'P01',p=crewById(ownerId),n=s.world?.resources?.[EVENT_DOMAINS[event.key]||p.domain]??80;let reason='依原有分工與標準處理，完成後由負責人回報。';let player=false;
 if(event.key==='uplink-noise'){player=true;reason='外部消息與原約定有落差，改外勤安排超出單一值班人的權限。';}
 if(event.key==='unbooked-visitor'&&s.trust<75){player=true;reason='居民聯絡與未預約接待需要共同協調，守門人先維持外側等候。';}
 if(event.key==='water-reading'&&n<76){player=true;reason='淨水與備援安排餘裕偏低，需要協調工程、醫護與後勤。';}
 let choice=n<76?1:0;if(event.key==='meal'&&n<76){choice=0;reason='可發物資餘裕偏低，先對領餐紀錄，避免直接多用備料。';}if(!player&&choice===1)reason='目前工作餘裕不足；先採保管、停用或延後的安全安排，再交接追查。';
 return {ownerId,owner:crewName(ownerId),choice,player,reason};}
