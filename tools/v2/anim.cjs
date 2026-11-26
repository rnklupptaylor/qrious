const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]), out = process.argv[3];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  for (const j of ['GB-B', 'CEM', 'NM-203', 'DCPD']) {
    await p.goto(file + '#EN/' + j + '/2'); await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/${j}-2.png` });
  }
  await p.goto(file + '#EN/MCC/2'); await p.waitForTimeout(400);
  await p.locator('text=Measure raw size distribution').click(); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/anim.png` }); await p.waitForTimeout(2000);
  console.log('url', p.url().split('#')[1], 'errors', errs.length, errs.join(' | '));
  await b.close();
})();
