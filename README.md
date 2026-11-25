# Qrious · Particle size distributions

Qrious is an open browser app for learning how particle size, shape and size distributions are described. Students compare a body with its equivalent spheres, move between the cumulative distribution Qᵣ and the density distribution qᵣ, change the weighting r with moments, convert a measured property into a size by abscissa substitution, watch histograms turn into curves, and find the mode, median, mean and width of a sample. Every lesson has three modes: Look, Play and Test yourself. The notation follows ISO 9276. It runs in English and German (`#EN` / `#DE`) and works offline once loaded.

| Branch | Address |
| --- | --- |
| `main` | https://qrious.ipt-apps.workers.dev/ |
| `dev` | https://dev-qrious.ipt-apps.workers.dev/ |

## Build and check

Use Node.js 22 or later. No dependencies need installing.

```sh
npm test
npm run build
```

`npm test` checks that the page parses, that the version label equals `package.json`, that nothing is loaded from other sites, and that the maths engine reproduces the worked examples (equivalent diameters, the sieve analysis, the fly ash distribution, abscissa substitution, and that every distribution integrates to 1 for every weighting).

## Folder layout

| Path | Contents |
| --- | --- |
| `src/index.html` | The whole app: one self-contained file with its styles, scripts, KaTeX and fonts. The maths engine is the block `<script id="qmath">`. |
| `tools/build.cjs` | Copies `src/` unchanged to `build/deploy/`. |
| `tests/validate.cjs` | The checks run by `npm test`. |
| `wrangler.jsonc` | Cloudflare Workers settings: serve `build/deploy/` as static assets. |

## Hosting

The repository is connected to Cloudflare Workers Builds with `main` as the production branch: build command `npm run build`, deploy command `npx wrangler deploy`, preview command `npx wrangler preview`. Work happens on `dev`; a release is a merge of `dev` into `main` plus a tag `v1.x`.

## Licence

Qrious is distributed under the MIT License (see `LICENSE`). The embedded KaTeX library is MIT-licensed; the embedded fonts (KaTeX, Atkinson Hyperlegible, JetBrains Mono) are under the SIL Open Font License 1.1.
