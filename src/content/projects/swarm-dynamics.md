---
id: swarm-dynamics
slug: swarm-dynamics
title: Neural Swarm Dynamics
oneLine: >-
  Can agents that each read only a few randomly drawn neighbors still form one
  swarm, and can multi-agent reinforcement learning teach them to?
tagline: >-
  An attempt to form swarms with multi-agent reinforcement learning, and a
  neural-network-friendly Monte Carlo rule.
listLabel: Bachelor Thesis
activity: archived
yearStart: 2023
yearEnd: 2023
kinds:
  - learning
  - theory
focus:
  learning: 'Multi-agent reinforcement learning · actor–critic (DDPG) · reward design'
  theory: 'Statistical physics (Vicsek model) · Monte Carlo estimation · order parameters · convergence analysis'
summary: >-
  My bachelor thesis tried to let a swarm form through **multi-agent
  reinforcement learning**, where every particle learns how to steer. To give
  each agent a fixed-size input, a ==Monte Carlo neighbor rule== lets it read
  only a few randomly drawn neighbors, and that rule on its own closely
  matched the classic Vicsek model. The learning ran end to end but ==never
  learned to swarm==.
placement: academic-archive
lifecycle: archived
evidenceLevel: empirical-study
statusDate: '2026-08-30'
statusNote: >-
  Archived bachelor thesis (2023). The sampling result stands on its own
  evidence; the reinforcement-learning attempt is reported as a negative
  result.
publication: public
sourceVisibility: public
collaborators: []
domain: Active matter · collective dynamics · multi-agent RL
dateRange: '2023'
methods:
  - Vicsek model
  - Monte Carlo sampling
  - C++ / OpenMP
  - Multi-agent reinforcement learning
  - Actor–critic (DDPG)
  - TF-Agents
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
  The contribution is the random-sampling neighbor rule and the finding that a
  small random sample reproduces the alignment behavior of the full rule.
  Vicsek alignment itself is established, and the precise statement about the
  estimator is registered with its scope. The reinforcement-learning extension
  is reported exactly as it ended: an unsuccessful training attempt.
claimIds:
  - BA-MC-001
  - BA-CONV-001
  - BA-MARL-001
mediaIds: []
figureIds:
  - ba-hero-panels
sections:
  - heading: Sample your neighbors
    figureIds: [ba-neighbor-rule]
    claimIds: [BA-MC-001]
    paragraphs:
      - >-
        A fixed number of neighbors is what real flocks seem to track,
        and it is what a neural network needs as input. But the purely
        topological rule, the **k nearest agents**, fails here: in dense
        spots the nearest agents are all very close, so
        the interaction becomes short-ranged and the swarm ==falls apart
        into tiny packets==.
      - >-
        The rule I introduced keeps the radius, then ==draws k neighbors
        at random from everyone inside it==, anew for every agent at
        every step. The sampled mean of the headings’ sine and cosine is
        an **unbiased Monte Carlo estimate** of the mean over the whole
        neighborhood, with k as the sample size.
  - heading: Why random draws work
    figureIds: [ba-radial-quantiles]
    paragraphs:
      - >-
        Seen from one agent, its neighborhood is a histogram of
        headings. With room for only k inputs, a sensible compression
        splits it into ==k regions that hold equally many agents== and
        averages each one. Computing those regions at every step is
        expensive; random draws get the same effect statistically,
        because over many steps ==they hit every region equally often==.
  - heading: Streams instead of fragments
    figureIds: [ba-snapshots]
    paragraphs:
      - >-
        Under the topological rule the swarm stays scattered in small
        packets. Under the sampled rule, although every agent reads only
        k neighbors per step, the swarm forms ==large, stream-like
        structures== that resemble the metric Vicsek reference.
      - >-
        One difference remains: for small k, the sharp, vortex-like
        turns of the Vicsek model are smoothed out, because an agent
        cannot take in every direction in a single step.
  - heading: Converging to the Vicsek model
    figureIds: [ba-convergence]
    paragraphs:
      - >-
        With every candidate kept, the rule is exactly the Vicsek model,
        so it has to converge as k grows; the Monte Carlo view predicts
        that it does so fast. The **order parameter**, a measure of how
        aligned the whole swarm is, confirms it: the deviation from the
        Vicsek reference ==shrinks quickly with k== and is barely
        visible at k = 6.
  - heading: How fast
    figureIds: [ba-mse]
    claimIds: [BA-CONV-001]
    paragraphs:
      - >-
        The mean squared deviation condenses each curve into one number
        per system size. Larger systems converge a little more slowly at
        the same density.
  - heading: Learning the rule instead
    figureIds: [ba-marl-setup]
    paragraphs:
      - >-
        The second part turned the question around: instead of writing a
        local rule, define a ==global goal== and let the agents learn
        how to reach it. The order parameter is a natural reward, and
        the fixed k of the sampled rule gives every agent **an
        observation of constant size**.
      - >-
        The C++ simulation became a learning environment: each agent
        observes the headings of its k sampled neighbors, acts by
        choosing a new heading, and is ==rewarded by the change in the
        order parameter==.
  - heading: Choosing an algorithm
    figureIds: [ba-rl-venn]
    paragraphs:
      - >-
        A heading is a continuous action, which narrows the choice to
        methods such as DDPG, TD3, PPO, or SAC. The thesis used ==DDPG,
        an actor–critic method==, with TF-Agents: an **actor** proposes
        the action, and a **critic** estimates how good it is.
  - heading: The networks
    figureIds: [ba-critic]
    paragraphs:
      - >-
        The actor was kept minimal, a single dense layer, because the
        target behavior, the Vicsek average, is itself a simple function
        of the neighbors’ headings. The **critic**, shown here, takes
        the observation and the action and returns one value. A second
        attempt used one agent per particle with a shared policy in
        RLlib.
  - heading: What came out of it
    claimIds: [BA-MARL-001]
    paragraphs:
      - >-
        The pipeline ran end to end and training proceeded, but ==no
        interpretable policy== came out of it. The main suspect is the
        angle: a heading wraps around at 2π, and as a plain number it
        jumps there, a discontinuity the small networks did not overcome
        in the time available. The RLlib attempt failed earlier, at
        training launch.
      - >-
        The natural next experiment: encode the heading as its **sine
        and cosine**, and test whether a single-layer network can learn
        the averaging rule.
links:
  - label: Repository
    href: 'https://github.com/RnLe/bachelor_thesis23'
    kind: source
related:
  - residual-worlds
---

Birds, fish, and many other animals move in groups without a leader: each one
only reacts to the neighbors around it. The Vicsek model captures this with
simple particles that <mark>turn toward the average heading of everyone within a
radius</mark>, plus some noise. My bachelor thesis asked two questions: does a
swarm still form when each particle reads **only k randomly drawn neighbors**,
and can the rule be <mark>learned with multi-agent reinforcement learning</mark>
instead of written by hand?
