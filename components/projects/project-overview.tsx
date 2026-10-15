'use client';

import {
  AlertTriangle,
  Bug,
  CalendarClock,
  CircleSlash,
  Flag,
  ListChecks,
  Plus,
  Rocket,
  UserX,
} from 'lucide-react';
import Link from 'next/link';
import { ActivityFeed } from '@/components/common/activity-feed';
import { EmptyState } from '@/components/common/empty-state';
import { CenteredSpinner } from '@/components/common/loading';
import { StatCard } from '@/components/common/stat-card';
import { RichText } from '@/components/common/rich-text';
import { UserAvatar } from '@/components/common/user-avatar';
import { IssueStatusBadge, SeverityBadge } from '@/components/common/badges';
import { TaskRow } from '@/components/tasks/task-row';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/format';
import { useActivity } from '@/lib/hooks/use-collab';
import { useIssues } from '@/lib/hooks/use-issues';
import { useProject } from '@/lib/hooks/use-projects';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useReleases } from '@/lib/hooks/use-releases';
import { RELEASE_STATUS_META } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

export function ProjectOverview({ projectKey }: { projectKey: string }) {
  const { data: project } = useProject(projectKey);
  const { data: upcoming } = useTasks(
    {
      projectId: project?.id,
      dueWithinDays: 14,
      includeDone: false,
      sort: 'dueDate',
      pageSize: 8,
    },
    Boolean(project),
  );
  const { data: overdue } = useTasks(
    { projectId: project?.id, overdue: true, sort: 'dueDate', pageSize: 5 },
    Boolean(project),
  );
  const { data: issues } = useIssues(
    { projectId: project?.id, openOnly: true, sort: 'severity', pageSize: 6 },
    Boolean(project),
  );
  const { data: releases } = useReleases(
    { projectId: project?.id, status: ['PLANNED', 'IN_DEVELOPMENT', 'READY'], pageSize: 5 },
    Boolean(project),
  );
  const { data: activity } = useActivity({ projectId: projectKey, pageSize: 12 }, Boolean(project));

  if (!project) return <CenteredSpinner />;

  const permissions = new Set(project.myPermissions);
  const can = (permission: string) => permissions.has('*') || permissions.has(permission);
  const base = `/projects/${project.key}`;

  return (
    <div className="space-y-5">
      {project.description ? (
        <Card>
          <CardContent className="pt-5">
            <RichText>{project.description}</RichText>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Progress"
          value={`${project.stats.progress}%`}
          hint={`${project.stats.doneTasks} of ${project.stats.totalTasks} tasks done`}
          icon={ListChecks}
        />
        <StatCard
          label="Open tasks"
          value={project.stats.openTasks}
          hint={`${project.stats.blockedTasks} blocked`}
          icon={CircleSlash}
          href={`${base}/tasks`}
        />
        <StatCard
          label="Overdue"
          value={project.stats.overdueTasks}
          icon={AlertTriangle}
          tone={project.stats.overdueTasks > 0 ? 'danger' : 'default'}
          href={`${base}/tasks`}
        />
        <StatCard
          label="Open issues"
          value={project.stats.openIssues}
          hint={`${project.stats.criticalIssues} critical`}
          icon={Bug}
          tone={project.stats.criticalIssues > 0 ? 'danger' : 'default'}
          href={`${base}/issues`}
        />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-4">
            <Progress value={project.stats.progress} className="h-2.5 flex-1" />
            <span className="w-12 text-right text-sm font-semibold tabular-nums">
              {project.stats.progress}%
            </span>
          </div>
          <div className="grid gap-x-6 gap-y-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <span>
              Owner:{' '}
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <UserAvatar user={project.owner} size="xs" showTooltip={false} />
                {project.owner.name}
              </span>
            </span>
            <span>Started: {formatDate(project.startDate)}</span>
            <span>Target: {formatDate(project.targetDate)}</span>
            <span>
              {project.members.length} members · {project.phases.length} phases
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
                Coming up
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href={`${base}/tasks`}>See all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {(overdue?.data.length ?? 0) > 0 ? (
                <>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">Overdue</p>
                  {overdue!.data.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </>
              ) : null}
              {upcoming?.data.length ? (
                upcoming.data.map((task) => <TaskRow key={task.id} task={task} />)
              ) : overdue?.data.length ? null : (
                <EmptyState
                  icon={CalendarClock}
                  title="No deadlines in the next two weeks"
                  className="py-8"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bug className="size-4 text-muted-foreground" aria-hidden />
                Open issues
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href={`${base}/issues`}>See all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {issues?.data.length ? (
                issues.data.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`${base}/issues/${issue.key}`}
                    className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {issue.key}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{issue.title}</span>
                    <SeverityBadge severity={issue.severity} />
                    <IssueStatusBadge status={issue.status} />
                  </Link>
                ))
              ) : (
                <EmptyState icon={Bug} title="No open issues" className="py-8" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flag className="size-4 text-muted-foreground" aria-hidden />
                Milestones
              </CardTitle>
              {can('project:manage_settings') ? (
                <Button asChild variant="ghost" size="sm" className="gap-1.5">
                  <Link href={`${base}/settings`}>
                    <Plus className="size-3.5" aria-hidden />
                    Add
                  </Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-2">
              {project.milestones.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">No milestones yet.</p>
              ) : (
                project.milestones.map((milestone) => (
                  <div key={milestone.id} className="rounded-lg border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{milestone.name}</span>
                      {milestone.completedAt ? (
                        <Badge variant="outline" className="rounded-full text-[10px]">
                          Done
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {milestone.taskCount} tasks
                      {milestone.dueDate ? ` · due ${formatDate(milestone.dueDate)}` : ''}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Rocket className="size-4 text-muted-foreground" aria-hidden />
                Upcoming releases
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href={`${base}/releases`}>See all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {releases?.data.length ? (
                releases.data.map((release) => (
                  <Link
                    key={release.id}
                    href={`${base}/releases/${release.id}`}
                    className="flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    <span className="font-mono font-semibold">{release.version}</span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {release.name ?? ''}
                    </span>
                    <Badge
                      variant="outline"
                      className={`shrink-0 rounded-full text-[10px] ${RELEASE_STATUS_META[release.status].className}`}
                    >
                      {RELEASE_STATUS_META[release.status].label}
                    </Badge>
                  </Link>
                ))
              ) : (
                <p className="py-3 text-sm text-muted-foreground">Nothing in flight.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.members.slice(0, 8).map((member) => (
                <div key={member.id} className="flex items-center gap-2.5">
                  <UserAvatar user={member.user} size="sm" showTooltip={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{member.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.role.name}
                      {member.responsibilities ? ` · ${member.responsibilities}` : ''}
                    </p>
                  </div>
                </div>
              ))}
              {project.members.length > 8 ? (
                <p className="text-xs text-muted-foreground">
                  and {project.members.length - 8} more
                </p>
              ) : null}
              {project.stats.unassignedTasks > 0 ? (
                <p className="flex items-center gap-1.5 pt-1 text-xs text-amber-600 dark:text-amber-400">
                  <UserX className="size-3.5" aria-hidden />
                  {project.stats.unassignedTasks} tasks have nobody assigned
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed entries={activity?.data ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
