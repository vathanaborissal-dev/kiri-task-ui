'use client';

import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type Option = {
  value: string;
  label: string;
  description?: string;
  color?: string;
  icon?: React.ReactNode;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'Nothing found',
  disabled,
  className,
  maxShown = 3,
  label,
}: {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  maxShown?: number;
  /** Accessible name for the trigger — the visible <Label> is not associated. */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOptions = options.filter((o) => selected.includes(o.value));

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          disabled={disabled}
          className={cn('h-auto min-h-9 w-full justify-between gap-2 px-3 py-1.5', className)}
        >
          <span className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden text-left">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, maxShown).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="gap-1 rounded px-1.5 py-0 text-[11px] font-normal"
                    style={
                      option.color
                        ? { backgroundColor: `${option.color}22`, color: option.color }
                        : undefined
                    }
                  >
                    {option.icon ? (
                      <span className="-ml-0.5 inline-flex shrink-0">{option.icon}</span>
                    ) : option.color ? (
                      <span
                        className="size-2 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                        style={{ backgroundColor: option.color }}
                        aria-hidden
                      />
                    ) : null}
                    {option.label}
                  </Badge>
                ))}
                {selectedOptions.length > maxShown ? (
                  <span className="text-xs text-muted-foreground">
                    +{selectedOptions.length - maxShown}
                  </span>
                ) : null}
              </>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.description ?? ''}`}
                  onSelect={() => toggle(option.value)}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      selected.includes(option.value) ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden
                  />
                  {option.icon ? (
                    <span className="inline-flex shrink-0">{option.icon}</span>
                  ) : option.color ? (
                    <span
                      className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                      style={{ backgroundColor: option.color }}
                      aria-hidden
                    />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {selected.length > 0 ? (
            <div className="border-t p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => onChange([])}
              >
                <X className="size-3.5" aria-hidden />
                Clear selection
              </Button>
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
