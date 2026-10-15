'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { avatarUrlFor } from '@/lib/avatar';
import { avatarTone, initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { UserSummary } from '@/lib/types';

const SIZES = {
  xs: 'size-5 text-[10px]',
  sm: 'size-6 text-[11px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
  xl: 'size-16 text-lg',
} as const;

type AvatarUser = Pick<UserSummary, 'id' | 'name' | 'avatarUrl'>;

export function UserAvatar({
  user,
  size = 'md',
  className,
  showTooltip = true,
}: {
  user: AvatarUser | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
  showTooltip?: boolean;
}) {
  // Rendered directly rather than through Radix's loading state machine, so a
  // slow or blocked avatar host degrades to initials instead of nothing.
  const [failed, setFailed] = useState(false);

  const avatar = (
    <Avatar className={cn(SIZES[size], 'border border-border/60', className)}>
      <AvatarFallback className={cn('font-medium', user ? avatarTone(user.id) : '')}>
        {user ? initials(user.name) : '?'}
      </AvatarFallback>
      {user && !failed ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={avatarUrlFor(user)}
          alt=""
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full rounded-full object-cover"
        />
      ) : null}
    </Avatar>
  );

  if (!showTooltip || !user) return avatar;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{avatar}</span>
      </TooltipTrigger>
      <TooltipContent>{user.name}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Overlapping avatars with one tooltip for the whole group.
 *
 * Hovering any face lists everybody, with their picture — reading a stack one
 * avatar at a time to find out who is on something is the slow way round, and
 * the "+2" never told you who the two were without hovering it specifically.
 */
export function AvatarStack({
  users,
  max = 3,
  size = 'sm',
  label,
}: {
  users: AvatarUser[];
  max?: number;
  size?: keyof typeof SIZES;
  /** Heading above the list, e.g. "Assignees". */
  label?: string;
}) {
  if (users.length === 0) {
    return <span className="text-xs text-muted-foreground">Unassigned</span>;
  }

  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  const stackLabel = label ?? 'People';
  const accessibleNames = users.map((user) => user.name).join(', ');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={`${stackLabel}: ${accessibleNames}`}
          className="inline-flex items-center -space-x-1.5 rounded-full outline-none transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {shown.map((user) => (
            <UserAvatar
              key={user.id}
              user={user}
              size={size}
              showTooltip={false}
              className="ring-2 ring-background"
            />
          ))}
          {extra > 0 ? (
            <span
              className={cn(
                SIZES[size],
                'z-10 inline-flex items-center justify-center rounded-full border border-border/60 bg-muted font-medium text-muted-foreground ring-2 ring-background',
              )}
            >
              +{extra}
            </span>
          ) : null}
        </span>
      </TooltipTrigger>
      <TooltipContent align="start" className="block min-w-48 max-w-64 p-1.5">
        <div className="flex items-center justify-between gap-4 px-1.5 pb-1.5 pt-0.5">
          <p className="font-medium text-popover-foreground">{stackLabel}</p>
          <span className="tabular-nums text-[11px] text-muted-foreground">
            {users.length} {users.length === 1 ? 'person' : 'people'}
          </span>
        </div>
        <ul className="max-h-64 space-y-0.5 overflow-y-auto">
          {users.map((user) => (
            <li key={user.id} className="flex items-center gap-2 rounded-sm px-1.5 py-1">
              <UserAvatar
                user={user}
                size="sm"
                showTooltip={false}
                className="ring-1 ring-border"
              />
              <span className="truncate text-xs text-popover-foreground">{user.name}</span>
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
