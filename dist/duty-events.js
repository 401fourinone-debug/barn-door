import {EXTRA_EVENTS} from './extra-events.js';
export const DUTY_EVENTS=[
 {key:'drain',title:'排水口卡了落葉',from:'工程師',text:'外門雨棚的排水口有落葉。現在還沒積水，要先清掉嗎？',choices:[{label:'請工程師清一清',minutes:8,health:1,trust:1,reply:'工程師清好外面的排水口，試過排水正常，室內沒有進水。',actor:'工程師'},{label:'先圍起來，請下一班追蹤',minutes:2,health:-1,trust:0,pending:true,reply:'外側排水口已標示，還沒清理；下一班要安排人手。',actor:'守門人'}]},
 {key:'rest',title:'同事想休息一下',from:'值班同事',text:'「有點頭暈，能找人讓我休息十分鐘嗎？門口不能沒人。」',choices:[{label:'請資深守門人換手，讓他休息',minutes:10,health:0,trust:2,reply:'資深守門人已代班，同事休息後好多了，醫護也知道這件事。',actor:'資深守門人／醫護'},{label:'請醫護先來看，原地等人換手',minutes:6,health:0,trust:1,reply:'醫護已到，代班人員接手後，同事離開崗位休息。',actor:'醫護／代班同事'}]},
 {key:'radio',title:'陌生代號詢問入口',from:'無線電',text:'有人自稱附近的交換隊，想知道入口位置。代號沒在聯絡名單上，也沒有預約。',choices:[{label:'先不說位置，請熟悉的窗口確認',minutes:7,health:0,trust:1,reply:'熟悉的聯絡人未能確認這個代號。沒有透露入口位置，請對方先辦預約。',actor:'通訊同事'},{label:'婉拒，請對方走原本的預約管道',minutes:1,health:0,trust:0,reply:'未提供位置，已說明預約方式。這次通話沒有建立新身分資料。',actor:'玩家'}]},
 {key:'meal',title:'夜班留餐少了兩份',from:'後勤',text:'「名單寫六份，餐櫃裡只有四份。可能有人拿錯，先查一下還是補煮？」',choices:[{label:'對一下領餐紀錄',minutes:5,health:0,trust:1,reply:'後勤發現兩份放到另一個保溫箱，已補回夜班餐櫃並更正紀錄。',actor:'後勤'},{label:'先補兩份，再查原因',minutes:12,health:-1,trust:1,reply:'夜班餐點已補足，原因仍待後勤追蹤；額外用了兩份備用食材。',actor:'後勤',pending:true}]},
 {key:'motor',title:'門機聲音和平常不同',from:'門口同事',text:'外門測試時多了一聲摩擦聲，門還能正常關上。要停下來檢查嗎？',choices:[{label:'請工程師檢查，先維持關門',minutes:9,health:1,trust:1,reply:'工程師固定好鬆動的護蓋，門機試動正常；門沒有失去防護。',actor:'工程師'},{label:'記下聲音與時間，請下一班再測',minutes:2,health:-1,trust:0,pending:true,reply:'已記下異音，門位目前正常；下一班仍需安排工程檢查。',actor:'玩家'}]},
 {key:'parcel',title:'居民來領工具包',from:'後勤',text:'有人要領回寄放的工具包，說是家人替他放的，但領取單上寫的是另一個名字。',choices:[{label:'聯絡寄放的人確認',minutes:6,health:0,trust:1,reply:'寄放人確認可以代領，後勤記下領取人和時間後交還。',actor:'後勤／寄放人'},{label:'先保管，等本人或證明到齊',minutes:1,health:0,trust:0,pending:true,reply:'工具包仍由後勤保管，已向來領的人說明；等待寄放人確認。',actor:'後勤'}]}
 ,...EXTRA_EVENTS
];
