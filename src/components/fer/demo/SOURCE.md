# Source

The facial emotion demo (`../../islands/FerDemo.tsx`) and the card loop come from the study
repository (https://github.com/RnLe/facial_emotion_detection):

* `wasm/` from `web/fer-wasm` there: `wasm-pack build --target web --release`, with
  `RUSTFLAGS="-C target-feature=+simd128 --remap-path-prefix=$HOME=~"` so the binary uses
  WebAssembly SIMD and carries no machine paths. The crate is a small interpreter for the
  model files below; `cargo test --release` checks it against the reference outputs.
* `static-public-source/fer/demo/` from `python scripts/26_web.py models`, `samples` and
  `site`: the seven winners (the best seed of each architecture by validation macro-F1;
  VGG and DenseNet from the shape stage, ResNet-18 from stage 1) as model files in parts
  under 2.5 MiB, int8 weights with one scale per output channel (test accuracy within
  0.12 points of float), `models.json` with the parts in loading order, and 135 FER2013
  test faces (20 per emotion, all 15 for disgust; RAF-DB images may not be redistributed)
  with every network's probabilities from the same int8 weights.
* `../../../assets/fer/demo-loop.webp` and `demo-loop-card.webp` from `python scripts/26_web.py thumb`
  (`thumb.webp` and `thumb_card.webp` there): DenseNet's probabilities on five faces, each
  followed by its occlusion map (every 6 x 6 patch set to the mean grey in turn; per pixel the
  mean drop in the predicted class's probability over the patches covering it, in viridis),
  the face and the map at their 48 x 48 pixels, lossless.

The other files here (`engine.ts`, `worker.ts`, `image.ts`, `initial.ts`, `protocol.ts`,
`types.ts`, `fer-demo.css`) are written for this site.
