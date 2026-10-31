export const OPENING_LOAD={easy:{pending:1,working:1},normal:{pending:2,working:2},hard:{pending:3,working:3}};
const pending=[
 {key:'radio-battery',title:'交班用對講機電池需要更換',owner:'接班守門人',priority:'上午優先',progress:'夜班已測出電池續航偏短，備用機可用。等接班人安排更換。',next:'選擇誰來換電池，避免對講機在值勤時沒電。',deadline:720,options:[{label:'請後勤換好電池並測試',actor:'後勤',minutes:20,reply:'後勤換好電池並測試通話正常，備用機也已充電。'},{label:'先領備用機，請同事處理原機',actor:'後勤／守門同事',minutes:8,reply:'備用對講機已領用，原機電池也完成更換及測試。'}]},
 {key:'backup-light',title:'外門旁的備用照明還沒測完',owner:'接班守門人',priority:'上午內安排',progress:'燈具已裝好，夜班只完成外觀檢查，還沒試備援供電。',next:'找有空的人完成試亮，門口仍要有人照看。',deadline:780,options:[{label:'請工程師試備援供電',actor:'工程師',minutes:30,reply:'工程師試過備援照明，切換正常，測試期間門口有人看守。'},{label:'請資深守門人和工程師一起測',actor:'資深守門人／工程師',minutes:18,reply:'兩人完成試亮及門口照看，備用照明正常。'}]},
 {key:'tool-receipt',title:'工具包代領單還缺本人確認',owner:'接班守門人',priority:'午前確認',progress:'工具包在後勤櫃，夜班已記下代領人的資料，沒有先交出去。',next:'請人聯絡寄放者，或明確保管並交下一班追蹤。',deadline:660,options:[{label:'請後勤聯絡寄放的人',actor:'後勤',minutes:25,reply:'後勤聯絡到寄放人，確認代領，記下領取人後交還工具包。'},{label:'先保管，寫清楚交下一班追蹤',actor:'後勤／接班同事',minutes:0,pending:true,reply:'工具包由後勤保管，待寄放人確認；下一班已列入追蹤事項。'}]}
];
const working=[
 {key:'water-check',title:'淨水設備換濾網後觀察中',owner:'工程師',priority:'同事處理中',progress:'昨晚已換好濾網，持續觀察水壓，等工程師今早確認。',next:'工程師會自行回報，不必重派工作。',due:560,reply:'工程師確認水壓穩定，換濾網後的觀察完成。'},
 {key:'medical-stock',title:'醫療用品盤點還在核對',owner:'醫護／後勤',priority:'同事處理中',progress:'昨晚已清點大部分庫存，還在核對兩張領用單。',next:'醫護與後勤會把結果補進紀錄。',due:600,reply:'醫護與後勤對完領用單，數量一致，盤點完成。'},
 {key:'antenna-test',title:'外部通訊天線例行測試',owner:'通訊同事',priority:'同事處理中',progress:'夜班已檢查線路，今早等待對方窗口配合測試。內部對講不受影響。',next:'通訊同事會在測試後回報。',due:630,reply:'通訊同事與原聯絡窗口完成測試，外部通訊正常。'}
];
export function createInitialWork(difficulty){
 const load=OPENING_LOAD[difficulty]||OPENING_LOAD.normal;
 const jobs=[...pending.slice(0,load.pending).map((x,i)=>({...structuredClone(x),status:'待安排',needsPlayer:true,deadline:difficulty==='hard'?570+i*15:x.deadline,deadlineDay:1})),...working.slice(0,load.working).map(x=>({...structuredClone(x),status:'處理中',needsPlayer:false,dueDay:1}))];
 const events=jobs.map((job,i)=>{job.id=`EV-21260915-${String(21+i).padStart(3,'0')}`;const at=job.needsPlayer?1300:1330;return {id:job.id,title:job.title,category:'交接待辦',origin:'inherited',opened:at,openedDay:0,status:job.status,owner:job.owner,closed:null,entries:[{id:job.id+'-1',day:0,time:at,type:'夜班紀錄',actor:job.needsPlayer?'夜班守門人':job.owner,text:job.progress},{id:job.id+'-2',day:1,time:390,type:'交班提醒',actor:'夜班守門人',text:job.next}],attachments:[]};});
 for(const [i,title,actor,text] of [[1,'昨日儲水量檢查','工程師','昨日檢查儲水量與泵浦，結果正常。'],[2,'夜班餐點已備好','後勤','餐點已留足，領用紀錄已交給早班。']]){const id=`EV-21260915-H0${i}`;events.push({id,title,category:'例行紀錄',origin:'inherited',opened:1080+i*20,openedDay:0,status:'已結案',owner:actor,closed:1100+i*20,closedDay:0,entries:[{id:id+'-1',day:0,time:1100+i*20,type:'完成',actor,text}],attachments:[]});}
 return {jobs,events};
}
export function assignmentEta(s,choice){const day=s.day||1,now=(day-1)*1440+s.time,resources=new Set(choice.actor.split('／'));let start=now;for(const job of s.inheritedJobs||[])if(job.status==='處理中'&&job.owner.split('／').some(actor=>resources.has(actor))&&job.due!=null)start=Math.max(start,((job.dueDay||1)-1)*1440+job.due);return {due:start-(day-1)*1440+choice.minutes,queued:start>now};}
