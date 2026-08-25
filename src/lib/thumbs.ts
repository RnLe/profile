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
import blazeMark from '../assets/blaze2d/blaze.svg';
import bandLoop from '../assets/blaze2d/band-diagram-loop.webp';
import swarmDetail from '../assets/swarm-dynamics/metric-topological-detail.webp';
import pairedContrast from '../assets/grounded-recovery/paired-contrast.webp';
import robotArm from '../assets/recover-in-real-time/arm.webp';
import imaginedVsHappened from '../assets/residual-worlds/imagined-vs-happened.webp';

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
    src: blazeMark,
    alt: 'The Blaze2D mark',
    // A mark, not a scene: show it whole on the card's own background.
    fit: 'contain',
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
    alt: 'Two policies running the same symbolic gridworld scenario side by side',
    animated: true,
  },
  'residual-worlds': {
    kind: 'image',
    src: imaginedVsHappened,
    alt: 'Two-link arm in its true world, with the nominal model’s prediction from a moment earlier drawn faded; the gap between the two hands is the residual',
    // Already 16:9, so it fills the compact frame edge to edge with no crop.
    animated: true,
  },
  'recover-in-real-time': {
    kind: 'image',
    src: robotArm,
    alt: 'The assembled follower arm, a printed six-joint arm with a two-finger gripper',
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
    src: imaginedVsHappened,
    alt: 'Two-link arm in its true world, with the nominal model’s prediction from a moment earlier drawn faded; the gap between the two hands is the residual',
    animated: true,
    fit: 'contain',
  },
  // Wide, two-panel, and already tightly cropped: shown whole and centred in
  // the taller column rather than zoomed into it.
  'grounded-recovery': {
    kind: 'image',
    src: pairedContrast,
    alt: 'Two policies running the same symbolic gridworld scenario side by side',
    animated: true,
    fit: 'contain',
  },
};

/** An optional second image beside the first on the index card. */
export const projectSecondaryThumbs: Record<string, ThumbImage> = {
  blaze2d: {
    kind: 'image',
    src: bandLoop,
    alt: 'A photonic band diagram of a hexagonal lattice of air holes in a dielectric, drawn band by band, with the complete band gap shaded between the third and fourth bands',
    animated: true,
    fit: 'contain',
  },
};

export const getThumb = (id: string): Thumb | undefined => projectThumbs[id];
export const getCardThumb = (id: string): Thumb | undefined =>
  projectCardThumbs[id] ?? projectThumbs[id];
export const getSecondaryThumb = (id: string): ThumbImage | undefined =>
  projectSecondaryThumbs[id];
