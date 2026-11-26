const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const f = 'file://' + path.resolve(process.argv[2]), out = process.argv[3];
  for (const j of ['MCC', 'GB-B', 'NM-203', 'CEM']) {
    await p.goto(f + '#EN'); await p.waitForTimeout(200);
    await p.click(`.jarhit[data-jar="${j}"]`); await p.waitForTimeout(200);
    await p.screenshot({ path: `${out}/card-${j}.png` });
  }
  await p.click('.techbtn >> nth=0'); await p.waitForTimeout(200); await p.screenshot({ path: `${out}/popup.png` });
  console.log(errs); await b.close(); })();
