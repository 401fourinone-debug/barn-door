import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {supportPanel} from '../dist/flow-ui.js';
function content(panel,state){const c={innerHTML:''};supportPanel(panel,state,{header(){},c,b:()=>'<button>ACTION</button>',ui:()=>'<button>READ</button>',esc:String,timeline:()=>'<p>紀錄</p>'});return c.innerHTML;}
test('修好後的工程師與紀錄不會叫玩家重做第一天檢查',()=>{for(const day of [2,3]){const s={...createState(),day,readerRepaired:true,signed:true};assert.match(content('routine',s),/已修好/);assert.doesNotMatch(content('routine',s),/ACTION|接班後先檢查/);assert.match(content('engineer',s),/修好了/);assert.doesNotMatch(content('engineer',s),/午後會/);}});
test('對講機與後勤說明依日期與當天結果更新',()=>{let s={...createState(),day:2,signed:true};assert.match(content('visitor',s),/沒有新的送貨隊/);s={...s,day:3,convoyCalled:true,dayChoice:'postponed'};assert.match(content('visitor',s),/改天送/);assert.match(content('logistics',s),/延後/);assert.doesNotMatch(content('visitor',s),/六支濾芯都在/);});
