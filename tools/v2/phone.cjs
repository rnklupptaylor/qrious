const { chromium, devices } = require('playwright'); const path = require('path');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]), out = process.argv[3];
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  for (const [j, k] of [['MCC', 'sieve'], ['MCC', 'ld'], ['NM-203', 'dls_int']]) {
    await p.goto(file + '#EN'); await p.goto(file + '#EN/' + j + '/2'); await p.waitForTimeout(300);
    await p.evaluate((k) => { const b = document.querySelector('.pbody .seg button[data-v="' + k + '"]'); if (b) b.click(); const s = document.querySelector('.pbody select'); if (s) { s.value = k; s.dispatchEvent(new Event('change')); } }, k);
    const hs = [];
    for (let i = 0; i < 5; i++) { await p.waitForTimeout(500); hs.push(await p.evaluate(() => { const c = document.querySelector('canvas.tcanvas'); const s = document.querySelector('.stage'); const r = c && c.getBoundingClientRect(); return c ? [c.clientHeight, s.clientHeight, Math.round(r.top + scrollY), document.body.scrollHeight, getComputedStyle(s).height].join('/') : 'none'; })); }
    console.log(j, k, hs.join('  '));
    await p.screenshot({ path: `${out}/phone-${j}-${k}.png`, fullPage: true });
  }
  console.log('errors', errs.length, errs.join('|')); await b.close();
})();
