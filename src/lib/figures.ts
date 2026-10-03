/**
 * Figure registry: maps a project's `figureIds` to what actually renders:
 * an owned evidentiary image, a trusted local SVG, an interactive island, or
 * an asset placeholder (aspect-correct, uniquely identified, visibly not a
 * result; release validation fails while any placeholder remains).
 *
 * Astro-only module (image imports); node-side validators do not import it,
 * ProjectLayout fails the build on an unknown figureId instead.
 */
import type { ImageMetadata } from 'astro';
import moireLoop from '../assets/thesis/moire-dots-loop.webp';
import moireScaling from '../assets/thesis/moire_scaling_and_ram.svg';
import registryMap from '../assets/envelope/registry-map.svg';
import operatorStack from '../assets/envelope/operator-stack.svg';
import convergenceFigure from '../assets/envelope/convergence.svg';
import stateLadder from '../assets/envelope/state-ladder.svg';
import squareBilayer from '../assets/envelope/square-bilayer.svg';
import teHamiltonian from '../assets/envelope/te-hamiltonian.svg';
import tmHamiltonian from '../assets/envelope/tm-hamiltonian.svg';
import bandLoop from '../assets/blaze2d/band-diagram-loop.webp';
import mpbOverlay from '../assets/blaze2d/mpb-overlay.svg';
import workbench from '../assets/blaze2d/workbench.webp';
import { blazeScaleAsOf } from '../data/blaze-scale';
import electronicPhotonic from '../assets/blaze2d/electronic-photonic.webp';
import lobpcgStep from '../assets/blaze2d/lobpcg-step.svg';
import swarmComparison from '../assets/swarm-dynamics/neighbor-rule-comparison.webp';
import neighborRules from '../assets/swarm-dynamics/neighbor-rules.webp';
import radialQuantiles from '../assets/swarm-dynamics/radial-quantiles.webp';
import swarmSnapshots from '../assets/swarm-dynamics/snapshots.webp';
import convergence from '../assets/swarm-dynamics/convergence-to-vicsek.svg';
import mseVsK from '../assets/swarm-dynamics/mse-vs-k.svg';
import marlSetup from '../assets/swarm-dynamics/marl-setup.svg';
import rlVenn from '../assets/swarm-dynamics/rl-algorithms-venn.svg';
import criticNetwork from '../assets/swarm-dynamics/critic-network.webp';
import sedimentationFrames from '../assets/hard-spheres/sedimentation-frames.webp';
import cellGrid from '../assets/hard-spheres/cell-grid.svg';
import shellVsRay from '../assets/hard-spheres/shell-vs-ray.svg';
import checkedCells from '../assets/hard-spheres/checked-cells.svg';
import gravityEvents from '../assets/hard-spheres/gravity-events.svg';
import bottomView from '../assets/hard-spheres/bottom-view.webp';
import pressureVsPacking from '../assets/hard-spheres/pressure-vs-packing.svg';
import structureEvolution from '../assets/hard-spheres/structure-evolution.svg';
import modelVsMotion from '../assets/residual-worlds/model-vs-motion.webp';
import robotArm from '../assets/recover-in-real-time/arm.webp';
import assemblyKit from '../assets/recover-in-real-time/assembly-kit.webp';
import followerLabels from '../assets/recover-in-real-time/follower-labels.webp';
import servoBuses from '../assets/recover-in-real-time/servo-buses.webp';

export type FigureDef =
  | {
      kind: 'placeholder';
      assetId: string;
      spec: string;
      ratio: string;
      title: string;
      caption: string;
    }
  | {
      kind: 'image';
      src: ImageMetadata;
      alt: string;
      title?: string;
      caption?: string;
      widths?: number[];
      /** Served untouched: the image service would flatten an animation. */
      animated?: boolean;
      /** Too wide for a side column: a case-study section shows it full width. */
      wide?: boolean;
    }
  | {
      kind: 'gallery';
      items: Array<{ src: ImageMetadata; alt: string; caption?: string }>;
      title?: string;
      caption?: string;
    }
  | {
      /**
       * A figure drawn by a component of its own: the Blaze2D roadmap
       * (StageRoadmap), the accuracy and speed comparisons of the Blaze2D
       * pitch page (BlazeAccuracy, BlazeSpeed), and its scale (BlazeScale);
       * the plots of the facial emotion study (src/components/fer, `fer-*`).
       */
      kind: 'component';
      component: 'blaze-roadmap' | 'blaze-accuracy' | 'blaze-speed' | 'blaze-scale' | 'msc-operators' | `fer-${string}`;
      wide?: boolean;
      caption?: string;
    }
  | {
      kind: 'island';
      island: 'moire-builder';
      title?: string;
      caption?: string;
      /** Visible label required for method previews. */
      previewLabel?: string;
      fallbackText: string;
      wide?: boolean;
    };

const fer = (component: `fer-${string}`, caption: string, wide = true): FigureDef => ({ kind: 'component', component, caption, wide });

export const figures: Record<string, FigureDef> = {
  /* ------------------------------------------ Facial emotion recognition --- */
  'fer-pipeline': fer('fer-pipeline', 'The five parts of the study. Each card opens its tab.'),
  'fer-classes': fer('fer-classes', 'Training faces per emotion. RAF-DB adds the most where FER2013 is thinnest.'),
  'fer-cleaning': fer('fer-cleaning', 'Faces removed in cleaning, by reason, from both datasets.', false),
  'fer-samples': fer('fer-samples', 'Random training faces from FER2013, 48 × 48 pixels. RAF-DB images are not shown: they may not be redistributed.', false),
  'fer-arch-gain': fer('fer-arch-gain', 'Test accuracy with default settings (ring) and after tuning (dot), mean of the final runs. The number is the gain from tuning, in points.'),
  'fer-curves': fer('fer-curves', 'Training curves with default settings, mean of two seeds. Augmentation, label smoothing and a decaying learning rate keep the validation loss from turning up.'),
  'fer-confusion': fer('fer-confusion', 'Test set, in % of each true emotion. Disgust and fear are the hardest classes for every model.'),
  'fer-size-acc': fer('fer-size-acc', 'Parameters against test accuracy after tuning.', false),
  'fer-trials': fer('fer-trials', 'Every trial of the first tuning stage: validation macro-F1 after 25 epochs. Rings: random start; dots: TPE; diamond: default settings.'),
  'fer-importance': fer('fer-importance', 'fANOVA importance: the share of the spread in trial scores explained by each setting, in %.', false),
  'fer-shape': fer('fer-shape', 'The second tuning stage: width, depth and number of stages join the search for the three winners.', false),
  'fer-long': fer('fer-long', 'Validation accuracy at a constant learning rate. Right edge: test accuracy after a 10-epoch cooldown, which decays the learning rate to zero (warmup-stable-decay).'),
  'fer-overfit': fer('fer-overfit', 'Overfitting by design: VGG trained without augmentation, label smoothing or dropout. Training accuracy and loss on fixed training faces.'),
  'fer-grok': fer('fer-grok', 'Simple CNN on 1,000 training faces, MSE loss, AdamW, after Omnigrok (Liu et al. 2023). Dashed: training accuracy; solid: validation accuracy.'),
  'fer-nc1': fer('fer-nc1', 'Neural collapse (Papyan et al. 2020): the spread of features within a class against the spread between classes. It falls while validation accuracy rises late.', false),
  'fer-spikes': fer('fer-spikes', 'VGG with batch norm, trained 1,000 epochs past memorising. The spikes match the periodic behaviour of batch norm with weight decay (Lobacheva et al. 2021).'),
  'fer-slingshot': fer('fer-slingshot', 'VGG without batch norm on 1,000 faces. Dashed lines in the lower panel mark the jumps, the slingshot pattern of Adam (Thilak et al. 2022).'),
  'fer-tradeoff-resnet': fer('fer-tradeoff-resnet', 'ResNet-18. Dashed: one threshold for all layers, no fine-tuning. Solid: ranks chosen per layer, then 10 epochs of repair. Crosses: int8. Squares: same size, trained from scratch.'),
  'fer-tradeoff-vgg': fer('fer-tradeoff-vgg', 'VGG, same routes.', false),
  'fer-tradeoff-densenet': fer('fer-tradeoff-densenet', 'DenseNet, same routes.', false),
  'fer-spectra': fer('fer-spectra', 'Cumulative share of variance kept by the leading directions of two VGG layers.', false),
  'fer-speed': fer('fer-speed', 'Times faster than the uncompressed model for one face. Medians, eager PyTorch, fp32 except int8.'),
  'fer-scratch': fer('fer-scratch', 'Test accuracy at the same size: trained small from scratch (60 epochs) against compressed and repaired.', false),
  'fer-repair': fer('fer-repair', 'Validation accuracy of every compressed model before and after 10 epochs of repair.', false),

  /* ------------------------------------------------------------ Blaze2D --- */
  'blaze-bands': {
    kind: 'image',
    src: bandLoop,
    alt: 'A photonic band diagram computed with Blaze2D for a hexagonal lattice of air holes in a dielectric: TE bands in orange and TM bands in blue, drawn along the path from Γ through M and K back to Γ, with the complete band gap shaded',
    caption: 'Band diagram computed with Blaze2D: a hexagonal lattice of air holes, ε = 13, radius 0.48a.',
    animated: true,
  },
  // The introduction figure of the Blaze2D website (web/public/figures/intro).
  'blaze-crystals': {
    kind: 'image',
    src: electronicPhotonic,
    alt: 'An electronic crystal and a photonic crystal side by side: graphene’s honeycomb of carbon atoms with the Schrödinger equation, and a honeycomb of air holes in a dielectric with the photonic master equation',
    caption: 'The same idea in two settings: electrons in graphene, light in a honeycomb of air holes.',
  },
  // The band-diagram comparison of the Blaze2D manuscript (paper/figures).
  'blaze-mpb-overlay': {
    kind: 'image',
    src: mpbOverlay,
    alt: 'Band diagrams of a square lattice of dielectric rods from MPB (solid) and Blaze2D (dashed), TM on the left and TE on the right; the two coincide except for the topmost TE band',
    caption:
      'Square lattice of rods (ε = 8.9, radius 0.2a), ten lowest bands. The topmost TE band differs where MPB follows a band through an avoided crossing and Blaze2D reports the lowest eigenvalues.',
    wide: true,
  },
  // The eigensolver figure of the Blaze2D manuscript (paper/figures).
  'blaze-lobpcg': {
    kind: 'image',
    src: lobpcgStep,
    alt: 'One step of the block eigensolver: blocks of eigenvector candidates, search directions, and preconditioned residuals, projected by Rayleigh–Ritz onto a small dense eigenproblem',
    caption: 'One step of the block eigensolver (LOBPCG): three blocks of trial vectors, projected onto a small dense problem.',
  },
  // The Workbench card of the Blaze2D website (web/public/banners).
  'blaze-workbench': {
    kind: 'image',
    src: workbench,
    alt: 'The Blaze2D Workbench in a browser window: a square lattice of holes in its geometry view, with lattice, material, and calculation settings in the sidebar',
  },
  'blaze-scale': {
    kind: 'component',
    component: 'blaze-scale',
    caption: `As of ${blazeScaleAsOf}.`,
  },
  'blaze-roadmap': {
    kind: 'component',
    component: 'blaze-roadmap',
    wide: true,
  },
  // The two comparisons of the Blaze2D pitch page, redrawn from its data.
  'blaze-accuracy': {
    kind: 'component',
    component: 'blaze-accuracy',
    caption:
      'Square lattice of rods (ε = 8.9, radius 0.2a), 32 × 32 grid, ten bands; Blaze in mixed precision.',
  },
  'blaze-speed': {
    kind: 'component',
    component: 'blaze-speed',
    caption:
      'Recorded 16-thread parameter sweeps, 64 × 64 grid, eight bands. MPB threads each solve; Blaze runs independent configurations in parallel.',
  },

  /* ----------------------------------------------- Envelope approximation --- */
  'moire-loop': {
    kind: 'image',
    src: moireLoop,
    alt: 'Two lattices of blue and orange sites, one slowly turning against the other; a large hexagonal moiré pattern forms and dissolves as the twist changes',
    caption: 'Two lattices, one turning: the moiré pattern grows and shrinks with the twist.',
    animated: true,
  },
  'moire-builder': {
    kind: 'island',
    island: 'moire-builder',
    fallbackText:
      'The interactive builder needs JavaScript. In short: two identical lattices twisted by a small angle θ form a moiré pattern with period L = a / (2 sin(θ/2)), about 29 lattice spacings at 2°.',
    wide: true,
  },
  // The first-edition cost estimate: cell size, memory and time against angle.
  'moire-scaling': {
    kind: 'image',
    src: moireScaling,
    alt: 'Two panels: the number of monolayer cells in a commensurate supercell growing as one over the twist angle squared, and the estimated memory and compute time of direct solvers rising steeply towards small angles',
    caption: 'Estimated supercell size, memory, and compute time of direct solvers across the twist angle.',
  },
  // The manuscript's registry map (master-thesis/manuscript/figures/src).
  'msc-registry-map': {
    kind: 'image',
    src: registryMap,
    alt: 'A moiré unit cell with three marked positions, and the local two-layer crystal at each: the same two circles, shifted against each other by a different registry at each position',
    caption: 'Every position in the moiré cell has its own local crystal: the same two layers, shifted by the registry δ.',
    wide: true,
  },
  'msc-operators': {
    kind: 'component',
    component: 'msc-operators',
  },
  // The second-edition figures of the Blaze2D thesis page (web/public/figures/thesis).
  'msc-operator-stack': {
    kind: 'image',
    src: operatorStack,
    alt: 'Ten registry maps stacked above a honeycomb moiré cell: the two Dirac bands, their gap, group velocity, Berry connection and curvature, two kinetic mass maps, and the Born–Huang correction',
    caption:
      'Ten datasets for one honeycomb crystal (TM, a pair of Dirac bands) from a 48 × 48 registry sweep. Stacked for display; not physical layers.',
  },
  'msc-convergence': {
    kind: 'image',
    src: convergenceFigure,
    alt: 'Logarithmic plot of the envelope model’s frequency error against the scale ratio: a frozen frame and a registry-adapted frame at fixed material level off, while the adapted frame with the second layer scaled falls steeply to the references’ own agreement',
    caption:
      'Error against the scale ratio η: frozen frame, registry-adapted frame at fixed material, and with the second layer scaled as η². The dotted line marks how closely the two references agree.',
  },
  'msc-state-ladder': {
    kind: 'image',
    src: stateLadder,
    alt: 'Spectral ladders for all 51 states in the declared window from the finite-difference reference, a fixed-frame envelope model, and the exact-frame envelope model, with the per-state deviation on logarithmic axes',
    caption:
      'Each rung is one allowed frequency; the right panel shows each state’s deviation. The exact-frame model recovers all 51 states; the fixed-frame model does not.',
  },
  'msc-square-bilayer': {
    kind: 'image',
    src: squareBilayer,
    alt: 'Spectral ladders of the square rod bilayer at five twist angles from MPB, the finite-difference reference, and the envelope model, with the errors below; the two smallest angles have envelope results only',
    caption:
      'The square bilayer at five angles. The lowest state agrees; the groups of four remain split. The two smallest angles have envelope results only.',
  },

  /* ------------------------------------------------------ Residual Worlds --- */
  'rw-preview': {
    kind: 'image',
    src: modelVsMotion,
    alt: 'Method preview, not a result: a simulated two-link arm (solid) and the physics model’s prediction from 0.3 s earlier (faded); the gap between the two hands is the residual, traced per joint in a strip below',
    animated: true,
  },

  /* -------------------------------------------------- Recover in Real Time --- */
  'rir-arm': {
    kind: 'image',
    src: robotArm,
    alt: 'The assembled follower arm: a printed six-joint arm with a two-finger gripper, wired and standing on a desk',
    caption: 'The assembled SO-ARM101 follower arm.',
    widths: [400, 800],
  },
  'rir-build': {
    kind: 'gallery',
    items: [
      {
        src: assemblyKit,
        alt: 'Printed arm parts, servos, power supplies, a USB hub, cameras, clamps and a screwdriver set laid out on a table',
      },
      {
        src: followerLabels,
        alt: 'Six small paper labels marked F1 to F6 for the follower arm servos',
      },
      {
        src: servoBuses,
        alt: 'Two servo bus driver boards, one labelled LEADER and one labelled FOLLOWER',
      },
    ],
  },

  /* -------------------------------------------------------- Swarm dynamics --- */
  // From the thesis repository (docs/media, the thesis and the manuscript).
  'ba-hero-panels': {
    kind: 'image',
    src: swarmComparison,
    alt: 'Three swarm simulations side by side from the same disordered start: under the topological rule the agents stay scattered in tiny pairs, under the sampled metric-topological rule and the metric Vicsek reference they form large streams',
    animated: true,
  },
  'ba-neighbor-rule': {
    kind: 'image',
    src: neighborRules,
    alt: 'The same neighborhood under three rules: the metric rule links everyone inside the radius, the topological rule spends its four links on one tight cluster, and the metric-topological rule draws four at random from inside the radius',
    wide: true,
  },
  'ba-radial-quantiles': {
    kind: 'image',
    src: radialQuantiles,
    alt: 'A radial histogram of the headings one agent sees, and the same histogram split into eight regions that each hold the same number of agents',
    caption: 'Conceptual, on synthetic data.',
  },
  'ba-snapshots': {
    kind: 'image',
    src: swarmSnapshots,
    alt: 'Snapshots of the three rules at three noise levels: the topological rows break into small packets, while the sampled rule forms large streams like the metric Vicsek reference',
    caption: 'N = 400 agents at density 4, after a few simulation steps; k applies to the upper two rows.',
  },
  'ba-convergence': {
    kind: 'image',
    src: convergence,
    alt: 'Order parameter versus noise for k = 1 to 6 and four system sizes; the shaded deviation from the Vicsek reference shrinks as k grows and is barely visible at k = 6',
  },
  'ba-mse': {
    kind: 'image',
    src: mseVsK,
    alt: 'Mean squared deviation from the Vicsek reference versus k for four system sizes, falling steeply, and the same data on log-log axes with a linear fit per system size',
    caption: 'Right: log-log fits (“Steigung” is German for slope).',
    wide: true,
  },
  'ba-marl-setup': {
    kind: 'image',
    src: marlSetup,
    alt: 'Diagram of the multi-agent reinforcement-learning setup, labelled in German: agents take actions in an environment, and observations and rewards flow back to actor and critic networks',
    caption:
      'As drawn for the thesis, in German: Agenten are the agents, Aktionen their actions, Umgebung the environment, Beobachtungen observations, Belohnung the reward.',
  },
  'ba-rl-venn': {
    kind: 'image',
    src: rlVenn,
    alt: 'Venn diagram of reinforcement-learning algorithm families, labelled in German: value-based methods (DQN, C51), policy-based and policy-gradient methods (REINFORCE), and the actor-critic methods DDPG, PPO, TD3 and SAC where they overlap',
    caption: 'From the thesis, in German: value-based methods on the left, policy-based on the right, actor-critic where they overlap.',
  },
  'ba-critic': {
    kind: 'image',
    src: criticNetwork,
    alt: 'The critic network: the observation and the action each pass through dense layers, merge, and end in a single Q-value',
  },

  /* --------------------------------------------------------- Hard spheres --- */
  // From the team's final report (sections 3 and 8) and its repository's
  // plots; the vector figures are cut from the report PDF itself. The frames
  // are the report's six snapshots of the 64,000-sphere run, each shown
  // as it is, never blended into the next.
  'hs-hero-frames': {
    kind: 'image',
    src: sedimentationFrames,
    alt: 'Six snapshots of a box of 64,000 hard spheres: at frame 0 a regular lattice fills the box; from frame 10 on the spheres have sunk to the bottom, where layers of green and red crystal grow under a gray fluid',
    caption: 'The run with 64,000 spheres, one frame per million chains. Green: FCC crystal, red: HCP, gray: no crystal order.',
    animated: true,
  },
  'hs-cell-grid': {
    kind: 'image',
    src: cellGrid,
    alt: 'A grid of square cells with spheres on it; the cells that hold a sphere’s centre are blue, although several spheres reach into neighboring cells',
  },
  'hs-shell-vs-ray': {
    kind: 'image',
    src: shellVsRay,
    alt: 'Two grids side by side. Left, the naïve method: a circle around the start cell, as wide as the chain vector, fills a large square of orange cells. Right, ray tracing: only the cells along the arrow are blue, with a narrow band of orange cells around them',
    caption: 'In two dimensions. Left: the shell search checks every cell within reach of the start (blue). Right: ray tracing walks the cells the path crosses (blue) and checks only their neighbors (orange).',
  },
  'hs-checked-cells': {
    kind: 'image',
    src: checkedCells,
    alt: 'Plot of the number of checked cells against the search step, one to ten: the naïve method curves up to nearly 1,400 cells, ray tracing rises in a straight line to just over 100',
    caption: 'Cells checked after each step of the search, in three dimensions, counted from geometry.',
  },
  'hs-gravity-events': {
    kind: 'image',
    src: gravityEvents,
    alt: 'A sphere moving upward along a line meets, in turn, the point where its energy budget ΔU runs out (gravitation event), another sphere (collision event), the ceiling (wall event), or nothing (free movement)',
    caption: 'Four ways an upward move can end: the energy budget runs out, another sphere, the ceiling, or no event at all.',
  },
  'hs-bottom-view': {
    kind: 'image',
    src: bottomView,
    alt: 'Eight square views from below of the lowest layers, frames 9 to 79: scattered green and red spheres at first, then patches of crystal that grow and merge into large green domains with red borders',
    caption: 'The lowest layers of the 64,000-sphere run seen from below (0 ≤ z ≤ 6.5), frames 9 to 79; only spheres in crystal order are drawn. Green: FCC, red: HCP.',
    wide: true,
  },
  'hs-pressure': {
    kind: 'image',
    src: pressureVsPacking,
    alt: 'Plot of pressure βP/ρ against packing fraction η: the simulation points with sedimentation lie slightly below the Carnahan–Starling curve through the gas and liquid region, flatten in the coexistence region, and rise along the Alder–Hoover–Young curve in the solid',
    caption: 'Pressure under gravity, from the density profile (dots), against the Carnahan–Starling equation for the fluid and the Alder–Hoover–Young equation for the solid.',
  },
  'hs-structure-evolution': {
    kind: 'image',
    src: structureEvolution,
    alt: 'Plot of particle counts over 100 frames: particles without crystal order fall steadily; HCP rises quickly and levels off after about 20 frames; FCC grows almost linearly and passes HCP near frame 90',
    caption: 'Spheres by structure over the run; one frame is a million chains (15.62 chains per particle).',
  },
};

/** The two annotated effective Hamiltonians behind the TE/TM cards (OperatorPosters). */
export const operatorPosters = [
  {
    polarization: 'TE' as const,
    field: 'Magnetic field · Hz',
    src: teHamiltonian.src,
    title: 'Full TE effective Hamiltonian',
    alt: 'The complete second-edition TE effective Hamiltonian, every term expanded through second order, with colour-coded contributions, coefficient definitions, and a symbol legend',
    caption:
      'TE uses the out-of-plane magnetic field Hz. The poster expands the first-order remainder, the dielectric-weighted Born–Huang term, and the direct and remote-band contributions. Appendix A, second edition.',
  },
  {
    polarization: 'TM' as const,
    field: 'Electric field · Ez',
    src: tmHamiltonian.src,
    title: 'Full TM effective Hamiltonian',
    alt: 'The complete second-edition TM effective Hamiltonian, with the hermitizing factor, the expanded leakage flux, velocity and inverse-mass definitions, and all second-order terms',
    caption:
      'TM uses the out-of-plane electric field Ez, transformed by the square root of the permittivity; that factor dresses every coefficient. Appendix A, second edition.',
  },
];

export const getFigure = (id: string): FigureDef => {
  const figure = figures[id];
  if (!figure) throw new Error(`Unknown figureId '${id}'; add it to src/lib/figures.ts`);
  return figure;
};
