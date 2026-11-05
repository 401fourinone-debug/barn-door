// 遊戲日曆：第 1 天是 2126-09-16，第 365 天是 2127-09-15（2127 年不是閏年）。
export const START_DATE=Date.UTC(2126,8,16);
export const YEAR_DAYS=365;
const DAY_MS=86400000;
const WEEKDAYS=['日','一','二','三','四','五','六'];
const pad=n=>String(n).padStart(2,'0');
export function dateOf(day=1){const d=new Date(START_DATE+((day??1)-1)*DAY_MS);return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,date:d.getUTCDate(),weekday:d.getUTCDay()};}
export const dateText=day=>{const d=dateOf(day);return `${d.year}.${pad(d.month)}.${pad(d.date)}`;};
export const dateCode=day=>{const d=dateOf(day);return `${d.year}${pad(d.month)}${pad(d.date)}`;};
export const weekdayText=day=>'週'+WEEKDAYS[dateOf(day).weekday];
export function seasonOf(day=1){const m=dateOf(day).month;return m>=3&&m<=5?'spring':m>=6&&m<=8?'summer':m>=9&&m<=11?'autumn':'winter';}
export const SEASON_NAMES={spring:'春',summer:'夏',autumn:'秋',winter:'冬'};
export const isMonthEnd=day=>dateOf(day).month!==dateOf(day+1).month;
export const isLastDay=day=>(day||1)>=YEAR_DAYS;
export const monthDay=day=>{const d=dateOf(day);return `${d.month}/${d.date}`;};
