// Checks run on every push: the page parses, shows the package version, loads nothing from
// other sites, and its maths engine reproduces the worked examples (ISO 9276 notation).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { version } = require('../package.json');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
let failures = 0;
function check(ok, message) {
  console.log((ok ? 'ok   ' : 'FAIL ') + message);
  if (!ok) failures++;
}
function near(value, expected, relTol, message) {
  const ok = Number.isFinite(value) && Math.abs(value - expected) <= relTol * Math.max(Math.abs(expected), 1e-300);
  check(ok, message + ' = ' + (Number.isFinite(value) ? +value.toPrecision(6) : value) + ' (expected ' + expected + ')');
}
function abs(value, expected, absTol, message) {
  const ok = Number.isFinite(value) && Math.abs(value - expected) <= absTol;
  check(ok, message + ' = ' + (Number.isFinite(value) ? +value.toPrecision(7) : value) + ' (expected ' + expected + ')');
}

// 1. Every inline script parses
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
check(scripts.length > 0, 'page has inline scripts');
scripts.forEach((code, i) => {
  try { new vm.Script(code); check(true, 'script ' + (i + 1) + ' parses'); }
  catch (e) { check(false, 'script ' + (i + 1) + ' parses: ' + e.message); }
});

// 2. Version label in the page equals package.json (1.2.0 -> v1.2, 1.0.0-dev -> v1.0-dev)
const [core, pre] = version.split('-');
const label = 'v' + core.split('.').slice(0, 2).join('.') + (pre ? '-' + pre : '');
const shown = [...html.matchAll(/Qrious (v\d+\.\d+(?:-[a-z0-9.]+)?)/g)].map((m) => m[1]);
check(shown.length > 0 && shown.every((v) => v === label),
  'every version label is ' + label + ' (found ' + [...new Set(shown)].join(', ') + ')');

// 3. Nothing is loaded from other sites (the app must work offline)
const external = html.match(/<(script|link|img|iframe)[^>]*(src|href)=["']https?:/gi) || [];
check(external.length === 0, 'no resources loaded from other sites');
const cssUrls = (html.match(/url\(\s*["']?https?:/gi) || []);
check(cssUrls.length === 0, 'no fonts or images fetched from other sites');

// 4. Maths engine
const block = html.match(/<script id="qmath">([\s\S]*?)<\/script>/);
check(!!block, 'maths engine block <script id="qmath"> found');
if (block) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(block[1] + '\nthis.QMath = QMath;', ctx);
  const Q = ctx.QMath;

  // Bodies with x_V = 10 cm (inputs are rounded to three figures, so 0.2 %)
  const bodies = [
    ['sphere x = 10 cm', { type: 'sphere', a: 10 }, 314.2],
    ['cube L = 8.06 cm', { type: 'cube', a: 8.06 }, 389.8],
    ['cylinder L = 26.7 cm, D = 5 cm', { type: 'cylinder', a: 5, b: 26.7 }, 458.7],
    ['plate D = 21.1 cm, H = 1.5 cm', { type: 'plate', a: 21.1, b: 1.5 }, 798.8],
  ];
  for (const [name, b, S] of bodies) {
    const p = Q.body(b);
    near(p.V, 523.6, 0.002, name + ': V / cm³');
    near(p.S, S, 0.0005, name + ': S / cm²');
  }
  near(Q.body({ type: 'cube', a: 3.7 }).sphericity, 0.806, 0.0005, 'cube sphericity Ψ²_{V,S}');
  near(Q.body({ type: 'sphere', a: 2 }).sphericity, 1, 1e-12, 'sphere sphericity');
  near(Q.ellipsoidSurface(1, 1, 1), 4 * Math.PI, 1e-9, 'ellipsoid surface reduces to the sphere');
  near(Q.body({ type: 'sphere', a: 7 }).Arandom, Math.PI * 49 / 4, 1e-12, 'mean projected area S/4 of a sphere');

  // Sieve analysis
  const sieve = Q.discrete([0, 0.5, 1, 2, 4, 8], [1, 4, 5, 7, 3], 3, 'mm');
  [0, 0.05, 0.25, 0.50, 0.85, 1].forEach((v, i) => abs(sieve.Q[i], v, 1e-12, 'sieve Q_3(x_' + i + ')'));
  [0.100, 0.400, 0.250, 0.175, 0.0375].forEach((v, i) => abs(sieve.q[i], v, 1e-12, 'sieve q_3(x̄_' + i + ') / mm⁻¹'));
  near(Q.momentDiscrete(sieve, -3), 3.762, 0.0002, 'sieve M_{-3,3} / mm⁻³');
  const sieve0 = Q.convertDiscrete(sieve, 0);
  [0, 0.851, 0.977, 0.996, 0.9998, 1].forEach((v, i) =>
    abs(sieve0.Q[i], v, i === 4 ? 0.00005 : 0.0005, 'sieve Q_0(x_' + i + ')'));
  const back = Q.convertDiscrete(sieve0, 3);
  check(back.Q.every((v, i) => Math.abs(v - sieve.Q[i]) < 1e-12), 'discrete l → r → l returns the start (3 → 0 → 3)');
  for (let l = 0; l <= 3; l++) for (let r = 0; r <= 3; r++) {
    const d = Q.convertDiscrete(Q.discrete([0, 0.5, 1, 2, 4, 8], [1, 4, 5, 7, 3], l, 'mm'), r);
    const rt = Q.convertDiscrete(d, l);
    const area = d.q.reduce((s, q, i) => s + q * d.dx[i], 0);
    check(Math.abs(area - 1) < 1e-12 && Math.abs(d.Q[d.n] - 1) < 1e-12 &&
      rt.dQ.every((v, i) => Math.abs(v - [1, 4, 5, 7, 3][i] / 20) < 1e-12),
      'discrete ' + l + ' → ' + r + ': area 1, Q ends at 1, and back again');
  }

  // Fly ash: Q_3 linear from 1 to 100 µm
  const fa3 = Q.uniformQ(1, 100, 3, 'µm');
  const fa2 = Q.convertCont(fa3, 2);
  near(Q.quantileCont(fa3, 0.5), 50.5, 0.001, 'fly ash x_{50,3} / µm');
  near(Q.quantileCont(fa2, 0.5), 10.0, 0.001, 'fly ash x_{50,2} / µm');
  near(Q.momentCont(fa3, 1), 50.5, 0.001, 'fly ash x_{1,3} / µm');
  near(Q.momentCont(fa2, 1), 21.5, 0.001, 'fly ash x_{1,2} / µm');
  near(1 / Q.momentCont(fa3, -1), 21.5, 0.001, 'fly ash x_{1,2} = 1/M_{-1,3} / µm');
  near(Q.momentCont(fa3, 2), 3367, 0.0002, 'fly ash M_{2,3} / µm²');
  near(Math.sqrt(Q.varianceCont(fa3)), 28.6, 0.002, 'fly ash s_3 / µm');
  near(Math.sqrt(Q.varianceCont(fa3)) / Q.momentCont(fa3, 1), 0.57, 0.01, 'fly ash dispersity s_3/x_{1,3}');
  near(Q.QCont(fa2, 10), 0.5, 1e-9, 'fly ash Q_2 is logarithmic: Q_2(10 µm) = 1/2');

  // Abscissa substitution: projected area A -> x_A
  near(Q.xA(125000), 398.9, 0.0002, 'x_A for A = 125000 nm² / nm');
  const qA = Q.piecewiseLinear([[125000, 0], [190000, 1], [450000, 0]], 0, 'nm²');
  const qx = Q.substitutePower(qA, Math.PI / 4, 2, 'nm');
  abs(Q.areaCont(qx), 1, 1e-6, '∫ q_0(x_A) dx_A after substitution');
  abs(Q.QCont(qx, Q.xA(190000)), Q.QCont(qA, 190000), 1e-9, 'Q_0(x_A) = Q_0(A = π x_A²/4)');
  const lnd = Q.substituteLn(Q.piecewiseLinear([[0, 0], [1.5, 1], [3, 0]], 3, ''), 'µm');
  abs(Q.areaCont(lnd), 1, 1e-6, '∫ q_3(x) dx after ξ = ln x');

  // Every distribution: ∫ q_r dx = 1 and Q_r(x_max) = 1 for every r
  const shapes = {
    'fly ash': fa3,
    triangle: Q.piecewiseLinear([[2, 0], [6, 1], [20, 0]], 0, 'µm'),
    trapezoid: Q.piecewiseLinear([[5, 0], [10, 1], [30, 1], [60, 0]], 3, 'µm'),
    bimodal: Q.mixture(Q.piecewiseLinear([[2, 0], [6, 1], [10, 0]], 0, 'µm'), Q.piecewiseLinear([[20, 0], [35, 1], [50, 0]], 0, 'µm'), 0.7),
    'silica x_A': qx,
    'ln x': lnd,
  };
  for (const [name, d] of Object.entries(shapes)) {
    let ok = true, worst = 0;
    for (let r = 0; r <= 3; r++) {
      const c = r === d.r ? d : Q.convertCont(d, r);
      const e = Math.max(Math.abs(Q.areaCont(c) - 1), Math.abs(Q.QCont(c, c.xmax) - 1));
      worst = Math.max(worst, e);
      const rt = Q.convertCont(c, d.r);
      for (const x of [0.25, 0.5, 0.75].map((f) => d.xmin + f * (d.xmax - d.xmin))) {
        worst = Math.max(worst, Math.abs(Q.QCont(rt, x) - Q.QCont(d, x)));
      }
      if (worst > 1e-6) ok = false;
    }
    check(ok, name + ': ∫q_r dx = 1, Q_r(x_max) = 1 and l → r → l for r = 0…3 (worst error ' + worst.toExponential(1) + ')');
  }

  // Discrete moments approach the integrals as Δx → 0
  const target = Q.momentCont(fa2, 1);
  const errs = [10, 1, 0.1].map((w) => Math.abs(Q.momentDiscrete(Q.discretise(fa2, Q.limitsByWidth(1, 100, w)), 1) - target));
  check(errs[0] > errs[1] && errs[1] > errs[2] && errs[2] / target < 1e-4,
    'sums approach integrals as Δx → 0 (x_{1,2} errors ' + errs.map((e) => e.toExponential(1)).join(', ') + ' µm)');

  // A cumulative curve made in the builder must rise from 0 to 1
  check(Q.validCumulative([[1, 0], [3, 0.4], [9, 1]]).length === 0, 'builder: a rising curve from 0 to 1 is valid');
  check(Q.validCumulative([[1, 0], [3, 0.6], [5, 0.4], [9, 1]]).some((p) => p.startsWith('falls')), 'builder: a falling curve is flagged');
  check(Q.validCumulative([[1, 0.1], [9, 0.9]]).length === 2, 'builder: wrong start and end are flagged');
  const drawn = Q.fromCumulativePoints([[1, 0], [3, 0.4], [6, 0.9], [9, 1]], 0, 'µm');
  abs(Q.areaCont(drawn), 1, 1e-9, 'builder: density from a drawn Q_0 has area 1');
}

if (failures) { console.error(failures + ' check(s) failed'); process.exit(1); }
console.log('All checks passed');
