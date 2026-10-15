'use client';

import { ArrowRight, Bell, Check, Inbox } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTimeAgo } from '@/lib/format';
import { useNotificationMutations, useNotifications } from '@/lib/hooks/use-workspace';
import { cn } from '@/lib/utils';

const TOP_NAV_NOTIFICATION_LIMIT = 5;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data, isLoading } = useNotifications(false, TOP_NAV_NOTIFICATION_LIMIT);
  const { markRead } = useNotificationMutations();

  const unread = data?.unread ?? 0;
  const items = data?.data ?? [];

  const openItem = (id: string, url: string | null) => {
    void markRead.mutateAsync({ ids: [id] });
    setOpen(false);
    if (url) router.push(url);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={unread > 0 ? `Notifications: ${unread} unread` : 'Notifications'}
            >
              <Bell className="size-4" aria-hidden />
              {unread > 0 ? (
                <span className="absolute -top-0.5 -right-1 grid h-3.5 min-w-3.5 place-items-center rounded-full border-2 border-background bg-primary px-0.5 text-[8px] leading-none font-bold text-primary-foreground shadow-sm">
                  {unread > 9 ? '9+' : unread}
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {unread > 0 ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'Notifications'}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        collisionPadding={8}
        className="flex max-h-[min(32rem,var(--radix-popover-content-available-height))] w-[min(24rem,calc(100vw-1rem))] flex-col gap-0 overflow-hidden border border-border/80 bg-popover p-0 shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
          <p className="min-w-0 truncate text-sm font-medium">Notifications</p>
          {unread > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => void markRead.mutateAsync({ all: true })}
            >
              <Check className="size-3.5" aria-hidden />
              Mark all read
            </Button>
          ) : null}
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{
            maxHeight:
              'min(22rem, calc(var(--radix-popover-content-available-height) - 6rem))',
          }}
        >
          {isLoading ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
              <Inbox className="size-5 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">You are all caught up.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item.id, item.url)}
                    className={cn(
                      'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/60',
                      !item.readAt && 'bg-primary/5',
                    )}
                  >
                    {item.actor ? (
                      <UserAvatar user={item.actor} size="sm" showTooltip={false} />
                    ) : (
                      <span className="mt-0.5 grid size-6 place-items-center rounded-full bg-muted text-muted-foreground">
                        <Bell className="size-3" aria-hidden />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block text-sm leading-snug font-medium break-anywhere">
                        {item.title}
                      </span>
                      {item.body ? (
                        <span className="line-clamp-2 block text-xs text-muted-foreground break-anywhere">
                          {item.body}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {item.project ? <span>{item.project.key}</span> : null}
                        <span>·</span>
                        <span>{formatTimeAgo(item.createdAt)}</span>
                      </span>
                    </span>
                    {!item.readAt ? (
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t bg-popover px-2 py-1.5">
          <Button asChild variant="ghost" size="sm" className="w-full justify-between px-2.5">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              <span>View all notifications</span>
              <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
