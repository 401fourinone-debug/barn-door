export const DETAIL_AREAS=[
 {id:'residential',name:'生活區與公共走道',file:'residential-details-v07b.png',parts:['床位與閱讀燈','裝備櫃與充電座','通風濾網','公共走道門與夜燈']},
 {id:'canteen',name:'公共餐廳',file:'canteen-details-v07.png',parts:['夜班保溫留餐','冷藏門封與溫度紀錄','洗手與供水','配給秤重與領用單']},
 {id:'gate',name:'守門監控室',file:'gate-details-v07.png',parts:['八路實體監控螢幕','兩扇門的開關與關門指示燈','識別與對講設備','封閉物品傳遞窗']},
 {id:'engineering',name:'工程維護區',file:'engineering-details-v07.png',parts:['可更換淨水濾芯','泵浦壓力與隔離閥','量測工具與備用零件','維修紀錄與保險絲']},
 {id:'isolation',name:'隔離接待室',file:'isolation-details-v07.png',parts:['雙門與密封機構','壓差與通風濾網','防護衣檢查位置','封閉傳遞與隱私屏障']},
 {id:'medical',name:'醫療工作室',file:'medical-details-v07.png',parts:['檢查與記錄工作桌','藥品保存與批次','封閉樣本運送器','醫護交班紀錄']},
 {id:'supplies',name:'物資倉儲',file:'supplies-details-v07.png',parts:['濾芯清點與運送箱','乾糧保存與濕度','收貨保管與封條','防火門與固定貨架']},
 {id:'power',name:'能源通訊室',file:'power-details-v07.png',parts:['備援電池與隔離開關','太陽能與電力調節','衛星通訊與接地','照明備援與測試紀錄']}
];
export function detailsPanel(s,{header,c,esc},area='gate',part=null){
 const data=DETAIL_AREAS.find(x=>x.id===area)||DETAIL_AREAS[0],positions=['0% 0%','100% 0%','0% 100%','100% 100%'];header(data.name+'：設備細節','SCENE / DETAILS');
 c.innerHTML=`<div class="camera-picker"><label for="detail-area">選擇場景</label><select id="detail-area" class="field" data-detail-area>${DETAIL_AREAS.map(x=>`<option value="${x.id}" ${x.id===data.id?'selected':''}>${x.name}</option>`).join('')}</select></div>${data.id==='gate'?'<details class="room-overview"><summary>看監控室整體配置</summary><img src="assets/gate-watchroom-v07b.png" alt="守門監控室的八螢幕與門禁工作台整體配置"></details>':''}<p class="lead">每區四個設備近景，點任一張可放大。這些是細節設定圖，查看不會改動任務。</p>${part===null?`<div class="detail-grid">${data.parts.map((title,i)=>`<button data-detail-part="${i}" class="detail-thumb"><span class="detail-picture" style="background-image:url('assets/${data.file}');background-position:${positions[i]}"></span><span>${esc(title)}</span></button>`).join('')}</div>`:`<button class="quiet" data-detail-part="all">← 返回四個細節</button><h3>${esc(data.parts[part])}</h3><div class="detail-large" style="background-image:url('assets/${data.file}');background-position:${positions[part]}"></div>`}<p class="monitor-note">生活區與公共走道共用一組細節。圖像保留維護與使用痕跡，圖內日期與讀值屬設定示意，實際時間與結果以事件簿為準。</p>`;
}
