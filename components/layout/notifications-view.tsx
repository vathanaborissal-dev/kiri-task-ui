'use client';

import { Bell, BellOff, Check, Inbox, Settings2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ListSkeleton } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTimeAgo } from '@/lib/format';
import { useNotificationMutations, useNotifications } from '@/lib/hooks/use-workspace';
import { cn } from '@/lib/utils';

export function NotificationsView() {
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, isLoading, isError, error, refetch } = useNotifications(unreadOnly);
  const { markRead, markUnread, clearRead } = useNotificationMutations();

  const items = data?.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Everything that happened on work you follow."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/settings/notifications">
                <Settings2 className="size-4" aria-hidden />
                Preferences
              </Link>
            </Button>
            {(data?.unread ?? 0) > 0 ? (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  await markRead.mutateAsync({ all: true });
                  toast.success('All caught up');
                }}
              >
                <Check className="size-4" aria-hidden />
                Mark all read
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={unreadOnly ? 'unread' : 'all'}
          onValueChange={(value) => setUnreadOnly(value === 'unread')}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {(data?.unread ?? 0) > 0 ? (
                <span className="ml-1.5 text-xs text-muted-foreground">{data!.unread}</span>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={async () => {
            const result = await clearRead.mutateAsync();
            toast.success(`${result.deleted} read notifications cleared`);
          }}
        >
          <Trash2 className="size-3.5" aria-hidden />
          Clear read
        </Button>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <ListSkeleton rows={6} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={unreadOnly ? Inbox : BellOff}
          title={unreadOnly ? 'Nothing unread' : 'No notifications yet'}
          description="You will hear about assignments, mentions, deadlines and releases here and on Telegram."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <CardContent className="divide-y p-0">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 transition-colors',
                  !item.readAt && 'bg-primary/5',
                )}
              >
                {item.actor ? (
                  <UserAvatar user={item.actor} size="md" showTooltip={false} />
                ) : (
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Bell className="size-4" aria-hidden />
                  </span>
                )}

                <button
                  type="button"
                  className="min-w-0 flex-1 space-y-0.5 text-left"
                  onClick={() => {
                    if (!item.readAt) void markRead.mutateAsync({ ids: [item.id] });
                    if (item.url) router.push(item.url);
                  }}
                >
                  <span className="block text-sm font-medium break-anywhere">{item.title}</span>
                  {item.body ? (
                    <span className="block text-sm text-muted-foreground break-anywhere">
                      {item.body}
                    </span>
                  ) : null}
                  <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {item.project ? (
                      <>
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: item.project.color }}
                          aria-hidden
                        />
                        <span>{item.project.key}</span>
                        <span>·</span>
                      </>
                    ) : null}
                    <span>{formatTimeAgo(item.createdAt)}</span>
                  </span>
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs text-muted-foreground"
                  onClick={() =>
                    item.readAt
                      ? void markUnread.mutateAsync(item.id)
                      : void markRead.mutateAsync({ ids: [item.id] })
                  }
                >
                  {item.readAt ? 'Mark unread' : 'Mark read'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
