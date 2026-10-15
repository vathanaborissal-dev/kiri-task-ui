'use client';

import {
  AlertTriangle,
  Bug,
  CircleSlash,
  Flame,
  FolderKanban,
  ShieldAlert,
  Target,
  TrendingUp,
  UserX,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { CardsSkeleton, ListSkeleton } from '@/components/common/loading';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PROJECT_STATUS_META, RISK_LEVEL_META, RISK_LEVEL_ORDER } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { usePortfolio } from '@/lib/hooks/use-workspace';
import type { PortfolioProject } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

const trendConfig = {
  completed: { label: 'Completed', color: 'var(--color-chart-1)' },
  created: { label: 'Created', color: 'var(--color-chart-3)' },
} satisfies ChartConfig;

const WEEK_OPTIONS = [
  { value: '8', label: 'Last 8 weeks' },
  { value: '12', label: 'Last 12 weeks' },
  { value: '26', label: 'Last 26 weeks' },
  { value: '52', label: 'Last 52 weeks' },
];

function RiskBadge({ level }: { level: PortfolioProject['risk']['level'] }) {
  const meta = RISK_LEVEL_META[level];
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', meta.className)}>
      <span className={cn('size-1.5 shrink-0 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}

export function PortfolioView() {
  const { can } = useAuth();
  const [weeks, setWeeks] = useState('12');
  const [includeArchived, setIncludeArchived] = useState(false);

  // The API gates this too; checking here only buys a readable message instead
  // of a bare 403 for somebody who followed a shared link.
  const allowed = can('project:view_all') && can('report:view');

  const { data, isLoading, isError, error, refetch } = usePortfolio(
    { weeks: Number(weeks), includeArchived },
    allowed,
  );

  if (!allowed) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Portfolio is not available to you"
        description="It needs workspace-wide project visibility and report access. An administrator can grant those on your role."
      />
    );
  }

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const trend = (data?.trend ?? []).map((week) => ({
    week: formatDate(week.week),
    completed: week.completed,
    created: week.created,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio"
        description="Every project across the workspace, ranked by how much trouble it is in."
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="include-archived"
                checked={includeArchived}
                onCheckedChange={setIncludeArchived}
              />
              <Label htmlFor="include-archived" className="text-xs whitespace-nowrap">
                Include archived
              </Label>
            </div>
            <Select value={weeks} onValueChange={setWeeks}>
              <SelectTrigger className="w-40" aria-label="Trend window">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEK_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {isLoading || !data ? (
        <>
          <CardsSkeleton cards={4} />
          <ListSkeleton rows={6} />
        </>
      ) : data.totals.projects === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={
            includeArchived
              ? 'This workspace has no projects at all.'
              : 'Every project is archived. Turn on "Include archived" to see them.'
          }
        />
      ) : (
        <>
          {/* Health first: the whole point of the page is which projects need
              attention, so the counts that answer that come before the totals. */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {RISK_LEVEL_ORDER.map((level) => {
              const meta = RISK_LEVEL_META[level];
              return (
                <Card key={level} className="h-full gap-0 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {meta.label}
                    </p>
                    <span className={cn('mt-1 size-2 shrink-0 rounded-full', meta.dot)} aria-hidden />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {data.riskCounts[level]}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.riskCounts[level] === 1 ? 'project' : 'projects'}
                  </p>
                </Card>
              );
            })}
          </div>

          {data.attention.length > 0 ? (
            <Card className="border-orange-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="size-4 text-orange-500" aria-hidden />
                  Needs attention
                </CardTitle>
                <CardDescription>
                  Why each one is flagged, so the ranking is arguable rather than magic.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.attention.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: project.color }}
                          aria-hidden
                        />
                        <Link
                          href={`/projects/${project.key}`}
                          className="truncate text-sm font-medium hover:underline"
                        >
                          {project.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">{project.key}</span>
                      </div>
                      <ul className="space-y-0.5">
                        {project.risk.reasons.map((reason) => (
                          <li key={reason} className="text-xs text-muted-foreground">
                            — {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <RiskBadge level={project.risk.level} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Completion"
              value={`${data.totals.progress}%`}
              hint={`${data.totals.doneTasks} of ${data.totals.tasks} tasks`}
              icon={Target}
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
                Delivery trend
              </CardTitle>
              <CardDescription>
                Tasks completed against tasks created each week. Created rising above completed for
                several weeks means the backlog is growing faster than the team can clear it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendConfig} className="h-64 w-full">
                <LineChart data={trend} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="completed"
                    type="monotone"
                    stroke="var(--color-completed)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="created"
                    type="monotone"
                    stroke="var(--color-created)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">All projects</CardTitle>
              <CardDescription>
                {data.totals.projects} project{data.totals.projects === 1 ? '' : 's'}, worst health
                first.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead className="w-40">Progress</TableHead>
                      <TableHead className="text-right">Open</TableHead>
                      <TableHead className="text-right">Overdue</TableHead>
                      <TableHead className="text-right">Blocked</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: project.color }}
                              aria-hidden
                            />
                            <Link
                              href={`/projects/${project.key}`}
                              className="font-medium hover:underline"
                            >
                              {project.name}
                            </Link>
                            <Badge
                              variant="outline"
                              className={cn('text-xs', PROJECT_STATUS_META[project.status].className)}
                            >
                              {PROJECT_STATUS_META[project.status].label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RiskBadge level={project.risk.level} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={project.stats.progress} className="h-1.5" />
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {project.stats.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {project.stats.openTasks}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right tabular-nums',
                            project.stats.overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : '',
                          )}
                        >
                          {project.stats.overdueTasks}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {project.stats.blockedTasks}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {project.targetDate ? (
                            <span
                              className={
                                project.risk.slipDays
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-muted-foreground'
                              }
                            >
                              {formatDate(project.targetDate)}
                              {project.risk.slipDays ? ` (+${project.risk.slipDays}d)` : ''}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <UserAvatar user={project.owner} size="sm" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Where the work sits</CardTitle>
              <CardDescription>
                Open assigned tasks per person across every project. One person carrying the top of
                this list is a staffing problem, not a performance one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.capacity.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  Nothing is assigned to anybody right now.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {data.capacity.map((entry) => (
                    <div key={entry.user.id} className="flex items-center gap-3">
                      <UserAvatar user={entry.user} size="sm" />
                      <Link
                        href={`/team/${entry.user.id}`}
                        className="min-w-0 flex-1 truncate text-sm hover:underline"
                      >
                        {entry.user.name}
                      </Link>
                      <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
                        <span className="text-muted-foreground">{entry.openTasks} open</span>
                        {entry.overdueTasks > 0 ? (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertTriangle className="size-3" aria-hidden />
                            {entry.overdueTasks}
                          </span>
                        ) : null}
                        {entry.blockedTasks > 0 ? (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <CircleSlash className="size-3" aria-hidden />
                            {entry.blockedTasks}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {data.totals.unassignedTasks > 0 ? (
                <p className="mt-4 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
                  <UserX className="size-3.5" aria-hidden />
                  {data.totals.unassignedTasks} open task
                  {data.totals.unassignedTasks === 1 ? ' has' : 's have'} nobody on them.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
