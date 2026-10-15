'use client';

import { Flame } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { ListSkeleton } from '@/components/common/loading';
import { DueDateBadge, HotfixStatusBadge, SeverityBadge } from '@/components/common/badges';
import { UserAvatar } from '@/components/common/user-avatar';
import { CreateHotfixDialog } from '@/components/releases/create-hotfix-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatTimeAgo } from '@/lib/format';
import { useProject } from '@/lib/hooks/use-projects';
import { useHotfixes } from '@/lib/hooks/use-releases';

export function HotfixListView({ projectKey }: { projectKey: string }) {
  const { data: project } = useProject(projectKey);
  const [openOnly, setOpenOnly] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useHotfixes(
    { projectId: project?.id, openOnly, sort: 'createdAt', order: 'desc' },
    Boolean(project),
  );

  if (!project) return <ListSkeleton rows={3} />;

  const permissions = new Set(project.myPermissions);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Urgent production fixes: who approved them, who is on them, and which release shipped them.
        </p>
        <label className="ml-auto flex items-center gap-2 text-sm">
          Only open
          <Switch checked={openOnly} onCheckedChange={setOpenOnly} />
        </label>
        {can('hotfix:create') ? (
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Flame className="size-4" aria-hidden />
            Request hotfix
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={Flame}
          title={openOnly ? 'No open hotfixes' : 'No hotfixes recorded'}
          description="Raise one when something is broken in production and cannot wait for the next release."
          action={
            can('hotfix:create') ? (
              <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <Flame className="size-4" aria-hidden />
                Request a hotfix
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2">
          {data!.data.map((hotfix) => (
            <li key={hotfix.id}>
              <Link
                href={`/projects/${projectKey}/hotfixes/${hotfix.key}`}
                className="block rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Flame className="size-3.5 shrink-0 text-red-500" aria-hidden />
                  <span className="font-mono text-xs text-muted-foreground">{hotfix.key}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{hotfix.title}</span>
                  <HotfixStatusBadge status={hotfix.status} />
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <SeverityBadge severity={hotfix.severity} />
                  <DueDateBadge date={hotfix.dueDate} />
                  {hotfix.issue ? (
                    <span className="text-[11px] text-muted-foreground">
                      from {hotfix.issue.key}
                    </span>
                  ) : null}
                  {hotfix.task ? (
                    <span className="text-[11px] text-muted-foreground">fix in {hotfix.task.key}</span>
                  ) : null}
                  {hotfix.release ? (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      shipped in {hotfix.release.version}
                    </span>
                  ) : null}
                  <span className="text-[11px] text-muted-foreground">
                    raised {formatTimeAgo(hotfix.createdAt)} by {hotfix.requestedBy.name}
                  </span>
                  <span className="ml-auto">
                    {hotfix.assignee ? (
                      <UserAvatar user={hotfix.assignee} size="sm" />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Unassigned</span>
                    )}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CreateHotfixDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectKey={projectKey}
      />
    </div>
  );
}
