// Shapes shared by the build-time first face (initial.ts) and the island.

export interface DemoFace {
  /** PNG data URL of the 48x48 face. */
  src: string;
  /** The FER+ label (index into the classes), or null for a photo of your own. */
  label: number | null;
  /** Annotators (of 10) who chose the label; 0 for a photo of your own. */
  votes: number;
  /** Probabilities per network (in the networks' order) and class; null where not computed yet. */
  probs: (number[] | null)[];
}

export interface DemoSamples {
  size: number;
  count: number;
  classes: string[];
  models: string[];
  label: number[];
  votes: number[];
  /** Thousandths, per face: network by class. */
  probs: number[][][];
}
