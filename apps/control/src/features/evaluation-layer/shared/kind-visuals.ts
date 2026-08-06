import type { EvaluationLayerTargetKind } from '../model';

export interface KindColorSet {
  /** Small colored dot used in chips and badges. */
  dot: string;
  /** Active filter chip styling. */
  chip: string;
  /** Kind badge in table rows. */
  badge: string;
  /** Tinted icon container in table rows. */
  iconBox: string;
  /** Row tint plus left accent border. */
  row: string;
}

/**
 * Per-kind color palette for the evaluation targets UI.
 * Class strings are literal so Tailwind keeps them in the build.
 */
export const KIND_COLOR: Record<EvaluationLayerTargetKind, KindColorSet> = {
  agent: {
    dot: 'bg-sky-500',
    chip: 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300',
    badge: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
    iconBox: 'border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10',
    row: 'border-l-sky-400 bg-sky-50/50 dark:border-l-sky-500 dark:bg-sky-500/5',
  },
  mcp: {
    dot: 'bg-violet-500',
    chip: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/40 dark:bg-violet-500/15 dark:text-violet-300',
    badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300',
    iconBox: 'border-violet-200 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10',
    row: 'border-l-violet-400 bg-violet-50/50 dark:border-l-violet-500 dark:bg-violet-500/5',
  },
  kb: {
    dot: 'bg-amber-500',
    chip: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300',
    badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    iconBox: 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10',
    row: 'border-l-amber-400 bg-amber-50/50 dark:border-l-amber-500 dark:bg-amber-500/5',
  },
  skill: {
    dot: 'bg-emerald-500',
    chip: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    iconBox: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
    row: 'border-l-emerald-400 bg-emerald-50/50 dark:border-l-emerald-500 dark:bg-emerald-500/5',
  },
};
