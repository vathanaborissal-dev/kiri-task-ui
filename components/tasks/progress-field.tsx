'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/** The stops the quick buttons offer. 0 and 100 are the ones people actually use. */
const QUICK_STEPS = [0, 25, 50, 75, 100] as const;

/**
 * How far along a task is.
 *
 * A slider plus five quick buttons, rather than a number field: a percentage is
 * a feeling, not a measurement, and asking somebody to type "60" is slower than
 * letting them tap it. The commit is on release, not on every pixel of the
 * drag, so one adjustment is one request.
 */
export function ProgressField({
  value,
  onChange,
  disabled,
  pending,
  /** Forced to 100 by the status column, so editing it would be a lie. */
  lockedToDone,
  className,
  label = 'Progress',
}: {
  value: number;
  onChange: (progress: number) => void;
  disabled?: boolean;
  pending?: boolean;
  lockedToDone?: boolean;
  className?: string;
  label?: string;
}) {
  // Local while dragging, so the fill tracks the thumb without a round trip.
  // Resynced during render rather than in an effect: an effect would paint the
  // stale percentage for a frame after the server confirms a change.
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const readOnly = disabled || lockedToDone;

  const commit = (next: number) => {
    setDraft(next);
    if (next !== value) onChange(next);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Progress
          value={draft}
          aria-hidden
          className={cn('h-1.5 flex-1', draft === 100 && '[&_[data-slot=progress-indicator]]:bg-emerald-500')}
        />
        <span
          className={cn(
            'w-10 shrink-0 text-right text-xs tabular-nums',
            draft === 100 ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
          )}
        >
          {draft}%
        </span>
      </div>

      {readOnly ? (
        lockedToDone ? (
          <p className="text-[11px] text-muted-foreground">
            Complete — the status column sets this to 100%.
          </p>
        ) : null
      ) : (
        <>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={draft}
            disabled={pending}
            aria-label={label}
            aria-valuetext={`${draft} percent`}
            onChange={(event) => setDraft(Number(event.target.value))}
            // Commit on release and on blur, not on change: dragging the thumb
            // across the bar would otherwise fire twenty PATCHes.
            onPointerUp={() => commit(draft)}
            onKeyUp={() => commit(draft)}
            onBlur={() => commit(draft)}
            className="h-5 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex gap-1">
            {QUICK_STEPS.map((step) => (
              <Button
                key={step}
                type="button"
                variant={draft === step ? 'secondary' : 'ghost'}
                size="sm"
                disabled={pending}
                className="h-6 flex-1 px-0 text-[11px] tabular-nums"
                onClick={() => commit(step)}
              >
                {step}%
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** The read-only inline version, for rows and cards. */
export function ProgressBar({
  value,
  className,
  showLabel = true,
  /** Stretch the track to the available width instead of a fixed 3rem. */
  fill = false,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
  fill?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', fill && 'w-full', className)}>
      <span
        className={cn(
          'h-1 overflow-hidden rounded-full bg-muted',
          fill ? 'flex-1' : 'w-12 shrink-0',
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${value}% complete`}
      >
        <span
          className={cn(
            'block h-full rounded-full transition-[width]',
            value === 100 ? 'bg-emerald-500' : 'bg-primary',
          )}
          style={{ width: `${value}%` }}
        />
      </span>
      {showLabel ? (
        <span className="text-[11px] tabular-nums text-muted-foreground">{value}%</span>
      ) : null}
    </span>
  );
}
