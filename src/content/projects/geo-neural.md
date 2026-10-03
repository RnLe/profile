---
id: geo-neural
slug: geo-neural
title: GeoNeural
shortTitle: GeoNeural
oneLine: >-
  How small can a terrain model get before it ==stops behaving like terrain==?
  Bytes, height error and drainage on real elevation data from the Ruhr valley.
tagline: >-
  When compressed terrain stops behaving like terrain.
listLabel: Independent Study
activity: active
yearStart: 2026
kinds:
  - learning
  - theory
focus:
  learning: 'Neural fields · rate-distortion · quantisation-aware training · geospatial data · PyTorch'
  theory: 'Conservative discretisation · landscape evolution · drainage routing · Rust and WebAssembly'
summary: >-
  A study of how to store a real terrain model, judged by three things at once:
  the bytes a decoder needs, the height error, and the **drainage network** a
  routing algorithm finds on the decoded surface. Conventional codecs win
  against neural fields once every byte is charged and the conventional side is
  swept densely. A few sparse corrections around streams ==preserve drainage
  far more cheaply== than more precision everywhere. And a learned update of
  the terrain that predicts **one flux per cell face** keeps the material
  balance exactly, where a conservation penalty does not.
placement: research-selected
lifecycle: active-research
evidenceLevel: empirical-study
statusDate: '2026-10-03'
statusNote: >-
  The core study is done and reproducible from the repository: every number on
  this page was regenerated from the prepared reference, and a sample rebuild
  runs in about a minute. Five other regions are prepared but were all examined
  during development, so there is no untouched confirmation region yet.
publication: public
sourceVisibility: public
role: >-
  Solo project: data acquisition and checks, codecs and accounting, neural
  models and search, drainage diagnostics, the physics experiments, the Rust
  kernel and the browser lab.
domain: Geospatial machine learning · scientific computing
dateRange: '2026 – present'
methods:
  - PyTorch
  - Neural fields (SIREN, Fourier features, latent grids)
  - Optuna (TPE)
  - Quantisation-aware training
  - q32-delta-zstd, SZ3, zfp, LERC
  - D8 routing, priority flood
  - Finite volumes
  - Rust
  - WebAssembly
  - Three.js
applicationThemes:
  - geospatial-ml
  - scientific-computing
citations:
  - label: 'Sitzmann et al. (2020): Implicit neural representations with periodic activation functions (SIREN)'
    href: 'https://arxiv.org/abs/2006.09661'
  - label: 'Dupont et al. (2022): COIN++: neural compression across modalities'
    href: 'https://arxiv.org/abs/2201.12904'
  - label: 'Lindell et al. (2022): BACON: band-limited coordinate networks for multiscale scene representation'
    href: 'https://arxiv.org/abs/2112.04645'
  - label: 'Müller et al. (2022): Instant neural graphics primitives with a multiresolution hash encoding'
    href: 'https://arxiv.org/abs/2201.05989'
  - label: 'Liang et al. (2023): SZ3: a modular framework for composing prediction-based error-bounded lossy compressors'
    href: 'https://doi.org/10.1109/TBDATA.2022.3201176'
  - label: 'Lindstrom (2014): Fixed-rate compressed floating-point arrays (zfp)'
    href: 'https://doi.org/10.1109/TVCG.2014.2346458'
  - label: "O'Callaghan & Mark (1984): The extraction of drainage networks from digital elevation data (D8)"
    href: 'https://doi.org/10.1016/S0734-189X(84)80011-0'
  - label: 'Barnes, Lehman & Mulla (2014): Priority-flood: an optimal depression-filling and watershed-labeling algorithm'
    href: 'https://doi.org/10.1016/j.cageo.2013.04.024'
  - label: 'Roering, Kirchner & Dietrich (1999): Evidence for nonlinear, diffusive sediment transport on hillslopes'
    href: 'https://doi.org/10.1029/1998WR900090'
  - label: 'Bar-Sinai et al. (2019): Learning data-driven discretizations for partial differential equations'
    href: 'https://doi.org/10.1073/pnas.1814058116'
noveltyNote: >-
  The codecs, network families and routing algorithms are established. The
  contribution is the comparison: every byte charged on both sides, a dense
  conventional sweep, joint dominance with one comparator, drainage as a second
  quality axis, and a conservative learned closure tested against a tuned
  penalty over several seeds.
claimIds:
  - GEO-ROLE-001
  - GEO-DATA-001
  - GEO-CODEC-001
  - GEO-DRAIN-001
  - GEO-CORR-001
  - GEO-NEURAL-001
  - GEO-SIREN-001
  - GEO-HYBRID-001
  - GEO-FLUX-001
  - GEO-PENALTY-001
  - GEO-TEACH-001
  - GEO-GEOL-001
  - GEO-AUDIT-001
  - GEO-LIMIT-001
cardClaimIds:
  - GEO-CORR-001
mediaIds: []
figureIds:
  - geo-hero
tabs:
  - id: overview
    label: Overview
    questions:
      - How few bytes can a ==real terrain model== use and still be the same landscape?
      - Does a ==learned update== of the terrain keep the balance of material it is meant to model?
    figureId: geo-explorer
    paragraphs:
      - >-
        The test field is the 10 m terrain model of southern Essen and the Ruhr
        valley: 1,050,625 heights over 10.24 by 10.24 km, from the official
        state survey. Every representation is scored on the bytes its decoder
        needs, on its height error, and on the streams a routing algorithm
        finds on the decoded surface, because a small height error on a flat
        valley floor can send the water somewhere else.
    sections:
      - heading: What the study found
        claimIds: [GEO-DRAIN-001, GEO-CORR-001, GEO-NEURAL-001, GEO-FLUX-001]
        paragraphs:
          - >-
            **Height error is not drainage.** With a 1 m error bound, which
            sounds accurate for a 10 m model, the derived streams overlap the
            reference by only 22%, and two in three reference stream cells are
            lost or moved. **Sparse corrections fix that cheaply:** exact heights
            on a narrow band around the streams triple the overlap for 59% more
            bytes, where uniform precision needs more than twice the bytes to
            match it.
          - >-
            **Neural fields do not beat conventional codecs here.** Against a
            dense conventional sweep, no network is better by more than 11% in
            mean error at the same size, those that gain are metres worse at
            their worst point, and every network whose streams were measured
            keeps fewer of them than a conventional codec of the same size.
          - >-
            **Conservation should be built in, not asked for.** A network that
            predicts one flux per cell face conserves material to rounding
            error and is the most accurate of the learned updates. A penalty in
            the loss trades accuracy for balance and never reaches it.
      - heading: How it is built
        paragraphs:
          - >-
            A Python package downloads and checks the data, builds the
            reference and its page pyramid, runs twelve codecs, the neural
            models, the drainage comparison and the physics experiments, and
            writes one report per run. The browser view and the lab on this
            page run the project's own code: the terrain in Three.js, the
            physics in a Rust kernel compiled to WebAssembly.
  - id: representation
    label: Representation
    questions:
      - Which encoding keeps the most terrain per byte, ==once every byte is charged==?
    figureId: geo-error
    paragraphs:
      - >-
        Twelve conventional codecs, nine neural families and their quantised
        versions, all scored on the same reference with the same rule: a
        decoder is charged for everything it needs, including the coarse grid
        a hybrid network corrects.
    sections:
      - heading: Conventional codecs
        claimIds: [GEO-CODEC-001]
        paragraphs:
          - >-
            Over all five pyramid levels, SZ3 is the smallest at every error
            bound and q32-delta-zstd, simple integer codes with zstd, is second
            and easy to decode in a browser. At the 1 m bound the page index is
            over a third of the package, so at low rates the index becomes a
            large part of the cost.
      - heading: Neural fields against a dense sweep
        claimIds: [GEO-NEURAL-001, GEO-SIREN-001]
        paragraphs:
          - >-
            The conventional side is swept densely: grids from 10 to 640 m,
            each at 19 error bounds. A network counts as beaten if one
            conventional candidate is at least as good on bytes, mean error and
            maximum error together. Nine of 103 learned candidates are not
            beaten, all by small trade-offs: the largest gain is 11% in mean
            error, at the price of metres more maximum error.
          - >-
            A stand-alone SIREN of 135 kB reaches 0.61 m mean error. A 20 m grid
            with bilinear interpolation reaches 0.36 m in 111 kB.
      - heading: A hybrid is mostly its coarse grid
        claimIds: [GEO-HYBRID-001]
        paragraphs:
          - >-
            The smallest hybrid that is not beaten stores that same 20 m grid
            plus 27 kB of 4-bit network weights, and the network improves the
            grid by 2 mm. The same bytes spent on the grid itself buy 4 cm.
  - id: drainage
    label: Drainage
    questions:
      - Does a small height error ==move the streams==?
      - Can a few stored heights buy them back?
    figureId: geo-streams
    paragraphs:
      - >-
        The same routing runs on the reference and on every decoded surface:
        depressions filled, water sent downhill to the steepest of eight
        neighbours, streams where at least 0.05 km² drains through a cell. The
        score is the overlap of the two stream networks. It compares surfaces;
        it does not model real water.
    sections:
      - heading: Flat ground decides
        claimIds: [GEO-DRAIN-001]
        paragraphs:
          - >-
            Uniform error bounds lose the streams fast: the stream networks
            overlap by 85% at 1 cm, 53% at 10 cm and 22% at 1 m, where the 268
            catchments break into 2,798.
            On slopes under 0.5%, a 5 cm bound already changes two in five flow
            directions.
      - heading: Corrections around the streams
        claimIds: [GEO-CORR-001]
        paragraphs:
          - >-
            The encoder knows where the streams are. It keeps the 1 m bound
            everywhere and stores exact heights on a band reaching one cell
            either side of the streams: 142 kB more, and the overlap rises from
            22% to 68%.
            The best uniform bound that fits in the same total size reaches 31%,
            and matching 68% uniformly takes more than twice the bytes. The band is
            chosen at one stream threshold, so it is also scored at three
            others; the gain holds at all of them.
  - id: physics
    label: Physics
    questions:
      - Can a learned update of the terrain ==keep its material balance==?
    figureId: geo-lab
    paragraphs:
      - >-
        Hillslopes creep downhill faster where they are steep. The teacher here
        is such a nonlinear law, which no linear diffusion matches. Three
        learned updates of about the same size, with the same training, try to
        reproduce it.
    sections:
      - heading: Built in against asked for
        figureIds: [geo-closure]
        claimIds: [GEO-FLUX-001, GEO-PENALTY-001]
        paragraphs:
          - >-
            The flux network predicts one value per face between two cells and
            applies it with opposite signs to both, so whatever leaves one cell
            enters the next and the total can only change at the boundary. Over
            five seeds it is the most accurate learned update and conserves to
            rounding error. A diffusivity network without that structure loses
            balance; with a conservation penalty it gets closer to balance only
            by getting less accurate, and at its median it stays about four
            orders of magnitude further from it than the flux network.
      - heading: The landscape model is checked too
        claimIds: [GEO-TEACH-001]
        paragraphs:
          - >-
            The landscape-evolution model behind the emulator experiments
            (uplift, river incision, hillslope creep) passes its own audit:
            time step and grid refinement converge, the balance closes, and the
            slope-area law comes out with the right exponent. A closed domain
            lifted as a whole turns into a rising flat plain, so the boundary
            is part of the model.
  - id: evidence
    label: Evidence
    questions:
      - What was measured, what was not, and ==what did not hold up==?
    paragraphs:
      - >-
        Every number on this page was regenerated by the package from the
        prepared reference. The earlier runs of the same code are matched
        exactly by the codec payloads, the drainage results and the neural
        codecs. The learned closures and the geology gains vary between runs
        (the single-seed flux error moved from 0.0031 to 0.0047 m/yr), so they
        are reported over several seeds.
    sections:
      - heading: Data
        claimIds: [GEO-DATA-001]
        paragraphs:
          - >-
            Terrain from the state survey's 10 m service (DGM1, Geobasis NRW,
            DL-DE-Zero-2.0), geology from the 1:100,000 map of the Geological
            Survey of NRW (DL-DE-BY-2.0). The grid sits where it should: 403
            official height benchmarks fit within a fraction of a cell, and
            mapped rivers run downhill on it.
      - heading: Geology helps only a weak model
        claimIds: [GEO-GEOL-001]
        paragraphs:
          - >-
            The 1:100,000 map of surface rock types was given to the networks as
            an extra input in four setups, against a misaligned copy of the same
            map. It helped consistently in one: a network predicting withheld
            terrain from scratch improved by 7 to 9% on every seed, at an error
            still above 4 m. Where a network only corrects a conventional coarse
            grid, the map changed nothing. It costs 28.5 kB either way.
      - heading: What did not hold up
        claimIds: [GEO-AUDIT-001]
        paragraphs:
          - >-
            An earlier summary said no network survives once bytes, mean and
            maximum error are counted together. It compared each network
            against two different conventional points. With one comparator and
            a dense sweep a few networks are formally undominated, by margins
            too small to matter. Earlier gains that came from an uncharged
            base, a capped comparison grid or a missing correction step were
            withdrawn.
      - heading: Limits
        claimIds: [GEO-LIMIT-001]
        paragraphs:
          - >-
            One region in depth; the other five were looked at during
            development, so there is no untouched test region. The drainage
            score compares surfaces and is not a flood model. The closure
            experiment is synthetic. Timings come from a shared workstation and
            are reported as ratios only.
links:
  - label: Repository
    href: 'https://github.com/RnLe/geo-neural'
    kind: source
related: []
---

On a real 10 m terrain model, no neural representation beats the best
conventional codec of the same size by more than 11% in mean height error, and
none keeps more of the drainage network. Neural fields promise to store such
grids in a few kilobytes of network weights and are usually judged by their mean
height error. This study asks what a downstream computation still gets out of
the decoded surface, and charges every representation for every byte its decoder
needs.

The question carries over to physics. A learned model of how terrain changes
has to keep track of where material goes. Building that constraint into the
network's structure is compared with asking for it in the loss, on a known
nonlinear hillslope law, over several seeds and penalty weights.
