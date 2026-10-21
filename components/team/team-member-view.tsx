'use client';

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bug,
  CheckCircle2,
  CircleSlash,
  Flame,
  ListChecks,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { ActivityFeed } from '@/components/common/activity-feed';
import { CenteredSpinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { StatCard } from '@/components/common/stat-card';
import { TaskRow } from '@/components/tasks/task-row';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IssueStatusBadge, SeverityBadge } from '@/components/common/badges';
import { formatDate, formatTimeAgo } from '@/lib/format';
import { useActivity } from '@/lib/hooks/use-collab';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useTeamMember } from '@/lib/hooks/use-workspace';

/** Enough to show the shape of someone's week without dominating the page. */
const ACTIVITY_PREVIEW = 6;

export function TeamMemberView({ userId }: { userId: string }) {
  const { data: member, isLoading, isError, error, refetch } = useTeamMember(userId);
  const { data: tasks } = useTasks(
    { assigneeId: [userId], includeDone: false, sort: 'dueDate', pageSize: 25 },
    Boolean(member),
  );
  // The card is a glance, not a log — it used to pull twenty entries and run
  // far past the column beside it. The full history has its own page.
  const { data: activity } = useActivity(
    { actorId: userId, pageSize: ACTIVITY_PREVIEW },
    Boolean(member),
  );

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !member) return <CenteredSpinner label="Loading profile…" />;

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
        <Link href="/team">
          <ArrowLeft className="size-4" aria-hidden />
          Team
        </Link>
      </Button>

      <div className="flex flex-wrap items-start gap-4">
        <UserAvatar user={member} size="xl" showTooltip={false} />
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{member.name}</h1>
          <p className="text-sm text-muted-foreground">
            {member.jobTitle ? `${member.jobTitle} · ` : ''}
            {member.email}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="rounded-full">
              {member.globalRole.name}
            </Badge>
            {!member.isActive ? (
              <Badge variant="outline" className="rounded-full text-muted-foreground">
                Deactivated
              </Badge>
            ) : null}
            {member.telegramLinked ? (
              <Badge variant="outline" className="gap-1 rounded-full">
                <Send className="size-3" aria-hidden />
                Telegram connected
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">
              Joined {formatDate(member.createdAt)}
              {member.lastLoginAt ? ` · last seen ${formatTimeAgo(member.lastLoginAt)}` : ''}
            </span>
          </div>
        </div>
      </div>

      {member.responsibilities ? (
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-muted-foreground">Responsibilities</p>
            <p className="mt-1 text-sm break-anywhere">{member.responsibilities}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Open tasks" value={member.workload.openTasks} icon={ListChecks} />
        <StatCard
          label="Overdue"
          value={member.workload.overdueTasks}
          icon={AlertTriangle}
          tone={member.workload.overdueTasks > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Blocked"
          value={member.workload.blockedTasks}
          icon={CircleSlash}
          hint={member.workload.blockedTasks > 0 ? 'Waiting on something' : undefined}
          tone={member.workload.blockedTasks > 0 ? 'warning' : 'default'}
        />
        <StatCard label="Open issues" value={member.workload.openIssues} icon={Bug} />
        <StatCard
          label="Hotfixes"
          value={member.workload.openHotfixes}
          icon={Flame}
          tone={member.workload.openHotfixes > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Finished"
          value={member.workload.completedTasks}
          hint={`Last ${member.completedWindowDays} days`}
          icon={CheckCircle2}
          tone={member.workload.completedTasks > 0 ? 'success' : 'default'}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Current work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(tasks?.data.length ?? 0) === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  Nothing assigned in the projects you can see.
                </p>
              ) : (
                tasks!.data.map((task) => <TaskRow key={task.id} task={task} showProject />)
              )}
            </CardContent>
          </Card>

          {/* A manager asking "what are they up to" wants the bugs sitting on
              this person as much as the tasks — those are what stall. */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Open issues</CardTitle>
              <CardDescription>Assigned to {member.name.split(' ')[0]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {member.issues.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">No open issues assigned.</p>
              ) : (
                member.issues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.project.key}/issues/${issue.key}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5 transition-colors hover:bg-accent/40"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{issue.title}</span>
                    <SeverityBadge severity={issue.severity} />
                    <IssueStatusBadge status={issue.status} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Finished recently</CardTitle>
              <CardDescription>
                Completed in the last {member.completedWindowDays} days
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {member.recentlyCompleted.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  Nothing completed in this window.
                </p>
              ) : (
                member.recentlyCompleted.map((task) => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.project.key}/tasks/${task.key}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5 transition-colors hover:bg-accent/40"
                  >
                    <CheckCircle2
                      className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                    <span className="font-mono text-xs text-muted-foreground">{task.key}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                    {task.completedAt ? (
                      <span className="text-xs whitespace-nowrap text-muted-foreground">
                        {formatTimeAgo(task.completedAt)}
                      </span>
                    ) : null}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {member.memberships.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">Not a member of any project.</p>
              ) : (
                member.memberships.map((membership) => (
                  <Link
                    key={membership.project.id}
                    href={`/projects/${membership.project.key}`}
                    className="block rounded-lg border p-2.5 transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: membership.project.color }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {membership.project.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {membership.role.name}
                      </span>
                    </div>
                    {membership.responsibilities ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {membership.responsibilities}
                      </p>
                    ) : null}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-base">Recent activity</CardTitle>
              {(activity?.meta.total ?? 0) > ACTIVITY_PREVIEW ? (
                <Button asChild variant="ghost" size="sm" className="-my-1 gap-1 text-xs">
                  <Link href={`/team/${userId}/activity`}>
                    Show all
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <ActivityFeed entries={activity?.data ?? []} />
              {(activity?.meta.total ?? 0) > ACTIVITY_PREVIEW ? (
                <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                  Showing {activity?.data.length ?? 0} of {activity?.meta.total ?? 0} changes
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
