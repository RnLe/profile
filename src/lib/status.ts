/**
 * Lifecycle + evidence → one concise public status chip. Text carries
 * the meaning; color only reinforces it. Ambiguous labels ("ongoing",
 * "coming soon", "finished", …) are structurally impossible here.
 */
import type { z } from 'astro/zod';
import type { evidenceLevelEnum, lifecycleEnum } from './schemas';

export type Lifecycle = z.infer<typeof lifecycleEnum>;
export type EvidenceLevel = z.infer<typeof evidenceLevelEnum>;
export type StatusTone = 'validated' | 'active' | 'hardware' | 'archive' | 'neutral';

export interface StatusChipModel {
  label: string;
  tone: StatusTone;
}

export function statusChip(lifecycle: Lifecycle, evidence: EvidenceLevel): StatusChipModel {
  if (lifecycle === 'released' && evidence === 'validated-result') {
    return { label: 'Validated release', tone: 'validated' };
  }
  if (lifecycle === 'released') return { label: 'Released', tone: 'validated' };
  /* Archived says where the work sits; whether a particular result was
     positive or negative belongs to the project's own prose and claims. */
  if (lifecycle === 'archived') return { label: 'Archived', tone: 'archive' };
  if (lifecycle === 'hardware-qualified') return { label: 'Hardware qualified', tone: 'hardware' };
  if (lifecycle === 'prototype' && evidence === 'hardware-bring-up') {
    return { label: 'Hardware assembled', tone: 'hardware' };
  }
  if (lifecycle === 'prototype') return { label: 'Prototype', tone: 'active' };
  if (lifecycle === 'research-continuation') {
    return { label: 'Research continuation', tone: 'active' };
  }
  if (lifecycle === 'active-research' && evidence === 'empirical-study') {
    return { label: 'Study complete', tone: 'validated' };
  }
  if (lifecycle === 'active-research') {
    return { label: 'Active research, results pending', tone: 'active' };
  }
  return { label: 'Protocol stage', tone: 'neutral' };
}

const evidenceText: Record<EvidenceLevel, string> = {
  'validated-result': 'Frozen result evaluated under a declared reference and protocol',
  'empirical-study': 'Locked experiment and analysis',
  implementation: 'Working system behavior',
  'hardware-bring-up': 'Physical assembly, calibration, and teleoperation diagnostics',
  'method-preview': 'Method explanation, not an experimental result',
  protocol: 'Predeclared study design',
  'negative-result': 'Implemented and evaluated; the target outcome failed',
  archive: 'Historical artifact and provenance',
};

export const evidenceLine = (evidence: EvidenceLevel): string => evidenceText[evidence];

/** The one status a route-gated placeholder may carry; never derived from a lifecycle. */
export const releasePreparationChip: StatusChipModel = {
  label: 'Release preparation',
  tone: 'neutral',
};
