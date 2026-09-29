/**
 * The first three stages of the Blaze2D roadmap, mirrored from the Blaze2D
 * repository (web/components/roadmap-page/roadmap-data.ts) as published at
 * rnle.github.io/blaze2d/roadmap on 2026-09-29. Titles, descriptions, and
 * statuses are copied, not paraphrased; update them together with the source.
 * Two statuses deliberately trail the published page, because that work is
 * not committed yet: Symmetries is In Development, and Configuration warm
 * starts is Planned.
 */
export type RoadmapStatus = 'Done' | 'In Development' | 'Planned';

export interface RoadmapStage {
  number: 1 | 2 | 3;
  title: string;
  anchor: string;
  description: string;
  modules: { title: string; anchor: string; description: string; status: RoadmapStatus }[];
}

export const roadmapUrl = 'https://rnle.github.io/blaze2d/roadmap';

export const blazeRoadmap: RoadmapStage[] = [
  {
    number: 1,
    title: 'Research foundation',
    anchor: 'stage-1-research-foundation',
    description: 'Establish a reliable research core.',
    modules: [
      {
        title: '2D research core',
        anchor: '2d-research-core',
        description:
          'Rust implementation and theory: LOBPCG, mixed precision, clear API/TOML interfaces, and operator projections.',
        status: 'Done',
      },
      {
        title: 'Symmetries',
        anchor: 'symmetries',
        description: 'Qualified reuse, real or reduced coordinates, and measured automatic selection.',
        status: 'In Development',
      },
      {
        title: 'Configuration warm starts',
        anchor: 'configuration-warm-starts',
        description: 'Certified geometry continuation in public sweeps with bounded worker caches.',
        status: 'Planned',
      },
      {
        title: 'Theory and benchmarks',
        anchor: 'theory-and-benchmarks',
        description: 'Document the science and measure each change.',
        status: 'In Development',
      },
    ],
  },
  {
    number: 2,
    title: 'Generalize and optimize 2D',
    anchor: 'stage-2-generalize-and-optimize-2d',
    description: 'Fully generalize 2D geometry, improve solving, and support MPB workflows.',
    modules: [
      {
        title: 'General geometry',
        anchor: 'general-geometry',
        description: 'Add polygons, cutouts, and dielectric grids.',
        status: 'Planned',
      },
      {
        title: 'Solver optimization',
        anchor: 'solver-optimization',
        description: 'Lower iteration cost; target chosen frequencies.',
        status: 'Planned',
      },
      {
        title: 'Gradients and inverse design',
        anchor: 'gradients-and-inverse-design',
        description: 'Use sensitivities to optimize a crystal.',
        status: 'Planned',
      },
      {
        title: 'MPB compatibility',
        anchor: 'mpb-compatibility',
        description: 'Translate and validate established workflows.',
        status: 'Planned',
      },
    ],
  },
  {
    number: 3,
    title: 'GPU, 3D, and slabs',
    anchor: 'stage-3-gpu-3d-and-slabs',
    description: 'Add GPU execution and extend the physical models beyond 2D.',
    modules: [
      {
        title: 'GPU execution',
        anchor: 'gpu-execution',
        description: 'Accelerate large batches of band calculations with GPU parallelism.',
        status: 'Planned',
      },
      {
        title: 'Full 3D Maxwell',
        anchor: 'full-3d-maxwell',
        description: 'Compute band diagrams for 3D photonic crystals.',
        status: 'Planned',
      },
      {
        title: 'Photonic slabs',
        anchor: 'photonic-slabs',
        description: 'Use a reduced guided-mode basis for efficient slab band calculations.',
        status: 'Planned',
      },
    ],
  },
];
