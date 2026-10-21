'use client';

import {
  AlertTriangle,
  Bug,
  CalendarClock,
  CircleSlash,
  Flame,
  FolderKanban,
  ListChecks,
  Rocket,
  TrendingUp,
  UserX,
} from 'lucide-react';
import Link from 'next/link';
import { ActivityFeed } from '@/components/common/activity-feed';
import { CardsSkeleton, ListSkeleton } from '@/components/common/loading';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { WelcomeCard } from '@/components/help/welcome-card';
import { StatCard } from '@/components/common/stat-card';
import { TaskRow } from '@/components/tasks/task-row';
import { ProjectProgressCard } from '@/components/projects/project-progress-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RELEASE_STATUS_META } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { useOverview } from '@/lib/hooks/use-workspace';
import { useAuth } from '@/providers/auth-provider';

/** Enough to see what just happened without the column outgrowing its neighbour. */
const RECENT_ACTIVITY_SHOWN = 7;

export function DashboardView() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useOverview();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description="Everything across the projects you can access."
      />

      <WelcomeCard />

      {isLoading || !data ? (
        <>
          <CardsSkeleton cards={4} />
          <ListSkeleton rows={4} />
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-tour="dashboard-stats">
            <StatCard
              label="Active projects"
              value={data.totals.activeProjects}
              hint={`${data.totals.projects} in total`}
              icon={FolderKanban}
              tone="info"
              href="/projects"
            />
            <StatCard
              label="Open tasks"
              value={data.totals.openTasks}
              hint={`${data.totals.doneTasks} done`}
              icon={ListChecks}
            />
            <StatCard
              label="Overdue"
              value={data.totals.overdueTasks}
              hint="Past their deadline"
              icon={AlertTriangle}
              tone={data.totals.overdueTasks > 0 ? 'danger' : 'default'}
            />
            <StatCard
              label="Open issues"
              value={data.totals.openIssues}
              hint={`${data.totals.criticalIssues} critical or blocker`}
              icon={Bug}
              tone={data.totals.criticalIssues > 0 ? 'danger' : 'default'}
              href="/issues"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Due this week"
              value={data.totals.dueThisWeek}
              icon={CalendarClock}
              tone="warning"
              href="/calendar"
            />
            <StatCard label="Blocked" value={data.totals.blockedTasks} icon={CircleSlash} />
            <StatCard
              label="Unassigned"
              value={data.totals.unassignedTasks}
              hint="Nobody is on these"
              icon={UserX}
            />
            <StatCard
              label="Open hotfixes"
              value={data.totals.openHotfixes}
              icon={Flame}
              tone={data.totals.openHotfixes > 0 ? 'warning' : 'default'}
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
                Overall completion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Progress value={data.totals.progress} className="h-2.5 flex-1" />
                <span className="w-12 text-right text-sm font-semibold tabular-nums">
                  {data.totals.progress}%
                </span>
              </div>
              {data.phases.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.phases.map((phase) => (
                    <span
                      key={phase.name}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                      style={{ borderColor: `${phase.color}55`, backgroundColor: `${phase.color}12` }}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: phase.color }}
                        aria-hidden
                      />
                      {phase.name}
                      <span className="font-semibold tabular-nums">{phase.count}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-5">
            <div className="space-y-5 lg:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="upcoming">
                    <TabsList className="mb-3">
                      <TabsTrigger value="upcoming">
                        Upcoming
                        <Badge variant="secondary" className="ml-1.5 rounded px-1 text-[10px]">
                          {data.upcomingDeadlines.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="overdue">
                        Overdue
                        <Badge variant="secondary" className="ml-1.5 rounded px-1 text-[10px]">
                          {data.overdue.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="upcoming" className="space-y-2">
                      {data.upcomingDeadlines.length === 0 ? (
                        <EmptyState
                          icon={CalendarClock}
                          title="No deadlines in the next two weeks"
                          className="py-8"
                        />
                      ) : (
                        data.upcomingDeadlines.map((task) => (
                          <TaskRow key={task.id} task={task} showProject />
                        ))
                      )}
                    </TabsContent>
                    <TabsContent value="overdue" className="space-y-2">
                      {data.overdue.length === 0 ? (
                        <EmptyState
                          icon={ListChecks}
                          title="Nothing is overdue"
                          description="The team is on track."
                          className="py-8"
                        />
                      ) : (
                        data.overdue.map((task) => <TaskRow key={task.id} task={task} showProject />)
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Projects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.projects.length === 0 ? (
                    <EmptyState
                      icon={FolderKanban}
                      title="No projects yet"
                      description="Create a project to get started."
                      className="py-8"
                    />
                  ) : (
                    data.projects.map((project) => (
                      <ProjectProgressCard key={project.id} project={project} />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5 lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Rocket className="size-4 text-muted-foreground" aria-hidden />
                    Releases in flight
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.releases.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">
                      No releases are being prepared.
                    </p>
                  ) : (
                    data.releases.map((release) => (
                      <Link
                        key={release.id}
                        href={`/projects/${release.project.key}/releases/${release.id}`}
                        className="block rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="font-mono text-sm font-semibold">
                              {release.version}
                            </span>
                            {release.isHotfix ? (
                              <Flame className="size-3.5 text-red-500" aria-hidden />
                            ) : null}
                          </span>
                          <Badge
                            variant="outline"
                            className={`shrink-0 rounded-full text-[11px] ${RELEASE_STATUS_META[release.status].className}`}
                          >
                            {RELEASE_STATUS_META[release.status].label}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {release.project.key}
                          {release.name ? ` · ${release.name}` : ''}
                          {release.phase ? ` · in ${release.phase.name}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {release.counts.tasks} tasks · {release.counts.issues} issues
                          {release.plannedDate ? ` · planned ${formatDate(release.plannedDate)}` : ''}
                        </p>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* The API sends twenty entries. Rendering all of them made this
                  column run far past the one beside it, so the page ended in a
                  tall empty gap. Show the handful somebody actually scans and
                  say how many are behind them. */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityFeed entries={data.recentActivity.slice(0, RECENT_ACTIVITY_SHOWN)} />
                  {data.recentActivity.length > RECENT_ACTIVITY_SHOWN ? (
                    <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                      {data.recentActivity.length - RECENT_ACTIVITY_SHOWN} older{' '}
                      {data.recentActivity.length - RECENT_ACTIVITY_SHOWN === 1
                        ? 'change'
                        : 'changes'}{' '}
                      not shown
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
