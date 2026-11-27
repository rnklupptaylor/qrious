const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]), out = process.argv[3];
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(file + '#EN'); await p.goto(file + '#EN/NM-203/3'); await p.waitForTimeout(300);
  await p.click('.savebtn'); await p.waitForTimeout(200); console.log('btn:', await p.textContent('.savebtn'));
  await p.goto(file + '#EN/NM-203/5'); await p.reload(); await p.waitForTimeout(400);
  console.log('after reload hash:', await p.evaluate(() => location.hash));
  await p.screenshot({ path: out + '/resume.png' });
  await p.click('.resume button'); await p.waitForTimeout(400);
  console.log('after resume hash:', await p.evaluate(() => location.hash), 'errors', errs.length, errs.join('|'));
  await b.close();
})();
