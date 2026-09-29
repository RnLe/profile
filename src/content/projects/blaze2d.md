---
id: blaze2d
slug: blaze2d
title: Blaze2D
oneLine: >-
  A Rust solver for light that can travel through two-dimensional photonic
  crystals, about an ==order of magnitude faster== than MPB in recorded
  parameter sweeps.
tagline: >-
  Software that computes how light travels through photonic crystals.
listLabel: Strongest Research Artifact
activity: active
yearStart: 2025
kinds:
  - theory
focus:
  theory: 'Numerical linear algebra · iterative eigensolvers (LOBPCG) · FFT-based operators · mixed precision · Maxwell eigenproblems'
summary: >-
  Photonic crystals are materials with a repeating structure that can guide or
  block light. Blaze2D computes ==which light can travel through a
  two-dimensional crystal==, and it is built for **studies that repeat this
  calculation across many designs**. Its results are checked against MPB,
  ==the established reference solver by MIT==.
placement: research-flagship
lifecycle: released
evidenceLevel: validated-result
statusDate: '2026-08-30'
statusNote: >-
  Released, and checked against MPB within its documented scope:
  two-dimensional crystals, both polarizations of light (TE and TM). Published
  on PyPI as blaze2d under the MIT license.
publication: public
sourceVisibility: public
collaborators: []
domain: Computational photonics · numerical linear algebra
dateRange: 2025 – present
methods:
  - Rust
  - Plane-wave expansion
  - Mixed-precision LOBPCG
  - FFT-based operators
  - Python (PyO3)
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
  - label: 'MPB developers: User interface, run functions (MPB documentation; on reusing fields between runs)'
    href: 'https://mpb.readthedocs.io/en/latest/Python_User_Interface/#run-functions'
  - label: 'Georg, Ackermann, Corno & Schöps (2019): Uncertainty quantification for Maxwell’s eigenproblem based on isogeometric analysis and mode tracking'
    href: 'https://doi.org/10.1016/j.cma.2019.03.002'
  - label: 'Börm, Köhl & Talebi (2023): Computing Maxwell eigenmodes with Bloch boundary conditions (preprint)'
    href: 'https://arxiv.org/abs/2304.00337'
  - label: 'Minkov et al. (2020): Inverse design of photonic crystals through automatic differentiation'
    href: 'https://doi.org/10.1021/acsphotonics.0c00327'
  - label: 'Jin & Xie (2026): A robust GPU-accelerated kernel compensation solver with novel discretization for photonic crystals in anisotropic media (preprint)'
    href: 'https://arxiv.org/abs/2511.17107v3'
  - label: 'Feng (2024): Inverse design of photonic crystal waveguides using neural networks and dispersion optimization (preprint)'
    href: 'https://arxiv.org/abs/2410.06374'
  - label: 'Zanotti et al. (2024): Legume, a free implementation of the guided-mode expansion method for photonic crystal slabs'
    href: 'https://doi.org/10.1016/j.cpc.2024.109286'
noveltyNote: >-
  Plane-wave expansion, the LOBPCG eigensolver, and MPB-style preconditioning
  are established methods; Blaze’s contribution is what it builds on them. It
  is an independent solver in modern Rust that computes the same bands as MPB,
  much faster in recorded parameter sweeps, and is easier to use in research.
  Its modular design leaves plenty of room for new methods and optimizations,
  each validated against MPB, to make band calculations and research on
  photonic crystals faster and more practical while keeping their accuracy.
claimIds:
  - BLAZE-SCOPE-001
  - BLAZE-MPB-001
  - BLAZE-SPEED-001
  - BLAZE-GPU-001
  - BLAZE-SCALE-001
mediaIds: []
figureIds:
  - blaze-bands
sections:
  - heading: Light in a crystal
    figureIds: [blaze-crystals]
    paragraphs:
      - >-
        A photonic crystal is a material whose structure repeats on the
        scale of the wavelength of light, such as a material pierced by
        a regular pattern of long, parallel air holes. That pattern
        decides ==which light can travel through it and which is
        blocked==, much as the atomic lattice of a semiconductor decides
        how electrons move.
      - >-
        The map of which light can pass is the **band structure**.
        Computing it means solving an eigenvalue problem from Maxwell’s
        equations, repeated for every wavevector the diagram samples.
  - heading: Checked against MPB
    figureIds: [blaze-accuracy, blaze-speed]
    paragraphs:
      - >-
        [MPB](https://mpb.readthedocs.io/), developed at MIT, is the
        established reference solver for photonic band structures. Blaze
        computes ==the same bands==, and in recorded parameter sweeps it
        is **about an order of magnitude faster**.
  - heading: Blaze’s core
    figureIds: [blaze-lobpcg]
    paragraphs:
      - >-
        Blaze writes the light field as a sum of plane waves and finds
        the bands with a ==mixed-precision block eigensolver== (LOBPCG),
        applying Maxwell’s operator through fast Fourier transforms
        instead of storing large matrices. A study runs ==whole
        calculations in parallel== rather than splitting each one across
        threads.
      - >-
        It returns more than bands: **projected Maxwell operators**, the
        quantities my master’s thesis needed. And it is a ==research
        ground of its own==: new numerical ideas, such as reusing the
        crystal’s symmetries or starting the next geometry from the last
        one’s solution, are designed to go in as modules and be measured
        against the plain solver, regressions included.
  - heading: Blaze is easy
    figureIds: [blaze-workbench]
    paragraphs:
      - >-
        Blaze was built to be ==easy to use== from the start. Its
        [website](https://rnle.github.io/blaze2d/) explains the theory
        and can even ==run the solver in the browser==: the
        [Workbench](https://rnle.github.io/blaze2d/workbench) helps
        design a study, runs it, and exports the results.
      - >-
        For scripts and larger studies, Blaze has clear, modern
        interfaces in **Python, Rust, and TOML**, all sharing one
        configuration format. The Python package installs from
        [PyPI](https://pypi.org/project/blaze2d/) with a single command.
    code: pip install blaze2d
  - heading: Scope and scale
    figureIds: [blaze-scale]
    paragraphs:
      - >-
        Blaze is substantially more than a shell around an existing
        numerical library: it is a **full solver, written from
        scratch**. Behind its interfaces sits a Rust workspace of
        separate parts: the solver core, one configuration contract
        shared by every interface, a runner for parallel studies, the
        command-line tool, the Python bindings, and backends for the
        CPU, the browser, and CUDA. Release workflows build portable
        Python wheels and test the installation outside the repository.
  - heading: Where Blaze is headed
    figureIds: [blaze-roadmap]
    paragraphs:
      - >-
        **Blaze aims to become a full drop-in replacement for MPB
        workflows, and to enable research that is currently prohibitive
        due to computational limits or MPB’s legacy codebase.** Blaze’s
        [roadmap](https://rnle.github.io/blaze2d/roadmap) has multiple
        stages. The first builds ==a reliable research core==: the
        solver is done, its use of the crystal’s symmetries is in
        development, warm starts are planned, and the pages on theory and
        benchmarks are being written.
      - >-
        The second makes the two-dimensional solver ==general and
        faster==: crystals of any shape, quicker solves, calculations at
        a chosen frequency, gradients for optimizing a design
        automatically, and running existing MPB calculations in Blaze.
      - >-
        The third adds ==GPU computing and three dimensions==: full 3D
        crystals, and photonic slabs, thin patterned films that confine
        light vertically. **Every new feature is checked against MPB.**
links:
  - label: Blaze2D
    href: 'https://rnle.github.io/blaze2d/blaze/'
    kind: docs
    mark: blaze2d
  - label: Website
    href: 'https://rnle.github.io/blaze2d/'
    kind: site
  - label: Technical report
    href: 'https://rnle.github.io/blaze2d/reports/blaze2d-technical-report.pdf'
    kind: report
    pages: 16
    sizeMb: 0.7
  - label: Manuscript
    href: 'https://rnle.github.io/blaze2d/paper/blaze2d.pdf'
    kind: manuscript
    pages: 12
    sizeMb: 0.9
  - label: Repository
    href: 'https://github.com/RnLe/blaze2d'
    kind: source
  - label: PyPI
    href: 'https://pypi.org/project/blaze2d/'
    kind: package
related:
  - envelope-approximation
---

Blaze2D is a solver for <mark>light that can travel through two-dimensional
photonic crystals</mark>, written in Rust and about an order of magnitude faster
than MPB in recorded parameter sweeps. It began as the solver for my master’s
thesis and has grown into a **long-term research project**.
