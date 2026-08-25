---
id: residual-worlds
slug: residual-worlds
title: Residual Worlds
oneLine: >-
  Keep the known rigid-body dynamics and learn only the mismatch, then judge
  the model where it matters, inside MPC.
tagline: >-
  Keep the known physics, learn only the mismatch, then judge it inside MPC.
yearStart: 2026
kinds:
  - academic
  - software
summary: >-
  A controlled test of a simple principle: keep the known physics, learn only
  the residual, and evaluate the learned dynamics model by closed-loop control
  performance rather than prediction error. Simulator and protocol are being
  implemented; calibration and protected evaluation are pending.
placement: research-selected
lifecycle: active-research
evidenceLevel: method-preview
statusDate: '2026-08-30'
statusNote: >-
  Active research: simulator and preregistered protocol are being implemented;
  calibration and protected evaluation are pending. No results exist yet.
publication: public
sourceVisibility: public
role: >-
  I am designing the study, implementing the simulator and the MPC stack, and
  preregistering the evaluation protocol before any model is trained.
collaborators: []
domain: Learned dynamics · model-predictive control
dateRange: 2026 – present
methods:
  - Rigid-body simulation
  - Residual dynamics learning
  - Receding-horizon MPC
  - Preregistered evaluation design
applicationThemes:
  - world-models
  - model-predictive-control
citations:
  - label: 'Zeng et al. (2020): TossingBot (learning residual physics on top of an analytical model)'
    href: 'https://doi.org/10.1109/TRO.2020.2988642'
  - label: 'Ajay et al. (2018): Augmenting physical simulators with stochastic neural networks'
    href: 'https://doi.org/10.1109/IROS.2018.8593995'
  - label: 'Deisenroth & Rasmussen (2011): PILCO: data-efficient model-based policy search'
    href: 'https://dl.acm.org/doi/10.5555/3104482.3104541'
  - label: 'Rawlings, Mayne & Diehl: Model Predictive Control: Theory, Computation, and Design'
    href: 'https://sites.engineering.ucsb.edu/~jbraw/mpc/'
noveltyNote: >-
  Residual modeling is an established method family; this project is a
  controlled data-efficiency and MPC study, not a new algorithm. Its planned
  contribution is the discipline of the comparison, not a method.
claimIds:
  - RW-STATUS-001
  - RW-PRIMARY-001
mediaIds: []
figureIds:
  - two-link-method-preview
links:
  - label: Website
    href: 'https://rnle.github.io/residual-worlds/'
    kind: site
  - label: Repository
    href: 'https://github.com/RnLe/residual-worlds'
    kind: source
related:
  - grounded-recovery
  - recover-in-real-time
  - envelope-approximation
currentState:
  exists: Two-link simulator with parameterized mismatch and the MPC stack, in active development.
  remains: Mismatch calibration, protocol freeze, and the protected evaluation run.
  nextGate: Preregistered protocol locked and calibration closed; only then does evaluation begin.
---

Residual Worlds tests one principle under controlled conditions: keep the
rigid-body dynamics that are already known, learn only the part the model gets
wrong, and judge the result by how well a controller performs with it rather
than by prediction error on held-out trajectories. The setting is a two-link arm
whose target world carries deliberate mass, length, and friction mismatch, with
model-predictive control closing the loop.

The simulator, the residual model, and the MPC stack are being implemented, and
the evaluation protocol is written down before any model is trained. Nothing has
been measured yet: the figure on this page computes the study's setting live and
is a method preview, not a result.
