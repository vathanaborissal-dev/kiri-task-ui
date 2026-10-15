'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/providers/appearance-provider';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Match system', icon: Monitor },
] as const;

/**
 * Colour mode for the sign-in screens.
 *
 * Inside the app, colour mode is one section of the appearance popover in the
 * topbar — which does not exist until somebody is signed in, and would be the
 * only floating menu on a screen built out of flat rules. This is the same three
 * choices as a segmented control instead, so it reads as part of the plate.
 *
 * Preset and font stay signed-in concerns: this sheet keeps its own palette, so
 * neither would change anything here.
 */
export function AuthThemeToggle({ className }: { className?: string }) {
  const { mode, set } = useAppearance();

  return (
    <div
      role="group"
      aria-label="Colour mode"
      className={cn('flex items-center border border-border', className)}
    >
      {OPTIONS.map((option) => {
        const isActive = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => set({ mode: option.value })}
            aria-label={option.label}
            aria-pressed={isActive}
            title={option.label}
            className={cn(
              'flex size-7 items-center justify-center transition-colors',
              'not-last:border-r not-last:border-border',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <option.icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
