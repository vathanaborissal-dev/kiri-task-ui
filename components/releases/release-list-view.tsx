'use client';

import { Flame, Plus, Rocket } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { ListSkeleton } from '@/components/common/loading';
import { PhaseBadge, ReleaseStatusBadge } from '@/components/common/badges';
import { UserAvatar } from '@/components/common/user-avatar';
import { CreateReleaseDialog } from '@/components/releases/create-release-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import { useProject } from '@/lib/hooks/use-projects';
import { useReleases } from '@/lib/hooks/use-releases';

export function ReleaseListView({ projectKey }: { projectKey: string }) {
  const { data: project } = useProject(projectKey);
  const { data, isLoading } = useReleases(
    { projectId: project?.id, sort: 'createdAt', order: 'desc' },
    Boolean(project),
  );
  const [createOpen, setCreateOpen] = useState(false);

  if (!project) return <ListSkeleton rows={4} />;

  const permissions = new Set(project.myPermissions);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Versions, what they contain, and where they have been deployed.
        </p>
        {can('release:create') ? (
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New release
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={Rocket}
          title="No releases yet"
          description="Group finished tasks into a version, then record where it has been deployed."
          action={
            can('release:create') ? (
              <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" aria-hidden />
                Create the first release
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data!.data.map((release) => (
            <Link key={release.id} href={`/projects/${projectKey}/releases/${release.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/20">
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-base font-semibold">{release.version}</span>
                      {release.isHotfix ? (
                        <Flame className="size-4 shrink-0 text-red-500" aria-hidden />
                      ) : null}
                    </div>
                    <ReleaseStatusBadge status={release.status} />
                  </div>

                  {release.name ? <p className="text-sm">{release.name}</p> : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <PhaseBadge phase={release.phase} />
                    <span className="text-xs text-muted-foreground">
                      {release.counts.tasks} tasks · {release.counts.issues} issues ·{' '}
                      {release.counts.deployments} deployments
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <UserAvatar user={release.createdBy} size="xs" showTooltip={false} />
                      {release.createdBy.name}
                    </span>
                    <span>
                      {release.releasedAt
                        ? `Released ${formatDate(release.releasedAt)}`
                        : release.plannedDate
                          ? `Planned ${formatDate(release.plannedDate)}`
                          : `Created ${formatDate(release.createdAt)}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateReleaseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectKey={projectKey}
      />
    </div>
  );
}
