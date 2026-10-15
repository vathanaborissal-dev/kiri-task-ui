'use client';

import { CalendarIcon, X } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '@/components/common/icon-button';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export function DateField({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  className,
  clearable = true,
  label,
}: {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
  /** Accessible name for the trigger — the visible <Label> is not associated. */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : undefined;

  return (
    <div className={cn('relative w-full min-w-0', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={label}
            className={cn(
              'h-9 w-full min-w-0 justify-start gap-2 px-3 font-normal',
              clearable && value && !disabled && 'pr-10',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{value ? formatDate(value) : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            autoFocus
            onSelect={(date) => {
              onChange(date ? date.toISOString() : null);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && value && !disabled ? (
        <IconButton
          type="button"
          variant="ghost"
          className="absolute right-1 top-1/2 z-10 size-7 -translate-y-1/2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => onChange(null)}
          label={`Clear ${label?.toLowerCase() ?? 'date'}`}
        >
          <X className="size-4" aria-hidden />
        </IconButton>
      ) : null}
    </div>
  );
}
