---
id: hard-spheres
slug: hard-spheres
title: Hard Sphere Simulations
shortTitle: Hard Spheres
oneLine: >-
  How do hard spheres ==crystallize under gravity==, and how can a simulation
  find the next collision quickly?
tagline: >-
  A team study of hard spheres: a faster collision search and sedimentation
  under gravity.
listLabel: Team Project
activity: archived
yearStart: 2024
yearEnd: 2024
kinds:
  - theory
focus:
  theory: 'Statistical physics · event-chain Monte Carlo · hard-sphere phase behavior · sedimentation · grid ray tracing'
summary: >-
  A team project of three students on hard spheres: particles that only
  collide, but still form crystals when packed densely. We simulated them
  with **event-chain Monte Carlo**. My parts were a collision search that
  ==only checks the cells along a sphere's path==, and **sedimentation under
  gravity**, where 91,125 spheres formed crystal layers at the bottom of the
  box.
placement: academic-archive
lifecycle: archived
evidenceLevel: empirical-study
statusDate: '2026-09-30'
statusNote: >-
  Archived team project (2024). The final report and its figures are public;
  the simulation code was lost.
publication: public
sourceVisibility: public
collaborators:
  - Lukas Annuss
  - Stefan Nienhaus
domain: Statistical physics · Monte Carlo simulation · soft matter
dateRange: '2024'
methods:
  - Event-chain Monte Carlo
  - Cell grid
  - Grid ray tracing
  - Gravity as an energy budget
  - Ackland–Jones analysis
  - C++ / Rust
applicationThemes:
  - physical-systems
  - numerical-validation
citations:
  - label: 'Bernard, Krauth & Wilson (2009): Event-chain Monte Carlo algorithms for hard-sphere systems'
    href: 'https://doi.org/10.1103/PhysRevE.80.056704'
  - label: 'Michel, Kapfer & Krauth (2014): Generalized event-chain Monte Carlo: constructing rejection-free global-balance algorithms from infinitesimal steps'
    href: 'https://doi.org/10.1063/1.4863991'
  - label: 'Kampmann et al. (2021): Event-chain Monte-Carlo simulations of dense soft matter systems'
    href: 'https://doi.org/10.3389/fphy.2021.635886'
  - label: 'Verlet (1967): Computer “experiments” on classical fluids. I. Thermodynamical properties of Lennard-Jones molecules'
    href: 'https://doi.org/10.1103/PhysRev.159.98'
  - label: 'Bresenham (1965): Algorithm for computer control of a digital plotter'
    href: 'https://doi.org/10.1147/sj.41.0025'
  - label: 'Carnahan & Starling (1969): Equation of state for nonattracting rigid spheres'
    href: 'https://doi.org/10.1063/1.1672048'
  - label: 'Alder, Hoover & Young (1968): Studies in molecular dynamics. V. High-density equation of state and entropy for hard disks and spheres'
    href: 'https://doi.org/10.1063/1.1670641'
  - label: 'Piazza, Bellini & Degiorgio (1993): Equilibrium sedimentation profiles of screened charged colloids: a test of the hard-sphere equation of state'
    href: 'https://doi.org/10.1103/PhysRevLett.71.4267'
  - label: 'Ackland & Jones (2006): Applications of local crystal structure measures in experiment and simulation'
    href: 'https://doi.org/10.1103/PhysRevB.73.054104'
  - label: 'Marechal, Hermes & Dijkstra (2011): Stacking in sediments of colloidal hard spheres'
    href: 'https://doi.org/10.1063/1.3609103'
  - label: 'Annuss, Nienhaus & Lehner (2024): Hard sphere simulations, final report'
    href: 'https://github.com/RnLe/HardSphereSystem'
noveltyNote: >-
  Hard-sphere sedimentation, event-chain Monte Carlo, and grid-based neighbor
  searches are established methods. The contributions are implementations in
  a team project: a Bresenham-style walk through the cell grid for the
  collision search, compared by counting the cells it checks; and gravity and
  fixed walls added as lifting events, checked against the Carnahan–Starling
  equation of state. The crystallization and two-dimensional parts of the
  report are my colleagues’ work.
claimIds:
  - HS-ROLE-001
  - HS-RAY-001
  - HS-CHECK-001
  - HS-SED-001
  - HS-EOS-001
  - HS-TIME-001
mediaIds: []
figureIds:
  - hs-hero-frames
sections:
  - heading: Event-chain Monte Carlo
    paragraphs:
      - >-
        Standard Monte Carlo proposes a small random move and rejects it if two
        spheres would overlap. In a dense packing, most moves are rejected.
        **Event-chain Monte Carlo** rejects no moves: a sphere moves in a
        straight line until it touches another sphere, and that sphere
        continues the remaining distance. One chain moves many spheres, and
        the method still samples the correct equilibrium.
  - heading: Finding the next collision
    figureIds: [hs-cell-grid]
    paragraphs:
      - >-
        Each step of a chain needs the first sphere in the way. Checking all
        pairs of spheres costs time that grows with the square of their
        number. Instead, the box is divided into **cells about one sphere
        wide**, and each sphere is stored in the cell of its centre. A
        collision partner can only be in cells near the path.
  - heading: Searching along the path
    figureIds: [hs-shell-vs-ray]
    paragraphs:
      - >-
        The simple search checks shells of cells around the moving sphere, so
        its cost grows with the searched volume. I adapted **Bresenham’s line
        algorithm**, a standard method from computer graphics, to the
        three-dimensional grid. This ray tracing visits ==only the cells the
        path crosses== and checks their direct neighbors.
  - heading: Cells checked per step
    figureIds: [hs-checked-cells]
    paragraphs:
      - >-
        Counted from geometry, ray tracing adds **nine cells** per step in
        three dimensions. After ten steps, the shell search has checked nearly
        1,400 cells, ray tracing just over 100.
      - >-
        This helps when moves are long, in **dilute systems**. In a dense
        packing, moves end within the first cells, and both searches cost
        about the same.
  - heading: Gravity
    figureIds: [hs-gravity-events]
    paragraphs:
      - >-
        For sedimentation, the box got a fixed floor and ceiling. Gravity
        enters as an **energy budget**: for each upward move, a budget is drawn
        at random, and moving up uses it. When it runs out before a collision,
        a lifting event turns the move downward, as the ceiling does. No move
        is rejected, so the method stays rejection-free.
  - heading: Sedimentation
    figureIds: [hs-bottom-view]
    paragraphs:
      - >-
        With 91,125 spheres, the bottom layers became a ==solid== while the
        top stayed fluid. The transition between them spanned about **three
        layers**. A structure analysis classified each sphere by its
        neighbors: the solid was FCC and HCP crystal, with defects.
      - >-
        A view from below, in a second run with 64,000 spheres, shows small
        crystal patches that grow and merge into larger domains.
  - heading: Validation against the equation of state
    figureIds: [hs-pressure]
    paragraphs:
      - >-
        Before gravity was added, the code had to reproduce the known equation
        of state of hard spheres, the **Carnahan–Starling** equation. It
        matched in the fluid, showed a clear phase transition, and slightly
        overestimated the pressure in the solid.
      - >-
        With gravity, the weight of the spheres above sets the pressure at
        each height, so the pressure follows from the density profile. With
        one reference pressure chosen to match, it follows the equation
        reasonably well, slightly below it, and the phase transition is still
        visible.
  - heading: Crystal growth over time
    figureIds: [hs-structure-evolution]
    paragraphs:
      - >-
        Spheres in **HCP** order appeared first and levelled off after about
        20 frames. **FCC** grew almost linearly and passed HCP after about 90
        frames. FCC was still growing when the run ended. Next steps would be
        longer runs, smoother density profiles, and other strengths of
        gravity.
  - heading: Code
    paragraphs:
      - >-
        The simulation was written in C++ and later ported to Rust. The code
        was lost in a disk failure; the repository keeps the report and its
        figures. We exchanged code as files; one shared repository with
        feature branches would have kept it.
links:
  - label: Repository
    href: 'https://github.com/RnLe/HardSphereSystem'
    kind: source
related:
  - swarm-dynamics
---

Hard spheres are particles that do not attract each other and only collide.
Packed densely enough, they still form crystals, driven by entropy alone. In a
team project of three students, we simulated them with **event-chain Monte
Carlo**: how they crystallize, and how they melt in two dimensions. My parts
were a <mark>faster search for the next collision</mark> and **sedimentation
under gravity**.
