import type { ReactNode } from 'react';
import type { Tone } from '@/lib/admin/labels';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-soft text-ink-soft',
  blue: 'bg-primary/10 text-link',
  orange: 'bg-accent/10 text-accent-ink',
  green: 'bg-success-soft text-success-ink',
  red: 'bg-danger-soft text-danger-ink',
};

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}