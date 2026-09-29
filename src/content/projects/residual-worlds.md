---
id: residual-worlds
slug: residual-worlds
title: Residual Worlds
oneLine: >-
  How much of a robot arm’s motion should a neural network learn, when the
  physics is already mostly known?
tagline: >-
  A neural network learns to fix a physics model’s errors, tested by steering
  a simulated robot arm.
activity: active
yearStart: 2026
kinds:
  - robotics
  - learning
focus:
  robotics: 'Robot arm dynamics · model-predictive control · sampling-based planning (CEM)'
  learning: 'Residual dynamics models · MLP ensembles · data efficiency · preregistered evaluation'
summary: >-
  The plan: fix an imperfect physics model of a simulated two-link arm in
  three ways (re-fit its parameters, replace it with a neural network, or
  ==let a network learn only its errors==) and see which one lets a planner
  **steer the arm best from little data**. No results yet.
placement: research-selected
lifecycle: active-research
evidenceLevel: method-preview
statusDate: '2026-08-30'
statusNote: >-
  Active research: the simulator and the study protocol are being built, and
  calibration and the final evaluation come after. No results exist yet.
publication: public
sourceVisibility: public
collaborators: []
domain: Learned dynamics · model-predictive control
dateRange: 2026 – present
methods:
  - PyTorch
  - Residual dynamics
  - Model-predictive control
  - Cross-entropy method
  - Crossed bootstrap
  - Preregistered analysis
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
  Learning a correction on top of a physics model is an established idea. This
  project is a carefully controlled comparison, not a new algorithm; its
  planned contribution is the rigor of that comparison.
claimIds:
  - RW-STATUS-001
  - RW-PRIMARY-001
mediaIds: []
figureIds:
  - rw-preview
links:
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

A simulated **two-link robot arm** must reach three targets in order while
avoiding an obstacle. Its physics are mostly known: gravity, inertia, and how
the two links pull on each other. What the equations miss is
<mark>an unknown payload, sticky friction, and motors that deliver less torque
than commanded</mark>.

A planner (model-predictive control) picks each move by simulating it with a
model, so <mark>every model error becomes a planning error</mark>. With only a
little measured data, the study compares three ways to fix the model: re-fit its
physical parameters, replace it with a neural network, or let a network learn
only what the model gets wrong (the residual). Each is judged by **how often the
arm completes its task**, not by how well it predicts the next step.

The simulator, the models, the planner, and the analysis already run end to end
on a small test setup. The task itself is still being calibrated, so **there
are no results yet**. The analysis rules are fixed before the run, and a null or
opposite result will be reported the same way.
