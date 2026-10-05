/**
 * Project images for the lists and cards.
 *
 * Three registries, because the two surfaces want different crops: the compact
 * landing stripe takes a tight, legible detail, the index card fills its own
 * column, and a card may add one more image beside it.
 * Astro-only module (image imports).
 */
import type { ImageMetadata } from 'astro';
import moireLoop from '../assets/thesis/moire-dots-loop.webp';
// The banner of the Blaze2D technical report (rnle.github.io/blaze2d/blaze/),
// copied unchanged from the Blaze2D repository's web/public/banners.
import blazeBanner from '../assets/blaze2d/blaze-intro.webp';
import bandLoop from '../assets/blaze2d/band-diagram-loop.webp';
import swarmDetail from '../assets/swarm-dynamics/metric-topological-detail.webp';
import pairedContrast from '../assets/grounded-recovery/paired-contrast.webp';
import robotArm from '../assets/recover-in-real-time/arm.webp';
import modelVsMotion from '../assets/residual-worlds/model-vs-motion.webp';
import sedimentationThumb from '../assets/hard-spheres/sedimentation-thumb.webp';
import ferDemoLoop from '../assets/fer/demo-loop.webp';
import ferDemoLoopCard from '../assets/fer/demo-loop-card.webp';
import geoTerrainLoop from '../assets/geo-neural/terrain-loop.avif';

export interface ThumbImage {
  kind: 'image';
  src: ImageMetadata;
  alt: string;
  fit?: 'cover' | 'contain';
  /**
   * An animation, served untouched: the image service would flatten it into a
   * single frame. Set it on every animated source, whatever the file type.
   */
  animated?: boolean;
  /** Frame shape on the index card; the compact list frame is always 16:9. */
  ratio?: string;
  /**
   * A line under the image on the index card. The image then keeps its own
   * proportions at the top of the column instead of filling it.
   */
  caption?: string;
  /**
   * With `fit: 'contain'`, fill the frame's empty bands with a blurred copy
   * of the image itself instead of the card's colour. An animation's copy
   * moves with it, so the blur follows what is on screen.
   */
  backdrop?: 'blur';
}

export type Thumb = ThumbImage | { kind: 'placeholder'; assetId: string };

/** The compact list on the landing page. */
export const projectThumbs: Record<string, Thumb> = {
  'envelope-approximation': {
    kind: 'image',
    src: moireLoop,
    alt: 'Two dotted lattices turning against each other, their overlap forming a shifting moiré pattern',
    animated: true,
  },
  blaze2d: {
    kind: 'image',
    src: blazeBanner,
    alt: 'The Blaze2D flame as a glowing glass sculpture, orange above a blue wave, on black',
    // The flame sits in the middle of a black field, so any crop keeps it whole.
  },
  'swarm-dynamics': {
    kind: 'image',
    src: swarmDetail,
    alt: 'Particles aligning into flocks under the sampled neighbor rule',
    animated: true,
  },
  'grounded-recovery': {
    kind: 'image',
    src: pairedContrast,
    alt: 'Two AI agents in the same maze, told to go to the grey box, after the same forced action change: the one trained with extra demonstrations runs out of steps, the one trained with corrections reaches the box',
    animated: true,
  },
  'residual-worlds': {
    kind: 'image',
    src: modelVsMotion,
    alt: 'A simulated two-link arm (solid) and the physics model’s prediction from 0.3 s earlier (faded); the gap between the two hands is the residual',
    // Already 16:9, so it fills the compact frame edge to edge with no crop.
    animated: true,
  },
  'recover-in-real-time': {
    kind: 'image',
    src: robotArm,
    alt: 'The assembled follower arm, a printed six-joint arm with a two-finger gripper',
  },
  // The report's six snapshots of the box, without their frame titles. The
  // box stands on white like the card, so it is shown whole in any frame.
  'hard-spheres': {
    kind: 'image',
    src: sedimentationThumb,
    alt: 'A box of hard spheres settling under gravity: a regular lattice at first, then layers of green and red crystal growing at the bottom under a gray fluid',
    animated: true,
    fit: 'contain',
  },
  // The case study's demo in miniature: DenseNet reading five FER2013 test faces
  // (happy, surprise, neutral; RAF-DB images may not be redistributed), drawn by
  // scripts/26_web.py in the study repository; after each face, DenseNet's occlusion map
  // fades in over it (where graying out the face lowers its confidence the most). 16:9,
  // so it fills the frame; only the leading emotion is named, since the frame is small.
  // Also the case study's lead (figures.ts, fer-demo-loop).
  'facial-emotion-recognition': {
    kind: 'image',
    src: ferDemoLoop,
    alt: 'A grayscale test face beside a bar chart of DenseNet’s probability for each of seven emotions; the face changes between happy, surprise and neutral, the bars move with it, and a color map fades in over each face, brightest where graying out the face lowers DenseNet’s confidence the most',
    animated: true,
  },
  // The terrain map of the case study at 5x height, turning once in 18 s
  // while the layers change every 3 s. Transparent around the terrain, with
  // room for the turning square, so it is shown whole on the card's own
  // color in any frame. An AVIF, not a webp: the whole terrain moves in every
  // frame, and only a codec that predicts across frames keeps it sharp at
  // about 2 MB.
  'geo-neural': {
    kind: 'image',
    src: geoTerrainLoop,
    alt: 'The Essen-Ruhr terrain in 3D, heights stretched five times, turning slowly while the map changes from height to streams to geology',
    animated: true,
    fit: 'contain',
  },
};

/**
 * Overrides for the larger index card, where the media column runs the full
 * height of the text beside it. Falls back to the list image.
 */
export const projectCardThumbs: Record<string, ThumbImage> = {
  // The same loop laid out for the taller column: the face above the bars, every
  // emotion named. Shown whole; the blurred copy moves with it.
  'facial-emotion-recognition': {
    kind: 'image',
    src: ferDemoLoopCard,
    alt: 'A grayscale test face above a bar chart of DenseNet’s probability for each of seven emotions; the face changes between happy, surprise and neutral, the bars move with it, and a color map fades in over each face, brightest where graying out the face lowers DenseNet’s confidence the most',
    animated: true,
    fit: 'contain',
    backdrop: 'blur',
  },
  // Labeled inside the frame: shown whole and centred in the taller column
  // rather than cropped into it.
  'residual-worlds': {
    kind: 'image',
    src: modelVsMotion,
    alt: 'A simulated two-link arm (solid) and the physics model’s prediction from 0.3 s earlier (faded); the gap between the two hands is the residual',
    animated: true,
    fit: 'contain',
    backdrop: 'blur',
  },
  // A photograph of the whole arm: the taller column cropped it to the gripper
  // and cut the rest off, so it is shown whole and centred instead.
  'recover-in-real-time': {
    kind: 'image',
    src: robotArm,
    alt: 'The assembled follower arm, a printed six-joint arm with a two-finger gripper',
    fit: 'contain',
    backdrop: 'blur',
  },
  // Wide, two-panel, and already tightly cropped: shown whole and centred in
  // the taller column rather than zoomed into it.
  'grounded-recovery': {
    kind: 'image',
    src: pairedContrast,
    alt: 'Two AI agents in the same maze, told to go to the grey box, after the same forced action change: the one trained with extra demonstrations runs out of steps, the one trained with corrections reaches the box',
    animated: true,
    fit: 'contain',
    caption: 'Same maze, same forced mistake: extra demonstrations run out of steps (left); corrections reach the goal (right).',
  },
  // The same turning terrain, whole in the taller column. The blurred copy
  // fills the bands above and below and shows through around the terrain.
  'geo-neural': {
    kind: 'image',
    src: geoTerrainLoop,
    alt: 'The Essen-Ruhr terrain in 3D, heights stretched five times, turning slowly while the map changes from height to streams to geology',
    animated: true,
    fit: 'contain',
    backdrop: 'blur',
  },
};

/** An optional second image beside the first on the index card. */
export const projectSecondaryThumbs: Record<string, ThumbImage> = {
  blaze2d: {
    kind: 'image',
    src: bandLoop,
    alt: 'A photonic band diagram computed with Blaze2D for a hexagonal lattice of air holes in a dielectric, TE in orange and TM in blue, drawn band by band, with the complete band gap shaded',
    animated: true,
    fit: 'contain',
  },
};

export const getThumb = (id: string): Thumb | undefined => projectThumbs[id];
export const getCardThumb = (id: string): Thumb | undefined =>
  projectCardThumbs[id] ?? projectThumbs[id];
export const getSecondaryThumb = (id: string): ThumbImage | undefined =>
  projectSecondaryThumbs[id];
