---
id: grounded-recovery
slug: grounded-recovery
title: Grounded Recovery
oneLine: >-
  With a limited budget of expert labels, should a learning agent get more
  demonstrations, or corrections after its own mistakes?
tagline: >-
  `Imitation learning:` are a limited number of expert labels better spent on
  more examples, or on corrections after mistakes?
caseStudyUrl: 'https://rnle.github.io/recovery-policy-learning/'
activity: archived
yearStart: 2026
yearEnd: 2026
kinds:
  - learning
focus:
  learning: 'Imitation learning · DAgger-style corrections · recurrent policies · controlled experiments'
summary: >-
  A hobby project outside university, on a question that comes up whenever a
  machine learns by copying an expert: expert time is scarce, so where should
  a few extra labels go? Into ==more demonstrations==, or into **corrections
  after the learner’s own mistakes**? In a small, controlled maze study with
  matched budgets, corrections came out ahead in ==all six independent runs==
  when the agent was pushed off course in a new way.
placement: research-selected
lifecycle: released
evidenceLevel: empirical-study
statusDate: '2026-09-25'
statusNote: >-
  Released: the study, the technical report, and the website with its seven
  visual lessons are public.
publication: public
sourceVisibility: public
collaborators: []
domain: Imitation learning · robot learning
dateRange: '2026'
methods:
  - Behavioral cloning
  - DAgger-style corrections
  - Recurrent policy
  - Evaluation protocol frozen before testing
  - BabyAI / MiniGrid
applicationThemes:
  - recovery
  - imitation-learning
citations:
  - label: 'Ross, Gordon & Bagnell (2011): A reduction of imitation learning and structured prediction to no-regret online learning (DAgger)'
    href: 'https://proceedings.mlr.press/v15/ross11a.html'
  - label: 'Chevalier-Boisvert et al. (2019): BabyAI: a platform to study the sample efficiency of grounded language learning'
    href: 'https://arxiv.org/abs/1810.08272'
noveltyNote: >-
  No new algorithm is claimed: learning from corrections after mistakes
  (DAgger) is an established idea. The contribution is a carefully matched
  comparison of how to spend a fixed label budget.
claimIds:
  - GR-PRIMARY-001
  - GR-SECONDARY-001
  - GR-COST-001
  - GR-NOVELTY-001
mediaIds: []
figureIds: []
links:
  - label: Website
    href: 'https://rnle.github.io/recovery-policy-learning/'
    kind: site
  - label: Technical report
    href: 'https://rnle.github.io/recovery-policy-learning/reports/Recovery_Policy_Learning_Technical_Report.pdf'
    kind: report
    pages: 15
    sizeMb: 0.7
  - label: Repository
    href: 'https://github.com/RnLe/recovery-policy-learning'
    kind: source
related:
  - recover-in-real-time
  - residual-worlds
---

Grounded Recovery asks a practical question from imitation learning: when expert
labels are limited, which situations are most worth labelling? A learner that
copies an expert does well on the expert's own route, but one wrong action can
take it somewhere no demonstration covers, and small errors then add up.

The study gives two copies of the same trained agent the same number of extra
labels. One gets more demonstrations; the other gets corrections on the states
it reaches after a forced mistake. The full case study, the report, and seven
visual lessons live on the project's own website.
