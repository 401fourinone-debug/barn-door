export const SCENE_ART={day:'assets/scenes-v02.png',rain:'assets/scenes-rain-v05.png',night:'assets/scenes-night-v05.png'};
export function environmentAt(day=1,time=410){
 const phase=time<360||time>=1140?'night':time<480?'dawn':time<1020?'day':'dusk';
 let kind='cloud',label='多雲',temperature=26,detail='山區雲層低，外門與室內設備正常。';
 if(day===2&&time<540){kind='rain';label='陣雨';temperature=24;}
 else if(time>=780&&time<960){kind=day===3||time>=870?'storm':'rain';label=kind==='storm'?'強降雨':'陣雨';temperature=24;}
 else if(time>=540&&time<690&&day!==3){kind='clear';label='晴時多雲';temperature=28;}
 if(phase==='night'){temperature=22;if(kind!=='rain'&&kind!=='storm')label='多雲夜間';}
 if(kind==='storm')detail='雨勢增強，山路能見度低。雨留在外面，室內照明與排水持續運作。';
 else if(kind==='rain')detail='窗外下起陣雨，地面濕滑。室內保持乾燥，外出前留意回報。';
 else if(phase==='night')detail='居民準備休息，公共區域改用夜間照明，外門由夜班看守。';
 else if(phase==='dawn')detail='清晨的冷光透過窗戶，室內照明仍維持開啟。';
 else if(phase==='dusk')detail='山谷開始入暮，外圍照明逐一亮起。';
 return {day,time,phase,phaseName:{dawn:'清晨',day:'白天',dusk:'傍晚',night:'夜間'}[phase],kind,label,temperature,detail,art:phase==='night'?SCENE_ART.night:['rain','storm'].includes(kind)?SCENE_ART.rain:SCENE_ART.day};
}
export function nearbyContacts(s){
 const time=s.time,day=s.day||1,contacts=[],team=!!s.role&&s.role!=='gatekeeper',arrived=team?time>=550:s.arrived;
 if(day===1&&time>=510){
  const decision=s.decision;
  const event=s.events?.find(e=>e.id==='EV-21260916-004');
  const finished=event?.entries?.filter(e=>['處置','處理','安排','系統'].includes(e.type)).at(-1)?.time;
  const departing=team?time>=585:!!(decision&&s.standardReceived&&s.outerGate==='closed');
  const departureStart=team?585:finished??570;
  if(!departing||time<departureStart+12){
   const distance=departing?Math.min(200,20+Math.max(0,time-departureStart)*16):arrived?18:Math.max(24,200-(time-510)*4.4);
   const motion=departing?'離開中':arrived?'接收區等候':time>=550?'入口外等候':'接近中';
   const known=!!((team&&time>=553)||s.idChecked||(s.decision==='delegated'&&s.delegateDue===null));
   contacts.push({id:'approach-01',people:2,label:known?'預約送貨隊':'兩個人員訊號',distance:Math.round(distance),x:50+distance*.12,y:50-distance*.17,known,motion});
  }
 }
 if(time>=480&&time<960){const a=(time%60)/60*Math.PI*2;contacts.push({id:'patrol-01',people:1,label:'外圍巡檢同事',distance:64,x:50+Math.cos(a)*18,y:50+Math.sin(a)*18,known:true,motion:'例行巡檢'});}
 return contacts;
}
export const CAMERAS=[
 {id:'gate',name:'外門接收區',code:'CAM 01 / ACCESS',scene:'gate',position:'0% 100%',note:'外門、接收區與外側山路。',map:[230,57]},
 {id:'canteen',name:'公共餐廳',code:'CAM 02 / COMMON',scene:'canteen',position:'100% 0%',note:'公共餐桌與配給窗口。',map:[103,122]},
 {id:'engineering',name:'工程通道',code:'CAM 03 / SERVICE',scene:'engineering',position:'100% 100%',note:'設備、維修通道與管線。',map:[247,149]},
 {id:'hall',name:'生活區公共走道',code:'CAM 04 / HALL',scene:'engineering',position:'100% 100%',note:'生活區門外公共走道；床位不設鏡頭。',map:[74,53]},
 {id:'isolation',name:'隔離接待室',code:'CAM 05 / INTAKE',scene:'isolation',art:'assets/key-rooms-v06.png',position:'0% 0%',note:'雙門緩衝、通風與隔離接待。日間場景示意，可由對應職務進入工作。',map:[247,213],concept:true},
 {id:'medical',name:'醫療工作室',code:'CAM 06 / MEDICAL',scene:'medical',art:'assets/key-rooms-v06.png',position:'100% 0%',note:'醫療工作桌與用品櫃；不拍攝病床。日間場景示意。',map:[74,213],concept:true},
 {id:'supplies',name:'物資倉儲',code:'CAM 07 / STORES',scene:'supplies',art:'assets/key-rooms-v06.png',position:'0% 100%',note:'濾芯、食物與領用紀錄。日間場景示意，後勤在此管理物資。',map:[74,293],concept:true},
 {id:'power',name:'能源通訊室',code:'CAM 08 / POWER',scene:'power',art:'assets/key-rooms-v06.png',position:'100% 100%',note:'電池、太陽能調節與衛星通訊設備。日間場景示意。',map:[247,293],concept:true}
];
export function cameraEnvironment(s,preview='live'){
 const times={dawn:410,day:630,rain:840,dusk:1050,night:1230};
 return environmentAt(s.day||1,preview==='live'?s.time:times[preview]??s.time);
}
