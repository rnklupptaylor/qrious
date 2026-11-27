// node s2.cjs index.html outdir JAR METHODKEY [animShotTimes...]: screenshot step 2 view and the animation
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [file0, out, jar, key, ...times] = process.argv.slice(2); const file = 'file://' + path.resolve(file0);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(file + '#EN'); await p.evaluate(([j, k]) => { const a = JSON.parse(localStorage.getItem('qrious.carry') || '{}'); }, [jar, key]);
  await p.goto(file + '#EN/' + jar + '/2'); await p.waitForTimeout(300);
  const sel = p.locator('.pbody select'); if (await sel.count()) await sel.first().selectOption(key).catch(() => {});
  else { const bt = p.locator('.pbody .seg button[data-v="' + key + '"]'); if (await bt.count()) await bt.first().click(); }
  await p.waitForTimeout(600); await p.screenshot({ path: `${out}/${jar}-${key}.png` });
  if (process.env.ACT) { await eval(process.env.ACT); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/${jar}-${key}-act.png` }); }
  if (times.length) { await p.locator('text=Measure raw size distribution').click(); let last = 0; for (const t of times.map(Number)) { await p.waitForTimeout((t - last) * 1000); last = t; await p.screenshot({ path: `${out}/${jar}-${key}-anim${t}.png` }); } }
  console.log('errors', errs.length, errs.slice(0, 4).join(' | ')); await b.close();
})();
