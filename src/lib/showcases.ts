/**
 * Figure showcases: a project whose own site carries more than one image can
 * show a few of them on its index card, as slides under the card's text.
 * Astro-only module (image imports).
 *
 * Grounded Recovery's material comes from its repository at commit c4fc791
 * (RnLe/recovery-policy-learning). The idea is that site's own live sketch
 * (src/lib/grounded/budget-sketch.ts), with .github/assets/budget-sketch.gif,
 * re-encoded losslessly as WebP, as the picture without JavaScript. The two
 * charts are the study page's own, captured at twice their size with the page
 * tint lifted to white. The comic scenes are site/public/illustrations/comic,
 * unchanged, read with that site's comic reader (src/lib/grounded/
 * comic-reader.ts), its alt text, and its panel layout.
 */
import type { ImageMetadata } from 'astro';
import budgetSketch from '../assets/grounded-recovery/budget-sketch.webp';
import pairedEffect from '../assets/grounded-recovery/results-paired-effect.webp';
import byCondition from '../assets/grounded-recovery/results-by-condition.webp';
import scene01 from '../assets/grounded-recovery/comic/scene-01.webp';
import scene02 from '../assets/grounded-recovery/comic/scene-02.webp';
import scene03 from '../assets/grounded-recovery/comic/scene-03.webp';
import scene04 from '../assets/grounded-recovery/comic/scene-04.webp';
import scene05 from '../assets/grounded-recovery/comic/scene-05.webp';
import scene06 from '../assets/grounded-recovery/comic/scene-06.webp';
import scene07 from '../assets/grounded-recovery/comic/scene-07.webp';
import scene08 from '../assets/grounded-recovery/comic/scene-08.webp';
import scene09 from '../assets/grounded-recovery/comic/scene-09.webp';
import scene10 from '../assets/grounded-recovery/comic/scene-10.webp';
import scene11 from '../assets/grounded-recovery/comic/scene-11.webp';

export interface ShowcaseImage {
  src: ImageMetadata;
  alt: string;
  /** Served untouched: the image service would flatten it to one frame. */
  animated?: boolean;
}

export interface ComicPanel extends ShowcaseImage {
  /** Columns the panel spans on the comic page, out of `columns`. */
  span: number;
  /** Share of the reader's stage height; the wordless scenes take less. */
  scale?: number;
}

export type ShowcaseSlide =
  | {
      /** The study's live budget sketch, drawn by its own code. */
      kind: 'sketch';
      id: string;
      label: string;
      caption?: string;
      /** What shows without JavaScript. */
      fallback: ShowcaseImage;
      /** The study's own text beside the sketch: its steps double as the
          legend, each wearing its mark from the drawing. */
      legend?: SketchLegend;
    }
  | {
      kind: 'figure';
      /** Fragment id, unique within the showcase. */
      id: string;
      /** Tab label. */
      label: string;
      caption?: string;
      /** One image, or several stacked in the order given. */
      images: ShowcaseImage[];
      /**
       * Registered claims behind the numbers the images show. The card fails
       * the build unless each one resolved for the project.
       */
      claimIds?: string[];
    }
  | {
      kind: 'comic';
      id: string;
      label: string;
      /** Accessible name of the page of panels. */
      name: string;
      columns: number;
      /** Row track sizes of the page, e.g. ['1fr', '1fr', '1.15fr']. */
      rows: string[];
      panels: ComicPanel[];
    };

export interface SketchLegend {
  title: string;
  steps: Array<{ step: 'expert' | 'extra' | 'deployment' | 'corrections'; lead: string; text: string }>;
  closing: string;
}

export interface Showcase {
  /** Accessible name of the whole showcase. */
  label: string;
  slides: ShowcaseSlide[];
}

export const projectShowcases: Record<string, Showcase> = {
  'grounded-recovery': {
    label: 'Grounded Recovery in pictures',
    slides: [
      {
        kind: 'sketch',
        id: 'idea',
        label: 'The idea',
        // Verbatim from the study site's landing page (site/index.html).
        legend: {
          title: 'Two ways to spend the same labels',
          steps: [
            {
              step: 'expert',
              lead: 'Expert demonstrations',
              text: ' cover a narrow band of states. A learner trained on them knows what to do inside it.',
            },
            {
              step: 'extra',
              lead: 'Extra demonstrations',
              text: ' spend a label budget inside that band, on the kind of states the learner has already seen.',
            },
            {
              step: 'deployment',
              lead: 'Deployment',
              text: ': one wrong action can take the learner off the band, into states no demonstration covers. There, small errors compound.',
            },
            {
              step: 'corrections',
              lead: 'Corrections',
              text: ' spend the same budget on the states the learner reaches after such a mistake, each labelled with the expert’s way back.',
            },
          ],
          closing: 'Which of the two helps more is what the study measures.',
        },
        fallback: {
          src: budgetSketch,
          alt: 'Animated sketch: a grey band runs from start to goal along the expert’s route. Blue dots place extra demonstrations inside the band. An orange step leaves the band, and green dots place corrections along the learner’s path outside it.',
          animated: true,
        },
      },
      {
        kind: 'figure',
        id: 'results',
        label: 'Results',
        caption:
          'Top: the gain from corrections, per run and on average, against thresholds fixed before testing. Bottom: success in each test condition; “recovery labels” are the corrections.',
        claimIds: ['GR-PRIMARY-001', 'GR-SECONDARY-001'],
        images: [
          {
            src: pairedEffect,
            alt: 'Dot plot of the gain in success from corrections over extra demonstrations: one dot per training run, their average with its interval, and dashed lines for the smallest useful gain or loss.',
          },
          {
            src: byCondition,
            alt: 'Bar chart of success rates for the original agent, extra demonstrations, and recovery labels in three conditions: no action change, a familiar change, and a new change, with one dot per training run.',
          },
        ],
      },
      {
        kind: 'comic',
        id: 'comic',
        label: 'Comic',
        name: 'Two researchers spend their last labels on a robot that catches fire',
        columns: 24,
        rows: ['1fr', '1fr', '1.15fr'],
        panels: [
          {
            src: scene01,
            span: 6,
            alt: 'A man winds up a small robot and says: there, now let’s see how it does. A woman says: great, I have one spare label left.',
          },
          {
            src: scene02,
            span: 5,
            alt: 'The man holds up his own label and says: good, I got a spare one too.',
          },
          {
            src: scene03,
            span: 7,
            alt: 'The robot picks up a lighter. The woman asks: wait, is that a lighter? That was not in the training set.',
          },
          {
            src: scene04,
            span: 6,
            alt: 'The man holds the woman back: let it do its thing. We only have a few labels left. Let it discover what we didn’t train it for. She answers: are you sure?',
          },
          {
            src: scene05,
            span: 6,
            alt: 'The man explains: think about it, its own actions can push it into states the expert demonstrations never covered.',
          },
          {
            src: scene06,
            span: 6,
            alt: 'He continues: that’s life, that’s the real world. You can’t account for every disturbance, and you can’t perfectly predict how its own actions will change what happens next.',
          },
          {
            src: scene07,
            span: 5,
            alt: 'He concludes: let it make mistakes, and we use our spare labels on correcting those mistakes rather than preventing them. Behind him the robot has set itself alight.',
          },
          {
            src: scene08,
            span: 7,
            scale: 0.72,
            alt: 'The robot stands in a column of flame. The woman shouts: oh my god!',
          },
          {
            src: scene09,
            span: 9,
            scale: 0.74,
            alt: 'The robot has burned down to a smouldering heap while the two watch.',
          },
          {
            src: scene10,
            span: 9,
            scale: 0.7,
            alt: 'Nothing is left of the robot but a smoking pile of ash.',
          },
          {
            src: scene11,
            span: 6,
            scale: 0.86,
            alt: 'The man looks at the ash and says: I’ll build a new one.',
          },
        ],
      },
    ],
  },
};

export const getShowcase = (id: string): Showcase | undefined => projectShowcases[id];
