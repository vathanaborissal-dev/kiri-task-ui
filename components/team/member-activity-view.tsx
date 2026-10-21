'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ActivityFeed } from '@/components/common/activity-feed';
import { CenteredSpinner, ListSkeleton } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useActivity } from '@/lib/hooks/use-collab';
import { useTeamMember } from '@/lib/hooks/use-workspace';

const PAGE_SIZE = 50;

/**
 * Everything one person has done, paged.
 *
 * The profile card shows a handful so it stays a glance; this is where the
 * rest lives. Scoped server-side to projects the viewer can already open, so
 * it shows nothing they could not reach another way.
 */
export function MemberActivityView({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const { data: member } = useTeamMember(userId);
  const { data, isLoading, isError, error, refetch } = useActivity({
    actorId: userId,
    page,
    pageSize: PAGE_SIZE,
  });

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!member) return <CenteredSpinner label="Loading activity…" />;

  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
        <Link href={`/team/${userId}`}>
          <ArrowLeft className="size-4" aria-hidden />
          {member.name}
        </Link>
      </Button>

      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <UserAvatar user={member} size="md" showTooltip={false} />
            {member.name}&rsquo;s activity
          </span>
        }
        description={
          total === 0
            ? 'Nothing recorded yet.'
            : `${total} change${total === 1 ? '' : 's'} across the projects you can see.`
        }
      />

      <Card>
        <CardContent className="py-1">
          {isLoading && !data ? (
            <div className="py-3">
              <ListSkeleton rows={6} />
            </div>
          ) : (
            <ActivityFeed entries={data?.data ?? []} emptyText="Nothing recorded yet." />
          )}
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Newer
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Older
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
