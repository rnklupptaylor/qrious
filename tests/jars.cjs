// Checks the jar data embedded in src/index.html: every fitted q is >= 0 and has area 1, every discrete set has n+1 limits.
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/../src/index.html', 'utf8');
const m = html.match(/App\.JARDATA = (\{.*?\});\n/);
if (!m) { console.error('no jar data found'); process.exit(1); }
const D = JSON.parse(m[1]); let bad = 0;
for (const [jar, ms] of Object.entries(D)) for (const M of ms) {
  if (M.e.length !== M.m.length + 1) { bad++; console.log('FAIL', jar, M.key, 'limits'); }
  if (!M.fit) continue;
  const k = M.fit.k; let area = 0, qmin = Infinity, qmax = 0;
  M.fit.c.forEach((c, i) => {
    const P = (x) => c[0] * x ** 3 / 3 + c[1] * x * x / 2 + c[2] * x; area += P(k[i + 1]) - P(k[i]);
    for (let j = 0; j <= 400; j++) { const x = k[i] + (k[i + 1] - k[i]) * j / 400, q = c[0] * x * x + c[1] * x + c[2]; qmin = Math.min(qmin, q); qmax = Math.max(qmax, q); }
  });
  const ok = Math.abs(area - 1) < 0.003 && qmin >= -1e-9 * qmax;
  if (!ok) bad++;
  console.log(ok ? 'ok  ' : 'FAIL', jar, M.key, 'area', area.toFixed(4), 'q min', qmin.toExponential(1));
}
console.log(bad ? bad + ' failures' : 'All jar checks passed'); process.exit(bad ? 1 : 0);
