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
import moireComposite from '../assets/thesis/intro_moire_composite.webp';
import moireScaling from '../assets/thesis/moire_scaling_and_ram.svg';
import crystalRaw from '../assets/blaze2d/crystal.svg?raw';
import bandStructureRaw from '../assets/blaze2d/band-structure.svg?raw';
import swarmComparison from '../assets/swarm-dynamics/neighbor-rule-comparison.webp';
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
      title: string;
      caption: string;
      widths?: number[];
      /** Served untouched: the image service would flatten an animation. */
      animated?: boolean;
      /** 'aside': a small image with its caption beside it, vertically centred. */
      layout?: 'aside';
    }
  | {
      kind: 'gallery';
      items: Array<{ src: ImageMetadata; alt: string; caption: string }>;
      title: string;
      caption: string;
    }
  | {
      kind: 'svg-pair';
      items: Array<{ raw: string; label: string; caption: string }>;
      title: string;
      caption: string;
    }
  | {
      kind: 'island';
      island: 'moire-explorer' | 'two-link-preview';
      title: string;
      caption: string;
      /** Visible label required for method previews. */
      previewLabel?: string;
      fallbackText: string;
    };

export const figures: Record<string, FigureDef> = {
  /* ------------------------------------------------------------ Blaze2D --- */
  'blaze-crystal-to-bands': {
    kind: 'svg-pair',
    title: 'From dielectric lattice to band structure',
    caption:
      'Illustration of what Blaze2D computes: a periodic dielectric lattice (left) and the photonic band diagram along a high-symmetry path of its Brillouin zone (right). Drawn illustration, not solver output.',
    items: [
      { raw: crystalRaw, label: 'A periodic dielectric lattice of rods', caption: 'The periodic dielectric structure…' },
      {
        raw: bandStructureRaw,
        label: 'Photonic band diagram along a high-symmetry path of the Brillouin zone',
        caption: '…and the band structure computed for it.',
      },
    ],
  },
  'blaze-hero-band-overlay': {
    kind: 'placeholder',
    assetId: 'BLAZE-HERO-01',
    spec: 'Blaze2D vs. MPB band-diagram overlay: identical crystal and configuration, visible error metric, configuration reachable in one interaction. Static fallback carries the same conclusion.',
    ratio: '16 / 9',
    title: 'Validation overlay (owner asset pending)',
    caption:
      'This slot renders the Blaze2D/MPB band-diagram overlay once the frozen validation figure is supplied with its provenance record.',
  },
  'blaze-architecture': {
    kind: 'placeholder',
    assetId: 'BLAZE-ARCH-01',
    spec: 'Solver architecture: matrix-free operator path, mixed-precision LOBPCG core, sweep driver, and the CLI / Python / WASM surfaces. ≤9 components, implemented paths only.',
    ratio: '16 / 9',
    title: 'Solver architecture (owner asset pending)',
    caption: 'Accessible architecture SVG pending; the engineering-decisions section carries the same structure in text.',
  },

  /* ----------------------------------------------- Envelope approximation --- */
  'moire-construction': {
    kind: 'image',
    src: moireComposite,
    alt: 'Construction of a moiré pattern from two hexagonal lattices twisted by five degrees: the two monolayers on the left, the emergent long-range moiré periodicity on the right',
    title: 'How a moiré lattice emerges',
    caption:
      'Construction of a moiré pattern from two hexagonal lattices twisted by θ = 5°. The bilayer develops a long-range periodicity far beyond the monolayer lattice constant. Geometry illustration from the thesis pipeline.',
    widths: [800, 1200, 2000],
  },
  'moire-scaling': {
    kind: 'image',
    src: moireScaling,
    alt: 'Two panels: the number of monolayer cells per commensurate moiré cell diverging as one over theta squared, and solver memory requirements crossing the one-terabyte line near one degree',
    title: 'Why brute force fails',
    caption:
      'The commensurate cell count diverges as 1/θ², and direct plane-wave computation crosses the terabyte line near θ ≈ 1°. This motivates the two-scale treatment; it makes no claim about the envelope theory’s accuracy.',
  },
  'moire-geometry-explorer': {
    kind: 'island',
    island: 'moire-explorer',
    title: 'Twist a bilayer yourself',
    previewLabel: 'Educational geometry explorer, not a validated result',
    caption:
      'Two point lattices and their twist angle, computed live from the lattice vectors. Watch the moiré superlattice emerge and shrink as 1/θ.',
    fallbackText:
      'Interactive version requires JavaScript. Static summary: at small twist angles, the overlaid lattices beat against each other and form a super-lattice whose period grows as the inverse of the twist angle.',
  },
  'msl-continuation-timeline': {
    kind: 'placeholder',
    assetId: 'MSL-TIME-01',
    spec: 'Timeline SVG: submitted thesis → post-thesis audit → correction → research continuation, with dates and artifact labels.',
    ratio: '21 / 9',
    title: 'Submitted → audit → continuation (owner asset pending)',
    caption: 'The dated audit timeline renders here once its reviewed SVG exists.',
  },

  /* ------------------------------------------------------ Residual Worlds --- */
  'two-link-method-preview': {
    kind: 'island',
    island: 'two-link-preview',
    title: 'Two-link mismatch, live',
    previewLabel: 'Method preview, not an experimental result',
    caption:
      'The study’s setting, computed live from its equations: the nominal plan (faded) and the target world (solid) running the same commands, with a deliberately weak tracking assist for display stability. Toggle mismatch terms and watch the tracking error, the quantity a residual model would be trained to absorb.',
    fallbackText:
      'Interactive version requires JavaScript. Static summary: the target world adds mass/length perturbations and joint friction to the nominal two-link model; under the same commands its motion deviates from the plan, and the study will train a residual to absorb exactly that gap.',
  },
  'rw-decomposition': {
    kind: 'placeholder',
    assetId: 'RW-METHOD-01',
    spec: 'Decomposition diagram: nominal physics term + learned residual term → MPC → task. Implemented vs. planned paths visually distinct.',
    ratio: '16 / 9',
    title: 'Nominal + residual decomposition (owner asset pending)',
    caption: 'Architecture figure pending; the method-preview section describes the same decomposition.',
  },

  /* -------------------------------------------------- Recover in Real Time --- */
  'rir-arm': {
    kind: 'image',
    src: robotArm,
    alt: 'The assembled follower arm: a printed six-joint arm with a two-finger gripper, wired and standing on a desk',
    title: 'The follower arm, assembled',
    caption:
      'The follower arm after assembly and calibration. Nothing on this page shows autonomous execution; every recorded motion so far is leader–follower teleoperation.',
    widths: [400, 800],
    layout: 'aside',
  },
  'rir-build': {
    kind: 'gallery',
    title: 'Building and wiring the pair',
    caption:
      'The platform as it was put together: printed parts and electronics before assembly, the servo labels that keep each joint identifiable, and the two bus boards that separate the leader from the follower.',
    items: [
      {
        src: assemblyKit,
        alt: 'Printed arm parts, servos, power supplies, a USB hub, cameras, clamps and a screwdriver set laid out on a table',
        caption: 'Printed parts and electronics, laid out before assembly.',
      },
      {
        src: followerLabels,
        alt: 'Six small paper labels marked F1 to F6 for the follower arm servos',
        caption: 'Hand-written joint labels, F1 to F6, for the follower arm.',
      },
      {
        src: servoBuses,
        alt: 'Two servo bus driver boards, one labelled LEADER and one labelled FOLLOWER',
        caption: 'The two servo bus boards, labelled so the arms cannot be swapped by accident.',
      },
    ],
  },

  /* -------------------------------------------------------- Swarm dynamics --- */
  'ba-hero-panels': {
    kind: 'image',
    src: swarmComparison,
    alt: 'Three swarm simulations side by side under the topological, metric-topological and metric neighbor rules, running from the same disordered start',
    title: 'The three neighbor rules, side by side',
    caption:
      'The same simulation under three neighbor rules: purely topological on the left, the sampled metric-topological rule in the middle, and the metric Vicsek reference on the right. Recorded from the archived thesis simulation.',
    animated: true,
  },
  'ba-neighbor-rule': {
    kind: 'placeholder',
    assetId: 'BA-NBR-01',
    spec: 'Neighbor-selection diagram: metric radius, topological candidates, uniform subsample; annotated with the Monte Carlo estimator scope.',
    ratio: '16 / 9',
    title: 'Stochastic neighbor rule (owner asset pending)',
    caption: 'Diagram pending; the method section defines the same rule in text.',
  },
};

export const getFigure = (id: string): FigureDef => {
  const figure = figures[id];
  if (!figure) throw new Error(`Unknown figureId '${id}'; add it to src/lib/figures.ts`);
  return figure;
};
