'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { shiftDay, todayKey } from '@/lib/hooks/use-standup';

/** How a human would say which day they are looking at. */
export const describeDay = (key: string): string => {
  const today = todayKey();
  if (key === today) return 'Today';
  if (key === shiftDay(today, -1)) return 'Yesterday';
  if (key === shiftDay(today, 1)) return 'Tomorrow';
  return new Date(`${key}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
};

const fullDate = (key: string) =>
  new Date(`${key}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function DayNav({
  date,
  onChange,
}: {
  date: string;
  onChange: (date: string) => void;
}) {
  const today = todayKey();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <IconButton
        variant="outline"
        className="size-8"
        label="Previous day"
        onClick={() => onChange(shiftDay(date, -1))}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </IconButton>
      <IconButton
        variant="outline"
        className="size-8"
        label="Next day"
        onClick={() => onChange(shiftDay(date, 1))}
      >
        <ChevronRight className="size-4" aria-hidden />
      </IconButton>
      <div className="px-1">
        <p className="text-sm font-medium leading-none">{describeDay(date)}</p>
        <p className="text-xs text-muted-foreground">{fullDate(date)}</p>
      </div>
      {date === today ? null : (
        <Button variant="ghost" size="sm" className="ml-1" onClick={() => onChange(today)}>
          Back to today
        </Button>
      )}
    </div>
  );
}
