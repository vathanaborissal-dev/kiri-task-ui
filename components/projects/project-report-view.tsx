'use client';

import { AlertTriangle, Bug, ListChecks, Target } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { BarList, type BarDatum } from '@/components/common/bar-list';
import { CardsSkeleton, CenteredSpinner } from '@/components/common/loading';
import { ErrorState } from '@/components/common/error-state';
import { StatCard } from '@/components/common/stat-card';
import { UserAvatar } from '@/components/common/user-avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PRIORITY_META,
  PRIORITY_ORDER,
  QA_STATUS_META,
  SEVERITY_META,
  SEVERITY_ORDER,
  TASK_TYPE_META,
} from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { useProject } from '@/lib/hooks/use-projects';
import { useProjectReport } from '@/lib/hooks/use-workspace';

const velocityConfig = {
  completed: { label: 'Tasks completed', color: 'var(--color-chart-1)' },
} satisfies ChartConfig;

export function ProjectReportView({ projectKey }: { projectKey: string }) {
  const { data: project } = useProject(projectKey);
  const { data, isLoading, isError, error, refetch } = useProjectReport(project?.id);

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !data) return <CardsSkeleton cards={4} />;
  if (!project) return <CenteredSpinner />;

  const statusBars: BarDatum[] = data.statusBreakdown.map((status) => ({
    key: status.id,
    label: status.name,
    value: status.count,
    color: status.color,
  }));

  const phaseBars: BarDatum[] = data.phaseBreakdown.map((phase) => ({
    key: phase.id,
    label: phase.name,
    value: phase.count,
    color: phase.color,
  }));

  // Ranked, not whatever order the database returned — people scan these
  // top-down looking for what is urgent.
  const priorityBars: BarDatum[] = [...data.priorityBreakdown]
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))
    .map((row) => ({
      key: row.priority,
      label: PRIORITY_META[row.priority].label,
      value: row.count,
      color: 'var(--color-chart-1)',
    }));

  const typeBars: BarDatum[] = data.typeBreakdown.map((row) => ({
    key: row.type,
    label: TASK_TYPE_META[row.type].label,
    value: row.count,
    color: 'var(--color-chart-5)',
  }));

  const qaBars: BarDatum[] = data.qaBreakdown.map((row) => ({
    key: row.qaStatus,
    label: QA_STATUS_META[row.qaStatus].label,
    value: row.count,
    color: 'var(--color-chart-2)',
  }));

  const severityTotals = new Map<string, number>();
  for (const row of data.issueBreakdown) {
    if (['CLOSED', 'RESOLVED', 'WONT_FIX'].includes(row.status)) continue;
    severityTotals.set(row.severity, (severityTotals.get(row.severity) ?? 0) + row.count);
  }
  const severityBars: BarDatum[] = [...severityTotals.entries()]
    .sort(([a], [b]) => SEVERITY_ORDER.indexOf(a as 'MAJOR') - SEVERITY_ORDER.indexOf(b as 'MAJOR'))
    .map(([severity, count]) => ({
      key: severity,
      label: SEVERITY_META[severity as 'MAJOR'].label,
      value: count,
      color: 'var(--color-chart-4)',
    }));

  const velocity = data.velocity.map((week) => ({
    week: formatDate(week.week),
    completed: week.completed,
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Completion"
          value={`${data.stats.progress}%`}
          hint={`${data.stats.doneTasks} of ${data.stats.totalTasks} tasks`}
          icon={Target}
        />
        <StatCard label="Open tasks" value={data.stats.openTasks} icon={ListChecks} />
        <StatCard
          label="Overdue"
          value={data.stats.overdueTasks}
          icon={AlertTriangle}
          tone={data.stats.overdueTasks > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Open issues"
          value={data.stats.openIssues}
          hint={`${data.stats.criticalIssues} critical`}
          icon={Bug}
          tone={data.stats.criticalIssues > 0 ? 'danger' : 'default'}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Throughput</CardTitle>
          <CardDescription>Tasks completed per week over the last eight weeks.</CardDescription>
        </CardHeader>
        <CardContent>
          {velocity.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              Nothing has been completed yet, so there is no throughput to show.
            </p>
          ) : (
            <>
              <ChartContainer config={velocityConfig} className="h-56 w-full">
                <BarChart data={velocity} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={40}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                  <Bar
                    dataKey="completed"
                    fill="var(--color-completed)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              </ChartContainer>
              {/* Table relief: the same numbers in text, for screen readers and print. */}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Show the numbers
                </summary>
                <Table className="mt-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week beginning</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {velocity.map((week) => (
                      <TableRow key={week.week}>
                        <TableCell>{week.week}</TableCell>
                        <TableCell className="text-right tabular-nums">{week.completed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </details>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Work by status</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={statusBars} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Work by phase</CardTitle>
            <CardDescription>How far each piece of work has travelled.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={phaseBars} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Open work by priority</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={priorityBars} emptyText="Nothing open." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Testing status</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={qaBars} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Work by type</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={typeBars} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Open issues by severity</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={severityBars} emptyText="No open issues." />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Team workload</CardTitle>
          <CardDescription>
            Open tasks per person on this project, and what is already late.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Responsibilities</TableHead>
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.workload.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <UserAvatar user={member} size="xs" showTooltip={false} />
                      {member.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.role.name}</TableCell>
                  <TableCell className="max-w-56 truncate text-muted-foreground">
                    {member.responsibilities ?? '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{member.openTasks}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {member.overdueTasks > 0 ? (
                      <span className="text-red-600 dark:text-red-400">{member.overdueTasks}</span>
                    ) : (
                      '0'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data.milestones.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Milestones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.milestones.map((milestone) => {
              const empty = milestone.taskCount === 0;
              const percent = empty
                ? 0
                : Math.round(((milestone.doneTaskCount ?? 0) / milestone.taskCount) * 100);
              return (
                <div key={milestone.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate">{milestone.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {empty
                        ? 'Nothing assigned yet'
                        : `${milestone.doneTaskCount ?? 0} of ${milestone.taskCount} done`}
                      {milestone.dueDate ? ` · ${formatDate(milestone.dueDate)}` : ''}
                    </span>
                  </div>
                  {empty ? null : <Progress value={percent} className="h-1.5" />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
