# Source

Copied from the GeoNeural repository (https://github.com/RnLe/geo-neural) at commit
`7e1068f` (4 October 2026), the commit that contains `results/v2/case-study.json`, with the
lab parts (`lab/`, `data/bundle.ts`, the `landscape_wasm` files and `bundle/lab/`) from commit
`6b47947` (5 October 2026), which exports the selected conductance closure to the lab:

* `charts/`, `data/`, `lab/`, `viewer/` from `web/src/`, with three local edits: `viewer/map.ts`
  is new here, a map mode of the viewer (the reference surface only, with a layer choice,
  vertical exaggeration from 5x and two camera presets, Reset view and Top-down) that `mountViewer` opens with
  `mode: "map"`; the visible text of `lab/` is shorter (labels, notes, legends, and three
  rows of diagnostics per run instead of eight, the soil balance in whole cubic meters),
  with the same computations; the ridge preset has one control (the creep rate, over
  100,000 years) and no decay readout; the closure preset names the teacher "Simulation"
  and shows only the selected network (edge rate with floor) and one rejected early
  design (the flux network), with a flat start surface; the
  material preset sets one factor for loose ground (sand, silt, gravel, made ground)
  against rock instead of a factor per map unit; the lab plots size their label room from
  the longest label and take their height from their host; each preset puts Run, Pause
  and Reset on the row of its settings, and the closure preset sets its surfaces and
  charts side by side, so every preset fits on one screen;
* `index.ts` from `web/src/`, without its two codec export lines (the codec island imports
  `codec/index.ts` directly);
* `codec/` from `web/src/codec/` and the `gnc_wasm` files from `npm run wasm:gnc`: the
  compression microscope and the Rust decoder of the `.gnc` format. `codec/microscope.ts` is
  a lean local version: three cards (file size and saving against SZ3; the error limit is
  said once above them), the error and stream maps side by side, one line for the live decode with the
  same bit-for-bit check, and the bytes by component in one disclosure, with the case
  study's region names; no crop, cross-section or timing notes;
* `wasm/` from `npm run wasm` in `web/` (wasm-pack, release build, home prefix remapped so
  the binary carries no machine paths): the `landscape-core` kernel and its bindings, unchanged;
* `../geo-neural.css` from `web/src/styles.css` without its dark theme and page-level
  rules, with the module colors mapped onto this site's tokens and the codec views mapped
  onto the chart colors in `../geo.ts`; text sizes are in em of the module root, which
  follows the case study's type, and the map and lean microscope have their own rules.

The data the modules read lives in `static-public-source/geo-neural/bundle/`, written by
`geoneural export-web` (the lab ships the weights of the two networks it shows: `manifest.json`
lists only `conductance` and `flux` under `closure.weights`, and `kfield.bin` and `penalty.bin`
are left out), and in `static-public-source/geo-neural/codec/`, written by
`geoneural codec-web-bundle --regions essen-ruhr muensterland-plain --bounds 0.25`.
The figure data in `src/data/geo-neural/` comes from `results/` there: `v2.json` is
`results/v2/case-study.json` (byte for byte), and `cohort.json` is derived from
`results/v2/cohort.json` and `src/geoneural/configs/regions.json`.

The freeze times cited on the page are the timestamps inside those files (`createdUtc` of
`results/v2/cohort.json` and `results/v2/codec/h1-confirmation.json`, `frozenUtc` of
`results/v2/frozen/h1-recipe.json`).

To update: rebuild in the GeoNeural repository, copy the parts again, and refresh the
checksums in `static-public-source/manifest.yaml`.
