import {roleOf,roleTasks,roleEventId} from './roles.js?v=10c';
import {can,timeText,outcome} from './engine.js?v=10c';
import {YEAR_DAYS} from './calendar.js?v=10c';
const names={dorm:'寢室',canteen:'餐廳',gate:'守門室',engineering:'工程區',medical:'醫療工作室',supplies:'物資倉儲',isolation:'隔離接待室',power:'能源通訊室'};
const move=(location,label)=>`<button class="primary" data-move="${location}">${label||'前往'+names[location]+' →'}</button>`;
export function rolePanel(panel,s,{header,c,b,ui,esc}){
 const role=roleOf(s),tasks=roleTasks(s),task=tasks[s.roleStep||0];
 if(panel==='briefing'){
  header(role.name+'的上班提醒','DUTY / DAY '+s.day);
  c.innerHTML=`<p class="lead">${esc(role.previous)}交代：${esc(role.summary)}</p><ol class="briefing-list">${tasks.map(t=>`<li><strong>${esc(t.title)}</strong><span>${esc(t.text)} 地點：${names[t.location]}。</span></li>`).join('')}</ol><p class="notice">前班未完成的紀錄仍保留在事件簿，不會因為換了班就當作完成。</p><div class="dialog-actions">${!s.backlogReviewed?ui('先看上一班留下的工作','workboard','primary'):!s.rosterRead&&!can(s,'readRoster')?b('我看清楚了，接手這份工作 · 2 分鐘','readRoster','primary'):!s.rosterRead?`<p class="notice">${esc(can(s,'readRoster'))}</p>`:!s.signed?s.location===role.home?b('接下'+role.name+'這一班 · 08:00','sign','primary'):move(role.home):ui('繼續本職務的工作','roleWork','primary')}</div>`;return;
 }
 if(panel==='work'){
  header(role.name+'今天的工作','WORK / '+(Math.min(3,(s.roleStep||0)+1))+' OF 3');
  if(!s.signed){c.innerHTML='<p class="lead">先吃早餐、看交接提醒，再接下本職務的班。</p>'+ui('看本職務上班提醒','briefing','primary');return;}
  if(!task||s.dayDone){c.innerHTML='<p class="lead">今天的三項主要工作已作安排。還沒到下班時間，繼續待命與同事保持聯絡。</p>'+ui('查看待命狀況','standby','primary');return;}
  c.innerHTML=`<p class="role-identity">目前身分：${role.name} · 其他職務由同事負責</p><h3 class="work-step-title">${esc(task.title)}</h3><p class="spoken">${esc(task.text)}</p><p class="lead">地點：${names[task.location]}。主線操作按列出的工作分鐘推進；待命才是每秒一分鐘。</p>${s.location!==task.location?move(task.location):`${task.earliest&&s.time<task.earliest?'<p class="notice">預約時間09:10。先等守門同事回報，再處理這一項。主線等待會推進到約定時間。</p><button class="primary" data-action="roleWait">等到09:10的到貨回報</button>':'<div class="choices">'+task.choices.map((choice,i)=>`<button class="${i===0?'primary':'secondary'}" data-action="roleTask" data-step="${s.roleStep||0}" data-choice="${i}">${esc(choice.label)}<small>工作約 ${choice.minutes} 分鐘</small></button>`).join('')+'</div>'}`}<div class="notice">守門、醫療與工程的專業確認各由負責同事處理，按下安排不代表你取得其他職務的控制權。</div>${ui('查看工作紀錄','journal')}`;return;
 }
 if(panel==='handover'){
  header(role.name+'交班','SHIFT HANDOVER');const reason=can(s,s.handoverRead?'handover':'reviewHandover');
  c.innerHTML=`<p class="lead">交給${role.team}：現在 ${timeText(s.time)}，交班時間16:00。</p><ol class="briefing-list">${(s.roleChoices||[]).map(x=>`<li><strong>${esc(x.title)} · ${x.pending?'仍待追蹤':'已完成'}</strong><span>${esc(x.reply)} 負責：${esc(x.pending?role.team:x.actor)}。</span></li>`).join('')}</ol>${reason?'<div class="notice">'+esc(reason)+'</div>':''}<div class="dialog-actions">${!reason?b(s.handoverRead?'確認下班':'交代給'+role.team,s.handoverRead?'handover':'reviewHandover','primary'):s.location!==role.home?move(role.home):ui('回去繼續待命','standby','primary')}${ui('查看事件簿','journal')}</div>`;return;
 }
 if(panel==='result'){
  header(s.day>=YEAR_DAYS?'一年期滿':role.name+'，第'+s.day+'天下班了','SHIFT RESULT');const o=outcome(s),history=[...(s.history||[]),{day:s.day,decision:s.dayChoice}];
  c.innerHTML=`<p class="result-title">${role.name}的交接紀錄</p><p class="lead">${esc(o.lesson)}</p><div class="result-metrics"><div><label>庇護所健全度</label><strong>${s.health}</strong><small>/100</small></div><div><label>大家對你的信任</label><strong>${s.trust}</strong><small>/100</small></div></div><ul class="result-list">${history.slice(-7).map(h=>`<li>第${h.day}天：${esc(h.decision)}</li>`).join('')}</ul><div class="notice">待追蹤事項仍在原紀錄中。休息後會帶到隔天。</div><div class="dialog-actions">${s.day<YEAR_DAYS?b('休息，繼續第'+(s.day+1)+'天','nextDay','primary'):ui('選其他身分重玩','reset','primary')}${ui('查看事件簿','journal')}<button class="secondary" data-export="session">下載這次紀錄</button></div>`;
 }
}
