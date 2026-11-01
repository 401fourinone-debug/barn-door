import {crewName,EVENT_OWNERS} from './crew.js?v=09c';
import {workDelay} from './living-world.js?v=09c';
import {SHIFT_END,mainWorkDone,timeText,incidentPlan} from './engine.js?v=09c';
import {DUTY_EVENTS} from './duty-events.js?v=09c';
export function dutyPanel(s,{header,c,b,ui,esc}){
 if(s.activeIncident){incidentPanel(s,{header,c,b,ui,esc});return;}
 header('工作做好後，繼續顧好這一班','ON DUTY / UNTIL 16:00');
 const remaining=Math.max(0,SHIFT_END-s.time);
 c.innerHTML=`<p class="lead">主要工作已安排好，但還沒到下班時間。接下來照常待命，有事情會透過對講機通知你。</p><div class="duty-time"><strong>${timeText(s.time)}</strong><span>交班時間 16:00<br>還有 ${Math.floor(remaining/60)} 小時 ${remaining%60} 分鐘</span></div><div class="notice"><strong>待命時，每過 1 秒，遊戲走 1 分鐘。</strong><br>關閉視窗後${s.standbyPaused?'仍保持暫停，按「繼續待命」才能開始。':'自動開始。'}有新狀況、閱讀視窗或切到其他分頁時會暫停，不會錯過消息。</div>${s.dutyJob?`<p class="lead">同事正在處理剛才的事，預計 ${timeText(s.dutyJob.due)} 回報。時鐘會照常走，等他做完。</p>`:''}<div class="dialog-actions">${ui('關閉視窗，回到值勤畫面','close','primary')}${b(s.standbyPaused?'繼續待命':'先暫停時鐘','toggleStandby')}${ui('看看事件紀錄','journal')}</div><h3 class="section-title">待命不是下班</h3><p class="lead">留意通訊和設備。有狀況時，先決定找誰幫忙、怎麼處理。下午四點到了，還要把紀錄交給接班同事。</p>`;
}
export function incidentPanel(s,{header,c,b,ui,esc}){
 const delay=workDelay(s,({engineer:'power',medic:'care',logistics:'food',gatekeeper:'access'})[s.role||'gatekeeper']);
 const incident=s.activeIncident,definition=DUTY_EVENTS.find(e=>e.key===incident?.key);
 if(!definition){header('已經安排處理','DUTY UPDATE');c.innerHTML=`<p class="lead">${esc(s.last)}</p>${ui('關閉視窗，繼續值勤','close','primary')}`;return;}
 header(definition.title,'NEW MESSAGE / '+timeText(incident.opened));
 c.innerHTML=`<div class="notice">${esc(s.events.find(e=>e.id===incident.id)?.owner&&s.events.find(e=>e.id===incident.id).owner!=='玩家'?s.events.find(e=>e.id===incident.id).owner:crewName(incident.ownerId||EVENT_OWNERS[incident.key]))}請求協調。<strong>時鐘暫停在 ${timeText(s.time)}。</strong></div><p class="spoken">${esc(definition.text)}</p>${incident.reason?`<p class="notice">${esc(incident.reason)}</p>`:''}<p class="lead">你怎麼安排？交給同事後，會等他實際回報，不會立刻算完成。預估時間已考慮負責人的工作餘裕；正在忙碌的人會先完成手上的工作，再接這件。</p><div class="choices">${definition.choices.map((choice,index)=>`<button class="${index===0?'primary':'secondary'}" data-action="respondIncident" data-choice="${index}">${esc(choice.label)}<small>工作約 ${incidentPlan(s,definition,index).minutes} 分鐘</small></button>`).join('')}</div>${ui('先查看事件紀錄','journal')}`;
}
