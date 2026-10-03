# Source

Copied from the GeoNeural repository (https://github.com/RnLe/geo-neural) at commit
`8006f6d`:

* `charts/`, `data/`, `lab/`, `viewer/`, `index.ts` from `web/src/`, unchanged;
* `wasm/` from `npm run wasm` in `web/` (wasm-pack, release build, home prefix remapped so
  the binary carries no machine paths): the `landscape-core` kernel and its bindings, unchanged;
* `../geo-neural.css` from `web/src/styles.css` without its dark theme and page-level
  rules, with the module colours mapped onto this site's tokens.

The data the modules read lives in `static-public-source/geo-neural/bundle/`, written by
`geoneural export-web` at the same commit, and the figure data in `src/data/geo-neural/`
comes from `results/` there. To update: rebuild in the GeoNeural repository, copy the
three parts again, and refresh the checksums in `static-public-source/manifest.yaml`.
