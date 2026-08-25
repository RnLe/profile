---
id: swarm-dynamics
slug: swarm-dynamics
title: Neural Swarm Dynamics
oneLine: >-
  Can a stochastic neighborhood rule reproduce Vicsek-style collective order,
  and can multi-agent RL learn the same behavior?
tagline: >-
  Sampling a few neighbors reproduced flocking; the RL extension did not.
yearStart: 2023
yearEnd: 2023
kinds:
  - academic
  - software
summary: >-
  Bachelor-thesis research: a stochastic metric-topological neighbor rule
  approximates the Vicsek alignment vector and reproduced its order-parameter
  behavior, which is the thesis contribution. A separate multi-agent RL
  extension ran end to end but did not converge; both outcomes are reported.
placement: academic-archive
lifecycle: archived
evidenceLevel: empirical-study
statusDate: '2026-08-30'
statusNote: >-
  Archived bachelor-thesis research (2023). The sampling result stands on its
  own evidence; the separate MARL training attempt is reported as a negative
  result.
publication: public
sourceVisibility: public
role: >-
  I implemented the C++/OpenMP simulation and its Python bindings, the
  sampling analysis, and the actor–critic multi-agent RL pipeline, and wrote
  the thesis and manuscript.
collaborators: []
domain: Active matter · collective dynamics · multi-agent RL
dateRange: '2023'
methods:
  - Vicsek-class simulation
  - Stochastic neighbor sampling
  - Monte Carlo estimation
  - C++ / OpenMP
  - Actor–critic MARL
applicationThemes:
  - collective-dynamics
  - learned-dynamics
citations:
  - label: 'Vicsek et al. (1995): Novel type of phase transition in a system of self-driven particles'
    href: 'https://doi.org/10.1103/PhysRevLett.75.1226'
  - label: 'Ballerini et al. (2008): Interaction ruling animal collective behavior depends on topological rather than metric distance'
    href: 'https://doi.org/10.1073/pnas.0711437105'
  - label: 'Chaté et al. (2008): Collective motion of self-propelled particles interacting without cohesion'
    href: 'https://doi.org/10.1103/PhysRevE.77.046113'
  - label: 'Lowe et al. (2017): Multi-agent actor–critic for mixed cooperative-competitive environments'
    href: 'https://arxiv.org/abs/1706.02275'
noveltyNote: >-
  The contribution is the stochastic metric-topological neighbor rule and the
  finding that a small random neighbor sample reproduces the alignment behavior
  of the full rule. Vicsek alignment itself is established, and the estimator
  statement is registered with its scope. The MARL extension is reported exactly
  as it ended: an unsuccessful training attempt.
claimIds:
  - BA-MC-001
  - BA-MARL-001
mediaIds: []
figureIds:
  - ba-hero-panels
links:
  - label: Repository
    href: 'https://github.com/RnLe/bachelor_thesis23'
    kind: source
related:
  - residual-worlds
---

My bachelor thesis asked whether flocking survives when each particle aligns
with a random sample of its neighbors instead of all of them. The rule I built
mixes a metric radius with topological selection and then subsamples: it is a
Monte Carlo estimator of the Vicsek alignment vector, implemented as a C++ and
OpenMP simulation with Python bindings. It worked. A small random sample
reproduced the order-parameter behavior of full alignment, which is the positive
result of the thesis and the part I consider its contribution. The animation
shows the three neighbor rules side by side under identical conditions, with the
sampled rule in the middle.

The second half did not work, and it is reported here as plainly as the first.
A multi-agent actor-critic extension was meant to learn the same collective
behavior from scratch; it ran end to end but never converged to ordered motion.
The two outcomes are independent: the sampling result stands on its own
evidence, and the reinforcement-learning attempt is a negative result that does
not qualify it.
