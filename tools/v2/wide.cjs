const { chromium, devices } = require('playwright'); const path=require('path');
(async()=>{const b=await chromium.launch();const m=await b.newPage({...devices['iPhone 13']});
for (const h of ['#EN','#EN/MCC/4','#EN/MCC/7']){await m.goto('file://'+path.resolve(process.argv[2])+h);await m.waitForTimeout(400);
const r=await m.evaluate(()=>{const W=document.documentElement.clientWidth;return [W,document.documentElement.scrollWidth,[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>W+1).slice(0,6).map(e=>e.tagName+'.'+e.className.baseVal!==undefined?e.tagName:e.tagName+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right))]});console.log(h,JSON.stringify(r));}
await b.close();})();
