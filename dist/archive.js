// 跨日時把舊紀錄歸檔，讓一整年的存檔留在瀏覽器容量內（約 5MB）。
// 未結案的事件一律完整保留；只有已結束、超過 ARCHIVE_DAYS 天的細節會被精簡。
export const ARCHIVE_DAYS=7;
const KEEP_ROWS=2;
const lastDay=e=>Math.max(e.closedDay??0,e.openedDay??0,...(e.entries||[]).map(r=>r.day??0));
export function archiveOld(s){
 const cutoff=(s.day||1)-ARCHIVE_DAYS;if(cutoff<1)return s;
 // 「庇護所運作」是每天的各區流水帳，過了保留期就整筆移除。
 s.events=s.events.filter(e=>!(e.category==='庇護所運作'&&lastDay(e)<cutoff));
 for(const e of s.events){
  if(e.status!=='已結案'||lastDay(e)>=cutoff||e.entries.length<=KEEP_ROWS)continue;
  e.archivedRows=(e.archivedRows||0)+e.entries.length-KEEP_ROWS;e.entries=e.entries.slice(-KEEP_ROWS);
 }
 const w=s.world;
 if(w){
  w.npcDone=w.npcDone.filter(k=>Number(k.split('-')[1])>=(s.day||1)-1);
  w.seen=w.seen.slice(-300);w.observed=w.observed.slice(-60);
 }
 return s;
}
