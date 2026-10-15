'use client';

import { cn } from '@/lib/utils';

export type BarDatum = {
  key: string;
  label: string;
  value: number;
  /** Entity colour (a status, phase or severity owns its colour). */
  color?: string;
};

/**
 * Horizontal magnitude bars. Single series, so identity comes from the row
 * label and the value is always written out — colour is never load-bearing.
 */
export function BarList({
  data,
  total,
  emptyText = 'No data yet.',
  valueSuffix,
  className,
}: {
  data: BarDatum[];
  total?: number;
  emptyText?: string;
  valueSuffix?: string;
  className?: string;
}) {
  // The bar is scaled against the largest group so small ones stay visible;
  // the percentage is a share of the whole, which is what people read it as.
  const max = Math.max(1, ...data.map((d) => d.value));
  const sum = Math.max(1, total ?? data.reduce((acc, d) => acc + d.value, 0));
  const visible = data.filter((d) => d.value > 0);

  if (visible.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className={cn('space-y-2.5', className)}>
      {visible.map((item) => (
        <li key={item.key} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {item.value}
              {valueSuffix ?? ''}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {Math.round((item.value / sum) * 100)}%
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                backgroundColor: item.color ?? 'var(--color-chart-1)',
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
