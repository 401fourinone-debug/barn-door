import {environmentAt,cameraEnvironment,nearbyContacts} from './environment.js?v=09c';
const people='assets/gate-people-v06.png',outside='assets/gate-outside-v06.png';
export const GATE_SETTINGS=[
 {id:'empty',name:'平常待命 · 沒有來訪',art:'assets/gate-empty-v06.png',position:'center',size:'cover',time:630,note:'入口平常的樣子。沒有因為你看過別的設定圖，就讓人憑空出現。'},
 {id:'returning',name:'居民返所 · 清晨山霧',art:people,position:'0% 0%',time:430,note:'兩位居民返所的備選情境。熟面孔也需要確認今天的紀錄。'},
 {id:'convoy',name:'交換隊送貨 · 白天',art:people,position:'100% 0%',time:550,note:'兩位送貨人、一箱濾芯與另一箱用品。對應目前第一天的收貨情境。'},
 {id:'courier',name:'來訪者求助 · 雨中',art:people,position:'0% 100%',time:840,kind:'rain',note:'一位疲憊、手臂包紮的來訪者。尚未加入任務，外觀不代表身分或病因。'},
 {id:'strangers',name:'未預約來訪 · 傍晚',art:people,position:'100% 100%',time:1050,note:'三位不在預約名單上的來訪者。態度與動機保留討論，不先判定善惡。'},
 {id:'typhoon',name:'颱風強雨 · 門外無人',art:outside,position:'0% 0%',time:900,kind:'storm',note:'強風雨留在門外。防水擋板、排水與厚重門體仍提供保障。'},
 {id:'suited',name:'防護衣來訪 · 濃霧',art:outside,position:'100% 0%',time:450,kind:'fog',note:'全身防護衣遮住外貌。看不清楚身分，仍是人的備選情境。'},
 {id:'dog',name:'門外犬隻 · 雨後',art:outside,position:'0% 100%',time:1050,note:'一隻普通犬隻停在外側等候線。動物與人的接待方式可以另行設計。'},
 {id:'unknown',name:'未知生物 · 夜間',art:outside,position:'100% 100%',time:1230,kind:'fog',note:'夜間圍界外出現不明四足生物。外形與來源尚未定案，不先設定為外星人或敵人。'}
];
function picture(setting){return {...setting,size:setting.size||'200% 200%',mobileSize:setting.size||'auto 200%'};}
export function gateScene(s,env=environmentAt(s.day||1,s.time)){
 const hasVisitors=nearbyContacts(s).some(c=>c.id==='approach-01'&&['接收區等候','離開中'].includes(c.motion));
 if(hasVisitors)return {...picture(GATE_SETTINGS.find(x=>x.id==='convoy')),id:'live-visitors'};
 if(env.phase==='night')return {id:'live-night',art:env.art,position:'0% 100%',size:'200% 200%',mobileSize:'auto 200%'};
 if(['rain','storm'].includes(env.kind))return {...picture(GATE_SETTINGS.find(x=>x.id==='typhoon')),id:'live-rain'};
 return {...picture(GATE_SETTINGS[0]),id:'live-empty'};
}
export function cameraScene(s,cam,preview='live',setting='auto'){
 let env=cam.concept?environmentAt(s.day||1,630):cameraEnvironment(s,preview),image={art:cam.art||env.art,position:cam.position,size:'200% 200%'};
 const selected=cam.id==='gate'&&setting!=='auto'?GATE_SETTINGS.find(x=>x.id===setting):null;
 if(selected){env=environmentAt(s.day||1,selected.time);if(selected.kind){env={...env,kind:selected.kind,label:{fog:'濃霧',rain:'陣雨',storm:'強風雨'}[selected.kind]};}image=picture(selected);}
 else if(cam.id==='gate')image=gateScene({...s,time:env.time,arrived:preview==='live'&&s.arrived},env);
 return {env,...image,setting:selected,concept:!!selected||!!cam.concept};
}
