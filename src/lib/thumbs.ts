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
import ferThumb from '../assets/fer/thumb.webp';

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
  // Training faces from FER2013 (RAF-DB images may not be redistributed), one
  // column per emotion from angry to surprise.
  'facial-emotion-recognition': {
    kind: 'image',
    src: ferThumb,
    alt: 'A grid of small grayscale faces from the FER2013 dataset, one column per emotion: angry, disgust, fear, happy, neutral, sad, surprise',
  },
};

/**
 * Overrides for the larger index card, where the media column runs the full
 * height of the text beside it. Falls back to the list image.
 */
export const projectCardThumbs: Record<string, ThumbImage> = {
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
