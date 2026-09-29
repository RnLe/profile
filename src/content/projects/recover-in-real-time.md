---
id: recover-in-real-time
slug: recover-in-real-time
title: Recover in Real Time
oneLine: >-
  On a real robot arm: do demonstrations of recovering from mistakes help, and
  does the robot still act smoothly when its decisions arrive late?
tagline: >-
  Two robot arms I assembled for a study on recovering from mistakes and
  delays; so far only human-controlled.
activity: active
yearStart: 2026
kinds:
  - robotics
  - learning
focus:
  robotics: 'Robot arms (SO-ARM101) · leader–follower teleoperation · servo calibration · real-time control'
  learning: 'Imitation learning · action chunking · recovery data · inference delay'
summary: >-
  The plan: a learned controller ==pushes a puck through a gate== while a
  deliberate push and a delay cause mistakes. The study asks whether
  **demonstrations of recovering from mistakes** are worth more than extra
  normal runs, and whether the arm still moves smoothly when ==its controller
  answers late==.
placement: research-selected
lifecycle: prototype
evidenceLevel: hardware-bring-up
statusDate: '2026-08-30'
statusNote: >-
  Both arms are assembled and calibrated, and control by a person
  (teleoperation) works. The camera is not set up yet, and the study itself
  has not been run.
publication: public
sourceVisibility: public
collaborators: []
domain: Robot learning · real-time control
dateRange: 2026 – present
methods:
  - LeRobot ecosystem
  - SO-ARM101
  - Teleoperation
  - Imitation learning
  - Action chunking
  - Delay-aware execution
applicationThemes:
  - physical-systems
  - real-time-control
  - recovery
citations:
  - label: 'Zhao et al. (2023): Learning fine-grained bimanual manipulation with low-cost hardware (ACT)'
    href: 'https://arxiv.org/abs/2304.13705'
  - label: 'Ross, Gordon & Bagnell (2011): DAgger: reduction of imitation learning to no-regret online learning'
    href: 'https://arxiv.org/abs/1011.0686'
  - label: 'Ramstedt & Pal (2019): Real-time reinforcement learning: acting under one-step delay'
    href: 'https://arxiv.org/abs/1911.04448'
  - label: 'Cadene et al.: LeRobot (open-source robot learning tooling)'
    href: 'https://github.com/huggingface/lerobot'
noveltyNote: >-
  Controlling a robot by hand, learning from demonstrations, and compensating
  for delays are established techniques. The planned contribution is a careful
  comparison of recovery data and delay-aware execution on affordable
  hardware.
claimIds:
  - RIR-HW-001
  - RIR-CONTROLMODE-001
mediaIds: []
figureIds:
  - rir-arm
  - rir-build
links:
  - label: Repository
    href: 'https://github.com/RnLe/real-time-robot-recovery'
    kind: source
related:
  - residual-worlds
  - grounded-recovery
currentState:
  exists: Both arms assembled, wired, and calibrated; leader–follower teleoperation and episode recording work end to end.
  remains: Arena and external servo assembly, camera setup and task qualification, dataset collection, policy training, and the autonomous recovery-and-delay evaluation.
  nextGate: Arena and external servo assembled, then camera and task qualification on the fixed rig, with dated receipts.
---

Two small robot arms from a Waveshare SO-ARM101 kit, built from 3D-printed
parts: a <mark>leader arm</mark> that a person moves by hand, and a
<mark>follower arm</mark> that copies it. This is how the demonstrations will be
recorded. So far, **every motion is controlled by a person**; no controller has
been trained yet.

The planned task: the follower arm <mark>pushes a puck through a gate</mark>,
while **a controlled sideways push and a controlled delay** cause mistakes it
can still recover from.
