// Visit every jar and step, report console errors; screenshot given jar steps.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const shotJar = process.argv[3], out = process.argv[4];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(file + '#EN'); await p.waitForTimeout(400);
  if (out) await p.screenshot({ path: out + '/shelf.png' });
  const jars = ['MCC', 'DCPD', 'PGS', 'NM-200', 'NM-203', 'GB-B', 'CEM'];
  for (const j of jars) for (let s = 1; s <= 7; s++) {
    const n0 = errs.length;
    await p.goto(file + '#EN/' + j + '/' + s); await p.waitForTimeout(150);
    for (const t of ['Try', 'Check', 'Explain']) { const b2 = p.locator('.ptabs button', { hasText: t }); if (await b2.count()) { await b2.first().click(); await p.waitForTimeout(60); } }
    if (errs.length > n0) console.log(j, s, errs.slice(n0).join(' | '));
    if (out && shotJar.split(',').includes(j)) { const b3 = p.locator('.ptabs button', { hasText: 'Try' }); if (await b3.count()) await b3.click(); await p.waitForTimeout(200); await p.screenshot({ path: `${out}/${j}-${s}.png` }); }
  }
  console.log('errors', errs.length);
  await b.close();
})();
