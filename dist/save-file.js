// 備份檔：只能匯出／匯入，而且匯入的進度不能比目前存檔早（避免回到過去重選）。
import {restoreState,VERSION} from './engine.js?v=10b';
import {dateText} from './calendar.js?v=10b';
export const SAVE_FORMAT='barn-door-save';
export const progressOf=s=>((s.day||1)-1)*1440+(s.time||0);
export function exportSave(state,now=new Date()){
 return JSON.stringify({format:SAVE_FORMAT,version:VERSION,exportedAt:now.toISOString(),day:state.day||1,date:dateText(state.day||1),state},null,2);
}
export function parseSave(text){
 let data;try{data=JSON.parse(text);}catch{return {state:null,error:'這不是穀倉門的備份檔。'};}
 // v0.9 的匯出檔把存檔欄位直接攤平在最外層；v1.0 起包在 state 裡。
 const raw=data?.format===SAVE_FORMAT?data.state:data;
 const state=raw&&typeof raw==='object'?restoreState(JSON.stringify(raw)):null;
 return state?{state,error:null}:{state:null,error:'備份檔內容不完整，無法讀取。'};
}
export function importError(current,incoming){
 if(!incoming)return '備份檔內容不完整，無法讀取。';
 if(current&&progressOf(incoming)<progressOf(current))return `備份停在第 ${incoming.day||1} 天，比目前的第 ${current.day||1} 天早。不能用備份回到過去。`;
 return null;
}
