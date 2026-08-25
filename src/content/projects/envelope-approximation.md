---
id: envelope-approximation
slug: envelope-approximation
title: Envelope Approximation for Photonic Moiré Crystals
oneLine: >-
  Can a two-scale envelope theory make moiré photonic band structures
  computable where direct solvers become infeasible?
tagline: >-
  A two-scale theory for twisted photonic crystals, rebuilt after its own audit.
yearStart: 2025
kinds:
  - academic
  - software
summary: >-
  My M.Sc. research developed a multiband two-scale envelope theory for
  twisted photonic crystals. A post-thesis audit exposed invalid comparisons
  in the submitted validation; I am rebuilding the model and evaluation
  against independently converged references.
placement: research-selected
lifecycle: research-continuation
evidenceLevel: method-preview
statusDate: '2026-08-30'
statusNote: >-
  The submitted thesis is archived unchanged. A post-thesis audit identified a
  numerical-floor issue in the submitted validation; the theory and evaluation
  are being rebuilt against independently converged full-wave references.
publication: public
sourceVisibility: mixed
role: >-
  I derived the two-scale theory, implemented the research pipeline behind it,
  and am now conducting the post-thesis audit and rebuild. The work was my
  supervised M.Sc. research at TU Dortmund University.
collaborators: []
domain: Theoretical & computational photonics · multiscale analysis
dateRange: 2025 – 2026 · continuation active
methods:
  - Two-scale expansion
  - Multiband envelope approximation
  - Effective Hamiltonians
  - Berry connections
  - Löwdin partitioning
  - Maxwell eigenproblems
applicationThemes:
  - structured-modeling
  - numerical-validation
citations:
  - label: 'Bistritzer & MacDonald (2011): Moiré bands in twisted double-layer graphene (the continuum-model lineage this work adapts)'
    href: 'https://doi.org/10.1073/pnas.1108174108'
  - label: 'Lopes dos Santos, Peres & Castro Neto (2007): Graphene bilayer with a twist: electronic structure'
    href: 'https://doi.org/10.1103/PhysRevLett.99.256802'
  - label: 'Du, Dai & Sun (2023): Moiré photonics and optoelectronics (survey of the photonic moiré setting)'
    href: 'https://doi.org/10.1126/science.adg0014'
  - label: 'Johnson & Joannopoulos (2001): the MPB plane-wave reference solver used for local Bloch data'
    href: 'https://doi.org/10.1364/OE.8.000173'
noveltyNote: >-
  The construction adapts established envelope-function and continuum-model
  ideas from electronic moiré systems to the 2D Maxwell eigenproblem. The
  submitted thesis's validation conclusions are under audit and are
  deliberately not restated here; no corrected result is claimed until the
  continuation passes its own validation gate.
claimIds:
  - MSL-THESIS-001
  - MSL-CONT-001
mediaIds: []
figureIds:
  - moire-construction
  - moire-scaling
  - moire-geometry-explorer
links:
  - label: MSL framework source
    href: 'https://github.com/RnLe/msl'
    kind: source
related:
  - blaze2d
  - residual-worlds
currentState:
  exists: The derivation, the public MSL geometry/envelope machinery, and the Blaze2D solver feeding it local Bloch data.
  remains: Independently converged references, a predeclared comparison domain, and the frozen evaluation run.
  nextGate: A frozen model-vs-independent-reference figure on a predeclared domain, with convergence evidence and traceable data.
---

Twisting two photonic crystals against each other creates a moiré lattice whose
unit cell grows without bound as the twist angle shrinks, so a direct solver
runs out of memory exactly where the physics becomes interesting. My M.Sc.
research derived a two-scale envelope theory for that regime: the field is
factored into fast Bloch oscillations and a slowly varying envelope, and the
Maxwell operator is projected onto a finite band subspace to give an effective
description on the moiré scale. The geometry and envelope machinery live in the
public MSL framework, and the local Bloch data come from
[Blaze2D](/projects/blaze2d/), which I wrote for that throughput problem.

The submitted thesis is archived unchanged. A post-thesis audit of my own
validation found invalid comparisons in it, so the theory and its evaluation are
being rebuilt against independently converged references. That continuation is a
separate line of work and claims nothing until it passes its own validation
gate.
