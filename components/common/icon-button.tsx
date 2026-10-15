'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * An icon-only button that always explains itself.
 *
 * `label` becomes both the accessible name and the tooltip, so the two can
 * never drift apart — an icon without words is only usable if hovering or a
 * screen reader gives you the same answer.
 *
 * `pending` swaps the icon for a spinner and takes the button out of service.
 * Without it an action that needs a round trip looks like it did nothing, and
 * people click it again.
 */
export function IconButton({
  label,
  side = 'top',
  pending = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  pending?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          aria-label={label}
          aria-busy={pending || undefined}
          disabled={disabled || pending}
          {...props}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{pending ? `${label}…` : label}</TooltipContent>
    </Tooltip>
  );
}
