'use client';

import { AlertTriangle, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  HOTFIX_STATUS_META,
  ISSUE_STATUS_META,
  PRIORITY_META,
  PROJECT_STATUS_META,
  QA_STATUS_META,
  RELEASE_STATUS_META,
  SEVERITY_META,
} from '@/lib/constants';
import { formatDueDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
  HotfixStatus,
  IssueStatus,
  Priority,
  ProjectStatus,
  QaStatus,
  ReleaseStatus,
  Severity,
  TaskStatusRef,
} from '@/lib/types';

const base = 'gap-1.5 rounded-full border px-2 py-0 text-[11px] font-medium';

export function PriorityBadge({ priority, compact }: { priority: Priority; compact?: boolean }) {
  const meta = PRIORITY_META[priority];
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden />
        {meta.label}
      </span>
    );
  }
  return (
    <Badge variant="outline" className={cn(base, meta.className)}>
      <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const meta = SEVERITY_META[severity];
  return (
    <Badge variant="outline" className={cn(base, meta.className)}>
      <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const meta = ISSUE_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn(base, meta.className)}>
      <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatusRef }) {
  return (
    <Badge
      variant="outline"
      className={cn(base, 'border-border bg-muted/50 text-foreground')}
      style={{ borderColor: `${status.color}55`, backgroundColor: `${status.color}1a` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: status.color }} aria-hidden />
      {status.name}
    </Badge>
  );
}

export function PhaseBadge({
  phase,
}: {
  phase: { name: string; color: string; isProduction?: boolean } | null;
}) {
  if (!phase) {
    return (
      <Badge variant="outline" className={cn(base, 'border-dashed text-muted-foreground')}>
        No phase
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={base}
      style={{ borderColor: `${phase.color}55`, backgroundColor: `${phase.color}1a` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: phase.color }} aria-hidden />
      {phase.name}
    </Badge>
  );
}

export function QaBadge({ status }: { status: QaStatus }) {
  if (status === 'NOT_REQUIRED') return null;
  const meta = QA_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn(base, meta.className)}>
      {meta.label}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn(base, meta.className)}>
      {meta.label}
    </Badge>
  );
}

export function ReleaseStatusBadge({ status }: { status: ReleaseStatus }) {
  const meta = RELEASE_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn(base, meta.className)}>
      {meta.label}
    </Badge>
  );
}

export function HotfixStatusBadge({ status }: { status: HotfixStatus }) {
  const meta = HOTFIX_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn(base, meta.className)}>
      {meta.label}
    </Badge>
  );
}

export function DueDateBadge({
  date,
  className,
}: {
  date: string | null | undefined;
  className?: string;
}) {
  const { label, tone } = formatDueDate(date);
  if (tone === 'none') return null;

  const tones: Record<string, string> = {
    overdue: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    today: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    soon: 'border-border bg-muted/60 text-muted-foreground',
    later: 'border-transparent bg-transparent text-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tones[tone],
        className,
      )}
    >
      {tone === 'overdue' ? (
        <AlertTriangle className="size-3" aria-hidden />
      ) : (
        <CalendarClock className="size-3" aria-hidden />
      )}
      {label}
    </span>
  );
}

export function LabelChips({
  labels,
  max = 3,
}: {
  labels: { id: string; name: string; color: string }[];
  max?: number;
}) {
  if (labels.length === 0) return null;
  const shown = labels.slice(0, max);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((label) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: `${label.color}22`, color: label.color }}
        >
          {label.name}
        </span>
      ))}
      {labels.length > max ? (
        <span className="text-[10px] text-muted-foreground">+{labels.length - max}</span>
      ) : null}
    </div>
  );
}
