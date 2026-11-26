// Screenshot step 2 for every technique of the given jars, plus OM modes and the measure animation.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]), out = process.argv[3];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  for (const j of ['MCC', 'NM-203', 'GB-B', 'CEM']) {
    await p.goto(file + '#EN/' + j + '/2'); await p.waitForTimeout(300);
    const btns = p.locator('.pbody .seg button');
    const n = await btns.count(); const names = [];
    for (let i = 0; i < n; i++) names.push(await btns.nth(i).innerText());
    for (let i = 0; i < names.length; i++) {
      await p.locator('.pbody .seg button', { hasText: names[i] }).first().click(); await p.waitForTimeout(500); if (names[i].includes('Microscope')) { for (const m of ['2 Threshold','3 Segments']) { await p.locator('.pbody .seg button', { hasText: m }).click(); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/${j}-2-om-${m[0]}.png` }); } const cv = p.locator('canvas.tcanvas'); const bb = await cv.boundingBox(); await p.mouse.click(bb.x + bb.width*0.555, bb.y + bb.height*0.36); await p.waitForTimeout(300); }
      await p.screenshot({ path: `${out}/${j}-2-${names[i].replace(/\W+/g, '_')}.png` });
    }
  }
  console.log('errors', errs.length, errs.slice(0, 5).join(' | '));
  await b.close();
})();
