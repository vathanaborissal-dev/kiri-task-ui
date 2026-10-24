'use client';

import { Bug, MessageSquare, Paperclip, Workflow } from 'lucide-react';
import Link from 'next/link';
import { AvatarStack } from '@/components/common/user-avatar';
import { DueDateBadge, LabelChips, PhaseBadge, PriorityBadge, QaBadge } from '@/components/common/badges';
import { ProgressBar } from '@/components/tasks/progress-field';
import { Checkbox } from '@/components/ui/checkbox';
import { STATUS_CATEGORY_RING } from '@/lib/constants';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';

export function TaskRow({
  task,
  showProject,
  selected,
  onSelectedChange,
  className,
}: {
  task: Task;
  showProject?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  className?: string;
}) {
  const done = task.status.category === 'DONE';

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/30',
        selected && 'border-primary/60 bg-accent/40',
        className,
      )}
    >
      {onSelectedChange ? (
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelectedChange(value === true)}
          aria-label={`Select ${task.key}`}
          className="mt-1"
        />
      ) : (
        <span
          className={cn('mt-1 size-2.5 shrink-0 rounded-full', STATUS_CATEGORY_RING[task.status.category])}
          style={{ backgroundColor: task.status.color }}
          aria-hidden
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/projects/${task.project.key}/tasks/${task.key}`}
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            {task.key}
          </Link>
          <Link
            href={`/projects/${task.project.key}/tasks/${task.key}`}
            className={cn(
              'min-w-0 flex-1 truncate text-sm font-medium hover:underline',
              done && 'text-muted-foreground line-through',
            )}
          >
            {task.title}
          </Link>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {showProject ? (
            <Link
              href={`/projects/${task.project.key}`}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: task.project.color }}
                aria-hidden
              />
              {task.project.name}
            </Link>
          ) : null}
          <span className="text-[11px] text-muted-foreground">{task.status.name}</span>
          {/* Cancelled work has no meaningful percentage, and a cancelled task
              showing "40%" reads as if it were still going. */}
          {task.status.category !== 'CANCELED' ? (
            <ProgressBar value={done ? 100 : task.progress} />
          ) : null}
          <PriorityBadge priority={task.priority} compact />
          {task.phase ? <PhaseBadge phase={task.phase} /> : null}
          <QaBadge status={task.qaStatus} />
          <DueDateBadge date={task.dueDate} />
          <LabelChips labels={task.labels} max={2} />
          {task.issue ? (
            <Link
              href={`/projects/${task.project.key}/issues/${task.issue.key}`}
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              title={task.issue.title}
            >
              <Bug className="size-3" aria-hidden />
              {task.issue.key}
            </Link>
          ) : null}
          {task.counts.subtasks > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Workflow className="size-3" aria-hidden />
              {task.counts.subtasks}
            </span>
          ) : null}
          {task.counts.comments > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageSquare className="size-3" aria-hidden />
              {task.counts.comments}
            </span>
          ) : null}
          {task.counts.attachments > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Paperclip className="size-3" aria-hidden />
              {task.counts.attachments}
            </span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 pt-0.5">
        <AvatarStack users={task.assignees} max={3} label="Assignees" />
      </div>
    </div>
  );
}
