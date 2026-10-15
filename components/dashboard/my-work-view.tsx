'use client';

import {
  AlertTriangle,
  Bug,
  CalendarClock,
  CircleSlash,
  Flame,
  ListChecks,
  PlayCircle,
} from 'lucide-react';
import Link from 'next/link';
import { ActivityFeed } from '@/components/common/activity-feed';
import { DueDateBadge, HotfixStatusBadge, IssueStatusBadge, SeverityBadge } from '@/components/common/badges';
import { EmptyState } from '@/components/common/empty-state';
import { CardsSkeleton, ListSkeleton } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { TaskRow } from '@/components/tasks/task-row';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isOverdue } from '@/lib/format';
import { useMyWork } from '@/lib/hooks/use-workspace';
import { useAuth } from '@/providers/auth-provider';

export function MyWorkView() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useMyWork();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const tasks = data?.tasks ?? [];
  const overdueTasks = tasks.filter((task) => isOverdue(task.dueDate));
  const inProgress = tasks.filter((task) => task.status.category === 'IN_PROGRESS');
  const blocked = tasks.filter((task) => task.status.category === 'BLOCKED');

  return (
    <div className="space-y-5">
      <PageHeader
        title="My work"
        description={`Everything assigned to ${user?.name.split(' ')[0] ?? 'you'} across every project.`}
      />

      {isLoading || !data ? (
        <>
          <CardsSkeleton cards={4} />
          <ListSkeleton rows={5} />
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Assigned to me" value={data.counts.assigned} icon={ListChecks} />
            <StatCard
              label="In progress"
              value={data.counts.inProgress}
              icon={PlayCircle}
              tone="info"
            />
            <StatCard
              label="Due today"
              value={data.counts.dueToday}
              hint={`${data.counts.dueThisWeek} this week`}
              icon={CalendarClock}
              tone={data.counts.dueToday > 0 ? 'warning' : 'default'}
            />
            <StatCard
              label="Overdue"
              value={data.counts.overdue}
              icon={AlertTriangle}
              tone={data.counts.overdue > 0 ? 'danger' : 'default'}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            <div className="space-y-5 lg:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all">
                    <TabsList className="mb-3 flex-wrap">
                      <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
                      <TabsTrigger value="progress">In progress ({inProgress.length})</TabsTrigger>
                      <TabsTrigger value="overdue">Overdue ({overdueTasks.length})</TabsTrigger>
                      <TabsTrigger value="blocked">Blocked ({blocked.length})</TabsTrigger>
                    </TabsList>

                    {[
                      ['all', tasks],
                      ['progress', inProgress],
                      ['overdue', overdueTasks],
                      ['blocked', blocked],
                    ].map(([value, list]) => (
                      <TabsContent key={value as string} value={value as string} className="space-y-2">
                        {(list as typeof tasks).length === 0 ? (
                          <EmptyState
                            icon={value === 'blocked' ? CircleSlash : ListChecks}
                            title={
                              value === 'all'
                                ? 'Nothing assigned to you'
                                : value === 'overdue'
                                  ? 'Nothing is overdue'
                                  : value === 'blocked'
                                    ? 'Nothing is blocked'
                                    : 'Nothing in progress'
                            }
                            className="py-8"
                          />
                        ) : (
                          (list as typeof tasks).map((task) => (
                            <TaskRow key={task.id} task={task} showProject />
                          ))
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5 lg:col-span-2">
              {data.hotfixes.length > 0 ? (
                <Card className="border-red-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Flame className="size-4 text-red-500" aria-hidden />
                      Hotfixes on you
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.hotfixes.map((hotfix) => (
                      <Link
                        key={hotfix.id}
                        href={`/projects/${hotfix.project.key}/hotfixes/${hotfix.key}`}
                        className="block rounded-lg border p-2.5 text-sm hover:bg-accent/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {hotfix.key}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{hotfix.title}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <HotfixStatusBadge status={hotfix.status} />
                          <SeverityBadge severity={hotfix.severity} />
                          <DueDateBadge date={hotfix.dueDate} />
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bug className="size-4 text-muted-foreground" aria-hidden />
                    Issues assigned to me
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.issues.length === 0 ? (
                    <p className="py-3 text-sm text-muted-foreground">Nothing assigned.</p>
                  ) : (
                    data.issues.map((issue) => (
                      <Link
                        key={issue.id}
                        href={`/projects/${issue.project.key}/issues/${issue.key}`}
                        className="block rounded-lg border p-2.5 text-sm hover:bg-accent/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {issue.key}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{issue.title}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <IssueStatusBadge status={issue.status} />
                          <SeverityBadge severity={issue.severity} />
                          <DueDateBadge date={issue.dueDate} />
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Issues I reported</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.reportedIssues.length === 0 ? (
                    <p className="py-3 text-sm text-muted-foreground">
                      You have not reported any open issues.
                    </p>
                  ) : (
                    data.reportedIssues.map((issue) => (
                      <Link
                        key={issue.id}
                        href={`/projects/${issue.project.key}/issues/${issue.key}`}
                        className="flex items-center gap-2 rounded-lg border p-2.5 text-sm hover:bg-accent/40"
                      >
                        <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
                        <span className="min-w-0 flex-1 truncate">{issue.title}</span>
                        <IssueStatusBadge status={issue.status} />
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">What I did recently</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityFeed
                    entries={data.recentActivity}
                    emptyText="Nothing logged yet."
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
