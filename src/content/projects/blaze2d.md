---
id: blaze2d
slug: blaze2d
title: Blaze2D
oneLine: >-
  Can a purpose-built 2D Maxwell eigensolver make thousands-of-solves
  Bloch-parameter studies routine, without giving up validated accuracy?
tagline: >-
  A Rust Maxwell eigensolver, validated against MPB, in the browser and in Python.
yearStart: 2025
yearEnd: 2026
kinds:
  - academic
  - software
summary: >-
  An independently developed 2D Maxwell eigensolver for inspectable,
  high-throughput Bloch-parameter studies, validated against MPB and exposed
  through Rust, Python, and WebAssembly.
placement: research-flagship
lifecycle: released
evidenceLevel: validated-result
statusDate: '2026-08-30'
statusNote: >-
  Released and validated within the documented 2D TE/TM scope. Published on
  PyPI as blaze2d (v0.6.0, MIT license).
publication: public
sourceVisibility: public
role: >-
  I designed and implemented the solver independently: the numerical
  formulation, the mixed-precision eigensolver core, the benchmark and
  validation suite, and the Rust, Python, CLI, and WebAssembly interfaces.
collaborators: []
domain: Computational photonics · numerical linear algebra
dateRange: 2025 – 2026
methods:
  - Plane-wave expansion
  - Mixed-precision block LOBPCG
  - Matrix-free FFT operators
  - Rust (Rayon, faer, rustFFT)
  - PyO3 / maturin packaging
  - WebAssembly
applicationThemes:
  - simulation-infrastructure
  - numerical-validation
citations:
  - label: 'Johnson & Joannopoulos (2001): Block-iterative frequency-domain methods for Maxwell’s equations in a planewave basis (the MPB reference method)'
    href: 'https://doi.org/10.1364/OE.8.000173'
  - label: 'Knyazev (2001): Toward the optimal preconditioned eigensolver (LOBPCG)'
    href: 'https://doi.org/10.1137/S1064827500366124'
  - label: 'Joannopoulos, Johnson, Winn & Meade: Photonic Crystals: Molding the Flow of Light (2nd ed.)'
    href: 'http://ab-initio.mit.edu/book/'
noveltyNote: >-
  No algorithmic novelty is claimed. Plane-wave expansion, LOBPCG, and
  MPB-style preconditioning are established methods; the contribution is an
  independent, validated, performance-focused implementation, packaged across
  Rust, Python, CLI, and the browser.
claimIds:
  - BLAZE-SCOPE-001
  - BLAZE-MPB-001
  - BLAZE-SPEED-001
  - BLAZE-GPU-001
mediaIds: []
figureIds:
  - blaze-crystal-to-bands
links:
  - label: Website
    href: 'https://rnle.github.io/blaze2d/'
    kind: site
  - label: Technical report
    href: 'https://rnle.github.io/blaze2d/blaze/'
    kind: docs
  - label: Repository
    href: 'https://github.com/RnLe/blaze2d'
    kind: source
  - label: PyPI
    href: 'https://pypi.org/project/blaze2d/'
    kind: package
  - label: Report
    href: 'https://rnle.github.io/blaze2d/reports/blaze2d-technical-report.pdf'
    kind: report
    pages: 16
    sizeMb: 0.7
  - label: Manuscript
    href: 'https://rnle.github.io/blaze2d/paper/blaze2d.pdf'
    kind: manuscript
    pages: 12
    sizeMb: 0.9
related:
  - envelope-approximation
---

Blaze2D is a 2D Maxwell eigensolver written in Rust for the case where a
photonic band structure has to be computed not once but thousands of times:
parameter sweeps, geometry searches, and anything else that turns a single
solve into a study. It expands the fields in plane waves and solves the
resulting Hermitian eigenproblem with a mixed-precision block LOBPCG core over
matrix-free FFT operators, and it ships as a Rust crate, a Python package, a
command-line tool, and a WebAssembly build that runs in a browser tab.

Its eigenfrequencies are checked against MPB, the established plane-wave
reference solver, on a shared benchmark set under a declared protocol; the
registered claims below carry that comparison together with its scope. The
solver is deliberately confined to two dimensions and to linear, isotropic,
non-dispersive media, and it claims nothing outside that box.
