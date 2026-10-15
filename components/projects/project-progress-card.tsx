'use client';

import { AlertTriangle, Bug, UserX } from 'lucide-react';
import Link from 'next/link';
import { ProjectStatusBadge } from '@/components/common/badges';
import { UserAvatar } from '@/components/common/user-avatar';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/format';
import type { ProjectStats, ProjectStatus, UserSummary } from '@/lib/types';

export function ProjectProgressCard({
  project,
}: {
  project: {
    id: string;
    key: string;
    name: string;
    color: string;
    status: ProjectStatus;
    targetDate: string | null;
    owner: UserSummary;
    memberCount: number;
    stats: ProjectStats;
  };
}) {
  return (
    <Link
      href={`/projects/${project.key}`}
      className="block rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-accent/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: project.color }}
            aria-hidden
          />
          <span className="truncate text-sm font-medium">{project.name}</span>
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{project.key}</span>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <Progress value={project.stats.progress} className="h-1.5 flex-1" />
        <span className="w-10 text-right text-xs font-medium tabular-nums text-muted-foreground">
          {project.stats.progress}%
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          {project.stats.doneTasks}/{project.stats.totalTasks} tasks
        </span>
        {project.stats.overdueTasks > 0 ? (
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertTriangle className="size-3" aria-hidden />
            {project.stats.overdueTasks} overdue
          </span>
        ) : null}
        {project.stats.openIssues > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Bug className="size-3" aria-hidden />
            {project.stats.openIssues} open
          </span>
        ) : null}
        {project.stats.unassignedTasks > 0 ? (
          <span className="inline-flex items-center gap-1">
            <UserX className="size-3" aria-hidden />
            {project.stats.unassignedTasks} unassigned
          </span>
        ) : null}
        {project.targetDate ? <span>Target {formatDate(project.targetDate)}</span> : null}
        <span className="ml-auto inline-flex items-center gap-1.5">
          <UserAvatar user={project.owner} size="xs" showTooltip={false} />
          {project.owner.name}
        </span>
      </div>
    </Link>
  );
}
