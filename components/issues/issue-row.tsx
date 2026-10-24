'use client';

import { MessageSquare, Paperclip, RotateCcw, Wrench } from 'lucide-react';
import Link from 'next/link';
import { DueDateBadge, IssueStatusBadge, PhaseBadge, SeverityBadge } from '@/components/common/badges';
import { UserAvatar } from '@/components/common/user-avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { formatTimeAgo } from '@/lib/format';
import type { Issue } from '@/lib/types';
import { cn } from '@/lib/utils';

export function IssueRow({
  issue,
  showProject,
  selected,
  onSelectedChange,
}: {
  issue: Issue;
  showProject?: boolean;
  /** Supplying `onSelectedChange` turns the row into a selectable one. */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
}) {
  const href = `/projects/${issue.project.key}/issues/${issue.key}`;

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/30',
        selected && 'border-primary/60 bg-accent/40',
      )}
    >
      {onSelectedChange ? (
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelectedChange(value === true)}
          aria-label={`Select ${issue.key}`}
          className="mt-1"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={href} className="font-mono text-xs text-muted-foreground hover:text-foreground">
            {issue.key}
          </Link>
          <Link href={href} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
            {issue.title}
          </Link>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {showProject ? (
            <Link
              href={`/projects/${issue.project.key}`}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: issue.project.color }}
                aria-hidden
              />
              {issue.project.name}
            </Link>
          ) : null}
          <IssueStatusBadge status={issue.status} />
          <SeverityBadge severity={issue.severity} />
          {issue.phase ? <PhaseBadge phase={issue.phase} /> : null}
          <DueDateBadge date={issue.dueDate} />
          {issue.reopenCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
              <RotateCcw className="size-3" aria-hidden />
              reopened {issue.reopenCount}×
            </span>
          ) : null}
          {issue.counts.tasks > 0 ? (
            <span
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
              title={
                issue.task
                  ? `Main fix: ${issue.task.key} — ${issue.task.title}`
                  : `${issue.counts.tasks} tasks`
              }
            >
              <Wrench className="size-3" aria-hidden />
              {issue.counts.tasks} {issue.counts.tasks === 1 ? 'task' : 'tasks'}
            </span>
          ) : issue.task ? (
            <Link
              href={`/projects/${issue.project.key}/tasks/${issue.task.key}`}
              className="text-[11px] text-primary hover:underline"
            >
              fix in {issue.task.key}
            </Link>
          ) : null}
          {issue.counts.comments > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageSquare className="size-3" aria-hidden />
              {issue.counts.comments}
            </span>
          ) : null}
          {issue.counts.attachments > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Paperclip className="size-3" aria-hidden />
              {issue.counts.attachments}
            </span>
          ) : null}
          <span className="text-[11px] text-muted-foreground">
            reported {formatTimeAgo(issue.createdAt)} by {issue.reporter.name}
          </span>
        </div>
      </div>

      <div className="shrink-0 pt-0.5">
        {issue.assignee ? (
          <UserAvatar user={issue.assignee} size="sm" />
        ) : (
          <span className="text-[11px] text-muted-foreground">Unassigned</span>
        )}
      </div>
    </div>
  );
}
