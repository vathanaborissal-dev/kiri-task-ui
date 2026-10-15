'use client';

import Link from 'next/link';
import { UserAvatar } from '@/components/common/user-avatar';
import { formatTimeAgo } from '@/lib/format';
import type { ActivityEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

type Meta = Record<string, unknown>;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

const changeSummary = (meta: Meta): string | null => {
  const changes = meta.changes as Record<string, { from: unknown; to: unknown }> | undefined;
  if (!changes) return null;
  const fields = Object.keys(changes);
  if (fields.length === 0) return null;
  const readable: Record<string, string> = {
    title: 'the title',
    description: 'the description',
    priority: 'the priority',
    dueDate: 'the deadline',
    startDate: 'the start date',
    estimateHours: 'the estimate',
    spentHours: 'the logged time',
    qaStatus: 'the testing status',
    phaseId: 'the phase',
    statusId: 'the status',
    assigneeId: 'the assignee',
    severity: 'the severity',
    releaseId: 'the release',
    milestoneId: 'the milestone',
    rootCause: 'the root cause',
    resolution: 'the resolution',
  };
  const names = fields.map((field) => readable[field] ?? field);
  if (names.length === 1) return `changed ${names[0]}`;
  if (names.length === 2) return `changed ${names[0]} and ${names[1]}`;
  return `changed ${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
};

/** Turns an activity row into one readable sentence. */
export const describeActivity = (entry: ActivityEntry): string => {
  const meta = (entry.meta ?? {}) as Meta;

  switch (entry.action) {
    case 'task.created':
      return 'created this task';
    case 'task.updated':
      return changeSummary(meta) ?? 'updated this task';
    case 'task.status_changed': {
      const from = asString(meta.statusFrom);
      const to = asString(meta.statusTo);
      return from && to ? `moved it from ${from} to ${to}` : 'changed the status';
    }
    case 'task.bulk_updated':
      return `updated ${String(meta.count ?? 'several')} tasks at once`;
    case 'task.deleted':
      return `deleted ${asString(meta.key) ?? 'a task'}`;
    case 'task.linked':
      return `linked ${asString(meta.targetKey) ?? 'another task'}`;
    case 'issue.reported':
      return `reported this issue (${String(meta.severity ?? '').toLowerCase() || 'unspecified severity'})`;
    case 'issue.status_changed': {
      const from = asString(meta.statusFrom)?.replace(/_/g, ' ').toLowerCase();
      const to = asString(meta.statusTo)?.replace(/_/g, ' ').toLowerCase();
      return from && to ? `moved it from ${from} to ${to}` : 'changed the status';
    }
    case 'issue.reopened':
      return 'reopened this issue';
    case 'issue.updated':
      return changeSummary(meta) ?? 'updated this issue';
    case 'issue.task_created':
      return `created ${asString(meta.taskKey) ?? 'a task'} to carry the fix`;
    case 'issue.deleted':
      return `deleted ${asString(meta.key) ?? 'an issue'}`;
    case 'hotfix.requested':
      return 'requested a hotfix';
    case 'hotfix.approved':
      return 'approved the hotfix';
    case 'hotfix.rejected':
      return 'rejected the hotfix';
    case 'hotfix.status_changed':
      return changeSummary(meta) ?? 'moved the hotfix forward';
    case 'hotfix.updated':
      return changeSummary(meta) ?? 'updated the hotfix';
    case 'release.created':
      return `created release ${asString(meta.version) ?? ''}`.trim();
    case 'release.updated':
      return changeSummary(meta) ?? 'updated the release';
    case 'release.deployed':
      return `recorded a deployment to ${asString(meta.phase) ?? 'an environment'}`;
    case 'release.scope_changed':
      return 'changed what is in the release';
    case 'comment.created':
      return 'commented';
    case 'attachment.uploaded': {
      const files = Array.isArray(meta.files) ? (meta.files as string[]) : [];
      return files.length === 1 ? `attached ${files[0]}` : `attached ${files.length} files`;
    }
    case 'project.created':
      return `created the project ${asString(meta.key) ?? ''}`.trim();
    case 'project.updated':
      return 'updated the project';
    case 'project.archived':
      return 'archived the project';
    case 'project.restored':
      return 'restored the project';
    case 'project.member_added':
      return `added ${asString(meta.userName) ?? 'someone'} as ${asString(meta.role) ?? 'a member'}`;
    case 'project.member_removed':
      return `removed ${asString(meta.userName) ?? 'someone'} from the project`;
    case 'project.member_updated':
      return `changed a member's role to ${asString(meta.role) ?? 'another role'}`;
    case 'project.status_created':
      return `added the status ${asString(meta.name) ?? ''}`.trim();
    case 'project.phase_created':
      return `added the phase ${asString(meta.name) ?? ''}`.trim();
    case 'project.milestone_created':
      return `created the milestone ${asString(meta.name) ?? ''}`.trim();
    case 'role.created':
      return `created the role ${asString(meta.name) ?? ''}`.trim();
    case 'role.updated':
      return `updated the role ${asString(meta.name) ?? ''}`.trim();
    case 'role.deleted':
      return `deleted the role ${asString(meta.name) ?? ''}`.trim();
    case 'user.invited':
      return `invited ${asString(meta.email) ?? 'someone'}`;
    case 'user.joined':
      return 'joined the workspace';
    case 'user.updated':
      return 'updated a profile';
    case 'user.deactivated':
      return 'deactivated an account';
    case 'user.deleted':
      return `deleted the account ${asString(meta.name) ?? ''}`.trim();
    case 'telegram.linked':
      return 'connected their Telegram account';
    case 'telegram.unlinked':
      return 'disconnected their Telegram account';
    case 'auth.login':
      return 'signed in';
    case 'auth.password_changed':
      return 'changed their password';
    case 'auth.password_reset':
      return 'reset their password';
    case 'auth.refresh_reuse_detected':
      return 'had a session revoked after a token was reused';
    default:
      return entry.action.replace(/[._]/g, ' ');
  }
};

const entityLink = (entry: ActivityEntry): { href: string; label: string } | null => {
  if (entry.task && entry.project) {
    return {
      href: `/projects/${entry.project.key}/tasks/${entry.task.key}`,
      label: entry.task.key,
    };
  }
  if (entry.issue && entry.project) {
    return {
      href: `/projects/${entry.project.key}/issues/${entry.issue.key}`,
      label: entry.issue.key,
    };
  }
  if (entry.hotfix && entry.project) {
    return {
      href: `/projects/${entry.project.key}/hotfixes/${entry.hotfix.key}`,
      label: entry.hotfix.key,
    };
  }
  if (entry.release && entry.project) {
    return {
      href: `/projects/${entry.project.key}/releases/${entry.release.id}`,
      label: entry.release.version,
    };
  }
  if (entry.project) return { href: `/projects/${entry.project.key}`, label: entry.project.key };
  return null;
};

export function ActivityFeed({
  entries,
  showEntity = true,
  className,
  emptyText = 'Nothing has happened yet.',
}: {
  entries: ActivityEntry[];
  showEntity?: boolean;
  className?: string;
  emptyText?: string;
}) {
  if (entries.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ol className={cn('space-y-3', className)}>
      {entries.map((entry) => {
        const link = showEntity ? entityLink(entry) : null;
        return (
          <li key={entry.id} className="flex gap-2.5">
            <UserAvatar user={entry.actor} size="sm" showTooltip={false} />
            <div className="min-w-0 flex-1 text-sm leading-snug">
              <p className="break-anywhere">
                <span className="font-medium">{entry.actor?.name ?? 'Someone'}</span>{' '}
                <span className="text-muted-foreground">{describeActivity(entry)}</span>
                {link ? (
                  <>
                    {' '}
                    <Link
                      href={link.href}
                      className="font-mono text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatTimeAgo(entry.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
