'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useAppearance } from '@/providers/appearance-provider';

function Toaster({ ...props }: ToasterProps) {
  const { resolvedMode } = useAppearance();

  return (
    <Sonner
      theme={resolvedMode}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
