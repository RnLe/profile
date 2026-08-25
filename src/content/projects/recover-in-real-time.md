---
id: recover-in-real-time
slug: recover-in-real-time
title: Recover in Real Time
oneLine: >-
  How do recovery-focused data and delay-aware execution combine on real
  hardware?
tagline: >-
  A robotic-arm platform, assembled and calibrated, for recovery under delay.
yearStart: 2026
kinds:
  - academic
  - software
  - hardware
summary: >-
  The physical endpoint of my research programme: a two-arm leader–follower
  platform, assembled and calibrated, on which the planned recovery-and-delay
  study will run. Everything shown today is assembly, calibration, and
  teleoperation, explicitly not autonomous execution.
placement: research-selected
lifecycle: prototype
evidenceLevel: hardware-bring-up
statusDate: '2026-08-30'
statusNote: >-
  Robot platform assembled and calibrated; teleoperation demonstrated. The
  camera is not set up yet, and the autonomous recovery-and-delay study is
  pending.
publication: public
sourceVisibility: public
role: >-
  Assembled and calibrated the leader–follower arm pair, built the
  teleoperation and diagnostics workflow, and designed the planned 2×2 study
  of recovery data and delay-aware execution.
collaborators: []
domain: Robot learning · real-time control
dateRange: 2026 – present
methods:
  - Robot assembly & calibration
  - Leader–follower teleoperation
  - Imitation-learning tooling (LeRobot ecosystem)
  - Latency-aware execution design
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
  Teleoperation, ACT-style imitation learning, and delay-compensated execution
  are established techniques. The planned contribution is a controlled 2×2
  study of recovery data and delay-aware execution on accessible hardware; no
  autonomous result exists yet, and none is claimed.
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

Recover in Real Time is the hardware end of the current robot-learning work: a
leader–follower arm pair built from a printed kit, wired, calibrated, and
instrumented for recorded teleoperation. The photographs show the platform as it
actually exists, from the parts on the table to the labelled servo bus boards
that keep the two arms addressable.

What runs today is teleoperation and diagnostics. Both arms move under direct
human control, and episodes are recorded end to end. The camera is not set up
yet. Next come the arena and the external servo, and after that camera and task
qualification. The study the platform was built for is a controlled comparison
between recovery-focused data and delay-aware execution: designed,
preregistered, and not yet run. No policy has been trained, and no timing or
robustness number exists to report.

The build runs in parallel with Grounded Recovery and Residual Worlds. Those two
projects settle the foundations first, recovery data in one and learned dynamics
in the other, so the hardware study can rest on results that are already
understood.
